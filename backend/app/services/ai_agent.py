import os
import json
from typing import Dict, Any
from loguru import logger

# 🚀 MODERN LANGCHAIN v0.3+ STANDARDS
from langgraph.prebuilt import create_react_agent
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool

class SafeConfigAgent:
    """
    The Reasoning Engine for SafeConfig Duo.
    Orchestrates Anthropic (Security) and Gemini (Sustainability) models.
    """

    @staticmethod
    @tool
    def fetch_blast_radius(feature_key: str) -> str:
        """
        Queries Redis/PostgreSQL for real-time user traffic for a specific feature.
        Call this tool to determine the 'High Impact' status of a deployment.
        """
        try:
            # 🔗 Lazy import to avoid circular dependencies during Flask boot
            from app.services.traffic_service import get_live_traffic
            count = get_live_traffic(feature_key)
            return f"Feature '{feature_key}' currently has {count} active users in Production."
        except Exception as e:
            logger.warning(f"Traffic tool failed: {e}")
            return "Traffic data unavailable. Assume high impact (5000+ users) for safety."

    @classmethod
    def run_audit(cls, feature_key: str, environment: str, code_diff: str, description: str) -> Dict[str, Any]:
        """
        Executes an agentic reasoning loop using Claude 3.5 Sonnet.
        Parallelizes with Gemini 1.5 Flash for Sustainability scoring.
        """
        # 1. Initialize the Security Specialist (Claude 3.5)
        llm = ChatAnthropic(
            model="claude-3-5-sonnet-latest", 
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
            temperature=0
        )

        tools = [cls.fetch_blast_radius]
        
        # 🛡️ System Instructions for the $10,000 Grand Prize Category
        system_instructions = (
            "You are 'SafeConfig Duo', an Autonomous Senior DevOps & Security Agent.\n"
            "Your mission: Audit Merge Requests for deployment risk and blast radius.\n\n"
            "OPERATIONAL PROTOCOL:\n"
            "1. TOOL USE: You MUST call 'fetch_blast_radius' for every audit to see live impact.\n"
            "2. RISK LOGIC: If users > 5000, risk_score MUST be >= 8. If sensitive (Auth/Payments), score +2.\n"
            "3. MITIGATION: If the diff shows a 'try/catch' or 'circuit breaker', reduce score by 1.\n"
            "4. OUTPUT: Return ONLY a raw JSON object. No markdown, no conversational filler.\n\n"
            "REQUIRED KEYS:\n"
            "- risk_score (int: 1-10)\n"
            "- risk_level (str: low, medium, high)\n"
            "- reasoning (str: concise technical justification)\n"
            "- status (str: PASSED, BLOCKED, or WARNING)"
        )

        # 🏗️ Create the ReAct Agent (Replacing legacy AgentExecutor)
        agent_executor = create_react_agent(llm, tools, state_modifier=system_instructions)

        try:
            input_context = (
                f"Audit Request:\n"
                f"Feature Key: {feature_key}\n"
                f"Target Environment: {environment}\n"
                f"Context: {description}\n"
                f"Code Diff: {code_diff}"
            )
            
            # 🧠 Start the Agentic Reasoning Loop
            result = agent_executor.invoke({"messages": [("human", input_context)]})
            final_content = result["messages"][-1].content
            
            # Use our helper to strip any LLM markdown/chatter
            from app.helpers import clean_llm_json
            report = clean_llm_json(final_content)

            # 🌿 2. Parallel Sustainability Audit (Gemini 1.5 Flash)
            # Targets the $3,000 Green Software Bonus Category
            green_data = cls.get_sustainability_impact(code_diff)
            
            # Merge results for the AuditLog database model
            report["sustainability_score"] = green_data.get("sustainability_score", 5)
            report["green_advice"] = green_data.get("green_advice", "Efficiency audit skipped.")

            logger.success(f"Audit Complete: {feature_key} | Risk: {report.get('risk_score')}/10")
            return report

        except Exception as e:
            logger.error(f"Duo Reasoning Engine Failure: {str(e)}")
            return {
                "risk_score": 10, 
                "risk_level": "high",
                "reasoning": "Internal Agent Error. High-risk fallback triggered.", 
                "status": "BLOCKED",
                "sustainability_score": 5
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
                "Look for: O(n^2) loops, redundant API calls, and missing cache logic.\n"
                f"Diff: {code_diff}\n\n"
                "Return ONLY raw JSON: {\"sustainability_score\": 1-10, \"green_advice\": \"\"}"
            )
            
            response = gemini.invoke(prompt)
            from app.helpers import clean_llm_json
            return clean_llm_json(response.content)
        except Exception as e:
            logger.warning(f"Sustainability check bypassed: {e}")
            return {"sustainability_score": 5, "green_advice": "Green audit unavailable."}