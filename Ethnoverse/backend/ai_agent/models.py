from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ContentSubmission(BaseModel):
    content_id: str
    text_content: str
    user_id: str
    content_type: str = "text"  # text, audio_transcript, handwriting_ocr
    community_id: Optional[int] = None
    community_id: Optional[int] = None
    file_url: Optional[str] = None

class SearchQuery(BaseModel):
    query: str
    community_id: Optional[str] = None
    limit: int = 10
    threshold: float = 1.0  # Optional cut-off for vector distance

class ChatMessage(BaseModel):
    role: str # 'user' or 'ai'
    content: str

class ChatQuery(BaseModel):
    query: str
    history: List[ChatMessage] = []
    community_id: Optional[str] = None
    limit: int = 10
    threshold: float = 1.0

class ChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    
class ModerationResult(BaseModel):
    is_approved: bool
    reason: Optional[str] = None
    flagged_categories: List[str] = []

class EntityVariable(BaseModel):
    name: str
    type: str

class Relationship(BaseModel):
    source: str
    target: str
    relation: str

class KnowledgeGraph(BaseModel):
    entities: List[EntityVariable]
    relationships: List[Relationship]

class ExtractionResult(BaseModel):
    entities: List[str]
    knowledge_graph: KnowledgeGraph
