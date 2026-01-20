import os
import psycopg2
from dotenv import load_dotenv

# Cargar variables de entorno del backend
load_dotenv('backend/.env')

db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'anclora_flow'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', '')
}

target_email = 'pmi140979@gmail.com'

try:
    conn = psycopg2.connect(**db_config)
    cur = conn.cursor()
    
    # 1. Buscar el ID del usuario objetivo
    cur.execute("SELECT id FROM users WHERE email = %s;", (target_email,))
    row = cur.fetchone()
    if not row:
        print(f"Error: No se encontró el usuario {target_email}")
        conn.close()
        exit(1)
    
    new_user_id = row[0]
    print(f"Usuario {target_email} encontrado con ID: {new_user_id}")
    
    # 2. Reasignar todo lo que pertenece al primer usuario
    # El seed data suele asignar al primer usuario que encuentra (LIMIT 1)
    cur.execute("SELECT id FROM users LIMIT 1;")
    old_user_id = cur.fetchone()[0]
    
    if old_user_id == new_user_id:
        print("El usuario ya es el propietario de los datos.")
    else:
        print(f"Reasignando datos de {old_user_id} a {new_user_id}...")
        
        tables = ['clients', 'projects', 'invoices', 'bank_accounts', 'expenses', 'budgets', 'subscriptions']
        for table in tables:
            cur.execute(f"UPDATE {table} SET user_id = %s WHERE user_id = %s;", (new_user_id, old_user_id))
            print(f"- Actualizada tabla {table}: {cur.rowcount} filas movidas.")
            
        conn.commit()
        print("\n✅ Reasignación completada con éxito.")
    
    cur.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
    print("\nNota: Asegúrate de tener instalado 'psycopg2-binary' (pip install psycopg2-binary)")
