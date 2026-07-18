import assert from "node:assert/strict";
import test from "node:test";
import {
  getChangedProductFields,
  getProductTotalStock,
  normalizeProductSku,
  normalizeProductVariants,
} from "./productAdmin";

test("admin product variants normalize stock and omit empty rows", () => {
  assert.deepEqual(normalizeProductVariants([
    { color: "black", size: "M", stock: "3", sku: "BLACK-M" },
    { color: "white", stock: -4 },
    { stock: 10 },
  ]), [
    { color: "black", size: "M", stock: 3, sku: "BLACK-M" },
    { color: "white", size: undefined, stock: 0, sku: undefined },
  ]);
});

test("admin product stock sums variants and normalizes fallback", () => {
  const variants = normalizeProductVariants([
    { color: "black", size: "S", stock: 2 },
    { color: "black", size: "M", stock: "4" },
  ]);
  assert.equal(getProductTotalStock(variants, 99), 6);
  assert.equal(getProductTotalStock([], "7"), 7);
  assert.equal(getProductTotalStock([], -5), 0);
});

test("admin product SKU trims spaces and changed fields are detected", () => {
  assert.equal(normalizeProductSku("  CODE  BLACK M "), "CODE-BLACK-M");

  const previous = {
    name: "Худи",
    price: 3000,
    stockCount: 5,
    category: "hoodie",
    isPublished: true,
    universityId: null,
  };
  assert.deepEqual(getChangedProductFields(previous, {
    ...previous,
    price: 3200,
    stockCount: 2,
    universityId: "mgu",
  }), ["цена", "остаток", "университет"]);
  assert.deepEqual(getChangedProductFields(previous, previous), []);
});
