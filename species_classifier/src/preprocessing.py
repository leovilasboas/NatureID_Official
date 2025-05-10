#!/usr/bin/env python3
"""
Script para pré-processar imagens de espécies para treinamento e validação.

Este script:
1. Carrega imagens brutas do diretório de dados
2. Redimensiona todas as imagens para 224x224 pixels
3. Aplica técnicas de data augmentation
4. Divide os dados em conjuntos de treino e validação
5. Salva as imagens processadas nos diretórios apropriados

Uso:
    python preprocessing.py --split 0.8 --augment_factor 3
"""

import os
import csv
import argparse
import random
import shutil
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from tqdm import tqdm
from PIL import Image, ImageEnhance, ImageOps


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Pré-processar imagens para treinamento')
    parser.add_argument('--data_dir', type=str, default='../data',
                        help='Diretório contendo os dados brutos')
    parser.add_argument('--split', type=float, default=0.8,
                        help='Proporção de divisão treino/validação (0-1)')
    parser.add_argument('--augment_factor', type=int, default=3,
                        help='Número de imagens aumentadas por imagem original')
    parser.add_argument('--seed', type=int, default=42,
                        help='Seed para reprodutibilidade')
    return parser.parse_args()


def resize_image(img: Image.Image, target_size: Tuple[int, int] = (224, 224)) -> Image.Image:
    """
    Redimensiona uma imagem para o tamanho alvo, preservando a proporção.
    
    Args:
        img: Imagem a ser redimensionada
        target_size: Tamanho alvo (largura, altura)
        
    Returns:
        Imagem redimensionada
    """
    # Converter para RGB (caso seja RGBA, por exemplo)
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Calcular proporção
    width, height = img.size
    ratio = min(target_size[0] / width, target_size[1] / height)
    
    # Novo tamanho preservando proporção
    new_size = (int(width * ratio), int(height * ratio))
    resized_img = img.resize(new_size, Image.LANCZOS)
    
    # Criar nova imagem com o tamanho alvo
    new_img = Image.new('RGB', target_size, (0, 0, 0))
    
    # Colar a imagem redimensionada centralizada
    paste_x = (target_size[0] - new_size[0]) // 2
    paste_y = (target_size[1] - new_size[1]) // 2
    new_img.paste(resized_img, (paste_x, paste_y))
    
    return new_img


def apply_augmentation(img: Image.Image) -> List[Image.Image]:
    """
    Aplica data augmentation a uma imagem.
    
    Args:
        img: Imagem original
        
    Returns:
        Lista de imagens aumentadas
    """
    augmented = []
    
    # Rotação aleatória entre -20 e 20 graus
    angle = random.uniform(-20, 20)
    augmented.append(img.rotate(angle, resample=Image.BICUBIC, expand=False))
    
    # Flip horizontal
    augmented.append(ImageOps.mirror(img))
    
    # Ajuste de brilho aleatório
    brightness_factor = random.uniform(0.8, 1.2)
    enhancer = ImageEnhance.Brightness(img)
    augmented.append(enhancer.enhance(brightness_factor))
    
    # Ajuste de contraste aleatório
    contrast_factor = random.uniform(0.8, 1.2)
    enhancer = ImageEnhance.Contrast(img)
    augmented.append(enhancer.enhance(contrast_factor))
    
    return augmented


def prepare_dataset(data_dir: Path, split: float, augment_factor: int, seed: int) -> pd.DataFrame:
    """
    Prepara o dataset dividindo em conjuntos de treino e validação.
    
    Args:
        data_dir: Diretório contendo os dados
        split: Proporção de divisão treino/validação (0-1)
        augment_factor: Número de imagens aumentadas por imagem original
        seed: Seed para reprodutibilidade
        
    Returns:
        DataFrame contendo os caminhos das imagens e seus rótulos
    """
    # Configurar seed para reprodutibilidade
    random.seed(seed)
    np.random.seed(seed)
    
    # Caminhos dos diretórios
    raw_dir = data_dir / "raw"
    processed_dir = data_dir / "processed"
    train_dir = processed_dir / "train"
    val_dir = processed_dir / "val"
    
    # Limpar diretórios de processamento anteriores
    if train_dir.exists():
        shutil.rmtree(train_dir)
    if val_dir.exists():
        shutil.rmtree(val_dir)
    
    # Criar diretórios
    train_dir.mkdir(parents=True, exist_ok=True)
    val_dir.mkdir(parents=True, exist_ok=True)
    
    # Carregar metadados
    csv_path = data_dir / "labels.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"Arquivo de metadados não encontrado: {csv_path}")
    
    df = pd.read_csv(csv_path)
    print(f"Carregados metadados de {len(df)} imagens")
    
    # Agrupar por espécie (scientific_name)
    species_groups = df.groupby('scientific_name')
    species_list = list(species_groups.groups.keys())
    
    # Preparar DataFrames para treino/validação
    train_data = []
    val_data = []
    
    # Processar cada espécie
    for species in tqdm(species_list, desc="Processando espécies"):
        species_df = species_groups.get_group(species)
        
        # Embaralhar imagens da espécie
        species_rows = species_df.sample(frac=1, random_state=seed).reset_index(drop=True)
        
        # Calcular ponto de divisão
        split_idx = int(len(species_rows) * split)
        
        # Dividir em treino e validação
        train_species = species_rows.iloc[:split_idx]
        val_species = species_rows.iloc[split_idx:]
        
        # Processar imagens de treino (com augmentation)
        for _, row in train_species.iterrows():
            src_path = data_dir / row['filepath']
            if not src_path.exists():
                continue
            
            # Criar diretório de destino
            class_dir = train_dir / species.replace(' ', '_')
            class_dir.mkdir(exist_ok=True)
            
            try:
                # Processar imagem original
                img = Image.open(src_path)
                img_resized = resize_image(img)
                
                # Salvar imagem original redimensionada
                original_filename = f"{src_path.stem}_orig.jpg"
                img_resized.save(class_dir / original_filename)
                
                # Adicionar ao DataFrame de treino
                train_data.append({
                    'filepath': str(class_dir / original_filename),
                    'class': species,
                    'split': 'train'
                })
                
                # Aplicar augmentation
                for i in range(augment_factor):
                    augmented_images = apply_augmentation(img_resized)
                    
                    # Salvar imagens aumentadas
                    for j, aug_img in enumerate(augmented_images):
                        aug_filename = f"{src_path.stem}_aug_{i}_{j}.jpg"
                        aug_img.save(class_dir / aug_filename)
                        
                        # Adicionar ao DataFrame de treino
                        train_data.append({
                            'filepath': str(class_dir / aug_filename),
                            'class': species,
                            'split': 'train'
                        })
            except Exception as e:
                print(f"Erro ao processar {src_path}: {e}")
        
        # Processar imagens de validação (sem augmentation)
        for _, row in val_species.iterrows():
            src_path = data_dir / row['filepath']
            if not src_path.exists():
                continue
            
            # Criar diretório de destino
            class_dir = val_dir / species.replace(' ', '_')
            class_dir.mkdir(exist_ok=True)
            
            try:
                # Processar imagem
                img = Image.open(src_path)
                img_resized = resize_image(img)
                
                # Salvar imagem redimensionada
                dest_filename = f"{src_path.stem}.jpg"
                img_resized.save(class_dir / dest_filename)
                
                # Adicionar ao DataFrame de validação
                val_data.append({
                    'filepath': str(class_dir / dest_filename),
                    'class': species,
                    'split': 'val'
                })
            except Exception as e:
                print(f"Erro ao processar {src_path}: {e}")
    
    # Combinar dados de treino e validação
    all_data = pd.DataFrame(train_data + val_data)
    
    # Salvar informações de divisão
    processed_info_path = processed_dir / "processed_info.csv"
    all_data.to_csv(processed_info_path, index=False)
    
    print(f"Treino: {len(train_data)} imagens")
    print(f"Validação: {len(val_data)} imagens")
    print(f"Total: {len(all_data)} imagens processadas")
    
    return all_data


def main():
    """Função principal."""
    args = parse_args()
    
    # Configurar diretório de dados
    data_dir = Path(args.data_dir)
    
    print("Iniciando pré-processamento de imagens...")
    
    # Preparar dataset
    dataset_df = prepare_dataset(
        data_dir=data_dir,
        split=args.split,
        augment_factor=args.augment_factor,
        seed=args.seed
    )
    
    print("Pré-processamento concluído!")
    print(f"Salvo em {data_dir}/processed/")


if __name__ == "__main__":
    main()