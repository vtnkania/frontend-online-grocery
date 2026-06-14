"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Camera, CheckCircle2, KeyRound, Mail, Save, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { changePassword, requestEmailChange, updateProfile, uploadProfileImage } from "@/services/auth.service";
import { changePasswordSchema, emailOnlySchema, profileSchema } from "@/validations/auth.schema";
import { getErrorMessage } from "@/lib/error-message";

const allowedTypes = ["image/jpeg", "image/png", "image/gif"];

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState("");
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = profileSchema.safeParse({ name });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message || "Nama tidak valid.");
    await run(async () => setUser(await updateProfile(parsed.data.name)));
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!allowedTypes.includes(file.type)) return setError("Format foto harus jpg, jpeg, png, atau gif.");
    if (file.size > 1024 * 1024) return setError("Ukuran foto maksimal 1MB.");
    await run(async () => setUser(await uploadProfileImage(file)));
  };

  const changeEmail = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = emailOnlySchema.safeParse({ email });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message || "Email tidak valid.");
    await run(async () => {
      const result = await requestEmailChange(parsed.data.email);
      setMessage(result.debugLink ? `${result.message} Dev link: ${result.debugLink}` : result.message);
    });
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = changePasswordSchema.safeParse(passwords);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message || "Password tidak valid.");
    await run(async () => {
      const result = await changePassword(parsed.data.currentPassword, parsed.data.newPassword);
      setPasswords({ currentPassword: "", newPassword: "" });
      setMessage(result.message);
    });
  };

  const run = async (action: () => Promise<void>) => {
    try {
      setError("");
      setMessage("Perubahan berhasil diproses.");
      await action();
    } catch (err: unknown) {
      setMessage("");
      setError(getErrorMessage(err, "Proses gagal."));
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-950">My Profile</h1>
        <p className="mt-2 text-slate-600">Manage your FreshMart account, password, email, and profile photo.</p>
      </div>
      {(message || error) && <p className={`mb-5 rounded-xl px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{error || message}</p>}
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="grid place-items-center text-center">
            {user?.profileImageUrl ? <img src={user.profileImageUrl} alt="Profile" className="size-32 rounded-full object-cover" /> : <UserCircle className="size-32 text-slate-300" />}
            <label className="mt-5 flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white">
              <Camera className="size-4" /> Upload Photo
              <input className="hidden" type="file" accept=".jpg,.jpeg,.png,.gif" onChange={upload} />
            </label>
            <p className="mt-3 text-xs text-slate-500">JPG, JPEG, PNG, or GIF. Max 1MB.</p>
          </div>
          <div className="mt-8 space-y-3 text-sm">
            <p className="font-semibold">{user?.name || "FreshMart User"}</p>
            <p className="text-slate-600">{user?.email}</p>
            <p className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="size-4" /> {user?.isVerified ? "Verified account" : "Not verified"}</p>
          </div>
        </div>
        <div className="space-y-6">
          <Panel title="Personal Data" icon={<Save />}>
            <form onSubmit={saveProfile} className="space-y-4"><Input label="Full Name" value={name} onChange={setName} /><button className="h-11 rounded-xl bg-emerald-700 px-5 font-bold text-white">Save Profile</button></form>
          </Panel>
          <Panel title="Change Email" icon={<Mail />}>
            <form onSubmit={changeEmail} className="space-y-4"><Input label="New Email" value={email} onChange={setEmail} /><button className="h-11 rounded-xl bg-emerald-700 px-5 font-bold text-white">Send Verification</button></form>
          </Panel>
          <Panel title="Change Password" icon={<KeyRound />}>
            <form onSubmit={savePassword} className="grid gap-4 sm:grid-cols-2"><Input type="password" label="Current Password" value={passwords.currentPassword} onChange={(value) => setPasswords({ ...passwords, currentPassword: value })} /><Input type="password" label="New Password" value={passwords.newPassword} onChange={(value) => setPasswords({ ...passwords, newPassword: value })} /><button className="h-11 rounded-xl bg-emerald-700 px-5 font-bold text-white sm:col-span-2">Update Password</button></form>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-950">{icon}{title}</h2>{children}</section>;
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-semibold">{label}<input className="mt-2 h-11 w-full rounded-xl border px-4 font-normal outline-none focus:ring-2 focus:ring-emerald-200" type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
