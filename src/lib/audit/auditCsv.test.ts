import assert from "node:assert/strict";
import test from "node:test";
import { escapeCsvValue } from "./auditCsv";

test("CSV values escape quotes, separators and empty values", () => {
  assert.equal(escapeCsvValue('Товар "Code"; чёрный'), '"Товар ""Code""; чёрный"');
  assert.equal(escapeCsvValue(null), '""');
});

test("CSV values neutralize spreadsheet formulas", () => {
  assert.equal(escapeCsvValue("=1+1"), '"\'=1+1"');
  assert.equal(escapeCsvValue("+SUM(A1:A2)"), '"\'+SUM(A1:A2)"');
  assert.equal(escapeCsvValue("-10"), '"\'-10"');
  assert.equal(escapeCsvValue("@command"), '"\'@command"');
});
