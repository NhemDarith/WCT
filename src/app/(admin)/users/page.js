"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";

// React Icons
import { HiOutlineRefresh, HiOutlineSearch, HiOutlineUsers } from "react-icons/hi";

export default function UsersPage() {
    const TABLE = "users";

    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState("all"); // all | admin | owner | user

    // ===== Stats =====
    const stats = useMemo(() => {
        const total = rows.length;
        const admins = rows.filter((r) => String(r.role || "").toLowerCase() === "admin").length;
        const owners = rows.filter((r) => String(r.role || "").toLowerCase() === "owner").length;
        const users = rows.filter((r) => String(r.role || "").toLowerCase() === "user").length;
        return { total, admins, owners, users };
    }, [rows]);

    // ===== Filter =====
    const filtered = useMemo(() => {
        let list = rows;

        if (tab !== "all") {
            list = list.filter((r) => String(r.role || "").toLowerCase() === tab);
        }

        const q = search.trim().toLowerCase();
        if (!q) return list;

        return list.filter((u) => {
            const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim().toLowerCase();
            return (
                String(u.email || "").toLowerCase().includes(q) ||
                fullName.includes(q) ||
                String(u.role || "").toLowerCase().includes(q) ||
                String(u.phone_number || "").toLowerCase().includes(q)
            );
        });
    }, [rows, tab, search]);

    // ===== Load =====
    async function load() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from(TABLE)
                .select("id,email,first_name,last_name,role,phone_number,created_at")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setRows(data || []);
        } catch (e) {
            // Replaced basic alert with SweetAlert2
            Swal.fire({
                title: 'Error!',
                text: e?.message || "Failed to load users.",
                icon: 'error',
                confirmButtonColor: '#0284c7' // Matches your sky-600 theme
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="space-y-6 p-4 md:p-8">
            {/* ===== Header ===== */}
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        All Users
                    </h1>
                </div>

                <button
                    onClick={load}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                >
                    <HiOutlineRefresh className={`${loading ? 'animate-spin' : ''}`} size={18} />
                    Refresh
                </button>
            </div>

            {/* ===== Stats ===== */}
            <div className="grid gap-4 md:grid-cols-4">
                <KpiCard title="Total Users" value={stats.total} />
                <KpiCard title="Admins" value={stats.admins} />
                <KpiCard title="Owners" value={stats.owners} />
                <KpiCard title="Users" value={stats.users} />
            </div>

            {/* ===== Controls ===== */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                {/* Tabs */}
                <div className="inline-flex rounded-xl border border-slate-200 overflow-hidden bg-white">
                    <TabButton active={tab === "all"} onClick={() => setTab("all")}>
                        All ({stats.total})
                    </TabButton>
                    <TabButton active={tab === "admin"} onClick={() => setTab("admin")}>
                        Admin ({stats.admins})
                    </TabButton>
                    <TabButton active={tab === "owner"} onClick={() => setTab("owner")}>
                        Owner ({stats.owners})
                    </TabButton>
                    <TabButton active={tab === "user"} onClick={() => setTab("user")}>
                        User ({stats.users})
                    </TabButton>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 w-full md:w-[420px]">
                    <HiOutlineSearch size={20} className="text-slate-400" />
                    <input
                        className="w-full outline-none text-sm text-slate-900 placeholder:text-slate-400"
                        placeholder="Search name, email, role, phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        disabled={loading}
                    />
                </div>
            </div>

            {/* ===== Table ===== */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <HiOutlineUsers size={18} />
                        Users
                        <span className="ml-1 text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                            {filtered.length}
                        </span>
                    </div>
                    <div className="text-xs text-slate-500">
                        {loading ? "Loading..." : "Ready"}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-xs text-slate-500 border-b border-slate-200">
                                <th className="text-left font-semibold px-4 py-3 w-[260px]">Name</th>
                                <th className="text-left font-semibold px-4 py-3">Email</th>
                                <th className="text-left font-semibold px-4 py-3 w-[160px]">Phone</th>
                                <th className="text-left font-semibold px-4 py-3 w-[120px]">Role</th>
                                <th className="text-left font-semibold px-4 py-3 w-[140px]">Created</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-600">
                                        {loading ? "Loading..." : "No users found."}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((u) => {
                                    const name = `${u.first_name || ""} ${u.last_name || ""}`.trim() || "—";
                                    const created = u.created_at
                                        ? new Date(u.created_at).toISOString().slice(0, 10)
                                        : "—";

                                    return (
                                        <tr key={u.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-semibold text-slate-900">
                                                {name}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">
                                                {u.email || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">
                                                {u.phone_number || "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <RolePill role={String(u.role || "user").toLowerCase()} />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {created}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ==== Sub components ====
function KpiCard({ title, value }) {
    return (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <div className="text-sm text-slate-500">{title}</div>
            <div className="text-3xl font-bold mt-2 text-slate-900">{value}</div>
        </div>
    );
}

function TabButton({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={[
                "px-4 py-2 text-sm font-semibold transition",
                active
                    ? "bg-sky-600 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-50",
            ].join(" ")}
            type="button"
        >
            {children}
        </button>
    );
}

function RolePill({ role }) {
    const cls =
        role === "admin"
            ? "bg-purple-100 text-purple-700"
            : role === "owner"
                ? "bg-sky-100 text-sky-700"
                : "bg-slate-100 text-slate-700";

    return (
        <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${cls}`}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
    );
}