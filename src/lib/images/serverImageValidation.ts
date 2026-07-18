import {
  formatProductImageSize,
  isAllowedProductImageType,
  isProductImageRatioAllowed,
  PRODUCT_IMAGE_MIN_HEIGHT,
  PRODUCT_IMAGE_MIN_WIDTH,
  PRODUCT_IMAGE_MAX_SIZE_BYTES,
} from "@/lib/images/imageUploadRules";

type ImageDimensions = {
  width: number;
  height: number;
};

function readUInt24LE(buffer: Buffer, offset: number) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function readPngDimensions(buffer: Buffer): ImageDimensions | null {
  const isPng =
    buffer.length >= 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;

  if (!isPng) return null;

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readJpegDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  const sofMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
    0xcf,
  ]);

  while (offset < buffer.length - 1) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    offset += 2;

    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 2 > buffer.length) return null;

    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) {
      return null;
    }

    if (sofMarkers.has(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += segmentLength;
  }

  return null;
}

function readWebpDimensions(buffer: Buffer): ImageDimensions | null {
  const isWebp =
    buffer.length >= 30 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";

  if (!isWebp) return null;

  let offset = 12;

  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;

    if (chunkStart + chunkSize > buffer.length) return null;

    if (chunkType === "VP8X" && chunkSize >= 10) {
      return {
        width: readUInt24LE(buffer, chunkStart + 4) + 1,
        height: readUInt24LE(buffer, chunkStart + 7) + 1,
      };
    }

    if (chunkType === "VP8L" && chunkSize >= 5) {
      const b0 = buffer[chunkStart + 1];
      const b1 = buffer[chunkStart + 2];
      const b2 = buffer[chunkStart + 3];
      const b3 = buffer[chunkStart + 4];

      return {
        width: 1 + (((b1 & 0x3f) << 8) | b0),
        height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
      };
    }

    if (chunkType === "VP8 " && chunkSize >= 10) {
      const frameStart = chunkStart + 3;
      const hasStartCode =
        buffer[frameStart] === 0x9d &&
        buffer[frameStart + 1] === 0x01 &&
        buffer[frameStart + 2] === 0x2a;

      if (!hasStartCode) return null;

      return {
        width: buffer.readUInt16LE(frameStart + 3) & 0x3fff,
        height: buffer.readUInt16LE(frameStart + 5) & 0x3fff,
      };
    }

    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  return null;
}

function readImageDimensions(buffer: Buffer, type: string) {
  if (type === "image/png") return readPngDimensions(buffer);
  if (type === "image/jpeg") return readJpegDimensions(buffer);
  if (type === "image/webp") return readWebpDimensions(buffer);

  return null;
}

export function validateProductImageUpload(file: File, buffer: Buffer) {
  if (!isAllowedProductImageType(file.type)) {
    return "Неподдерживаемый формат изображения. Доступны: JPG, PNG, WEBP.";
  }

  if (file.size > PRODUCT_IMAGE_MAX_SIZE_BYTES) {
    return `Файл слишком большой. Максимальный размер: ${formatProductImageSize()}.`;
  }

  const dimensions = readImageDimensions(buffer, file.type);

  if (!dimensions) {
    return "Не удалось прочитать размеры изображения.";
  }

  if (
    dimensions.width < PRODUCT_IMAGE_MIN_WIDTH ||
    dimensions.height < PRODUCT_IMAGE_MIN_HEIGHT
  ) {
    return `Минимальный размер изображения: ${PRODUCT_IMAGE_MIN_WIDTH}x${PRODUCT_IMAGE_MIN_HEIGHT} px.`;
  }

  if (!isProductImageRatioAllowed(dimensions.width, dimensions.height)) {
    return `Изображение должно быть квадратным. Сейчас: ${dimensions.width}x${dimensions.height} px.`;
  }

  return null;
}
