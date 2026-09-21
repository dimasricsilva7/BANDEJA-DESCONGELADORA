import crypto from "crypto";

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function sha256Digits(value: string): string {
  return crypto.createHash("sha256").update(value.replace(/\D/g, "")).digest("hex");
}
