// src/app/listings/api/route.ts
import { NextResponse } from "next/server";

// ✅ Used only to force Next.js to treat /listings as dynamic
export async function GET() {
  return NextResponse.json({
    message: "Dynamic listings route active. This prevents static export.",
  });
}
