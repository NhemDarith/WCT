"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, LogOut, UserCircle, ExternalLink, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

// utility to pick a key from an object
function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] != null && obj[k] !== "") return obj[k];
  }
  return null;
}

// utility to convert a value to boolean
function toBool(v) {
  if (v === true) return true;
  if (v === false) return false;
  const s = String(v || "").toLowerCase().trim();
  if (["1", "true", "yes", "y"].includes(s)) return true;
  if (["0", "false", "no", "n"].includes(s)) return false;
  return null;
}

// Admin header component with notifications and profile
export default function AdminHeader() {
  const [me, setMe] = useState(null);
  const [profileName, setProfileName] = useState("Admin");

  const [open, setOpen] = useState(false);
  const [loadingNoti, setLoadingNoti] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const dropRef = useRef(null);

  // Utility functions
  const F = {
    id: ["id", "notification_id", "uuid"],
    title: ["title", "subject", "header", "name", "type"],
    message: ["message", "body", "text", "content", "description"],
    link: ["link", "url", "href", "path", "route"],
    createdAt: ["created_at", "createdAt", "time", "timestamp", "date"],
    read: ["is_read", "read", "seen", "is_seen", "viewed"],
    userId: ["user_id", "auth_id", "owner_id", "uid"],
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => {
      const readVal = pick(n, F.read);
      const b = toBool(readVal);
      // if can't detect a read column, return false
      if (readVal == null) return false;
      return b === false;
    }).length;
  }, [notifications]);

  useEffect(() => {
    loadMe();
    loadNotifications();

    function onDocClick(e) {
      if (!dropRef.current) return;
      if (!dropRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function loadMe() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      const user = data?.user || null;
      setMe(user);

      const meta = user?.user_metadata || {};
      const fallback =
        (user?.email ? user.email.split("@")[0] : "") || "Admin";
      setProfileName(meta.full_name || meta.name || fallback);
    } catch (e) {
      console.error("loadMe:", e?.message || e);
      setMe(null);
      setProfileName("Admin");
    }
  }

  async function loadNotifications() {
    setLoadingNoti(true);
    try {
      // get current user id
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id || null;

      // get notifications
      let q = supabase.from("notifications").select("*");

      // client-side filter by user_id if we can detect a user_id-like column
      // and we have session
      // If created_at doesn't exist, the order() can error.
      const { data, error } = await q.order("created_at", { ascending: false }).limit(20);

      // If created_at doesn't exist, the order() can error.
      // fallback: try without ordering.
      if (error) {
        const { data: data2, error: error2 } = await supabase
          .from("notifications")
          .select("*")
          .limit(20);

        if (error2) throw error2;
        setNotifications(data2 || []);
        setLoadingNoti(false);
        return;
      }

      let list = data || [];

      // client-side filter by user if we can detect a user_id-like column and we have session
      if (userId) {
        const hasUserKey = list.some((n) => pick(n, F.userId) != null);
        if (hasUserKey) {
          list = list.filter((n) => String(pick(n, F.userId) || "") === String(userId));
        }
      }

      setNotifications(list);
    } catch (e) {
      console.error("loadNotifications:", e?.message || e);
      setNotifications([]);
    } finally {
      setLoadingNoti(false);
    }
  }

  async function markAsRead(n) {
    // Only do DB update if we can detect an id and a read-column.
    const id = pick(n, F.id);
    const readKey = F.read.find((k) => n && k in n); // which column exists
    if (!id || !readKey) return;

    // Mark as read locally
    setNotifications((prev) =>
      prev.map((x) => (String(pick(x, F.id)) === String(id) ? { ...x, [readKey]: true } : x))
    );

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ [readKey]: true })
        .eq("id", id); // assumes id column is "id"
      // Refresh notifications
      if (error) throw error;
    } catch (e) {
      console.error("markAsRead:", e?.message || e);
      loadNotifications();
    }
  }

  // ===== Sign-out =====
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = "/login_registration";
    } catch (error) {
      alert("Sign-out failed: " + error.message);
    }
  };

  return (
    <header className="w-full h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white font-black grid place-items-center">
          P
        </div>
        <div className="leading-tight">
          <div className="text-slate-900 font-bold">Pharmacy Admin</div>
          <div className="text-xs text-slate-500 -mt-0.5">Control panel</div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4" ref={dropRef}>
        {/* Notifications */}
        <button
          className="relative inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50"
          onClick={() => {
            setOpen((v) => !v);
            if (!open) loadNotifications();
          }}
          title="Notifications"
        >
          <Bell size={20} className="text-slate-700" />
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[11px] font-bold rounded-full min-w-[18px] h-[18px] px-1 grid place-items-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>

        {/* Dropdown */}
        {open ? (
          <div className="absolute right-6 top-[64px] w-[380px] rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden z-50">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">Notifications</div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
                title="Close"
              >
                <X size={16} className="text-slate-700" />
              </button>
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              {loadingNoti ? (
                <div className="p-4 text-sm text-slate-500">Loading…</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">No notifications.</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {notifications.map((n, idx) => {
                    const title = pick(n, F.title) || "Notification";
                    const message = pick(n, F.message) || "";
                    const link = pick(n, F.link);
                    const createdAt = pick(n, F.createdAt);
                    const readVal = pick(n, F.read);
                    const isRead = readVal == null ? true : toBool(readVal) === true;

                    return (
                      <li
                        key={String(pick(n, F.id) || idx)}
                        className={[
                          "px-4 py-3 hover:bg-slate-50 transition",
                          isRead ? "bg-white" : "bg-sky-50/40",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {String(title)}
                            </div>

                            {message ? (
                              <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                                {String(message)}
                              </div>
                            ) : null}

                            {createdAt ? (
                              <div className="text-[11px] text-slate-400 mt-2">
                                {String(createdAt)}
                              </div>
                            ) : null}
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {!isRead ? (
                              <button
                                onClick={() => markAsRead(n)}
                                className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
                                title="Mark as read"
                              >
                                <Check size={16} className="text-slate-700" />
                              </button>
                            ) : null}

                            {link ? (
                              <Link
                                href={String(link)}
                                onClick={() => {
                                  markAsRead(n);
                                  setOpen(false);
                                }}
                                className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
                                title="Open"
                              >
                                <ExternalLink size={16} className="text-slate-700" />
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="px-4 py-3 border-t border-slate-200 bg-white flex justify-between items-center">
              <button
                onClick={loadNotifications}
                className="text-sm font-semibold text-slate-700 hover:underline"
              >
                Refresh
              </button>

              <div className="text-xs text-slate-500">
                Showing {notifications.length}
              </div>
            </div>
          </div>
        ) : null}

        {/* Profile */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <UserCircle size={22} className="text-slate-700" />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900">
              {profileName || "Admin"}
            </div>
            <div className="text-[11px] text-slate-500">
              {me?.email || ""}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-sm font-semibold transition"
          onClick={handleSignOut}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
