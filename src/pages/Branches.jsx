import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  Building2,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";

import AppShell from "../components/AppShell";
import { PageHeader, Modal, EmptyState } from "../components/ui";
import api from "../api/axios";

const initialForm = {
  name: "",
  code: "",
  city: "",
  address: "",
  phone: "",
  maxDiscountPercent: 10,
};

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [branchId, setBranchId] = useState(null);

  const [form, setForm] = useState(initialForm);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/branches");
      setBranches(data.branches);
    } catch {
      toast.error("Could not load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditing(false);
    setBranchId(null);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = async (id) => {
    try {
      const { data } = await api.get(`/branches/${id}`);

      setForm({
        name: data.branch.name || "",
        code: data.branch.code || "",
        city: data.branch.city || "",
        address: data.branch.address || "",
        phone: data.branch.phone || "",
        maxDiscountPercent: data.branch.maxDiscountPercent || 10,
      });

      setBranchId(id);
      setEditing(true);
      setOpen(true);
    } catch {
      toast.error("Could not fetch branch");
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      if (editing) {
        await api.patch(`/branches/${branchId}`, form);
        toast.success("Branch updated");
      } else {
        await api.post("/branches", form);
        toast.success("Branch created");
      }

      setOpen(false);
      resetForm();
      loadBranches();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          (editing ? "Update failed" : "Create failed")
      );
    }
  };

  const deleteBranch = async (id) => {
    if (!window.confirm("Deactivate this branch?")) return;

    try {
      await api.delete(`/branches/${id}`);
      toast.success("Branch deactivated");
      loadBranches();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <AppShell title="Branches">
      <PageHeader
        title="Branches"
        description="Manage all institute branches."
        action={
          <button className="btn-accent" onClick={openCreate}>
            <Plus size={16} />
            Add Branch
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin" />
        </div>
      ) : branches.length === 0 ? (
        <EmptyState
          title="No Branches"
          description="Create your first branch."
        />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {branches.map((b) => (
            <div key={b._id} className="card p-5">

              <div className="flex justify-between">

                <div className="flex gap-3">

                  <div className="w-11 h-11 rounded-lg bg-ink-900 text-white flex items-center justify-center">
                    <Building2 size={18} />
                  </div>

                  <div>
                    <h3 className="font-semibold">{b.name}</h3>
                    <p className="text-xs text-gray-500">{b.code}</p>
                  </div>

                </div>

                <div className="flex gap-2">

                  <button
                    className="btn-secondary"
                    onClick={() => openEdit(b._id)}
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    className="btn-danger"
                    onClick={() => deleteBranch(b._id)}
                  >
                    <Trash2 size={15} />
                  </button>

                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">

                <p>
                  <strong>City :</strong> {b.city || "-"}
                </p>

                <p>
                  <strong>Address :</strong> {b.address || "-"}
                </p>

                <p>
                  <strong>Phone :</strong> {b.phone || "-"}
                </p>

                <p>
                  <strong>Manager :</strong>{" "}
                  {b.manager?.name || "Not Assigned"}
                </p>

                <p>
                  <strong>Discount :</strong>{" "}
                  {b.maxDiscountPercent}%
                </p>

              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title={editing ? "Edit Branch" : "Create Branch"}
      >
        <form onSubmit={submit} className="space-y-4">

          <div>
            <label className="label">Branch Name</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Branch Code</label>
            <input
              className="input"
              required
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">City</label>
            <input
              className="input"
              value={form.city}
              onChange={(e) =>
                setForm({ ...form, city: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Address</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) =>
                setForm({ ...form, address: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Max Discount %</label>
            <input
              type="number"
              className="input"
              value={form.maxDiscountPercent}
              onChange={(e) =>
                setForm({
                  ...form,
                  maxDiscountPercent: Number(e.target.value),
                })
              }
            />
          </div>

          <button className="btn-primary w-full">
            {editing ? "Update Branch" : "Create Branch"}
          </button>

        </form>
      </Modal>
    </AppShell>
  );
}