import type { Product } from "@/types";

const categoryLabels: Record<Product["category"], string> = {
  hoodie: "худи толстовка",
  tshirt: "футболка футболки",
  mug: "кружка кружки",
  sticker: "стикер стикеры",
  accessories: "аксессуары",
  bags: "сумка сумки",
  notebooks: "блокнот блокноты",
  gadgets: "гаджет гаджеты",
  other: "разное",
};

export function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .trim();
}

function damerauLevenshtein(firstValue: string, secondValue: string) {
  const first = Array.from(firstValue);
  const second = Array.from(secondValue);
  const distances = Array.from(
    { length: first.length + 1 },
    () => Array<number>(second.length + 1).fill(0),
  );

  for (let firstIndex = 0; firstIndex <= first.length; firstIndex += 1) {
    distances[firstIndex][0] = firstIndex;
  }
  for (let secondIndex = 0; secondIndex <= second.length; secondIndex += 1) {
    distances[0][secondIndex] = secondIndex;
  }

  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
      const substitutionCost = first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1;
      distances[firstIndex][secondIndex] = Math.min(
        distances[firstIndex - 1][secondIndex] + 1,
        distances[firstIndex][secondIndex - 1] + 1,
        distances[firstIndex - 1][secondIndex - 1] + substitutionCost,
      );

      if (
        firstIndex > 1
        && secondIndex > 1
        && first[firstIndex - 1] === second[secondIndex - 2]
        && first[firstIndex - 2] === second[secondIndex - 1]
      ) {
        distances[firstIndex][secondIndex] = Math.min(
          distances[firstIndex][secondIndex],
          distances[firstIndex - 2][secondIndex - 2] + substitutionCost,
        );
      }
    }
  }

  return distances[first.length][second.length];
}

function getAllowedDistance(termLength: number) {
  if (termLength < 4) return 0;
  if (termLength <= 5) return 1;
  if (termLength <= 8) return 2;
  return 3;
}

function getTermScore(term: string, searchableTokens: string[]) {
  let bestScore = Number.POSITIVE_INFINITY;
  const allowedDistance = getAllowedDistance(term.length);

  for (const token of searchableTokens) {
    if (token === term) return 0;

    if (token.startsWith(term)) {
      bestScore = Math.min(bestScore, 0.1);
      continue;
    }

    if (token.includes(term)) {
      bestScore = Math.min(bestScore, 0.25);
      continue;
    }

    if (allowedDistance === 0 || Math.abs(token.length - term.length) > allowedDistance) {
      continue;
    }

    const distance = damerauLevenshtein(term, token);
    if (distance <= allowedDistance) {
      bestScore = Math.min(bestScore, 1 + distance / Math.max(term.length, token.length));
    }
  }

  return bestScore;
}

export function getProductSearchScore(product: Product, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;

  const searchableTokens = normalizeSearchText([
    product.name,
    product.description,
    categoryLabels[product.category],
    product.materials?.join(" "),
    product.tags?.join(" "),
    product.university?.name,
    product.university?.shortName,
    product.sku,
  ].filter(Boolean).join(" ")).split(" ");

  let totalScore = 0;
  for (const term of normalizedQuery.split(" ")) {
    const termScore = getTermScore(term, searchableTokens);
    if (!Number.isFinite(termScore)) return null;
    totalScore += termScore;
  }

  return totalScore;
}

export function matchesProductSearch(product: Product, query: string) {
  return getProductSearchScore(product, query) !== null;
}
