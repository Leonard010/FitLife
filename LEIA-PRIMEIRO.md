# FitLife — atualização visual e funcional

## O que mudou

- Login e cadastro em uma tela própria, dashboard exclusivo após entrar, abertura com logo vetorial e respeito à preferência de movimento reduzido.
- Layout adaptado para celular, tablet e desktop, com navegação, campos e botões de toque.
- Água: acompanhamento e meta até 8.000 ml. Cardio: acompanhamento e meta até 120 minutos.
- Meta diária de calorias editável; consumo calculado a partir das refeições. Ao remover a refeição, suas calorias saem do total.
- Calculadora de porção: gramas consumidas × kcal por 100 g ÷ 100. Os valores devem vir do rótulo ou de uma fonte nutricional; não há reconhecimento nem busca automática de alimentos.
- Estimativa diária de manutenção: fórmula Mifflin–St Jeor e multiplicadores aproximados de atividade. Pode ser aplicada à meta do dia.
- Gráfico semanal de água, cardio ou calorias, com tabela acessível e atualização após salvar/cadastrar/remover.
- Contas, datas e registros existentes preservados. Água, cardio e metas exigem “Salvar meu dia”; refeições e tarefas salvam a cada ação.

## 1. Faça uma cópia de segurança

Mantenha a pasta original e faça backup do banco pelo Workbench (Server → Data Export). Não apague o banco `fitlife`. Esta atualização usa o banco que você já criou nas etapas anteriores; não é uma instalação de banco do zero.

## 2. Use a nova pasta

Extraia o ZIP em uma pasta nova, por exemplo `FitLife-novo`. Dentro dela há `front-end` e `back-end`.
Copie o arquivo `.env` do seu backend antigo para o `back-end` novo. Ele não está neste ZIP.
O `.env.example` é só um modelo — não substitua suas credenciais por ele.
Pare os servidores antigos com Ctrl+C antes de iniciar a versão nova, evitando conflito nas portas 3002 e 5173.

## 3. Atualize o banco sem apagar registros

Abra um terminal dentro de `back-end` e execute:

```powershell
npm ci
npm run migrate
npm run dev
```

A migração adiciona somente `meals.calories`, `daily_records.cardio_goal_minutes` e `daily_records.calorie_goal`, se ainda não existirem. Pode ser executada novamente. As refeições antigas terão 0 kcal até você registrar calorias em novos itens; metas antigas recebem 30 minutos de cardio e 2.000 kcal.
Se a migração falhar, pare e confira a mensagem antes de continuar. O usuário do MySQL precisa ter permissão de ALTER TABLE.

## 4. Inicie o frontend

Em outro terminal, dentro de `front-end`:

```powershell
npm ci
npm run dev
```

Abra http://localhost:5173 e entre com sua conta existente. A API é acessada pelo proxy `/api`, que aponta para o backend em 3002. Não é necessário alterar todos os endereços para usar o celular.

## 5. Teste no celular pelo Wi-Fi

- Computador e celular precisam estar na mesma rede Wi-Fi (uma rede de convidados pode impedir o acesso).
- No PowerShell, execute `ipconfig` e encontre o IPv4 do adaptador conectado, por exemplo `192.168.1.20`.
- Com os dois terminais rodando, abra no celular `http://192.168.1.20:5173`, trocando pelo IP real.
- Se o Windows solicitar, permita o Node.js somente na rede privada. Não abra portas no roteador.
- Não use `localhost` no celular: isso aponta para o próprio telefone.
- O computador precisa ficar ligado e os servidores ativos. O MySQL não precisa ser exposto na rede.

## Funcionamento

Escolha a data, ajuste água/cardio/metas e clique em “Salvar meu dia”. Trocar a data com alterações não salvas pede confirmação. Durante requisições, os controles são bloqueados. A calculadora aplica a meta na tela; use “Salvar meu dia” para gravá-la. Refeições não alteram a meta: alteram o consumo e o saldo restante. As metas são por dia, não uma configuração global para dias futuros.

A abertura aparece durante a consulta da sessão. No modo de movimento reduzido do sistema, a animação é desativada.

## Calculadora: contexto

A estimativa usa a equação simplificada de Mifflin–St Jeor para adultos de 19–78 anos:
- Masculino: 10 × peso(kg) + 6,25 × altura(cm) − 5 × idade + 5.
- Feminino: 10 × peso(kg) + 6,25 × altura(cm) − 5 × idade − 161.
- Repouso × atividade: 1,20 / 1,375 / 1,55 / 1,725, conforme seleção. O multiplicador é uma aproximação prática e não foi validado individualmente.
Fonte da equação: https://pubmed.ncbi.nlm.nih.gov/2305711/

É uma estimativa de manutenção, não uma prescrição para emagrecimento ou ganho de peso. Os limites de 8 L e 120 min são limites do produto, não metas recomendadas. Use metas adequadas ao seu contexto e orientação profissional quando necessário.

## Verificação

```powershell
# Dentro de front-end
npm run lint
npm run build
```

Teste duas contas e dois dias diferentes, persistência após F5/reinício, adicionar/remover calorias e marcar/remover tarefas. Confira também uma porção de 150 g com 130 kcal/100 g: resultado 195 kcal.

## Hospedagem

A configuração de produção foi acrescentada ao backend: frontend e API no mesmo endereço, cookies HTTPS e sessões armazenadas no banco. Para publicar e testar, siga [DEPLOY.md](DEPLOY.md). O roteiro de instalação local acima continua válido. Não defina NODE_ENV=production no ambiente local com Vite.
