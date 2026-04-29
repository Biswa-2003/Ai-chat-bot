import sys
import os
from sqlalchemy import inspect
from dotenv import load_dotenv

# Ensure the server directory is in sys.path
sys.path.append(os.getcwd())

from app.db import engine

def check_tables():
    print(f"Connecting to database using: {engine.url}")
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    if tables:
        print("\n✅ SUCCESS! Found the following tables in your PostgreSQL database:")
        print("-" * 50)
        for table in tables:
            print(f" - {table}")
        print("-" * 50)
        
        if "users" in tables:
             print("\n👍 'users' table CONFIRMED. Authentication is fully set up in Postgres.")
        else:
             print("\n❌ 'users' table MISSING.")
    else:
        print("\n❌ No tables found. Database might be empty.")

if __name__ == "__main__":
    check_tables()
