import { NextRequest, NextResponse } from "next/server";

const N8N_WEBHOOK_API_KEY = process.env.N8N_WEBHOOK_API_KEY;

export function verifyWebhookAuth(request: NextRequest): { isValid: boolean; error?: NextResponse } {
  const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "");
  
  if (!N8N_WEBHOOK_API_KEY) {
    console.warn("N8N_WEBHOOK_API_KEY not configured - webhook auth disabled");
    return { isValid: true };
  }
  
  if (!apiKey) {
    return {
      isValid: false,
      error: NextResponse.json(
        { error: "Missing API key. Provide x-api-key header or Authorization: Bearer <key>" },
        { status: 401 }
      ),
    };
  }
  
  if (apiKey !== N8N_WEBHOOK_API_KEY) {
    return {
      isValid: false,
      error: NextResponse.json(
        { error: "Invalid API key" },
        { status: 403 }
      ),
    };
  }
  
  return { isValid: true };
}
