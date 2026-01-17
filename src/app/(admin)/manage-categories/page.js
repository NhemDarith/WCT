"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";

// Import from react-icons
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiRefreshCw, 
  FiSearch, 
  FiX, 
  FiCheck 
} from "react-icons/fi";

export default function SubCategoriesPage() {
  const [mainCategories, setMainCategories] = useState([]);
  const [selectedMain, setSelectedMain] = useState("");

  const [subCategories, setSubCategories] = useState([]);
  const [query, setQuery] = useState("");

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const [loadingMain, setLoadingMain] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [loading, setLoading] = useState(false);

  // SweetAlert
  const toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  });

  // Filtered sub categories
  const filteredSubs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subCategories;
    return subCategories.filter((s) => s.name.toLowerCase().includes(q));
  }, [subCategories, query]);

  // ---------- Load main categories ----------
  useEffect(() => {
    fetchMainCategories();
  }, []);

  async function fetchMainCategories() {
    setLoadingMain(true);
    const { data, error } = await supabase
      .from("main_categories")
      .select("id, name")
      .order("name");

    if (error) {
      Swal.fire("Error", error.message, "error");
      setMainCategories([]);
    } else {
      setMainCategories(data || []);
    }
    setLoadingMain(false);
  }

  // ---------- Load sub categories ----------
  async function fetchSubCategories(mainId) {
    if (!mainId) {
      setSubCategories([]);
      return;
    }

    setLoadingSubs(true);
    const { data, error } = await supabase
      .from("sub_categories")
      .select("id, name")
      .eq("main_category_id", mainId)
      .order("name");

    if (error) {
      Swal.fire("Error", error.message, "error");
      setSubCategories([]);
    } else {
      setSubCategories(data || []);
    }
    setLoadingSubs(false);
  }

  useEffect(() => {
    fetchSubCategories(selectedMain);
    setEditingId(null);
    setEditingName("");
    setNewName("");
    setQuery("");
  }, [selectedMain]);

  async function refreshAll() {
    setLoading(true);
    await fetchMainCategories();
    await fetchSubCategories(selectedMain);
    setLoading(false);
    toast.fire({ icon: "success", title: "Refreshed" });
  }

  async function addSubCategory() {
    if (!selectedMain || !newName.trim()) return;

    setLoading(true);
    const { error } = await supabase.from("sub_categories").insert({
      name: newName.trim(),
      main_category_id: selectedMain,
    });

    if (error) {
      Swal.fire("Error", error.message, "error");
    } else {
      setNewName("");
      await fetchSubCategories(selectedMain);
      toast.fire({ icon: "success", title: "Sub-category added" });
    }
    setLoading(false);
  }

  async function saveEdit() {
    if (!editingId || !editingName.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from("sub_categories")
      .update({ name: editingName.trim() })
      .eq("id", editingId);

    if (error) {
      Swal.fire("Error", error.message, "error");
    } else {
      setEditingId(null);
      setEditingName("");
      await fetchSubCategories(selectedMain);
      toast.fire({ icon: "success", title: "Updated successfully" });
    }
    setLoading(false);
  }

  // ---------- Delete sub category ----------
  async function deleteSub(id) {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48", // rose-600
      cancelButtonColor: "#64748b", // slate-500
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      setLoading(true);
      const { error } = await supabase.from("sub_categories").delete().eq("id", id);
      
      if (error) {
        Swal.fire("Error", error.message, "error");
      } else {
        await fetchSubCategories(selectedMain);
        toast.fire({ icon: "success", title: "Deleted" });
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sub Category Management</h1>
            <p className="text-sm text-slate-600">Manage sub categories by main category</p>
          </div>

          <button
            onClick={refreshAll}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={16} />
            Refresh
          </button>
        </div>

        {/* Main Category Select */}
        <div className="bg-white border border-slate-300 rounded-2xl p-5 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Main Category</label>
          <div className="relative">
            <select
              className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-3 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={selectedMain}
              onChange={(e) => setSelectedMain(e.target.value)}
              disabled={loadingMain}
            >
              <option value="" disabled hidden>
                {loadingMain ? "Loading..." : "Select main category"}
              </option>
              {mainCategories.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</div>
          </div>
        </div>

        {/* Add + Search */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white border border-slate-300 rounded-2xl p-5 shadow-sm">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Sub category name"
                value={editingId ? editingName : newName}
                onChange={(e) => (editingId ? setEditingName(e.target.value) : setNewName(e.target.value))}
                disabled={!selectedMain}
              />

              {editingId ? (
                <button
                  onClick={saveEdit}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <FiCheck size={16} /> Save
                </button>
              ) : (
                <button
                  onClick={addSubCategory}
                  disabled={!selectedMain || !newName.trim()}
                  className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  <FiPlus size={16} /> Add
                </button>
              )}

              {editingId && (
                <button
                  onClick={() => { setEditingId(null); setEditingName(""); }}
                  className="rounded-xl border border-slate-300 bg-white px-3"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-300 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 border border-slate-300 rounded-xl px-3 py-3">
              <FiSearch size={18} className="text-slate-400" />
              <input
                className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={!selectedMain}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-300 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-300">
              <tr>
                <th className="text-left px-4 py-3 text-slate-700 font-semibold">Name</th>
                <th className="text-right px-4 py-3 text-slate-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingSubs ? (
                <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>
              ) : filteredSubs.length === 0 ? (
                <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-500">No sub categories</td></tr>
              ) : (
                filteredSubs.map((s) => (
                  <tr key={s.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                    <td className="px-4 py-3 text-right space-x-4">
                      <button
                        onClick={() => { setEditingId(s.id); setEditingName(s.name); }}
                        className="text-sky-600 hover:text-sky-800 inline-flex items-center"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteSub(s.id)}
                        className="text-rose-600 hover:text-rose-800 inline-flex items-center"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}