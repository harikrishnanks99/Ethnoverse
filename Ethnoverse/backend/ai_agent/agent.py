from typing import TypedDict, Annotated, Sequence, List
import operator
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage
from tools.moderation import moderate_text
from tools.extraction import extract_knowledge
from vector_store import get_vector_store
from graph_store import GraphStore
from langchain_core.documents import Document
from models import ModerationResult, ExtractionResult, KnowledgeGraph, EntityVariable, Relationship

# --- State Definition ---
class AgentState(TypedDict):
    content: str
    content_id: str
    user_id: str
    content_type: str
    community_id: str
    file_url: str
    moderation_result: dict
    extraction_result: dict
    final_response: dict

# --- Nodes ---

async def moderation_node(state: AgentState):
    print(f"--- Moderating Content for User: {state['user_id']} ---", flush=True)
    result = await moderate_text(state["content"])
    return {"moderation_result": result}

async def extraction_node(state: AgentState):
    print("--- Extracting Entities ---", flush=True)
    # Pass content_id so the graph can link entities to the source content
    result = await extract_knowledge(state["content"], state["content_id"])
    return {"extraction_result": result}

async def ingestion_node(state: AgentState):
    print("--- Ingesting into Vector Store ---", flush=True)
    # Prepare document for RAG
    text = state["content"]
    metadata = {
        "user_id": state["user_id"],
        "content_id": state["content_id"],
        "source": state.get("content_type", "api_upload"),
        # We could add extracted entities to metadata here
        "community_id": str(state["community_id"]) if state["community_id"] else "global",
        "file_url": state.get("file_url")
    }
    # Filter out None values as ChromaDB does not support them
    metadata = {k: v for k, v in metadata.items() if v is not None}
    
    doc = Document(page_content=text, metadata=metadata)
    
    # 1. Vector Store Ingestion
    vector_store = get_vector_store()
    vector_store.add_documents([doc])
    
    # 2. Knowledge Graph Ingestion
    print("--- Ingesting into Knowledge Graph ---", flush=True)
    graph_store = GraphStore()
    try:
        graph_store.add_extraction_result(
            state.get("extraction_result", {}), 
            state["community_id"], 
            state["content_id"],
            state["content"],       # New: pass text_content
            state["content_type"],   # New: pass content_type
            state.get("file_url")    # New: pass file_url
        )
    except Exception as e:
        print(f"Error ingesting into Knowledge Graph: {e}", flush=True)
    finally:
        graph_store.close()
    
    return {"final_response": {"status": "ingested", "message": "Content processed and stored successfully."}}

async def rejection_node(state: AgentState):
    print("--- Content Rejected ---", flush=True)
    reason = state["moderation_result"].get("reason", "Violated community guidelines.")
    flagged = state["moderation_result"].get("flagged_categories", [])
    return {"final_response": {"status": "rejected", "message": reason, "flagged_categories": flagged}}

# --- Conditional Logic ---

def check_moderation(state: AgentState):
    if state["moderation_result"].get("is_approved"):
        return "approved"
    return "rejected"

# --- Graph Construction ---

workflow = StateGraph(AgentState)

workflow.add_node("moderator", moderation_node)
workflow.add_node("extractor", extraction_node)
workflow.add_node("ingestor", ingestion_node)
workflow.add_node("rejector", rejection_node)

workflow.set_entry_point("moderator")

workflow.add_conditional_edges(
    "moderator",
    check_moderation,
    {
        "approved": "extractor",
        "rejected": "rejector"
    }
)

workflow.add_edge("extractor", "ingestor")
workflow.add_edge("ingestor", END)
workflow.add_edge("rejector", END)

app = workflow.compile()

# --- Public Interface ---

async def run_agent_workflow(content: str, user_id: str, content_id: str, content_type: str = "text", community_id: str = None, file_url: str = None):
    inputs = {
        "content": content,
        "content_id": content_id,
        "user_id": user_id,
        "content_type": content_type,
        "community_id": str(community_id) if community_id else None,
        "file_url": file_url,
        "moderation_result": {},
        "extraction_result": {}
    }
    return await app.ainvoke(inputs)

async def stream_agent_workflow(content: str, user_id: str, content_id: str, content_type: str = "text", community_id: str = None, file_url: str = None):
    inputs = {
        "content": content,
        "content_id": content_id,
        "user_id": user_id,
        "content_type": content_type,
        "community_id": str(community_id) if community_id else None,
        "file_url": file_url,
        "moderation_result": {},
        "extraction_result": {}
    }
    # Stream events from the graph
    async for event in app.astream(inputs):
        yield event
