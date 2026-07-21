import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { OrderStatus, type Prisma } from "@prisma/client";
import {
  FiClock,
  FiDollarSign,
  FiPackage,
  FiShoppingBag,
  FiStar,
  FiTag,
  FiUsers,
} from "react-icons/fi";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/database/prisma";
import "./page.scss";

const formatNumber = new Intl.NumberFormat("ru-RU");
const formatDate = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
});
const formatDateTime = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const revenueOrderStatuses: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];
const orderStatusLabels: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "Ожидает оплаты",
  PAID: "Оплачен",
  PROCESSING: "Собирается",
  SHIPPED: "Передан в доставку",
  DELIVERED: "Доставлен",
  CANCELED: "Отменён",
  PAYMENT_FAILED: "Ошибка оплаты",
  REFUNDED: "Возвращён",
};

type ActivityItem = {
  id: string;
  title: string;
  details: string;
  createdAt: Date;
  type: "order" | "product" | "user" | "verification";
};

function getLastSevenDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return date;
  });
}

function getDailyCounts(items: { createdAt: Date }[], days: Date[]) {
  return days.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    return items.filter((item) => item.createdAt >= day && item.createdAt < nextDay).length;
  });
}

function getDailyRevenue(items: { paidAt: Date | null; total: number }[], days: Date[]) {
  return days.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    return items.reduce((total, item) => {
      if (!item.paidAt || item.paidAt < day || item.paidAt >= nextDay) return total;
      return total + item.total;
    }, 0);
  });
}

function formatItemsCount(count: number) {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;
  const label = lastTwoDigits >= 11 && lastTwoDigits <= 14
    ? "товаров"
    : lastDigit === 1
      ? "товар"
      : lastDigit >= 2 && lastDigit <= 4
        ? "товара"
        : "товаров";

  return `${count} ${label}`;
}

function MetricSparkline({ values }: { values: number[] }) {
  const maxValue = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * 150;
    const y = 28 - (value / maxValue) * 22;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className="metric-sparkline" viewBox="0 0 150 32" aria-hidden="true">
      <polyline points={points} />
    </svg>
  );
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const isUniversityAdmin = session?.user.role === "UNIVERSITY_ADMIN";
  const scopedUniversityId = isUniversityAdmin
    ? session.user.universityId || "__missing_university__"
    : undefined;
  const productWhere: Prisma.ProductWhereInput = scopedUniversityId
    ? { universityId: scopedUniversityId }
    : {};
  const userWhere: Prisma.UserWhereInput = scopedUniversityId
    ? { universityId: scopedUniversityId }
    : {};
  const verificationWhere: Prisma.VerificationRequestWhereInput = scopedUniversityId
    ? { universityId: scopedUniversityId }
    : {};
  const orderWhere: Prisma.OrderWhereInput = scopedUniversityId
    ? { items: { some: { product: { universityId: scopedUniversityId } } } }
    : {};
  const chartDays = getLastSevenDays();
  const chartStart = chartDays[0];

  const [
    productCount,
    publishedProductCount,
    userCount,
    lowStockProducts,
    popularProducts,
    recentVerifications,
    recentProducts,
    recentUsers,
    chartProducts,
    chartUsers,
    orderCount,
    revenue,
    recentOrders,
    chartOrders,
  ] = await Promise.all([
    prisma.product.count({ where: productWhere }),
    prisma.product.count({ where: { ...productWhere, isPublished: true } }),
    prisma.user.count({ where: userWhere }),
    prisma.product.findMany({
      where: {
        ...productWhere,
        isPublished: true,
        stockCount: { lte: 5 },
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        stockCount: true,
        availableColors: true,
        availableSizes: true,
      },
      orderBy: [{ stockCount: "asc" }, { updatedAt: "desc" }],
      take: 4,
    }),
    prisma.product.findMany({
      where: { ...productWhere, isPublished: true },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        views: true,
        _count: { select: { favorites: true } },
      },
      orderBy: [{ views: "desc" }, { favorites: { _count: "desc" } }],
      take: 4,
    }),
    prisma.verificationRequest.findMany({
      where: verificationWhere,
      select: {
        id: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        university: { select: { shortName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.product.findMany({
      where: productWhere,
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.user.findMany({
      where: userWhere,
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.product.findMany({
      where: { ...productWhere, createdAt: { gte: chartStart } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { ...userWhere, createdAt: { gte: chartStart } },
      select: { createdAt: true },
    }),
    prisma.order.count({ where: orderWhere }),
    prisma.order.aggregate({
      where: { ...orderWhere, status: { in: revenueOrderStatuses } },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      where: orderWhere,
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.order.findMany({
      where: {
        ...orderWhere,
        OR: [
          { createdAt: { gte: chartStart } },
          { status: { in: revenueOrderStatuses }, paidAt: { gte: chartStart } },
        ],
      },
      select: { createdAt: true, paidAt: true, total: true, status: true },
    }),
  ]);

  const dailyProductCounts = getDailyCounts(chartProducts, chartDays);
  const dailyUserCounts = getDailyCounts(chartUsers, chartDays);
  const dailyOrderCounts = getDailyCounts(chartOrders, chartDays);
  const dailyRevenue = getDailyRevenue(
    chartOrders.filter((order) => revenueOrderStatuses.includes(order.status)),
    chartDays,
  );
  const sevenDayRevenue = dailyRevenue.reduce((total, value) => total + value, 0);
  const maxDailyRevenue = Math.max(...dailyRevenue, 1);
  const hasRevenue = dailyRevenue.some((value) => value > 0);
  const revenuePoints = dailyRevenue
    .map((value, index) => {
      const x = (index / Math.max(chartDays.length - 1, 1)) * 700;
      const y = 184 - (value / maxDailyRevenue) * 144;
      return `${x},${y}`;
    })
    .join(" ");
  const emptyMetricTrend = chartDays.map(() => 0);

  const activity: ActivityItem[] = [
    ...recentOrders.map((order) => ({
      id: `order-${order.id}`,
      title: `Оформлен заказ ${order.number}`,
      details: `${orderStatusLabels[order.status]} · ${formatNumber.format(order.total)} ₽`,
      createdAt: order.createdAt,
      type: "order" as const,
    })),
    ...recentProducts.map((product) => ({
      id: `product-${product.id}`,
      title: `Добавлен товар «${product.name}»`,
      details: "Каталог товаров",
      createdAt: product.createdAt,
      type: "product" as const,
    })),
    ...recentUsers.map((user) => ({
      id: `user-${user.id}`,
      title: `Новый пользователь ${user.name || user.email}`,
      details: user.email,
      createdAt: user.createdAt,
      type: "user" as const,
    })),
    ...recentVerifications.map((verification) => ({
      id: `verification-${verification.id}`,
      title: `Заявка на статус: ${verification.user.name || verification.user.email}`,
      details: verification.university.shortName,
      createdAt: verification.createdAt,
      type: "verification" as const,
    })),
  ]
    .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime())
    .slice(0, 5);

  const metricCards = [
    {
      label: "Заказы",
      value: formatNumber.format(orderCount),
      note: orderCount > 0 ? "Всего оформлено" : "Заказов пока нет",
      icon: FiShoppingBag,
      tone: "blue",
      trend: dailyOrderCounts,
    },
    {
      label: "Выручка",
      value: `${formatNumber.format(revenue._sum.total || 0)} ₽`,
      note: revenue._sum.total ? "По оплаченным заказам" : "Продаж пока нет",
      icon: FiDollarSign,
      tone: "green",
      trend: dailyRevenue,
    },
    {
      label: "Пользователи",
      value: formatNumber.format(userCount),
      note: isUniversityAdmin ? "Ваш университет" : "Всего зарегистрировано",
      icon: FiUsers,
      tone: "purple",
      trend: dailyUserCounts,
    },
    {
      label: "Отзывы",
      value: "0",
      note: "Нет данных об отзывах",
      icon: FiStar,
      tone: "orange",
      trend: emptyMetricTrend,
    },
    {
      label: "Товары",
      value: formatNumber.format(productCount),
      note: `${formatNumber.format(publishedProductCount)} опубликовано`,
      icon: FiPackage,
      tone: "cyan",
      trend: dailyProductCounts,
    },
  ];

  return (
    <div className="admin-dashboard">
      <header className="dashboard-heading">
        <h1>Дашборд</h1>
        <p>
          {isUniversityAdmin
            ? "Статистика товаров и заявок вашего университета."
            : "Общая статистика магазина Campus & Code."}
        </p>
      </header>

      <section className="dashboard-metrics" aria-label="Основные показатели">
        {metricCards.map(({ label, value, note, icon: Icon, tone, trend }) => (
          <article className={`metric-card ${tone}`} key={label}>
            <div className="metric-icon"><Icon /></div>
            <div className="metric-content">
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{note}</small>
            </div>
            <MetricSparkline values={trend} />
          </article>
        ))}
      </section>

      <div className="dashboard-main-grid">
        <section className="dashboard-panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Выручка</h2>
              <p>Динамика продаж магазина</p>
            </div>
            <span className="period-label">Последние 7 дней</span>
          </div>

          <div className="products-chart revenue-chart">
            <svg viewBox="0 0 700 210" role="img" aria-label="Данных о выручке пока нет">
              {[40, 88, 136, 184].map((y) => (
                <line className="chart-grid-line" x1="0" x2="700" y1={y} y2={y} key={y} />
              ))}
              <polyline className={`chart-line ${hasRevenue ? "" : "empty"}`} points={revenuePoints} />
              {hasRevenue && dailyRevenue.map((value, index) => (
                <circle
                  cx={(index / Math.max(chartDays.length - 1, 1)) * 700}
                  cy={184 - (value / maxDailyRevenue) * 144}
                  r="4"
                  key={chartDays[index].toISOString()}
                />
              ))}
            </svg>
            {!hasRevenue && (
              <div className="chart-empty-message">
                <strong>0 ₽</strong>
                <span>Оплаченных заказов за последние 7 дней нет</span>
              </div>
            )}
            {hasRevenue && (
              <div className="chart-total">
                <span>За 7 дней</span>
                <strong>{formatNumber.format(sevenDayRevenue)} ₽</strong>
              </div>
            )}
            <div className="chart-labels">
              {chartDays.map((day, index) => (
                <span key={day.toISOString()}>
                  {formatDate.format(day)}
                  <strong>{formatNumber.format(dailyRevenue[index])} ₽</strong>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-panel orders-panel">
          <div className="panel-heading">
            <div>
              <h2>Последние заказы</h2>
              <p>Недавние покупки пользователей</p>
            </div>
          </div>
          {recentOrders.length > 0 ? (
            <div className="recent-orders-list">
              {recentOrders.map((order) => (
                <Link href="/admin/orders" className="recent-order-row" key={order.id}>
                  <span className="recent-order-main">
                    <strong>{order.number}</strong>
                    <small>{order.user.name || order.user.email}</small>
                  </span>
                  <span className="recent-order-meta">
                    <strong>{formatNumber.format(order.total)} ₽</strong>
                    <small>{formatItemsCount(order._count.items)}</small>
                  </span>
                  <span className={`order-status ${order.status.toLowerCase()}`}>
                    {orderStatusLabels[order.status]}
                  </span>
                  <time dateTime={order.createdAt.toISOString()}>{formatDateTime.format(order.createdAt)}</time>
                </Link>
              ))}
              <Link className="all-orders-link" href="/admin/orders">Смотреть все заказы</Link>
            </div>
          ) : (
            <div className="panel-empty-state">Заказов пока нет</div>
          )}
        </section>
      </div>

      <div className="dashboard-bottom-grid">
        <section className="dashboard-panel product-list-panel">
          <div className="panel-heading">
            <div>
              <h2>Остатки на складе</h2>
              <p>Товары с остатком не более 5 штук</p>
            </div>
            <Link href="/admin/products">Смотреть все</Link>
          </div>

          {lowStockProducts.length > 0 ? (
            <div className="compact-product-list">
              {lowStockProducts.map((product) => (
                <Link href={`/admin/products/${product.id}/edit`} key={product.id}>
                  <Image src={product.imageUrl} alt="" width={52} height={52} unoptimized />
                  <span className="product-copy">
                    <strong>{product.name}</strong>
                    <small>
                      {[product.availableColors[0], product.availableSizes[0]].filter(Boolean).join(", ") || "Без варианта"}
                    </small>
                  </span>
                  <span className={`stock-count ${product.stockCount === 0 ? "empty" : ""}`}>
                    {product.stockCount === 0 ? "Нет в наличии" : `Остаток: ${product.stockCount} шт.`}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="panel-empty-state">Товаров с низким остатком нет</div>
          )}
        </section>

        <section className="dashboard-panel product-list-panel">
          <div className="panel-heading">
            <div>
              <h2>Популярные товары</h2>
              <p>По просмотрам и добавлениям в избранное</p>
            </div>
            <Link href="/admin/products">Смотреть все</Link>
          </div>

          {popularProducts.length > 0 ? (
            <ol className="compact-product-list popular-list">
              {popularProducts.map((product, index) => (
                <li key={product.id}>
                  <span className="product-rank">{index + 1}</span>
                  <Image src={product.imageUrl} alt="" width={52} height={52} unoptimized />
                  <span className="product-copy">
                    <strong>{product.name}</strong>
                    <small>{formatNumber.format(product.views)} просмотров</small>
                  </span>
                  <span className="favorites-count">{product._count.favorites} в избранном</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="panel-empty-state">Опубликованных товаров пока нет</div>
          )}
        </section>

        <section className="dashboard-panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Активность</h2>
              <p>Последние изменения в системе</p>
            </div>
          </div>

          {activity.length > 0 ? (
            <div className="activity-list">
              {activity.map((item) => {
                const Icon = item.type === "order"
                  ? FiShoppingBag
                  : item.type === "product"
                    ? FiTag
                    : item.type === "user"
                      ? FiUsers
                      : FiClock;
                return (
                  <div className={`activity-row ${item.type}`} key={item.id}>
                    <span className="activity-icon"><Icon /></span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.details} · {formatDateTime.format(item.createdAt)}</small>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="panel-empty-state">Активности пока нет</div>
          )}
        </section>
      </div>
    </div>
  );
}
