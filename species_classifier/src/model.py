#!/usr/bin/env python3
"""
Definição e utilitários do modelo de classificação de espécies.

Este módulo contém:
1. Definição da arquitetura do modelo (ResNet50 modificada)
2. Funções para carregar e salvar modelos
3. Funções para extrair embeddings do modelo

Classes:
    SpeciesClassifier: Modelo para classificação de espécies baseado em ResNet50
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Union

import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models
from torchvision.transforms import Normalize


class SpeciesClassifier(nn.Module):
    """
    Modelo para classificação de espécies baseado em ResNet50 pré-treinado.
    
    Atributos:
        backbone: Rede ResNet50 sem a camada final
        fc: Camada final de classificação adaptada para o número de classes
        embedding_size: Tamanho do vetor de características (embeddings)
    """
    
    def __init__(self, num_classes: int, pretrained: bool = True):
        """
        Inicializa o modelo SpeciesClassifier.
        
        Args:
            num_classes: Número de classes a serem classificadas
            pretrained: Se True, usa pesos pré-treinados do ImageNet
        """
        super(SpeciesClassifier, self).__init__()
        
        # Carregar backbone ResNet50 pré-treinado
        # O resnet50 é usado por ter um bom equilíbrio entre performance e eficiência
        resnet = models.resnet50(pretrained=pretrained)
        
        # Remover a camada de classificação original
        self.backbone = nn.Sequential(*list(resnet.children())[:-1])
        
        # Tamanho do embedding (saída do backbone)
        self.embedding_size = 2048
        
        # Nova camada de classificação
        self.fc = nn.Linear(self.embedding_size, num_classes)
        
        # Normalização para pré-processamento (valores de média/std do ImageNet)
        self.input_norm = Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    
    def forward(self, x: torch.Tensor, return_embedding: bool = False) -> Union[torch.Tensor, Tuple[torch.Tensor, torch.Tensor]]:
        """
        Forward pass do modelo.
        
        Args:
            x: Tensor de entrada (batch de imagens)
            return_embedding: Se True, retorna também os embeddings
            
        Returns:
            Logits de classificação e embeddings (opcional)
        """
        # Normalizar entrada
        x = self.input_norm(x)
        
        # Passar pela backbone
        embedding = self.backbone(x)
        embedding = embedding.view(embedding.size(0), -1)
        
        # Classificação
        logits = self.fc(embedding)
        
        if return_embedding:
            return logits, embedding
        return logits
    
    def extract_embedding(self, x: torch.Tensor) -> torch.Tensor:
        """
        Extrai embeddings (features) do penúltimo layer.
        
        Args:
            x: Tensor de entrada (batch de imagens)
            
        Returns:
            Embeddings extraídos
        """
        # Normalizar entrada
        x = self.input_norm(x)
        
        # Extracao do embedding
        with torch.no_grad():
            embedding = self.backbone(x)
            embedding = embedding.view(embedding.size(0), -1)
        
        return embedding


def save_model(model: nn.Module, save_path: Path, class_to_idx: Dict[str, int]) -> None:
    """
    Salva o modelo treinado e o mapeamento de classes.
    
    Args:
        model: Modelo treinado
        save_path: Caminho para salvar o modelo
        class_to_idx: Dicionário mapeando nomes de classes para índices
    """
    # Criar diretório pai se não existir
    save_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Salvar estado do modelo
    torch.save({
        'model_state_dict': model.state_dict(),
        'class_to_idx': class_to_idx,
        'embedding_size': model.embedding_size,
        'num_classes': len(class_to_idx)
    }, save_path)
    
    # Salvar mapeamento de classes em formato JSON para fácil consulta
    class_mapping_path = save_path.parent / 'class_mapping.json'
    with open(class_mapping_path, 'w') as f:
        json.dump({
            'class_to_idx': class_to_idx,
            'idx_to_class': {str(idx): cls for cls, idx in class_to_idx.items()}
        }, f, indent=2)
    
    print(f"Modelo salvo em {save_path}")
    print(f"Mapeamento de classes salvo em {class_mapping_path}")


def load_model(model_path: Path, device: torch.device = torch.device('cpu')) -> Tuple[nn.Module, Dict[str, int]]:
    """
    Carrega um modelo salvo.
    
    Args:
        model_path: Caminho para o arquivo do modelo
        device: Dispositivo para carregar o modelo (CPU/GPU)
        
    Returns:
        Modelo carregado e mapeamento de classes
    """
    # Carregar checkpoint
    checkpoint = torch.load(model_path, map_location=device)
    
    # Recuperar informações do modelo
    class_to_idx = checkpoint['class_to_idx']
    num_classes = checkpoint['num_classes']
    
    # Inicializar modelo
    model = SpeciesClassifier(num_classes=num_classes, pretrained=False)
    
    # Carregar pesos
    model.load_state_dict(checkpoint['model_state_dict'])
    model.to(device)
    model.eval()
    
    return model, class_to_idx