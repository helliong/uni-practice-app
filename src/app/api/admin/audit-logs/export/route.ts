import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  auditActionLabels,
  auditActions,
  auditSectionLabels,
  auditSections,
} from "@/lib/audit/auditLog";
import { createAuditLogWhere } from "@/lib/audit/auditLogQuery";
import { escapeCsvValue } from "@/lib/audit/auditCsv";
import { prisma } from "@/lib/database/prisma";

const csvDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["SUPERADMIN", "UNIVERSITY_ADMIN"].includes(session.user.role || "")) {
    return Response.json({ error: "Нет доступа" }, { status: 403 });
  }

  const url = new URL(request.url);
  const filters = {
    search: url.searchParams.get("search") || undefined,
    actor: url.searchParams.get("actor") || undefined,
    action: url.searchParams.get("action") || undefined,
    section: url.searchParams.get("section") || undefined,
    dateFrom: url.searchParams.get("dateFrom") || undefined,
    dateTo: url.searchParams.get("dateTo") || undefined,
  };
  const universityId = session.user.role === "UNIVERSITY_ADMIN"
    ? session.user.universityId || "__missing_university__"
    : undefined;
  const logs = await prisma.auditLog.findMany({
    where: createAuditLogWhere(filters, universityId),
    orderBy: { createdAt: "desc" },
    take: 10_000,
  });

  const rows = logs.map((log) => {
    const action = auditActions.includes(log.action as (typeof auditActions)[number])
      ? auditActionLabels[log.action as (typeof auditActions)[number]]
      : log.action;
    const section = auditSections.includes(log.section as (typeof auditSections)[number])
      ? auditSectionLabels[log.section as (typeof auditSections)[number]]
      : log.section;

    return [
      csvDateFormatter.format(log.createdAt),
      log.actorName,
      log.actorEmail,
      action,
      section,
      log.entityLabel,
      log.entityId,
      log.details,
      log.ipAddress,
    ].map(escapeCsvValue).join(";");
  });
  const header = [
    "Дата и время",
    "Пользователь",
    "Email",
    "Действие",
    "Раздел",
    "Объект",
    "ID объекта",
    "Детали",
    "IP-адрес",
  ].map(escapeCsvValue).join(";");
  const csv = `\uFEFF${[header, ...rows].join("\r\n")}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
