import type { Prisma } from "@prisma/client";
import { auditActions, auditSections } from "@/lib/audit/auditLog";

export type AuditLogFilters = {
  search?: string;
  actor?: string;
  action?: string;
  section?: string;
  dateFrom?: string;
  dateTo?: string;
};

function isDateValue(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function createAuditLogWhere(
  filters: AuditLogFilters,
  universityId?: string,
): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};
  const search = filters.search?.trim();

  if (universityId) where.universityId = universityId;
  if (filters.actor) where.actorEmail = filters.actor;
  if (auditActions.includes(filters.action as (typeof auditActions)[number])) {
    where.action = filters.action;
  }
  if (auditSections.includes(filters.section as (typeof auditSections)[number])) {
    where.section = filters.section;
  }
  if (search) {
    where.OR = [
      { actorName: { contains: search, mode: "insensitive" } },
      { actorEmail: { contains: search, mode: "insensitive" } },
      { entityLabel: { contains: search, mode: "insensitive" } },
      { details: { contains: search, mode: "insensitive" } },
      { entityId: { contains: search, mode: "insensitive" } },
    ];
  }

  const createdAt: Prisma.DateTimeFilter = {};
  if (isDateValue(filters.dateFrom)) {
    createdAt.gte = new Date(`${filters.dateFrom}T00:00:00`);
  }
  if (isDateValue(filters.dateTo)) {
    const exclusiveEnd = new Date(`${filters.dateTo}T00:00:00`);
    exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
    createdAt.lt = exclusiveEnd;
  }
  if (createdAt.gte || createdAt.lt) where.createdAt = createdAt;

  return where;
}
