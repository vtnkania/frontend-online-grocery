"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, ReceiptText, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const items = [
  { label: "Profile", href: "/profile", icon: UserRound },
  { label: "Addresses", href: "/addresses", icon: MapPin },
  { label: "Orders", href: "/orders", icon: ReceiptText },
];

export default function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuth((state) => state.user);
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-5">
        <nav className="flex gap-2 overflow-x-auto rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200 lg:block lg:space-y-2 lg:overflow-visible">
          {items.map((item) => <NavItem item={item} active={isActive(pathname, item.href)} key={item.href} />)}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function NavItem({ item, active }: { item: (typeof items)[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className={cn("flex min-w-fit items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-700 hover:bg-emerald-50", active && "bg-emerald-700 text-white hover:bg-emerald-700")}>
      <Icon className="size-5" />
      {item.label}
    </Link>
  );
}

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
