from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class NodeData(BaseModel):
    label: str
    query: Optional[str] = None
    config: Optional[Dict[str, Any]] = {}

class Node(BaseModel):
    id: str
    type: str # userQuery, knowledgeBase, llmEngine, output
    data: NodeData
    position: Optional[Dict[str, float]] = None

class Edge(BaseModel):
    id: str
    source: str
    target: str

class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    username: Optional[str] = None

class WorkflowPayload(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
