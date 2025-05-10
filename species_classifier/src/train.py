#!/usr/bin/env python3
"""
Script para treinar o modelo de classificação de espécies.

Este script:
1. Carrega conjuntos de dados de treino e validação
2. Configura e inicializa o modelo
3. Treina o modelo por um número especificado de épocas
4. Avalia o modelo no conjunto de validação ao final de cada época
5. Salva o melhor modelo baseado na acurácia de validação

Uso:
    python train.py --epochs 30 --batch_size 32 --learning_rate 0.0001
"""

import os
import time
import argparse
import random
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from tqdm import tqdm

from model import SpeciesClassifier, save_model


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Treinar modelo de classificação de espécies')
    parser.add_argument('--data_dir', type=str, default='../data',
                        help='Diretório contendo os dados processados')
    parser.add_argument('--model_dir', type=str, default='../models',
                        help='Diretório para salvar o modelo treinado')
    parser.add_argument('--batch_size', type=int, default=32,
                        help='Tamanho do batch')
    parser.add_argument('--epochs', type=int, default=30,
                        help='Número de épocas para treinar')
    parser.add_argument('--learning_rate', type=float, default=0.0001,
                        help='Taxa de aprendizado')
    parser.add_argument('--patience', type=int, default=5,
                        help='Paciência para early stopping')
    parser.add_argument('--weight_decay', type=float, default=0.0001,
                        help='Regularização L2')
    parser.add_argument('--num_workers', type=int, default=4,
                        help='Número de workers para DataLoader')
    parser.add_argument('--seed', type=int, default=42,
                        help='Seed para reprodutibilidade')
    return parser.parse_args()


def set_seed(seed: int) -> None:
    """
    Define seeds para garantir reprodutibilidade.
    
    Args:
        seed: Valor da seed
    """
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False


def get_data_transforms() -> Dict[str, transforms.Compose]:
    """
    Define transformações para os conjuntos de treino e validação.
    
    Returns:
        Dicionário com transformações para treino e validação
    """
    # Transformações comuns
    normalize = transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
    
    # Transformações de treino (com augmentation)
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(20),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        normalize
    ])
    
    # Transformações de validação
    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        normalize
    ])
    
    return {
        'train': train_transform,
        'val': val_transform
    }


def load_datasets(data_dir: Path, transforms_dict: Dict[str, transforms.Compose]) -> Tuple[datasets.ImageFolder, datasets.ImageFolder]:
    """
    Carrega conjuntos de dados de treino e validação.
    
    Args:
        data_dir: Diretório contendo os dados processados
        transforms_dict: Dicionário com transformações para treino e validação
        
    Returns:
        Conjuntos de dados de treino e validação
    """
    # Caminhos dos diretórios
    train_dir = data_dir / "processed" / "train"
    val_dir = data_dir / "processed" / "val"
    
    # Verificar se diretórios existem
    if not train_dir.exists() or not val_dir.exists():
        raise FileNotFoundError(f"Diretórios de dados não encontrados: {train_dir}, {val_dir}")
    
    # Carregar datasets
    train_dataset = datasets.ImageFolder(
        root=str(train_dir),
        transform=transforms_dict['train']
    )
    
    val_dataset = datasets.ImageFolder(
        root=str(val_dir),
        transform=transforms_dict['val']
    )
    
    print(f"Carregadas {len(train_dataset)} imagens de treino")
    print(f"Carregadas {len(val_dataset)} imagens de validação")
    print(f"Número de classes: {len(train_dataset.classes)}")
    
    return train_dataset, val_dataset


def create_dataloaders(
    train_dataset: datasets.ImageFolder,
    val_dataset: datasets.ImageFolder,
    batch_size: int,
    num_workers: int
) -> Tuple[DataLoader, DataLoader]:
    """
    Cria DataLoaders para treino e validação.
    
    Args:
        train_dataset: Conjunto de dados de treino
        val_dataset: Conjunto de dados de validação
        batch_size: Tamanho do batch
        num_workers: Número de workers
        
    Returns:
        DataLoaders para treino e validação
    """
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True
    )
    
    return train_loader, val_loader


def train_one_epoch(
    model: nn.Module,
    train_loader: DataLoader,
    criterion: nn.Module,
    optimizer: optim.Optimizer,
    device: torch.device
) -> float:
    """
    Treina o modelo por uma época.
    
    Args:
        model: Modelo a ser treinado
        train_loader: DataLoader para dados de treino
        criterion: Função de perda
        optimizer: Otimizador
        device: Dispositivo (CPU/GPU)
        
    Returns:
        Perda média para a época
    """
    model.train()
    running_loss = 0.0
    
    # Loop de treinamento
    for inputs, labels in tqdm(train_loader, desc="Treinando", leave=False):
        # Mover dados para o dispositivo
        inputs = inputs.to(device)
        labels = labels.to(device)
        
        # Zerar gradientes
        optimizer.zero_grad()
        
        # Forward pass
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        
        # Backward pass e otimização
        loss.backward()
        optimizer.step()
        
        # Acumular estatísticas
        running_loss += loss.item() * inputs.size(0)
    
    # Calcular perda média
    epoch_loss = running_loss / len(train_loader.dataset)
    
    return epoch_loss


def evaluate(
    model: nn.Module,
    val_loader: DataLoader,
    criterion: nn.Module,
    device: torch.device
) -> Tuple[float, float]:
    """
    Avalia o modelo no conjunto de validação.
    
    Args:
        model: Modelo a ser avaliado
        val_loader: DataLoader para dados de validação
        criterion: Função de perda
        device: Dispositivo (CPU/GPU)
        
    Returns:
        Perda e acurácia médias
    """
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    
    # Desativar cálculo de gradientes
    with torch.no_grad():
        for inputs, labels in tqdm(val_loader, desc="Avaliando", leave=False):
            # Mover dados para o dispositivo
            inputs = inputs.to(device)
            labels = labels.to(device)
            
            # Forward pass
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            
            # Acumular estatísticas
            running_loss += loss.item() * inputs.size(0)
            
            # Calcular acurácia
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
    
    # Calcular métricas médias
    val_loss = running_loss / len(val_loader.dataset)
    val_acc = correct / total
    
    return val_loss, val_acc


def main():
    """Função principal para treinar o modelo."""
    args = parse_args()
    
    # Definir seeds para reprodutibilidade
    set_seed(args.seed)
    
    # Configurar dispositivo
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Usando dispositivo: {device}")
    
    # Configurar diretórios
    data_dir = Path(args.data_dir)
    model_dir = Path(args.model_dir)
    model_dir.mkdir(parents=True, exist_ok=True)
    
    # Obter transformações
    transforms_dict = get_data_transforms()
    
    # Carregar datasets
    train_dataset, val_dataset = load_datasets(data_dir, transforms_dict)
    
    # Criar dataloaders
    train_loader, val_loader = create_dataloaders(
        train_dataset=train_dataset,
        val_dataset=val_dataset,
        batch_size=args.batch_size,
        num_workers=args.num_workers
    )
    
    # Inicializar modelo
    num_classes = len(train_dataset.classes)
    model = SpeciesClassifier(num_classes=num_classes, pretrained=True)
    model.to(device)
    
    # Configurar critério (função de perda) e otimizador
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(
        model.parameters(),
        lr=args.learning_rate,
        weight_decay=args.weight_decay
    )
    
    # Configurar scheduler para redução de learning rate
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer,
        mode='min',
        factor=0.1,
        patience=3,
        verbose=True
    )
    
    # Inicializar variáveis para tracking
    best_val_acc = 0.0
    best_epoch = 0
    patience_counter = 0
    
    # Nome do modelo com timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    model_filename = f"species_classifier_{timestamp}.pth"
    model_path = model_dir / model_filename
    
    # Criar arquivo para log de treinamento
    log_path = model_dir / f"training_log_{timestamp}.csv"
    with open(log_path, 'w') as f:
        f.write("epoch,train_loss,val_loss,val_acc,time\n")
    
    # Loop de treinamento
    print(f"Iniciando treinamento por {args.epochs} épocas...")
    
    for epoch in range(1, args.epochs + 1):
        epoch_start_time = time.time()
        
        # Treinar uma época
        train_loss = train_one_epoch(
            model=model,
            train_loader=train_loader,
            criterion=criterion,
            optimizer=optimizer,
            device=device
        )
        
        # Avaliar no conjunto de validação
        val_loss, val_acc = evaluate(
            model=model,
            val_loader=val_loader,
            criterion=criterion,
            device=device
        )
        
        # Atualizar learning rate
        scheduler.step(val_loss)
        
        # Calcular tempo da época
        epoch_time = time.time() - epoch_start_time
        
        # Registrar resultados
        print(f"Época {epoch}/{args.epochs} - "
              f"Treino: {train_loss:.4f}, "
              f"Val: {val_loss:.4f}, "
              f"Acc: {val_acc:.4f}, "
              f"Tempo: {epoch_time:.1f}s")
        
        # Salvar log
        with open(log_path, 'a') as f:
            f.write(f"{epoch},{train_loss:.6f},{val_loss:.6f},{val_acc:.6f},{epoch_time:.1f}\n")
        
        # Verificar se é o melhor modelo
        if val_acc > best_val_acc:
            print(f"Acurácia de validação melhorou de {best_val_acc:.4f} para {val_acc:.4f}!")
            best_val_acc = val_acc
            best_epoch = epoch
            patience_counter = 0
            
            # Salvar o melhor modelo
            save_model(
                model=model,
                save_path=model_path,
                class_to_idx=train_dataset.class_to_idx
            )
        else:
            patience_counter += 1
            print(f"Acurácia de validação não melhorou. Melhor: {best_val_acc:.4f} (época {best_epoch})")
            
            # Verificar early stopping
            if patience_counter >= args.patience:
                print(f"Early stopping após {args.patience} épocas sem melhoria")
                break
    
    print(f"Treinamento concluído! Melhor acurácia: {best_val_acc:.4f} (época {best_epoch})")
    print(f"Modelo salvo em: {model_path}")


if __name__ == "__main__":
    main()