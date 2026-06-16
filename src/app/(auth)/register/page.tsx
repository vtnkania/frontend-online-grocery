"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, BadgeCheck, Gauge, GitBranch, Leaf, Mail, Ticket } from "lucide-react";
import { registerUser } from "@/services/auth.service";
import { emailOnlySchema } from "@/validations/auth.schema";
import { getErrorMessage } from "@/lib/error-message";
import { startGitHubLogin } from "@/lib/github-oauth";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = emailOnlySchema.safeParse({ email });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message || "Email tidak valid.");
    try {
      setLoading(true);
      setError("");
      await registerUser(parsed.data.email);
      router.push(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Registrasi gagal."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f8ff] text-slate-950">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-emerald-800"><Leaf /> FreshMart</Link>
        <p className="text-sm">Already have an account? <Link className="font-bold text-emerald-800" href="/login">Log in</Link></p>
      </header>
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-8">
          <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm text-emerald-800"><Leaf className="mr-2 size-4" /> Freshly Picked Just For You</span>
          <div>
            <h1 className="max-w-xl text-5xl font-black leading-tight md:text-6xl">Start your <span className="text-emerald-800">fresh</span> journey today.</h1>
            <p className="mt-5 max-w-xl text-xl leading-8 text-slate-700">Join shoppers who get farm-fresh groceries delivered to their doorstep.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoCard icon={<Gauge />} title="Express Delivery" text="Average delivery time is 22 minutes across service areas." />
            <InfoCard icon={<BadgeCheck />} title="Quality Assured" text="Hand-picked items with a freshness guarantee." />
          </div>
        </div>
        <form onSubmit={submit} className="relative rounded-3xl bg-white p-8 shadow-2xl shadow-slate-200">
          <div className="absolute -top-8 left-10 right-10 flex items-center justify-between rounded-2xl bg-emerald-950 px-6 py-4 text-white shadow-xl">
            <div><p className="text-xs font-bold uppercase tracking-widest text-emerald-100">New member reward</p><p className="font-bold">Free $20 Welcome Voucher</p></div>
            <Ticket className="size-8" />
          </div>
          <div className="mt-10">
            <h2 className="text-4xl font-black">Create Account</h2>
            <p className="mt-2 text-slate-600">Fill in your email to receive a verification link.</p>
          </div>
          <label className="mt-8 block text-sm font-semibold">Email Address</label>
          <div className="mt-2 flex h-14 items-center gap-3 rounded-2xl bg-blue-50 px-4 ring-1 ring-blue-100">
            <Mail className="size-5 text-slate-400" />
            <input className="w-full bg-transparent outline-none" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-800" disabled={loading}>
            {loading ? "Sending..." : "Sign Up & Verify"} <ArrowRight className="size-5" />
          </button>
          <div className="my-8 flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400"><span className="h-px flex-1 bg-slate-200" /> Or continue with <span className="h-px flex-1 bg-slate-200" /></div>
          <SocialButton />
          <p className="mt-8 text-center text-xs text-slate-500">By signing up, you agree to our <b>Terms of Service</b> and <b>Privacy Policy</b>.</p>
        </form>
      </section>
    </main>
  );
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-xl border bg-white p-5 shadow-sm">{icon}<h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>;
}

function SocialButton() {
  const [error, setError] = useState("");
  const login = () => {
    try {
      startGitHubLogin("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "GitHub login belum dikonfigurasi.");
    }
  };
  return (
    <div>
      <button type="button" onClick={login} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border bg-slate-50 font-semibold text-slate-700">
        <GitBranch className="size-5" /> Continue with GitHub
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
