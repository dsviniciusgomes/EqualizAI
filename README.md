# 💰 Sistema de Finanças Pessoais

> Uma aplicação moderna de controle financeiro pessoal focada em segurança de dados, isolamento de usuários em nível de banco de dados e arquitetura relacional robusta.

---

## 🚀 Sobre o Projeto

Este projeto foi desenvolvido para gerenciar receitas, despesas e fluxo financeiro pessoal com total privacidade. A aplicação utiliza o **Supabase** como backend-as-a-service, aplicando políticas estritas de segurança (*Row Level Security*) para garantir que os dados de cada usuário fiquem rigorosamente isolados.

---

## 🛠️ Tecnologias Utilizadas

* **Banco de Dados:** PostgreSQL (via Supabase)
* **Segurança:** RLS (Row Level Security), Políticas de Acesso Granulares, Chaves Estrangeiras Compostas
* **Controle de Versão:** Git & GitHub

## Integração com a API de IA

O front-end é uma aplicação Next.js. Configure `NEXT_PUBLIC_API_URL` como a URL base do FastAPI (por exemplo, `http://localhost:8000` no desenvolvimento e a URL publicada do backend na Vercel). A URL pode terminar em `/`; a aplicação normaliza essa barra antes de chamar `/ia/processar-transacao`.

No backend, `FRONTEND_ORIGINS` aceita uma lista de origens separadas por vírgula. Por padrão, são permitidos `localhost` e `127.0.0.1` nas portas 3000 e 5173, além de origens HTTPS de projetos `vercel.app`. Inclua o domínio de produção personalizado em `FRONTEND_ORIGINS`.

O endpoint recebe `{"texto":"Gastei 45 no mercado hoje"}` e retorna a extração da IA. Ele não grava o lançamento: a interface apresenta os dados para confirmação antes de adicioná-los. A chamada exige um token de sessão válido de uma conta aprovada.

O front-end envia o access token como `Authorization: Bearer` nas chamadas da API. O backend valida o JWT e a aprovação da conta; a listagem filtra pelo usuário autenticado, e a criação define `user_id` pelo usuário validado. As operações no Supabase usam esse JWT para que as políticas de RLS sejam aplicadas. O cliente não deve enviar `user_id` no corpo da requisição.

---

## ⚙️ Configuração do frontend

Configure estas variáveis no ambiente de execução do Next.js:

* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `NEXT_PUBLIC_API_URL` (URL base do FastAPI; em produção, configure a URL pública do backend)

O frontend usa as variáveis do Supabase para autenticar o usuário e envia as chamadas protegidas à API configurada, incluindo `/lancamentos` e `/ia/processar-transacao`, com o token da sessão no cabeçalho `Authorization: Bearer`.

Após login ou restauração da sessão, o frontend verifica `usuario_perfil.status`; somente contas com status `aprovado` acessam o painel.

---

## 🗄️ Modelagem do Sistema

[![](https://mermaid.ink/img/pako:eNqVVF1v0zAU_SuWJ6QhtVubNv0IaFK7tmNoQFkKD7Q83MQ3rUUSF9sZG-t-DOIBiXd-wf4Y12kzpoGElqdr59xzj--59jWPlUAe8KWG9YrNRgu9yBl9T56wsbEyVYYhO1YaDRMUD1MVK1OB4hSMGWHCEq1yi7lgiUzTYK8V9bykUzNWq08Y7DVFG0Vvt6x_kcKuAm99WYtVqnSwlyTJs78YI4g__SFsNqJ-r3lH2Gh3e373cYQgd1y9yI_viesIryf6j-MS0Y4r8fvYiO64RL_bbXT-y3Wvx8cqW6scqXmuvyyUxmIGFeCdQb0_f2eK229aqo9PWb1-tDklsIYlslhlDNgMU9iwyXg-cR7Ux9SzQxZOB88jfXh0QkiizRW7aND2e9Qxph-DIKgMuy9nMi75z_FzIY28_XH7i0S9mM2mlPkyfPO6ZJy-CWfsUMLhWqsYjQFdtxpyAzGoDRuO50MyrlQxmJ6WGRMwlmI2vbIrlbviO2_v1zZFtJ3ABT-GDAQwgcydNJXL2595LIHGcERnMQte5bhvuNU8zi8IMdXUTUvAc4wxQhZaXcS20ChK_Rs2OJ2fKLVMkZ1gJnN5p3FZLuutA7-ekMkrpxLkPwpNURvnUXkpclOkFrayShrnyPlZ6Awo1hCBIVQqyd0NGw3n-3ebI7BlsO2oMnapMXx79tSVFVFV9kGLaFrO0SpNZpKlk7S4VNWvwWkpzh3S3Vpd0KFJlPOjguz0k-hE6gzI3e-qaikLIb1Qxk3Rg1kY2AJS-RWYIqRZRQq0YO-lod1NOZ28Ri-HFDygoljjGRK3W_Jrx7PgdoUZLnhAIdlQXNbLq0Ae5jeUuob8g1JZla1VsVzxIIHU0KpYC7A4kkCD8QdCTUF9rIrc8sAvGXhwzS954LW8A9_reh3Paza7DYpq_IoH7eZBt98qt_otup5t_6bGv5ZFGwc9v9Pzmn6_Q0ntjsuAwqrwKo-reigktfzV9o0sn8qb3wpLtCU?type=png)](https://mermaid.live/edit#pako:eNqVVF1v0zAU_SuWJ6QhtVubNv0IaFK7tmNoQFkKD7Q83MQ3rUUSF9sZG-t-DOIBiXd-wf4Y12kzpoGElqdr59xzj--59jWPlUAe8KWG9YrNRgu9yBl9T56wsbEyVYYhO1YaDRMUD1MVK1OB4hSMGWHCEq1yi7lgiUzTYK8V9bykUzNWq08Y7DVFG0Vvt6x_kcKuAm99WYtVqnSwlyTJs78YI4g__SFsNqJ-r3lH2Gh3e373cYQgd1y9yI_viesIryf6j-MS0Y4r8fvYiO64RL_bbXT-y3Wvx8cqW6scqXmuvyyUxmIGFeCdQb0_f2eK229aqo9PWb1-tDklsIYlslhlDNgMU9iwyXg-cR7Ux9SzQxZOB88jfXh0QkiizRW7aND2e9Qxph-DIKgMuy9nMi75z_FzIY28_XH7i0S9mM2mlPkyfPO6ZJy-CWfsUMLhWqsYjQFdtxpyAzGoDRuO50MyrlQxmJ6WGRMwlmI2vbIrlbviO2_v1zZFtJ3ABT-GDAQwgcydNJXL2595LIHGcERnMQte5bhvuNU8zi8IMdXUTUvAc4wxQhZaXcS20ChK_Rs2OJ2fKLVMkZ1gJnN5p3FZLuutA7-ekMkrpxLkPwpNURvnUXkpclOkFrayShrnyPlZ6Awo1hCBIVQqyd0NGw3n-3ebI7BlsO2oMnapMXx79tSVFVFV9kGLaFrO0SpNZpKlk7S4VNWvwWkpzh3S3Vpd0KFJlPOjguz0k-hE6gzI3e-qaikLIb1Qxk3Rg1kY2AJS-RWYIqRZRQq0YO-lod1NOZ28Ri-HFDygoljjGRK3W_Jrx7PgdoUZLnhAIdlQXNbLq0Ae5jeUuob8g1JZla1VsVzxIIHU0KpYC7A4kkCD8QdCTUF9rIrc8sAvGXhwzS954LW8A9_reh3Paza7DYpq_IoH7eZBt98qt_otup5t_6bGv5ZFGwc9v9Pzmn6_Q0ntjsuAwqrwKo-reigktfzV9o0sn8qb3wpLtCU)