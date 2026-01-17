"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

// SweetAlert
import Swal from "sweetalert2";

// lucide-react icons
import {
  Search,
  Eye,
  ExternalLink,
  RefreshCw,
  X,
  CheckCircle2,
  XCircle,
  Phone,
  MapPin,
  Clock,
  BadgeCheck,
} from "lucide-react";

// React Icons
import { MdCheckCircle, MdCancel, MdRefresh } from "react-icons/md";

export default function StoreValidationPage() {
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all"); // all | pending | approved
  const [loading, setLoading] = useState(false);

  // Selected store for drawer
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchStores();
  }, []);

  // Fetch stores from Supabase
  async function fetchStores() {
    setLoading(true);
    const { data, error } = await supabase
      .from("stores")
      .select(
        "id,name,logo_url,address,created_at,validated,phone_number,start_time,close_time,slug,license_url,pharmacy_license"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchStores error:", error.message);
      setStores([]);
      setLoading(false);
      return;
    }

    setStores(data || []);
    setLoading(false);
  }

  async function setValidated(id, nextValue) {
    setLoading(true);
    const { error } = await supabase
      .from("stores")
      .update({ validated: nextValue })
      .eq("id", id);

    if (error) {
      console.error("setValidated error:", error.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not update store status",
        timer: 3000,
      });
      setLoading(false);
      return;
    }

    await fetchStores();
    setSelected((prev) => {
      if (!prev) return prev;
      if (String(prev.id) !== String(id)) return prev;
      return { ...prev, validated: nextValue };
    });

    setLoading(false);
  }

  const openInNewTab = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const stats = useMemo(() => {
    const total = stores.length;
    const approved = stores.filter((s) => s.validated === true).length;
    const pending = stores.filter((s) => s.validated === false).length;
    return { total, approved, pending };
  }, [stores]);

  const filteredStores = useMemo(() => {
    let list = stores;

    if (tab === "pending") list = list.filter((s) => s.validated === false);
    if (tab === "approved") list = list.filter((s) => s.validated === true);

    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter((s) => {
      const name = String(s.name || "").toLowerCase();
      const phone = String(s.phone_number || "").toLowerCase();
      const address = String(s.address || "").toLowerCase();
      const slug = String(s.slug || "").toLowerCase();
      return name.includes(q) || phone.includes(q) || address.includes(q) || slug.includes(q);
    });
  }, [stores, tab, search]);

  async function handleApproveOrRevoke(store, shouldApprove) {
    const isApprove = shouldApprove;
    const title = isApprove ? "Approve this store?" : "Revoke validation?";
    const text = isApprove
      ? "This will mark the store as validated."
      : "This will set the store back to pending status.";

      // Confirmation dialog
    const result = await Swal.fire({
      title,
      text,
      icon: isApprove ? "question" : "warning",
      showCancelButton: true,
      confirmButtonColor: isApprove ? "#10b981" : "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: isApprove ? "Yes, approve" : "Yes, revoke",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    await setValidated(store.id, isApprove);

    Swal.fire({
      title: isApprove ? "Approved!" : "Revoked!",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
    });
  }

  const Drawer = selected ? (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={() => setSelected(null)}
      />
      <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[520px] bg-white border-l border-slate-200 shadow-xl">
        <div className="h-full flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Store Details
              </div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {selected.name || "—"}
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50"
              title="Close"
            >
              <X size={18} className="text-slate-700" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden grid place-items-center shrink-0">
                  {selected.logo_url ? (
                    <Image
                      src={selected.logo_url}
                      alt={selected.name || "Store logo"}
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-xs font-bold text-slate-400">N/A</span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusPill validated={selected.validated} />
                    <span className="text-xs text-slate-500">
                      ID: {selected.id}
                    </span>
                  </div>

                  <div className="text-sm text-slate-700 mt-2 space-y-2">
                    <InfoRow icon={<Phone size={16} />} label="Phone" value={selected.phone_number || "—"} />
                    <InfoRow icon={<MapPin size={16} />} label="Address" value={selected.address || "—"} />
                    <InfoRow
                      icon={<Clock size={16} />}
                      label="Hours"
                      value={`${selected.start_time || "—"} – ${selected.close_time || "—"}`}
                    />
                    <InfoRow
                      icon={<BadgeCheck size={16} />}
                      label="Created"
                      value={selected.created_at ? new Date(selected.created_at).toISOString().slice(0, 10) : "—"}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-bold text-slate-900">Documents</div>
              <div className="mt-3 grid gap-2">
                <DocButton
                  title="Business License"
                  url={selected.license_url}
                  onOpen={openInNewTab}
                />
                <DocButton
                  title="Pharmacy License"
                  url={selected.pharmacy_license}
                  onOpen={openInNewTab}
                />
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-slate-200 bg-white flex items-center justify-end gap-2">
            {selected.validated ? (
              <button
                onClick={() => handleApproveOrRevoke(selected, false)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                <XCircle size={16} />
                Revoke
              </button>
            ) : (
              <button
                onClick={() => handleApproveOrRevoke(selected, true)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                Approve
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Store Validation
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Validate and manage stores.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search name, phone, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>

          <button
            onClick={fetchStores}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI + Filters */}
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard title="Pending" value={stats.pending} hint="Need review" />
        <KpiCard title="Validated" value={stats.approved} hint="Approved stores" />
        <KpiCard title="Total Stores" value={stats.total} hint="All records" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip active={tab === "all"} onClick={() => setTab("all")}>
            All <span className="ml-2 text-xs font-bold text-slate-600">{stats.total}</span>
          </Chip>
          <Chip active={tab === "pending"} onClick={() => setTab("pending")}>
            Pending <span className="ml-2 text-xs font-bold text-amber-700">{stats.pending}</span>
          </Chip>
          <Chip active={tab === "approved"} onClick={() => setTab("approved")}>
            Validated <span className="ml-2 text-xs font-bold text-emerald-700">{stats.approved}</span>
          </Chip>
        </div>

        <div className="text-xs text-slate-500">
          {loading ? "Loading..." : "Ready"} • Showing {filteredStores.length}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="px-5 py-3 text-left font-semibold w-[340px]">Store</th>
                <th className="px-5 py-3 text-left font-semibold w-[150px]">Contact</th>
                <th className="px-5 py-3 text-left font-semibold w-[170px]">Hours</th>
                <th className="px-5 py-3 text-left font-semibold w-[140px]">License</th>
                <th className="px-5 py-3 text-left font-semibold w-[170px]">Pharmacy License</th>
                <th className="px-5 py-3 text-center font-semibold w-[120px]">Status</th>
                <th className="px-5 py-3 text-center font-semibold w-[150px]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    {loading ? "Loading..." : "No stores found"}
                  </td>
                </tr>
              ) : (
                filteredStores.map((store) => (
                  <tr key={store.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden grid place-items-center shrink-0">
                          {store.logo_url ? (
                            <Image
                              src={store.logo_url}
                              alt={store.name || "Store logo"}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-400">N/A</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-slate-900 font-semibold truncate">
                            {store.name || "—"}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {store.address || "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {store.phone_number || "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {store.start_time || "—"} – {store.close_time || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <DocMiniButton url={store.license_url} onOpen={openInNewTab} />
                    </td>

                    <td className="px-5 py-4">
                      <DocMiniButton url={store.pharmacy_license} onOpen={openInNewTab} />
                    </td>

                    <td className="px-5 py-4 text-center">
                      <StatusPill validated={store.validated} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelected(store)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                          title="View details"
                        >
                          <Eye size={16} />
                          Details
                        </button>

                        {!store.validated ? (
                          <button
                            onClick={() => handleApproveOrRevoke(store, true)}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckCircle2 size={16} />
                            Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApproveOrRevoke(store, false)}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                            title="Revoke"
                          >
                            <XCircle size={16} />
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {Drawer}
    </div>
  );
}

/* ───── Components ─────*/

function KpiCard({ title, value, hint }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-3xl font-bold mt-2 text-slate-900">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-sky-600 text-white border-sky-600"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function StatusPill({ validated }) {
  const cls = validated
    ? "bg-emerald-100 text-emerald-700"
    : "bg-amber-100 text-amber-700";

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${cls}`}>
      {validated ? "Validated" : "Pending"}
    </span>
  );
}

function DocMiniButton({ url, onOpen }) {
  if (!url) {
    return <span className="text-rose-600 text-xs font-semibold">Not submitted</span>;
  }

  return (
    <button
      onClick={() => onOpen(url)}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
    >
      <ExternalLink size={14} className="text-slate-400" />
      View
    </button>
  );
}

function DocButton({ title, url, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => url && onOpen(url)}
      disabled={!url}
      className={[
        "w-full rounded-2xl border px-4 py-3 text-left transition",
        url
          ? "border-slate-200 bg-white hover:bg-slate-50"
          : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-slate-900">{title}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {url ? "Click to open in new tab" : "Not submitted"}
          </div>
        </div>
        {url && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800">
            Open <ExternalLink size={16} className="text-slate-400" />
          </div>
        )}
      </div>
    </button>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-slate-400 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </div>
        <div className="text-sm text-slate-800 break-words">{value}</div>
      </div>
    </div>
  );
}