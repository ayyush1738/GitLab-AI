import { NextRequest, NextResponse } from "next/server";
import { AiService } from "@/services/ai.service";
import { FlagsService } from "@/services/flag.service"; // ✅ Now used for validation

/**
 * 🦊 GitLab Webhook Guardian
 * Purpose: Automated AI Audit of incoming GitLab Push/Merge events.
 * 🚀 Grand Prize Feature: Pre-checks the registry before triggering Claude 3.5.
 */
export async function POST(req: NextRequest) {
  try {
    // 🛡️ Security: Verify GitLab Secret Token
    const gitlabToken = req.headers.get("x-gitlab-token");
    if (gitlabToken !== process.env.GITLAB_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized Handshake" }, { status: 401 });
    }

    const payload = await req.json();

    if (payload.object_kind === "push") {
      const commits = payload.commits || [];
      
      for (const commit of commits) {
        const message = commit.message.toLowerCase();
        
        // 🧪 Heuristic: Find associated Flag Key in the commit (e.g., "FEAT-101-feat")
        const flagKeyMatch = message.match(/[a-z0-9-]+-feat/g);
        
        if (flagKeyMatch) {
          const flagKey = flagKeyMatch[0];

          // 📡 Step 1: Validate against our Flag Registry
          // This resolves the 'FlagsService' is unused error
          const allFlags = await FlagsService.getAllFlags();
          const flagExists = allFlags.find(f => f.key === flagKey);

          if (!flagExists) {
            console.warn(`⚠️ Webhook: Commit refers to unknown flag ${flagKey}. Skipping audit.`);
            continue;
          }

          // 🧠 Step 2: Duo-Agent Orchestration
          console.log(`📡 GitLab Webhook: Auditing ${flagKey} via Claude 3.5...`);
          
          await AiService.analyzeRisk({
            feature_key: flagKey,
            environment: "Production",
            code_diff: commit.url, 
            description: `Automated audit triggered by GitLab Push: ${commit.id.substring(0, 8)}`,
          });
        }
      }
    }

    return NextResponse.json({ 
      status: "EVENT_PROCESSED", 
      orchestrator: "SAFE_CONFIG_AI_V1",
      timestamp: new Date().toISOString() 
    });

  } catch (error) {
    console.error("🚨 Webhook Processing Failed:", error);
    return NextResponse.json({ error: "Internal Pipeline Error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";