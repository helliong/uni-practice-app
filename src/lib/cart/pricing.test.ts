import assert from "node:assert/strict";
import test from "node:test";
import { getStudentDiscountAmount } from "./pricing";

test("student discount is ten percent rounded down", () => {
  assert.equal(getStudentDiscountAmount(5000), 500);
  assert.equal(getStudentDiscountAmount(999), 99);
});

test("student discount handles zero and negative totals safely", () => {
  assert.equal(getStudentDiscountAmount(0), 0);
  assert.equal(getStudentDiscountAmount(-1000), 0);
});
