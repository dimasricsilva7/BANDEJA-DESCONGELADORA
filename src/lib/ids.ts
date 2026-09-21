import crypto from "crypto";

export function generateDisplayId(): string {
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `order_${suffix}`;
}

export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

export function generateEventId(prefix = "evt"): string {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}
