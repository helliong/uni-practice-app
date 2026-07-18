import assert from "node:assert/strict";
import test from "node:test";
import { PRODUCT_IMAGE_MAX_SIZE_BYTES } from "./imageUploadRules";
import { validateProductImageUpload } from "./serverImageValidation";

function createPngHeader(width: number, height: number) {
  const buffer = Buffer.alloc(24);
  buffer.set([0x89, 0x50, 0x4e, 0x47], 0);
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

test("server image validation accepts a valid square PNG", () => {
  const buffer = createPngHeader(1200, 1200);
  const file = new File([buffer], "product.png", { type: "image/png" });
  assert.equal(validateProductImageUpload(file, buffer), null);
});

test("server image validation rejects format, size and unreadable content", () => {
  const png = createPngHeader(1200, 1200);
  assert.match(
    validateProductImageUpload(new File([png], "product.svg", { type: "image/svg+xml" }), png) || "",
    /Неподдерживаемый формат/,
  );

  const oversized = Buffer.alloc(PRODUCT_IMAGE_MAX_SIZE_BYTES + 1);
  assert.match(
    validateProductImageUpload(new File([oversized], "large.png", { type: "image/png" }), oversized) || "",
    /слишком большой/,
  );

  const unreadable = Buffer.from("not an image");
  assert.match(
    validateProductImageUpload(new File([unreadable], "broken.png", { type: "image/png" }), unreadable) || "",
    /Не удалось прочитать/,
  );
});

test("server image validation rejects small and non-square images", () => {
  const small = createPngHeader(800, 800);
  assert.match(
    validateProductImageUpload(new File([small], "small.png", { type: "image/png" }), small) || "",
    /Минимальный размер/,
  );

  const wide = createPngHeader(1400, 1000);
  assert.match(
    validateProductImageUpload(new File([wide], "wide.png", { type: "image/png" }), wide) || "",
    /должно быть квадратным/,
  );
});
