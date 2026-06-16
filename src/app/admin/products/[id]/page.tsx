"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ProductForm from "@/components/admin/ProductForm";
import { useAuth } from "@/hooks/useAuth";
import { getAdminProduct } from "@/services/admin/product-admin.service";
import type { AdminProduct } from "@/types/admin.type";

export default function AdminProductDetailPage() {
  const id = String(useParams().id);
  const user = useAuth((state) => state.user);
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { getAdminProduct(id).then(setProduct).catch(() => setError("Product not found.")); }, [id]);

  if (user?.role === "STORE_ADMIN") return <ReadOnlyNotice />;
  if (error) return <PageMessage title="Product Not Found" message={error} />;
  if (!product) return <PageMessage title="Edit Product" message="Loading product..." />;
  return (
    <>
      <AdminPageHeader title="Edit Product" subtitle={`Update ${product.name} with client and server validation.`} />
      <section className="p-5"><ProductForm product={product} /></section>
    </>
  );
}

function ReadOnlyNotice() {
  return <PageMessage title="Read-Only Access" message="Store admins can view product data but cannot edit products." />;
}

function PageMessage({ title, message }: { title: string; message: string }) {
  return (
    <>
      <AdminPageHeader title={title} subtitle={message} />
      <section className="p-5 text-sm text-slate-600">{message}</section>
    </>
  );
}
