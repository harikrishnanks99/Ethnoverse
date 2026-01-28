from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List
from utils import get_llm

model = get_llm()

class EntityList(BaseModel):
    entities: List[str] = Field(description="A list of key entities extracted from the query")

parser = JsonOutputParser(pydantic_object=EntityList)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a Query Analyzer AI. Extract key entities (names, places, concepts, objects) from the user's search query to be used for a knowledge graph lookup.\n"
               "Return ONLY the most important terms. Do not include stop words.\n"
               "{format_instructions}"),
    ("user", "Query: {query}")
])

chain = prompt | model | parser

async def extract_query_entities(query: str) -> List[str]:
    """
    Extracts key entities from a search query using the configured LLM.
    """
    try:
        result = await chain.ainvoke({
            "query": query, 
            "format_instructions": parser.get_format_instructions()
        })
        return result.get("entities", [])
    except Exception as e:
        print(f"Error extracting entities from query: {e}")
        return []
