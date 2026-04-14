import React from "react";
import { Button } from "../ui/button";
import { Minus, Plus } from "lucide-react";

interface QuantityControlProps {
  quantity: number;
  onChange: (newQuantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function QuantityControl({ quantity, onChange, min = 1, max, disabled }: QuantityControlProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={() => onChange(quantity - 1)}
        disabled={disabled || quantity <= min}
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
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
