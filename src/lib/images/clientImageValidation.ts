"use client";

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

function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Не удалось прочитать изображение ${file.name}.`));
    };

    image.src = url;
  });
}

export async function validateProductImageFile(file: File) {
  if (!isAllowedProductImageType(file.type)) {
    return `Файл ${file.name} имеет неподдерживаемый формат. Доступны: JPG, PNG, WEBP.`;
  }

  if (file.size > PRODUCT_IMAGE_MAX_SIZE_BYTES) {
    return `Файл ${file.name} слишком большой. Максимальный размер: ${formatProductImageSize()}.`;
  }

  try {
    const dimensions = await getImageDimensions(file);

    if (
      dimensions.width < PRODUCT_IMAGE_MIN_WIDTH ||
      dimensions.height < PRODUCT_IMAGE_MIN_HEIGHT
    ) {
      return `Файл ${file.name} слишком маленький. Минимальный размер: ${PRODUCT_IMAGE_MIN_WIDTH}x${PRODUCT_IMAGE_MIN_HEIGHT} px.`;
    }

    if (!isProductImageRatioAllowed(dimensions.width, dimensions.height)) {
      return `Файл ${file.name} должен быть квадратным. Сейчас: ${dimensions.width}x${dimensions.height} px.`;
    }
  } catch (error) {
    return error instanceof Error
      ? error.message
      : `Не удалось проверить изображение ${file.name}.`;
  }

  return null;
}

export async function getProductImageValidationResult(files: File[]) {
  const validFiles: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const error = await validateProductImageFile(file);

    if (error) {
      errors.push(error);
    } else {
      validFiles.push(file);
    }
  }

  return { validFiles, errors };
}
