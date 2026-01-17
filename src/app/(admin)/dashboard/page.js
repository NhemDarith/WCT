"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// SweetAlert
import Swal from "sweetalert2";

// React Icons (Feather icons)
import { FiRefreshCw, FiClock, FiLayers, FiShoppingBag } from "react-icons/fi";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const TABLES = {
  stores: "stores",
  mainCategories: "main_categories",
  subCategories: "sub_categories",
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);

  const [cards, setCards] = useState([
    { title: "Pending Stores", value: "—", icon: "pending" },
    { title: "Total Stores", value: "—", icon: "stores" },
    { title: "Sub Categories", value: "—", icon: "subcats" },
  ]);

  const [recentStores, setRecentStores] = useState([]);

  const [series, setSeries] = useState([
    { name: "Mon", value: 0 },
    { name: "Tue", value: 0 },
    { name: "Wed", value: 0 },
    { name: "Thu", value: 0 },
    { name: "Fri", value: 0 },
    { name: "Sat", value: 0 },
    { name: "Sun", value: 0 },
  ]);

  const iconMap = {
    pending: FiClock,
    stores: FiShoppingBag,
    subcats: FiLayers,
  };

  const count = useCallback(async (table, filter) => {
    let q = supabase.from(table).select("id", {
      count: "exact",
      head: true,
    });

    if (filter) q = q.eq(filter.col, filter.eq);

    const { count, error } = await q;
    if (error) throw error;

    return count ?? 0;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);

    // Fetch dashboard data
    try {
      const [pendingStores, totalStores, _mainCats, subCats] =
        await Promise.all([
          count(TABLES.stores, { col: "validated", eq: false }),
          count(TABLES.stores),
          count(TABLES.mainCategories),
          count(TABLES.subCategories),
        ]);

      const { data: recent, error: recentErr } = await supabase
        .from(TABLES.stores)
        .select("id, name, validated, created_at")
        .eq("validated", false)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentErr) throw recentErr;

      setCards([
        { title: "Pending Stores", value: pendingStores, icon: "pending" },
        { title: "Total Stores", value: totalStores, icon: "stores" },
        { title: "Sub Categories", value: subCats, icon: "subcats" },
      ]);

      setRecentStores(recent || []);

      // Demo chart data (same logic you had)
      const base = Number(totalStores ?? 0);
      setSeries((prev) => prev.map((p, i) => ({ ...p, value: base + i })));

    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to load dashboard",
        text: err?.message || "Please check Supabase connection / RLS",
      });
    } finally {
      setLoading(false);
    }
  }, [count]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">Overview metrics</p>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => {
          const Icon = iconMap[c.icon] || FiLayers;
          return (
            <div
              key={c.title}
              className="rounded-2xl bg-white border shadow-sm p-4 flex items-center gap-4"
            >
              <div className="text-xl text-emerald-600">
                <Icon />
              </div>
              <div>
                <div className="text-sm text-slate-500">{c.title}</div>
                <div className="text-3xl font-semibold text-slate-900 mt-1">
                  {c.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="rounded-2xl bg-white border shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-slate-900">Stores Growth</div>
            <div className="text-xs text-slate-500 mt-1">Last 7 days</div>
          </div>
        </div>

        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="rounded-2xl bg-white border shadow-sm p-5">
        <div className="text-lg font-bold text-slate-900">
          Recent Store Validation Requests
        </div>
        <div className="text-xs text-slate-500 mt-1">Latest 5 pending</div>

        <div className="mt-4">
          {loading ? (
            <p className="text-slate-500 text-sm">Loading...</p>
          ) : recentStores.length === 0 ? (
            <p className="text-slate-500 text-sm">No pending store requests</p>
          ) : (
            <ul className="space-y-3">
              {recentStores.map((store) => (
                <li
                  key={store.id}
                  className="flex items-center justify-between rounded-xl border bg-slate-50 px-4 py-3"
                >
                  <span className="text-slate-700 font-medium">{store.name}</span>
                  <span className="text-amber-600 text-xs font-semibold">
                    Pending
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
