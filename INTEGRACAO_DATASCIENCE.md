# Análise de transcrições no site

Esta integração usa uma cópia de `insight.py` e do modelo treinado. A entrega acadêmica na pasta TOTVS_DataScience_Arthur não é modificada nem é necessária para iniciar o site.

## Abrir no computador

Abra `INICIAR_SITE.cmd` e acesse http://127.0.0.1:8765. Mantenha a janela aberta enquanto usa o site. O login continua usando as contas de demonstração existentes.

Na página Transcrições, use **Analisar um texto novo** para colar uma transcrição diretamente, ou envie um TXT ou JSON de uma reunião. Abra o texto e clique em **Analisar reunião**. Expanda os trechos para consultar o conteúdo e a recomendação. O botão **Baixar resultado** exporta JSON. A página Histórico permite reabrir análises, inclusive após reiniciar o servidor. A Visão Geral apresenta a contagem de reuniões analisadas e com sinais de risco, usando o último resultado por identificador.

Os uploads da lista continuam temporários; os resultados, com os trechos analisados, ficam salvos em `backend/storage/analises.sqlite3`. Esse banco é privado, não deve ser versionado ou publicado. Cada nova execução cria uma entrada no histórico; não retreina o modelo. Identificadores de reuniões devem ser distintos para reuniões diferentes.

O upload aceita TXT e JSON com um objeto e campo `texto`, `text`, `transcricao`, `transcript` ou `ANON_TRANSCRICAO`. Um arquivo com várias reuniões precisa ser separado em uma reunião por arquivo nesta versão. O limite é 100 mil caracteres por análise.

## Desenvolvimento

Requer Node compatível com o projeto e Python 3.12 com as dependências de `backend/requirements.txt`.

```powershell
python -m pip install -r backend/requirements.txt
npm install
npm run typecheck
npm run build
python backend/server.py
```

Para acompanhar alterações no código em desenvolvimento, mantenha o servidor Python aberto e execute `npm run dev` em outro terminal. O Vite encaminha `/api` para o serviço em 127.0.0.1:8765. A versão compilada é servida diretamente pelo Python, no mesmo endereço da API.

## Arquivos da integração

- `backend/server.py`: análise, validação da entrada, histórico SQLite e hospedagem local do site compilado.
- `backend/insight.py` e `backend/model/modelo_piloto.joblib`: cópias do analisador e do modelo original.
- `src/data/analises.ts`: comunicação entre site e serviço.
- `src/components/AnalisarTranscricao.tsx`: botão e estado de processamento.
- `src/components/ResultadoAnalise.tsx`: resultados e exportação.
- `src/components/HistoricoAnalises.tsx`: histórico e indicadores reais.

## Limites e publicação

O serviço foi feito para demonstração local e escuta somente 127.0.0.1. Não utiliza serviços externos de análise. O login do site continua demonstrativo, e a API local não implementa usuários ou isolamento por conta. Antes de disponibilizar na internet, implementar autenticação no servidor, autorização por usuário, HTTPS, limites de uso e política de retenção dos textos. Publicar apenas o frontend estático não publica o serviço Python.

O modelo é exploratório. Sinais textuais de risco não são probabilidades de cancelamento. Texto curto, repetitivo ou sem vocabulário reconhecido recebe contexto insuficiente. Ausência de alerta não garante ausência de risco. O assistente e outros painéis demonstrativos existentes não foram convertidos em análises reais por esta integração.
