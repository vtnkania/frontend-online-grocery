"use client";

import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ProductForm from "@/components/admin/ProductForm";
import { useAuth } from "@/hooks/useAuth";

export default function CreateProductPage() {
  const user = useAuth((state) => state.user);
  if (user?.role === "STORE_ADMIN") return <ReadOnlyNotice />;
  return (
    <>
      <AdminPageHeader title="Add New Product" subtitle="Create a product with validated multi-photo upload." />
      <section className="p-5"><ProductForm /></section>
    </>
  );
}

function ReadOnlyNotice() {
  return (
    <>
      <AdminPageHeader title="Read-Only Access" subtitle="Store admins can view product data but cannot create products." />
      <section className="p-5 text-sm text-slate-600">Please contact a Super Admin for product changes.</section>
    </>
  );
}
