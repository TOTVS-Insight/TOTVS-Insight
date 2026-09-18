import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "public", "data");
const TRANSCRIPTS_DIR = path.join(DATA_DIR, "transcricoes");
const OUTPUT = path.join(DATA_DIR, "reports-index.json");

const PRODUTOS = [
  {
    nome: "RM",
    termos: [
      "rm",
      "totvs rm",
      "totus rm",
    ],
  },

  {
    nome: "Protheus",
    termos: [
      "protheus",
      "proteus",
      "protheos",
      "protheus erp",
      "proteus erp",
      "totvs protheus",
      "totus protheus",
      "totvs proteus",
      "totus proteus",
    ],
  },

  {
    nome: "Datasul",
    termos: [
      "datasul",
      "data sul",
      "totvs datasul",
      "totus datasul",
    ],
  },

  {
    nome: "Fluig",
    termos: [
      "fluig",
      "fluig",
      "fluig totvs",
      "fluig totus",
    ],
  },

  {
    nome: "TSS",
    termos: [
      "tss",
      "totvs tss",
      "totus tss",
    ],
  },

  {
    nome: "Logix",
    termos: [
      "logix",
      "logics",
      "totvs logix",
    ],
  },

  {
    nome: "WinThor",
    termos: [
      "winthor",
      "win thor",
      "winthór",
    ],
  },

  {
    nome: "TOTVS Carol",
    termos: [
      "totvs carol",
      "totus carol",
      "carol",
    ],
  },

  {
    nome: "RD Station Marketing",
    termos: [
      "rd marketing",
      "rda marketing",
      "rd station marketing",
      "rda station marketing",
    ],
  },

  {
    nome: "RD Station Conversas",
    termos: [
      "rd conversas",
      "rda conversas",
      "rd station conversas",
      "rda station conversas",
    ],
  },

  {
    nome: "RD Station CRM",
    termos: [
      "rd crm",
      "rda crm",
      "rd station crm",
      "rda station crm",
    ],
  },

  {
    nome: "TOTVS Assinatura Eletrônica",
    termos: [
      "totvs assinatura eletronica",
      "totus assinatura eletronica",
      "assinatura eletronica totvs",
    ],
  },

  {
    nome: "TOTVS iPaaS",
    termos: [
      "totvs ipaas",
      "totus ipaas",
      "ipaas",
    ],
  },
];
const CONCORRENTES = [
  { nome: "Senior", termos: ["senior sistemas", "senior"] },
  { nome: "Oracle", termos: ["oracle"] },
  { nome: "SAP", termos: ["sap"] },
  { nome: "Salesforce", termos: ["salesforce"] },
  { nome: "Omie", termos: ["omie"] },
  { nome: "Sankhya", termos: ["sankhya"] },
  {
    nome: "Microsoft Dynamics",
    termos: ["microsoft dynamics", "dynamics"],
  },
  { nome: "Linx", termos: ["linx"] },
];

const TOPICOS = [
  {
    nome: "Gestão de estoque",
    termos: [
      "estoque",
      "inventario",
      "armazenagem",
      "almoxarifado",
      "reposicao",
    ],
    produtosSugeridos: ["Protheus", "Datasul", "WinThor"],
  },
  {
    nome: "RH e folha de pagamento",
    termos: [
      "rh",
      "recursos humanos",
      "folha",
      "departamento pessoal",
      "ponto",
    ],
    produtosSugeridos: ["RM", "Fluig"],
  },
  {
    nome: "Gestão financeira",
    termos: [
      "financeiro",
      "contas a pagar",
      "contas a receber",
      "fluxo de caixa",
      "contabilidade",
    ],
    produtosSugeridos: ["Protheus", "Datasul", "RM"],
  },
  {
    nome: "CRM e vendas",
    termos: [
      "crm",
      "funil",
      "pipeline",
      "vendas",
      "comercial",
      "lead",
    ],
    produtosSugeridos: ["TOTVS CRM", "Protheus"],
  },
  {
    nome: "Integração e automação",
    termos: [
      "integracao",
      "integrar",
      "api",
      "automatizar",
      "automacao",
      "workflow",
    ],
    produtosSugeridos: ["Fluig", "TOTVS iPaaS"],
  },
  {
    nome: "BI e analytics",
    termos: [
      "business intelligence",
      "bi",
      "analytics",
      "dashboard",
      "indicadores",
      "relatorio",
    ],
    produtosSugeridos: ["TOTVS Analytics", "TOTVS Carol"],
  },
  {
    nome: "Fiscal e tributário",
    termos: [
      "fiscal",
      "tributario",
      "tributaria",
      "nota fiscal",
      "sped",
      "imposto",
    ],
    produtosSugeridos: ["TSS", "Protheus", "Datasul"],
  },
  {
    nome: "Manufatura e produção",
    termos: [
      "producao",
      "manufatura",
      "fabrica",
      "chao de fabrica",
      "pcp",
    ],
    produtosSugeridos: ["Datasul", "Protheus"],
  },
  {
    nome: "Suporte e atendimento",
    termos: [
      "suporte",
      "atendimento",
      "chamado",
      "sla",
      "service desk",
    ],
    produtosSugeridos: ["Fluig"],
  },
  {
    nome: "Implantação e projeto",
    termos: [
      "implantacao",
      "implementacao",
      "go live",
      "virada",
      "projeto",
    ],
    produtosSugeridos: ["Serviços TOTVS"],
  },
  {
    nome: "Preço e custos",
    termos: [
      "preco",
      "custo",
      "caro",
      "orcamento",
      "investimento",
      "valor",
    ],
    produtosSugeridos: [],
  },
];

/*
 * Aqui eu deixei os sinais de oportunidade mais restritivos
 * de propósito. Não é uma boa ideia transformar qualquer
 * ocorrência de "problema" ou "precisa" em oportunidade.
 */
const CUES_OPORTUNIDADE = [
  "precisamos de",
  "precisa de",
  "necessidade de",
  "gostaria de",
  "gostariamos de",
  "queremos",
  "quero",
  "estamos buscando",
  "estamos procurando",
  "estamos avaliando",
  "temos dificuldade",
  "esta dificil",
  "precisamos automatizar",
  "queremos automatizar",
  "precisamos integrar",
  "queremos integrar",
  "precisamos melhorar",
  "queremos melhorar",
  "precisamos otimizar",
  "queremos otimizar",
];

const CUES_NEGACAO_OPORTUNIDADE = [
  "nao precisamos",
  "nao precisa",
  "nao queremos",
  "nao quero",
  "sem necessidade",
  "nao temos interesse",
  "nao estamos buscando",
  "nao estamos procurando",
  "nao estamos avaliando",
];

const CUES_UPSELL = [
  "mais licencas",
  "mais usuarios",
  "novos usuarios",
  "aumentar licencas",
  "ampliar",
  "ampliacao",
  "expandir",
  "expansao",
  "crescimento",
  "nova unidade",
  "novas unidades",
  "novo modulo",
  "mais modulos",
  "upgrade",
];

const CUES_PROBLEMA = [
  "problema",
  "erro",
  "falha",
  "dificuldade",
  "lento",
  "demora",
  "insatisfeito",
  "insatisfacao",
  "reclamacao",
];

const CUES_USO_ATUAL = [
  "usamos",
  "utilizamos",
  "utiliza",
  "usa",
  "temos",
  "implantado",
  "rodando",
  "hoje usamos",
  "hoje utiliza",
];

const CUES_INTEGRACAO = [
  "integracao",
  "integrar",
  "api",
  "conectar",
  "conexao",
];

const CUES_COMPARACAO = [
  "comparando",
  "comparar",
  "versus",
  "vs",
  "melhor que",
  "pior que",
];

const CUES_AVALIACAO = [
  "proposta",
  "orcamento",
  "cotacao",
  "avaliando",
  "avaliar",
  "negociando",
];

const CUES_MIGRACAO = [
  "migrar",
  "migracao",
  "trocar",
  "substituir",
  "sair do",
  "mudando de",
];

function normalizarPreservandoPosicao(texto) {
  let saida = "";

  for (let i = 0; i < texto.length; i += 1) {
    const original = texto[i];

    const base = original
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");

    const primeiro = base[0] ?? " ";

    saida += /[a-z0-9]/.test(primeiro)
      ? primeiro
      : " ";
  }

  return saida;
}

function termoNormalizado(termo) {
  return termo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function regexTermo(termo) {
  const t = termoNormalizado(termo)
    .split(" ")
    .filter(Boolean)
    .map((parte) =>
      parte.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      ),
    )
    .join("\\s+");

  return new RegExp(
    `(^|\\s)(${t})(?=\\s|$)`,
    "g",
  );
}

function ocorrencias(
  textoNormalizado,
  termos,
) {
  const achados = [];

  for (const termo of termos) {
    const rx = regexTermo(termo);

    for (
      const match of textoNormalizado.matchAll(
        rx,
      )
    ) {
      const deslocamento =
        match[1]?.length ?? 0;

      achados.push({
        termo,

        inicio:
          (match.index ?? 0) +
          deslocamento,

        fim:
          (match.index ?? 0) +
          deslocamento +
          (match[2]?.length ??
            termo.length),
      });
    }
  }

  return achados.sort(
    (a, b) =>
      a.inicio - b.inicio,
  );
}

function temAlgum(
  textoNormalizado,
  termos,
) {
  return termos.some((termo) =>
    regexTermo(termo).test(
      textoNormalizado,
    ),
  );
}

function janela(
  textoNormalizado,
  posicao,
  antes = 230,
  depois = 300,
) {
  return textoNormalizado.slice(
    Math.max(
      0,
      posicao - antes,
    ),

    Math.min(
      textoNormalizado.length,
      posicao + depois,
    ),
  );
}

function limitesTrecho(
  textoOriginal,
  posicao,
  antes = 240,
  depois = 360,
) {
  const inicioLinha =
    textoOriginal.lastIndexOf(
      "\n",
      posicao - 1,
    ) + 1;

  const proximaQuebra =
    textoOriginal.indexOf(
      "\n",
      posicao,
    );

  const fimLinha =
    proximaQuebra === -1
      ? textoOriginal.length
      : proximaQuebra;

  if (
    fimLinha - inicioLinha <=
    720
  ) {
    return {
      inicio: inicioLinha,
      fim: fimLinha,
    };
  }

  return {
    inicio: Math.max(
      inicioLinha,
      posicao - antes,
    ),

    fim: Math.min(
      fimLinha,
      posicao + depois,
    ),
  };
}
function segmentosDaTranscricao(
  textoOriginal,
) {
  const segmentos = [];

  /*
   * Divide a transcrição por frases,
   * em vez de considerar a fala inteira
   * do locutor como um único segmento.
   */
  const regex =
    /[^.!?\n]+(?:[.!?]+|$)/g;

  for (
    const match of
    textoOriginal.matchAll(regex)
  ) {
    const bruto =
      match[0] ?? "";

    const texto =
      bruto
        .replace(
          /\s+/g,
          " ",
        )
        .trim();

    if (
      texto.length < 18
    ) {
      continue;
    }

    const inicioMatch =
      match.index ?? 0;

    const deslocamento =
      bruto.indexOf(
        bruto.trimStart(),
      );

    const inicio =
      inicioMatch +
      Math.max(
        0,
        deslocamento,
      );

    /*
     * Mesmo se houver uma frase
     * absurdamente comprida,
     * não mandamos 2 mil caracteres
     * para o relatório.
     */
    const textoFinal =
      texto.length > 320
        ? `${texto.slice(
            0,
            317,
          )}...`
        : texto;

    const normalizado =
      normalizarPreservandoPosicao(
        textoFinal,
      );

    segmentos.push({
      inicio,

      fim:
        inicio +
        textoFinal.length,

      texto: textoFinal,

      normalizado,

      compacto:
        ` ${normalizado
          .replace(
            /\s+/g,
            " ",
          )
          .trim()} `,
    });
  }

  return segmentos;
}

function recortarTrecho(
  textoOriginal,
  posicao,
  limite = 260,
) {
  if (!textoOriginal) {
    return {
      inicio: 0,
      fim: 0,
      trecho: "",
    };
  }

  // Procura o início da frase mais próxima.
  const inicioPossiveis = [
    textoOriginal.lastIndexOf(
      ".",
      posicao - 1,
    ),
    textoOriginal.lastIndexOf(
      "?",
      posicao - 1,
    ),
    textoOriginal.lastIndexOf(
      "!",
      posicao - 1,
    ),
    textoOriginal.lastIndexOf(
      "\n",
      posicao - 1,
    ),
  ];

  let inicio =
    Math.max(
      ...inicioPossiveis,
    ) + 1;

  if (inicio < 0) {
    inicio = 0;
  }

  // Procura o fim da frase.
  const finais = [
    textoOriginal.indexOf(
      ".",
      posicao,
    ),
    textoOriginal.indexOf(
      "?",
      posicao,
    ),
    textoOriginal.indexOf(
      "!",
      posicao,
    ),
    textoOriginal.indexOf(
      "\n",
      posicao,
    ),
  ].filter(
    (valor) => valor !== -1,
  );

  let fim =
    finais.length > 0
      ? Math.min(...finais) + 1
      : textoOriginal.length;

  /*
   * Se a "frase" ainda for gigantesca,
   * usamos uma janela em torno da ocorrência.
   */
  if (fim - inicio > limite) {
    const antes = 100;
    const depois =
      limite - antes;

    inicio = Math.max(
      0,
      posicao - antes,
    );

    fim = Math.min(
      textoOriginal.length,
      posicao + depois,
    );
  }

  let trecho =
    textoOriginal
      .slice(inicio, fim)
      .replace(
        /\s+/g,
        " ",
      )
      .trim();

  /*
   * Não deixa começar no meio de palavra
   * visualmente sem indicar corte.
   */
  if (
    inicio > 0 &&
    !/[.!?\n]/.test(
      textoOriginal[
        inicio - 1
      ] ?? "",
    )
  ) {
    trecho = `…${trecho}`;
  }

  if (
    fim <
      textoOriginal.length &&
    !/[.!?\n]/.test(
      textoOriginal[
        fim - 1
      ] ?? "",
    )
  ) {
    trecho = `${trecho}…`;
  }

  return {
    inicio,
    fim,
    trecho,
  };
}

function deduplicarPorProximidade(
  itens,
  distancia = 160,
) {
  const ordenados = [
    ...itens,
  ].sort(
    (a, b) =>
      a.inicio -
        b.inicio ||
      b.relevancia -
        a.relevancia,
  );

  const saida = [];

  for (const item of ordenados) {
    const existe =
      saida.some(
        (atual) =>
          Math.abs(
            atual.inicio -
              item.inicio,
          ) <= distancia,
      );

    if (!existe) {
      saida.push(item);
    }
  }

  return saida;
}

function classificarContextoProduto(
  janelaNorm,
) {
  if (
    temAlgum(
      janelaNorm,
      CUES_PROBLEMA,
    )
  ) {
    return "problema-reclamacao";
  }

  if (
    temAlgum(
      janelaNorm,
      CUES_UPSELL,
    )
  ) {
    return "expansao";
  }

  if (
    temAlgum(
      janelaNorm,
      CUES_OPORTUNIDADE,
    )
  ) {
    return "interesse-oportunidade";
  }

  if (
    temAlgum(
      janelaNorm,
      CUES_INTEGRACAO,
    )
  ) {
    return "integracao";
  }

  if (
    temAlgum(
      janelaNorm,
      CUES_USO_ATUAL,
    )
  ) {
    return "uso-atual";
  }

  return "mencao";
}

function classificarContextoConcorrente(
  janelaNorm,
) {
  if (
    temAlgum(
      janelaNorm,
      CUES_MIGRACAO,
    )
  ) {
    return "migracao-troca";
  }

  if (
    temAlgum(
      janelaNorm,
      CUES_AVALIACAO,
    )
  ) {
    return "avaliacao-comercial";
  }

  if (
    temAlgum(
      janelaNorm,
      CUES_COMPARACAO,
    )
  ) {
    return "comparacao";
  }

  if (
    temAlgum(
      janelaNorm,
      CUES_USO_ATUAL,
    )
  ) {
    return "uso-atual";
  }

  return "mencao";
}

function contemCompacto(
  textoCompacto,
  termo,
) {
  const alvo =
    termoNormalizado(termo);

  return (
    alvo.length > 0 &&
    textoCompacto.includes(
      ` ${alvo} `,
    )
  );
}

function presentesCompacto(
  textoCompacto,
  termos,
) {
  return termos.filter(
    (termo) =>
      contemCompacto(
        textoCompacto,
        termo,
      ),
  );
}

function extrairProdutos(
  textoOriginal,
  textoNorm,
) {
  return PRODUTOS.map(
    (produto) => {
      const evidencias =
        ocorrencias(
          textoNorm,
          produto.termos,
        ).map(
          (ocorrencia) => {
            const contextoNorm =
              janela(
                textoNorm,
                ocorrencia.inicio,
              );

            const contexto =
              classificarContextoProduto(
                contextoNorm,
              );

            const recorte =
              recortarTrecho(
                textoOriginal,
                ocorrencia.inicio,
              );

            return {
              produto:
                produto.nome,

              contexto,

              relevancia:
                contexto ===
                "mencao"
                  ? 50
                  : 75,

              ...recorte,
            };
          },
        );

      return {
        nome: produto.nome,

        mencoes:
          evidencias.length,

        evidencias,
      };
    },
  ).filter(
    (produto) =>
      produto.mencoes > 0,
  );
}

function extrairConcorrentes(
  textoOriginal,
  textoNorm,
) {
  return CONCORRENTES.map(
    (concorrente) => {
      const evidencias =
        ocorrencias(
          textoNorm,
          concorrente.termos,
        ).map(
          (ocorrencia) => {
            const contextoNorm =
              janela(
                textoNorm,
                ocorrencia.inicio,
              );

            const contexto =
              classificarContextoConcorrente(
                contextoNorm,
              );

            const recorte =
              recortarTrecho(
                textoOriginal,
                ocorrencia.inicio,
              );

            return {
              concorrente:
                concorrente.nome,

              contexto,

              relevancia:
                contexto ===
                "mencao"
                  ? 45
                  : 80,

              ...recorte,
            };
          },
        );

      return {
        nome:
          concorrente.nome,

        mencoes:
          evidencias.length,

        evidencias,
      };
    },
  ).filter(
    (concorrente) =>
      concorrente.mencoes >
      0,
  );
}

function extrairTopicos(
  textoOriginal,
  textoNorm,
) {
  const segmentos =
    segmentosDaTranscricao(
      textoOriginal,
    );

  return TOPICOS.map(
    (topico) => {
      const mencoes =
        ocorrencias(
          textoNorm,
          topico.termos,
        );

      const oportunidades = [];

      for (
        const segmento of
        segmentos
      ) {
        const termosNoSegmento =
          presentesCompacto(
            segmento.compacto,
            topico.termos,
          );

        if (
          termosNoSegmento.length ===
          0
        ) {
          continue;
        }

        const cuesNoSegmento =
          presentesCompacto(
            segmento.compacto,
            CUES_OPORTUNIDADE,
          );

        if (
          cuesNoSegmento.length ===
          0
        ) {
          continue;
        }

        if (
          presentesCompacto(
            segmento.compacto,
            CUES_NEGACAO_OPORTUNIDADE,
          ).length > 0
        ) {
          continue;
        }

        const relevancia =
          Math.min(
            100,

            48 +
              cuesNoSegmento.length *
                12 +
              termosNoSegmento.length *
                7,
          );

        oportunidades.push({
          topico:
            topico.nome,

          termo:
            termosNoSegmento[0],

          sinal:
            cuesNoSegmento[0],

          produtosSugeridos:
            topico.produtosSugeridos,

          relevancia,

          trecho:
            segmento.texto,

          inicio:
            segmento.inicio,

          fim:
            segmento.fim,
        });
      }

      return {
        nome: topico.nome,

        mencoes:
          mencoes.length,

        sinaisOportunidade:
          oportunidades.length,

        produtosSugeridos:
          topico.produtosSugeridos,

        oportunidades,
      };
    },
  ).filter(
    (topico) =>
      topico.mencoes > 0 ||
      topico.sinaisOportunidade >
        0,
  );
}

function extrairUpsell(
  textoOriginal,
  _textoNorm,
  produtos,
) {
  const produtosDaReuniao =
    produtos.map(
      (produto) =>
        produto.nome,
    );

  const segmentos =
    segmentosDaTranscricao(
      textoOriginal,
    );

  const evidencias = [];

  for (
    const segmento of
    segmentos
  ) {
    const sinais =
      presentesCompacto(
        segmento.compacto,
        CUES_UPSELL,
      );

    if (
      sinais.length === 0
    ) {
      continue;
    }

    const produtosRelacionados =
      PRODUTOS.filter(
        (produto) =>
          produto.termos.some(
            (termo) =>
              contemCompacto(
                segmento.compacto,
                termo,
              ),
          ),
      ).map(
        (produto) =>
          produto.nome,
      );

    evidencias.push({
      sinal: sinais[0],

      produtosRelacionados:
        produtosRelacionados.length >
        0
          ? produtosRelacionados
          : produtosDaReuniao,

      relevancia:
        produtosRelacionados.length >
        0
          ? 90
          : 70,

      trecho:
        segmento.texto,

      inicio:
        segmento.inicio,

      fim:
        segmento.fim,
    });
  }

  return deduplicarPorProximidade(
    evidencias,
    120,
  );
}

function extrairCrossSell(
  topicos,
  produtos,
) {
  const produtosMencionados =
    new Set(
      produtos.map(
        (produto) =>
          produto.nome,
      ),
    );

  /*
   * Se nenhum produto TOTVS foi
   * mencionado, não chamamos de
   * cross-sell automaticamente.
   */
  if (
    produtosMencionados.size ===
    0
  ) {
    return [];
  }

  const resultado = [];

  for (
    const topico of topicos
  ) {
    for (
      const oportunidade of
      topico.oportunidades
    ) {
      const sugeridosNovos =
        oportunidade
          .produtosSugeridos
          .filter(
            (produto) =>
              !produtosMencionados.has(
                produto,
              ),
          );

      if (
        sugeridosNovos.length ===
        0
      ) {
        continue;
      }

      resultado.push({
        topico: topico.nome,

        produtosContexto: [
          ...produtosMencionados,
        ],

        produtosSugeridos:
          sugeridosNovos,

        relevancia:
          oportunidade.relevancia,

        trecho:
          oportunidade.trecho,

        inicio:
          oportunidade.inicio,

        fim:
          oportunidade.fim,
      });
    }
  }

  return deduplicarPorProximidade(
    resultado,
    200,
  );
}

async function main() {
  const indexPath =
    path.join(
      DATA_DIR,
      "meetings-index.json",
    );

  const index =
    JSON.parse(
      await fs.readFile(
        indexPath,
        "utf8",
      ),
    );

  const records = [];

  for (
    const [
      i,
      reuniao,
    ] of
    index.reunioes.entries()
  ) {
    let textoOriginal = "";

    try {
      const transcricao =
        JSON.parse(
          await fs.readFile(
            path.join(
              TRANSCRIPTS_DIR,
              `${reuniao.id}.json`,
            ),
            "utf8",
          ),
        );

      textoOriginal =
        transcricao.texto ?? "";
    } catch {
      textoOriginal = "";
    }

    const textoNorm =
      normalizarPreservandoPosicao(
        textoOriginal,
      );

    const produtos =
      extrairProdutos(
        textoOriginal,
        textoNorm,
      );

    const concorrentes =
      extrairConcorrentes(
        textoOriginal,
        textoNorm,
      );

    const topicos =
      extrairTopicos(
        textoOriginal,
        textoNorm,
      );

    const upsell =
      extrairUpsell(
        textoOriginal,
        textoNorm,
        produtos,
      );

    const crossSell =
      extrairCrossSell(
        topicos,
        produtos,
      );

    records.push({
      idReuniao:
        reuniao.id,

      produtos,
      concorrentes,
      topicos,
      upsell,
      crossSell,
    });

    if (
      (i + 1) % 100 === 0 ||
      i + 1 ===
        index.reunioes.length
    ) {
      process.stdout.write(
        `\rRelatórios detalhados: ${
          i + 1
        }/${
          index.reunioes.length
        }`,
      );
    }
  }

  const output = {
    versao: 2,

    geradoEm:
      new Date().toISOString(),

    origem:
      "Transcrições publicadas em public/data/transcricoes",

    observacao:
      "Produtos, concorrentes, tópicos, oportunidades, upsell e cross-sell são sinais textuais determinísticos com evidências. Risco de churn continua vindo do modelo do projeto e satisfação vem do NPS da base.",

    records,
  };

  await fs.writeFile(
    OUTPUT,
    JSON.stringify(output),
    "utf8",
  );

  process.stdout.write(
    `\nGerado: ${OUTPUT}\n`,
  );
}

main().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});