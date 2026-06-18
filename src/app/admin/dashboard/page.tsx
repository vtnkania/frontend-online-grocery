import Link from "next/link";
import { BarChart3, Download, PackageCheck, ReceiptText, RefreshCw, Users } from "lucide-react";
import AdminMetricCard from "@/components/admin/AdminMetricCard";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";

const products = [
  ["Organic Avocados", "$12,400", "1,240 units sold", "https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?auto=format&fit=crop&w=120&q=80"],
  ["Garden Strawberries", "$8,820", "980 units sold", "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=120&q=80"],
  ["A2 Whole Milk", "$7,650", "850 units sold", "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=120&q=80"],
  ["Artisan Sourdough", "$5,040", "720 units sold", "https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=120&q=80"],
];

export default function AdminDashboardPage() {
  return (
    <>
      <AdminPageHeader title="Analytics Overview" subtitle="Real-time performance tracking for FreshMart ecosystem." actions={<Button className="bg-emerald-700"><Download /> Export</Button>} />
      <section className="space-y-6 p-5">
        <MetricGrid />
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <RevenueTrends />
          <TopProducts />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <SalesByCategory />
          <Efficiency />
        </div>
      </section>
    </>
  );
}

function MetricGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <AdminMetricCard title="Total Revenue" value="$124,500.00" note="+15% from last month" icon={BarChart3} />
      <AdminMetricCard title="Total Orders" value="3,241" note="+8% from last month" icon={ReceiptText} />
      <AdminMetricCard title="Avg. Order Value" value="$38.90" note="-2% needs review" icon={PackageCheck} tone="red" />
      <AdminMetricCard title="Retention Rate" value="68.2%" note="+5% returning buyers" icon={Users} tone="blue" />
    </div>
  );
}

function RevenueTrends() {
  return (
    <article className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-2xl font-black">Revenue Trends</h2><p className="text-slate-600">Daily sales performance over the last 30 days.</p></div>
        <div className="rounded-lg bg-blue-50 p-1 text-sm font-bold"><span className="rounded-md bg-white px-4 py-2 text-emerald-800">Weekly</span></div>
      </div>
      <div className="relative h-80 overflow-hidden rounded-lg border border-emerald-100 bg-[radial-gradient(#b7d8cb_1px,transparent_1px)] [background-size:24px_24px]">
        <svg viewBox="0 0 800 280" className="absolute inset-0 h-full w-full" role="img" aria-label="Revenue trend line chart">
          <path d="M20 230 C110 210 130 165 210 190 C270 210 290 70 370 130 C450 200 430 35 510 80 C590 135 570 225 650 110 C700 40 735 100 780 55" fill="none" stroke="#10b981" strokeWidth="5" />
          <path d="M20 230 C110 210 130 165 210 190 C270 210 290 70 370 130 C450 200 430 35 510 80 C590 135 570 225 650 110 C700 40 735 100 780 55 L780 280 L20 280 Z" fill="#10b98122" />
        </svg>
      </div>
    </article>
  );
}

function TopProducts() {
  return (
    <article className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-6 flex items-center justify-between"><h2 className="text-2xl font-black">Top Products</h2><Link className="font-bold text-emerald-800" href="/admin/products">View All</Link></div>
      <div className="space-y-5">
        {products.map(([name, total, sold, image]) => (
          <div className="grid grid-cols-[56px_1fr_auto] items-center gap-4" key={name}>
            <img src={image} alt={name} className="size-14 rounded-lg object-cover" />
            <div><p className="font-bold">{name}</p><p className="text-sm text-slate-500">{sold}</p></div>
            <p className="font-black">{total}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function SalesByCategory() {
  return (
    <article className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-black">Sales by Category</h2>
      <div className="mx-auto my-8 grid size-52 place-items-center rounded-full bg-[conic-gradient(#047857_0_45%,#2f6f58_45%_73%,#ff7f7a_73%_88%,#d8e2dd_88%)]">
        <div className="grid size-28 place-items-center rounded-full bg-white text-center"><span className="text-xs font-bold text-slate-500">TOTAL</span><strong className="block text-2xl">$124.5k</strong></div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm"><p>● Produce (45%)</p><p>● Dairy (28%)</p><p>● Meat (15%)</p><p>● Bakery (12%)</p></div>
    </article>
  );
}

function Efficiency() {
  return (
    <article className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-black">Operational Efficiency</h2>
      <Progress label="Avg. Delivery Time" value="28.4 mins" width="82%" />
      <Progress label="Fulfillment Accuracy" value="99.2%" width="96%" />
      <div className="mt-6 rounded-lg bg-blue-50 p-5"><p className="flex items-center gap-2 font-bold text-emerald-800"><RefreshCw className="size-4" /> Logistics Insight</p><p className="mt-3 text-slate-700">Peak delivery load is between <b>5:00 PM - 7:00 PM</b>.</p></div>
    </article>
  );
}

function Progress({ label, value, width }: { label: string; value: string; width: string }) {
  return <div className="mt-6"><div className="mb-2 flex justify-between font-bold"><span>{label}</span><span className="text-emerald-800">{value}</span></div><div className="h-3 rounded-full bg-blue-50"><div className="h-full rounded-full bg-emerald-700" style={{ width }} /></div></div>;
}
