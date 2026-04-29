import sys
import os

# Ensure the server directory is in sys.path
sys.path.append(os.getcwd())

from dotenv import load_dotenv
load_dotenv()

from app.db import engine, Base
import app.models

print("Creating database tables...")
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
except Exception as e:
    print(f"Error creating tables: {e}")
