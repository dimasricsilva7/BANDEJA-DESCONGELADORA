import { db } from "@/lib/db";
import { startOfDay, endOfDay, eachDayOfInterval, format } from "date-fns";

export type DateRange = { from: Date; to: Date };

export function resolvePreset(preset: string | null, fromParam: string | null, toParam: string | null): DateRange {
  const now = new Date();
  if (preset === "custom" && fromParam && toParam) {
    return { from: startOfDay(new Date(fromParam)), to: endOfDay(new Date(toParam)) };
  }
  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case "7d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
    case "this_month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(now) };
    case "last_month": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { from, to };
    }
    case "30d":
    default: {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
  }
}

const PAID = "PAID" as const;

export async function computeDashboardStats(range: DateRange) {
  const [paidOrders, allOrdersInRange, pendingCount, expiredCount, payments] = await Promise.all([
    db.order.findMany({
      where: { status: PAID, paidAt: { gte: range.from, lte: range.to } },
      select: { id: true, totalCents: true, paidAt: true, utmSource: true, utmCampaign: true, items: { select: { name: true, totalCents: true, kind: true } } },
    }),
    db.order.count({ where: { createdAt: { gte: range.from, lte: range.to } } }),
    db.order.count({ where: { status: { in: ["PENDING", "PIX_GENERATED"] }, createdAt: { gte: range.from, lte: range.to } } }),
    db.order.count({ where: { status: "EXPIRED", createdAt: { gte: range.from, lte: range.to } } }),
    db.payment.findMany({
      where: { order: { status: PAID, paidAt: { gte: range.from, lte: range.to } } },
      select: { orderId: true, feeCents: true, netCents: true },
    }),
  ]);

  const feeByOrder = new Map(payments.map((p) => [p.orderId, p.feeCents ?? 0]));
  const grossCents = paidOrders.reduce((s, o) => s + o.totalCents, 0);
  const feeCents = paidOrders.reduce((s, o) => s + (feeByOrder.get(o.id) ?? 0), 0);
  const netCents = grossCents - feeCents;
  const ticketCents = paidOrders.length > 0 ? Math.round(grossCents / paidOrders.length) : 0;
  const conversionRate = allOrdersInRange > 0 ? paidOrders.length / allOrdersInRange : 0;

  const days = eachDayOfInterval({ start: range.from, end: range.to });
  const revenueByDay = days.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    const total = paidOrders
      .filter((o) => o.paidAt && format(o.paidAt, "yyyy-MM-dd") === key)
      .reduce((s, o) => s + o.totalCents, 0);
    return { date: key, revenue: total / 100 };
  });

  const ordersByDay = days.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    const count = paidOrders.filter((o) => o.paidAt && format(o.paidAt, "yyyy-MM-dd") === key).length;
    return { date: key, orders: count };
  });

  const bySource = new Map<string, number>();
  const byCampaign = new Map<string, number>();
  for (const o of paidOrders) {
    const source = o.utmSource ?? "direto";
    const campaign = o.utmCampaign ?? "sem campanha";
    bySource.set(source, (bySource.get(source) ?? 0) + o.totalCents);
    byCampaign.set(campaign, (byCampaign.get(campaign) ?? 0) + o.totalCents);
  }

  const byProduct = new Map<string, number>();
  for (const o of paidOrders) {
    for (const item of o.items) {
      byProduct.set(item.name, (byProduct.get(item.name) ?? 0) + 1);
    }
  }

  return {
    grossCents,
    netCents,
    feeCents,
    ticketCents,
    paidCount: paidOrders.length,
    pendingCount,
    expiredCount,
    conversionRate,
    revenueByDay,
    ordersByDay,
    salesBySource: Array.from(bySource.entries()).map(([name, cents]) => ({ name, value: cents / 100 })),
    salesByCampaign: Array.from(byCampaign.entries()).map(([name, cents]) => ({ name, value: cents / 100 })),
    productsSold: Array.from(byProduct.entries()).map(([name, qty]) => ({ name, qty })),
  };
}
