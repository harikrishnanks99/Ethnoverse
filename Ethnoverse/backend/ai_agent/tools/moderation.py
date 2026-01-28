from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List, Optional
from utils import get_llm

model = get_llm()

class ModerationOutput(BaseModel):
    is_approved: bool = Field(description="Whether the content is approved or not")
    reason: Optional[str] = Field(description="Reason for rejection, if any")
    flagged_categories: List[str] = Field(description="List of categories violating rules, e.g. 'hate_speech', 'pii'")

parser = JsonOutputParser(pydantic_object=ModerationOutput)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a Community Moderator AI. Your goal is to review content for a cultural heritage platform.\n\n"
               "Rules:\n"
               "1. No hate speech or offensive language.\n"
               "2. Respect cultural sensitivity.\n"
               "3. No Personally Identifiable Information (PII) of living individuals without consent context.\n"
               "4. Content must be relevant to cultural heritage, history, or community knowledge.\n\n"
               "Analyze the input text and provide a JSON response.\n"
               "{format_instructions}"),
    ("user", "{text}")
])

chain = prompt | model | parser

async def moderate_text(text: str) -> dict:
    return await chain.ainvoke({"text": text, "format_instructions": parser.get_format_instructions()})
