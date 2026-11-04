# Validação da atualização

- Frontend: `npm run lint` e `npm run build` passaram.
- Backend: sintaxe validada com `node --check`; `npm test` testa autenticação obrigatória, datas inválidas, limites de metas, calorias e parâmetros de SQL, com pool de banco simulado.
- Navegador Chromium com respostas da API simuladas: login/logout, metas de 8.000 ml e 120 min, salvamento e recuperação após recarregar, porção 150 g × 130 kcal/100 g = 195 kcal, exclusão descontando calorias, estimativa 2.009 kcal aplicada como meta, layouts de 360/390/768 px sem overflow horizontal e nenhuma exceção React.
- Inspeção visual em desktop e celular.
- Não foi feita conexão com o MySQL do usuário nem publicação externa. Execute `npm run migrate` no backend local e teste a persistência real conforme LEIA-PRIMEIRO.md.
