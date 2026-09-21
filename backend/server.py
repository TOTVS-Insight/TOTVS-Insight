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
import re
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
PROCESSED_DIRS = (
    ROOT.parent / 'public/data/transcricoes-processadas',
    DIST / 'data/transcricoes-processadas',
)
MAX_BODY = 4_000_000
MAX_TEXT = 500_000
LOCK = threading.Lock()
BUNDLE = None
MODEL_VERSION = ''
MODEL_METRICS = None
QUEUE_EVENT = threading.Event()
QUEUE_STOP = threading.Event()
QUEUE_THREAD = None

PRIORITY_VALUES = {'BAIXA': 10, 'MEDIA': 50, 'ALTA': 100}

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

        db.execute("""
            CREATE TABLE IF NOT EXISTS queue_jobs (
                meeting TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                priority INTEGER NOT NULL DEFAULT 50,
                attempts INTEGER NOT NULL DEFAULT 0,
                queued TEXT NOT NULL,
                started TEXT,
                finished TEXT,
                error TEXT,
                updated TEXT NOT NULL
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS queue_control (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                paused INTEGER NOT NULL DEFAULT 1,
                updated TEXT NOT NULL
            )
        """)
        now = datetime.now(timezone.utc).isoformat()
        db.execute(
            'INSERT OR IGNORE INTO queue_control (id, paused, updated) VALUES (1, 1, ?)',
            (now,),
        )
        db.execute(
            "UPDATE queue_jobs SET status='AGUARDANDO', started=NULL, updated=? WHERE status='PROCESSANDO'",
            (now,),
        )

    sync_queue()
    start_queue_worker()


def load_filtered_transcript(meeting):
    """Carrega SOMENTE a versão filtrada persistida pelo estágio 2."""
    if not isinstance(meeting, str) or not re.fullmatch(r'[A-Za-z0-9._-]{1,200}', meeting):
        return None

    for base in PROCESSED_DIRS:
        target = base / f'{meeting}.json'
        if not target.is_file():
            continue

        try:
            payload = json.loads(target.read_text(encoding='utf-8'))
        except (OSError, json.JSONDecodeError):
            continue

        text = payload.get('texto_filtrado')
        if isinstance(text, str) and text.strip():
            return text

    return None


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def processed_ids():
    """IDs que concluíram a filtragem e possuem texto_filtrado persistido."""
    ids = set()
    for base in PROCESSED_DIRS:
        if not base.is_dir():
            continue
        for target in base.glob('*.json'):
            if target.name == 'index.json':
                continue
            ids.add(target.stem)
    return ids


def analysed_ids():
    with sqlite3.connect(DB_PATH) as db:
        return {row[0] for row in db.execute('SELECT DISTINCT meeting FROM analyses').fetchall()}


def sync_queue():
    filtered = processed_ids()
    analysed = analysed_ids()
    now = now_iso()
    added = 0

    with sqlite3.connect(DB_PATH) as db:
        existing = {row[0]: row[1] for row in db.execute('SELECT meeting, status FROM queue_jobs')}
        for meeting in sorted(filtered):
            desired = 'CONCLUIDO' if meeting in analysed else 'AGUARDANDO'
            if meeting not in existing:
                db.execute(
                    """INSERT INTO queue_jobs
                       (meeting, status, priority, attempts, queued, started, finished, error, updated)
                       VALUES (?, ?, 50, 0, ?, NULL, ?, NULL, ?)""",
                    (meeting, desired, now, now if desired == 'CONCLUIDO' else None, now),
                )
                added += 1
            elif meeting in analysed and existing[meeting] != 'CONCLUIDO':
                db.execute(
                    """UPDATE queue_jobs
                       SET status='CONCLUIDO', finished=?, error=NULL, updated=?
                       WHERE meeting=?""",
                    (now, now, meeting),
                )

    QUEUE_EVENT.set()
    return {'adicionados': added, 'filtradas': len(filtered), 'analisadas': len(analysed)}


def queue_paused():
    with sqlite3.connect(DB_PATH) as db:
        row = db.execute('SELECT paused FROM queue_control WHERE id=1').fetchone()
    return not row or bool(row[0])


def set_queue_paused(paused):
    with sqlite3.connect(DB_PATH) as db:
        db.execute('UPDATE queue_control SET paused=?, updated=? WHERE id=1',
                   (1 if paused else 0, now_iso()))
    QUEUE_EVENT.set()


def claim_next_job():
    with sqlite3.connect(DB_PATH, timeout=30) as db:
        db.execute('BEGIN IMMEDIATE')
        row = db.execute(
            """SELECT meeting FROM queue_jobs
               WHERE status='AGUARDANDO'
               ORDER BY priority DESC, queued ASC
               LIMIT 1"""
        ).fetchone()
        if not row:
            db.commit()
            return None
        meeting = row[0]
        now = now_iso()
        db.execute(
            """UPDATE queue_jobs
               SET status='PROCESSANDO', attempts=attempts+1,
                   started=?, finished=NULL, error=NULL, updated=?
               WHERE meeting=? AND status='AGUARDANDO'""",
            (now, now, meeting),
        )
        db.commit()
        return meeting


def finish_job(meeting, status, error=None):
    now = now_iso()
    with sqlite3.connect(DB_PATH) as db:
        db.execute(
            """UPDATE queue_jobs
               SET status=?, finished=?, error=?, updated=?
               WHERE meeting=?""",
            (status, now, error, now, meeting),
        )


def queue_worker():
    while not QUEUE_STOP.is_set():
        if queue_paused():
            QUEUE_EVENT.wait(1.0)
            QUEUE_EVENT.clear()
            continue

        meeting = claim_next_job()
        if meeting is None:
            QUEUE_EVENT.wait(1.0)
            QUEUE_EVENT.clear()
            continue

        try:
            if meeting in analysed_ids():
                finish_job(meeting, 'CONCLUIDO')
                continue

            text = load_filtered_transcript(meeting)
            if text is None:
                raise RuntimeError('texto_filtrado não encontrado para esta reunião.')
            if len(text) > MAX_TEXT:
                raise RuntimeError('texto_filtrado excede o limite de 500 mil caracteres.')

            save_analysis(text, meeting)
            finish_job(meeting, 'CONCLUIDO')
        except Exception as exc:
            finish_job(meeting, 'FALHA', str(exc)[:800])


def start_queue_worker():
    global QUEUE_THREAD
    if QUEUE_THREAD and QUEUE_THREAD.is_alive():
        return
    QUEUE_THREAD = threading.Thread(
        target=queue_worker,
        name='totvs-queue-worker',
        daemon=True,
    )
    QUEUE_THREAD.start()


def retry_job(meeting):
    with sqlite3.connect(DB_PATH) as db:
        row = db.execute('SELECT status FROM queue_jobs WHERE meeting=?', (meeting,)).fetchone()
        if not row:
            return False
        db.execute(
            """UPDATE queue_jobs
               SET status='AGUARDANDO', started=NULL, finished=NULL, error=NULL, updated=?
               WHERE meeting=?""",
            (now_iso(), meeting),
        )
    QUEUE_EVENT.set()
    return True


def set_job_priority(meeting, level):
    value = PRIORITY_VALUES.get(str(level).upper())
    if value is None:
        return False
    with sqlite3.connect(DB_PATH) as db:
        row = db.execute('SELECT 1 FROM queue_jobs WHERE meeting=?', (meeting,)).fetchone()
        if not row:
            return False
        db.execute('UPDATE queue_jobs SET priority=?, updated=? WHERE meeting=?',
                   (value, now_iso(), meeting))
    QUEUE_EVENT.set()
    return True


def queue_snapshot():
    with sqlite3.connect(DB_PATH) as db:
        rows = db.execute(
            """SELECT meeting, status, priority, attempts, queued, started, finished, error, updated
               FROM queue_jobs
               ORDER BY
                 CASE status
                   WHEN 'PROCESSANDO' THEN 0
                   WHEN 'AGUARDANDO' THEN 1
                   WHEN 'FALHA' THEN 2
                   ELSE 3
                 END,
                 priority DESC,
                 queued ASC"""
        ).fetchall()
        paused_row = db.execute('SELECT paused FROM queue_control WHERE id=1').fetchone()

    jobs = [
        {
            'id_reuniao': row[0],
            'status': row[1],
            'prioridade': 'ALTA' if row[2] >= 100 else 'BAIXA' if row[2] <= 10 else 'MEDIA',
            'tentativas': row[3],
            'enfileirado_em': row[4],
            'iniciado_em': row[5],
            'finalizado_em': row[6],
            'erro': row[7],
            'atualizado_em': row[8],
        }
        for row in rows
    ]

    counts = Counter(job['status'] for job in jobs)
    durations = []
    for job in jobs:
        if job['status'] != 'CONCLUIDO' or not job['iniciado_em'] or not job['finalizado_em']:
            continue
        try:
            started = datetime.fromisoformat(job['iniciado_em'])
            finished = datetime.fromisoformat(job['finalizado_em'])
            durations.append(max(0.0, (finished - started).total_seconds()))
        except ValueError:
            pass

    done = counts['CONCLUIDO'] + counts['FALHA']
    success_rate = counts['CONCLUIDO'] / done * 100 if done else 0.0

    return {
        'pausada': bool(paused_row[0]) if paused_row else True,
        'worker_ativo': bool(QUEUE_THREAD and QUEUE_THREAD.is_alive()),
        'resumo': {
            'total': len(jobs),
            'aguardando': counts['AGUARDANDO'],
            'processando': counts['PROCESSANDO'],
            'concluidos': counts['CONCLUIDO'],
            'falhas': counts['FALHA'],
            'taxa_sucesso': round(success_rate, 2),
            'tempo_medio_segundos': round(sum(durations) / len(durations), 2) if durations else 0,
        },
        'jobs': jobs,
    }

def save_analysis(text, meeting):
    with LOCK:
        result = analisar_transcricao(text, BUNDLE, meeting)
    result.update(id=str(uuid.uuid4()), criado_em=datetime.now(timezone.utc).isoformat(),
                  versao_modelo=MODEL_VERSION)
    with sqlite3.connect(DB_PATH) as db:
        db.execute('INSERT INTO analyses (id, created, meeting, result, summary) VALUES (?,?,?,?,?)',
                   (result['id'], result['criado_em'], meeting, json.dumps(result, ensure_ascii=False),
                    json.dumps(resumir(result), ensure_ascii=False)))
        # Se a análise foi disparada manualmente, mantém a fila consistente.
        db.execute(
            "UPDATE queue_jobs SET status='CONCLUIDO', finished=?, error=NULL, updated=? WHERE meeting=?",
            (result['criado_em'], result['criado_em'], meeting),
        )
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
        if route == '/api/fila':
            return self.json_response(200, queue_snapshot())
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

    def read_json_body(self, required=True):
        content_type = self.headers.get('Content-Type', '').split(';')[0]
        length = int(self.headers.get('Content-Length', '0') or '0')
        if length == 0 and not required:
            return {}
        if content_type != 'application/json':
            raise ValueError('content-type')
        if not 0 < length <= MAX_BODY:
            raise ValueError('length')
        self.connection.settimeout(20)
        payload = json.loads(self.rfile.read(length))
        if not isinstance(payload, dict):
            raise ValueError('payload')
        return payload

    def do_POST(self):
        if not self.allowed():
            return self.json_response(403, {'erro': 'Origem não permitida.'})

        route = urlsplit(self.path).path

        if route == '/api/fila/sincronizar':
            return self.json_response(200, {**sync_queue(), 'fila': queue_snapshot()})

        if route == '/api/fila/iniciar':
            sync_queue()
            set_queue_paused(False)
            return self.json_response(200, queue_snapshot())

        if route == '/api/fila/pausar':
            set_queue_paused(True)
            return self.json_response(200, queue_snapshot())

        retry_match = re.fullmatch(r'/api/fila/jobs/([^/]+)/retry', route)
        if retry_match:
            meeting = retry_match.group(1)
            if not retry_job(meeting):
                return self.json_response(404, {'erro': 'Job não encontrado.'})
            return self.json_response(200, queue_snapshot())

        priority_match = re.fullmatch(r'/api/fila/jobs/([^/]+)/prioridade', route)
        if priority_match:
            try:
                payload = self.read_json_body(required=True)
            except (ValueError, UnicodeDecodeError, TimeoutError, json.JSONDecodeError):
                return self.json_response(400, {'erro': 'Não foi possível ler a solicitação.'})
            if not set_job_priority(priority_match.group(1), payload.get('prioridade')):
                return self.json_response(400, {'erro': 'Job ou prioridade inválidos.'})
            return self.json_response(200, queue_snapshot())

        if route != '/api/analises':
            return self.json_response(404, {'erro': 'Recurso não encontrado.'})

        try:
            payload = self.read_json_body(required=True)
            meeting = payload.get('id_reuniao')
            if not isinstance(meeting, str) or not 0 < len(meeting.strip()) <= 200:
                return self.json_response(400, {'erro': 'Identificador de reunião inválido.'})

            meeting = meeting.strip()
            text = load_filtered_transcript(meeting)
            if text is None:
                return self.json_response(
                    400,
                    {'erro': 'A reunião ainda não possui texto_filtrado persistido. Execute o estágio de filtragem antes da análise.'},
                )
            if len(text) > MAX_TEXT:
                return self.json_response(
                    413,
                    {'erro': 'O texto filtrado excede o limite de 500 mil caracteres por análise.'},
                )
        except (ValueError, UnicodeDecodeError, TimeoutError, json.JSONDecodeError):
            return self.json_response(400, {'erro': 'Não foi possível ler a solicitação.'})

        try:
            return self.json_response(201, save_analysis(text, meeting))
        except Exception:
            return self.json_response(500, {'erro': 'A análise não foi concluída. Confira o serviço e tente novamente.'})

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    initialize()
    print(f'TOTVS Insight disponível em http://127.0.0.1:{args.port}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
