"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPublicProducts } from "@/actions/products";
import { getProductSearchScore } from "@/lib/products/productSearch";
import { generateSlug } from "@/lib/shared/utils";
import type { Product } from "@/types";

const MIN_SUGGESTION_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 5;

export default function ProductSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[] | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadFailed, setHasLoadFailed] = useState(false);
  const canLoadSuggestions = query.trim().length >= MIN_SUGGESTION_QUERY_LENGTH;

  useEffect(() => {
    if (pathname !== "/catalog") return;
    setQuery(new URLSearchParams(window.location.search).get("q") ?? "");
  }, [pathname]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!formRef.current?.contains(event.target as Node)) setIsFocused(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!canLoadSuggestions || products || hasLoadFailed) return;

    let isCancelled = false;
    setIsLoading(true);
    getPublicProducts()
      .then((data) => {
        if (!isCancelled) setProducts(data);
      })
      .catch(() => {
        if (!isCancelled) setHasLoadFailed(true);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [canLoadSuggestions, hasLoadFailed, products]);

  const normalizedQuery = query.trim();
  const suggestions = useMemo(() => products
    ?.map((product) => ({
      product,
      score: getProductSearchScore(product, normalizedQuery),
    }))
    .filter((result): result is { product: Product; score: number } => result.score !== null)
    .sort((first, second) => first.score - second.score)
    .slice(0, MAX_SUGGESTIONS)
    .map(({ product }) => product) ?? [], [normalizedQuery, products]);
  const shouldShowSuggestions = isFocused && normalizedQuery.length >= MIN_SUGGESTION_QUERY_LENGTH;

  const openCatalogSearch = () => {
    if (!normalizedQuery) return;
    setIsFocused(false);
    inputRef.current?.blur();
    router.push(`/catalog?q=${encodeURIComponent(normalizedQuery)}`);
  };

  return (
    <form
      ref={formRef}
      className="search-form"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        openCatalogSearch();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setIsFocused(false);
          inputRef.current?.blur();
        }
      }}
    >
      <input
        ref={inputRef}
        type="search"
        placeholder="Поиск по товарам"
        aria-label="Поиск по товарам"
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsFocused(true)}
      />
      <button type="submit" className="search-submit" aria-label="Найти">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10.5 4a6.5 6.5 0 0 1 5.18 10.43l3.45 3.44a1 1 0 0 1-1.42 1.42l-3.44-3.45A6.5 6.5 0 1 1 10.5 4Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
        </svg>
      </button>

      {shouldShowSuggestions && (
        <div className="search-suggestions">
          {isLoading ? (
            <p className="search-status">Ищем товары...</p>
          ) : hasLoadFailed ? (
            <p className="search-status">Не удалось загрузить подсказки</p>
          ) : suggestions.length > 0 ? (
            <>
              <ul>
                {suggestions.map((product) => {
                  const identifier = product.sku || product.id;
                  const productUrl = `/product/${identifier}-${generateSlug(product.name)}`;

                  return (
                    <li key={product.id}>
                      <Link href={productUrl} onClick={() => setIsFocused(false)}>
                        <Image
                          src={product.imageUrl}
                          alt=""
                          width={52}
                          height={52}
                          unoptimized
                        />
                        <span>
                          <strong>{product.name}</strong>
                          <small>{product.price.toLocaleString("ru-RU")} ₽</small>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <button type="button" className="search-all-results" onClick={openCatalogSearch}>
                Показать все результаты
                <span aria-hidden="true">→</span>
              </button>
            </>
          ) : (
            <p className="search-status">Товары не найдены</p>
          )}
        </div>
      )}
    </form>
  );
}
