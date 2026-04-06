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

    // 🔥 Call Google Vision
    const [result] = await client.safeSearchDetection({
      image: { content: image },
    });

    const safeSearch = result?.safeSearchAnnotation;

    // ✅ FAIL-OPEN: if Vision fails or returns nothing → allow
    if (!safeSearch) {
      console.warn("⚠️ No SafeSearch result, allowing image");
      return NextResponse.json({
        safe: true,
        reason: "No analysis returned",
      });
    }

    // 🔒 Only block VERY_LIKELY harmful content
    const isUnsafe =
      safeSearch.adult === "VERY_LIKELY" ||
      safeSearch.violence === "VERY_LIKELY";

    return NextResponse.json({
      safe: !isUnsafe,
      details: safeSearch,
    });
  } catch (error) {
    console.error("🔥 Vision error (allowing image):", error);

    // ✅ FAIL-OPEN: if API crashes → still allow image
    return NextResponse.json({
      safe: true,
      reason: "Moderation service failed",
    });
  }
}