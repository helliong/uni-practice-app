import { basename, extname, join } from "node:path";

const contentTypesByExtension: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export function getUploadedProductImage(fileName: string, uploadDirectory: string) {
  if (basename(fileName) !== fileName) {
    return null;
  }

  const contentType = contentTypesByExtension[extname(fileName).toLowerCase()];

  if (!contentType) {
    return null;
  }

  return {
    contentType,
    path: join(uploadDirectory, fileName),
  };
}
