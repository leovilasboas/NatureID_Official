# Pipeline de Classificação de Espécies

Este repositório contém um pipeline completo para treinar e servir um modelo de classificação de imagens de espécies (plantas e animais), consumindo dados do iNaturalist.

## Estrutura do Projeto

```
species_classifier/
│
├── data/                        # Diretório para armazenar dados
│   ├── raw/                     # Imagens brutas organizadas por taxonomia  
│   └── processed/               # Imagens processadas (224x224) para treino/validação
│       ├── train/               # Conjunto de treinamento
│       └── val/                 # Conjunto de validação
│
├── models/                      # Diretório para armazenar modelos treinados
│   └── species_classifier.pth   # Modelo final salvo
│
├── src/                         # Código-fonte
│   ├── data_collection.py       # Scripts para coletar dados do iNaturalist
│   ├── preprocessing.py         # Scripts para pré-processamento de imagens
│   ├── train.py                 # Script de treinamento do modelo
│   ├── model.py                 # Definição da arquitetura do modelo
│   └── utils.py                 # Funções auxiliares
│
├── app.py                       # API FastAPI para servir o modelo
│
└── requirements.txt             # Dependências do projeto
```

## Funcionalidades

1. **Coleta de dados**: Busca observações da API do iNaturalist
2. **Organização de metadados**: Cria um arquivo CSV com informações taxonômicas
3. **Pré-processamento**: Redimensiona e aplica augmentation nas imagens
4. **Treinamento**: Treina ResNet50 pré-treinado para classificação
5. **API de previsão**: Endpoint para receber imagens e retornar previsões

## Como usar

### 1. Instalar dependências

```bash
pip install -r requirements.txt
```

### 2. Coletar dados

```bash
python src/data_collection.py --taxon_name "Felidae" --count 500
```

### 3. Pré-processar imagens

```bash
python src/preprocessing.py
```

### 4. Treinar modelo

```bash
python src/train.py --epochs 30 --batch_size 32 --learning_rate 0.0001
```

### 5. Executar API

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

## API Endpoints

- **POST /predict**: Recebe uma imagem e retorna as top-5 previsões de espécies.