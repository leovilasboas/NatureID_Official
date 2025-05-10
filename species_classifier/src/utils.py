#!/usr/bin/env python3
"""
Utilitários para o pipeline de classificação de espécies.

Este módulo contém:
1. Funções de processamento de imagens 
2. Utilitários de visualização
3. Funções para manipulação de caminhos e arquivos
"""

import os
import csv
import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any, Union
from PIL import Image
import io
import base64
import numpy as np
import matplotlib.pyplot as plt
import torch
import torchvision.transforms as transforms


def load_image_from_file(image_path: str) -> Image.Image:
    """
    Carrega uma imagem a partir de um arquivo.
    
    Args:
        image_path: Caminho para o arquivo de imagem
        
    Returns:
        Imagem carregada
    """
    try:
        image = Image.open(image_path).convert('RGB')
        return image
    except Exception as e:
        raise ValueError(f"Erro ao carregar imagem de {image_path}: {str(e)}")


def load_image_from_bytes(image_bytes: bytes) -> Image.Image:
    """
    Carrega uma imagem a partir de bytes.
    
    Args:
        image_bytes: Bytes da imagem
        
    Returns:
        Imagem carregada
    """
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        return image
    except Exception as e:
        raise ValueError(f"Erro ao carregar imagem de bytes: {str(e)}")


def load_image_from_base64(base64_str: str) -> Image.Image:
    """
    Carrega uma imagem a partir de uma string base64.
    
    Args:
        base64_str: String base64 da imagem
        
    Returns:
        Imagem carregada
    """
    # Remover cabeçalho de dados URI se presente
    if ',' in base64_str:
        base64_str = base64_str.split(',', 1)[1]
    
    try:
        image_bytes = base64.b64decode(base64_str)
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        return image
    except Exception as e:
        raise ValueError(f"Erro ao decodificar imagem base64: {str(e)}")


def preprocess_image(
    image: Image.Image, 
    image_size: Tuple[int, int] = (224, 224)
) -> torch.Tensor:
    """
    Pré-processa uma imagem para inferência no modelo.
    
    Args:
        image: Imagem a ser processada
        image_size: Tamanho alvo para redimensionamento
        
    Returns:
        Tensor pré-processado da imagem
    """
    # Transformações de pré-processamento
    preprocess = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor()
    ])
    
    # Aplicar transformações
    img_tensor = preprocess(image)
    
    # Adicionar dimensão de batch
    img_tensor = img_tensor.unsqueeze(0)
    
    return img_tensor


def get_top_k_predictions(
    logits: torch.Tensor, 
    class_to_idx: Dict[str, int], 
    k: int = 5
) -> List[Tuple[str, float]]:
    """
    Obter as top-k previsões a partir dos logits do modelo.
    
    Args:
        logits: Saída do modelo (logits)
        class_to_idx: Mapeamento de classes para índices
        k: Número de top previsões a retornar
        
    Returns:
        Lista de tuplas (classe, probabilidade) ordenadas por probabilidade
    """
    # Aplicar softmax para obter probabilidades
    probs = torch.nn.functional.softmax(logits, dim=1)[0]
    
    # Obter as top-k predições
    top_k_probs, top_k_indices = torch.topk(probs, k)
    
    # Converter tensores para listas
    top_k_probs = top_k_probs.cpu().detach().numpy().tolist()
    top_k_indices = top_k_indices.cpu().detach().numpy().tolist()
    
    # Mapear índices para nomes de classes
    idx_to_class = {idx: cls for cls, idx in class_to_idx.items()}
    top_k_classes = [idx_to_class[idx] for idx in top_k_indices]
    
    # Retornar lista de tuplas (classe, probabilidade)
    return list(zip(top_k_classes, top_k_probs))


def format_prediction_result(
    predictions: List[Tuple[str, float]],
    scientific_names: bool = True
) -> Dict[str, Any]:
    """
    Formata os resultados de previsão em um formato adequado para API.
    
    Args:
        predictions: Lista de tuplas (classe, probabilidade)
        scientific_names: Se True, retorna nomes científicos, caso contrário, nomes comuns
        
    Returns:
        Dicionário formatado para resposta da API
    """
    results = {
        "predictions": [
            {
                "scientific_name": cls.replace('_', ' '),
                "probability": round(prob * 100, 2)
            }
            for cls, prob in predictions
        ],
        "top_match": predictions[0][0].replace('_', ' '),
        "confidence": round(predictions[0][1] * 100, 2)
    }
    
    return results


def create_visualization(
    image: Image.Image,
    predictions: List[Tuple[str, float]],
    save_path: Optional[str] = None
) -> Optional[plt.Figure]:
    """
    Cria uma visualização da imagem com suas previsões.
    
    Args:
        image: Imagem original
        predictions: Lista de tuplas (classe, probabilidade)
        save_path: Se fornecido, salva a visualização neste caminho
        
    Returns:
        Figura matplotlib se save_path for None, caso contrário None
    """
    # Criar figura
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6))
    
    # Mostrar imagem
    ax1.imshow(np.array(image))
    ax1.set_title("Imagem de entrada")
    ax1.axis('off')
    
    # Criar barplot de previsões
    classes = [cls.replace('_', ' ') for cls, _ in predictions]
    probabilities = [prob for _, prob in predictions]
    
    y_pos = np.arange(len(classes))
    
    ax2.barh(y_pos, probabilities, align='center')
    ax2.set_yticks(y_pos)
    ax2.set_yticklabels(classes)
    ax2.invert_yaxis()  # Ordenar de cima para baixo
    ax2.set_xlabel('Probabilidade')
    ax2.set_title('Top Predições')
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path)
        plt.close(fig)
        return None
    
    return fig