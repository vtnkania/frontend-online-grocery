"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login?redirect=/admin/dashboard");
    else if (!["SUPER_ADMIN", "STORE_ADMIN"].includes(user.role)) router.replace("/");
  }, [loading, router, user]);

  if (loading || !user || !["SUPER_ADMIN", "STORE_ADMIN"].includes(user.role)) {
    return <section className="p-8 text-sm text-slate-500">Checking admin access...</section>;
  }
  return children;
}
