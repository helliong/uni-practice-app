import assert from "node:assert/strict";
import test from "node:test";
import { createYooKassaPayment, formatYooKassaAmount } from "./yookassa";

test("YooKassa amount uses two decimal places", () => {
  assert.equal(formatYooKassaAmount(1), "1.00");
  assert.equal(formatYooKassaAmount(1_999), "1999.00");
});

test("mock payment redirects to the local result page without provider credentials", async () => {
  const previousMode = process.env.PAYMENT_MODE;
  const previousAppUrl = process.env.APP_URL;
  process.env.PAYMENT_MODE = "mock";
  process.env.APP_URL = "http://localhost:3001/";

  try {
    const payment = await createYooKassaPayment({
      amount: 1_490,
      orderId: "order/id",
      orderNumber: "CC-DEMO",
      idempotenceKey: "demo-key",
    });

    assert.match(payment.id, /^mock-/);
    assert.equal(payment.test, true);
    assert.equal(payment.amount.value, "1490.00");
    assert.equal(
      payment.confirmation?.confirmation_url,
      "http://localhost:3001/checkout/result?orderId=order%2Fid",
    );
  } finally {
    if (previousMode === undefined) delete process.env.PAYMENT_MODE;
    else process.env.PAYMENT_MODE = previousMode;
    if (previousAppUrl === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previousAppUrl;
  }
});
