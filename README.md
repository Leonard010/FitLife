# FitLife 💙

Dashboard de hábitos e bem-estar para acompanhar hidratação, cardio, alimentação e tarefas, com contas individuais e histórico por data.

Projeto de estudo de desenvolvimento Full Stack de **Leonardo Sotilo**, reunindo interface React, API Node.js, autenticação por sessão e persistência em banco relacional.

> **Status:** integração com TiDB funcionando e código preparado para hospedar frontend e API juntos. O serviço público ainda precisa ser criado e testado. Veja [DEPLOY.md](DEPLOY.md).

## Funcionalidades

- Tela de login e cadastro separada do dashboard.
- Identidade visual FitLife e abertura animada com respeito à preferência de movimento reduzido.
- Layout responsivo para celular, tablet e computador.
- Acompanhamento e meta de água até **8.000 ml**.
- Acompanhamento e meta de cardio até **120 minutos**.
- Meta diária de calorias editável e saldo calculado pelo consumo registrado.
- Refeições com calorias informadas diretamente ou calculadas por porção.
- Calculadora de estimativa energética diária, com opção de aplicar o resultado à meta.
- Tarefas com criação, conclusão e remoção.
- Gráfico semanal de água, cardio e calorias, acompanhado de tabela detalhada.
- Registros separados por usuário e data.
- Confirmação ao trocar de dia com alterações não salvas e bloqueio de controles durante requisições.

**Como os dados são salvos:** água, cardio e metas dependem de **Salvar meu dia**. Refeições e tarefas são gravadas a cada ação. Aplicar uma estimativa à meta também exige salvar o dia. As metas pertencem à data selecionada; não são copiadas automaticamente para datas futuras.

## Tecnologias

| Camada | Tecnologias e finalidade |
| --- | --- |
| Frontend | React 19, React DOM, JavaScript, JSX e CSS |
| Desenvolvimento e build | Vite 8 e plugin React |
| Qualidade do frontend | ESLint, regras de Hooks e React Refresh |
| Backend | Node.js e Express 5 |
| Banco | MySQL ou TiDB Cloud compatível com MySQL |
| Acesso aos dados | mysql2/promise, pool e consultas parametrizadas |
| Autenticação | bcrypt e express-session |
| Configuração | dotenv e CORS |
| Identificadores | UUID com node:crypto |
| Testes do backend | node:assert, node:vm e dependências simuladas |
| Versionamento | Git e GitHub |

O gráfico usa componentes React e CSS próprios. Não há biblioteca externa de gráficos, ORM ou autenticação por JWT na implementação atual.

## Organização

| Caminho | Conteúdo |
| --- | --- |
| [front-end/](front-end/) | Interface, componentes, estilos e integração com a API |
| [back-end/](back-end/) | Servidor, autenticação, consultas e migração |
| [README do frontend](front-end/README.md) | Execução, componentes e fluxo da interface |
| [README do backend](back-end/README.md) | Banco, variáveis de ambiente e rotas |
| [LEIA-PRIMEIRO.md](LEIA-PRIMEIRO.md) | Guia da atualização e teste no celular |
| [VALIDACAO.md](VALIDACAO.md) | Registro das verificações da entrega |

## Executar localmente

### 1. Pré-requisitos

- Node.js em versão compatível com o Vite e npm.
- Git.
- Banco MySQL ou TiDB acessível.
- Credenciais e tabelas configuradas conforme o [guia do backend](back-end/README.md).

### 2. Clonar

```bash
git clone https://github.com/Leonard010/FitLife.git
cd FitLife
```

O repositório é privado: é necessário ter acesso à conta ou permissão para cloná-lo.

### 3. Backend

Crie `back-end/.env` conforme a documentação do backend. Em um terminal:

```bash
cd back-end
npm ci
node test-db.js
npm run dev
```

API local: http://localhost:3002.

Em um banco antigo, execute `npm run migrate` para acrescentar os campos da atualização. Essa migração **não cria as tabelas iniciais**; a instalação do zero está documentada no backend.

### 4. Frontend

Em outro terminal, a partir da raiz:

```bash
cd front-end
npm ci
npm run dev
```

Abra http://localhost:5173. Mantenha os dois terminais ativos.

O navegador chama `/api`; no desenvolvimento, o Vite encaminha as chamadas para o backend e remove esse prefixo.

## Usar no celular na mesma rede

1. Conecte celular e computador à mesma rede Wi-Fi.
2. Mantenha frontend e backend ativos.
3. No Windows, execute `ipconfig` para identificar o IPv4 do computador.
4. Abra no celular `http://SEU_IP_LOCAL:5173`.
5. Se solicitado pelo Windows, permita Node.js na rede privada.

O frontend já escuta em `0.0.0.0`. O computador deve ficar ligado. Essa configuração não disponibiliza o app pelo 4G/5G ou fora da rede local.

## Verificações disponíveis

No frontend:

```bash
npm run lint
npm run build
```

No backend:

```bash
npm test
```

Os testes do backend combinam handlers com dependências simuladas e um teste HTTP com Express, bcrypt e cookies reais. O banco e o atendimento estático são simulados; a integração final com TiDB/MySQL e o build hospedado precisa ser verificada separadamente.

## Calculadoras

- **Porção:** gramas consumidas × kcal por 100 g ÷ 100, com arredondamento para inteiro.
- **Estimativa diária:** equação de Mifflin–St Jeor e fator de atividade; o formulário aceita adultos de 19 a 78 anos.
- Não há catálogo, busca automática ou reconhecimento de alimentos. Os dados da porção são informados pelo usuário.

As estimativas e os limites de configuração do app não são recomendações individuais de alimentação, hidratação ou exercício.

## Publicação

O servidor suporta frontend compilado e API em um único endereço. Em produção, usa cookies seguros e sessões no banco; a tabela sessions é criada automaticamente na inicialização. Há um limite básico de tentativas de autenticação por IP.

Siga o [guia de publicação no Render](DEPLOY.md) para configurar build, inicialização e variáveis de ambiente. A criação do serviço e a verificação com o TiDB real na hospedagem ainda precisam ser concluídas.

## O que pratiquei neste projeto

- Componentização, props, estado e efeitos no React.
- Formulários controlados, renderização condicional e eventos.
- Requisições assíncronas com Fetch, tratamento de erros e cancelamento com AbortController.
- Integração entre interface, API HTTP e banco relacional.
- CRUD, validação de entradas e consultas SQL parametrizadas.
- Hash de senhas, cookies, sessões e proteção de rotas por usuário.
- Agregações SQL para o resumo semanal.
- CSS responsivo, feedback de carregamento e recursos de acessibilidade.
- Variáveis de ambiente, Git, GitHub e organização de um projeto Full Stack.

## Autor

**Leonardo Sotilo** · Estudante de Análise e Desenvolvimento de Sistemas

[GitHub](https://github.com/Leonard010) · [LinkedIn](https://www.linkedin.com/in/leonardo-sotilo-7969b6302/) · [Portfólio](https://leonardo-sotilo.vercel.app/)
