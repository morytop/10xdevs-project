import { useState } from "react";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";
import { useProducts } from "@/hooks/useProducts";
import { ProductBadge } from "./ProductBadge";

interface ProductComboboxProps {
  value: string[];
  onChange: (value: string[]) => void;
}

/**
 * Combobox with autocomplete for selecting disliked products
 * Uses fuzzy search (Fuse.js) and supports max 20 selections
 * Selected products are displayed as removable badges
 */
export function ProductCombobox({ value, onChange }: ProductComboboxProps) {
  const [inputValue, setInputValue] = useState("");
  const { filterProducts } = useProducts();

  const filteredProducts = inputValue.length >= 2 ? filterProducts(inputValue) : [];

  const handleAddProduct = (productName: string) => {
    if (!value.includes(productName) && value.length < 20) {
      onChange([...value, productName]);
      setInputValue("");
    }
  };

  const handleRemoveProduct = (productName: string) => {
    onChange(value.filter((p) => p !== productName));
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">{value.length}/20 produktów</div>

      <Command className="border rounded-md">
        <CommandInput
          placeholder="Wyszukaj produkt..."
          value={inputValue}
          onValueChange={setInputValue}
          disabled={value.length >= 20}
        />
        <CommandList>
          {inputValue.length >= 2 && filteredProducts.length === 0 && (
            <CommandEmpty>Nie znaleziono produktów.</CommandEmpty>
          )}
          {filteredProducts.map((product) => (
            <CommandItem
              key={product.name}
              onSelect={() => handleAddProduct(product.name)}
              disabled={value.includes(product.name)}
            >
              {product.name}
            </CommandItem>
          ))}
        </CommandList>
      </Command>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((product) => (
            <ProductBadge key={product} product={product} onRemove={() => handleRemoveProduct(product)} />
          ))}
        </div>
      )}

      {value.length >= 20 && (
        <p className="text-sm text-amber-600">Osiągnięto limit 20 produktów. Aby dodać nowy, usuń istniejący.</p>
      )}
    </div>
  );
}
