import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.chat_models import ChatOllama
from langchain_openai import ChatOpenAI

def get_llm():
    """
    Factory function to return the LLM instance based on environment configuration.
    """
    provider = os.getenv("LLM_PROVIDER", "gemini").lower()
    
    if provider == "gemini":
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY is not set for Gemini provider")
        return ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key, temperature=0, max_retries=1)
    
    elif provider == "ollama":
        base_url = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
        model = os.getenv("OLLAMA_MODEL", "llama3") # Default to llama3 or user choice
        return ChatOllama(base_url=base_url, model=model, temperature=0)
    
    elif provider == "openai":
        return ChatOpenAI(model="gpt-4-turbo-preview", temperature=0)
        
    else:
        raise ValueError(f"Unsupported LLM_PROVIDER: {provider}")
