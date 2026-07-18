import assert from "node:assert/strict";
import test from "node:test";
import type { Product } from "@/types";
import { getProductSearchScore, matchesProductSearch, normalizeSearchText } from "./productSearch";

const product: Product = {
  id: "product-1",
  name: "Худи React.dev",
  description: "Тёплая университетская толстовка",
  price: 3000,
  imageUrl: "/hoodie.webp",
  category: "hoodie",
  materials: ["Хлопок", "Футер"],
  tags: ["react", "мерч"],
  university: { name: "Омский государственный университет", shortName: "ОмГУ" },
};

test("normalizeSearchText ignores case, punctuation and ё", () => {
  assert.equal(normalizeSearchText("  ТЁПЛАЯ, худи!  "), "теплая худи");
});

test("product search matches all query words across product fields", () => {
  assert.equal(matchesProductSearch(product, "react хлопок"), true);
  assert.equal(matchesProductSearch(product, "омгу худи"), true);
  assert.equal(matchesProductSearch(product, "футболка react"), false);
});

test("product search tolerates missing letters and Russian word endings", () => {
  const tshirt: Product = {
    ...product,
    id: "product-2",
    name: "Футболка Code",
    category: "tshirt",
  };

  assert.equal(matchesProductSearch(tshirt, "фболка"), true);
  assert.equal(matchesProductSearch(tshirt, "футболки"), true);
  assert.equal(matchesProductSearch(tshirt, "кружка"), false);
});

test("exact matches rank higher than fuzzy matches", () => {
  const exactScore = getProductSearchScore(product, "худи");
  const fuzzyScore = getProductSearchScore(product, "худии");

  assert.equal(exactScore, 0);
  assert.ok(fuzzyScore !== null && exactScore < fuzzyScore);
});
