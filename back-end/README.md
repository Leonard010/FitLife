# FitLife — Backend ⚙️

API HTTP em **Node.js e Express** para contas, sessões, refeições, tarefas, acompanhamento diário e resumo semanal.

Os dados são armazenados em MySQL ou TiDB compatível com MySQL. As consultas usam `mysql2/promise` e parâmetros, sem ORM.

[Voltar ao projeto](../README.md)

## Tecnologias

| Tecnologia | Uso |
| --- | --- |
| Node.js | Execução do servidor |
| Express 5 | Rotas, middleware e respostas JSON |
| mysql2/promise | Pool e consultas assíncronas |
| bcrypt | Hash de senhas com custo 12 e comparação no login |
| express-session | Sessões e cookie fitlife.sid |
| dotenv | Carregamento de back-end/.env |
| cors | Origem permitida e envio de credenciais |
| node:crypto | UUID dos registros |
| node:assert e node:vm | Testes com dependências simuladas |

## Arquivos

| Arquivo | Função |
| --- | --- |
| `server.js` | Inicialização, rotas, validações e sessões |
| `db.js` | Variáveis de ambiente, pool e TLS opcional |
| `test-db.js` | Teste manual de conexão |
| `migrate.js` | Acréscimo dos campos da atualização |
| `tests/routes.cjs` | Testes de handlers com dependências simuladas |
| `package.json` | Dependências e comandos |

## Configuração

Crie um arquivo `.env` nesta pasta, preenchendo os valores para o seu ambiente:

```env
DB_HOST=SEU_HOST
DB_PORT=4000
DB_USER=SEU_USUARIO
DB_PASSWORD="SUA_SENHA"
DB_NAME=fitlife
DB_SSL=true
SESSION_SECRET=SUBSTITUA_POR_UM_SEGREDO_ALEATORIO_LONGO
PORT=3002
FRONTEND_ORIGIN=http://localhost:5173
```

- Para TiDB, copie host, porta e usuário completos dos parâmetros de conexão.
- Para MySQL local, a porta costuma ser `3306`; use `DB_SSL=false` somente quando sua conexão local não utilizar TLS.
- Com `DB_SSL=true`, o pool exige TLS 1.2 ou superior e mantém a verificação do certificado.
- O pool limita conexões a 5 e usa timeout de conexão de 15 segundos.
- `SESSION_SECRET` é obrigatório. Não use o texto de exemplo como segredo real.
- Não envie o `.env` para o GitHub. Ele está coberto pelo `.gitignore`.

## Banco de dados: instalação do zero

Execute o SQL abaixo no banco escolhido. No TiDB Cloud, use o SQL Editor e execute **todos os comandos**, não apenas o último.

```sql
CREATE DATABASE IF NOT EXISTS fitlife;

CREATE TABLE IF NOT EXISTS fitlife.users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fitlife.meals (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  record_date DATE NOT NULL,
  name VARCHAR(150) NOT NULL,
  calories INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_meals_user_date (user_id, record_date)
);

CREATE TABLE IF NOT EXISTS fitlife.tasks (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  record_date DATE NOT NULL,
  name VARCHAR(150) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tasks_user_date (user_id, record_date)
);

CREATE TABLE IF NOT EXISTS fitlife.daily_records (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  record_date DATE NOT NULL,
  water_ml INT NOT NULL DEFAULT 0,
  cardio_minutes INT NOT NULL DEFAULT 0,
  water_goal_ml INT NOT NULL DEFAULT 2000,
  cardio_goal_minutes INT NOT NULL DEFAULT 30,
  calorie_goal INT NOT NULL DEFAULT 2000,
  UNIQUE KEY uq_daily_user_date (user_id, record_date)
);

SHOW TABLES FROM fitlife;
```

O resultado deve listar `users`, `meals`, `tasks` e `daily_records`. Esse esquema corresponde às consultas atuais; não define chaves estrangeiras. A API restringe o acesso aos registros pelo usuário da sessão.

## Migração de um banco existente

Se já existem as tabelas da versão anterior:

```bash
npm ci
npm run migrate
```

A migração consulta `INFORMATION_SCHEMA` e adiciona somente as colunas ausentes:

| Tabela | Coluna | Valor inicial |
| --- | --- | --- |
| meals | calories | 0 |
| daily_records | cardio_goal_minutes | 30 |
| daily_records | calorie_goal | 2000 |

Pode ser executada novamente e não apaga registros. Precisa de permissão para `ALTER TABLE`. Não cria banco ou tabelas iniciais, não transfere dados entre MySQL local e TiDB e não calcula calorias de refeições antigas.

## Iniciar

Dentro de `back-end`:

```bash
npm ci
node test-db.js
npm run dev
```

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Executar server.js com monitoramento de alterações |
| `npm start` | Executar server.js sem monitoramento |
| `npm run migrate` | Adicionar os campos da atualização |
| `npm test` | Executar os testes com dependências simuladas |

Por padrão, o servidor usa http://localhost:3002. A rota `GET /` retorna uma mensagem de funcionamento; ela não testa a conexão com o banco.

## Autenticação

1. O cadastro valida os campos e grava a senha como hash bcrypt.
2. O login normaliza o e-mail e compara a senha com o hash.
3. Após autenticar, o servidor regenera e salva a sessão com o ID do usuário.
4. O navegador recebe o cookie `fitlife.sid`.
5. Rotas protegidas usam o usuário da sessão, sem aceitar `user_id` informado pelo cliente.
6. O logout destrói a sessão e limpa o cookie.

O cookie atual usa `httpOnly: true`, `sameSite: 'lax'`, `secure: false em desenvolvimento` e duração de 8 horas. As sessões são armazenadas na tabela sessions, criada automaticamente ao iniciar o servidor. Reiniciar o processo preserva sessões ainda válidas quando o banco e SESSION_SECRET permanecem os mesmos. Em produção, secure é true e o cookie exige HTTPS.

## Rotas

Os caminhos abaixo são os do Express. No frontend em desenvolvimento, recebem o prefixo `/api`, removido pelo proxy do Vite.

| Método | Rota | Sessão | Finalidade |
| --- | --- | --- | --- |
| GET | / | Não | Mensagem do servidor |
| POST | /auth/register | Não | Criar usuário |
| POST | /auth/login | Não | Iniciar sessão |
| GET | /auth/me | Sim | Consultar usuário conectado |
| GET | /auth/check | Sim | Confirmar sessão ativa |
| POST | /auth/logout | Não exige sessão prévia | Encerrar sessão |
| GET | /meals?date=AAAA-MM-DD | Sim | Listar refeições do dia |
| POST | /meals | Sim | Registrar refeição |
| DELETE | /meals/:id | Sim | Remover refeição do usuário |
| GET | /tasks?date=AAAA-MM-DD | Sim | Listar tarefas do dia |
| POST | /tasks | Sim | Criar tarefa |
| PATCH | /tasks/:id | Sim | Alterar conclusão |
| DELETE | /tasks/:id | Sim | Remover tarefa do usuário |
| GET | /daily-records/:date | Sim | Consultar valores e metas |
| PUT | /daily-records/:date | Sim | Inserir ou atualizar o dia |
| GET | /weekly-summary?date=AAAA-MM-DD | Sim | Resumo de segunda a domingo |

### Exemplos de corpos JSON

Cadastro:

```json
{
  "name": "Usuario de exemplo",
  "email": "usuario@example.com",
  "password": "senha-de-exemplo"
}
```

Login:

```json
{
  "email": "usuario@example.com",
  "password": "senha-de-exemplo"
}
```

Refeição:

```json
{
  "name": "Almoco",
  "date": "2026-11-04",
  "calories": 600
}
```

Tarefa:

```json
{
  "name": "Caminhar",
  "date": "2026-11-04"
}
```

Atualizar conclusão:

```json
{
  "completed": true
}
```

Salvar acompanhamento diário:

```json
{
  "water_ml": 1500,
  "cardio_minutes": 40,
  "water_goal_ml": 2500,
  "cardio_goal_minutes": 60,
  "calorie_goal": 2200
}
```

O `PUT` exige todos os campos do acompanhamento; não funciona como atualização parcial.

### Validações principais

| Campo | Regra |
| --- | --- |
| Nome de usuário | 1 a 100 caracteres após trim |
| E-mail | Formato validado, até 254 caracteres e unicidade no banco |
| Senha no cadastro | Pelo menos 6 caracteres e no máximo 72 bytes UTF-8 |
| Nome de refeição/tarefa | 1 a 150 caracteres após trim |
| Calorias de uma refeição | Inteiro de 0 a 50.000 |
| Água registrada | Inteiro de 0 a 8.000 ml |
| Meta de água | Inteiro de 1 a 8.000 ml |
| Cardio registrado | Inteiro de 0 a 120 minutos |
| Meta de cardio | Inteiro de 1 a 120 minutos |
| Meta de calorias | Inteiro de 1 a 50.000 kcal |
| Conclusão de tarefa | Booleano |
| Data | AAAA-MM-DD, data real e ano a partir de 1000 |

Quando não existe um registro diário, o `GET` devolve água/cardio zerados e metas de 2.000 ml, 30 minutos e 2.000 kcal, sem criar uma linha no banco. O `PUT` faz a gravação com `INSERT ... ON DUPLICATE KEY UPDATE`.

Respostas incluem `400` para entrada inválida, `401` para sessão ausente/credenciais incorretas, `404` para item não encontrado, `409` para e-mail já cadastrado e `500` para falha interna. Exclusões bem-sucedidas retornam `204`.

## Resumo semanal

A API determina a segunda-feira da semana da data consultada e retorna sete dias. Consultas agregadas reúnem:

- Água, cardio e metas do registro diário.
- Quantidade de refeições e soma de calorias.
- Quantidade total de tarefas e quantidade concluída.

Dias sem registros retornam contagens e consumos zerados; metas ausentes aparecem como `null` no resumo.

## Testes e limites da cobertura

```bash
npm test
```

O script usa `node:vm` para executar os handlers com Express, sessão e banco simulados. Verifica bloqueio sem sessão em rota protegida, datas inválidas, limites de água/cardio/metas, calorias de refeições, parâmetros SQL, filtro do proprietário e remoção de item inexistente.

Esse primeiro script não verifica bcrypt ou HTTP reais. O segundo script, detalhado na seção de produção, verifica cadastro, login e sessões por HTTP com banco simulado. Para integrar com o banco real, execute o teste de conexão e use a interface com o TiDB/MySQL configurado.

## Diagnóstico

| Erro | O que conferir |
| --- | --- |
| ER_NO_SUCH_TABLE | Banco selecionado em DB_NAME e execução de todo o esquema SQL |
| ER_ACCESS_DENIED_ERROR | Usuário, senha e permissões |
| Falha de conexão | Host, porta, rede e configuração TLS |
| E-mail já cadastrado | Use a conta existente ou outro e-mail |
| Sessão perdida ao reiniciar | Confira persistência no banco, validade do cookie e estabilidade de SESSION_SECRET |
| Falha no /api pelo frontend | Backend ativo em 3002 e uso do servidor Vite |

Uma conta do MySQL local não aparece automaticamente no TiDB. Para começar com um banco novo, cadastre a conta pela interface; preservar histórico exige transferência separada.

## Produção

Siga [DEPLOY.md](../DEPLOY.md). Com NODE_ENV=production, o servidor entrega front-end/dist, aceita o prefixo /api, reconhece HTTPS pelo proxy e usa cookies Secure. As rotas antigas continuam disponíveis para desenvolvimento.

A tabela sessions armazena o identificador, a expiração e os dados da sessão. A inicialização cria a tabela se necessário e remove sessões expiradas; uma limpeza é executada a cada hora enquanto o processo está ativo. get, set, touch e destroy usam consultas parametrizadas.

Login e cadastro recebem um limite básico por IP de 30 tentativas por janela em memória de até 15 minutos. O contador reinicia com o processo e não é compartilhado entre instâncias.

O teste tests/production.cjs acrescenta HTTP e bcrypt reais, prefixo /api, cookie seguro, recuperação de sessão após reiniciar o app, logout e limite de tentativas. Usa banco e atendimento estático simulados; não substitui a verificação do TiDB e do build real no Render.
