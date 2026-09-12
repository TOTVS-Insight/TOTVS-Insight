"""Exporta as análises salvas para arquivos estáticos em `public/data/analises/`.

    python backend/exportar_analises.py

Serve para publicar o site sem o servidor de análise: o app lê estes arquivos
quando a API não responde. Gera dois formatos:

  • `index.json`      — um resumo por análise, igual ao que `GET /api/analises`
                        devolve (é o que alimenta dashboard, churn e fila).
  • `<id>.json`       — a análise completa de uma reunião, sem repetir o texto de
                        cada trecho: o app recorta da transcrição pelos campos
                        `inicio` e `fim`. Sem isso o export dobraria de tamanho.

Exporta todas as análises salvas, para que qualquer item do histórico abra.
"""
from pathlib import Path
import json
import sqlite3
import shutil

RAIZ = Path(__file__).resolve().parent.parent
DB_PATH = Path(__file__).resolve().parent / 'storage/analises.sqlite3'
SAIDA = RAIZ / 'public/data/analises'


def exportar():
    if not DB_PATH.is_file():
        raise SystemExit(f'Banco não encontrado: {DB_PATH}. Rode o servidor e analise as reuniões antes.')

    with sqlite3.connect(DB_PATH) as db:
        linhas = db.execute('SELECT summary, result FROM analyses ORDER BY created DESC').fetchall()

    shutil.rmtree(SAIDA, ignore_errors=True)
    SAIDA.mkdir(parents=True, exist_ok=True)

    resumos = []
    vistas = set()
    for summary, result in linhas:
        resumo = json.loads(summary)
        resumos.append(resumo)
        vistas.add(resumo['id_reuniao'])
        analise = json.loads(result)
        for trecho in analise.get('trechos', []):
            trecho.pop('texto', None)
        (SAIDA / f"{analise['id']}.json").write_text(
            json.dumps(analise, ensure_ascii=False), encoding='utf-8')

    (SAIDA / 'index.json').write_text(json.dumps(resumos, ensure_ascii=False), encoding='utf-8')

    # O painel de churn mostra o acerto do modelo; sem isso o aviso some na publicação.
    metricas = Path(__file__).resolve().parent / 'model/metricas.json'
    if metricas.is_file():
        dados = json.loads(metricas.read_text(encoding='utf-8'))
        (SAIDA / 'qualidade.json').write_text(
            json.dumps({k: dados[k] for k in ('precision', 'recall', 'n_treino')}, ensure_ascii=False),
            encoding='utf-8')

    bytes_totais = sum(f.stat().st_size for f in SAIDA.glob('*.json'))
    print(f'- {len(resumos)} resumos em public/data/analises/index.json')
    print(f'- {len(resumos)} analises completas de {len(vistas)} reunioes ({bytes_totais / 1e6:.1f} MB no total)')


if __name__ == '__main__':
    exportar()
