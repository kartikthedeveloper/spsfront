import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, UserRound, UserX } from 'lucide-react';
import AppShell from '../components/AppShell';
import { PageHeader, EmptyState, Modal } from '../components/ui';
import api from '../api/axios';

const initialForm = {
  employeeId: '',
  name: '',
  email: '',
  phone: '',
  designation: 'Trainer',
  monthlySalary: '',
  joiningDate: new Date().toISOString().slice(0, 10),
  notes: '',
};

const money = (value) =>
  '₹' + Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  });

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/staff', {
        params: {
          search: search || undefined,
          isActive: true,
        },
      });

      setStaff(data.staff || []);
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Could not load staff'
      );
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const update = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    const salary = Number(form.monthlySalary);

    if (!Number.isFinite(salary) || salary < 0) {
      toast.error('Enter a valid monthly salary');
      return;
    }

    setSaving(true);

    try {
      await api.post('/staff', {
        ...form,
        monthlySalary: salary,
      });

      toast.success('Staff created successfully');
      setOpen(false);
      setForm(initialForm);

      await load();
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Could not create staff'
      );
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (id) => {
    if (
      !window.confirm(
        'Deactivate this staff member? Existing salary history will be retained.'
      )
    ) {
      return;
    }

    try {
      await api.delete(`/staff/${id}`);

      toast.success('Staff deactivated');
      await load();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Could not deactivate staff'
      );
    }
  };

  return (
    <AppShell title="Staff Management">
      <PageHeader
        title="Staff Management"
        description="Create employee profiles and manage monthly salary details."
        action={
          <button
            type="button"
            className="btn-accent inline-flex items-center gap-2"
            onClick={() => setOpen(true)}
          >
            <Plus size={16} />
            Add Staff
          </button>
        }
      />

      <div className="card mb-4 flex items-center gap-3 p-3">
        <Search size={18} />

        <input
          className="input"
          aria-label="Search staff"
          placeholder="Search name, employee ID, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {staff.length === 0 ? (
        <EmptyState
          title="No staff found"
          description="Add your first employee to start managing salaries."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Monthly Salary</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {staff.map((item) => (
                <tr
                  key={item._id}
                  className="border-b last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserRound size={18} />

                      <div>
                        <div className="font-medium">
                          {item.name}
                        </div>

                        <div className="text-xs text-ink-600">
                          {item.employeeId}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {item.designation || '—'}
                  </td>

                  <td className="px-4 py-3">
                    {item.phone || '—'}
                  </td>

                  <td className="px-4 py-3 font-medium">
                    {money(item.monthlySalary)}
                  </td>

                  <td className="px-4 py-3">
                    {item.branch?.name || '—'}
                  </td>

                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="btn-secondary inline-flex items-center gap-2 whitespace-nowrap"
                      onClick={() => deactivate(item._id)}
                    >
                      <UserX size={15} />
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add New Staff"
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="employeeId">
              Employee ID
            </label>

            <input
              id="employeeId"
              className="input"
              name="employeeId"
              placeholder="SP-EMP-001"
              value={form.employeeId}
              onChange={update}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="name">
              Full Name
            </label>

            <input
              id="name"
              className="input"
              name="name"
              value={form.name}
              onChange={update}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="email">
              Email
            </label>

            <input
              id="email"
              className="input"
              name="email"
              type="email"
              value={form.email}
              onChange={update}
            />
          </div>

          <div>
            <label className="label" htmlFor="phone">
              Phone
            </label>

            <input
              id="phone"
              className="input"
              name="phone"
              value={form.phone}
              onChange={update}
            />
          </div>

          <div>
            <label className="label" htmlFor="designation">
              Designation
            </label>

            <select
              id="designation"
              className="input"
              name="designation"
              value={form.designation}
              onChange={update}
            >
              <option>Trainer</option>
              <option>Computer Faculty</option>
              <option>Branch Manager</option>
              <option>Accountant</option>
              <option>Receptionist</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="monthlySalary">
              Monthly Salary (₹)
            </label>

            <input
              id="monthlySalary"
              className="input"
              type="number"
              name="monthlySalary"
              min="0"
              step="0.01"
              value={form.monthlySalary}
              onChange={update}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="joiningDate">
              Joining Date
            </label>

            <input
              id="joiningDate"
              className="input"
              type="date"
              name="joiningDate"
              value={form.joiningDate}
              onChange={update}
            />
          </div>

          <div>
            <label className="label" htmlFor="notes">
              Notes
            </label>

            <textarea
              id="notes"
              className="input"
              name="notes"
              value={form.notes}
              onChange={update}
              rows={2}
            />
          </div>

          <button
            type="submit"
            className="btn-primary inline-flex w-full items-center justify-center gap-2"
            disabled={saving}
          >
            <Plus size={16} />
            {saving ? 'Saving…' : 'Create Staff'}
          </button>
        </form>
      </Modal>
    </AppShell>
  );
}
