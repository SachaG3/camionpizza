export type CartLine = {
  id: string;
  pizzaId: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  details: string[];
};

export function cartCount(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

export function cartTotal(lines: CartLine[]) {
  return lines.reduce(
    (total, line) => total + line.unitPrice * line.quantity,
    0,
  );
}

export function addCartLine(lines: CartLine[], incoming: CartLine) {
  const existing = lines.find((line) => line.id === incoming.id);
  if (!existing) return [...lines, incoming];

  return lines.map((line) =>
    line.id === incoming.id
      ? { ...line, quantity: line.quantity + incoming.quantity }
      : line,
  );
}

export function changeCartLineQuantity(
  lines: CartLine[],
  id: string,
  delta: number,
) {
  return lines
    .map((line) =>
      line.id === id ? { ...line, quantity: line.quantity + delta } : line,
    )
    .filter((line) => line.quantity > 0);
}

export function parseStoredCart(value: string | null): CartLine[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || !parsed.every(isCartLine)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Partial<CartLine>;

  return (
    typeof line.id === "string" &&
    typeof line.pizzaId === "string" &&
    typeof line.name === "string" &&
    typeof line.image === "string" &&
    typeof line.unitPrice === "number" &&
    Number.isFinite(line.unitPrice) &&
    typeof line.quantity === "number" &&
    Number.isInteger(line.quantity) &&
    line.quantity > 0 &&
    Array.isArray(line.details) &&
    line.details.every((detail) => typeof detail === "string")
  );
}
