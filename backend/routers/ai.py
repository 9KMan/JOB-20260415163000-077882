from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
import os
import openai
from anthropic import Anthropic
from tenacity import retry, stop_after_attempt, wait_exponential

from ..schemas.leads import AIAgentRequest, AIAgentResponse

router = APIRouter(prefix="/api/leads", tags=["ai"])

openai.api_key = os.getenv("OPENAI_API_KEY")
anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


@router.post("/ai-assist", response_model=AIAgentResponse)
async def ai_agent_endpoint(request: AIAgentRequest):
    prompt = ""
    action = request.action

    if action == "analyze":
        prompt = f"""Analyze this lead and provide:
1. Key strengths and weaknesses
2. Conversion likelihood assessment
3. Recommended next steps
4. Potential concerns to address"""
    elif action == "score":
        prompt = f"""Score this lead 0-100 based on:
1. Contact information quality
2. Company relevance
3. Engagement indicators
4. Overall fit

Return only the numeric score with brief justification."""
    elif action == "compose":
        prompt = f"""Compose a personalized outreach email for this lead. Include:
1. Attention-grabbing subject line
2. Personalized opening
3. Value proposition
4. Clear call-to-action
5. Professional sign-off"""

    try:
        result = await generate_ai_response(prompt, action)
        return AIAgentResponse(
            action=action,
            result=result,
            leadId=request.leadId,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI request failed: {str(e)}")


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def generate_ai_response(prompt: str, action: str) -> str:
    model = os.getenv("AI_MODEL", "openai")

    if model == "anthropic":
        message = anthropic.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )
        return message.content[0].text
    else:
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI assistant for lead generation and sales outreach.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        return response.choices[0].message.content
