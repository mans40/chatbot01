import logging
import asyncio
from typing import AsyncGenerator, List, Dict, Any
from openai import AsyncOpenAI
from app.core.config import settings
from app.rag.rag_service import rag_service
from app.memory.memory_service import memory_service

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        if self.api_key:
            self.client = AsyncOpenAI(api_key=self.api_key)
            logger.info("OpenAI client initialized successfully.")
        else:
            self.client = None
            logger.warning("OPENAI_API_KEY not set. AuraChat will run in simulated mode.")

    async def detect_intent(self, message: str) -> str:
        """Classify the user's query intent into support categories."""
        message_lower = message.lower()
        
        # Fast rule-based heuristics
        if any(g in message_lower for g in ["hello", "hi", "hey", "good morning", "good afternoon"]):
            return "Greeting"
        if any(b in message_lower for b in ["bill", "price", "pricing", "payment", "subscription", "cost"]):
            return "Billing/Pricing"
        if any(t in message_lower for b in ["error", "bug", "broken", "fail", "not working", "crash", "install"]):
            return "Technical Support"
        
        # If API key is set, we can refine classification using GPT-4o-mini (asynchronously)
        if self.client:
            try:
                response = await self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "Classify this customer query into one of these intents: Greeting, Technical Support, Billing/Pricing, General Info, or Feedback/Complaint. Respond with ONLY the intent name."},
                        {"role": "user", "content": message}
                    ],
                    max_tokens=10,
                    temperature=0.0
                )
                intent = response.choices[0].message.content.strip()
                return intent
            except Exception as e:
                logger.error(f"Error during LLM intent detection: {e}")
        
        return "General Info"

    async def generate_response_stream(
        self, session_id: str, message: str, user_id: int = None
    ) -> AsyncGenerator[str, None]:
        """Streams responses using RAG, conversation memory, and OpenAI."""
        
        # 1. Detect Intent
        intent = await self.detect_intent(message)
        logger.info(f"Detected intent '{intent}' for session {session_id}")

        # 2. Retrieve RAG Context (semantic search)
        search_results = rag_service.search_similar(message, n_results=3)
        context_str = ""
        sources = []
        if search_results:
            context_str = "\n\n".join([f"Source: {res['metadata'].get('filename', 'Unknown')}\nContext: {res['content']}" for res in search_results])
            sources = list(set([res['metadata'].get('filename', 'Unknown') for res in search_results]))

        # 3. Retrieve Conversation History
        history = memory_service.get_history(session_id, limit=6)
        
        # Construct system prompt
        system_prompt = (
            "You are AuraChat, an advanced AI Customer Support Assistant.\n"
            "Your goal is to provide accurate, professional, and friendly assistance to customers.\n"
            "Use the provided context sections to answer the user's question. If you do not know the answer "
            "based on the context, politely state that you don't have that specific document context, but provide "
            "a general helpful answer anyway.\n\n"
            f"Current Query Intent Category: {intent}\n\n"
        )
        if context_str:
            system_prompt += f"--- CONTEXT DOCUMENTS ---\n{context_str}\n-------------------------\n"
        else:
            system_prompt += "No custom company document context is currently available. Answer to the best of your ability.\n"
            
        system_prompt += "\nFormat your output in clean, readable Markdown. If formatting code blocks, specify the language."

        # Save user message to memory
        memory_service.add_message(session_id, "user", message)

        # 4. Generate & Stream response
        if self.client:
            try:
                # Prepare conversation payload for LLM
                api_messages = [{"role": "system", "content": system_prompt}]
                for hist_msg in history:
                    api_messages.append({"role": hist_msg["role"], "content": hist_msg["content"]})
                api_messages.append({"role": "user", "content": message})

                response = await self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=api_messages,
                    stream=True,
                    temperature=0.7
                )
                
                full_reply = ""
                async for chunk in response:
                    content = chunk.choices[0].delta.content
                    if content:
                        full_reply += content
                        yield content

                # Append assistant reply to memory
                memory_service.add_message(session_id, "assistant", full_reply)
                return
            except Exception as e:
                logger.error(f"OpenAI Streaming error: {e}. Falling back to simulator.")
                # Fall through to simulated response on error
        
        # --- Simulated Response Mode (Fallbacks) ---
        yield "*(Simulated AuraChat Agent)*\n\n"
        await asyncio.sleep(0.2)
        
        if intent == "Greeting":
            reply = "Hello! Welcome to AuraChat Customer Support. How can I help you today?"
        elif context_str:
            reply = f"I found some information in your uploaded documentation (**{', '.join(sources)}**):\n\n"
            # Summarize the first context block briefly for simulation
            summary = search_results[0]["content"][:300] + "..."
            reply += f"> {summary}\n\nCan I help clarify anything else regarding this?"
        elif intent == "Billing/Pricing":
            reply = "I understand you have a question about billing or pricing. For detailed pricing structures, please refer to your admin console under billing or reach out to our accounts desk at billing@company.com. Is there a specific plan you would like to know about?"
        elif intent == "Technical Support":
            reply = "It sounds like you're experiencing a technical issue. To troubleshoot, please ensure:\n1. Your local cache is cleared.\n2. You are using the latest version of your browser.\n3. Verify your connection settings.\n\nCould you please share any specific error codes you are seeing?"
        else:
            reply = f"Thank you for contacting support. You asked: \"{message}\"\n\nTo enable production AI responses, please go to the **Settings** panel and add your `OPENAI_API_KEY`."

        # Stream the simulated reply in chunks
        chunk_size = 8
        for i in range(0, len(reply), chunk_size):
            chunk = reply[i:i+chunk_size]
            yield chunk
            await asyncio.sleep(0.03)

        memory_service.add_message(session_id, "assistant", reply)

openai_service = OpenAIService()
