"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Camera, CheckCircle2, Eye, Mail, Pencil, Save, ShieldCheck, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { changePassword, requestEmailChange, updateProfile, uploadProfileImage } from "@/services/auth.service";
import { changePasswordSchema, emailOnlySchema, profileSchema } from "@/validations/auth.schema";
import { getErrorMessage } from "@/lib/error-message";
import type { FreshMartUser } from "@/types/user.type";

const allowedTypes = ["image/jpeg", "image/png", "image/gif"];

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState("");
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = profileSchema.safeParse({ name });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message || "Nama tidak valid.");
    await run(async () => setUser(await updateProfile(parsed.data.name)), "Profile updated.");
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!allowedTypes.includes(file.type)) return toast.error("Format foto harus jpg, jpeg, png, atau gif.");
    if (file.size > 1024 * 1024) return toast.error("Ukuran foto maksimal 1MB.");
    await run(async () => setUser(await uploadProfileImage(file)), "Photo updated.");
  };

  const changeEmail = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = emailOnlySchema.safeParse({ email });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message || "Email tidak valid.");
    await run(async () => {
      const result = await requestEmailChange(parsed.data.email);
      setEmail("");
      toast.success(result.message);
      if (result.debugLink) toast.info(result.debugLink);
    }, "");
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = changePasswordSchema.safeParse(passwords);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message || "Password tidak valid.");
    await run(async () => {
      const result = await changePassword(parsed.data.currentPassword, parsed.data.newPassword);
      setPasswords({ currentPassword: "", newPassword: "" });
      toast.success(result.message);
    }, "");
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <ProfileHero user={user} onUpload={upload} />
      <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-slate-950">Personal Information</h2>
          <Pencil className="size-5 text-slate-500" />
        </div>
        <form onSubmit={saveProfile} className="grid gap-5 lg:grid-cols-2">
          <Input label="Full Name" value={name} onChange={setName} />
          <ReadonlyField label="Email Address" value={user.email} verified={user.isVerified} />
          <ReadonlyField label="Account Role" value={user.role.replace("_", " ")} />
          <ReadonlyField label="Joined Date" value={user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : "Not verified yet"} />
          <div className="lg:col-span-2"><button className="h-11 rounded-lg bg-emerald-700 px-5 font-bold text-white hover:bg-emerald-800"><Save className="mr-2 inline size-4" />Save Profile</button></div>
        </form>
      </section>
      <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-6 text-xl font-black text-slate-950">Security & Password</h2>
        <div className="grid gap-6 xl:grid-cols-2">
          <form onSubmit={changeEmail} className="space-y-4"><Input label="New Email Address" value={email} onChange={setEmail} /><button className="h-11 rounded-lg border border-emerald-700 px-5 font-bold text-emerald-800"><Mail className="mr-2 inline size-4" />Send Verification</button></form>
          <form onSubmit={savePassword} className="grid gap-4 sm:grid-cols-2">
            <Input type="password" label="Current Password" value={passwords.currentPassword} onChange={(value) => setPasswords({ ...passwords, currentPassword: value })} />
            <Input type="password" label="New Password" value={passwords.newPassword} onChange={(value) => setPasswords({ ...passwords, newPassword: value })} />
            <button className="h-11 rounded-lg bg-emerald-700 px-5 font-bold text-white hover:bg-emerald-800 sm:col-span-2"><ShieldCheck className="mr-2 inline size-4" />Update Password</button>
          </form>
        </div>
      </section>
    </div>
  );
}

function ProfileHero({ user, onUpload }: { user: FreshMartUser; onUpload: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative size-32 shrink-0">
          {user.profileImageUrl ? <img src={user.profileImageUrl} alt={user.name || user.email} className="size-32 rounded-full border-4 border-blue-100 object-cover" /> : <UserCircle className="size-32 text-slate-300" />}
          <label className="absolute bottom-1 right-1 grid size-10 cursor-pointer place-items-center rounded-full bg-emerald-700 text-white shadow-lg">
            <Camera className="size-5" /><input className="hidden" type="file" accept=".jpg,.jpeg,.png,.gif" onChange={onUpload} />
          </label>
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-950">{user.name || "FreshMart User"}</h1>
          <p className="mt-2 text-lg text-slate-700">Premium Member</p>
          <label className="mt-5 inline-flex cursor-pointer items-center rounded-lg bg-blue-100 px-5 py-3 font-semibold text-slate-950">
            Edit Photo<input className="hidden" type="file" accept=".jpg,.jpeg,.png,.gif" onChange={onUpload} />
          </label>
        </div>
      </div>
    </section>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-bold text-slate-600">{label}<input className="input-admin mt-2 text-base font-normal text-slate-950" type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function ReadonlyField({ label, value, verified }: { label: string; value: string; verified?: boolean }) {
  return (
    <label className="block text-sm font-bold text-slate-600">
      {label}
      <div className="mt-2 flex min-h-12 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 text-base font-semibold text-slate-950">
        <span className="truncate">{value}</span>
        {verified !== undefined && <span className="ml-3 flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">{verified ? <CheckCircle2 className="size-3" /> : <Eye className="size-3" />}{verified ? "VERIFIED" : "PENDING"}</span>}
      </div>
    </label>
  );
}

const run = async (action: () => Promise<void>, fallback: string) => {
  try {
    await action();
    if (fallback) toast.success(fallback);
  } catch (err: unknown) {
    toast.error(getErrorMessage(err, "Proses gagal."));
  }
};

const formatDate = (value: string) => new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
