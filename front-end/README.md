# FitLife — Frontend 💻

Interface do FitLife desenvolvida com **React, JavaScript e Vite**, com navegação entre as seções do dashboard, autenticação em tela própria e adaptação para dispositivos móveis.

[Voltar ao projeto](../README.md)

## Stack

| Tecnologia | Uso |
| --- | --- |
| React 19 e React DOM | Componentes e renderização |
| JavaScript e JSX | Estado, eventos, formulários e interface |
| CSS | Layout responsivo, cartões, gráfico e animações |
| Vite 8 | Servidor de desenvolvimento, proxy e build |
| Fetch API | Comunicação HTTP com cookies de sessão |
| ESLint | Análise estática e regras de Hooks |

Não utiliza React Router, biblioteca de gráficos ou framework CSS. A navegação interna usa âncoras; a tela exibida depende do estado da sessão.

## Funcionalidades da interface

- Cadastro, login, consulta da sessão e logout.
- Abertura com marca FitLife e suporte a movimento reduzido.
- Seleção da data de acompanhamento.
- Cartões de hidratação, movimento e calorias com progresso em relação à meta.
- Ajuste de água em passos de 250 ml e cardio em passos de 10 minutos.
- Metas editáveis: água até 8.000 ml, cardio até 120 minutos e calorias entre 1 e 50.000 kcal.
- Alimentação com calorias diretas ou cálculo por gramas.
- Criação, conclusão e remoção de tarefas.
- Gráfico de segunda a domingo com seletor de métrica e tabela detalhada.
- Mensagens de erro, carregamento e confirmação.
- Aviso sobre alterações não salvas antes de trocar o dia ou sair.
- Cancelamento de carregamentos com AbortController.

Os limites são regras de entrada do produto, não metas de saúde recomendadas.

## Arquivos principais

| Arquivo | Responsabilidade |
| --- | --- |
| `src/main.jsx` | Entrada da aplicação |
| `src/App.jsx` | Sessão, dashboard, carregamentos e ações do dia |
| `src/App.css` e `src/index.css` | Estilos da interface |
| `src/components/AuthScreen.jsx` | Tela de login e cadastro |
| `src/components/Brand.jsx` | Marca vetorial FitLife |
| `src/components/CalorieCalculator.jsx` | Formulário da estimativa energética |
| `src/components/WeekChart.jsx` | Gráfico semanal e tabela |
| `src/lib/api.js` | Cliente HTTP e tratamento das respostas |
| `src/lib/calories.js` | Estimativa diária e cálculo por porção |
| `vite.config.js` | Porta, acesso na rede e proxy da API |
| `public/favicon.svg` | Ícone do navegador |

## Instalação e execução

Com o backend configurado e rodando em `http://localhost:3002`, execute dentro de `front-end`:

```bash
npm ci
npm run dev
```

Abra http://localhost:5173.

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Iniciar Vite para desenvolvimento |
| `npm run lint` | Executar ESLint |
| `npm run build` | Gerar os arquivos estáticos em dist/ |
| `npm run preview` | Visualizar o build local |

O comando `preview` não inicia o backend e não recebe automaticamente o proxy de `server.proxy`; chamadas à API exigem configuração própria nesse cenário.

## Comunicação com o backend

O cliente chama caminhos relativos, como:

```js
fetch('/api/auth/me', { credentials: 'include' });
```

Durante `npm run dev`, o Vite encaminha `/api/*` para `http://127.0.0.1:3002/*`. Por exemplo, `/api/meals` chega à rota `/meals` do Express.

As requisições com corpo usam JSON. Erros HTTP são convertidos em mensagens para a interface. Cookies de sessão são enviados com `credentials: 'include'`.

Não é necessário um `.env` do frontend na configuração atual. Credenciais do banco e segredo de sessão pertencem somente ao backend.

## Salvamento e atualização

- Água, cardio e metas são alterações locais até clicar em **Salvar meu dia**.
- Refeições e tarefas são salvas imediatamente após cada ação.
- Ao remover uma refeição, suas calorias saem da soma do consumo.
- Usar a estimativa como meta modifica o objetivo na tela; salvar o dia persiste o valor.
- A semana é consultada novamente após ações concluídas e também pode ser atualizada pelo botão.
- Ao trocar a data, o dashboard é remontado para carregar os registros correspondentes.

## Cálculos implementados

A porção é calculada com:

```text
calorias = arredondar(gramas × kcal_por_100g ÷ 100)
```

Exemplo: 150 g de um alimento com 130 kcal por 100 g resultam em **195 kcal**.

A estimativa diária usa:

```text
repouso = 10 × peso_kg + 6,25 × altura_cm − 5 × idade + constante
constante = 5 (masculino) ou −161 (feminino)
estimativa diária = repouso × fator de atividade
```

Os fatores disponíveis são 1,2; 1,375; 1,55 e 1,725. O formulário limita a estimativa a adultos de 19 a 78 anos. O cálculo é uma estimativa de manutenção, sem ajuste automático para perda ou ganho de peso.

## Teste no celular

O Vite está configurado com `host: '0.0.0.0'` e porta fixa `5173`. Na mesma rede Wi-Fi do computador, abra `http://IP_DO_COMPUTADOR:5173` no celular.

O proxy mantém o endereço do backend fora do código do navegador e permite testar sem usar `localhost` no telefone.

## Verificação sugerida

1. Criar conta, entrar e sair.
2. Salvar metas, atualizar a página e conferir a persistência.
3. Alternar datas e verificar que os registros não se misturam.
4. Adicionar e remover uma refeição, conferindo o saldo calórico.
5. Calcular a porção de 150 g / 130 kcal por 100 g.
6. Concluir uma tarefa e conferir o resumo semanal.
7. Verificar a interface em uma tela estreita.

## Publicação

O backend está preparado para servir o build de dist/ em produção e aceitar chamadas /api no mesmo endereço. O proxy do Vite permanece restrito ao desenvolvimento.

Siga [DEPLOY.md](../DEPLOY.md) para criar e configurar o serviço público. A validação final no Render e em um celular fora do Wi-Fi ainda precisa ser feita.
