import os
import json
import logging
from typing import Dict, Any

# 🚀 MODERN LANGCHAIN v0.3+ IMPORTS
# Replacing deprecated paths with the high-level create_agent API
from langchain.agents import create_agent
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

class SafeConfigAgent:
    """
    The Reasoning Engine for SafeConfig Duo.
    Orchestrates Anthropic (Reasoning) and Gemini (Efficiency) LLMs.
    Refactored for LangChain v0.3+ standards.
    """

    @staticmethod
    @tool
    def fetch_blast_radius(feature_key: str, environment: str) -> str:
        """Queries the database for real-time user traffic (hits) for a specific feature."""
        # This mirrors your work on optimizing model serving pipelines and API enhancements
        from app.services.traffic_service import TrafficService
        stats = TrafficService.get_live_traffic_context(feature_key, environment)
        return f"Feature {feature_key} in {environment} has {stats.get('hits_24h', 0)} hits in the last 24h."

    @classmethod
    def run_audit(cls, feature_key: str, environment: str, code_diff: str, description: str, traffic_context: Dict) -> Dict[str, Any]:
        """
        Executes an agentic reasoning loop using Claude 3.5 Sonnet via LangGraph-backed create_agent.
        Targets high-accuracy risk assessment for the $10k Google Cloud Bonus.
        """
        
        # 1. Setup the Primary Reasoning LLM (Anthropic)
        # Matches your experience with complex Java/SpringBoot platforms
        llm = ChatAnthropic(
            model="claude-3-5-sonnet-latest", 
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
            temperature=0
        )

        # 2. Define the Agent's "Teammate" Persona
        # Incorporates the 'Secure, role-based' logic from your Violetis project
        prompt = ChatPromptTemplate.from_messages([
            ("system", """
            You are 'GitGuardian Duo', an Autonomous Senior DevOps & Security Agent.
            Your mission is to audit Merge Requests for risk and compliance.
            
            RULES:
            1. SENSITIVITY: If code impacts 'payments', 'auth', or 'database', risk is inherently HIGH.
            2. BLAST RADIUS: Use the 'fetch_blast_radius' tool. If hits > 1000, risk_score must be >= 8.
            3. MITIGATION: If the developer mentioned 'circuit breaker' or 'feature flag', reduce risk_score by 2.
            
            OUTPUT: You must return a valid JSON object with:
            - risk_score (1-10)
            - advice (technical explanation)
            - risk_level (low, medium, high)
            """),
            ("human", f"Audit this change:\nEnv: {environment}\nFeature: {feature_key}\nDescription: {description}\nCode Diff: {code_diff}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])

        # 3. Bind Tools and Execute using the new create_agent standard
        tools = [cls.fetch_blast_radius]
        
        # create_agent replaces the legacy create_tool_calling_agent and AgentExecutor
        agent = create_agent(
            llm,
            tools=tools,
            messages_modifier=prompt # Modern way to pass system instructions and history
        )

        try:
            # Execute the reasoning loop
            # Uses the standardized .invoke() pattern for LangGraph-based agents
            result = agent.invoke({
                "input": f"Perform a high-impact audit on {feature_key}."
            })
            
            # The new API returns the final output under the 'output' key
            output_text = result.get("output", "{}")
            
            # Clean Markdown formatting and parse JSON
            from app.utils.helpers import clean_llm_json
            report = clean_llm_json(output_text)

            # 4. Supplemental Sustainability Audit (Gemini 1.5 Flash)
            # Utilizing the 'Green Agent' category as seen in your recent projects
            green_report = cls.get_sustainability_impact(code_diff)
            report["sustainability_audit"] = green_report

            logger.info(f"Agent Audit Complete: {feature_key} -> Score: {report.get('risk_score')}")
            return report

        except Exception as e:
            logger.error(f"Agentic Audit Failed: {str(e)}")
            return {
                "risk_score": 7, 
                "advice": "Agent reasoning failed. Defaulting to High-Safety mode.", 
                "risk_level": "high",
                "status": "FAIL_SAFE"
            }

    @staticmethod
    def get_sustainability_impact(code_diff: str) -> Dict[str, Any]:
        """
        Specialized analysis for carbon-efficient coding using Gemini 1.5 Flash.
        Reflects your interest in high-throughput media verification and system reliability.
        """
        try:
            gemini = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=os.getenv("GOOGLE_API_KEY"),
                temperature=0
            )

            prompt = f"""
            Analyze this code diff for environmental sustainability (carbon impact).
            Look for:
            1. Inefficient loops (O(n^2) or higher).
            2. N+1 Database queries.
            3. Lack of caching for heavy operations (like Redis integration).
            
            Code: {code_diff}
            
            Return ONLY a valid JSON object: {{"score": 1-10, "warnings": [], "green_advice": ""}}
            """
            
            response = gemini.invoke(prompt)
            from app.utils.helpers import clean_llm_json
            return clean_llm_json(response.content)
        except Exception as e:
            logger.warning(f"Sustainability audit skipped: {e}")
            return {"score": 0, "warnings": ["Audit service unavailable"]}