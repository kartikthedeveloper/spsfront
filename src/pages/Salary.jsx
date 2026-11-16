import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import toast from 'react-hot-toast';

import {
  Plus,
  FileBarChart,
  CheckCircle2,
  Clock3,
  RefreshCw,
} from 'lucide-react';

import AppShell from '../components/AppShell';

import {
  PageHeader,
  EmptyState,
  Modal,
} from '../components/ui';

import api from '../api/axios';

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const currentYear = new Date().getFullYear();
const initialForm = {
  staff: '',
  month: new Date().getMonth() + 1,
  year: currentYear,
  baseSalary: '',
  kpiScore: 100,
  deductions: 0,
};

const money = (value) =>
  '₹' +
  Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  });

export default function Salary() {
  const [salaries, setSalaries] = useState([]);
  const [staffList, setStaffList] = useState([]);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState(initialForm);

  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [report, setReport] = useState(null);

  const selectedStaff = staffList.find(
    (staff) => staff._id === form.staff
  );

  const baseSalary = Number(form.baseSalary || 0);

  const preview = useMemo(() => {
    const adjustment = Math.round(
      baseSalary *
      ((Number(form.kpiScore || 0) - 100) * 0.005)
    );

    const deductions = Number(form.deductions || 0);

    return {
      adjustment,
      net: Math.max(
        0,
        baseSalary + adjustment - deductions
      ),
    };
  }, [baseSalary, form.kpiScore, form.deductions]);

  const loadStaff = useCallback(async () => {
    try {
      const { data } = await api.get('/staff', {
        params: { isActive: true },
      });

      setStaffList(data.staff || []);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Could not load staff list'
      );
    }
  }, []);

  const loadSalaries = useCallback(async () => {
    setLoading(true);

    try {
      const params = {
        year: filterYear,
        ...(filterMonth ? { month: filterMonth } : {}),
        ...(filterStaff ? { staff: filterStaff } : {}),
        ...(filterStatus ? { status: filterStatus } : {}),
      };

      const { data } = await api.get('/salaries', {
        params,
      });

      setSalaries(data.salaries || []);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Could not load salary records'
      );
    } finally {
      setLoading(false);
    }
  }, [
    filterYear,
    filterMonth,
    filterStaff,
    filterStatus,
  ]);

  const loadReport = useCallback(async () => {
    try {
      const params = {
        year: filterYear,
        ...(filterStaff ? { staff: filterStaff } : {}),
      };

      // Correct backend endpoint: /api/salaries/report
      const { data } = await api.get(
        '/salaries/report',
        { params }
      );

      setReport(data);
    } catch (err) {
      setReport(null);

      toast.error(
        err.response?.data?.message ||
        'Could not load yearly report'
      );
    }
  }, [filterYear, filterStaff]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    loadSalaries();
  }, [loadSalaries]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const submit = async (e) => {
    e.preventDefault();

    try {
      if (!form.staff || !form.month || !form.year) {
        toast.error("Please select staff, month and year");
        return;
      }

      const baseSalary = Number(form.baseSalary);
      const deductions = Number(form.deductions || 0);
      const kpiScore = Number(form.kpiScore ?? 100);

      if (!Number.isFinite(baseSalary) || baseSalary <= 0) {
        toast.error("Please enter a valid Base Salary");
        return;
      }

      if (!Number.isFinite(deductions) || deductions < 0) {
        toast.error("Deductions cannot be negative");
        return;
      }

      if (!Number.isFinite(kpiScore) || kpiScore < 0 || kpiScore > 100) {
        toast.error("KPI Score must be between 0 and 100");
        return;
      }

      await api.post("/salaries", {
        staff: form.staff,
        month: Number(form.month),
        year: Number(form.year),
        baseSalary,
        kpiScore,
        deductions,
      });

      toast.success("Salary generated successfully");

      setForm({
        staff: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        baseSalary: "",
        kpiScore: 100,
        deductions: 0,
      });

      fetchSalaries();
      fetchReport();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to generate salary"
      );
    }
  };
  const markPaid = async (id) => {
    if (!window.confirm('Mark this salary as paid?')) {
      return;
    }

    try {
      await api.patch(`/salaries/${id}/pay`);

      toast.success('Salary marked as paid');

      await Promise.all([
        loadSalaries(),
        loadReport(),
      ]);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Could not update payment status'
      );
    }
  };

  return (
    <AppShell title="Salary Management">
      <PageHeader
        title="Salary Management"
        description="Generate monthly salaries, track payments and review yearly reports."
        action={
          <button
            type="button"
            className="btn-accent inline-flex items-center gap-2"
            onClick={() => setOpen(true)}
            disabled={!staffList.length}
          >
            <Plus size={16} />
            Generate Salary
          </button>
        }
      />

      {/* Salary filters */}
      <div className="card mb-5 grid grid-cols-1 gap-3 p-4 md:grid-cols-4">
        <div>
          <label className="label" htmlFor="filter-year">
            Year
          </label>

          <input
            id="filter-year"
            className="input"
            type="number"
            min="2000"
            max="2100"
            value={filterYear}
            onChange={(e) =>
              setFilterYear(Number(e.target.value))
            }
          />
        </div>

        <div>
          <label className="label" htmlFor="filter-month">
            Month
          </label>

          <select
            id="filter-month"
            className="input"
            value={filterMonth}
            onChange={(e) =>
              setFilterMonth(e.target.value)
            }
          >
            <option value="">All months</option>

            {monthNames.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="filter-staff">
            Staff
          </label>

          <select
            id="filter-staff"
            className="input"
            value={filterStaff}
            onChange={(e) =>
              setFilterStaff(e.target.value)
            }
          >
            <option value="">All staff</option>

            {staffList.map((staff) => (
              <option key={staff._id} value={staff._id}>
                {staff.name} ({staff.employeeId})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="filter-status">
            Payment Status
          </label>

          <select
            id="filter-status"
            className="input"
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value)
            }
          >
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Yearly report */}
      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <FileBarChart size={20} />
        Yearly Salary Report — {filterYear}
      </h3>

      {report && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              [
                'Total Generated',
                report.totals?.totalGenerated,
              ],
              [
                'Total Paid',
                report.totals?.paidAmount,
              ],
              [
                'Total Pending',
                report.totals?.pendingAmount,
              ],
              [
                'Salary Records',
                report.totals?.records,
              ],
            ].map(([label, value]) => (
              <div className="card p-4" key={label}>
                <div className="text-sm text-ink-600">
                  {label}
                </div>

                <div className="mt-2 text-xl font-bold">
                  {label === 'Salary Records'
                    ? Number(value || 0)
                    : money(value)}
                </div>
              </div>
            ))}
          </div>

          <div className="card mb-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase">
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3">Generated</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Pending</th>
                  <th className="px-4 py-3">Records</th>
                </tr>
              </thead>

              <tbody>
                {(report.months || []).map((month) => (
                  <tr
                    key={month.month}
                    className="border-b last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      {monthNames[month.month - 1]}
                    </td>

                    <td className="px-4 py-3">
                      {money(month.totalGenerated)}
                    </td>

                    <td className="px-4 py-3">
                      {money(month.paidAmount)}
                    </td>

                    <td className="px-4 py-3">
                      {money(month.pendingAmount)}
                    </td>

                    <td className="px-4 py-3">
                      {month.records}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Salary records */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">
          Salary Records
        </h3>

        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-2"
          onClick={() =>
            Promise.all([
              loadSalaries(),
              loadReport(),
            ])
          }
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="card p-6 text-center text-sm text-ink-600">
          Loading salary records…
        </div>
      ) : salaries.length === 0 ? (
        <EmptyState
          title="No salary records found"
          description="Change the filters or generate a salary for an active staff member."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase">
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Base</th>
                <th className="px-4 py-3">KPI Adjustment</th>
                <th className="px-4 py-3">Deductions</th>
                <th className="px-4 py-3">Net Salary</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {salaries.map((salary) => (
                <tr
                  key={salary._id}
                  className="border-b last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {salary.staff?.name || 'Unknown staff'}
                    </div>

                    <div className="text-xs text-ink-600">
                      {salary.staff?.employeeId ||
                        'No employee ID'}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {monthNames[salary.month - 1] || 'Unknown'}{' '}
                    {salary.year}
                  </td>

                  <td className="px-4 py-3">
                    {money(salary.baseSalary)}
                  </td>

                  <td className="px-4 py-3">
                    {money(salary.kpiAdjustment)}
                  </td>

                  <td className="px-4 py-3">
                    {money(salary.deductions)}
                  </td>

                  <td className="px-4 py-3 font-semibold">
                    {money(salary.netSalary)}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${salary.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                        }`}
                    >
                      {salary.status === 'paid' ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <Clock3 size={13} />
                      )}

                      {salary.status === 'paid'
                        ? 'Paid'
                        : 'Pending'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {salary.status === 'pending' ? (
                      <button
                        type="button"
                        className="btn-secondary inline-flex items-center gap-2 whitespace-nowrap"
                        onClick={() => markPaid(salary._id)}
                      >
                        <CheckCircle2 size={15} />
                        Mark Paid
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700">
                        <CheckCircle2 size={14} />
                        Completed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Generate salary modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Generate Monthly Salary"
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="salary-staff">
              Select Staff
            </label>

            <select
              id="salary-staff"
              className="input"
              value={form.staff}
              onChange={(e) => {
                const staffId = e.target.value;

                const staffMember = staffList.find(
                  (staff) => staff._id === staffId
                );

                setForm((prev) => ({
                  ...prev,
                  staff: staffId,
                  baseSalary:
                    staffMember?.monthlySalary != null
                      ? String(staffMember.monthlySalary)
                      : '',
                }));
              }}
              required
            >
              <option value="">Choose staff member</option>

              {staffList.map((staff) => (
                <option key={staff._id} value={staff._id}>
                  {staff.name} — {staff.employeeId}
                </option>
              ))}
            </select>
          </div>

          {selectedStaff && (
            <div>
              <label className="label" htmlFor="base-salary">
                Base Salary (₹)
              </label>

              <input
                id="base-salary"
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter base salary"
                value={form.baseSalary}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    baseSalary: e.target.value,
                  }))
                }
                required
              />

              <p className="mt-1 text-xs text-ink-600">
                {selectedStaff.monthlySalary
                  ? `Saved monthly salary: ₹${Number(
                    selectedStaff.monthlySalary
                  ).toLocaleString('en-IN')}. You can change it for this salary record.`
                  : 'No saved salary found. Enter the base salary manually.'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="salary-month">
                Month
              </label>

              <select
                id="salary-month"
                className="input"
                value={form.month}
                onChange={(e) =>
                  setForm({
                    ...form,
                    month: Number(e.target.value),
                  })
                }
              >
                {monthNames.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="salary-year">
                Year
              </label>

              <input
                id="salary-year"
                className="input"
                type="number"
                min="2000"
                max="2100"
                value={form.year}
                onChange={(e) =>
                  setForm({
                    ...form,
                    year: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="kpi-score">
              KPI Score (100 = no adjustment)
            </label>

            <input
              id="kpi-score"
              className="input"
              type="number"
              min="0"
              max="200"
              step="1"
              value={form.kpiScore}
              onChange={(e) =>
                setForm({
                  ...form,
                  kpiScore: e.target.value,
                })
              }
              required
            />

            <p className="mt-1 text-xs text-ink-600">
              Each point above or below 100 changes base salary by 0.5%.
            </p>
          </div>

          <div>
            <label
              className="label"
              htmlFor="salary-deductions"
            >
              Deductions (₹)
            </label>

            <input
              id="salary-deductions"
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={form.deductions}
              onChange={(e) =>
                setForm({
                  ...form,
                  deductions: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex justify-between">
              <span>Base Salary</span>
              <span>{money(baseSalary)}</span>
            </div>

            <div className="mt-2 flex justify-between">
              <span>KPI Adjustment</span>
              <span>{money(preview.adjustment)}</span>
            </div>

            <div className="mt-2 flex justify-between">
              <span>Deductions</span>
              <span>{money(form.deductions)}</span>
            </div>

            <div className="mt-3 flex justify-between border-t pt-3 font-bold">
              <span>Estimated Net Salary</span>
              <span>{money(preview.net)}</span>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary inline-flex w-full items-center justify-center gap-2"
            disabled={saving || !selectedStaff}
          >
            <Plus size={16} />
            {saving ? 'Generating…' : 'Generate Salary'}
          </button>
        </form>
      </Modal>
    </AppShell>
  );
}
