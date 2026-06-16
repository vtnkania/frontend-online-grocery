"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Leaf, LockKeyhole } from "lucide-react";
import { confirmPasswordReset } from "@/services/auth.service";
import { getErrorMessage } from "@/lib/error-message";

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordInner /></Suspense>;
}

function ResetPasswordInner() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return setError("Token reset password tidak ditemukan.");
    if (password.length < 8) return setError("Password minimal 8 karakter.");
    try {
      setError("");
      const result = await confirmPasswordReset(token, password);
      setMessage(result.message);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Reset password gagal."));
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8ff] px-5">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <Link href="/" className="mb-8 flex items-center gap-2 text-2xl font-bold text-emerald-800"><Leaf /> FreshMart</Link>
        <h1 className="text-3xl font-black">Confirm Reset Password</h1>
        <p className="mt-3 text-slate-600">Create a new password for your FreshMart account.</p>
        <label className="mt-8 block text-sm font-semibold">New Password</label>
        <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border px-4"><LockKeyhole className="size-5 text-slate-400" /><input className="w-full outline-none" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" /></div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
        <button className="mt-6 h-12 w-full rounded-xl bg-emerald-700 font-bold text-white">Update Password</button>
        <Link className="mt-6 block text-center font-semibold text-emerald-800" href="/login">Back to login</Link>
      </form>
    </main>
  );
}
