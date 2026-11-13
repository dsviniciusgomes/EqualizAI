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

---

## ⚙️ Configuração do frontend

Configure estas variáveis no ambiente de execução do Next.js:

* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`

O frontend usa essas variáveis para autenticar com o Supabase. Os lançamentos são enviados para `https://equalizai.onrender.com/lancamentos` com o token da sessão no cabeçalho `Authorization: Bearer`.

---

## 🗄️ Modelagem do Sistema

[![](https://mermaid.ink/img/pako:eNqVVF1v0zAU_SuWJ6QhtVubNv0IaFK7tmNoQFkKD7Q83MQ3rUUSF9sZG-t-DOIBiXd-wf4Y12kzpoGElqdr59xzj--59jWPlUAe8KWG9YrNRgu9yBl9T56wsbEyVYYhO1YaDRMUD1MVK1OB4hSMGWHCEq1yi7lgiUzTYK8V9bykUzNWq08Y7DVFG0Vvt6x_kcKuAm99WYtVqnSwlyTJs78YI4g__SFsNqJ-r3lH2Gh3e373cYQgd1y9yI_viesIryf6j-MS0Y4r8fvYiO64RL_bbXT-y3Wvx8cqW6scqXmuvyyUxmIGFeCdQb0_f2eK229aqo9PWb1-tDklsIYlslhlDNgMU9iwyXg-cR7Ux9SzQxZOB88jfXh0QkiizRW7aND2e9Qxph-DIKgMuy9nMi75z_FzIY28_XH7i0S9mM2mlPkyfPO6ZJy-CWfsUMLhWqsYjQFdtxpyAzGoDRuO50MyrlQxmJ6WGRMwlmI2vbIrlbviO2_v1zZFtJ3ABT-GDAQwgcydNJXL2595LIHGcERnMQte5bhvuNU8zi8IMdXUTUvAc4wxQhZaXcS20ChK_Rs2OJ2fKLVMkZ1gJnN5p3FZLuutA7-ekMkrpxLkPwpNURvnUXkpclOkFrayShrnyPlZ6Awo1hCBIVQqyd0NGw3n-3ebI7BlsO2oMnapMXx79tSVFVFV9kGLaFrO0SpNZpKlk7S4VNWvwWkpzh3S3Vpd0KFJlPOjguz0k-hE6gzI3e-qaikLIb1Qxk3Rg1kY2AJS-RWYIqRZRQq0YO-lod1NOZ28Ri-HFDygoljjGRK3W_Jrx7PgdoUZLnhAIdlQXNbLq0Ae5jeUuob8g1JZla1VsVzxIIHU0KpYC7A4kkCD8QdCTUF9rIrc8sAvGXhwzS954LW8A9_reh3Paza7DYpq_IoH7eZBt98qt_otup5t_6bGv5ZFGwc9v9Pzmn6_Q0ntjsuAwqrwKo-reigktfzV9o0sn8qb3wpLtCU?type=png)](https://mermaid.live/edit#pako:eNqVVF1v0zAU_SuWJ6QhtVubNv0IaFK7tmNoQFkKD7Q83MQ3rUUSF9sZG-t-DOIBiXd-wf4Y12kzpoGElqdr59xzj--59jWPlUAe8KWG9YrNRgu9yBl9T56wsbEyVYYhO1YaDRMUD1MVK1OB4hSMGWHCEq1yi7lgiUzTYK8V9bykUzNWq08Y7DVFG0Vvt6x_kcKuAm99WYtVqnSwlyTJs78YI4g__SFsNqJ-r3lH2Gh3e373cYQgd1y9yI_viesIryf6j-MS0Y4r8fvYiO64RL_bbXT-y3Wvx8cqW6scqXmuvyyUxmIGFeCdQb0_f2eK229aqo9PWb1-tDklsIYlslhlDNgMU9iwyXg-cR7Ux9SzQxZOB88jfXh0QkiizRW7aND2e9Qxph-DIKgMuy9nMi75z_FzIY28_XH7i0S9mM2mlPkyfPO6ZJy-CWfsUMLhWqsYjQFdtxpyAzGoDRuO50MyrlQxmJ6WGRMwlmI2vbIrlbviO2_v1zZFtJ3ABT-GDAQwgcydNJXL2595LIHGcERnMQte5bhvuNU8zi8IMdXUTUvAc4wxQhZaXcS20ChK_Rs2OJ2fKLVMkZ1gJnN5p3FZLuutA7-ekMkrpxLkPwpNURvnUXkpclOkFrayShrnyPlZ6Awo1hCBIVQqyd0NGw3n-3ebI7BlsO2oMnapMXx79tSVFVFV9kGLaFrO0SpNZpKlk7S4VNWvwWkpzh3S3Vpd0KFJlPOjguz0k-hE6gzI3e-qaikLIb1Qxk3Rg1kY2AJS-RWYIqRZRQq0YO-lod1NOZ28Ri-HFDygoljjGRK3W_Jrx7PgdoUZLnhAIdlQXNbLq0Ae5jeUuob8g1JZla1VsVzxIIHU0KpYC7A4kkCD8QdCTUF9rIrc8sAvGXhwzS954LW8A9_reh3Paza7DYpq_IoH7eZBt98qt_otup5t_6bGv5ZFGwc9v9Pzmn6_Q0ntjsuAwqrwKo-reigktfzV9o0sn8qb3wpLtCU)