# Publicar o FitLife no Render

Este guia publica frontend e backend em um único **Web Service**, com o TiDB já configurado. Não crie um Static Site separado.

## Antes de começar

- Código atualizado no GitHub.
- Banco fitlife com users, meals, tasks e daily_records.
- Credenciais TiDB guardadas fora do GitHub.
- Cadastro e salvamento funcionando no teste local.
- Acesso do Render ao repositório privado Leonard010/FitLife.

## Configuração do serviço

No Render, escolha **New → Web Service**, conecte o GitHub e selecione FitLife.

| Campo | Valor |
| --- | --- |
| Name | fitlife, ou outro nome disponível |
| Language / Runtime | Node |
| Branch | main |
| Root Directory | Deixe vazio: usar a raiz do repositório |
| Build Command | npm --prefix back-end ci && npm --prefix front-end ci --include=dev && npm --prefix front-end run build |
| Start Command | npm --prefix back-end start |
| Instance Type | Free |
| Health Check Path | /health |

O build inclui as ferramentas de desenvolvimento do frontend mesmo com NODE_ENV=production. Não coloque front-end ou back-end em Root Directory: os dois diretórios são usados na publicação.

## Variáveis de ambiente

Cadastre os valores na área **Environment** do Render, sem enviar o .env para o repositório.

| Nome | Valor |
| --- | --- |
| NODE_ENV | production |
| NODE_VERSION | 22.22.0 |
| DB_HOST | Host informado pelo TiDB |
| DB_PORT | 4000, conforme seus parâmetros de conexão |
| DB_USER | Usuário completo do TiDB |
| DB_PASSWORD | Senha do TiDB |
| DB_NAME | fitlife |
| DB_SSL | true |
| SESSION_SECRET | Segredo aleatório longo e estável |

Para gerar SESSION_SECRET no computador:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copie o resultado somente para a variável secreta no Render. Não o publique nem o envie em capturas de tela.

O Render fornece PORT e RENDER_EXTERNAL_URL. O servidor usa esses valores automaticamente. FRONTEND_ORIGIN é opcional: quando ausente, usa RENDER_EXTERNAL_URL em produção e localhost:5173 no ambiente local. Com domínio próprio, ajuste FRONTEND_ORIGIN para a origem HTTPS correspondente.

Não defina NODE_ENV=production no .env usado para testar com Vite localmente. O modo de produção exige frontend compilado e cookies HTTPS.

## Publicar

Após conferir o plano Free e as variáveis, crie o Web Service e acompanhe os logs.

Na inicialização, o servidor cria automaticamente a tabela **sessions**, se não existir. Ela complementa as quatro tabelas do app; não apaga contas ou registros. O usuário do banco precisa de permissão para CREATE TABLE e operações de leitura/escrita nessa tabela.

O servidor:
- Entrega front-end/dist em /.
- Aceita /api e mantém compatibilidade com as rotas locais antigas.
- Usa cookies HttpOnly, SameSite=Lax e Secure em produção.
- Confia no proxy imediatamente à frente da aplicação para reconhecer HTTPS.
- Armazena sessões no banco, com validade de 8 horas e limpeza periódica dos registros expirados.
- Limita login/cadastro a 30 tentativas por IP por janela em memória de até 15 minutos.

O limite de tentativas reinicia com o processo e não é compartilhado entre instâncias. O serviço gratuito é configurado para uma instância; não é uma proteção distribuída.

## Conferência final

Abra o endereço HTTPS mostrado pelo Render e teste:

1. Cadastro e login.
2. Salvar água, cardio e metas, atualizar a página e recuperar os valores.
3. Adicionar e remover refeições, conferir as calorias.
4. Criar e concluir tarefas.
5. Conferir o gráfico semanal.
6. Abrir no celular usando 4G/5G.
7. Fazer um redeploy e confirmar que a sessão ainda funciona dentro de sua validade.
8. Sair e conferir que a sessão foi encerrada.

O endpoint /health confirma que o processo HTTP está respondendo; não faz uma consulta ao banco a cada acesso. A inicialização verifica o banco ao preparar a tabela de sessões.

## Plano gratuito

O Render informa que o serviço Free adormece após 15 minutos sem tráfego e pode levar cerca de um minuto para iniciar no próximo acesso. Contas e registros permanecem no TiDB, assim como as sessões ainda válidas. O segredo da sessão deve permanecer igual entre reinícios.

Consulte as cotas atuais do Render e do TiDB nas respectivas contas. Este guia não ativa recursos pagos.

## Problemas comuns

| Sintoma | Verificação |
| --- | --- |
| Build não encontra package.json | Root Directory precisa estar vazio |
| vite: not found | Use --include=dev na instalação do frontend |
| Build do frontend ausente | Confira o Build Command completo |
| Erro ao criar sessions | Permissão CREATE TABLE e credenciais do banco |
| Login funciona localmente, mas não online | NODE_ENV=production, HTTPS e segredo configurado |
| Conexão com TiDB falha | Host, usuário completo, senha, porta e DB_SSL=true |
| Conta antiga não existe | Banco local e TiDB são bases independentes |

## Referências

- https://render.com/docs/deploy-node-express-app
- https://render.com/docs/web-services
- https://render.com/docs/free
- https://expressjs.com/en/resources/middleware/session/
