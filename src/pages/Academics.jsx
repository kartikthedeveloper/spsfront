import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import AppShell from '../components/AppShell';
import { PageHeader, Modal, Badge, EmptyState } from '../components/ui';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Academics() {
  const { user } = useAuth();
  const [tab, setTab] = useState('courses');

  // Data states
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [branches, setBranches] = useState([]);
  const [trainers, setTrainers] = useState([]); // for batch trainer dropdown

  // Modal & form states
  const [courseModal, setCourseModal] = useState(false);
  const [batchModal, setBatchModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editingBatchId, setEditingBatchId] = useState(null);

  // Form data
  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    durationMonths: 1,
    branch: '',
    description: '',
  });
  const [batchForm, setBatchForm] = useState({
    name: '',
    course: '',
    branch: '',
    startDate: '',
    endDate: '',
    timing: '',
    capacity: 30,
    trainer: '',
    status: 'upcoming',
  });

  // Load all data
  const load = () => {
    api.get('/academics/courses').then(({ data }) => setCourses(data.courses));
    api.get('/academics/batches').then(({ data }) => setBatches(data.batches));
    api.get('/branches').then(({ data }) => setBranches(data.branches));
    // Fetch trainers (users with role 'trainer' or 'staff')
    // If you have a dedicated /users endpoint, use it; otherwise adjust
    api
      .get('/users?roles=trainer,staff,admin')
      .then(({ data }) => setTrainers(data.users || []))
      .catch(() => setTrainers([]));
  };
  useEffect(load, []);

  // ---------- Course Handlers ----------
  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourseId) {
        await api.patch(`/academics/courses/${editingCourseId}`, courseForm);
        toast.success('Course updated');
      } else {
        await api.post('/academics/courses', courseForm);
        toast.success('Course created');
      }
      setCourseModal(false);
      resetCourseForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save course');
    }
  };

  const deleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to archive this course?')) return;
    try {
      await api.delete(`/academics/courses/${id}`);
      toast.success('Course archived');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete course');
    }
  };

  const resetCourseForm = () => {
    setCourseForm({
      name: '',
      code: '',
      durationMonths: 1,
      branch: '',
      description: '',
    });
    setEditingCourseId(null);
  };

  const openEditCourse = (course) => {
    setCourseForm({
      name: course.name,
      code: course.code || '',
      durationMonths: course.durationMonths,
      branch: course.branch?._id || course.branch,
      description: course.description || '',
    });
    setEditingCourseId(course._id);
    setCourseModal(true);
  };

  // ---------- Batch Handlers ----------
  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBatchId) {
        await api.patch(`/academics/batches/${editingBatchId}`, batchForm);
        toast.success('Batch updated');
      } else {
        await api.post('/academics/batches', batchForm);
        toast.success('Batch created');
      }
      setBatchModal(false);
      resetBatchForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save batch');
    }
  };

  const deleteBatch = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this batch?')) return;
    try {
      await api.delete(`/academics/batches/${id}`);
      toast.success('Batch cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete batch');
    }
  };

  const resetBatchForm = () => {
    setBatchForm({
      name: '',
      course: '',
      branch: '',
      startDate: '',
      endDate: '',
      timing: '',
      capacity: 30,
      trainer: '',
      status: 'upcoming',
    });
    setEditingBatchId(null);
  };

  const openEditBatch = (batch) => {
    setBatchForm({
      name: batch.name,
      course: batch.course?._id || batch.course,
      branch: batch.branch?._id || batch.branch,
      startDate: batch.startDate ? batch.startDate.split('T')[0] : '',
      endDate: batch.endDate ? batch.endDate.split('T')[0] : '',
      timing: batch.timing || '',
      capacity: batch.capacity || 30,
      trainer: batch.trainer?._id || batch.trainer || '',
      status: batch.status || 'upcoming',
    });
    setEditingBatchId(batch._id);
    setBatchModal(true);
  };

  const statusTone = {
    upcoming: 'marigold',
    ongoing: 'sage',
    completed: 'ink',
    cancelled: 'clay',
  };

  // Determine branch options for forms
  const branchOptions =
    user.role === 'admin'
      ? branches
      : branches.filter((b) => b._id === user.branch);

  return (
    <AppShell title="Courses & Batches">
      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('courses')}
          className={`btn ${
            tab === 'courses'
              ? 'bg-ink-800 text-white'
              : 'bg-white border border-ink-100 text-ink-700'
          }`}
        >
          Courses
        </button>
        <button
          onClick={() => setTab('batches')}
          className={`btn ${
            tab === 'batches'
              ? 'bg-ink-800 text-white'
              : 'bg-white border border-ink-100 text-ink-700'
          }`}
        >
          Batches
        </button>
      </div>

      {/* ===== COURSES TAB ===== */}
      {tab === 'courses' && (
        <>
          <PageHeader
            title="Courses"
            description="Course catalog per branch."
            action={
              <button
                className="btn-accent"
                onClick={() => {
                  resetCourseForm();
                  setCourseModal(true);
                }}
              >
                <Plus size={16} /> Add Course
              </button>
            }
          />
          {courses.length === 0 ? (
            <EmptyState
              title="No courses yet"
              description="Add a course to start creating batches and fee structures."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {courses.map((c) => (
                <div key={c._id} className="card p-5 relative">
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button
                      onClick={() => openEditCourse(c)}
                      className="p-1 text-ink-500 hover:text-ink-800"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteCourse(c._id)}
                      className="p-1 text-ink-500 hover:text-rose-600"
                      title="Archive"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="font-semibold text-ink-950">{c.name}</p>
                  {c.code && (
                    <p className="text-xs text-ink-500 mt-0.5">Code: {c.code}</p>
                  )}
                  <p className="text-xs text-ink-600 mt-1">{c.branch?.name}</p>
                  <p className="text-sm text-ink-700 mt-2">
                    {c.durationMonths} month(s)
                  </p>
                  {c.description && (
                    <p className="text-xs text-ink-600 mt-2 line-clamp-2">
                      {c.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== BATCHES TAB ===== */}
      {tab === 'batches' && (
        <>
          <PageHeader
            title="Batches"
            description="Timing, trainer and capacity per batch."
            action={
              <button
                className="btn-accent"
                onClick={() => {
                  resetBatchForm();
                  setBatchModal(true);
                }}
              >
                <Plus size={16} /> Add Batch
              </button>
            }
          />
          {batches.length === 0 ? (
            <EmptyState
              title="No batches yet"
              description="Create a batch to start assigning students."
            />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-ink-600 border-b border-ink-100">
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Trainer</th>
                    <th className="px-4 py-3">Timing</th>
                    <th className="px-4 py-3">Start Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => (
                    <tr key={b._id} className="border-b border-ink-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-ink-950">{b.name}</td>
                      <td className="px-4 py-3 text-ink-700">{b.course?.name}</td>
                      <td className="px-4 py-3 text-ink-700">
                        {b.trainer?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-ink-700">{b.timing || '—'}</td>
                      <td className="px-4 py-3 text-ink-700">
                        {new Date(b.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone[b.status] || 'ink'}>
                          {b.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEditBatch(b)}
                          className="p-1 text-ink-500 hover:text-ink-800 mr-2"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => deleteBatch(b._id)}
                          className="p-1 text-ink-500 hover:text-rose-600"
                          title="Cancel"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ===== COURSE MODAL (Create / Edit) ===== */}
      <Modal
        open={courseModal}
        onClose={() => {
          setCourseModal(false);
          resetCourseForm();
        }}
        title={editingCourseId ? 'Edit Course' : 'Add Course'}
      >
        <form onSubmit={handleCourseSubmit} className="space-y-3">
          <div>
            <label className="label">Course Name</label>
            <input
              className="input"
              required
              value={courseForm.name}
              onChange={(e) =>
                setCourseForm({ ...courseForm, name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Course Code</label>
            <input
              className="input"
              value={courseForm.code}
              onChange={(e) =>
                setCourseForm({ ...courseForm, code: e.target.value.toUpperCase() })
              }
              placeholder="e.g. PYTHON101"
            />
          </div>
          {(user.role === 'admin' || !editingCourseId) && (
            <div>
              <label className="label">Branch</label>
              <select
                className="input"
                required
                value={courseForm.branch}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, branch: e.target.value })
                }
              >
                <option value="">Select branch</option>
                {branchOptions.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Duration (months)</label>
            <input
              type="number"
              className="input"
              min="1"
              value={courseForm.durationMonths}
              onChange={(e) =>
                setCourseForm({
                  ...courseForm,
                  durationMonths: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              value={courseForm.description}
              onChange={(e) =>
                setCourseForm({ ...courseForm, description: e.target.value })
              }
            />
          </div>
          <button className="btn-primary w-full mt-2">
            {editingCourseId ? 'Update Course' : 'Create Course'}
          </button>
        </form>
      </Modal>

      {/* ===== BATCH MODAL (Create / Edit) ===== */}
      <Modal
        open={batchModal}
        onClose={() => {
          setBatchModal(false);
          resetBatchForm();
        }}
        title={editingBatchId ? 'Edit Batch' : 'Add Batch'}
      >
        <form onSubmit={handleBatchSubmit} className="space-y-3">
          <div>
            <label className="label">Batch Name</label>
            <input
              className="input"
              required
              value={batchForm.name}
              onChange={(e) =>
                setBatchForm({ ...batchForm, name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Course</label>
            <select
              className="input"
              required
              value={batchForm.course}
              onChange={(e) =>
                setBatchForm({ ...batchForm, course: e.target.value })
              }
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {(user.role === 'admin' || !editingBatchId) && (
            <div>
              <label className="label">Branch</label>
              <select
                className="input"
                required
                value={batchForm.branch}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, branch: e.target.value })
                }
              >
                <option value="">Select branch</option>
                {branchOptions.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Trainer</label>
            <select
              className="input"
              value={batchForm.trainer}
              onChange={(e) =>
                setBatchForm({ ...batchForm, trainer: e.target.value })
              }
            >
              <option value="">Assign a trainer</option>
              {trainers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-ink-500 mt-1">
              * Trainers are users with role 'trainer' or 'staff'.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input"
                required
                value={batchForm.startDate}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">End Date (optional)</label>
              <input
                type="date"
                className="input"
                value={batchForm.endDate}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, endDate: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="label">Timing</label>
            <input
              className="input"
              placeholder="Mon-Fri, 5:00 PM - 6:30 PM"
              value={batchForm.timing}
              onChange={(e) =>
                setBatchForm({ ...batchForm, timing: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Capacity</label>
              <input
                type="number"
                className="input"
                min="1"
                value={batchForm.capacity}
                onChange={(e) =>
                  setBatchForm({
                    ...batchForm,
                    capacity: parseInt(e.target.value) || 30,
                  })
                }
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={batchForm.status}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, status: e.target.value })
                }
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <button className="btn-primary w-full mt-2">
            {editingBatchId ? 'Update Batch' : 'Create Batch'}
          </button>
        </form>
      </Modal>
    </AppShell>
  );
}
