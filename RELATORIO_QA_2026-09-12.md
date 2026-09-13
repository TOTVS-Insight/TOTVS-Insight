# Exploração do TOTVS Insight — 12/09/2026

## Resultado

O projeto compila e os fluxos de consulta e análise local funcionaram nos testes realizados. Os maiores problemas encontrados são controles sem implementação e indicadores que misturam dados reais com conteúdo de demonstração. O login atual não protege os arquivos nem a API.

## Ambiente e verificações

- `pnpm typecheck`: passou.
- `pnpm build`: passou; aviso de bundle JavaScript de 531,66 kB (144,20 kB gzip).
- `pnpm dev`: encontrou a porta 8443 ocupada. A instância existente respondeu com o aplicativo e foi usada nos testes.
- `python backend/server.py`: iniciado na porta 8765; `/api/health` respondeu 200 através do proxy da porta 8443.
- Navegação real no navegador: login demo, dashboard, clientes, transcrições, análise de texto novo, histórico, relatórios, configurações, fila e assistente.
- Busca por ID `1397068`: retornou uma reunião; drawer carregou a transcrição.
- Busca pelo cliente `TFEEI4`: abriu o histórico de 34 reuniões.
- Análise de texto sintético: concluída e persistida no histórico, com um trecho sem alerta.
- Console capturado: nenhum aviso/erro retornado durante a exploração.
- Assistente inspecionado em viewport de 390 × 844; menu recolheu e campo de mensagem permaneceu acessível. Isso não equivale a uma auditoria completa de responsividade.

## Problemas prioritários

### 1. Acesso não protegido — alta prioridade antes de usar dados reais

**Evidência:** uma requisição HTTP sem cookies ou autenticação a `/data/transcricoes/1397068.json` retornou 200 com 73.308 bytes. As contas demo e suas senhas ficam no frontend. O backend verifica Host/Origin, mas não sessão de usuário.

**Impacto:** qualquer pessoa com acesso ao servidor pode obter os arquivos; o login é somente uma barreira visual. A limitação já está documentada no README.

**Sugestão:** autenticar no servidor, autorizar acesso a reuniões e análises e retirar os dados protegidos da pasta pública. Usar sessão em cookie HttpOnly. Não considerar a checagem de origem como autenticação.

**Referências:** `src/auth/authService.ts`, `src/screens/LoginScreen.tsx:18`, `backend/server.py:89`, `public/data/transcricoes/`.

### 2. Notificação de churn contradiz a base — alta

**Reprodução:** a notificação afirma que TFEEI4 tem três reuniões seguidas com NPS abaixo de 6. Em Clientes, buscar TFEEI4 e abrir o detalhe: a tela informa que nenhuma reunião desse cliente tem resposta de pesquisa.

**Impacto:** pode direcionar atendimento comercial com base em um alerta fictício.

**Sugestão:** calcular alertas a partir da base e incluir a evidência e a data. Até essa integração existir, identificar claramente as notificações como demonstração.

**Referência:** `src/data/notificacoes.ts:27`.

### 3. Configurações confirmam salvamento sem persistir — alta

**Reprodução:** em Configurações, desligar Alertas por e-mail, clicar em Salvar alterações e observar a mensagem de sucesso. Abrir Relatórios e voltar a Configurações: o alerta está ligado novamente. Nem é necessário recarregar o navegador.

**Causa:** as três preferências de notificação usam estado local do componente. `save()` só grava o idioma e exibe a confirmação.

**Sugestão:** persistir as preferências por usuário e confirmar sucesso somente após a gravação. Para a demonstração, armazenamento local pode resolver; envio real de notificações exige integração correspondente.

**Referência:** `src/pages/ConfiguracoesPage.tsx`.

### 4. Interface informa autenticação em dois fatores ativa sem implementação — alta

**Evidência:** Configurações mostra “Autenticação em dois fatores — Ativo”, mas o botão não possui ação e o login é uma comparação local de credenciais. Alterar senha também não tem ação.

**Sugestão:** remover o estado “Ativo” até existir verificação real. Implementar os fluxos ou indicar indisponibilidade. Não foi realizada nenhuma alteração de senha.

**Referência:** `src/pages/ConfiguracoesPage.tsx`, seção Segurança.

### 5. Relatórios oferecem exportações e filtros sem funcionamento — alta

**Reprodução:** clicar em Exportar PDF e Gerar novo: nenhuma alteração na interface. O código confirma ausência de handlers. CSV, baixar relatórios, relatórios rápidos e aplicar filtros também não possuem implementação; os seletores laterais são elementos visuais.

**Impacto:** a tela promete relatórios disponíveis para download que não podem ser obtidos. Seus números são demonstrativos, sem indicação clara na página.

**Sugestão:** implementar primeiro uma exportação CSV real com os filtros aplicados; depois PDF. Desabilitar ações pendentes com explicação e identificar a base ilustrativa.

**Referência:** `src/pages/RelatoriosPage.tsx`.

### 6. Resumo conta textos avulsos como reuniões — média

**Reprodução:** o dashboard inicialmente mostrava 1.128 reuniões analisadas, enquanto o KPI da base mostrava 1.126. Após analisar um texto sintético, o histórico passou a 1.129.

**Causa:** `HistoricoAnalises` agrupa todos os identificadores recebidos da API, incluindo `TEXTO-*`, sem restringir o total às reuniões da base. O painel de churn já faz essa associação corretamente.

**Sugestão:** exibir contagens separadas de reuniões da base, textos avulsos e versões de análise. Reutilizar a associação aplicada no painel de churn.

**Referências:** `src/components/HistoricoAnalises.tsx:52`, `src/components/PainelChurn.tsx`.

### 7. Período e atualização do dashboard são apenas visuais — média

**Evidência:** a tela mostra “Últimos 30 dias”, mas os números abrangem novembro de 2025 a abril de 2026. Período e Atualizar dados são `div`s sem ação; Ver todas também é um `span` sem navegação.

**Sugestão:** aplicar um filtro real, usar o mesmo recorte em todos os indicadores e tornar a atualização e a navegação funcionais. Até isso existir, mostrar “Base completa” como período.

**Referências:** `src/pages/DashboardPage.tsx:312`, `src/pages/DashboardPage.tsx:477`.

### 8. Assistente, histórico de eventos e workers aparentam integração real — média

**Reprodução:** perguntar “Quantas reuniões existem na base?” no assistente. A resposta afirma estar analisando transcrições, fala genericamente de oportunidades industriais e não responde à pergunta.

**Evidência adicional:** o histórico mistura análises persistidas com uma linha do tempo fixa de eventos. A fila mostra um worker ativo com carga de 55% mesmo com zero itens em processamento. Essa carga é calculada por uma fórmula fixa no frontend.

**Sugestão:** colocar indicação explícita de demonstração nos componentes simulados. Para o assistente, conectar consultas à base e apresentar as reuniões que sustentam cada resposta. Para a fila, mostrar telemetria real ou retirar os estados “Ao vivo”.

**Referências:** `src/pages/AssistentePage.tsx:49`, `src/pages/HistoricoPage.tsx`, `src/pages/FilaPage.tsx:542`, `src/pages/FilaPage.tsx:565`.

### 9. Recarregar encerra a sessão — média

**Reprodução:** autenticado em Assistente, recarregar a página. Após o preloader, o aplicativo retorna ao login.

**Causa:** usuário autenticado existe apenas no estado React. Dados editados do perfil também não são persistidos pelo contexto; a foto tem tratamento local separado.

**Sugestão:** restaurar a sessão pelo servidor ao abrir o aplicativo e persistir os dados do perfil. Evitar armazenar senha no navegador.

**Referência:** `src/auth/AuthContext.tsx`.

## Melhorias complementares

- **Qualidade dos alertas:** o health local informa precision de 29,2%, recall de 41,2% e 67 exemplos de treino. São métricas salvas do modelo, não uma reavaliação independente nesta exploração. Manter revisão humana, ampliar validação com exemplos representativos e medir falsos positivos antes de automatizar decisões comerciais.
- **Acessibilidade:** linhas clicáveis da tabela de transcrições não têm interação equivalente de teclado declarada. Incluir link/botão “Abrir reunião”, foco visível e gestão de foco dos drawers. A inspeção não substitui teste com leitor de tela.
- **Legibilidade:** relatórios e dashboard usam várias fontes de 8–11 px. Aumentar textos secundários e controles e rever contraste no modo escuro.
- **Idioma:** há textos fixos em português e chaves internas como `overview`, `trend` e `products` visíveis em Relatórios. O NPS médio de Clientes usa `toFixed(1)`, exibindo ponto decimal em português. Centralizar tradução e formatação conforme locale.
- **Desempenho:** separar páginas por carregamento sob demanda para reduzir o bundle inicial; o aviso de tamanho não prova lentidão, mas indica oportunidade de medição e otimização.
- **Documentação:** atualizar o README: Churn já usa dados reais, o histórico agora contém análises persistidas e tema/idioma têm tratamento próprio; as descrições atuais generalizam comportamentos antigos.

## Ordem sugerida

1. Corrigir informações enganosas: alerta fictício, 2FA ativo, salvamento e indicadores simulados.
2. Fazer exportações, período e botões principais funcionarem.
3. Unificar contagem de reuniões/análises e persistência de sessão/perfil.
4. Implementar proteção real antes de disponibilizar dados restritos.
5. Melhorar acessibilidade, tipografia, idiomas e carregamento; adicionar testes de ponta a ponta para esses fluxos.

## Escopo e efeitos dos testes

Nenhum código funcional foi alterado. O build regenerou `dist/`. O servidor Python iniciado durante a exploração ficou disponível na porta 8765. Foi criada uma análise sintética identificada como `TEXTO-5c6ecec4-b3e6-4b24-bbac-4701bc3cfb6f`, contendo “Teste de QA”, que permanece no histórico local. A preferência de e-mail voltou ao valor original ao sair da página. A viewport foi restaurada.

Não foram executados teste de carga, auditoria completa de segurança, upload de arquivos, recuperação de senha ou verificação exaustiva de todos os breakpoints e idiomas. A ausência de erros de console nos fluxos percorridos não garante ausência de falhas em outros cenários.
