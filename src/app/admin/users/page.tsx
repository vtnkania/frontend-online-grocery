"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Trash2, UserCog, UserRoundCheck, Users } from "lucide-react";
import { toast } from "sonner";
import AdminMetricCard from "@/components/admin/AdminMetricCard";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmActionDialog from "@/components/admin/ConfirmActionDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { deleteAdminUser, getAdminUsers, updateAdminUserRole, type UserAdminParams } from "@/services/admin/user-admin.service";
import type { AdminMeta, AdminRole, AdminUser, AdminUserStats } from "@/types/admin.type";

const emptyMeta: AdminMeta = { page: 1, limit: 10, total: 0, totalPages: 1 };
const emptyStats: AdminUserStats = { totalUsers: 0, customers: 0, staffAccounts: 0, verifiedUsers: 0 };
const roles: AdminRole[] = ["CUSTOMER", "STORE_ADMIN", "SUPER_ADMIN"];

export default function AdminUsersPage() {
  const currentUser = useAuth((state) => state.user);
  const [filters, setFilters] = useState<UserAdminParams>({ page: 1, limit: 10, role: "all", verified: "all", sortBy: "createdAt", sortOrder: "desc" });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState(emptyMeta);
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);

  useEffect(() => { loadUsers(filters, setUsers, setMeta, setStats, setLoading); }, [filters]);

  return (
    <>
      <AdminPageHeader title="User Management" subtitle="Review users, verification status, and admin access." />
      <section className="space-y-6 p-5">
        <MetricGrid stats={stats} />
        <UserFilters filters={filters} onChange={(name, value) => setFilters((old) => ({ ...old, [name]: value, page: 1 }))} />
        <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <UserTable users={users} currentUserId={currentUser?.id} loading={loading} onDelete={setDeleteTarget} onEditRole={setRoleTarget} />
          <AdminPagination meta={meta} onPageChange={(page) => setFilters((old) => ({ ...old, page }))} />
        </div>
      </section>
      <RoleDialog user={roleTarget} onClose={() => setRoleTarget(null)} onSaved={() => refresh(setFilters)} />
      <ConfirmActionDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)} title="Delete user?" description={`This will soft delete ${deleteTarget?.email ?? "this user"}.`} confirmText="Delete" onConfirm={() => deleteTarget && removeUser(deleteTarget, setDeleteTarget, setFilters)} />
    </>
  );
}

function MetricGrid({ stats }: { stats: AdminUserStats }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <AdminMetricCard title="Total Users" value={stats.totalUsers.toLocaleString("id-ID")} note="Active non-deleted accounts" icon={Users} />
      <AdminMetricCard title="Customers" value={stats.customers.toLocaleString("id-ID")} note="Role CUSTOMER" icon={UserRoundCheck} tone="blue" />
      <AdminMetricCard title="Staff Accounts" value={stats.staffAccounts.toLocaleString("id-ID")} note="Store and super admins" icon={UserCog} tone="dark" />
      <AdminMetricCard title="Verified Users" value={stats.verifiedUsers.toLocaleString("id-ID")} note="Email verification complete" icon={ShieldCheck} />
    </div>
  );
}

function UserFilters({ filters, onChange }: { filters: UserAdminParams; onChange: (name: keyof UserAdminParams, value: string) => void }) {
  return (
    <div className="grid gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-[1fr_180px_180px_180px]">
      <input className="input-admin" placeholder="Search name or email..." value={filters.search ?? ""} onChange={(e) => onChange("search", e.target.value)} />
      <select className="input-admin" value={filters.role ?? "all"} onChange={(e) => onChange("role", e.target.value)}>
        <option value="all">All Roles</option>{roles.map((role) => <option value={role} key={role}>{roleLabel(role)}</option>)}
      </select>
      <select className="input-admin" value={filters.verified ?? "all"} onChange={(e) => onChange("verified", e.target.value)}>
        <option value="all">All Status</option><option value="verified">Verified</option><option value="unverified">Unverified</option>
      </select>
      <select className="input-admin" value={`${filters.sortBy}:${filters.sortOrder}`} onChange={(e) => applySort(e.target.value, onChange)}>
        <option value="createdAt:desc">Newest first</option><option value="createdAt:asc">Oldest first</option>
        <option value="name:asc">Name A-Z</option><option value="email:asc">Email A-Z</option><option value="role:asc">Role A-Z</option>
      </select>
    </div>
  );
}

function UserTable({ users, currentUserId, loading, onDelete, onEditRole }: { users: AdminUser[]; currentUserId?: string; loading: boolean; onDelete: (user: AdminUser) => void; onEditRole: (user: AdminUser) => void }) {
  if (loading) return <p className="p-6 text-sm text-slate-500">Loading users...</p>;
  if (!users.length) return <p className="p-6 text-sm text-slate-500">No users found.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] text-left">
        <thead className="bg-blue-50 text-xs uppercase tracking-[0.2em] text-slate-700"><tr><th className="px-5 py-4">User</th><th>Role</th><th>Verified</th><th>Joined</th><th className="px-5">Actions</th></tr></thead>
        <tbody>{users.map((user) => <UserRow user={user} isSelf={user.id === currentUserId} onDelete={onDelete} onEditRole={onEditRole} key={user.id} />)}</tbody>
      </table>
    </div>
  );
}

function UserRow({ user, isSelf, onDelete, onEditRole }: { user: AdminUser; isSelf: boolean; onDelete: (user: AdminUser) => void; onEditRole: (user: AdminUser) => void }) {
  return (
    <tr className="border-t border-slate-100">
      <td className="px-5 py-5"><div className="flex items-center gap-4"><Avatar user={user} /><div><p className="font-black">{user.name || "FreshMart User"}</p><p className="text-sm text-slate-500">{user.email}</p></div></div></td>
      <td><RoleBadge role={user.role} /></td>
      <td><span className={cn("rounded-full px-3 py-1 text-xs font-bold", user.isVerified ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700")}>{user.isVerified ? "Verified" : "Unverified"}</span></td>
      <td className="text-slate-700">{new Date(user.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</td>
      <td className="px-5"><div className="flex gap-2"><Button variant="outline" size="sm" disabled={isSelf} onClick={() => onEditRole(user)}>Edit Role</Button><Button variant="destructive" size="icon-sm" disabled={isSelf} onClick={() => onDelete(user)}><Trash2 /></Button></div></td>
    </tr>
  );
}

function RoleDialog({ user, onClose, onSaved }: { user: AdminUser | null; onClose: () => void; onSaved: () => void }) {
  if (!user) return null;
  return <RoleDialogContent user={user} onClose={onClose} onSaved={onSaved} key={user.id} />;
}

function RoleDialogContent({ user, onClose, onSaved }: { user: AdminUser; onClose: () => void; onSaved: () => void }) {
  const [role, setRole] = useState<AdminRole>(user.role);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit user role</DialogTitle><DialogDescription>Change access level for {user?.email}.</DialogDescription></DialogHeader>
        <select className="input-admin" value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>{roles.map((item) => <option value={item} key={item}>{roleLabel(item)}</option>)}</select>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button className="bg-emerald-700" onClick={() => saveRole(user.id, role, onClose, onSaved)}>Save Role</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Avatar({ user }: { user: AdminUser }) {
  if (user.profileImageUrl) return <img src={user.profileImageUrl} alt={user.name || user.email} className="size-12 rounded-full object-cover" />;
  return <div className="grid size-12 place-items-center rounded-full bg-emerald-100 font-black text-emerald-800">{(user.name || user.email).slice(0, 1).toUpperCase()}</div>;
}

function RoleBadge({ role }: { role: AdminRole }) {
  const tone = role === "SUPER_ADMIN" ? "bg-slate-900 text-white" : role === "STORE_ADMIN" ? "bg-blue-100 text-slate-900" : "bg-emerald-100 text-emerald-800";
  return <span className={cn("rounded-full px-3 py-1 text-xs font-bold", tone)}>{roleLabel(role)}</span>;
}

const roleLabel = (role: AdminRole) => role.replace("_", " ");
const applySort = (value: string, onChange: (name: keyof UserAdminParams, value: string) => void) => { const [sortBy, sortOrder] = value.split(":"); onChange("sortBy", sortBy); onChange("sortOrder", sortOrder); };
const refresh = (setFilters: React.Dispatch<React.SetStateAction<UserAdminParams>>) => setFilters((old) => ({ ...old }));
const loadUsers = (filters: UserAdminParams, setUsers: (value: AdminUser[]) => void, setMeta: (value: AdminMeta) => void, setStats: (value: AdminUserStats) => void, setLoading: (value: boolean) => void) => {
  setLoading(true);
  getAdminUsers(filters).then((result) => { setUsers(result.data); setMeta(result.meta); setStats(result.stats); }).catch(() => toast.error("Failed to load users.")).finally(() => setLoading(false));
};
const saveRole = (id: string, role: AdminRole, close: () => void, onSaved: () => void) => {
  updateAdminUserRole(id, role).then(() => { toast.success("User role updated."); close(); onSaved(); }).catch(() => toast.error("Failed to update role."));
};
const removeUser = (user: AdminUser, close: (value: null) => void, setFilters: React.Dispatch<React.SetStateAction<UserAdminParams>>) => {
  deleteAdminUser(user.id).then(() => { toast.success("User deleted."); close(null); refresh(setFilters); }).catch(() => toast.error("Failed to delete user."));
};
