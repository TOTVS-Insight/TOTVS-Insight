# Deploy

## Como está publicado hoje

O site vai para a **Vercel**, com os dados versionados, e funciona inteiro sem
nenhum servidor: índice, transcrições e as análises já calculadas são arquivos
estáticos. É o que permite abrir de qualquer máquina, sem instalar nada.

Para atualizar, basta `git push`. O que cada comando gera:

```bash
pnpm data:build                      # índice + public/data/transcricoes/
python backend/exportar_analises.py  # public/data/analises/ (a partir do banco local)
```

A única função que exige o servidor Python é **gerar uma análise nova** (colar
texto ou clicar em "Analisar reunião"). No site publicado ela mostra um aviso
explicando isso; o resto aparece normalmente.

Isso só é aceitável porque **esta base é fictícia e o repositório é privado**. O
aviso abaixo continua valendo caso a base passe a ter conversas reais.

## Se a base deixar de ser fictícia: o login não protege nada

O `login()` roda no browser. Os dados são arquivos estáticos servidos junto com
o app, então **qualquer pessoa com a URL lê os dados sem nunca ver a tela de
login**:

```bash
curl https://seu-dominio/data/transcricoes/1397068.json
```

Isso devolve a conversa inteira. As transcrições são reuniões reais de clientes
(anonimizadas em `[PESSOA]`, `[EMPRESA]`, `[LOCAL]`, `[TELEFONE]`, mas o teor
comercial está lá: preços, contratos, insatisfações).

Enquanto não existir autenticação validada no servidor, **publique sem os
textos**. É o que `pnpm data:build:publico` faz.

## O que subir

| Comando                             | Gera                                        | Publicar?                    |
| ----------------------------------- | ------------------------------------------- | ---------------------------- |
| `pnpm data:build`                   | Índice (472 KB) + 1.126 transcrições (47 MB) | Sim, enquanto a base for fictícia |
| `python backend/exportar_analises.py` | 1.128 análises (21 MB)                     | Sim, enquanto a base for fictícia |
| `pnpm data:build:publico`           | Só o índice (472 KB)                        | Use se a base virar real     |

Com o build público, o app funciona inteiro — dashboard, KPIs, tabela, filtros,
paginação. Só o painel de transcrição mostra um aviso explicando a ausência.

## Passo a passo (Vercel) — caminho oficial

O `vercel.json` já está configurado: build, rewrite de SPA (necessário para as
URLs `/clientes`, `/fila`, etc.), `X-Robots-Tag: noindex` e cache dos assets. O
`buildCommand` é só `pnpm build`, porque os dados vão versionados — o build na
nuvem não tem `data-source/` e não conseguiria gerá-los.

Primeira vez:

1. Acesse <https://vercel.com>, entre com a conta do GitHub e importe o
   repositório. Ele é privado, o que funciona no plano gratuito.
2. Não mude nada nas configurações: a Vercel lê o `vercel.json`.
3. Ao final, ela devolve a URL fixa do projeto. É essa URL que você compartilha.

No dia a dia, publicar é `git push`.

Quando a base de reuniões ou as análises mudarem:

```bash
pnpm data:build                      # regera índice e transcrições
python backend/exportar_analises.py  # regera as análises publicadas
git add public/data && git commit -m "Atualiza dados publicados" && git push
```

## Checklist antes de publicar

### Vercel (uso atual — base fictícia, repositório privado)

- [ ] Rodou `pnpm data:build` (índice + transcrições)
- [ ] Rodou `python backend/exportar_analises.py` se as análises mudaram
- [ ] `pnpm typecheck` limpo (o `pnpm build` sozinho não checa tipos)
- [ ] Contas de demonstração em `src/auth/authService.ts` ok para o público do link

### Sem textos / base real (Vercel ou Pages)

Use quando as conversas deixarem de ser fictícias, ou quando quiser publicar sem
os JSON de transcrição:

- [ ] Rodou `pnpm data:build:publico` (e não o `data:build` completo)
- [ ] `public/data/transcricoes/` **não** vai no commit (ou não existe)
- [ ] `pnpm typecheck` limpo
- [ ] Trocou as contas de demonstração em `src/auth/authService.ts`

## Se precisar publicar as transcrições (base real)

Não deixe como arquivo estático. Duas opções, em ordem de esforço:

1. **Proteção da plataforma** — Vercel Deployment Protection ou Netlify
   Password Protection põem uma senha na frente de tudo, inclusive de
   `/data/`. Resolve o vazamento, mas é uma senha única para todo mundo.
2. **Backend de verdade** — as transcrições saem de `public/` e passam a ser
   servidas por um endpoint que valida a sessão. Os dois pontos de troca já
   estão isolados e comentados: `login()` em `src/auth/authService.ts` e
   `getTranscricao()` em `src/data/repository.ts`.

## Passo a passo (GitHub Pages — legado, não usado hoje)

> GitHub Pages não funciona em repositório privado no plano gratuito: exige
> tornar o repositório público ou assinar o GitHub Pro. Por isso a publicação é
> feita pela Vercel. O workflow abaixo continua no projeto, mas só serve se o
> repositório virar público — e ele publica **sem** as transcrições.

O workflow `.github/workflows/pages.yml` gera o site em todo push na `main`, a
partir de `dist/`. Não existe mais pasta `docs/`.

Antes de subir o artefato, o workflow **força `transcricoesDisponiveis: false`**
no índice. Isso existe porque o índice versionado costuma vir de um
`pnpm data:build` local, que o marca `true`: sem a correção, o painel de
transcrição tentaria buscar um arquivo que nunca foi publicado e mostraria erro
em vez do aviso de "não publicado". Ou seja, commitar o índice do build completo
por engano não quebra mais o site.

### Git LFS — não remova o `lfs: true`

O `.gitattributes` põe `*.png`, `*.ttf` e `*.woff2` no Git LFS. O que está
versionado é um ponteiro de 130 bytes, não o binário.

Se o checkout do workflow rodar sem `lfs: true`, o build empacota o texto do
ponteiro como se fosse imagem e fonte. **O deploy não falha** — o servidor
devolve HTTP 200 com `content-type: image/png` — mas o site sobe sem a logo e
sem a tipografia da marca. Foi o que aconteceu até agora.

Existe um passo "Checar binários do LFS" que aborta o build se algum ponteiro
escapar (útil se a cota de LFS do repositório estourar).

### Uma vez no GitHub

1. **Settings → Pages → Source: GitHub Actions** (não use mais “Deploy from a branch /docs”)
2. Faça commit do workflow + do índice público:
   - `.github/workflows/pages.yml`
   - `public/data/meetings-index.json` (sem pasta `transcricoes/`)
   - `.gitignore` atualizado

### No dia a dia

```bash
git add .
git commit -m "sua mensagem"
git push
```

Espere 1–2 min e confira a Action em **Actions → GitHub Pages**.

### Quando a base de reuniões mudar

Aí sim, localmente (com `data-source/` na máquina):

```bash
pnpm data:build:publico
git add public/data/meetings-index.json
git commit -m "Atualiza índice de reuniões"
git push
```

Depois disso, rode `pnpm data:build` de novo se quiser as transcrições de volta
no ambiente local — o build público apaga `public/data/transcricoes/`. O índice
vai voltar a ficar marcado como modificado no git, e tudo bem: o workflow
normaliza a flag na publicação.
