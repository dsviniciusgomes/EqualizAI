import os
import json
from datetime import date
from pathlib import Path
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google import genai
from google.genai import types
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

@app.get("/")
def home():
    return {"status": "EcomizAI API rodando com sucesso!"}


# Rota padrão para cadastro manual de lançamentos
@app.post("/lancamentos")
def criar_lancamento(lancamento: LancamentoCreate):
    try:
        dados_dict = lancamento.model_dump()
        response = supabase.table("lancamento").insert(dados_dict).execute()
        return {
            "mensagem": "Lançamento cadastrado com sucesso!",
            "dados": response.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#Endpoint IA

ai_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class TransacaoTexto(BaseModel):
    texto: str
    user_id: str

# Rota inteligente com IA de verdade (Gemini)
@app.post("/ia/processar-transacao")
def processar_transacao_com_ia(dados: TransacaoTexto):
    try:
        # 1. Prompt estruturado para a IA extrair os dados da frase
        prompt = f"""
        Analise a seguinte frase de despesa/gasto financeiro e extraia as informações solicitadas:
        Frase: "{dados.texto}"
        
        Retorne estritamente um JSON contendo:
        - description: Uma descrição limpa e curta do gasto (ex: "Açaí", "Supermercado", "Uber", "Farmácia").
        - amount: O valor numérico da transação (ex: 25.50), apenas o número float.
        - date: A data no formato YYYY-MM-DD se mencionada na frase, caso contrário use exatamente a data de hoje: {date.today()}.
        """

        # 2. Chamada real ao modelo Gemini com Structured Output (JSON)
        response = ai_client.models.generate_content(
            model='gemini-3.8-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        
        # Converte a resposta de texto da IA em um dicionário Python
        dados_ia = json.loads(response.text)

        # 3. Mapeia os dados extraídos pela IA para a estrutura do banco Supabase
        novo_lancamento = {
            "description": dados_ia.get("description", dados.texto),
            "amount": float(dados_ia.get("amount", 0.0)),
            "date": dados_ia.get("date", str(date.today())),
            "user_id": dados.user_id,
            "categoria_id": None,
            "favorecido_id": None,
            "banco_id": None,
            "forma_pagamento_id": None
        }

        # 4. Salva o registro processado direto no Supabase
        db_response = supabase.table("lancamento").insert(novo_lancamento).execute()

        return {
            "mensagem": "Texto interpretado pela IA e salvo com sucesso!",
            "extracao_ia": dados_ia,
            "resposta_supabase": db_response.data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))