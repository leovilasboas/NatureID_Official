#!/usr/bin/env python3
"""
API FastAPI para servir modelo de classificação de espécies.

Esta API fornece endpoints para:
1. Receber imagens e retornar previsões do modelo 
2. Acessar informações sobre espécies disponíveis no modelo
3. Opcionalmente buscar imagens similares por embeddings

Para iniciar:
    uvicorn app:app --host 0.0.0.0 --port 8000
"""

import os
import json
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Union

import torch
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException, Query, Form, Body
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import faiss
from PIL import Image
from pydantic import BaseModel

# Importar módulos locais
from src.model import SpeciesClassifier, load_model
from src.utils import (
    load_image_from_bytes, preprocess_image, get_top_k_predictions, 
    format_prediction_result, create_visualization
)


# Classes de modelo para API
class PredictionResponse(BaseModel):
    """Resposta formatada de previsão."""
    predictions: List[Dict[str, Any]]
    top_match: str
    confidence: float
    
    
class SimilarityRequest(BaseModel):
    """Requisição para busca por similaridade."""
    image_id: str
    top_k: int = 5


# Inicializar aplicação FastAPI
app = FastAPI(
    title="API de Classificação de Espécies",
    description="API para classificação de imagens de plantas e animais",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variáveis globais para armazenar o modelo e informações relacionadas
model = None
class_to_idx = None
idx_to_class = None
device = None

# Variáveis para busca por similaridade (FAISS)
embedding_index = None
image_ids = None


@app.on_event("startup")
async def startup_event():
    """Carrega o modelo e inicializa componentes na inicialização."""
    global model, class_to_idx, idx_to_class, device, embedding_index, image_ids
    
    # Determinar dispositivo
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Usando dispositivo: {device}")
    
    # Caminhos
    model_dir = Path("models")
    model_path = model_dir / "species_classifier.pth"
    
    # Verificar se o modelo existe
    if not model_path.exists():
        print(f"Aviso: Modelo não encontrado em {model_path}. A API irá falhar até que um modelo seja fornecido.")
        return
    
    try:
        # Carregar modelo
        model, class_to_idx = load_model(model_path, device)
        idx_to_class = {idx: cls for cls, idx in class_to_idx.items()}
        print(f"Modelo carregado com {len(class_to_idx)} classes")
        
        # Carregar índice FAISS se existir
        embedding_path = model_dir / "embeddings.index"
        mapping_path = model_dir / "embedding_mapping.json"
        
        if embedding_path.exists() and mapping_path.exists():
            # Carregar índice FAISS
            embedding_index = faiss.read_index(str(embedding_path))
            
            # Carregar mapeamento de IDs
            with open(mapping_path, 'r') as f:
                embedding_mapping = json.load(f)
                image_ids = embedding_mapping["image_ids"]
                
            print(f"Índice de embeddings carregado com {embedding_index.ntotal} imagens")
    except Exception as e:
        print(f"Erro ao inicializar modelo: {str(e)}")


@app.get("/")
async def root():
    """Verifica se a API está funcionando."""
    return {"status": "ok", "message": "API de classificação de espécies está funcionando"}


@app.get("/species")
async def list_species():
    """Lista todas as espécies disponíveis no modelo."""
    if not model:
        raise HTTPException(status_code=503, detail="Modelo ainda não carregado")
    
    species_list = sorted([name.replace('_', ' ') for name in class_to_idx.keys()])
    return {"species_count": len(species_list), "species": species_list}


@app.post("/predict", response_model=PredictionResponse)
async def predict_species(
    file: UploadFile = File(...),
    top_k: int = Query(5, description="Número de predições a retornar")
):
    """
    Endpoint para receber uma imagem e retornar previsões do modelo.
    
    Args:
        file: Arquivo de imagem enviado pelo cliente
        top_k: Número de previsões a retornar
        
    Returns:
        Resposta formatada com predições
    """
    if not model:
        raise HTTPException(status_code=503, detail="Modelo ainda não carregado")
    
    try:
        # Carregar imagem
        contents = await file.read()
        image = load_image_from_bytes(contents)
        
        # Pré-processar imagem
        img_tensor = preprocess_image(image)
        img_tensor = img_tensor.to(device)
        
        # Inferência
        with torch.no_grad():
            logits = model(img_tensor)
        
        # Obter top-k predições
        predictions = get_top_k_predictions(logits, class_to_idx, k=top_k)
        
        # Formatar resultado
        result = format_prediction_result(predictions)
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na predição: {str(e)}")


@app.post("/embeddings", response_model=Dict[str, Any])
async def extract_embeddings(
    file: UploadFile = File(...),
):
    """
    Endpoint para extrair embeddings de uma imagem.
    
    Args:
        file: Arquivo de imagem enviado pelo cliente
        
    Returns:
        Embeddings extraídos
    """
    if not model:
        raise HTTPException(status_code=503, detail="Modelo ainda não carregado")
    
    try:
        # Carregar imagem
        contents = await file.read()
        image = load_image_from_bytes(contents)
        
        # Pré-processar imagem
        img_tensor = preprocess_image(image)
        img_tensor = img_tensor.to(device)
        
        # Extrair embedding
        with torch.no_grad():
            _, embedding = model(img_tensor, return_embedding=True)
        
        # Converter para lista
        embedding_list = embedding.cpu().numpy().tolist()[0]
        
        return {
            "embedding_size": len(embedding_list),
            "embedding": embedding_list
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao extrair embeddings: {str(e)}")


@app.post("/similar", response_model=Dict[str, Any])
async def find_similar_species(
    file: UploadFile = File(...),
    top_k: int = Query(5, description="Número de imagens similares a retornar")
):
    """
    Endpoint para encontrar imagens similares usando embeddings.
    
    Args:
        file: Arquivo de imagem enviado pelo cliente
        top_k: Número de imagens similares a retornar
        
    Returns:
        Imagens mais similares
    """
    if not model or not embedding_index or not image_ids:
        raise HTTPException(
            status_code=503, 
            detail="Modelo ou índice de embeddings não carregado"
        )
    
    try:
        # Carregar imagem
        contents = await file.read()
        image = load_image_from_bytes(contents)
        
        # Pré-processar imagem
        img_tensor = preprocess_image(image)
        img_tensor = img_tensor.to(device)
        
        # Extrair embedding
        with torch.no_grad():
            _, embedding = model(img_tensor, return_embedding=True)
        
        # Converter para formato numpy
        query_vector = embedding.cpu().numpy().astype('float32')
        
        # Buscar imagens similares
        distances, indices = embedding_index.search(query_vector, top_k)
        
        # Obter IDs de imagens correspondentes
        similar_images = []
        for i, idx in enumerate(indices[0]):
            if idx < len(image_ids):
                similar_images.append({
                    "image_id": image_ids[idx],
                    "distance": float(distances[0][i]),
                    "similarity": float(1.0 / (1.0 + distances[0][i]))
                })
        
        return {
            "similar_count": len(similar_images),
            "similar_images": similar_images
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar imagens similares: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)