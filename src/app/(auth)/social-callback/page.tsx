"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { GitBranch, Leaf } from "lucide-react";
import { consumeGitHubState } from "@/lib/github-oauth";
import { loginWithGitHubCode } from "@/services/auth.service";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/error-message";

export default function SocialCallbackPage() {
  return <Suspense><SocialCallbackInner /></Suspense>;
}

function SocialCallbackInner() {
  const params = useSearchParams();
  const router = useRouter();
  const setSession = useAuth((state) => state.setSession);
  const [error, setError] = useState("");

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    const { ok, redirectTo } = consumeGitHubState(state);
    if (!ok || !code) {
      queueMicrotask(() => setError("GitHub login session is invalid. Please try again."));
      return;
    }
    loginWithGitHubCode(code)
      .then((result) => {
        setSession(result.accessToken, result.user);
        router.replace(redirectTo);
      })
      .catch((err: unknown) => setError(getErrorMessage(err, "GitHub login failed.")));
  }, [params, router, setSession]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8ff] px-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
        <Link href="/" className="mx-auto mb-8 flex w-max items-center gap-2 text-2xl font-bold text-emerald-800"><Leaf /> FreshMart</Link>
        <GitBranch className="mx-auto size-14 text-slate-900" />
        <h1 className="mt-5 text-3xl font-black">Connecting GitHub</h1>
        <p className="mt-3 text-slate-600">{error || "Please wait while we finish your login."}</p>
        {error && <Link className="mt-6 inline-block font-bold text-emerald-800" href="/login">Back to login</Link>}
      </section>
    </main>
  );
}
