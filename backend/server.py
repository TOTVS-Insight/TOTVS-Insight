"""Servidor local da demonstração: site, inferência e histórico persistente."""
from pathlib import Path
from collections import Counter
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
import argparse
import hashlib
import json
import mimetypes
import os
import sqlite3
import threading
import uuid
from datetime import datetime, timezone

import joblib
from insight import analisar_transcricao

ROOT = Path(__file__).resolve().parent
DIST = ROOT.parent / 'dist'
MODEL_PATH = ROOT / 'model/modelo_piloto.joblib'
# Métricas de validação do modelo em uso; a UI mostra quanto os alertas acertam.
METRICS_PATH = ROOT / 'model/metricas.json'
DB_PATH = Path(os.environ.get('INSIGHT_DB', str(ROOT / 'storage/analises.sqlite3')))
MAX_BODY = 4_000_000
MAX_TEXT = 500_000
LOCK = threading.Lock()
BUNDLE = None
MODEL_VERSION = ''
MODEL_METRICS = None

def resumir(result):
    """Análise sem o texto dos trechos, mais o que o painel de churn usa."""
    trechos = result.get('trechos', [])
    scores = [t['score_modelo'] for t in trechos if t.get('score_modelo') is not None]
    termos = Counter(termo for t in trechos if t.get('rotulo_modelo') == 'risco'
                     for termo in t.get('termos_presentes', []))
    resumo = {k: v for k, v in result.items() if k != 'trechos'}
    resumo.update(score_max=max(scores) if scores else None,
                  termos_risco=[termo for termo, _ in termos.most_common(10)])
    return resumo

def initialize():
    global BUNDLE, MODEL_VERSION, MODEL_METRICS
    # Arquivo confiável distribuído com este projeto; não aceitar modelos enviados por upload.
    BUNDLE = joblib.load(MODEL_PATH)
    MODEL_VERSION = hashlib.sha256(MODEL_PATH.read_bytes()).hexdigest()[:16]
    if METRICS_PATH.is_file():
        metricas = json.loads(METRICS_PATH.read_text(encoding='utf-8'))
        MODEL_METRICS = {k: metricas[k] for k in ('precision', 'recall', 'n_treino')}
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as db:
        db.execute('CREATE TABLE IF NOT EXISTS analyses (id TEXT PRIMARY KEY, created TEXT NOT NULL, meeting TEXT NOT NULL, result TEXT NOT NULL)')
        # O histórico lê só o resumo: reler cada análise inteira fica lento com a base toda analisada.
        if 'summary' not in {row[1] for row in db.execute('PRAGMA table_info(analyses)')}:
            db.execute('ALTER TABLE analyses ADD COLUMN summary TEXT')
        for row_id, result in db.execute('SELECT id, result FROM analyses WHERE summary IS NULL').fetchall():
            db.execute('UPDATE analyses SET summary=? WHERE id=?',
                       (json.dumps(resumir(json.loads(result)), ensure_ascii=False), row_id))

def save_analysis(text, meeting):
    with LOCK:
        result = analisar_transcricao(text, BUNDLE, meeting)
    result.update(id=str(uuid.uuid4()), criado_em=datetime.now(timezone.utc).isoformat(),
                  versao_modelo=MODEL_VERSION)
    with sqlite3.connect(DB_PATH) as db:
        db.execute('INSERT INTO analyses (id, created, meeting, result, summary) VALUES (?,?,?,?,?)',
                   (result['id'], result['criado_em'], meeting, json.dumps(result, ensure_ascii=False),
                    json.dumps(resumir(result), ensure_ascii=False)))
    return result

def history():
    with sqlite3.connect(DB_PATH) as db:
        rows = db.execute('SELECT summary FROM analyses ORDER BY created DESC').fetchall()
    return [json.loads(row[0]) for row in rows]

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass  # Não registrar conteúdo ou identificadores das reuniões.

    def json_response(self, status, data):
        body = json.dumps(data, ensure_ascii=False, allow_nan=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(body)

    def allowed(self):
        # O protótipo só escuta loopback. Bloqueia acesso via origem/Host externos.
        host = self.headers.get('Host', '').split(':')[0]
        origin = self.headers.get('Origin')
        return host in ('localhost', '127.0.0.1') and (
            not origin or urlsplit(origin).hostname in ('localhost', '127.0.0.1'))

    def do_GET(self):
        if not self.allowed():
            return self.json_response(403, {'erro': 'Acesso permitido apenas na demonstração local.'})
        route = urlsplit(self.path).path
        if route == '/api/health':
            return self.json_response(200, {'status': 'ok', 'versao_modelo': MODEL_VERSION,
                                            'qualidade': MODEL_METRICS})
        if route == '/api/analises':
            return self.json_response(200, history())
        if route.startswith('/api/analises/'):
            with sqlite3.connect(DB_PATH) as db:
                row = db.execute('SELECT result FROM analyses WHERE id=?', (route.rsplit('/', 1)[-1],)).fetchone()
            return self.json_response(200 if row else 404, json.loads(row[0]) if row else {'erro': 'Análise não encontrada.'})
        if route.startswith('/api/'):
            return self.json_response(404, {'erro': 'Recurso não encontrado.'})
        target = (DIST / route.lstrip('/')).resolve()
        if not target.is_relative_to(DIST.resolve()):
            return self.json_response(404, {'erro': 'Arquivo não encontrado.'})
        if not target.is_file():
            if Path(route).suffix:
                return self.json_response(404, {'erro': 'Arquivo não encontrado.'})
            target = DIST / 'index.html'
        if not target.is_file():
            return self.json_response(503, {'erro': 'Compile o site com npm run build antes de iniciar.'})
        body = target.read_bytes()
        self.send_response(200)
        content_type = 'application/javascript' if target.suffix == '.js' else mimetypes.guess_type(target.name)[0] or 'application/octet-stream'
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if not self.allowed():
            return self.json_response(403, {'erro': 'Origem não permitida.'})
        if urlsplit(self.path).path != '/api/analises':
            return self.json_response(404, {'erro': 'Recurso não encontrado.'})
        if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
            return self.json_response(415, {'erro': 'Envie texto em formato JSON.'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= MAX_BODY:
                return self.json_response(413, {'erro': 'Arquivo muito grande.'})
            self.connection.settimeout(20)
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise ValueError()
            text, meeting = payload.get('texto'), payload.get('id_reuniao', 'nova')
            if not isinstance(text, str) or not text.strip():
                return self.json_response(400, {'erro': 'Cole ou envie uma transcrição com texto.'})
            if len(text) > MAX_TEXT:
                return self.json_response(413, {'erro': 'O limite desta demonstração é de 500 mil caracteres por análise.'})
            if not isinstance(meeting, str) or not 0 < len(meeting.strip()) <= 200:
                return self.json_response(400, {'erro': 'Identificador de reunião inválido.'})
        except (ValueError, UnicodeDecodeError, TimeoutError):
            return self.json_response(400, {'erro': 'Não foi possível ler a solicitação.'})
        try:
            return self.json_response(201, save_analysis(text, meeting.strip()))
        except Exception:
            return self.json_response(500, {'erro': 'A análise não foi concluída. Confira o serviço e tente novamente.'})

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    initialize()
    print(f'TOTVS Insight disponível em http://127.0.0.1:{args.port}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
