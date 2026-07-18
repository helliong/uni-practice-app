import type { Prisma } from "@prisma/client";

export const auditActions = ["CREATE", "UPDATE", "DELETE", "APPROVE", "REJECT"] as const;
export const auditSections = ["PRODUCTS", "VERIFICATIONS"] as const;

export const auditActionLabels: Record<AuditAction, string> = {
  CREATE: "Создание",
  UPDATE: "Редактирование",
  DELETE: "Удаление",
  APPROVE: "Одобрение",
  REJECT: "Отклонение",
};

export const auditSectionLabels: Record<AuditSection, string> = {
  PRODUCTS: "Товары",
  VERIFICATIONS: "Заявки на статус",
};

export type AuditAction = (typeof auditActions)[number];
export type AuditSection = (typeof auditSections)[number];

type AuditActor = {
  id: string;
  name?: string | null;
  email?: string | null;
};

type AuditLogInput = {
  request: Request;
  actor: AuditActor;
  action: AuditAction;
  section: AuditSection;
  entityType: string;
  entityId?: string | null;
  entityLabel: string;
  details?: string | null;
  changes?: Prisma.InputJsonValue;
  universityId?: string | null;
};

function getRequestIpAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") || null;
}

export function createAuditLogData({
  request,
  actor,
  action,
  section,
  entityType,
  entityId,
  entityLabel,
  details,
  changes,
  universityId,
}: AuditLogInput): Prisma.AuditLogUncheckedCreateInput {
  return {
    actorId: actor.id,
    actorName: actor.name || null,
    actorEmail: actor.email || "Не указан",
    action,
    section,
    entityType,
    entityId: entityId || null,
    entityLabel,
    details: details || null,
    changes,
    ipAddress: getRequestIpAddress(request),
    universityId: universityId || null,
  };
}
