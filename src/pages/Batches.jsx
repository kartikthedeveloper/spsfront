import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  GraduationCap,
  Building2,
  UserRound,
  CalendarDays,
  Clock3,
  Users,
  Activity,
  ArrowUpRight,
} from "lucide-react";

import AppShell from "../components/AppShell";
import {
  PageHeader,
  Modal,
  Badge,
  EmptyState,
} from "../components/ui";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  name: "",
  course: "",
  branch: "",
  startDate: "",
  endDate: "",
  timing: "",
  capacity: 30,
  trainer: "",
  status: "upcoming",
};

const statusTone = {
  upcoming: "marigold",
  ongoing: "sage",
  completed: "ink",
  cancelled: "clay",
};

export default function Batches() {
  const { user } = useAuth();

  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [trainers, setTrainers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [batchModal, setBatchModal] =
    useState(false);

  const [editingBatchId, setEditingBatchId] =
    useState(null);

  const [batchForm, setBatchForm] =
    useState(initialForm);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadBatches = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(
        "/academics/batches"
      );

      setBatches(data.batches || []);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not load batches"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadSupportingData = async () => {
    try {
      const [
        coursesResponse,
        branchesResponse,
        trainersResponse,
      ] = await Promise.all([
        api.get("/academics/courses"),
        api.get("/branches"),
        api.get(
          "/users?roles=trainer,staff,admin"
        ),
      ]);

      setCourses(
        coursesResponse.data.courses || []
      );

      setBranches(
        branchesResponse.data.branches || []
      );

      setTrainers(
        trainersResponse.data.users || []
      );
    } catch {
      setCourses([]);
      setBranches([]);
      setTrainers([]);
    }
  };

  useEffect(() => {
    loadBatches();
    loadSupportingData();
  }, []);

  /* =========================================================
     BRANCH OPTIONS
  ========================================================= */

  const branchOptions =
    user?.role === "admin"
      ? branches
      : branches.filter(
          (b) => b._id === user?.branch
        );

  /* =========================================================
     FORM HELPERS
  ========================================================= */

  const resetBatchForm = () => {
    setBatchForm(initialForm);
    setEditingBatchId(null);
  };

  const openCreate = () => {
    resetBatchForm();
    setBatchModal(true);
  };

  const openEdit = (batch) => {
    setBatchForm({
      name: batch.name || "",

      course:
        batch.course?._id ||
        batch.course ||
        "",

      branch:
        batch.branch?._id ||
        batch.branch ||
        "",

      startDate: batch.startDate
        ? batch.startDate.split("T")[0]
        : "",

      endDate: batch.endDate
        ? batch.endDate.split("T")[0]
        : "",

      timing: batch.timing || "",

      capacity:
        batch.capacity || 30,

      trainer:
        batch.trainer?._id ||
        batch.trainer ||
        "",

      status:
        batch.status || "upcoming",
    });

    setEditingBatchId(batch._id);
    setBatchModal(true);
  };

  /* =========================================================
     CREATE / UPDATE
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingBatchId) {
        await api.patch(
          `/academics/batches/${editingBatchId}`,
          batchForm
        );

        toast.success(
          "Batch updated successfully"
        );
      } else {
        await api.post(
          "/academics/batches",
          batchForm
        );

        toast.success(
          "Batch created successfully"
        );
      }

      setBatchModal(false);
      resetBatchForm();

      loadBatches();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not save batch"
      );
    }
  };

  /* =========================================================
     DELETE / CANCEL
  ========================================================= */

  const deleteBatch = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this batch?"
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/academics/batches/${id}`
      );

      toast.success("Batch cancelled");

      loadBatches();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not cancel batch"
      );
    }
  };

  /* =========================================================
     FORM FIELD
  ========================================================= */

  const Field = ({
    label,
    icon: Icon,
    children,
  }) => (
    <div>
      <label
        className="
          flex
          items-center
          gap-1.5

          mb-1.5

          text-[10px]
          uppercase
          tracking-[0.12em]

          font-bold

          text-slate-500
        "
      >
        {Icon && <Icon size={12} />}

        {label}
      </label>

      {children}
    </div>
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <AppShell title="Batches">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <PageHeader
        title="Batches"
        description="Manage batch schedules, trainers, capacity and status."
        action={
          <button
            onClick={openCreate}
            className="
              group

              inline-flex
              items-center
              gap-2

              px-4
              py-2.5

              rounded-xl

              bg-gradient-to-r
              from-violet-600
              to-indigo-600

              text-white
              text-xs
              font-bold

              shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_5px_0_#4338CA,0_10px_20px_rgba(79,70,229,0.18)]

              transition-all
              duration-300

              hover:-translate-y-1
              hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_6px_0_#4338CA,0_14px_25px_rgba(79,70,229,0.25)]

              active:translate-y-[2px]
            "
          >
            <Plus
              size={16}
              className="
                transition-transform
                duration-300
                group-hover:rotate-90
              "
            />

            Add Batch
          </button>
        }
      />


      {/* =====================================================
          SUMMARY PILLS
      ===================================================== */}

      {!loading && batches.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-5">

          <span
            className="
              inline-flex
              items-center
              gap-1.5

              px-2.5
              py-1

              rounded-full

              bg-violet-50
              border border-violet-100

              text-violet-600
              text-[10px]
              font-bold
            "
          >
            <Activity size={11} />

            {batches.length}{" "}
            {batches.length === 1
              ? "Batch"
              : "Batches"}
          </span>

          <span
            className="
              inline-flex
              items-center
              gap-1.5

              px-2.5
              py-1

              rounded-full

              bg-emerald-50
              border border-emerald-100

              text-emerald-600
              text-[10px]
              font-bold
            "
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

            Active Schedule
          </span>

        </div>
      )}


      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (

        <div
          className="
            min-h-[320px]

            rounded-2xl

            bg-white
            border border-slate-200

            flex
            flex-col
            items-center
            justify-center

            shadow-[0_5px_20px_rgba(30,20,80,0.045)]
          "
        >
          <div
            className="
              h-12
              w-12
              rounded-2xl

              bg-violet-50
              border border-violet-100

              flex
              items-center
              justify-center

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
            Loading batches...
          </p>

          <p className="text-[10px] text-slate-400 mt-1">
            Please wait a moment
          </p>
        </div>

      ) : batches.length === 0 ? (

        <EmptyState
          title="No Batches Yet"
          description="Create your first batch to start assigning students and trainers."
        />

      ) : (

        /* ===================================================
           TABLE
        =================================================== */

        <div
          className="
            relative
            overflow-hidden

            rounded-2xl

            bg-white

            border border-slate-200/80

            shadow-[0_6px_25px_rgba(30,20,80,0.055)]
          "
        >

          {/* Table header */}
          <div
            className="
              flex
              items-center
              justify-between

              px-5
              py-4

              border-b
              border-slate-100

              bg-gradient-to-r
              from-slate-50
              to-white
            "
          >

            <div className="flex items-center gap-2">

              <div
                className="
                  h-9
                  w-9

                  rounded-xl

                  bg-gradient-to-br
                  from-violet-500
                  to-indigo-600

                  text-white

                  flex
                  items-center
                  justify-center

                  shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_4px_9px_rgba(79,70,229,0.2)]
                "
              >
                <CalendarDays size={16} />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900">
                  Batch Schedule
                </p>

                <p className="text-[10px] text-slate-400">
                  Courses, trainers and timings
                </p>
              </div>

            </div>

          </div>


          {/* Scrollable table */}
          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>

                <tr
                  className="
                    text-left

                    text-[9px]
                    uppercase
                    tracking-[0.12em]

                    text-slate-400

                    border-b
                    border-slate-100

                    bg-slate-50/60
                  "
                >

                  <th className="px-5 py-3">
                    Batch
                  </th>

                  <th className="px-5 py-3">
                    Course
                  </th>

                  <th className="px-5 py-3">
                    Trainer
                  </th>

                  <th className="px-5 py-3">
                    Timing
                  </th>

                  <th className="px-5 py-3">
                    Start Date
                  </th>

                  <th className="px-5 py-3">
                    Capacity
                  </th>

                  <th className="px-5 py-3">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {batches.map((batch, index) => (

                  <tr
                    key={batch._id}
                    className="
                      group

                      border-b
                      border-slate-100

                      last:border-0

                      transition-colors
                      duration-200

                      hover:bg-violet-50/30
                    "
                  >

                    {/* Batch */}
                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div
                          className="
                            h-9
                            w-9
                            shrink-0

                            rounded-xl

                            bg-violet-50
                            border border-violet-100

                            text-violet-600

                            flex
                            items-center
                            justify-center

                            transition-all
                            duration-200

                            group-hover:bg-violet-100
                            group-hover:scale-105
                          "
                        >
                          <GraduationCap size={15} />
                        </div>

                        <div className="min-w-0">

                          <p
                            className="
                              font-semibold
                              text-slate-800
                              truncate
                              max-w-[180px]
                            "
                          >
                            {batch.name}
                          </p>

                          <p className="text-[9px] text-slate-400 mt-0.5">
                            #{String(index + 1).padStart(2, "0")}
                          </p>

                        </div>

                      </div>

                    </td>


                    {/* Course */}
                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2">

                        <BookIcon />

                        <span className="text-xs font-medium text-slate-600">
                          {batch.course?.name ||
                            "—"}
                        </span>

                      </div>

                    </td>


                    {/* Trainer */}
                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2">

                        <UserRound
                          size={14}
                          className="text-slate-400"
                        />

                        <span className="text-xs text-slate-600">
                          {batch.trainer?.name ||
                            "Not Assigned"}
                        </span>

                      </div>

                    </td>


                    {/* Timing */}
                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2">

                        <Clock3
                          size={14}
                          className="text-slate-400"
                        />

                        <span className="text-xs text-slate-600 whitespace-nowrap">
                          {batch.timing || "—"}
                        </span>

                      </div>

                    </td>


                    {/* Date */}
                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2">

                        <CalendarDays
                          size={14}
                          className="text-slate-400"
                        />

                        <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                          {batch.startDate
                            ? new Date(
                                batch.startDate
                              ).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "—"}
                        </span>

                      </div>

                    </td>


                    {/* Capacity */}
                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2">

                        <Users
                          size={14}
                          className="text-slate-400"
                        />

                        <span className="text-xs font-bold text-slate-700">
                          {batch.capacity || 0}
                        </span>

                      </div>

                    </td>


                    {/* Status */}
                    <td className="px-5 py-4">

                      <Badge
                        tone={
                          statusTone[
                            batch.status
                          ] || "ink"
                        }
                      >
                        {batch.status ||
                          "unknown"}
                      </Badge>

                    </td>


                    {/* Actions */}
                    <td className="px-5 py-4">

                      <div className="flex justify-end gap-1.5">

                        <button
                          onClick={() =>
                            openEdit(batch)
                          }
                          title="Edit Batch"
                          className="
                            h-8
                            w-8

                            rounded-lg

                            bg-slate-50
                            border border-slate-200

                            flex
                            items-center
                            justify-center

                            text-slate-500

                            transition-all
                            duration-200

                            hover:bg-violet-50
                            hover:border-violet-200
                            hover:text-violet-600
                            hover:-translate-y-0.5
                          "
                        >
                          <Pencil size={13} />
                        </button>


                        <button
                          onClick={() =>
                            deleteBatch(
                              batch._id
                            )
                          }
                          title="Cancel Batch"
                          className="
                            h-8
                            w-8

                            rounded-lg

                            bg-slate-50
                            border border-slate-200

                            flex
                            items-center
                            justify-center

                            text-slate-400

                            transition-all
                            duration-200

                            hover:bg-red-50
                            hover:border-red-200
                            hover:text-red-500
                            hover:-translate-y-0.5
                          "
                        >
                          <Trash2 size={13} />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>
      )}


      {/* =====================================================
          BATCH MODAL
      ===================================================== */}

      <Modal
        open={batchModal}
        wide
        onClose={() => {
          setBatchModal(false);
          resetBatchForm();
        }}
        title={
          editingBatchId
            ? "Edit Batch"
            : "Create Batch"
        }
      >

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* Intro */}
          <div
            className="
              rounded-xl

              bg-violet-50
              border border-violet-100

              px-4
              py-3
            "
          >

            <p className="text-[11px] font-bold text-violet-700">
              {editingBatchId
                ? "Update batch schedule"
                : "Create a new batch"}
            </p>

            <p className="text-[10px] text-violet-500/70 mt-0.5">
              Assign the course, branch, trainer and schedule for this batch.
            </p>

          </div>


          {/* Name */}
          <Field
            label="Batch Name"
            icon={GraduationCap}
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
              placeholder="e.g. Full Stack Morning Batch"
              value={batchForm.name}
              onChange={(e) =>
                setBatchForm({
                  ...batchForm,
                  name: e.target.value,
                })
              }
            />
          </Field>


          {/* Course + Branch */}
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              gap-4
            "
          >

            <Field
              label="Course"
              icon={GraduationCap}
            >
              <select
                className="
                  input
                  !rounded-xl

                  focus:!border-violet-400
                  focus:!ring-2
                  focus:!ring-violet-100
                "
                required
                value={batchForm.course}
                onChange={(e) =>
                  setBatchForm({
                    ...batchForm,
                    course: e.target.value,
                  })
                }
              >
                <option value="">
                  Select course
                </option>

                {courses.map((course) => (
                  <option
                    key={course._id}
                    value={course._id}
                  >
                    {course.name}
                  </option>
                ))}
              </select>
            </Field>


            {(user?.role === "admin" ||
              !editingBatchId) && (
              <Field
                label="Branch"
                icon={Building2}
              >
                <select
                  className="
                    input
                    !rounded-xl

                    focus:!border-violet-400
                    focus:!ring-2
                    focus:!ring-violet-100
                  "
                  required
                  value={batchForm.branch}
                  onChange={(e) =>
                    setBatchForm({
                      ...batchForm,
                      branch: e.target.value,
                    })
                  }
                >
                  <option value="">
                    Select branch
                  </option>

                  {branchOptions.map(
                    (branch) => (
                      <option
                        key={branch._id}
                        value={branch._id}
                      >
                        {branch.name}
                      </option>
                    )
                  )}
                </select>
              </Field>
            )}

          </div>


          {/* Trainer */}
          <Field
            label="Trainer"
            icon={UserRound}
          >
            <select
              className="
                input
                !rounded-xl

                focus:!border-violet-400
                focus:!ring-2
                focus:!ring-violet-100
              "
              value={batchForm.trainer}
              onChange={(e) =>
                setBatchForm({
                  ...batchForm,
                  trainer: e.target.value,
                })
              }
            >

              <option value="">
                Assign a trainer
              </option>

              {trainers.map((trainer) => (
                <option
                  key={trainer._id}
                  value={trainer._id}
                >
                  {trainer.name}
                </option>
              ))}

            </select>

            <p className="text-[10px] text-slate-400 mt-1.5">
              Trainers are users with trainer, staff or admin roles.
            </p>

          </Field>


          {/* Dates */}
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              gap-4
            "
          >

            <Field
              label="Start Date"
              icon={CalendarDays}
            >
              <input
                type="date"
                required
                className="
                  input
                  !rounded-xl

                  focus:!border-violet-400
                  focus:!ring-2
                  focus:!ring-violet-100
                "
                value={batchForm.startDate}
                onChange={(e) =>
                  setBatchForm({
                    ...batchForm,
                    startDate:
                      e.target.value,
                  })
                }
              />
            </Field>


            <Field
              label="End Date"
              icon={CalendarDays}
            >
              <input
                type="date"
                className="
                  input
                  !rounded-xl

                  focus:!border-violet-400
                  focus:!ring-2
                  focus:!ring-violet-100
                "
                value={batchForm.endDate}
                onChange={(e) =>
                  setBatchForm({
                    ...batchForm,
                    endDate:
                      e.target.value,
                  })
                }
              />
            </Field>

          </div>


          {/* Timing */}
          <Field
            label="Timing"
            icon={Clock3}
          >
            <input
              className="
                input
                !rounded-xl

                focus:!border-violet-400
                focus:!ring-2
                focus:!ring-violet-100
              "
              placeholder="Mon-Fri, 5:00 PM - 6:30 PM"
              value={batchForm.timing}
              onChange={(e) =>
                setBatchForm({
                  ...batchForm,
                  timing: e.target.value,
                })
              }
            />
          </Field>


          {/* Capacity + Status */}
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              gap-4
            "
          >

            <Field
              label="Capacity"
              icon={Users}
            >
              <input
                type="number"
                min="1"
                className="
                  input
                  !rounded-xl

                  focus:!border-violet-400
                  focus:!ring-2
                  focus:!ring-violet-100
                "
                value={batchForm.capacity}
                onChange={(e) =>
                  setBatchForm({
                    ...batchForm,
                    capacity:
                      parseInt(
                        e.target.value
                      ) || 30,
                  })
                }
              />
            </Field>


            <Field
              label="Status"
              icon={Activity}
            >
              <select
                className="
                  input
                  !rounded-xl

                  focus:!border-violet-400
                  focus:!ring-2
                  focus:!ring-violet-100
                "
                value={batchForm.status}
                onChange={(e) =>
                  setBatchForm({
                    ...batchForm,
                    status: e.target.value,
                  })
                }
              >

                <option value="upcoming">
                  Upcoming
                </option>

                <option value="ongoing">
                  Ongoing
                </option>

                <option value="completed">
                  Completed
                </option>

                <option value="cancelled">
                  Cancelled
                </option>

              </select>
            </Field>

          </div>


          {/* Submit */}
          <button
            type="submit"
            className="
              group

              w-full
              h-12

              rounded-xl

              flex
              items-center
              justify-center
              gap-2

              bg-gradient-to-r
              from-violet-600
              to-indigo-600

              text-white
              text-sm
              font-bold

              shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_5px_0_#4338CA,0_10px_20px_rgba(79,70,229,0.18)]

              transition-all
              duration-300

              hover:-translate-y-0.5

              active:translate-y-[2px]
            "
          >

            {editingBatchId ? (
              <>
                <Pencil size={15} />
                Update Batch
              </>
            ) : (
              <>
                <Plus
                  size={16}
                  className="
                    transition-transform
                    group-hover:rotate-90
                  "
                />

                Create Batch
              </>
            )}

            <ArrowUpRight
              size={15}
              className="
                transition-transform
                group-hover:translate-x-0.5
                group-hover:-translate-y-0.5
              "
            />

          </button>

        </form>

      </Modal>

    </AppShell>
  );
}


/* =========================================================
   SMALL COURSE ICON
========================================================= */

function BookIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-slate-400 shrink-0"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  );
}

