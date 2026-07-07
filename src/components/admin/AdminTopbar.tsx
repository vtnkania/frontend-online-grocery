"use client";

import Link from "next/link";
import { Home, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function AdminTopbar() {
  const user = useAuth((state) => state.user);
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-[#f6f8fd]/95 px-5 backdrop-blur">
      <Button asChild variant="outline" className="bg-white">
        <Link href="/"><Home className="size-4" /> Home</Link>
      </Button>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-black leading-tight">{user?.name || user?.email || "Admin"}</p>
          <p className="text-xs font-semibold text-slate-500">{formatRole(user?.role)}</p>
        </div>
        {user?.profileImageUrl ? (
          <img className="size-10 rounded-full border-2 border-emerald-500 object-cover" src={user.profileImageUrl} alt={user.name ?? user.email} />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <UserCircle className="size-7" />
          </div>
        )}
      </div>
    </header>
  );
}

const formatRole = (role?: string) => role?.replace("_", " ") ?? "ADMIN";
