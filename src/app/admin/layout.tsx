import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <main className="min-h-screen bg-[#f6f8fd] text-slate-950 md:grid md:grid-cols-[256px_1fr]">
        <AdminSidebar />
        <section className="min-w-0">
          <AdminTopbar />
          {children}
        </section>
      </main>
    </AdminGuard>
  );
}
