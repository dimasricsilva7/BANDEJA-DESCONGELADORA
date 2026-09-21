import crypto from "crypto";

const BASE_URL = process.env.BRAVOPAY_BASE_URL ?? "https://bravopay.club/api/v1";

function apiKey(): string {
  const key = process.env.BRAVOPAY_API_KEY;
  if (!key) throw new Error("BRAVOPAY_API_KEY não configurada");
  return key;
}

export type BravopayUtm = {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  content?: string | null;
  term?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  ttclid?: string | null;
};

export type CreateTransactionInput = {
  amountCents: number;
  idempotencyKey: string;
  externalReference: string;
  description: string;
  productId: string;
  customer: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
  };
  metadata?: Record<string, string>;
  utm?: BravopayUtm;
  expiresInSeconds?: number;
};

export type BravopayTransaction = {
  id: string;
  status: "PENDING" | "PAID" | "EXPIRED" | "REFUNDED" | "CHARGEBACK" | "FAILED";
  method: string;
  amount_cents: number;
  fee_cents?: number;
  net_cents?: number;
  currency: string;
  created_at: string;
  external_reference?: string;
  pix?: {
    copy_paste: string;
    expires_at: string;
  };
};

class BravopayError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey()}`);
  headers.set("Content-Type", "application/json");
  if (init.idempotencyKey) headers.set("Idempotency-Key", init.idempotencyKey);

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers, cache: "no-store" });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = json?.error?.message ?? `BravoPay request failed (${res.status})`;
    throw new BravopayError(message, res.status, json?.error?.code);
  }
  return json as T;
}

export async function createPixTransaction(
  input: CreateTransactionInput
): Promise<BravopayTransaction> {
  const body = {
    amount_cents: input.amountCents,
    method: "pix",
    product_id: input.productId,
    description: input.description.slice(0, 300),
    external_reference: input.externalReference.slice(0, 120),
    expires_in: input.expiresInSeconds ?? 3600,
    customer: {
      name: input.customer.name,
      email: input.customer.email,
      cpf: input.customer.cpf.replace(/\D/g, ""),
      phone: input.customer.phone.replace(/\D/g, ""),
    },
    metadata: input.metadata ?? {},
    utm: {
      source: input.utm?.source ?? undefined,
      medium: input.utm?.medium ?? undefined,
      campaign: input.utm?.campaign ?? undefined,
      content: input.utm?.content ?? undefined,
      term: input.utm?.term ?? undefined,
      fbclid: input.utm?.fbclid ?? undefined,
      gclid: input.utm?.gclid ?? undefined,
      ttclid: input.utm?.ttclid ?? undefined,
    },
  };

  return request<BravopayTransaction>("/transactions", {
    method: "POST",
    body: JSON.stringify(body),
    idempotencyKey: input.idempotencyKey,
  });
}

export async function findTransactionByExternalReference(
  externalReference: string
): Promise<BravopayTransaction | null> {
  const qs = new URLSearchParams({ external_reference: externalReference, limit: "1" });
  const result = await request<{ data: BravopayTransaction[] }>(`/transactions?${qs.toString()}`, {
    method: "GET",
  });
  return result.data?.[0] ?? null;
}

/**
 * Verifies BravoPay webhook signatures.
 * Header format: `t=<unix_timestamp>,v1=<hmac_sha256>`; signed content is `${t}.${rawBody}`.
 * `toleranceSeconds` guards against replay of old, previously-valid signatures.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  toleranceSeconds = 300
): boolean {
  if (!signatureHeader || !secret) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim(), v?.trim()];
    })
  );
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSeconds) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const signatureBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== signatureBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

export { BravopayError };
