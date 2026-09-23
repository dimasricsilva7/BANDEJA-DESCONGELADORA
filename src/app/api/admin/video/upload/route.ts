import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAdmin } from "@/lib/admin-guard";

const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_SIZE = 150 * 1024 * 1024; // 150MB

export async function POST(request: Request): Promise<NextResponse> {
  const { admin, response } = await requireAdmin();
  if (!admin) return response;

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_TYPES,
        maximumSizeInBytes: MAX_SIZE,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
