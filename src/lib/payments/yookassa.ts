import { randomUUID } from "node:crypto";
import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";

const DEFAULT_API_URL = "https://api.yookassa.ru/v3";

function isMockPaymentMode() {
  return process.env.PAYMENT_MODE === "mock";
}

function getAppUrl() {
  const appUrl = process.env.APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim();
  if (!appUrl) throw new Error("APP_URL is required");
  return appUrl.replace(/\/$/, "");
}

type YooKassaAmount = {
  value: string;
  currency: string;
};

export type YooKassaPayment = {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  paid: boolean;
  test: boolean;
  amount: YooKassaAmount;
  confirmation?: { type: string; confirmation_url?: string };
  metadata?: Record<string, string>;
  cancellation_details?: { party?: string; reason?: string };
};

export type YooKassaRefund = {
  id: string;
  status: "pending" | "succeeded" | "canceled";
  amount: YooKassaAmount;
  payment_id: string;
  cancellation_details?: { party?: string; reason?: string };
};

function getConfig() {
  const shopId = process.env.YOOKASSA_SHOP_ID?.trim();
  const secretKey = process.env.YOOKASSA_SECRET_KEY?.trim();
  const appUrl = process.env.APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim();

  if (!shopId || !secretKey || !appUrl) {
    throw new Error("YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY and APP_URL are required");
  }

  return {
    apiUrl: (process.env.YOOKASSA_API_URL?.trim() || DEFAULT_API_URL).replace(/\/$/, ""),
    appUrl: appUrl.replace(/\/$/, ""),
    authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`,
  };
}

async function getMockPayment(paymentId: string): Promise<YooKassaPayment> {
  const payment = await prisma.payment.findUnique({
    where: { providerPaymentId: paymentId },
    include: { order: { select: { number: true } } },
  });
  if (!payment) throw new Error("Mock payment not found");

  const status = payment.status === PaymentStatus.CANCELED ? "canceled" : "succeeded";
  return {
    id: paymentId,
    status,
    paid: status === "succeeded",
    test: true,
    amount: { value: formatYooKassaAmount(payment.amount), currency: payment.currency },
    metadata: { order_id: payment.orderId, order_number: payment.order.number },
    ...(status === "canceled"
      ? { cancellation_details: { party: "merchant", reason: "canceled" } }
      : {}),
  };
}

async function requestYooKassa<T>(path: string, init: RequestInit) {
  const config = getConfig();
  const response = await fetch(`${config.apiUrl}${path}`, {
    ...init,
    headers: {
      Authorization: config.authorization,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`YooKassa request failed (${response.status}): ${details.slice(0, 500)}`);
  }

  return response.json() as Promise<T>;
}

export function formatYooKassaAmount(amount: number) {
  return amount.toFixed(2);
}

export async function createYooKassaPayment({
  amount,
  orderId,
  orderNumber,
  idempotenceKey,
}: {
  amount: number;
  orderId: string;
  orderNumber: string;
  idempotenceKey: string;
}) {
  if (isMockPaymentMode()) {
    return {
      id: `mock-${randomUUID()}`,
      status: "pending",
      paid: false,
      test: true,
      amount: { value: formatYooKassaAmount(amount), currency: "RUB" },
      confirmation: {
        type: "redirect",
        confirmation_url: `${getAppUrl()}/checkout/result?orderId=${encodeURIComponent(orderId)}`,
      },
      metadata: { order_id: orderId, order_number: orderNumber },
    } satisfies YooKassaPayment;
  }

  const config = getConfig();

  return requestYooKassa<YooKassaPayment>("/payments", {
    method: "POST",
    headers: { "Idempotence-Key": idempotenceKey },
    body: JSON.stringify({
      amount: { value: formatYooKassaAmount(amount), currency: "RUB" },
      capture: true,
      payment_method_data: { type: "bank_card" },
      confirmation: {
        type: "redirect",
        return_url: `${config.appUrl}/checkout/result?orderId=${encodeURIComponent(orderId)}`,
      },
      description: `Заказ №${orderNumber}`,
      metadata: { order_id: orderId, order_number: orderNumber },
    }),
  });
}

export function getYooKassaPayment(paymentId: string) {
  if (isMockPaymentMode()) return getMockPayment(paymentId);

  return requestYooKassa<YooKassaPayment>(`/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
  });
}

export function createYooKassaRefund({
  paymentId,
  amount,
  orderNumber,
  idempotenceKey,
}: {
  paymentId: string;
  amount: number;
  orderNumber: string;
  idempotenceKey: string;
}) {
  if (isMockPaymentMode()) {
    return Promise.resolve({
      id: `mock-refund-${randomUUID()}`,
      status: "succeeded",
      amount: { value: formatYooKassaAmount(amount), currency: "RUB" },
      payment_id: paymentId,
    } satisfies YooKassaRefund);
  }

  return requestYooKassa<YooKassaRefund>("/refunds", {
    method: "POST",
    headers: { "Idempotence-Key": idempotenceKey },
    body: JSON.stringify({
      payment_id: paymentId,
      amount: { value: formatYooKassaAmount(amount), currency: "RUB" },
      description: `Возврат заказа №${orderNumber}`,
    }),
  });
}
