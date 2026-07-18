import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import {
  FiCheck,
  FiDownload,
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  auditActionLabels,
  auditActions,
  auditSectionLabels,
  auditSections,
  type AuditAction,
  type AuditSection,
} from "@/lib/audit/auditLog";
import { createAuditLogWhere, type AuditLogFilters } from "@/lib/audit/auditLogQuery";
import { prisma } from "@/lib/database/prisma";
import "./page.scss";

const PAGE_SIZE = 10;
const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

type ActivityPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParam(
  params: Record<string, string | string[] | undefined>,
  name: string,
) {
  const value = params[name];
  return Array.isArray(value) ? value[0] : value;
}

function getInitials(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getActionIcon(action: string) {
  if (action === "CREATE") return FiPlus;
  if (action === "UPDATE") return FiEdit2;
  if (action === "DELETE") return FiTrash2;
  if (action === "APPROVE") return FiCheck;
  return FiX;
}

function getPageHref(filters: AuditLogFilters, page: number) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/admin/activity${query ? `?${query}` : ""}`;
}

export default async function AdminActivityPage({ searchParams }: ActivityPageProps) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  const filters: AuditLogFilters = {
    search: getSearchParam(params, "search"),
    actor: getSearchParam(params, "actor"),
    action: getSearchParam(params, "action"),
    section: getSearchParam(params, "section"),
    dateFrom: getSearchParam(params, "dateFrom"),
    dateTo: getSearchParam(params, "dateTo"),
  };
  const requestedPage = Number.parseInt(getSearchParam(params, "page") || "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const universityId = session?.user.role === "UNIVERSITY_ADMIN"
    ? session.user.universityId || "__missing_university__"
    : undefined;
  const where = createAuditLogWhere(filters, universityId);
  const actorScope = universityId ? { universityId } : {};

  const totalCount = await prisma.auditLog.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const [logs, actors] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.findMany({
      where: actorScope,
      select: { actorName: true, actorEmail: true },
      distinct: ["actorEmail"],
      orderBy: { actorEmail: "asc" },
    }),
  ]);
  const productIds = logs
    .filter((log) => log.entityType === "PRODUCT" && log.entityId)
    .map((log) => log.entityId as string);
  const products = productIds.length > 0
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, imageUrl: true },
      })
    : [];
  const productImages = new Map(products.map((product) => [product.id, product.imageUrl]));

  const firstShownItem = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastShownItem = Math.min(currentPage * PAGE_SIZE, totalCount);
  const exportParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) exportParams.set(key, value);
  });

  return (
    <div className="activity-log-page">
      <header className="activity-page-heading">
        <h1>Журнал действий</h1>
        <p>История всех действий в панели администратора. Используйте фильтры и поиск, чтобы найти нужные события.</p>
      </header>

      <form className="activity-filters" method="get">
        <label>
          <span>Период: от</span>
          <input type="date" name="dateFrom" defaultValue={filters.dateFrom} />
        </label>
        <label>
          <span>до</span>
          <input type="date" name="dateTo" defaultValue={filters.dateTo} />
        </label>
        <label>
          <span>Пользователь</span>
          <select name="actor" defaultValue={filters.actor || ""}>
            <option value="">Все пользователи</option>
            {actors.map((actor) => (
              <option value={actor.actorEmail} key={actor.actorEmail}>
                {actor.actorName || actor.actorEmail}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Действие</span>
          <select name="action" defaultValue={filters.action || ""}>
            <option value="">Все действия</option>
            {auditActions.map((action) => (
              <option value={action} key={action}>{auditActionLabels[action]}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Раздел</span>
          <select name="section" defaultValue={filters.section || ""}>
            <option value="">Все разделы</option>
            {auditSections.map((section) => (
              <option value={section} key={section}>{auditSectionLabels[section]}</option>
            ))}
          </select>
        </label>

        <div className="activity-filter-bottom">
          <label className="activity-search">
            <span className="sr-only">Поиск</span>
            <input
              type="search"
              name="search"
              defaultValue={filters.search}
              placeholder="Поиск по описанию или объекту..."
            />
            <FiSearch aria-hidden="true" />
          </label>
          <button type="submit" className="filter-submit">Применить</button>
          <Link href="/admin/activity" className="filter-reset">
            <FiRefreshCw aria-hidden="true" />
            Сбросить фильтры
          </Link>
          <a
            href={`/api/admin/audit-logs/export${exportParams.size ? `?${exportParams}` : ""}`}
            className="activity-export"
          >
            <FiDownload aria-hidden="true" />
            Экспорт
          </a>
        </div>
      </form>

      <section className="activity-table-card">
        <div className="activity-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Дата и время</th>
                <th>Пользователь</th>
                <th>Действие</th>
                <th>Раздел</th>
                <th>Объект</th>
                <th>Детали</th>
                <th>IP-адрес</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const ActionIcon = getActionIcon(log.action);
                const action = log.action as AuditAction;
                const section = log.section as AuditSection;
                const productImageUrl = log.entityId ? productImages.get(log.entityId) : undefined;
                const objectContent = (
                  <>
                    {productImageUrl && (
                      <Image
                        src={productImageUrl}
                        alt=""
                        width={42}
                        height={42}
                        unoptimized
                      />
                    )}
                    <span className="activity-object-copy">
                      <strong>{log.entityLabel}</strong>
                      {log.entityId && <small>ID: {log.entityId}</small>}
                    </span>
                  </>
                );

                return (
                  <tr key={log.id}>
                    <td><time>{dateTimeFormatter.format(log.createdAt)}</time></td>
                    <td>
                      <div className="activity-user">
                        <span className="activity-avatar">{getInitials(log.actorName, log.actorEmail)}</span>
                        <span>
                          <strong>{log.actorName || "Без имени"}</strong>
                          <small>{log.actorEmail}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`action-cell ${log.action.toLowerCase()}`}>
                        <span className="action-icon"><ActionIcon /></span>
                        {auditActionLabels[action] || log.action}
                      </span>
                    </td>
                    <td>
                      <span className={`section-badge ${log.section.toLowerCase()}`}>
                        {auditSectionLabels[section] || log.section}
                      </span>
                    </td>
                    <td>
                      {log.entityType === "PRODUCT" && log.action !== "DELETE" && log.entityId ? (
                        <Link href={`/admin/products/${log.entityId}/edit`} className="activity-object">
                          {objectContent}
                        </Link>
                      ) : (
                        <span className="activity-object">{objectContent}</span>
                      )}
                    </td>
                    <td className="activity-details">{log.details || "Нет дополнительной информации"}</td>
                    <td className="activity-ip">{log.ipAddress || "Не определён"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="activity-empty-state">
            <FiRefreshCw aria-hidden="true" />
            <strong>Действий пока нет</strong>
            <p>Записи появятся после изменений товаров или обработки заявок.</p>
          </div>
        )}
      </section>

      <footer className="activity-pagination">
        <span>Показано {firstShownItem}–{lastShownItem} из {totalCount}</span>
        {totalPages > 1 && (
          <nav aria-label="Страницы журнала">
            {currentPage > 1 && <Link href={getPageHref(filters, currentPage - 1)}>←</Link>}
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <Link
                href={getPageHref(filters, pageNumber)}
                className={pageNumber === currentPage ? "active" : ""}
                aria-current={pageNumber === currentPage ? "page" : undefined}
                key={pageNumber}
              >
                {pageNumber}
              </Link>
            ))}
            {currentPage < totalPages && <Link href={getPageHref(filters, currentPage + 1)}>→</Link>}
          </nav>
        )}
        <span>{PAGE_SIZE} на странице</span>
      </footer>
    </div>
  );
}
