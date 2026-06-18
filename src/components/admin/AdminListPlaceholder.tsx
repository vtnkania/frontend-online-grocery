import AdminPageHeader from "@/components/admin/AdminPageHeader";

const rows = ["Fresh Produce", "Downtown Branch", "Jane Doe", "Order #FM-1204"];

export default function AdminListPlaceholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <AdminPageHeader title={title} subtitle={subtitle} />
      <section className="space-y-5 p-5">
        <div className="grid gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-[1fr_180px_180px]">
          <input className="input-admin" placeholder={`Search ${title.toLowerCase()}...`} />
          <select className="input-admin"><option>All Status</option></select>
          <select className="input-admin"><option>Sort: Newest</option><option>Sort: Name</option></select>
        </div>
        <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-600"><tr><th className="px-5 py-4">Name</th><th>Status</th><th>Updated</th></tr></thead>
            <tbody>{rows.map((row) => <tr className="border-t border-slate-100" key={row}><td className="px-5 py-4 font-bold">{row}</td><td>Ready</td><td>Today</td></tr>)}</tbody>
          </table>
          <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-500">Server-side pagination, filtering, and sorting hooks are ready for this module.</div>
        </div>
      </section>
    </>
  );
}
