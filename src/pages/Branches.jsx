import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  Building2,
  Pencil,
  Trash2,
  Loader2,
  MapPin,
  Phone,
  UserRound,
  Percent,
  Hash,
  ArrowUpRight,
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

  /* =========================================================
     LOAD BRANCHES
  ========================================================= */

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

  /* =========================================================
     FORM HELPERS
  ========================================================= */

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
        maxDiscountPercent:
          data.branch.maxDiscountPercent || 10,
      });

      setBranchId(id);
      setEditing(true);
      setOpen(true);
    } catch {
      toast.error("Could not fetch branch");
    }
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

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

  /* =========================================================
     DELETE / DEACTIVATE
  ========================================================= */

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

  /* =========================================================
     FORM FIELD
  ========================================================= */

  const FormField = ({
    label,
    icon: Icon,
    children,
  }) => {
    return (
      <div>
        <label className="flex items-center gap-1.5 mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          {Icon && <Icon size={12} />}
          {label}
        </label>

        {children}
      </div>
    );
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <AppShell title="Branches">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <PageHeader
        title="Branches"
        description="Manage your institute locations, managers and branch settings."
        action={
          <button
            className="
              group
              inline-flex items-center gap-2

              px-4 py-2.5
              rounded-xl

              bg-gradient-to-r
              from-violet-600
              to-indigo-600

              text-white
              text-xs
              font-bold

              border border-violet-500/20

              shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_5px_0_#4338CA,0_10px_20px_rgba(79,70,229,0.18)]

              transition-all duration-300

              hover:-translate-y-1
              hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_6px_0_#4338CA,0_14px_25px_rgba(79,70,229,0.25)]

              active:translate-y-[2px]
              active:shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),0_2px_0_#4338CA,0_5px_10px_rgba(79,70,229,0.15)]
            "
            onClick={openCreate}
          >
            <Plus
              size={16}
              className="transition-transform duration-300 group-hover:rotate-90"
            />

            Add Branch
          </button>
        }
      />

      {/* =====================================================
          BRANCH COUNT
      ===================================================== */}

      {!loading && branches.length > 0 && (
        <div className="flex items-center gap-2 mb-5">
          <span
            className="
              inline-flex items-center gap-1.5
              px-2.5 py-1
              rounded-full
              bg-violet-50
              border border-violet-100
              text-violet-600
              text-[10px]
              font-bold
            "
          >
            <Building2 size={11} />
            {branches.length}{" "}
            {branches.length === 1 ? "Branch" : "Branches"}
          </span>

          <span className="text-[10px] text-slate-400">
            Active institute locations
          </span>
        </div>
      )}

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (
        <div
          className="
            rounded-2xl
            bg-white
            border border-slate-200
            min-h-[300px]

            flex flex-col
            items-center
            justify-center

            shadow-[0_5px_20px_rgba(30,20,80,0.045)]
          "
        >
          <div
            className="
              h-12 w-12
              rounded-2xl
              bg-violet-50
              border border-violet-100
              flex items-center justify-center
              text-violet-500
              mb-3
            "
          >
            <Loader2
              size={22}
              className="animate-spin"
            />
          </div>

          <p className="text-sm font-semibold text-slate-700">
            Loading branches...
          </p>

          <p className="text-[11px] text-slate-400 mt-1">
            Please wait a moment
          </p>
        </div>

      ) : branches.length === 0 ? (

        /* ===================================================
           EMPTY STATE
        =================================================== */

        <EmptyState
          title="No Branches Yet"
          description="Create your first institute branch to start managing locations."
        />

      ) : (

        /* ===================================================
           BRANCH GRID
        =================================================== */

        <div
          className="
            grid
            md:grid-cols-2
            xl:grid-cols-3
            gap-5
          "
        >
          {branches.map((b, index) => (
            <div
              key={b._id}
              className="
                group
                relative
                overflow-hidden

                rounded-2xl
                bg-white

                border border-slate-200/80

                p-5

                shadow-[0_6px_22px_rgba(30,20,80,0.055)]

                transition-all
                duration-300
                ease-out

                hover:-translate-y-1.5
                hover:border-violet-200
                hover:shadow-[0_18px_40px_rgba(30,20,80,0.11)]
              "
            >

              {/* =============================================
                  CARD DECORATION
              ============================================= */}

              <div
                className="
                  absolute
                  right-[-35px]
                  top-[-35px]

                  h-28 w-28
                  rounded-full

                  bg-violet-500/5
                  blur-2xl

                  transition-all duration-500

                  group-hover:scale-150
                  group-hover:bg-violet-500/10
                "
              />

              <div
                className="
                  absolute
                  top-0 right-0
                  h-14 w-14
                  opacity-0
                  group-hover:opacity-100
                  transition-opacity duration-300
                "
              >
                <div className="absolute right-0 top-0 w-9 h-px bg-gradient-to-l from-violet-400 to-transparent" />

                <div className="absolute right-0 top-0 h-9 w-px bg-gradient-to-b from-violet-400 to-transparent" />
              </div>


              {/* =============================================
                  HEADER
              ============================================= */}

              <div className="relative flex items-start justify-between">

                <div className="flex items-center gap-3 min-w-0">

                  {/* 3D Branch Icon */}
                  <div
                    className="
                      relative
                      h-12 w-12
                      shrink-0

                      rounded-xl

                      bg-gradient-to-br
                      from-violet-500
                      via-purple-600
                      to-indigo-700

                      text-white

                      flex items-center justify-center

                      shadow-[inset_0_1px_2px_rgba(255,255,255,0.35),0_4px_0_#4338CA,0_9px_16px_rgba(79,70,229,0.2)]

                      transition-all duration-300

                      group-hover:-translate-y-1
                      group-hover:scale-105
                    "
                  >
                    <Building2 size={19} />

                    <span
                      className="
                        absolute
                        inset-0
                        rounded-xl
                        bg-gradient-to-br
                        from-white/20
                        via-transparent
                        to-transparent
                        pointer-events-none
                      "
                    />
                  </div>


                  {/* Name */}
                  <div className="min-w-0">

                    <h3
                      className="
                        font-display
                        text-[15px]
                        font-bold
                        text-slate-900
                        truncate
                      "
                    >
                      {b.name}
                    </h3>

                    <div className="flex items-center gap-1.5 mt-1">
                      <Hash
                        size={10}
                        className="text-slate-400"
                      />

                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                        {b.code}
                      </p>
                    </div>

                  </div>
                </div>


                {/* Branch number */}
                <span
                  className="
                    hidden sm:flex
                    h-7 w-7
                    rounded-lg
                    bg-slate-50
                    border border-slate-100
                    items-center justify-center
                    text-[9px]
                    font-bold
                    text-slate-400
                  "
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

              </div>


              {/* =============================================
                  STATUS
              ============================================= */}

              <div className="relative mt-4">
                <span
                  className="
                    inline-flex
                    items-center
                    gap-1.5

                    px-2.5 py-1

                    rounded-full

                    bg-emerald-50
                    border border-emerald-100

                    text-[9px]
                    font-bold
                    text-emerald-600
                  "
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />

                  Active Branch
                </span>
              </div>


              {/* =============================================
                  INFORMATION
              ============================================= */}

              <div className="relative mt-4 space-y-2">

                {/* City */}
                <div
                  className="
                    flex items-center gap-3
                    rounded-xl
                    bg-slate-50/80
                    border border-slate-100
                    px-3 py-2.5

                    transition-colors duration-200
                    group-hover:bg-violet-50/40
                  "
                >
                  <div className="h-7 w-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-violet-500">
                    <MapPin size={13} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[8px] uppercase tracking-wide font-bold text-slate-400">
                      City
                    </p>

                    <p className="text-xs font-semibold text-slate-700 truncate">
                      {b.city || "Not specified"}
                    </p>
                  </div>
                </div>


                {/* Address */}
                <div className="flex items-start gap-3 px-1 py-1">

                  <MapPin
                    size={14}
                    className="text-slate-400 mt-0.5 shrink-0"
                  />

                  <p className="text-[11px] leading-relaxed text-slate-500 line-clamp-2">
                    {b.address || "Address not specified"}
                  </p>

                </div>


                {/* Phone */}
                <div className="flex items-center gap-3 px-1 py-1">

                  <Phone
                    size={14}
                    className="text-slate-400 shrink-0"
                  />

                  <span className="text-[11px] font-medium text-slate-600">
                    {b.phone || "Phone not specified"}
                  </span>

                </div>


                {/* Manager */}
                <div className="flex items-center gap-3 px-1 py-1">

                  <UserRound
                    size={14}
                    className="text-slate-400 shrink-0"
                  />

                  <div className="min-w-0">
                    <span className="text-[9px] text-slate-400">
                      Manager:{" "}
                    </span>

                    <span className="text-[11px] font-semibold text-slate-600">
                      {b.manager?.name || "Not Assigned"}
                    </span>
                  </div>

                </div>

              </div>


              {/* =============================================
                  FOOTER
              ============================================= */}

              <div
                className="
                  relative
                  mt-4
                  pt-4
                  border-t border-slate-100

                  flex items-center justify-between
                "
              >

                {/* Discount */}
                <div className="flex items-center gap-2">

                  <div
                    className="
                      h-8 w-8
                      rounded-lg
                      bg-amber-50
                      border border-amber-100
                      text-amber-500
                      flex items-center justify-center
                    "
                  >
                    <Percent size={13} />
                  </div>

                  <div>
                    <p className="text-[8px] uppercase tracking-wide font-bold text-slate-400">
                      Max Discount
                    </p>

                    <p className="text-xs font-bold text-slate-800">
                      {b.maxDiscountPercent}%
                    </p>
                  </div>

                </div>


                {/* Actions */}
                <div className="flex items-center gap-1.5">

                  <button
                    title="Edit Branch"
                    onClick={() => openEdit(b._id)}
                    className="
                      h-9 w-9
                      rounded-xl

                      bg-slate-50
                      border border-slate-200

                      text-slate-500

                      flex items-center justify-center

                      shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]

                      transition-all duration-200

                      hover:bg-violet-50
                      hover:border-violet-200
                      hover:text-violet-600
                      hover:-translate-y-0.5
                    "
                  >
                    <Pencil size={14} />
                  </button>

                  <button
                    title="Deactivate Branch"
                    onClick={() => deleteBranch(b._id)}
                    className="
                      h-9 w-9
                      rounded-xl

                      bg-slate-50
                      border border-slate-200

                      text-slate-400

                      flex items-center justify-center

                      shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]

                      transition-all duration-200

                      hover:bg-red-50
                      hover:border-red-200
                      hover:text-red-500
                      hover:-translate-y-0.5
                    "
                  >
                    <Trash2 size={14} />
                  </button>

                </div>

              </div>


              {/* Bottom hover line */}
              <div
                className="
                  absolute
                  bottom-0 left-1/2
                  -translate-x-1/2

                  h-0.5
                  w-0

                  bg-gradient-to-r
                  from-violet-500
                  to-indigo-500

                  transition-all duration-300

                  group-hover:w-1/2
                "
              />

            </div>
          ))}
        </div>
      )}


      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      <Modal
        open={open}
        wide
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title={editing ? "Edit Branch" : "Create Branch"}
      >

        <form
          onSubmit={submit}
          className="space-y-5"
        >

          {/* Intro */}
          <div
            className="
              rounded-xl
              bg-violet-50
              border border-violet-100
              px-4 py-3
            "
          >
            <p className="text-[11px] font-semibold text-violet-700">
              {editing
                ? "Update branch information"
                : "Add a new institute branch"}
            </p>

            <p className="text-[10px] text-violet-500/70 mt-0.5">
              Keep branch details accurate for smooth CRM management.
            </p>
          </div>


          {/* Two-column form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <FormField
              label="Branch Name"
              icon={Building2}
            >
              <input
                className="
                  input
                  !rounded-xl
                  focus:!border-violet-400
                  focus:!ring-2
                  focus:!ring-violet-100
                "
                required
                placeholder="e.g. Success Point Main Branch"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />
            </FormField>


            <FormField
              label="Branch Code"
              icon={Hash}
            >
              <input
                className="
                  input
                  !rounded-xl
                  uppercase
                  focus:!border-violet-400
                  focus:!ring-2
                  focus:!ring-violet-100
                "
                required
                placeholder="e.g. SP01"
                value={form.code}
                onChange={(e) =>
                  setForm({
                    ...form,
                    code: e.target.value,
                  })
                }
              />
            </FormField>


            <FormField
              label="City"
              icon={MapPin}
            >
              <input
                className="
                  input
                  !rounded-xl
                  focus:!border-violet-400
                  focus:!ring-2
                  focus:!ring-violet-100
                "
                placeholder="Enter city"
                value={form.city}
                onChange={(e) =>
                  setForm({
                    ...form,
                    city: e.target.value,
                  })
                }
              />
            </FormField>


            <FormField
              label="Phone"
              icon={Phone}
            >
              <input
                className="
                  input
                  !rounded-xl
                  focus:!border-violet-400
                  focus:!ring-2
                  focus:!ring-violet-100
                "
                placeholder="Enter phone number"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
              />
            </FormField>

          </div>


          {/* Address */}
          <FormField
            label="Address"
            icon={MapPin}
          >
            <textarea
              className="
                input
                !rounded-xl
                min-h-[90px]
                resize-none

                focus:!border-violet-400
                focus:!ring-2
                focus:!ring-violet-100
              "
              placeholder="Enter complete branch address"
              value={form.address}
              onChange={(e) =>
                setForm({
                  ...form,
                  address: e.target.value,
                })
              }
            />
          </FormField>


          {/* Discount */}
          <FormField
            label="Maximum Discount Percentage"
            icon={Percent}
          >
            <div className="relative">

              <input
                type="number"
                min="0"
                max="100"
                className="
                  input
                  !rounded-xl
                  pr-12

                  focus:!border-violet-400
                  focus:!ring-2
                  focus:!ring-violet-100
                "
                value={form.maxDiscountPercent}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxDiscountPercent:
                      Number(e.target.value),
                  })
                }
              />

              <span
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2

                  text-xs
                  font-bold
                  text-slate-400
                "
              >
                %
              </span>

            </div>
          </FormField>


          {/* Submit */}
          <button
            type="submit"
            className="
              group
              w-full

              inline-flex
              items-center
              justify-center
              gap-2

              rounded-xl

              py-3

              bg-gradient-to-r
              from-violet-600
              to-indigo-600

              text-white
              text-sm
              font-bold

              shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_5px_0_#4338CA,0_10px_20px_rgba(79,70,229,0.18)]

              transition-all duration-300

              hover:-translate-y-0.5
              hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_6px_0_#4338CA,0_14px_25px_rgba(79,70,229,0.25)]

              active:translate-y-[2px]
              active:shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),0_2px_0_#4338CA,0_5px_10px_rgba(79,70,229,0.15)]
            "
          >
            {editing ? (
              <>
                <Pencil
                  size={15}
                  className="transition-transform group-hover:-rotate-6"
                />
                Update Branch
              </>
            ) : (
              <>
                <Plus
                  size={16}
                  className="transition-transform group-hover:rotate-90"
                />
                Create Branch
              </>
            )}

            <ArrowUpRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </button>

        </form>
      </Modal>
    </AppShell>
  );
}

