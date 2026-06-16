"use client";

import { UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AdminTopbar() {
  const user = useAuth((state) => state.user);
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-end border-b border-slate-200 bg-[#f6f8fd]/95 px-5 backdrop-blur">
      {user?.profileImageUrl ? (
        <img className="size-10 rounded-full border-2 border-emerald-500 object-cover" src={user.profileImageUrl} alt={user.name ?? user.email} />
      ) : (
        <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
          <UserCircle className="size-7" />
        </div>
      )}
    </header>
  );
}
