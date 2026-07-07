"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, Minus, Plus, ShoppingCart, Truck } from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCatalogLocation } from "@/hooks/useCatalogLocation";
import { addToCart } from "@/services/cart.service";
import { getProductBySlug } from "@/services/product.service";
import type { ProductDetail } from "@/types/product.type";

const fallbackImage = "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=900&q=80";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const location = useCatalogLocation();
  const user = useAuth((state) => state.user);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedImage, setSelectedImage] = useState(fallbackImage);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);

  useEffect(() => {
    if (location.loading || !params.slug) return;
    getProductBySlug(params.slug, { latitude: location.latitude, longitude: location.longitude })
      .then((data) => {
        setProduct(data);
        setSelectedImage(data.images[0]?.url ?? fallbackImage);
      })
      .catch(() => toast.error("Produk tidak ditemukan."))
      .finally(() => setLoading(false));
  }, [location.loading, location.latitude, location.longitude, params.slug]);

  const images = useMemo(() => product?.images.length ? product.images.map((image) => image.url) : [fallbackImage], [product]);
  const isOutOfStock = !product || product.stock <= 0;

  const handleAdd = async () => {
    if (!product) return;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(currentPath())}`);
      return;
    }
    if (!user.isVerified) {
      toast.error("Login dan verifikasi email terlebih dahulu untuk memakai keranjang.");
      return;
    }
    try {
      setCartLoading(true);
      await addToCart(product.id, product.storeId, quantity);
      toast.success(`${quantity} produk ditambahkan ke keranjang.`);
    } catch {
      toast.error("Gagal menambahkan produk ke keranjang.");
    } finally {
      setCartLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8fd] text-slate-950">
      <Navbar />
      <section className="mx-auto max-w-6xl px-5 py-8">
        <Breadcrumb product={product} />
        {loading ? <p className="py-16 text-center text-sm text-slate-500">Loading product...</p> : product ? (
          <>
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <ProductGallery images={images} selectedImage={selectedImage} setSelectedImage={setSelectedImage} productName={product.name} />
              <aside className="space-y-6">
                <div>
                  <h1 className="text-3xl font-black leading-tight md:text-4xl">{product.name}</h1>
                  <p className="mt-3 text-2xl font-black text-emerald-800">Rp {Number(product.price).toLocaleString("id-ID")}</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                    <CheckCircle2 className="size-4" /> {product.stock > 0 ? `In Stock at ${product.storeName}` : `Out of Stock at ${product.storeName}`}
                  </div>
                </div>
                <div className="border-y border-slate-200 py-7">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Quantity</span>
                    <div className="flex h-11 items-center rounded-xl bg-blue-50">
                      <button className="grid size-11 place-items-center text-emerald-800 disabled:text-slate-300" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus className="size-4" /></button>
                      <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                      <button className="grid size-11 place-items-center text-emerald-800 disabled:text-slate-300" disabled={quantity >= product.stock} onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}><Plus className="size-4" /></button>
                    </div>
                  </div>
                  <Button onClick={handleAdd} disabled={isOutOfStock || cartLoading} className="mt-6 h-12 w-full bg-emerald-700 text-white hover:bg-emerald-800">
                    <ShoppingCart className="size-4" /> {cartLoading ? "Adding..." : "Add to Cart"}
                  </Button>
                </div>
                <div className="grid gap-3">
                  <InfoPill icon={<Truck className="size-4" />} title="Fresh delivery from nearest store" text="Delivery options are calculated during checkout." />
                  <InfoPill icon={<CheckCircle2 className="size-4" />} title={product.category.name} text="Category data follows the product catalog." />
                </div>
              </aside>
            </div>
            <Description product={product} />
            <RelatedProducts product={product} />
          </>
        ) : <p className="py-16 text-center text-sm text-slate-500">Product not found.</p>}
      </section>
      <Footer />
    </main>
  );
}

const currentPath = () => (typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`);

function Breadcrumb({ product }: { product: ProductDetail | null }) {
  return (
    <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs text-slate-500">
      <Link href="/" className="hover:text-emerald-700">Home</Link><ChevronRight className="size-3" />
      <Link href="/products" className="hover:text-emerald-700">Products</Link><ChevronRight className="size-3" />
      {product?.category && <><Link href={`/products?categoryId=${product.category.id}`} className="hover:text-emerald-700">{product.category.name}</Link><ChevronRight className="size-3" /></>}
      <span className="font-medium text-slate-800">{product?.name ?? "Product"}</span>
    </nav>
  );
}

function ProductGallery({ images, selectedImage, setSelectedImage, productName }: { images: string[]; selectedImage: string; setSelectedImage: (value: string) => void; productName: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-[88px_1fr]">
      <div className="order-2 flex gap-3 overflow-x-auto md:order-1 md:flex-col">
        {images.map((image) => <button key={image} onClick={() => setSelectedImage(image)} className={`size-20 shrink-0 overflow-hidden rounded-xl border bg-white p-1 ${selectedImage === image ? "border-emerald-700 ring-2 ring-emerald-100" : "border-slate-200"}`}><img className="h-full w-full rounded-lg object-cover" src={image} alt={productName} /></button>)}
      </div>
      <div className="order-1 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:order-2">
        <img className="aspect-square w-full object-cover" src={selectedImage} alt={productName} />
      </div>
    </div>
  );
}

function InfoPill({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="flex gap-3 rounded-xl bg-blue-50 p-4 text-sm"><span className="mt-0.5 text-emerald-800">{icon}</span><div><p className="font-semibold">{title}</p><p className="text-xs text-slate-600">{text}</p></div></div>;
}

function Description({ product }: { product: ProductDetail }) {
  return (
    <section className="mt-10 max-w-3xl">
      <h2 className="text-2xl font-black">Description</h2>
      <p className="mt-4 leading-8 text-slate-700">{product.description || "No description is available for this product yet."}</p>
    </section>
  );
}

function RelatedProducts({ product }: { product: ProductDetail }) {
  if (!product.relatedProducts.length) return null;
  return (
    <section className="mt-12 border-t border-slate-200 pt-8">
      <h2 className="text-3xl font-black">Related Products</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {product.relatedProducts.map((item) => <ProductCard key={`${item.storeId}-${item.id}`} product={item} storeId={item.storeId} stock={item.stock} />)}
      </div>
    </section>
  );
}
