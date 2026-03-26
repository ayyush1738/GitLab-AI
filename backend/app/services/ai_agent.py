import os
import json
from typing import Dict, Any
from loguru import logger

# ðŸš€ MODERN LANGCHAIN STANDARDS
from langgraph.prebuilt import create_react_agent
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool

class GitGuardianAgent:
    """
    The Reasoning Engine for GitGuardian Duo.
    Orchestrates Anthropic (Security) and Gemini (Sustainability) models.
    """

    @staticmethod
    @tool
    def fetch_blast_radius(feature_key: str) -> str:
        """
        Queries Redis/PostgreSQL for real-time user traffic for a specific feature.
        MUST be called to determine the 'High Impact' status of a deployment.
        """
        try:
            # ðŸ”— Lazy import to avoid circular dependencies during Flask boot
            from app.services.traffic_service import get_live_traffic
            count = get_live_traffic(feature_key)
            return f"Feature '{feature_key}' currently has {count} active users in Production."
        except Exception as e:
            logger.warning(f"Traffic tool failed: {e}")
            return "Traffic data unavailable. Assume high impact (5000+ users) for safety."

    @classmethod
    def run_audit(cls, feature_key: str, environment: str, code_diff: str, description: str, blast_radius: int = 0) -> Dict[str, Any]:
        """
        Executes an agentic reasoning loop using Claude 3.5 Sonnet.
        Parallelizes with Gemini 1.5 Flash for Sustainability scoring.
        """
        
        # 1. Initialize Gemini 1.5 Pro (Security Specialist)
        # 🧪 FALLBACK: Switched from Anthropic to Gemini due to credit depletion.
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-pro", 
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0
        )

        tools = [cls.fetch_blast_radius]
        
        # ðŸ›¡ï¸ Governance Protocol for the $10,000 Grand Prize Category
        system_instructions = (
            "You are 'GitGuardian Duo', an Autonomous Senior DevOps & Security Agent.\n"
            "Your mission: Audit Merge Requests for deployment risk and blast radius.\n\n"
            "OPERATIONAL PROTOCOL:\n"
            "1. TOOL USE: You MUST call 'fetch_blast_radius' for every audit to see live impact.\n"
            "2. RISK LOGIC: If users > 5000, risk_score MUST be >= 8. If sensitive (Auth/Payments), score +2.\n"
            "3. MITIGATION: If the diff shows a 'try/catch' or 'circuit breaker', reduce score by 1.\n"
            "4. OUTPUT: Return ONLY a raw JSON object. No markdown, no conversational filler.\n\n"
            "REQUIRED JSON KEYS:\n"
            "- risk_score (int: 1-10)\n"
            "- risk_level (str: low, medium, high)\n"
            "- reasoning (str: concise technical justification)\n"
            "- status (str: PASSED, BLOCKED, or WARNING)"
        )

        # ðŸ—ï¸ UNIVERSAL AGENT CONSTRUCTOR
        # We remove the modifier keywords entirely to stop the 500 TypeError.
        # This makes the code compatible with older and newer LangGraph versions.
        agent_executor = create_react_agent(llm, tools)

        try:
            # ðŸ›¡ï¸ SYSTEM PROMPT INJECTION
            # We pass the instructions as a 'system' message directly in the invoke call.
            input_context = (
                f"{system_instructions}\n\n" 
                f"Audit Request:\n"
                f"Feature Key: {feature_key}\n"
                f"Target Environment: {environment}\n"
                f"Context: {description}\n"
                f"Code Diff: {code_diff}"
            )
            
            # ðŸ§  Start the Agentic Reasoning Loop
            result = agent_executor.invoke({"messages": [("human", input_context)]})
            
            # Extract content from the last response in the thread
            final_content = result["messages"][-1].content
            
            from app.helpers import clean_llm_json
            report = clean_llm_json(final_content)

            # ðŸŒ¿ 2. Parallel Sustainability Audit (Gemini 1.5 Flash)
            green_data = cls.get_sustainability_impact(code_diff)
            
            # Enrich the report for the AuditLog
            report["sustainability_score"] = green_data.get("sustainability_score", 5)
            report["green_advice"] = green_data.get("green_advice", "Efficiency audit skipped.")

            logger.success(f"Audit Complete: {feature_key} | Risk: {report.get('risk_score')}/10")
            return report

        except Exception as e:
            logger.error(f"Duo Reasoning Engine Failure: {str(e)}")
            return {
                "risk_score": 10, 
                "risk_level": "high",
                "reasoning": f"Critical AI Failure: {str(e)}. Fallback to BLOCKED status for safety.", 
                "status": "BLOCKED",
                "sustainability_score": 1
            }

    @staticmethod
    def get_sustainability_impact(code_diff: str) -> Dict[str, Any]:
        """
        Uses Gemini 1.5 Flash to analyze code for carbon efficiency.
        """
        try:
            gemini = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=os.getenv("GOOGLE_API_KEY"),
                temperature=0
            )

            prompt = (
                "Review this code diff for environmental sustainability.\n"
                "Focus on: Redundant loops, heavy API calls, or missing caching.\n"
                f"Diff: {code_diff}\n\n"
                "Return ONLY raw JSON: {\"sustainability_score\": 1-10, \"green_advice\": \"\"}"
            )
            
            response = gemini.invoke(prompt)
            from app.helpers import clean_llm_json
            return clean_llm_json(response.content)
        except Exception as e:
            logger.warning(f"Sustainability check bypassed: {e}")
            return {"sustainability_score": 5, "green_advice": "Green audit unavailable."}