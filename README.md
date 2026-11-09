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

## 🗄️ Modelagem do Banco de Dados

O banco de dados foi estruturado separando catálogos globais de dados transacionais e privados por usuário:

1. **`banco`** (Global): Catálogo de instituições financeiras (leitura pública para autenticados).
2. **`forma_pagamento`** (Global): Métodos de pagamento padrão (*Pix*, *Dinheiro*, *Boleto*, *Cartão*).
3. **`categoria`** (Privada): Classificação de receitas e despesas vinculada ao dono (`user_id`).
4. **`favorecido`** (Privada): Cadastro de beneficiários e pagadores restrito ao usuário.
5. **`lancamento`** (Privada
