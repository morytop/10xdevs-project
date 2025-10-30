import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import type { Product } from "@/lib/viewmodels/preferences.viewmodel";
import productsData from "@/data/products.json";

/**
 * Custom hook for product search with fuzzy matching
 * Uses Fuse.js for intelligent search with typo tolerance
 *
 * @returns Object with products list and filter function
 */
export function useProducts() {
  const [products] = useState<Product[]>(productsData.products);

  const fuse = useMemo(() => {
    return new Fuse(products, {
      keys: ["name"],
      threshold: 0.3,
      minMatchCharLength: 2,
    });
  }, [products]);

  /**
   * Filter products by search query
   * @param query - Search query string
   * @returns Array of matching products (max 10 results)
   */
  const filterProducts = (query: string): Product[] => {
    if (!query || query.length < 2) {
      return [];
    }

    const results = fuse.search(query);
    return results.map((result) => result.item).slice(0, 10); // max 10 wyników
  };

  return { products, filterProducts };
}
