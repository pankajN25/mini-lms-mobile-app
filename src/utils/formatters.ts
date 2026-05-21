export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export function formatDiscountedPrice(price: number, discountPct: number): number {
  return price * (1 - discountPct / 100);
}

export function capitalizeCategory(category: string): string {
  return category
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
