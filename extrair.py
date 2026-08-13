import os
import pandas as pd
from supabase import create_client

# Pegue a URL e a KEY anon no painel: Settings > API
URL = "https://nrncjdwivgidlboliypw.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybmNqZHdpdmdpZGxib2xpeXB3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDE0MzU2MCwiZXhwIjoyMDk5NzE5NTYwfQ.iwe-pcWgX7_8GGiNnmEUUUdvGxj4MMT12hG2ybXjeQw"
supabase = create_client(URL, KEY)

# Lista das tabelas que você quer baixar
tabelas = [
    # Nível 0: Tabelas independentes ou pais principais
    "profiles",
    "atividades",
    "missoes_catalogo",
    "grupos_alimentares_info",
    
    # Nível 1: Dependem de profiles ou tabelas independentes
    "consentimentos",
    "avaliacoes_nutricionais",
    "registros_diarios",
    "alimentos",
    
    # Nível 2: Dependem do Nível 1
    "avaliacoes_ebia",
    "recordatorios_alimentares",
    "registros_agua",
    "registros_atividade_fisica",
    "refeicoes",
    "prato_ingredientes",
    "receitas",
    "alimento_nutrientes",
    "missoes_diarias",
    
    # Nível 3: Dependem do Nível 2
    "respostas_ebia",
    "feedbacks_nutricionais",
    "refeicao_alimentos",
    "receita_ingredientes",
    "receita_passos"
]
# Cria uma pasta para organizar os backups
pasta_destino = "backup_nutriteens_csv"
os.makedirs(pasta_destino, exist_ok=True)

print(f"Iniciando o download de {len(tabelas)} tabelas do NutriTeens...\n")

for tabela in tabelas:
    print(f"Baixando tabela: {tabela}...", end=" ")
    try:
        # Busca todos os registros da tabela
        response = supabase.table(tabela).select("*").execute()
        dados = response.data
        
        if dados:
            df = pd.DataFrame(dados)
            caminho_arquivo = os.path.join(pasta_destino, f"{tabela}.csv")
            df.to_csv(caminho_arquivo, index=False, encoding="utf-8-sig")
            print(f"[SUCESSO] ({len(dados)} registros)")
        else:
            print("[VAZIA] (Nenhum registro encontrado)")
            
    except Exception as e:
        print(f"[ERRO]: {e}")

print(f"\nProcesso finalizado! Todos os arquivos CSV foram salvos na pasta: '{pasta_destino}'")