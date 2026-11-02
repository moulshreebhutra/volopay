import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Reports only whether an AI key exists. Never the key. */
export function GET() {
  return NextResponse.json({ ai: !!process.env.ANTHROPIC_API_KEY });
}
