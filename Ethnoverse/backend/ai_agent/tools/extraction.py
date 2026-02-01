from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List
from utils import get_llm

model = get_llm()

class Entity(BaseModel):
    name: str = Field(description="Name of the entity")
    type: str = Field(description="Type of entity, e.g., Person, Location, Concept, Event, Artifact")

class Relationship(BaseModel):
    source: str = Field(description="Source entity name")
    target: str = Field(description="Target entity name")
    relation: str = Field(description="Relationship type, e.g., LOCATED_IN, RELATED_TO, AUTHORED_BY")

class KnowledgeGraphOutput(BaseModel):
    entities: List[Entity]
    relationships: List[Relationship]

parser = JsonOutputParser(pydantic_object=KnowledgeGraphOutput)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a Knowledge Engineer AI. Extract key entities and relationships from the text to build a knowledge graph.\n"
               "Focus on cultural concepts, people, places, and historical events.\n"
               "IMPORTANT: Also create a 'MENTIONED_IN' relationship for every extracted entity pointing to the Source Content ID provided.\n"
               "{format_instructions}"),
    ("user", "Text: {text}\nSource Content ID: {content_id}")
])

chain = prompt | model | parser

async def extract_knowledge(text: str, content_id: str) -> dict:
    return await chain.ainvoke({
        "text": text, 
        "content_id": content_id,
        "format_instructions": parser.get_format_instructions()
    })
