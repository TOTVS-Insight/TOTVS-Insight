#!/usr/bin/env python3
"""
TOTVS Insight — Pipeline de pré-processamento de transcrições

Pipeline:
1) lê a transcrição BRUTA
2) aplica um classificador ML de relevância por fala
3) salva a transcrição FILTRADA sem alterar a original
4) gera JSON por reunião, pronto para a tela de comparação
5) a etapa de análise deve consumir texto_filtrado

Modelo:
- TF-IDF (1-2 grams) + Logistic Regression
- Treino seed supervisionado com exemplos de "conteúdo de negócio" vs "ruído"
- Execução offline/server-side; NÃO roda quando o usuário clica em "Comparar"

Uso:
    python scripts/preprocess_transcripts.py \
        --input data/ANON_transcricao.json \
        --output public/data/transcricoes-processadas \
        --level medio

Também aceita CSV:
    python scripts/preprocess_transcripts.py \
        --input data/reunioes_transcricoes_mockado.csv \
        --output public/data/transcricoes-processadas \
        --level medio

Para processar apenas uma reunião:
    python scripts/preprocess_transcripts.py \
        --input data/ANON_transcricao.json \
        --output public/data/transcricoes-processadas \
        --id 1371268
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Iterator

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline


MODEL_NAME = "totvs-filter-tfidf-logreg-v1"

LEVEL_THRESHOLDS = {
    "leve": 0.28,
    "medio": 0.46,
    "agressivo": 0.62,
}

BUSINESS_KEYWORDS = {
    "totvs", "protheus", "datasul", "fluig", "rm", "tss", "erp",
    "cliente", "negócio", "processo", "requisito", "necessidade",
    "problema", "dor", "financeiro", "fiscal", "rh", "folha",
    "estoque", "manufatura", "supply", "integração", "integracao",
    "implantação", "implantacao", "proposta", "preço", "preco",
    "valor", "orçamento", "orcamento", "prazo", "contrato",
    "compra", "venda", "churn", "risco", "sentimento", "concorrente",
    "senior", "sap", "oracle", "microsoft", "oportunidade",
    "upsell", "cross-sell", "decisão", "decisao", "próximo passo",
    "proximo passo", "ação", "acao", "responsável", "responsavel",
    "budget", "opportunity", "competitor", "decision",
    "riesgo", "oportunidad", "decisión",
}

FILLER_ONLY = re.compile(
    r"^(ah+|hã+|hum+|uh+|eh+|é+|né+|tipo|assim|ok|okay|sim|não|nao|"
    r"certo|beleza|tá|ta|entendi|aham|uhum|obrigad[oa]|valeu|"
    r"hello|hi|yes|no|thanks|gracias|hola)[.!?,…\s-]*$",
    re.IGNORECASE,
)

# Treino seed: positivo = conteúdo que interessa à análise; negativo = ruído/social.
POSITIVE_EXAMPLES = [
    "o cliente precisa integrar o financeiro entre as unidades",
    "há uma oportunidade de venda do módulo protheus",
    "o cliente demonstrou interesse em automatizar processos",
    "o prazo de implantação precisa ser reduzido",
    "foi solicitado orçamento para a nova solução",
    "o concorrente senior sistemas foi mencionado",
    "o cliente reclamou do atendimento e pode cancelar",
    "existe risco de churn por insatisfação com suporte",
    "o cliente quer integrar o ERP com o sistema atual",
    "ficou definido que a proposta será enviada na sexta-feira",
    "o responsável pela próxima ação será o gerente comercial",
    "a empresa quer controlar estoque e inventário",
    "houve interesse em cross-sell para o módulo de recursos humanos",
    "foi discutido o valor do contrato e as condições comerciais",
    "o cliente relatou dificuldade no processo fiscal",
    "precisamos mapear os requisitos da implantação",
    "o cliente utiliza SAP e está avaliando alternativas",
    "a reunião identificou uma necessidade de folha de pagamento",
    "o sentimento do cliente piorou por causa do atraso",
    "foi acordado um próximo passo para demonstração do produto",
    "customer needs an ERP integration with finance and inventory",
    "the customer mentioned a competitor and renewal risk",
    "new upsell opportunity was identified during the meeting",
    "the next step is to send a commercial proposal",
    "el cliente necesita integrar el sistema financiero",
    "se identificó riesgo de cancelación y una oportunidad comercial",
]

NEGATIVE_EXAMPLES = [
    "boa tarde tudo bem",
    "oi pessoal",
    "obrigado",
    "sim",
    "não",
    "aham",
    "uhum",
    "beleza",
    "certo",
    "entendi",
    "deixa eu pegar uma água",
    "meu áudio está funcionando",
    "vocês estão me ouvindo",
    "vou compartilhar a tela",
    "um minuto por favor",
    "desculpa o atraso",
    "até mais",
    "tchau pessoal",
    "bom dia",
    "como foi o fim de semana",
    "está calor hoje",
    "vou desligar a câmera",
    "hello everyone",
    "can you hear me",
    "thanks bye",
    "hola buenos días",
    "gracias hasta luego",
]


@dataclass
class FilterStats:
    total_lines: int
    kept_lines: int
    removed_lines: int
    avg_probability: float


def build_model() -> Pipeline:
    x = POSITIVE_EXAMPLES + NEGATIVE_EXAMPLES
    y = [1] * len(POSITIVE_EXAMPLES) + [0] * len(NEGATIVE_EXAMPLES)

    model = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    strip_accents="unicode",
                    ngram_range=(1, 2),
                    min_df=1,
                    max_features=12000,
                    sublinear_tf=True,
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    max_iter=1500,
                    class_weight="balanced",
                    random_state=42,
                ),
            ),
        ]
    )

    model.fit(x, y)
    return model


def extract_content(line: str) -> str:
    text = line.strip()
    text = re.sub(r"^\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*[-–—:]?\s*", "", text)
    text = re.sub(r"^\[?LOCUTOR[^\]]*\]?\s*:\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^[A-Za-zÀ-ÿ0-9 ._-]{1,40}:\s*", "", text)
    return text.strip()


def has_business_signal(text: str) -> bool:
    lower = text.lower()

    if re.search(r"(R\$|US\$|€|\$)\s?\d|\b\d+(?:[.,]\d+)?%|\b\d{1,2}/\d{1,2}/\d{2,4}\b", text):
        return True

    return any(keyword in lower for keyword in BUSINESS_KEYWORDS)


def should_keep(
    model: Pipeline,
    line: str,
    threshold: float,
) -> tuple[bool, float, str]:
    content = extract_content(line)

    if not content:
        return False, 0.0, "vazia"

    if has_business_signal(content):
        return True, 1.0, "regra-negocio"

    if FILLER_ONLY.match(content):
        return False, 0.0, "ruido-curto"

    if len(re.sub(r"\W", "", content, flags=re.UNICODE)) < 4:
        return False, 0.0, "curta"

    probability = float(model.predict_proba([content])[0][1])
    return probability >= threshold, probability, "ml"


def filter_transcript(
    model: Pipeline,
    original: str,
    level: str,
) -> tuple[str, FilterStats, list[dict]]:
    threshold = LEVEL_THRESHOLDS[level]

    raw_lines = original.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    output_lines: list[str] = []
    details: list[dict] = []
    probabilities: list[float] = []

    last_kept: str | None = None

    for line in raw_lines:
        stripped = line.strip()
        if not stripped:
            continue

        keep, probability, reason = should_keep(model, stripped, threshold)

        # Remove duplicação consecutiva sem alterar a versão original.
        if keep and last_kept == stripped:
            keep = False
            reason = "duplicada"

        if keep:
            output_lines.append(stripped)
            last_kept = stripped

        if reason == "ml":
            probabilities.append(probability)

        details.append(
            {
                "linha": stripped,
                "mantida": keep,
                "probabilidade_relevancia": round(probability, 4),
                "motivo": reason,
            }
        )

    stats = FilterStats(
        total_lines=len(details),
        kept_lines=sum(1 for item in details if item["mantida"]),
        removed_lines=sum(1 for item in details if not item["mantida"]),
        avg_probability=(
            sum(probabilities) / len(probabilities)
            if probabilities
            else 1.0
        ),
    )

    return "\n".join(output_lines), stats, details


def iter_jsonl(path: Path) -> Iterator[dict]:
    with path.open("r", encoding="utf-8") as file:
        for line in file:
            if not line.strip():
                continue
            yield json.loads(line)


def iter_csv(path: Path) -> Iterator[dict]:
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        yield from csv.DictReader(file)


def iter_records(path: Path) -> Iterable[dict]:
    suffix = path.suffix.lower()

    if suffix in {".json", ".jsonl"}:
        # O ANON_transcricao.json do projeto é JSON Lines.
        yield from iter_jsonl(path)
        return

    if suffix == ".csv":
        yield from iter_csv(path)
        return

    raise ValueError(f"Formato não suportado: {suffix}")


def get_first(record: dict, *keys: str):
    for key in keys:
        value = record.get(key)
        if value not in (None, ""):
            return value
    return None


def normalize_record(record: dict) -> dict:
    meeting_id = str(
        get_first(record, "ID_MEETING", "id", "id_reuniao", "meeting_id") or ""
    ).strip()

    original = str(
        get_first(
            record,
            "ANON_TRANSCRICAO",
            "texto_original",
            "transcricao",
            "texto",
        )
        or ""
    )

    return {
        "id_reuniao": meeting_id,
        "codt": get_first(record, "CODT", "codt"),
        "data_reuniao": get_first(record, "DT_MEETING", "data", "data_reuniao"),
        "status_reuniao": get_first(record, "STATUS_MEETING", "status"),
        "unidade": get_first(record, "NOME_UNIDADE", "unidade"),
        "segmento": get_first(record, "NOME_SEGMENTO", "segmento"),
        "uf": get_first(record, "UF", "uf"),
        "texto_original": original,
    }


def process_record(
    model: Pipeline,
    record: dict,
    output_dir: Path,
    level: str,
) -> Path | None:
    normalized = normalize_record(record)
    meeting_id = normalized["id_reuniao"]
    original = normalized["texto_original"]

    if not meeting_id or not original.strip():
        return None

    filtered, stats, details = filter_transcript(
        model=model,
        original=original,
        level=level,
    )

    payload = {
        **normalized,
        # CRÍTICO: original é preservado exatamente como entrou.
        "texto_original": original,
        "texto_filtrado": filtered,
        "nivel_filtragem": level.upper(),
        "status_transcricao": "FILTRADA",
        "filtro_ml": {
            "modelo": MODEL_NAME,
            "threshold": LEVEL_THRESHOLDS[level],
            "processado_em": datetime.now(timezone.utc).isoformat(),
            "total_linhas": stats.total_lines,
            "linhas_mantidas": stats.kept_lines,
            "linhas_removidas": stats.removed_lines,
            "percentual_mantido": round(
                (stats.kept_lines / max(stats.total_lines, 1)) * 100,
                2,
            ),
            "confianca_media": round(stats.avg_probability, 4),
        },
        # Útil para auditoria/rastreabilidade. Pode ser removido em produção.
        "detalhes_filtragem": details,
    }

    output_dir.mkdir(parents=True, exist_ok=True)
    target = output_dir / f"{meeting_id}.json"

    with target.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)

    return target


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument(
        "--level",
        choices=sorted(LEVEL_THRESHOLDS),
        default="medio",
    )
    parser.add_argument(
        "--id",
        dest="meeting_id",
        help="Processa apenas o ID informado.",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    output_dir = Path(args.output)

    model = build_model()

    count = 0
    index: list[dict] = []

    for raw_record in iter_records(input_path):
        normalized = normalize_record(raw_record)

        if args.meeting_id and normalized["id_reuniao"] != str(args.meeting_id):
            continue

        target = process_record(
            model=model,
            record=raw_record,
            output_dir=output_dir,
            level=args.level,
        )

        if target is None:
            continue

        index.append(
            {
                "id_reuniao": normalized["id_reuniao"],
                "arquivo": target.name,
            }
        )
        count += 1

        if args.meeting_id:
            break

    output_dir.mkdir(parents=True, exist_ok=True)

    with (output_dir / "index.json").open("w", encoding="utf-8") as file:
        json.dump(
            {
                "modelo": MODEL_NAME,
                "nivel": args.level.upper(),
                "quantidade": count,
                "transcricoes": index,
            },
            file,
            ensure_ascii=False,
            indent=2,
        )

    print(f"{count} transcrição(ões) processada(s).")
    print(f"Saída: {output_dir.resolve()}")


if __name__ == "__main__":
    main()
