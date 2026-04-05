import { NextRequest, NextResponse } from "next/server";
import vision from "@google-cloud/vision";

const client = new vision.ImageAnnotatorClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  projectId: process.env.GOOGLE_PROJECT_ID,
});

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const [result] = await client.safeSearchDetection({
      image: { content: image },
    });

    const safeSearch = result.safeSearchAnnotation;

    if (!safeSearch) {
      return NextResponse.json(
        { error: "Unable to analyze image" },
        { status: 500 }
      );
    }

    const isUnsafe = safeSearch.violence === "VERY_LIKELY";

    return NextResponse.json({
      safe: !isUnsafe,
      details: safeSearch,
    });
  } catch (error) {
    console.error("Vision error:", error);
    return NextResponse.json(
      { error: "Moderation failed" },
      { status: 500 }
    );
  }
}