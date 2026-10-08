/**
 * Unit Conversion Utilities for Inventory & Recipe Stock Management
 * Supports: Adet, Gram (g), Kilogram (kg), Mililitre (ml), Litre (L)
 */

export type StockUnit = 'adet' | 'g' | 'kg' | 'ml' | 'L';

export const STOCK_UNITS: { id: StockUnit; label: string; type: 'count' | 'mass' | 'volume' }[] = [
  { id: 'adet', label: 'Adet', type: 'count' },
  { id: 'g', label: 'Gram (g)', type: 'mass' },
  { id: 'kg', label: 'Kilogram (kg)', type: 'mass' },
  { id: 'ml', label: 'Mililitre (ml)', type: 'volume' },
  { id: 'L', label: 'Litre (L)', type: 'volume' },
];

/**
 * Converts quantity from one unit to another
 * Example: convertUnitQuantity(200, 'ml', 'L') => 0.2
 * Example: convertUnitQuantity(150, 'g', 'kg') => 0.15
 */
export function convertUnitQuantity(amount: number, fromUnit?: string, toUnit?: string): number {
  if (typeof amount !== 'number' || isNaN(amount)) return 0;
  if (!fromUnit || !toUnit) return amount;

  const f = fromUnit.toLowerCase().trim();
  const t = toUnit.toLowerCase().trim();

  if (f === t) return amount;

  // Mass: Gram <-> Kilogram (1 kg = 1000 g)
  if ((f === 'g' || f === 'gram') && (t === 'kg' || t === 'kilogram')) {
    return amount / 1000;
  }
  if ((f === 'kg' || f === 'kilogram') && (t === 'g' || t === 'gram')) {
    return amount * 1000;
  }

  // Volume: Mililitre <-> Litre (1 L = 1000 ml)
  if ((f === 'ml' || f === 'mililitre') && (t === 'l' || t === 'litre')) {
    return amount / 1000;
  }
  if ((f === 'l' || f === 'litre') && (t === 'ml' || t === 'mililitre')) {
    return amount * 1000;
  }

  return amount;
}

/**
 * Format quantity with its unit cleanly
 * Example: 14.85 kg => "14.85 kg"
 */
export function formatStockWithUnit(quantity: number, unit?: string): string {
  const rounded = Math.round(quantity * 1000) / 1000;
  return `${rounded.toLocaleString('tr-TR')} ${unit || 'adet'}`;
}
