import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getUploadedProductImage } from "@/lib/images/uploadedProductImage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileName: string }> },
) {
  const { fileName } = await params;
  const image = getUploadedProductImage(
    fileName,
    join(process.cwd(), "public", "uploads"),
  );

  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await readFile(image.path);

    return new Response(file, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(file.byteLength),
        "Content-Type": image.contentType,
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
