import os
from langchain_chroma import Chroma
from langchain_community.embeddings import FastEmbedEmbeddings, OllamaEmbeddings
from chromadb.config import Settings
from langchain_openai import OpenAIEmbeddings
from dotenv import load_dotenv

load_dotenv()

def get_embeddings():
    """
    Factory function to return the Embeddings instance based on environment configuration.
    """
    provider = os.getenv("LLM_PROVIDER", "gemini").lower()
    
    if provider == "gemini":
        # Google API is timeout-prone in this environment, using local fallback
        # FastEmbed is lightweight and doesn't require PyTorch/heavy build
        return FastEmbedEmbeddings(
            model_name="BAAI/bge-small-en-v1.5",
            cache_dir="./.cache/fastembed"
        )
    
    elif provider == "ollama":
        base_url = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
        model = os.getenv("OLLAMA_MODEL", "llama3") 
        return OllamaEmbeddings(base_url=base_url, model=model)
    
    elif provider == "openai":
         return OpenAIEmbeddings()
        
    else:
        raise ValueError(f"Unsupported LLM_PROVIDER: {provider}")

import chromadb

_vectorstore = None

def get_vector_store():
    """
    Returns the Chakra vector store instance.
    """
    global _vectorstore
    if _vectorstore is not None:
        return _vectorstore

    persist_directory = os.getenv("VECTOR_DB_PATH", "./chroma_db")
    embeddings = get_embeddings()
    
    persistent_client = chromadb.PersistentClient(path=persist_directory)

    _vectorstore = Chroma(
        client=persistent_client,
        collection_name="ethnoverse_knowledge",
        embedding_function=embeddings,
    )
    return _vectorstore

def get_all_documents(community_id: str = None, limit: int = 100):
    """
    Retrieves documents from the vector store.
    """
    vector_store = get_vector_store()
    
    # Chroma get method supports where filter
    where_filter = {}
    if community_id:
        # Assuming we stored community_id in metadata as string
        where_filter = {"community_id": str(community_id)}
    
    # We use the underlying collection to get raw data
    # vector_store.get() returns a dict with 'ids', 'embeddings', 'documents', 'metadatas'
    if community_id:
         results = vector_store.get(where=where_filter, limit=limit)
    else:
         results = vector_store.get(limit=limit)
         
    # Transform raw Chroma result into list of dicts
    # Chroma result: {'ids': [], 'embeddings': None, 'documents': [], 'metadatas': []}
    documents = []
    ids = results.get("ids", [])
    texts = results.get("documents", [])
    metadatas = results.get("metadatas", [])
    
    for i in range(len(ids)):
        documents.append({
            "id": ids[i],
            "page_content": texts[i],
            "metadata": metadatas[i] if metadatas[i] else {}
        })

    return documents

def delete_document(document_id: str):
    """
    Deletes a document from the vector store by its ID.
    """
    vector_store = get_vector_store()
    try:
        vector_store.delete(ids=[document_id])
        return True
    except Exception as e:
        print(f"Error deleting document {document_id} from vector store: {e}")
        return False

def semantic_search(query: str, community_id: str = None, k: int = 4):
    """
    Performs a semantic similarity search on the vector store.
    Optionally filters by community_id.
    Returns a list of tuples: (Document, score)
    """
    vector_store = get_vector_store()
    
    filter_dict = {}
    if community_id and community_id.lower() != "global":
        filter_dict = {"community_id": str(community_id)}
        
    # similarity_search_with_score returns lower score for more similar (L2 distance usually)
    # depending on the distance metric configured.
    if filter_dict:
        results = vector_store.similarity_search_with_score(query, k=k, filter=filter_dict)
    else:
        results = vector_store.similarity_search_with_score(query, k=k)
        
    # Format results
    formatted_results = []
    for doc, score in results:
        formatted_results.append({
            "page_content": doc.page_content,
            "metadata": doc.metadata,
            "score": float(score)
        })
        
    # Apply dynamic relative threshold filtering
    if not formatted_results:
        return []
        
    # In Chroma default (L2/Cosine), lower score is better.
    # Find the best (minimum) score.
    best_score = min(r["score"] for r in formatted_results)
    
    # Filter out results that are significantly worse than the best match.
    # A relative threshold of +0.3 is generally safe for cosine distance.
    # Adjust this value based on empirical results.
    acceptable_results = [
        r for r in formatted_results 
        if r["score"] <= best_score + 0.25
    ]
    
    return acceptable_results
