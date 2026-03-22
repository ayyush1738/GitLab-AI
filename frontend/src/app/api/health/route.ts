import { NextResponse } from "next/server";
import axios from "axios";

/**
 * 🏥 System Health Oracle
 * Purpose: Used by Google Cloud Run liveness/readiness probes.
 * Logic: Performs a 'Circuit Check' to ensure the Backend-to-Frontend 
 * bridge in Jaipur is operational.
 */
export async function GET() {
  const startTime = Date.now();
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  try {
    // 1. Check Flask Backend Connectivity
    // We hit a simple ping endpoint on your Python server
    const backendRes = await axios.get(`${backendUrl}/health`, { timeout: 2000 });
    const isBackendUp = backendRes.status === 200;

    // 2. Calculate Latency (Critical for Jaipur-South1 edge metrics)
    const latency = Date.now() - startTime;

    // 3. Construct System Status Report
    return NextResponse.json(
      {
        status: "UP",
        region: process.env.NEXT_PUBLIC_APP_REGION || "IN-WEST-1",
        version: "1.0.0-PROD",
        latency: `${latency}ms`,
        services: {
          frontend: "HEALTHY",
          backend: isBackendUp ? "HEALTHY" : "DEGRADED",
          orchestrator: "CLAUDE_GEMINI_READY",
        },
        timestamp: new Date().toISOString(),
      },
      { 
        status: isBackendUp ? 200 : 207 // 207 Multi-Status if one service is down
      }
    );
  } catch (error) {
    // 🚨 Critical Failure: Cloud Run will restart the container if this returns 500
    return NextResponse.json(
      {
        status: "DOWN",
        error: "Backend communication timeout",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// 🛑 Force Dynamic: Ensures Next.js doesn't cache the health status during build
export const dynamic = "force-dynamic";