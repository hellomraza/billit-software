import { Minus, Plus } from "lucide-react";
import { Button } from "../ui/button";

interface QuantityControlProps {
  quantity: number;
  onChange: (newQuantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function QuantityControl({
  quantity,
  onChange,
  min = 1,
  max,
  disabled,
}: QuantityControlProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={() => onChange(quantity - 1)}
        disabled={disabled || quantity <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-8 text-center tabular-nums font-medium">
        {quantity}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={() => onChange(quantity + 1)}
        disabled={disabled || (max !== undefined && quantity >= max)}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
