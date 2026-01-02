import chromadb
import fitz  # PyMuPDF
import os

# Initialize ChromaDB (persistent)
CHROMA_PATH = "chroma_db"
client = chromadb.PersistentClient(path=CHROMA_PATH)
collection_name = "knowledge_base"
# Create or get collection
collection = client.get_or_create_collection(name=collection_name)

def extract_text_from_pdf(file_path: str) -> str:
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def add_document_to_kb(file_path: str, filename: str):
    text = extract_text_from_pdf(file_path)
    # Simple chunking (by lines or fixed size - here just whole doc for simplicity, or naive chunking)
    # For better results, use a RecursiveCharacterTextSplitter from langchain, but avoiding extra heavy deps if possible.
    # We will just split by 1000 characters for now.
    
    chunk_size = 1000
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    ids = [f"{filename}_{i}" for i in range(len(chunks))]
    metadatas = [{"source": filename} for _ in range(len(chunks))]

    collection.add(
        documents=chunks,
        ids=ids,
        metadatas=metadatas
    )
    return len(chunks)

def query_kb(query: str, n_results: int = 3):
    results = collection.query(
        query_texts=[query],
        n_results=n_results
    )
    if results['documents']:
        return results['documents'][0] # List of strings
    return []
