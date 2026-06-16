"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, Grid2X2, LayoutDashboard, LogOut, Package, ReceiptText, Store, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const items = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: Grid2X2 },
  { label: "Inventory", href: "/admin/inventory", icon: Boxes },
  { label: "Orders", href: "/admin/orders", icon: ReceiptText },
  { label: "Stores", href: "/admin/stores", icon: Store },
  { label: "Users", href: "/admin/users", icon: Users },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const logout = useAuth((state) => state.logout);
  return (
    <aside className="border-r border-slate-200 bg-[#eaf1ff] px-5 py-6 md:sticky md:top-0 md:h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-emerald-800">FreshMart</h1>
        <p className="text-sm tracking-wide text-slate-600">Admin Panel</p>
      </div>
      <nav className="flex gap-2 overflow-x-auto pb-2 md:block md:space-y-2 md:overflow-visible">
        {items.map((item) => <NavItem active={isActive(pathname, item.href)} item={item} key={item.href} />)}
      </nav>
      <div className="mt-8 hidden border-t border-slate-300 pt-5 md:block">
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-slate-800 hover:bg-white">
          <LogOut className="size-5 text-emerald-800" /> Sign Out
        </button>
      </div>
    </aside>
  );
}

function NavItem({ item, active }: { item: (typeof items)[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className={cn("flex min-w-fit items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-slate-700", active && "bg-emerald-200 text-emerald-900")}>
      <Icon className="size-5" />
      {item.label}
    </Link>
  );
}

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
