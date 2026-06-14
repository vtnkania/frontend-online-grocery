"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Leaf, Mail } from "lucide-react";
import { requestPasswordReset } from "@/services/auth.service";
import { emailOnlySchema } from "@/validations/auth.schema";
import { getErrorMessage } from "@/lib/error-message";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = emailOnlySchema.safeParse({ email });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message || "Email tidak valid.");
    try {
      setError("");
      const result = await requestPasswordReset(parsed.data.email);
      setMessage(result.debugLink ? `${result.message} Dev link: ${result.debugLink}` : result.message);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal mengirim reset password."));
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8ff] px-5">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <Link href="/" className="mb-8 flex items-center gap-2 text-2xl font-bold text-emerald-800"><Leaf /> FreshMart</Link>
        <h1 className="text-3xl font-black">Reset Password</h1>
        <p className="mt-3 text-slate-600">Enter your email and we will send a reset password link.</p>
        <label className="mt-8 block text-sm font-semibold">Email Address</label>
        <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border px-4"><Mail className="size-5 text-slate-400" /><input className="w-full outline-none" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" /></div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-3 break-all text-sm text-emerald-700">{message}</p>}
        <button className="mt-6 h-12 w-full rounded-xl bg-emerald-700 font-bold text-white">Send Reset Link</button>
        <Link className="mt-6 block text-center font-semibold text-emerald-800" href="/login">Back to login</Link>
      </form>
    </main>
  );
}
