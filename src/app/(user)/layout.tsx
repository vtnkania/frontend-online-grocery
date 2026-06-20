"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import AccountShell from "@/components/account/AccountShell";
import { useAuth } from "@/hooks/useAuth";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    if (user && !user.isVerified) router.replace("/?notice=verify-email");
  }, [loading, pathname, router, user]);

  if (loading || !user || !user.isVerified) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Memeriksa akses akun...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main>{isAccountPath(pathname) ? <AccountShell>{children}</AccountShell> : children}</main>
      <Footer />
    </div>
  );
}

const isAccountPath = (pathname: string) => ["/profile", "/addresses", "/orders"].some((path) => pathname === path || pathname.startsWith(`${path}/`));
