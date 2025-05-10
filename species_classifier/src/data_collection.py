#!/usr/bin/env python3
"""
Script para coletar dados de imagens e metadados de espécies do iNaturalist API.

Este script:
1. Busca observações de um determinado táxon usando a API do iNaturalist
2. Extrai URLs das fotos e metadados
3. Faz download das imagens e as organiza em pastas por taxonomia
4. Cria um arquivo CSV com os metadados

Uso:
    python data_collection.py --taxon_name "Felidae" --count 500
"""

import os
import csv
import json
import time
import argparse
import requests
from tqdm import tqdm
from pathlib import Path
import concurrent.futures
from typing import Dict, List, Any, Optional, Tuple


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Coletar dados do iNaturalist API')
    parser.add_argument('--taxon_name', type=str, required=True,
                        help='Nome do táxon para buscar (ex: "Felidae")')
    parser.add_argument('--count', type=int, default=500,
                        help='Número de observações a serem coletadas')
    parser.add_argument('--output_dir', type=str, default='../data',
                        help='Diretório de saída para os dados coletados')
    parser.add_argument('--page_size', type=int, default=200,
                        help='Número de observações por página da API')
    parser.add_argument('--quality_grade', type=str, default='research',
                        choices=['research', 'needs_id', 'casual', 'any'],
                        help='Filtro de qualidade das observações')
    return parser.parse_args()


def get_taxon_id(taxon_name: str) -> int:
    """
    Busca o ID de um táxon pelo nome usando a API do iNaturalist.
    
    Args:
        taxon_name: Nome do táxon a ser buscado
        
    Returns:
        ID do táxon
        
    Raises:
        Exception: Se o táxon não for encontrado
    """
    url = "https://api.inaturalist.org/v1/taxa"
    params = {"q": taxon_name, "per_page": 1}
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data["total_results"] == 0:
            raise Exception(f"Táxon '{taxon_name}' não encontrado")
        
        return data["results"][0]["id"]
    except requests.exceptions.RequestException as e:
        raise Exception(f"Erro ao buscar ID do táxon: {str(e)}")


def fetch_observations(taxon_id: int, count: int, quality_grade: str, page_size: int = 200) -> List[Dict[str, Any]]:
    """
    Busca observações de um táxon específico na API do iNaturalist.
    
    Args:
        taxon_id: ID do táxon a ser buscado
        count: Número total de observações a serem coletadas
        quality_grade: Filtro de qualidade das observações
        page_size: Número de resultados por página
        
    Returns:
        Lista de observações
    """
    url = "https://api.inaturalist.org/v1/observations"
    
    # Calcular o número de páginas necessárias
    num_pages = (count + page_size - 1) // page_size
    
    # Parâmetros base para a consulta
    params = {
        "taxon_id": taxon_id,
        "photos": "true",  # Apenas observações com fotos
        "per_page": page_size,
        "quality_grade": quality_grade,
        "order": "desc",
        "order_by": "quality_grade"
    }
    
    all_observations = []
    
    print(f"Buscando {count} observações do táxon ID {taxon_id}...")
    
    # Buscar observações página por página
    for page in tqdm(range(1, num_pages + 1), desc="Páginas"):
        params["page"] = page
        
        response = requests.get(url, params=params)
        
        # Verificar se a requisição foi bem-sucedida
        if response.status_code != 200:
            print(f"Erro ao buscar página {page}: {response.status_code}")
            continue
        
        data = response.json()
        observations = data["results"]
        
        if not observations:
            print(f"Sem mais resultados na página {page}")
            break
            
        all_observations.extend(observations)
        
        # Respeitar limites de taxa da API
        time.sleep(1)
    
    return all_observations[:count]


def download_image(photo_url: str, output_path: Path) -> bool:
    """
    Faz o download de uma imagem a partir da URL.
    
    Args:
        photo_url: URL da foto a ser baixada
        output_path: Caminho onde a imagem será salva
        
    Returns:
        True se o download foi bem-sucedido, False caso contrário
    """
    try:
        response = requests.get(photo_url, stream=True)
        response.raise_for_status()
        
        # Criar diretório pai se não existir
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Salvar a imagem
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                
        return True
    except Exception as e:
        print(f"Erro ao baixar {photo_url}: {str(e)}")
        return False


def process_observation(observation: Dict[str, Any], idx: int, output_dir: Path) -> Optional[Dict[str, Any]]:
    """
    Processa uma observação, baixa as imagens e extrai metadados.
    
    Args:
        observation: Dados da observação do iNaturalist
        idx: Índice para nomeação única das imagens
        output_dir: Diretório base para salvar os dados
        
    Returns:
        Dicionário com metadados da observação ou None se falhar
    """
    try:
        # Verificar se a observação tem fotos e táxon
        if (not observation.get("photos") or 
            not observation.get("taxon") or
            not observation.get("taxon", {}).get("ancestry")):
            return None
        
        # Extrair informações taxonômicas
        taxon = observation["taxon"]
        taxon_id = taxon["id"]
        scientific_name = taxon["name"]
        common_name = taxon.get("preferred_common_name", "")
        
        # Extrair latitude e longitude se disponíveis
        latitude = None
        longitude = None
        if observation.get("geojson") and observation["geojson"].get("coordinates"):
            coords = observation["geojson"]["coordinates"]
            longitude, latitude = coords[0], coords[1]
        
        # Construir caminho taxonômico
        ancestry = taxon["ancestry"].split("/")
        # Simplificar para obter apenas reino/ordem/família/gênero_espécie
        kingdom = get_taxonomy_level(ancestry, taxon, 0)
        order = get_taxonomy_level(ancestry, taxon, 2)
        family = get_taxonomy_level(ancestry, taxon, 3)
        
        # Pegar gênero e espécie do nome científico
        genus_species = scientific_name.replace(" ", "_")
        
        # Criar caminho para a imagem
        rel_path = f"{kingdom}/{order}/{family}/{genus_species}"
        full_path = output_dir / "raw" / rel_path
        
        # Processar cada foto da observação
        for i, photo in enumerate(observation["photos"]):
            # Obter URL da foto em tamanho original
            photo_url = photo["url"].replace("square", "original")
            
            # Nome do arquivo de imagem
            img_filename = f"img_{idx}_{i}.jpg"
            img_path = full_path / img_filename
            
            # Fazer download da imagem
            if download_image(photo_url, img_path):
                # Retornar metadados apenas se pelo menos uma imagem foi baixada
                return {
                    "filepath": str(Path("raw") / rel_path / img_filename),
                    "taxon_id": taxon_id,
                    "scientific_name": scientific_name,
                    "common_name": common_name,
                    "latitude": latitude,
                    "longitude": longitude,
                    "kingdom": kingdom,
                    "order": order,
                    "family": family
                }
                
    except Exception as e:
        print(f"Erro ao processar observação {idx}: {str(e)}")
    
    return None


def get_taxonomy_level(ancestry: List[str], taxon: Dict[str, Any], level_idx: int) -> str:
    """
    Obtém o nome de um nível taxonômico específico.
    
    Args:
        ancestry: Lista de IDs dos níveis taxonômicos
        taxon: Dados do táxon da observação
        level_idx: Índice do nível taxonômico desejado
        
    Returns:
        Nome do nível taxonômico ou 'unknown' se não encontrado
    """
    try:
        if len(ancestry) > level_idx:
            level_id = ancestry[level_idx]
            # Tenta encontrar o nome no objeto taxon
            if taxon.get("ancestor_ids") and taxon.get("ancestors"):
                ancestors_ids = taxon["ancestor_ids"]
                ancestors = taxon["ancestors"]
                for i, ancestor_id in enumerate(ancestors_ids):
                    if str(ancestor_id) == level_id and i < len(ancestors):
                        return ancestors[i]["name"].replace(" ", "_")
        return "unknown"
    except:
        return "unknown"


def main():
    """Função principal do script."""
    args = parse_args()
    
    # Configurar diretórios
    base_dir = Path(args.output_dir)
    raw_dir = base_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    
    # Obter ID do táxon
    try:
        taxon_id = get_taxon_id(args.taxon_name)
        print(f"ID do táxon '{args.taxon_name}': {taxon_id}")
    except Exception as e:
        print(f"Erro: {e}")
        return
    
    # Buscar observações
    observations = fetch_observations(
        taxon_id=taxon_id,
        count=args.count,
        quality_grade=args.quality_grade,
        page_size=args.page_size
    )
    
    print(f"Coletadas {len(observations)} observações")
    
    # Processar observações e baixar imagens
    print("Baixando imagens e extraindo metadados...")
    metadata_list = []
    
    # Usar ThreadPoolExecutor para downloads paralelos
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        # Submeter tarefas
        future_to_idx = {
            executor.submit(process_observation, obs, i, base_dir): i 
            for i, obs in enumerate(observations)
        }
        
        # Processar resultados à medida que são concluídos
        for future in tqdm(concurrent.futures.as_completed(future_to_idx), 
                          total=len(observations),
                          desc="Processando observações"):
            idx = future_to_idx[future]
            try:
                metadata = future.result()
                if metadata:
                    metadata_list.append(metadata)
            except Exception as e:
                print(f"Observação {idx} gerou uma exceção: {e}")
    
    # Salvar metadados em CSV
    if metadata_list:
        csv_path = base_dir / "labels.csv"
        fieldnames = ["filepath", "taxon_id", "scientific_name", "common_name", 
                     "latitude", "longitude", "kingdom", "order", "family"]
        
        with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for metadata in metadata_list:
                writer.writerow(metadata)
        
        print(f"Metadados salvos em {csv_path}")
        print(f"Total de {len(metadata_list)} imagens baixadas com sucesso")
    else:
        print("Nenhuma imagem foi baixada com sucesso")


if __name__ == "__main__":
    main()