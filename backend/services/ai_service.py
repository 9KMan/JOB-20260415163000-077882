import os
import openai
from anthropic import Anthropic
from tenacity import retry, stop_after_attempt, wait_exponential


class AIService:
    def __init__(self):
        openai.api_key = os.getenv("OPENAI_API_KEY")
        self.anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.model = os.getenv("AI_MODEL", "openai")

    @retry(
        stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def generate_response(self, prompt: str, system_prompt: str = "") -> str:
        if self.model == "anthropic":
            return await self._anthropic_generate(prompt, system_prompt)
        return await self._openai_generate(prompt, system_prompt)

    async def _openai_generate(self, prompt: str, system_prompt: str) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = openai.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )
        return response.choices[0].message.content

    async def _anthropic_generate(self, prompt: str, system_prompt: str) -> str:
        messages = []
        if system_prompt:
            messages.append(
                {"role": "user", "content": f"System: {system_prompt}\n\n{prompt}"}
            )
        else:
            messages.append({"role": "user", "content": prompt})

        message = self.anthropic.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=1024,
            messages=messages,
        )
        return message.content[0].text

    async def analyze_lead(self, lead_data: dict) -> str:
        prompt = f"""Analyze this lead and provide:
1. Key strengths and weaknesses
2. Conversion likelihood assessment  
3. Recommended next steps
4. Potential concerns to address

Lead Data: {lead_data}"""

        return await self.generate_response(
            prompt,
            system_prompt="You are an expert sales analyst and lead generation specialist.",
        )

    async def score_lead(self, lead_data: dict) -> str:
        prompt = f"""Score this lead 0-100 based on:
1. Contact information quality (complete, valid email)
2. Company information (size, industry relevance)
3. Lead engagement indicators
4. Overall fit for our product/service

Lead Data: {lead_data}

Return the numeric score followed by a brief justification."""

        return await self.generate_response(
            prompt,
            system_prompt="You are an expert at evaluating lead quality and conversion potential.",
        )

    async def compose_email(self, lead_data: dict) -> str:
        prompt = f"""Compose a personalized outreach email for this lead.

Requirements:
1. Attention-grabbing subject line
2. Personalized opening that references their company or role
3. Clear value proposition tailored to their industry
4. Specific call-to-action
5. Professional sign-off

Lead Data: {lead_data}"""

        return await self.generate_response(
            prompt,
            system_prompt="You are an expert sales copywriter specializing in B2B outreach.",
        )


ai_service = AIService()
