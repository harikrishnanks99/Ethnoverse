from fastapi import FastAPI, HTTPException, Depends
from models import ContentSubmission, ModerationResult, ExtractionResult, SearchQuery
from typing import Dict, Any, List
import agent
from vector_store import get_all_documents, semantic_search, delete_document
from graph_store import GraphStore
from tools.query_parser import extract_query_entities
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Ethnoverse AI Agent", version="0.1.0")

from fastapi.middleware.cors import CORSMiddleware
from utils import get_llm
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Ethnoverse AI Agent Service is running"}

@app.get("/graph/{community_id}")
def get_community_graph(community_id: str):
    """
    Retrieves the knowledge graph for a specific community.
    """
    graph_store = GraphStore()
    try:
        data = graph_store.get_graph_data(community_id)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        graph_store.close()

@app.get("/graph")
def get_all_graph():
    """
    Retrieves the entire knowledge graph.
    """
    graph_store = GraphStore()
    try:
        data = graph_store.get_graph_data()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        graph_store.close()

@app.delete("/content/{document_id}")
def remove_community_content(document_id: str):
    """
    Deletes content document from vector store.
    """
    try:
        success = delete_document(document_id=document_id)
        if success:
             return {"message": f"Successfully deleted {document_id}"}
        else:
             raise HTTPException(status_code=404, detail="Document not found or could not be deleted")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/content/{community_id}")
def get_community_content(community_id: str):
    """
    Retrieves content documents for a specific community.
    """
    try:
        results = get_all_documents(community_id=community_id)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/content")
def get_all_content():
    """
    Retrieves all content documents.
    """
    try:
        results = get_all_documents()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search_content(query: SearchQuery):
    """
    Hybrid Search Endpoint: Semantic Vector Search + GraphRAG
    """
    try:
        # 1. Semantic Search (Vector Store)
        vector_results = semantic_search(
            query=query.query, 
            community_id=query.community_id, 
            k=query.limit
        )
        
        # Filter vector results by threshold if needed
        # Lower score is generally better in default Chroma (L2 distance), 
        # but check the metric! Assuming score < threshold is a match.
        filtered_vector_results = [
            res for res in vector_results if res["score"] <= query.threshold
        ]

        # 2. GraphRAG Search (Knowledge Graph)
        extracted_entities = await extract_query_entities(query.query)
        graph_results = []
        if extracted_entities:
            graph_store = GraphStore()
            try:
                graph_results = graph_store.search_by_entities(
                    entity_names=extracted_entities,
                    community_id=query.community_id
                )
            finally:
                graph_store.close()

        # 3. Combine and Deduplicate
        # We will use the source text/id as the unique key
        combined_results = {}
        
        # Add GraphRAG results first (high precision for specific entities)
        for doc in graph_results:
            doc_id = doc.get("id", "unknown_graph_id")
            metadata = doc.get("metadata", {})
            combined_results[doc_id] = {
                "id": doc_id,
                "page_content": doc["page_content"],
                "metadata": metadata,
                "source": "graph",
                "score": 0.0, # High relevance implicitly
                "file_url": metadata.get("file_url"),
                "content_type": metadata.get("content_type", "text")
            }
            
        # Add Vector results
        for doc in filtered_vector_results:
            # We don't have IDs reliably returned from the current vector_store return struct,
            # so we'll deduplicate by plotting a pseudo-ID or the content itself.
            doc_content = doc["page_content"]
            # To handle duplicates without ID, check if content already exists
            content_exists = any(v["page_content"] == doc_content for v in combined_results.values())
            
            if not content_exists:
                metadata = doc.get("metadata", {})
                # Try to use the content_id if it exists in metadata, otherwise hash
                pseudo_id = metadata.get("content_id", f"vec_{hash(doc_content)}")
                combined_results[pseudo_id] = {
                    "id": pseudo_id,
                    "page_content": doc_content,
                    "metadata": metadata,
                    "source": "vector",
                    "score": doc["score"],
                    "file_url": metadata.get("file_url"),
                    "content_type": metadata.get("content_type", "text")
                }
            else:
                # If it exists from Graph, just append the vector score metadata
                for existing_id, existing_doc in combined_results.items():
                    if existing_doc["page_content"] == doc_content:
                        existing_doc["metadata"]["vector_score"] = doc["score"]
                        existing_doc["source"] = "hybrid"
                        
        final_list = list(combined_results.values())
        
        return {
            "query": query.query,
            "extracted_entities": extracted_entities,
            "results": final_list[:query.limit]
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

from models import ChatQuery, ChatResponse

@app.post("/chat", response_model=ChatResponse)
async def chat_with_content(query: ChatQuery):
    """
    Conversational UI Endpoint: Semantic Vector Search + GraphRAG + LLM Answering
    """
    try:
        # 1. Semantic Search (Vector Store)
        vector_results = semantic_search(
            query=query.query, 
            community_id=query.community_id, 
            k=query.limit
        )
        
        filtered_vector_results = [
            res for res in vector_results if res["score"] <= query.threshold
        ]

        # 2. GraphRAG Search (Knowledge Graph)
        extracted_entities = await extract_query_entities(query.query)
        graph_results = []
        if extracted_entities:
            graph_store = GraphStore()
            try:
                graph_results = graph_store.search_by_entities(
                    entity_names=extracted_entities,
                    community_id=query.community_id
                )
            finally:
                graph_store.close()

        # 3. Combine and Deduplicate Sources
        combined_results = {}
        
        # Add GraphRAG results first (high precision for specific entities)
        for doc in graph_results:
            doc_id = doc.get("id", "unknown_graph_id")
            metadata = doc.get("metadata", {})
            combined_results[doc_id] = {
                "id": doc_id,
                "page_content": doc["page_content"],
                "metadata": metadata,
                "source": "graph",
                "score": 0.0,
                "file_url": metadata.get("file_url"),
                "content_type": metadata.get("content_type", "text")
            }
            
        # Add Vector results
        for doc in filtered_vector_results:
            doc_content = doc["page_content"]
            content_exists = any(v["page_content"] == doc_content for v in combined_results.values())
            
            if not content_exists:
                metadata = doc.get("metadata", {})
                pseudo_id = metadata.get("content_id", f"vec_{hash(doc_content)}")
                combined_results[pseudo_id] = {
                    "id": pseudo_id,
                    "page_content": doc_content,
                    "metadata": metadata,
                    "source": "vector",
                    "score": doc["score"],
                    "file_url": metadata.get("file_url"),
                    "content_type": metadata.get("content_type", "text")
                }
            else:
                for existing_id, existing_doc in combined_results.items():
                    if existing_doc["page_content"] == doc_content:
                        existing_doc["metadata"]["vector_score"] = doc["score"]
                        existing_doc["source"] = "hybrid"
                        
        final_sources_list = list(combined_results.values())[:query.limit]
        
        # 4. Construct Context for the LLM
        context_texts = []
        for i, source in enumerate(final_sources_list):
            context_texts.append(f"Source [{i+1}]: {source['page_content']}")
        
        context_block = "\n\n".join(context_texts)
        if not context_block:
            context_block = "No direct context was found in the knowledge base."

        # 5. Build LLM Messages
        llm = get_llm()
        messages = [
            SystemMessage(content=(
                "You are an intelligent knowledge base assistant for a community. "
                "Answer the user's question based strictly on the provided Context sources below. "
                "If the information is not in the context, say that you do not know based on the available community knowledge. "
                "Do NOT make up information or answer outside of the context. "
                "You can cite the source numbers [1], [2], etc. in your answer.\n\n"
                f"=== Context ===\n{context_block}\n=============="
            ))
        ]
        
        # Add Chat History
        for msg in query.history:
            if msg.role.lower() == "user":
                messages.append(HumanMessage(content=msg.content))
            else:
                messages.append(AIMessage(content=msg.content))
        
        # Append the current query
        messages.append(HumanMessage(content=query.query))
        
        # 6. Invoke LLM
        response = llm.invoke(messages)
        ai_message = response.content
        
        return ChatResponse(
            answer=ai_message,
            sources=final_sources_list
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process")
async def process_content(submission: ContentSubmission):
    """
    Submits content to the AI Agent Workflow and streams updates.
    Returns a stream of JSON events (NDJSON).
    """
    from fastapi.responses import StreamingResponse
    import json
    import asyncio

    async def event_generator():
        try:
            print(f"--- Starting workflow stream for content_id: {submission.content_id} ---", flush=True)
            yield json.dumps({"type": "status", "stage": "system", "message": "Starting workflow..."}) + "\n"
            
            async for event in agent.stream_agent_workflow(
                content=submission.text_content, 
                user_id=submission.user_id, 
                content_id=submission.content_id, 
                content_type=submission.content_type,
                community_id=submission.community_id,
                file_url=submission.file_url
            ):
                # Format event for client
                # event is a dict like {'node_name': state_update}
                # e.g., {'moderator': {'moderation_result': {...}}}
                
                if "moderator" in event:
                    yield json.dumps({"type": "status", "stage": "moderation", "message": "Moderation complete."}) + "\n"
                elif "extractor" in event:
                    yield json.dumps({"type": "status", "stage": "extraction", "message": "Entity extraction complete."}) + "\n"
                elif "ingestor" in event:
                    yield json.dumps({"type": "status", "stage": "ingestion", "message": "Ingested into vector store and graph."}) + "\n"
                
                # Check for final response in any node update
                for node_name, state_update in event.items():
                    if "final_response" in state_update:
                        yield json.dumps({"type": "result", "payload": state_update["final_response"]}) + "\n"
                
                # Small delay to ensure flush if needed, though usually not required
                await asyncio.sleep(0.01)

        except Exception as e:
            import traceback
            traceback.print_exc()
            yield json.dumps({"type": "error", "message": str(e)}) + "\n"

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")
