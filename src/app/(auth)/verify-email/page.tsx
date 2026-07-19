"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { ArrowLeft, Leaf, MailCheck, Send } from "lucide-react";
import { resendVerification, verifyEmail, verifyEmailChange } from "@/services/auth.service";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/hooks/useAuth";

export default function VerifyEmailPage() {
  return <Suspense><VerifyEmailInner /></Suspense>;
}

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const mode = params.get("mode");
  const email = params.get("email") || "";
  if (token && mode === "email-change") return <EmailChange token={token} />;
  if (token) return <SetPassword token={token} />;
  return <CheckEmail email={email} />;
}

function CheckEmail({ email }: { email: string }) {
  const [message, setMessage] = useState("");
  const resend = async () => {
    if (!email) return setMessage("Email tidak ditemukan di URL.");
    const result = await resendVerification(email);
    setMessage(result.debugLink ? `${result.message} Dev link: ${result.debugLink}` : result.message);
  };
  return <Shell title="Check your email" text={email ? `We sent a verification link to ${email}.` : "Open the verification link from your email."}><button onClick={resend} className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 font-bold text-white"><Send className="size-5" /> Resend Email</button>{message && <p className="mt-4 break-all text-sm text-emerald-700">{message}</p>}<BackLogin /></Shell>;
}

function SetPassword({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [message, setMessage] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 8) return setMessage("Password minimal 8 karakter.");
    await verifyEmail(token, password).then((res) => {
      toast.success(res.message);
      router.push("/login");
    });
  };
  return <Shell title="Verify and set password" text="Create your password to activate your FreshMart account."><form onSubmit={submit} className="space-y-4"><input className="h-12 w-full rounded-xl border px-4" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" /><button className="h-12 w-full rounded-xl bg-emerald-700 font-bold text-white">Activate Account</button></form>{message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}<BackLogin /></Shell>;
}

function EmailChange({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { logout } = useAuth();
  const confirm = async () => {
    await verifyEmailChange(token).then((res) => {
      toast.success(res.message);
      logout();
      router.push("/login");
    });
  };
  return <Shell title="Confirm new email" text="Finish your email change request for FreshMart."><button onClick={confirm} className="h-12 w-full rounded-xl bg-emerald-700 font-bold text-white">Confirm Email Change</button>{message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}<BackLogin /></Shell>;
}

function Shell({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f6f8ff]">
      <header className="flex items-center justify-between border-b bg-white px-5 py-5"><Link href="/" className="flex items-center gap-2 text-2xl font-bold text-emerald-800"><Leaf /> FreshMart</Link><div className="hidden gap-8 text-sm md:flex"><Link href="/">Help</Link><Link href="/">Contact Support</Link></div></header>
      <section className="grid min-h-[68vh] place-items-center px-5 py-16">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-100">
          <div className="mx-auto grid size-36 place-items-center rounded-full bg-emerald-100 text-emerald-800"><MailCheck className="size-20" /></div>
          <h1 className="mt-8 text-4xl font-black">{title}</h1>
          <p className="mx-auto mt-4 max-w-sm text-lg leading-8 text-slate-600">{text}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}

function BackLogin() {
  return <Link href="/login" className="mt-6 flex items-center justify-center gap-2 border-t pt-6 font-semibold text-emerald-800"><ArrowLeft className="size-5" /> Go to Login</Link>;
}
