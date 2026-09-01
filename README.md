# TOTVS Insight

Dashboard para análise de transcrições de reuniões comerciais. Mostra
indicadores, distribuições, histórico por cliente e o texto de cada conversa.

Base atual: 1.126 reuniões entre novembro de 2025 e abril de 2026, somando 913
horas, 484 clientes e média de 49 minutos por reunião.

## Stack

React 19, TypeScript, Vite 8 e Tailwind CSS v4. Não usa biblioteca de
componentes nem de gráficos (as barras são CSS) e não tem gerenciador de estado
global. Os ícones são SVG do próprio projeto, em `src/icons/`.

Node 22 e pnpm 10.34.3, fixados no `.mise.toml`.

## Como rodar

```bash
pnpm install
pnpm data:build
pnpm dev
```

O `data:build` é obrigatório na primeira vez. Sem ele o app abre no estado de
erro "base não encontrada". O servidor sobe em <http://localhost:8443>.

### Scripts

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm data:build` | Gera `public/data/` com índice e transcrições |
| `pnpm data:build:publico` | Gera só o índice, sem os textos |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm build` | Build de produção em `dist/` |
| `pnpm build:pages` | Build com base relativa, para o GitHub Pages |
| `pnpm format` | Formata `src/` com oxfmt |

## Dados

A origem é `data-source/ANON_transcricao.json`, 46 MB em NDJSON: um objeto JSON
por linha, não um array. Um `JSON.parse` do arquivo inteiro falha, o parse tem
que ser linha a linha.

O `scripts/build-data.mjs` gera dois artefatos em `public/data/`:

- `meetings-index.json`, cerca de 470 KB, com os metadados de todas as reuniões.
  Carregado uma vez no boot.
- `transcricoes/<id>.json`, um arquivo por transcrição. Carregado só quando a
  reunião é aberta.

Sem essa separação cada visita baixaria os 46 MB inteiros.

### O que a base tem de estranho

Campos nulos são omitidos do registro em vez de virem vazios. UF, CNAE, unidade
e segmento aparecem em 63% das reuniões, faixa de faturamento em 58% e NPS em
apenas 28%. Agregações precisam tratar ausência.

O dump tem 1.174 linhas para 1.126 reuniões: são 48 IDs repetidos, e o script
mantém a primeira ocorrência de cada um.

Duas colunas costumam ser lidas errado:

- `CODT` identifica o cliente, anonimizado no formato `TFEEI4`. `NOME_UNIDADE` é
  a unidade da TOTVS que atendeu, não o nome do cliente.
- `locutores` conta rótulos `[LOCUTOR N]` distintos, não participantes. A
  diarização da origem super-segmenta, e duas pessoas conversando podem gerar
  quarenta rótulos.

### Acesso aos dados

Tudo passa por `src/data/repository.ts`. Nenhum componente faz fetch nem conhece
o formato da origem. Para trocar os arquivos estáticos por uma API, reescreva
`carregarIndice()` e `getTranscricao()`; as funções exportadas e os tipos
continuam iguais.

Nas telas os loaders são consumidos por `useDataset()`, que devolve
`{ data, loading, error }`.

## O que é real e o que é exemplo

Sai da base: indicadores do dashboard, volume mensal, distribuições por
segmento, estado e unidade, tabela de transcrições, página de clientes e fila de
processamento (vazia, porque a base está toda `COMPLETED`).

É exemplo: as onze abas de insight do dashboard, as notificações, o histórico,
os relatórios e as respostas do assistente. Estão em `src/data/mockData.ts`, e
nenhum deles tem coluna correspondente na origem. A aba "Visão Geral" é a única
do dashboard que usa dados reais.

As abas de exemplo mostram o selo "Dados ilustrativos". Mantenha o selo se mexer
nelas, senão os números viram indistinguíveis dos reais.

## Estrutura

```
src/
├── screens/      Telas de página inteira (preloader, autenticação, dashboard)
├── pages/        Páginas internas do dashboard e o PageRouter
├── components/
│   ├── ui/       Primitivos (Card, KpiCard, StatusBadge, InputField)
│   └── layout/   Sidebar, Header, dropdowns, AuthLayout
├── data/         Repositório, tipos, useDataset, dados de exemplo
├── auth/         Contexto e serviço de autenticação
├── i18n/         Dicionários pt-BR, en-US, es e o provider
├── theme/        Tokens, gradientes e modo claro/escuro
├── icons/        Ícones SVG em currentColor
└── assets/       Logo e fontes
```

O `index.css` concentra os `@font-face`, o import do Tailwind e o bloco `@theme`
com as cores da marca e a escala tipográfica. O modo escuro redefine tokens sob
`html.dark`, sem utilitários `dark:`.

## Idiomas

Português, inglês e espanhol, com as mesmas chaves nos três dicionários em
`src/i18n/locales/`. Texto novo entra nos três de uma vez.

Número e data usam sempre o locale ativo (`getActiveLocale()`), nunca um locale
fixo.

## Autenticação

O login não protege nada. Ele valida no navegador, e os dados são arquivos
estáticos servidos junto com o app:

```bash
curl https://seu-dominio/data/transcricoes/1397068.json
```

Isso devolve a conversa inteira sem nunca passar pela tela de login.

As contas de demonstração estão em `src/auth/authService.ts` e vêm preenchidas
na tela. Troque as duas coisas antes de qualquer uso real.

Os pontos de troca para autenticação de verdade são `login()` em
`src/auth/authService.ts` e `getTranscricao()` em `src/data/repository.ts`.

## Deploy

O `.github/workflows/pages.yml` publica no GitHub Pages a cada push na `main`.
Em Settings > Pages, a fonte precisa estar em "GitHub Actions".

Publique sempre com `pnpm data:build:publico`, que gera o índice sem os textos.
As transcrições são conversas reais de clientes: os nomes estão anonimizados,
mas o teor comercial continua lá, com preços, contratos e insatisfações.

Detalhes em [DEPLOY.md](DEPLOY.md).

## Cuidados

O `pnpm build` não checa tipos. O esbuild remove as anotações sem validar, então
o build passa em código que o `tsc` rejeitaria. Use `pnpm typecheck`.

Imagens e fontes estão em Git LFS. O `.gitattributes` cobre `*.png`, `*.ttf` e
`*.woff2`, então o repositório guarda um ponteiro de 130 bytes no lugar do
arquivo. Um checkout sem LFS gera um site sem logo e sem as fontes da marca, e
sem erro nenhum, porque o servidor responde 200 com o content-type certo. O
workflow usa `lfs: true` e aborta se algum ponteiro escapar.

O oxfmt 0.2.0 corrompia sintaxe de tipos: removia o `;` dentro de type literals
e os parênteses de `(keyof X)[]`, que virava `keyof X[]`. O build reportava
sucesso o tempo todo. A versão está fixada em 0.62.0.

## Pendências

- Botões sem ação em Relatórios ("Gerar novo", "Baixar") e em Configurações
  ("Alterar senha", "2FA")
- Perfil, configurações e notificações não persistem: voltam ao estado original
  ao recarregar a página
- Credenciais preenchidas na tela de login
