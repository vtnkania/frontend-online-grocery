"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { GitBranch, Leaf, Mail, LockKeyhole } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema } from "@/validations/auth.schema";
import { getErrorMessage } from "@/lib/error-message";
import { startGitHubLogin } from "@/lib/github-oauth";

export default function LoginPage() {
  return <Suspense><LoginInner /></Suspense>;
}

function LoginInner() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuth((state) => state.login);
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message || "Input tidak valid.");
    try {
      setLoading(true);
      setError("");
      const user = await login(parsed.data.email, parsed.data.password);
      const admin = user.role === "SUPER_ADMIN" || user.role === "STORE_ADMIN";
      router.push(admin ? "/admin/dashboard" : redirectTo);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Login gagal."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="flex items-center justify-center px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-md">
          <Link href="/" className="mb-16 flex items-center gap-3 text-3xl font-bold text-emerald-800"><Leaf /> FreshMart</Link>
          <h1 className="text-4xl font-black">Welcome Back</h1>
          <p className="mt-3 text-xl leading-8 text-slate-600">Experience fresh groceries delivered to your doorstep. Sign in to your account.</p>
          <Field icon={<Mail />} label="Email Address" value={form.email} onChange={(email) => setForm({ ...form, email })} placeholder="name@example.com" />
          <div className="mt-5 flex items-center justify-between"><label className="text-sm font-semibold">Password</label><Link className="text-sm font-semibold text-emerald-800" href="/forgot-password">Forgot password?</Link></div>
          <Field icon={<LockKeyhole />} type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} placeholder="••••••••" />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <label className="mt-5 flex items-center gap-3 text-sm text-slate-700"><input type="checkbox" className="size-4" /> Remember me for 30 days</label>
          <button disabled={loading} className="mt-5 h-14 w-full rounded-xl bg-emerald-700 font-bold text-white hover:bg-emerald-800">{loading ? "Signing in..." : "Login"}</button>
          <div className="my-8 flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400"><span className="h-px flex-1 bg-slate-200" /> Or continue with <span className="h-px flex-1 bg-slate-200" /></div>
          <Social redirectTo={redirectTo} />
          <p className="mt-10 text-center">Don&apos;t have an account? <Link className="font-bold text-emerald-800" href="/register">Sign up for free</Link></p>
        </form>
      </section>
      <section className="relative hidden overflow-hidden bg-slate-900 lg:block">
        <img className="h-full w-full object-cover opacity-80" alt="Fresh vegetables" src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80" />
        <div className="absolute bottom-14 left-14 rounded-3xl bg-white/90 p-8 shadow-2xl backdrop-blur">
          <p className="font-bold uppercase tracking-widest text-emerald-800">Sustainable Choice</p>
          <h2 className="mt-4 max-w-sm text-3xl font-black">Farmer-to-Fork: The Freshest Experience.</h2>
        </div>
      </section>
    </main>
  );
}

function Field(props: { icon: React.ReactNode; label?: string; type?: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return <label className="mt-6 block">{props.label && <span className="mb-2 block text-sm font-semibold">{props.label}</span>}<span className="flex h-14 items-center gap-3 rounded-xl border px-4"><span className="text-slate-400">{props.icon}</span><input className="w-full outline-none" type={props.type || "text"} value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder={props.placeholder} /></span></label>;
}

function Social({ redirectTo }: { redirectTo: string }) {
  const [error, setError] = useState("");
  const login = () => {
    try {
      startGitHubLogin(redirectTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "GitHub login belum dikonfigurasi.");
    }
  };
  return (
    <div>
      <button type="button" onClick={login} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border font-semibold">
        <GitBranch className="size-5" /> Continue with GitHub
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
