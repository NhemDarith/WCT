"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  BadgeCheck,
  Layers,
  Users,
  ArrowRight,
} from "lucide-react";

const shortcuts = [
  {
    title: "Dashboard",
    desc: "View platform overview and key stats.",
    href: "/dashboard",
    badge: "Overview",
    icon: LayoutDashboard,
  },
  {
    title: "Validate Stores",
    desc: "Approve or revoke pharmacy store registrations.",
    href: "/validate-stores",
    badge: "Action required",
    icon: BadgeCheck,
  },
  {
    title: "Manage Categories",
    desc: "Create and manage main & sub categories.",
    href: "/manage-categories",
    badge: "Management",
    icon: Layers,
  },
  {
    title: "All Users",
    desc: "View users, roles, and registration info.",
    href: "/users",
    badge: "Users",
    icon: Users,
  },
];

function badgeClass(badge) {
  const b = (badge || "").toLowerCase();
  if (b.includes("action")) {
    return "bg-amber-100/80 text-amber-800 border-amber-200 shadow-sm";
  }
  if (b.includes("overview")) {
    return "bg-sky-100/80 text-sky-800 border-sky-200 shadow-sm";
  }
  if (b.includes("manage") || b.includes("management")) {
    return "bg-indigo-100/80 text-indigo-800 border-indigo-200 shadow-sm";
  }
  if (b.includes("user")) {
    return "bg-emerald-100/80 text-emerald-800 border-emerald-200 shadow-sm";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50">
      <div className="max-w-6xl mx-auto p-6 pt-8 lg:p-10 space-y-8 lg:space-y-10">
        {/* Hero Section */}
        <div className="rounded-3xl border bg-white shadow-xl overflow-hidden">
          <div className="p-8 md:p-10 lg:p-12 bg-gradient-to-br from-sky-50 via-white to-indigo-50/40">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2.5 rounded-full border bg-white/80 px-4 py-1.5 text-sm font-semibold text-slate-700 shadow-sm">
                Admin Panel
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                Pharmacy Platform
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
                Manage your platform
              </h1>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                Quick access to verification, categories, users, and more.
              </p>
            </div>
          </div>
          <div className="px-8 md:px-10 lg:px-12 py-5 border-t bg-white/70 backdrop-blur-sm">
            <div className="text-base font-semibold text-slate-800">
              Choose a section to continue →
            </div>
          </div>
        </div>

        {/* Shortcut Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
          {shortcuts.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.href}
                href={s.href}
                className="group rounded-3xl border bg-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="p-6 lg:p-7">
                  <div className="flex items-start justify-between gap-5">
                    <div className="flex items-start gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 grid place-items-center text-slate-600 group-hover:bg-sky-50 group-hover:text-sky-600 group-hover:border-sky-200 transition-all duration-300">
                        <Icon size={26} strokeWidth={2.1} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xl font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                          {s.title}
                        </div>
                        <div className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                          {s.desc}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-full border ${badgeClass(
                        s.badge
                      )} transition-transform group-hover:scale-105`}
                    >
                      {s.badge}
                    </span>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-xs text-slate-500 font-medium">
                      Open section
                    </div>
                    <div className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm group-hover:bg-sky-50 group-hover:border-sky-200 group-hover:text-sky-700 transition-all duration-300">
                      Open
                      <ArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}