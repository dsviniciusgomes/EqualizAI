import os
import json
import logging
from datetime import date
from pathlib import Path
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from typing import Literal, Optional
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

frontend_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_origin_regex=r"https://([a-z0-9-]+\.)*vercel\.app",
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Modelo Pydantic baseado exatamente nas colunas da sua tabela 'lancamento'
class LancamentoCreate(BaseModel):
    description: Optional[str] = None
    amount: float = Field(gt=0)
    date: Optional[str] = "CURRENT_DATE"
    tipo: Literal["receita", "despesa"]
    categoria_id: Optional[int] = None
    favorecido_id: Optional[int] = None
    banco_id: Optional[int] = None
    forma_pagamento_id: Optional[int] = None

bearer_scheme = HTTPBearer(auto_error=False)

def get_authenticated_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
):
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Token de autenticação obrigatório.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        auth_response = supabase.auth.get_user(credentials.credentials)
        if auth_response.user is None:
            raise ValueError("O token não está associado a um usuário.")
        return auth_response.user, credentials.credentials
    except Exception as exc:
        logging.info("Requisição rejeitada: token Supabase inválido ou expirado.")
        raise HTTPException(
            status_code=401,
            detail="Token de autenticação inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

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

# Rota POST: insere o lançamento no contexto autenticado do usuário
@app.post("/lancamentos")
def create_lancamento(
    lancamento: LancamentoCreate,
    authenticated: tuple = Depends(get_authenticated_user),
):
    user, access_token = authenticated
    data = lancamento.model_dump(exclude_none=True)
    data["user_id"] = user.id

    try:
        user_supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        user_supabase.postgrest.auth(access_token)
        response = user_supabase.table("lancamento").insert(data).execute()
        return {"message": "Lançamento cadastrado com sucesso!", "data": response.data}
    except Exception as e:
        logging.exception("Falha ao inserir lançamento para o usuário autenticado.")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def home():
    return {"status": "EcomizAI API rodando com sucesso!"}


#Endpoint IA

ai_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class TransacaoTexto(BaseModel):
    texto: str = Field(min_length=1)

class ExtracaoTransacao(BaseModel):
    description: str = Field(min_length=1)
    amount: float = Field(gt=0)
    date: date

# Rota inteligente com IA de verdade (Gemini)
@app.post("/ia/processar-transacao")
def processar_transacao_com_ia(dados: TransacaoTexto):
    try:
        # 1. Prompt estruturado para a IA extrair os dados da frase
        prompt = f"""
        Analise a seguinte frase de movimentação financeira, que pode ser receita ou despesa,
        e extraia as informações solicitadas:
        Frase: "{dados.texto}"
        
        Retorne estritamente um JSON contendo:
        - description: Uma descrição limpa e curta do gasto (ex: "Açaí", "Supermercado", "Uber", "Farmácia").
        - amount: O valor numérico positivo da transação (ex: 25.50), apenas o número.
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
        if not response.text:
            raise ValueError("A IA retornou uma resposta vazia.")
        dados_ia = ExtracaoTransacao.model_validate(json.loads(response.text))

        return {
            "mensagem": "Texto interpretado pela IA com sucesso.",
            "extracao_ia": dados_ia.model_dump(mode="json"),
        }

    except Exception as e:
        logging.exception("Falha ao processar transação com IA")
        raise HTTPException(status_code=502, detail="Não foi possível interpretar a transação com a IA.") from e