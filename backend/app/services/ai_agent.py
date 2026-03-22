import os
import logging
from typing import Dict, Any

# 🚀 MODERN LANGCHAIN v0.3+ STANDARDS
from langgraph.prebuilt import create_react_agent
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from loguru import logger

class SafeConfigAgent:
    """
    The Reasoning Engine for SafeConfig Duo.
    Orchestrates Anthropic (Security) and Gemini (Sustainability) models.
    """

    @staticmethod
    @tool
    def fetch_blast_radius(feature_key: str, environment: str = "Production") -> str:
        """
        Queries Redis/PostgreSQL for real-time user traffic for a specific feature.
        Use this to determine if a change is 'High Impact' based on user volume.
        """
        try:
            from app.utils.helpers import get_blast_radius
            count = get_blast_radius(feature_key)
            return f"Feature '{feature_key}' currently has {count} active users in {environment}."
        except Exception as e:
            return f"Could not fetch traffic data: {str(e)}. Assume 0 for safety check."

    @classmethod
    def run_audit(cls, feature_key: str, environment: str, code_diff: str, description: str) -> Dict[str, Any]:
        """
        Executes an agentic reasoning loop using Claude 3.5 via LangGraph.
        """
        
        # 1. Setup Security Reasoning LLM (Claude 3.5)
        llm = ChatAnthropic(
            model="claude-3-5-sonnet-latest", 
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
            temperature=0
        )

        # 2. Tools and System Prompt
        tools = [cls.fetch_blast_radius]
        
        system_instructions = (
            "You are 'SafeConfig Duo', an Autonomous Senior DevOps & Security Agent.\n"
            "Your mission: Audit Merge Requests for risk.\n\n"
            "RULES:\n"
            "1. BLAST RADIUS: Always call 'fetch_blast_radius' first. If users > 5000, risk_score MUST be >= 8.\n"
            "2. SENSITIVITY: Payments, Auth, or DB changes are inherently HIGH risk.\n"
            "3. MITIGATION: If 'circuit breaker' or 'feature flag' is used, reduce risk_score by 2.\n\n"
            "OUTPUT: You MUST return a valid JSON object with:\n"
            "- risk_score (1-10)\n"
            "- risk_level (low, medium, high)\n"
            "- advice (technical explanation)\n"
            "- status (PASSED, BLOCKED, or WARNING)"
        )

        # 3. Initialize the ReAct Agent (LangGraph)
        # This replaces the legacy AgentExecutor
        agent_executor = create_react_agent(llm, tools, state_modifier=system_instructions)

        try:
            # Execute the reasoning loop
            input_msg = (
                f"Audit this deployment:\n"
                f"Feature: {feature_key}\n"
                f"Environment: {environment}\n"
                f"Description: {description}\n"
                f"Diff: {code_diff}"
            )
            
            result = agent_executor.invoke({"messages": [("human", input_msg)]})
            
            # Extract the final message content from the agent
            final_response = result["messages"][-1].content
            
            from app.utils.helpers import clean_llm_json
            report = clean_llm_json(final_response)

            # 4. Supplemental Sustainability Audit (Gemini 1.5 Flash)
            # Parallel-style check for the 'Green Agent' Bonus
            report["sustainability_audit"] = cls.get_sustainability_impact(code_diff)

            logger.success(f"Audit Complete for {feature_key} | Risk: {report.get('risk_score')}")
            return report

        except Exception as e:
            logger.error(f"Agentic Audit Failed: {str(e)}")
            return {
                "risk_score": 9, 
                "advice": "Reasoning engine timed out or failed. Manual override required.", 
                "risk_level": "high",
                "status": "BLOCKED"
            }

    @staticmethod
    def get_sustainability_impact(code_diff: str) -> Dict[str, Any]:
        """
        Specialized analysis for carbon-efficient coding using Gemini 1.5 Flash.
        Targets the $3,000 Green Coding Bonus.
        """
        try:
            gemini = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=os.getenv("GOOGLE_API_KEY"),
                temperature=0
            )

            prompt = (
                "Analyze this code diff for carbon impact and efficiency.\n"
                "Focus on: O(n^2) loops, redundant DB calls, and lack of caching.\n"
                f"Code: {code_diff}\n\n"
                "Return ONLY a valid JSON object: "
                "{\"sustainability_score\": 1-10, \"warnings\": [], \"green_advice\": \"\"}"
            )
            
            response = gemini.invoke(prompt)
            from app.utils.helpers import clean_llm_json
            return clean_llm_json(response.content)
        except Exception as e:
            logger.warning(f"Sustainability audit skipped: {e}")
            return {"sustainability_score": 0, "warnings": ["Efficiency check unavailable"]}