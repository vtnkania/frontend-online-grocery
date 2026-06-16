"use client";

import { type Dispatch, type FormEvent, type ReactNode, type SetStateAction, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createAdminProduct, getAdminProductOptions, updateAdminProduct } from "@/services/admin/product-admin.service";
import type { AdminOptions, AdminProduct } from "@/types/admin.type";

type FormState = { name: string; categoryId: string; description: string; price: string; isActive: boolean };
const initialState: FormState = { name: "", categoryId: "", description: "", price: "", isActive: true };
const emptyOptions: AdminOptions = { categories: [], stores: [] };

export default function ProductForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const [form, setForm] = useState(productToState(product));
  const [files, setFiles] = useState<File[]>([]);
  const [options, setOptions] = useState(emptyOptions);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getAdminProductOptions().then(setOptions).catch(() => setOptions(emptyOptions)); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const error = validateForm(form, files, Boolean(product));
    if (error) return toast.error(error);
    setSaving(true);
    saveProduct(product?.id, buildFormData(form, files)).then(() => router.push("/admin/products")).catch(() => toast.error("Failed to save product.")).finally(() => setSaving(false));
  };

  return (
    <form onSubmit={submit} className="grid gap-5 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:grid-cols-2">
      <Field label="Product Name"><input value={form.name} onChange={(e) => setField(setForm, "name", e.target.value)} className="input-admin" placeholder="Organic Honeycrisp Apples" /></Field>
      <Field label="Category"><select value={form.categoryId} onChange={(e) => setField(setForm, "categoryId", e.target.value)} className="input-admin"><option value="">Choose category</option>{options.categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></Field>
      <Field label="Price"><input value={form.price} onChange={(e) => setField(setForm, "price", e.target.value)} className="input-admin" inputMode="decimal" placeholder="45000" /></Field>
      <Field label="Status"><select value={String(form.isActive)} onChange={(e) => setField(setForm, "isActive", e.target.value === "true")} className="input-admin"><option value="true">Active</option><option value="false">Inactive</option></select></Field>
      <Field label="Description"><textarea value={form.description} onChange={(e) => setField(setForm, "description", e.target.value)} className="input-admin min-h-28" placeholder="Short product description" /></Field>
      <Field label="Product Photos"><FileInput files={files} onChange={setFiles} required={!product} /></Field>
      <div className="lg:col-span-2"><Button disabled={saving} className="bg-emerald-700"><Save /> {saving ? "Saving..." : "Save Product"}</Button></div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-2 text-sm font-bold text-slate-700">{label}{children}</label>;
}

function FileInput({ files, required, onChange }: { files: File[]; required: boolean; onChange: (files: File[]) => void }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-5">
      <UploadCloud className="mb-3 size-8 text-emerald-700" />
      <input type="file" multiple accept=".jpg,.jpeg,.png,.gif" required={required} onChange={(e) => onChange(Array.from(e.target.files ?? []))} />
      <p className="mt-2 text-xs font-normal text-slate-500">JPG, JPEG, PNG, GIF. Max 1MB per file.</p>
      {!!files.length && <p className="mt-2 text-xs text-emerald-700">{files.length} file(s) selected.</p>}
    </div>
  );
}

const productToState = (product?: AdminProduct): FormState => product ? {
  name: product.name,
  categoryId: product.category.id,
  description: product.description ?? "",
  price: product.price,
  isActive: product.isActive,
} : initialState;

const setField = <K extends keyof FormState>(setForm: Dispatch<SetStateAction<FormState>>, key: K, value: FormState[K]) => {
  setForm((old) => ({ ...old, [key]: value }));
};

const validateForm = (form: FormState, files: File[], editing: boolean) => {
  if (form.name.trim().length < 2) return "Product name must be at least 2 characters.";
  if (!form.categoryId) return "Category is required.";
  if (!Number(form.price) || Number(form.price) <= 0) return "Price must be greater than zero.";
  if (!editing && !files.length) return "At least one product photo is required.";
  return files.map(validateFile).find(Boolean);
};

const validateFile = (file: File) => {
  const ok = /\.(jpe?g|png|gif)$/i.test(file.name);
  if (!ok) return "Only jpg, jpeg, png, and gif files are allowed.";
  if (file.size > 1024 * 1024) return "Each image must be 1MB or less.";
  return "";
};

const buildFormData = (form: FormState, files: File[]) => {
  const data = new FormData();
  Object.entries(form).forEach(([key, value]) => data.append(key, String(value)));
  files.forEach((file) => data.append("images", file));
  return data;
};

const saveProduct = (id: string | undefined, data: FormData) => id ? updateAdminProduct(id, data) : createAdminProduct(data);
