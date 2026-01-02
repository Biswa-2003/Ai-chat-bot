from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.db import get_db, engine, Base
import app.models # To register models
from app.models import Document, ChatLog, WorkflowDefinition
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import WorkflowPayload, UserCreate, Token
from app.workflow import run_workflow_logic
from app.rag import add_document_to_kb
from dotenv import load_dotenv
import shutil
import os # Added os import as it was missing in original view but used in code

from fastapi.security import OAuth2PasswordRequestForm
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta
from app.models import User
from app.schemas import UserCreate, Token

Base.metadata.create_all(bind=engine)



app = FastAPI(title="AI Workflow Builder")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"ok": True, "message": "Server running"}

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"ok": True, "message": "User created successfully. Please login."}

@app.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "username": user.username}

@app.post("/workflow/run")
async def run_workflow(
    payload: WorkflowPayload, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Authentication required
):
    try:
        # Extract user query for logging (naive approach: first userQuery node)
        user_query = ""
        for node in payload.nodes:
            if node.type == 'userQuery':
                user_query = node.data.query
                break
        
        result = await run_workflow_logic(payload.nodes, payload.edges)
        
        # Save to ChatLog
        if user_query and result.get("final_response"):
            log_entry = ChatLog(
                session_id="default", 
                user_message=user_query,
                bot_response=result["final_response"],
                user_id=current_user.id # Link to user
            )
            db.add(log_entry)
            db.commit()
            
        return result
    except Exception as e:
        import traceback
        traceback.print_exc() # Print error to console
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/workflow/save")
def save_workflow(
    payload: WorkflowPayload, 
    name: str = "Untitled Workflow", 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Convert Pydantic models to dict
        workflow_data = {
            "nodes": [node.dict() for node in payload.nodes],
            "edges": [edge.dict() for edge in payload.edges]
        }
        
        new_workflow = WorkflowDefinition(
            name=name,
            definition=workflow_data,
            user_id=current_user.id
        )
        db.add(new_workflow)
        db.commit()
        db.refresh(new_workflow)
        return {"ok": True, "message": "Workflow saved", "id": new_workflow.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/workflow/list")
def list_workflows(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Only show user's workflows
    return db.query(WorkflowDefinition).filter(WorkflowDefinition.user_id == current_user.id).all()

@app.post("/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    import uuid # Import locally to avoid top-level clutter changes
    UPLOAD_DIR = "uploads"
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)

    # Generate unique filename to prevent overwrites between users
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create DB entry
    # Store ORIGINAL filename for display, but UNIQUE path for storage
    doc_entry = Document(filename=file.filename, file_path=file_path, status="processing")
    db.add(doc_entry)
    db.commit()
    db.refresh(doc_entry)
    
    try:
        # Ingest from saved file
        # Use unique_filename for RAG IDs to avoid collisions
        count = add_document_to_kb(file_path, unique_filename)
        
        # Update DB success
        doc_entry.status = "processed"
        doc_entry.metadata_info = {"chunks": count}
        db.commit()
        
        return {"ok": True, "message": f"Processed {count} chunks from {file.filename}", "id": doc_entry.id}
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Update DB error
        doc_entry.status = "error"
        doc_entry.metadata_info = {"error": str(e)}
        db.commit()
        
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents")
def get_documents(db: Session = Depends(get_db)):
    return db.query(Document).all()
