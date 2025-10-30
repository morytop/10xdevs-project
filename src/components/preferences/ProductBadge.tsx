import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductBadgeProps {
  product: string;
  onRemove: () => void;
}

/**
 * Badge component displaying a selected product with remove button
 * Used in ProductCombobox to show selected disliked products
 */
export function ProductBadge({ product, onRemove }: ProductBadgeProps) {
  return (
    <Badge variant="secondary" className="gap-1">
      {product}
      <button type="button" onClick={onRemove} className="ml-1 hover:text-destructive" aria-label={`Usuń ${product}`}>
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}
