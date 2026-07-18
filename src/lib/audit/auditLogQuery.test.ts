import assert from "node:assert/strict";
import test from "node:test";
import { createAuditLogData } from "./auditLog";
import { createAuditLogWhere } from "./auditLogQuery";

test("audit log query combines scope and supported filters", () => {
  const where = createAuditLogWhere({
    actor: "admin@example.com",
    action: "UPDATE",
    section: "PRODUCTS",
    search: "худи",
    dateFrom: "2026-07-01",
    dateTo: "2026-07-18",
  }, "university-1");

  assert.equal(where.universityId, "university-1");
  assert.equal(where.actorEmail, "admin@example.com");
  assert.equal(where.action, "UPDATE");
  assert.equal(where.section, "PRODUCTS");
  assert.ok(Array.isArray(where.OR));
  assert.ok(
    where.createdAt
      && typeof where.createdAt === "object"
      && !(where.createdAt instanceof Date)
      && "gte" in where.createdAt
      && "lt" in where.createdAt,
  );
});

test("audit log query ignores unsupported filter values", () => {
  const where = createAuditLogWhere({
    action: "UNKNOWN",
    section: "UNKNOWN",
    dateFrom: "invalid",
  });

  assert.equal(where.action, undefined);
  assert.equal(where.section, undefined);
  assert.equal(where.createdAt, undefined);
});

test("audit log query supports independent date boundaries and object search", () => {
  const fromWhere = createAuditLogWhere({ dateFrom: "2026-07-18", search: "product-1" });
  const toWhere = createAuditLogWhere({ dateTo: "2026-07-18" });

  assert.ok(Array.isArray(fromWhere.OR));
  assert.equal(fromWhere.OR?.length, 5);
  assert.ok(fromWhere.createdAt && typeof fromWhere.createdAt === "object" && "gte" in fromWhere.createdAt);
  assert.ok(toWhere.createdAt && typeof toWhere.createdAt === "object" && "lt" in toWhere.createdAt);
});

test("audit log data stores actor snapshot and forwarded IP address", () => {
  const data = createAuditLogData({
    request: new Request("http://localhost", {
      headers: { "x-forwarded-for": "192.168.1.10, 10.0.0.1" },
    }),
    actor: { id: "user-1", name: "Администратор", email: "admin@example.com" },
    action: "CREATE",
    section: "PRODUCTS",
    entityType: "PRODUCT",
    entityId: "product-1",
    entityLabel: "Худи",
  });

  assert.equal(data.actorEmail, "admin@example.com");
  assert.equal(data.ipAddress, "192.168.1.10");
  assert.equal(data.entityLabel, "Худи");
});

test("audit log data falls back to real IP and nullable actor fields", () => {
  const data = createAuditLogData({
    request: new Request("http://localhost", {
      headers: { "x-real-ip": "127.0.0.1" },
    }),
    actor: { id: "user-2" },
    action: "DELETE",
    section: "PRODUCTS",
    entityType: "PRODUCT",
    entityLabel: "Удалённый товар",
  });

  assert.equal(data.actorName, null);
  assert.equal(data.actorEmail, "Не указан");
  assert.equal(data.ipAddress, "127.0.0.1");
  assert.equal(data.entityId, null);
});
