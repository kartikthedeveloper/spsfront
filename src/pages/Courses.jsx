import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  GraduationCap,
  Building2,
  Clock3,
  Hash,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";

import AppShell from "../components/AppShell";
import {
  PageHeader,
  Modal,
  EmptyState,
} from "../components/ui";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  name: "",
  code: "",
  durationMonths: 1,
  branch: "",
  description: "",
};

export default function Courses() {
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);

  const [courseModal, setCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);

  const [courseForm, setCourseForm] = useState(initialForm);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadCourses = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/academics/courses");

      setCourses(data.courses || []);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not load courses"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const { data } = await api.get("/branches");

      setBranches(data.branches || []);
    } catch {
      setBranches([]);
    }
  };

  useEffect(() => {
    loadCourses();
    loadBranches();
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

  const resetCourseForm = () => {
    setCourseForm(initialForm);
    setEditingCourseId(null);
  };

  const openCreate = () => {
    resetCourseForm();
    setCourseModal(true);
  };

  const openEdit = (course) => {
    setCourseForm({
      name: course.name || "",
      code: course.code || "",
      durationMonths:
        course.durationMonths || 1,
      branch:
        course.branch?._id ||
        course.branch ||
        "",
      description:
        course.description || "",
    });

    setEditingCourseId(course._id);
    setCourseModal(true);
  };

  /* =========================================================
     CREATE / UPDATE
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingCourseId) {
        await api.patch(
          `/academics/courses/${editingCourseId}`,
          courseForm
        );

        toast.success("Course updated successfully");
      } else {
        await api.post(
          "/academics/courses",
          courseForm
        );

        toast.success("Course created successfully");
      }

      setCourseModal(false);
      resetCourseForm();

      loadCourses();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not save course"
      );
    }
  };

  /* =========================================================
     DELETE / ARCHIVE
  ========================================================= */

  const deleteCourse = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to archive this course?"
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/academics/courses/${id}`
      );

      toast.success("Course archived");

      loadCourses();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not archive course"
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
          flex items-center gap-1.5
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
    <AppShell title="Courses">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <PageHeader
        title="Courses"
        description="Manage your institute course catalog and branch-wise courses."
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

            Add Course
          </button>
        }
      />

      {/* =====================================================
          COURSE COUNT
      ===================================================== */}

      {!loading && courses.length > 0 && (
        <div className="flex items-center gap-2 mb-5">

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
            <BookOpen size={11} />

            {courses.length}{" "}
            {courses.length === 1
              ? "Course"
              : "Courses"}
          </span>

          <span className="text-[10px] text-slate-400">
            Available in your institute
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
            Loading courses...
          </p>

          <p className="text-[10px] text-slate-400 mt-1">
            Please wait a moment
          </p>
        </div>

      ) : courses.length === 0 ? (

        <EmptyState
          title="No Courses Yet"
          description="Add your first course to start creating batches and managing students."
        />

      ) : (

        /* ===================================================
           COURSE GRID
        =================================================== */

        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            xl:grid-cols-3
            gap-5
          "
        >
          {courses.map((course, index) => (

            <div
              key={course._id}
              className="
                group
                relative
                overflow-hidden

                rounded-2xl

                bg-white

                border
                border-slate-200/80

                p-5

                shadow-[0_6px_22px_rgba(30,20,80,0.055)]

                transition-all
                duration-300

                hover:-translate-y-1.5
                hover:border-violet-200
                hover:shadow-[0_18px_40px_rgba(30,20,80,0.11)]
              "
            >

              {/* Glow */}
              <div
                className="
                  absolute
                  -right-10
                  -top-10

                  h-28
                  w-28

                  rounded-full

                  bg-violet-500/5
                  blur-2xl

                  transition-all
                  duration-500

                  group-hover:scale-150
                  group-hover:bg-violet-500/10
                "
              />

              {/* =================================================
                  HEADER
              ================================================= */}

              <div
                className="
                  relative
                  flex
                  items-start
                  justify-between
                "
              >

                <div className="flex items-center gap-3 min-w-0">

                  {/* Icon */}
                  <div
                    className="
                      relative

                      h-12
                      w-12
                      shrink-0

                      rounded-xl

                      bg-gradient-to-br
                      from-violet-500
                      via-purple-600
                      to-indigo-700

                      text-white

                      flex
                      items-center
                      justify-center

                      shadow-[inset_0_1px_2px_rgba(255,255,255,0.35),0_4px_0_#4338CA,0_9px_16px_rgba(79,70,229,0.20)]

                      transition-all
                      duration-300

                      group-hover:-translate-y-1
                      group-hover:scale-105
                    "
                  >
                    <GraduationCap size={20} />

                    <span
                      className="
                        absolute
                        inset-0
                        rounded-xl
                        bg-gradient-to-br
                        from-white/20
                        via-transparent
                        to-transparent
                      "
                    />
                  </div>

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
                      {course.name}
                    </h3>

                    {course.code && (
                      <div className="flex items-center gap-1 mt-1">

                        <Hash
                          size={10}
                          className="text-slate-400"
                        />

                        <span
                          className="
                            text-[9px]
                            font-bold
                            uppercase
                            tracking-wide
                            text-slate-400
                          "
                        >
                          {course.code}
                        </span>

                      </div>
                    )}

                  </div>

                </div>


                {/* Number */}
                <span
                  className="
                    h-7
                    w-7

                    rounded-lg

                    bg-slate-50
                    border border-slate-100

                    flex
                    items-center
                    justify-center

                    text-[9px]
                    font-bold
                    text-slate-400
                  "
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

              </div>


              {/* =================================================
                  BRANCH
              ================================================= */}

              <div
                className="
                  relative
                  flex
                  items-center
                  gap-2

                  mt-4

                  rounded-xl

                  bg-violet-50/60
                  border border-violet-100

                  px-3
                  py-2.5
                "
              >

                <div
                  className="
                    h-7
                    w-7

                    rounded-lg

                    bg-white
                    border border-violet-100

                    flex
                    items-center
                    justify-center

                    text-violet-500
                  "
                >
                  <Building2 size={13} />
                </div>

                <div className="min-w-0">

                  <p
                    className="
                      text-[8px]
                      uppercase
                      tracking-wide
                      font-bold
                      text-violet-400
                    "
                  >
                    Branch
                  </p>

                  <p
                    className="
                      text-[11px]
                      font-semibold
                      text-slate-700
                      truncate
                    "
                  >
                    {course.branch?.name ||
                      "Not specified"}
                  </p>

                </div>

              </div>


              {/* =================================================
                  DETAILS
              ================================================= */}

              <div className="relative mt-3">

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    px-1
                    py-1
                  "
                >
                  <Clock3
                    size={14}
                    className="text-slate-400"
                  />

                  <span className="text-[11px] text-slate-500">
                    Duration
                  </span>

                  <span className="ml-auto text-[11px] font-bold text-slate-700">
                    {course.durationMonths}{" "}
                    {course.durationMonths === 1
                      ? "Month"
                      : "Months"}
                  </span>
                </div>

              </div>


              {/* Description */}
              {course.description && (
                <p
                  className="
                    relative

                    mt-3

                    text-[11px]
                    leading-relaxed

                    text-slate-400

                    line-clamp-2
                  "
                >
                  {course.description}
                </p>
              )}


              {/* =================================================
                  FOOTER
              ================================================= */}

              <div
                className="
                  relative

                  mt-4
                  pt-4

                  border-t
                  border-slate-100

                  flex
                  items-center
                  justify-between
                "
              >

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

                    text-[9px]
                    font-bold
                    text-emerald-600
                  "
                >
                  <span
                    className="
                      h-1.5
                      w-1.5
                      rounded-full
                      bg-emerald-500

                      shadow-[0_0_6px_rgba(16,185,129,0.7)]
                    "
                  />

                  Active
                </span>


                <div className="flex items-center gap-1.5">

                  <button
                    onClick={() => openEdit(course)}
                    title="Edit Course"
                    className="
                      h-9
                      w-9

                      rounded-xl

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
                    <Pencil size={14} />
                  </button>


                  <button
                    onClick={() =>
                      deleteCourse(course._id)
                    }
                    title="Archive Course"
                    className="
                      h-9
                      w-9

                      rounded-xl

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
                    <Trash2 size={14} />
                  </button>

                </div>

              </div>


              {/* Bottom indicator */}
              <div
                className="
                  absolute
                  bottom-0
                  left-1/2

                  -translate-x-1/2

                  h-0.5
                  w-0

                  bg-gradient-to-r
                  from-violet-500
                  to-indigo-500

                  transition-all
                  duration-300

                  group-hover:w-1/2
                "
              />

            </div>
          ))}
        </div>
      )}


      {/* =====================================================
          COURSE MODAL
      ===================================================== */}

      <Modal
        open={courseModal}
        wide
        onClose={() => {
          setCourseModal(false);
          resetCourseForm();
        }}
        title={
          editingCourseId
            ? "Edit Course"
            : "Create Course"
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
              {editingCourseId
                ? "Update course information"
                : "Add a new course"}
            </p>

            <p className="text-[10px] text-violet-500/70 mt-0.5">
              Course details will be used while creating batches and managing students.
            </p>
          </div>


          {/* Name + Code */}
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              gap-4
            "
          >

            <Field
              label="Course Name"
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
                placeholder="e.g. Full Stack Web Development"
                value={courseForm.name}
                onChange={(e) =>
                  setCourseForm({
                    ...courseForm,
                    name: e.target.value,
                  })
                }
              />
            </Field>


            <Field
              label="Course Code"
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
                placeholder="e.g. FS101"
                value={courseForm.code}
                onChange={(e) =>
                  setCourseForm({
                    ...courseForm,
                    code: e.target.value.toUpperCase(),
                  })
                }
              />
            </Field>

          </div>


          {/* Branch + Duration */}
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              gap-4
            "
          >

            {(user?.role === "admin" ||
              !editingCourseId) && (
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
                  value={courseForm.branch}
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      branch: e.target.value,
                    })
                  }
                >
                  <option value="">
                    Select branch
                  </option>

                  {branchOptions.map((branch) => (
                    <option
                      key={branch._id}
                      value={branch._id}
                    >
                      {branch.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}


            <Field
              label="Duration (Months)"
              icon={Clock3}
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
                value={courseForm.durationMonths}
                onChange={(e) =>
                  setCourseForm({
                    ...courseForm,
                    durationMonths:
                      parseInt(e.target.value) || 1,
                  })
                }
              />
            </Field>

          </div>


          {/* Description */}
          <Field
            label="Description"
            icon={BookOpen}
          >
            <textarea
              className="
                input
                !rounded-xl
                min-h-[110px]
                resize-none

                focus:!border-violet-400
                focus:!ring-2
                focus:!ring-violet-100
              "
              rows={4}
              placeholder="Describe the course..."
              value={courseForm.description}
              onChange={(e) =>
                setCourseForm({
                  ...courseForm,
                  description: e.target.value,
                })
              }
            />
          </Field>


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
              hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_6px_0_#4338CA,0_14px_25px_rgba(79,70,229,0.25)]

              active:translate-y-[2px]
            "
          >
            {editingCourseId ? (
              <>
                <Pencil size={15} />
                Update Course
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
                Create Course
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
