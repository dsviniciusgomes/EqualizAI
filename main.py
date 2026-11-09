import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

# Aponta explicitamente para o .env na mesma pasta do main.py
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Validação defensiva: se ainda vier vazio, avisa no terminal
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("ERRO CRÍTICO: As variáveis do Supabase não foram encontradas no .env!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(
    title="AI Finance API",
    description="API de controle financeiro integrada ao Supabase (Tabela: lancamento)",
    version="1.0.0"
)

# Modelo Pydantic baseado exatamente nas colunas da sua tabela 'lancamento'
class LancamentoCreate(BaseModel):
    description: Optional[str] = None
    amount: float
    date: Optional[str] = "CURRENT_DATE"
    user_id: str  # UUID do usuário no Supabase Auth
    categoria_id: Optional[int] = None
    favorecido_id: Optional[int] = None
    banco_id: Optional[int] = None
    forma_pagamento_id: Optional[int] = None

@app.get("/")
def read_root():
    return {"status": "API rodando perfeitamente!", "projeto": "AI Finance Builder"}

# Rota GET: Lista todos os lançamentos
@app.get("/lancamentos")
def get_lancamentos():
    try:
        response = supabase.table("lancamento").select("*").execute()
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Rota POST: Insere um novo lançamento respeitando o seu banco
@app.post("/lancamentos")
def create_lancamento(lancamento: LancamentoCreate):
    try:
        data = {
            "description": lancamento.description,
            "amount": lancamento.amount,
            "date": lancamento.date,
            "user_id": lancamento.user_id,
            "categoria_id": lancamento.categoria_id,
            "favorecido_id": lancamento.favorecido_id,
            "banco_id": lancamento.banco_id,
            "forma_pagamento_id": lancamento.forma_pagamento_id
        }
        # Remove campos nulos/opcionais se necessário, mas o supabase lida bem com None
        response = supabase.table("lancamento").insert(data).execute()
        return {"message": "Lançamento cadastrado com sucesso!", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))