"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, PackageCheck, ReceiptText, Users } from "lucide-react";
import { toast } from "sonner";
import AdminMetricCard from "@/components/admin/AdminMetricCard";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getAdminDashboard } from "@/services/admin/dashboard-admin.service";
import type { AdminDashboardData, DashboardCategorySale, DashboardTopProduct, DashboardTrendPoint } from "@/types/admin.type";

const emptyDashboard: AdminDashboardData = {
  metrics: { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, activeCustomers: 0 },
  revenueTrend: [],
  topProducts: [],
  salesByCategory: [],
};

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboard().then(setDashboard).catch(() => toast.error("Failed to load dashboard data.")).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <AdminPageHeader title="Analytics Overview" subtitle="Real-time performance tracking for FreshMart ecosystem." />
      <section className="space-y-6 p-5">
        <MetricGrid data={dashboard} />
        {loading && <p className="rounded-lg bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200">Loading dashboard data...</p>}
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <RevenueTrends rows={dashboard.revenueTrend} />
          <TopProducts products={dashboard.topProducts} />
        </div>
        <SalesByCategory categories={dashboard.salesByCategory} total={dashboard.metrics.totalRevenue} />
      </section>
    </>
  );
}

function MetricGrid({ data }: { data: AdminDashboardData }) {
  const { metrics } = data;
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <AdminMetricCard title="Total Revenue" value={formatCurrency(metrics.totalRevenue)} note="Non-cancelled order revenue" icon={BarChart3} />
      <AdminMetricCard title="Total Orders" value={metrics.totalOrders.toLocaleString("id-ID")} note="Non-cancelled orders" icon={ReceiptText} />
      <AdminMetricCard title="Avg. Order Value" value={formatCurrency(metrics.averageOrderValue)} note="Revenue divided by orders" icon={PackageCheck} tone="blue" />
      <AdminMetricCard title="Active Customers" value={metrics.activeCustomers.toLocaleString("id-ID")} note="Customers with orders" icon={Users} tone="dark" />
    </div>
  );
}

function RevenueTrends({ rows }: { rows: DashboardTrendPoint[] }) {
  const max = Math.max(...rows.map((row) => row.revenue), 1);
  return (
    <article className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-2xl font-black">Revenue Trends</h2><p className="text-slate-600">Daily sales performance over the last 30 days.</p></div>
        <div className="rounded-lg bg-blue-50 p-1 text-sm font-bold"><span className="rounded-md bg-white px-4 py-2 text-emerald-800">30 Days</span></div>
      </div>
      <div className="flex h-80 items-end gap-1 overflow-hidden rounded-lg border border-emerald-100 bg-[radial-gradient(#b7d8cb_1px,transparent_1px)] p-4 [background-size:24px_24px]">
        {rows.length ? rows.map((row) => <TrendBar row={row} max={max} key={row.date} />) : <EmptyState label="No revenue data yet." />}
      </div>
    </article>
  );
}

function TrendBar({ row, max }: { row: DashboardTrendPoint; max: number }) {
  const height = Math.max(4, (row.revenue / max) * 100);
  const label = new Date(row.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  return (
    <div className="group relative flex min-w-2 flex-1 items-end justify-center">
      <div className="w-full rounded-t bg-emerald-600 transition group-hover:bg-emerald-800" style={{ height: `${height}%` }} />
      <div className="pointer-events-none absolute bottom-full mb-2 hidden rounded-lg bg-slate-950 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
        <p className="font-bold">{label}</p><p>{formatCurrency(row.revenue)}</p><p>{row.orders} orders</p>
      </div>
    </div>
  );
}

function TopProducts({ products }: { products: DashboardTopProduct[] }) {
  return (
    <article className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-6 flex items-center justify-between"><h2 className="text-2xl font-black">Top Products</h2><Link className="font-bold text-emerald-800" href="/admin/products">View All</Link></div>
      <div className="space-y-5">
        {products.length ? products.map((product) => <ProductRow product={product} key={product.name} />) : <EmptyState label="No product sales yet." />}
      </div>
    </article>
  );
}

function ProductRow({ product }: { product: DashboardTopProduct }) {
  const image = product.imageUrl ?? "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80";
  return (
    <div className="grid grid-cols-[56px_1fr_auto] items-center gap-4">
      <img src={image} alt={product.name} className="size-14 rounded-lg object-cover" />
      <div><p className="font-bold">{product.name}</p><p className="text-sm text-slate-500">{product.quantity.toLocaleString("id-ID")} units sold</p></div>
      <p className="font-black">{formatCurrency(product.revenue)}</p>
    </div>
  );
}

function SalesByCategory({ categories, total }: { categories: DashboardCategorySale[]; total: number }) {
  const conic = categoryConic(categories);
  return (
    <article className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-black">Sales by Category</h2>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-center">
        <div className="mx-auto my-8 grid size-52 place-items-center rounded-full" style={{ background: conic }}>
          <div className="grid size-28 place-items-center rounded-full bg-white text-center"><span className="text-xs font-bold text-slate-500">TOTAL</span><strong className="block text-2xl">{formatCompact(total)}</strong></div>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          {categories.length ? categories.map((item, index) => <CategoryRow item={item} index={index} key={item.name} />) : <EmptyState label="No category sales yet." />}
        </div>
      </div>
    </article>
  );
}

function CategoryRow({ item, index }: { item: DashboardCategorySale; index: number }) {
  return <p className="flex items-center gap-2 font-semibold"><span className="size-3 rounded-full" style={{ background: colors[index % colors.length] }} />{item.name} ({item.percentage}%)</p>;
}

function EmptyState({ label }: { label: string }) {
  return <p className="w-full rounded-lg bg-blue-50 p-5 text-sm font-semibold text-slate-500">{label}</p>;
}

const colors = ["#047857", "#2563eb", "#f97316", "#dc2626", "#7c3aed", "#0f172a"];
const formatCurrency = (value: number) => `Rp ${Math.round(value).toLocaleString("id-ID")}`;
const formatCompact = (value: number) => new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const categoryConic = (categories: DashboardCategorySale[]) => {
  if (!categories.length) return "conic-gradient(#d8e2dd 0 100%)";
  let start = 0;
  const segments = categories.map((item, index) => {
    const end = start + item.percentage;
    const segment = `${colors[index % colors.length]} ${start}% ${end}%`;
    start = end;
    return segment;
  });
  return `conic-gradient(${segments.join(",")}, #d8e2dd ${start}% 100%)`;
};
