import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Receipt,
  Pencil,
  Trash2,
  Search,
  X,
  Wallet,
  AlertTriangle,
  RefreshCw,
  Filter,
  IndianRupee,
  CalendarDays,
  Building2,
} from 'lucide-react';

import AppShell from '../components/AppShell';
import {
  PageHeader,
  EmptyState,
  Modal,
  Badge,
} from '../components/ui';

import api from '../api/axios';

const categories = [
  'rent',
  'utilities',
  'salary',
  'marketing',
  'maintenance',
  'supplies',
  'other',
];

const getDefaultExpenseForm = () => ({
  title: '',
  category: 'other',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
  branch: '',
});

const getDefaultBudgetForm = () => ({
  branch: '',
  category: 'other',
  monthlyLimit: '',
});

const formatCurrency = (amount) => {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
};

const formatDate = (date) => {
  if (!date) return '-';

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const capitalize = (value) => {
  if (!value) return '';

  return value.charAt(0).toUpperCase() + value.slice(1);
};

export default function Expenses() {
  // --------------------------------------------------
  // DATA
  // --------------------------------------------------

  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [budgets, setBudgets] = useState([]);

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // --------------------------------------------------
  // EXPENSE MODAL
  // --------------------------------------------------

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [expenseForm, setExpenseForm] = useState(
    getDefaultExpenseForm()
  );

  // --------------------------------------------------
  // DELETE MODAL
  // --------------------------------------------------

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  // --------------------------------------------------
  // BUDGET MODAL
  // --------------------------------------------------

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);

  const [budgetForm, setBudgetForm] = useState(
    getDefaultBudgetForm()
  );

  // --------------------------------------------------
  // FILTERS
  // --------------------------------------------------

  const [filters, setFilters] = useState({
    branch: '',
    category: '',
    from: '',
    to: '',
    search: '',
  });

  // --------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------

  const loadData = async () => {
    try {
      setLoading(true);

      const [expenseRes, branchRes, budgetRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/branches'),
        api.get('/expenses/budgets/all'),
      ]);

      setExpenses(expenseRes.data.expenses || []);
      setBranches(branchRes.data.branches || []);
      setBudgets(budgetRes.data.budgets || []);
    } catch (err) {
      console.error('Expense data loading error:', err);

      toast.error(
        err.response?.data?.message ||
          'Could not load expense data'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --------------------------------------------------
  // BRANCH NAME
  // --------------------------------------------------

  const getBranchName = (branchId) => {
    if (!branchId) return '-';

    const id =
      typeof branchId === 'object'
        ? branchId._id
        : branchId;

    const branch = branches.find(
      (item) => String(item._id) === String(id)
    );

    return branch?.name || 'Unknown Branch';
  };

  // --------------------------------------------------
  // FILTER EXPENSES
  // --------------------------------------------------

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // Branch
      if (
        filters.branch &&
        String(
          typeof expense.branch === 'object'
            ? expense.branch?._id
            : expense.branch
        ) !== String(filters.branch)
      ) {
        return false;
      }

      // Category
      if (
        filters.category &&
        expense.category !== filters.category
      ) {
        return false;
      }

      // From date
      if (filters.from) {
        const expenseDate = new Date(expense.date);
        const fromDate = new Date(filters.from);

        fromDate.setHours(0, 0, 0, 0);

        if (expenseDate < fromDate) {
          return false;
        }
      }

      // To date
      if (filters.to) {
        const expenseDate = new Date(expense.date);
        const toDate = new Date(filters.to);

        toDate.setHours(23, 59, 59, 999);

        if (expenseDate > toDate) {
          return false;
        }
      }

      // Search
      if (filters.search) {
        const search = filters.search.toLowerCase();

        const title = expense.title?.toLowerCase() || '';
        const notes = expense.notes?.toLowerCase() || '';
        const category = expense.category?.toLowerCase() || '';

        if (
          !title.includes(search) &&
          !notes.includes(search) &&
          !category.includes(search)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, filters]);

  // --------------------------------------------------
  // TOTALS
  // --------------------------------------------------

  const totalExpense = useMemo(() => {
    return expenses.reduce(
      (sum, expense) =>
        sum + Number(expense.amount || 0),
      0
    );
  }, [expenses]);

  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce(
      (sum, expense) =>
        sum + Number(expense.amount || 0),
      0
    );
  }, [filteredExpenses]);

  const currentMonthTotal = useMemo(() => {
    const now = new Date();

    return expenses.reduce((sum, expense) => {
      const date = new Date(expense.date);

      if (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      ) {
        return sum + Number(expense.amount || 0);
      }

      return sum;
    }, 0);
  }, [expenses]);

  // --------------------------------------------------
  // MONTHLY BUDGET TOTAL
  // --------------------------------------------------

  const totalMonthlyBudget = useMemo(() => {
    return budgets.reduce(
      (sum, budget) =>
        sum + Number(budget.monthlyLimit || 0),
      0
    );
  }, [budgets]);

  // --------------------------------------------------
  // CATEGORY SPENDING
  // --------------------------------------------------

  const getCategorySpent = (category, branch) => {
    const now = new Date();

    return expenses.reduce((sum, expense) => {
      const date = new Date(expense.date);

      const expenseBranch =
        typeof expense.branch === 'object'
          ? expense.branch?._id
          : expense.branch;

      if (
        expense.category === category &&
        String(expenseBranch) === String(branch) &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      ) {
        return sum + Number(expense.amount || 0);
      }

      return sum;
    }, 0);
  };

  // --------------------------------------------------
  // OPEN ADD EXPENSE
  // --------------------------------------------------

  const openAddExpense = () => {
    setEditingExpense(null);

    setExpenseForm({
      ...getDefaultExpenseForm(),
      branch:
        branches.length === 1
          ? branches[0]._id
          : '',
    });

    setExpenseModalOpen(true);
  };

  // --------------------------------------------------
  // OPEN EDIT EXPENSE
  // --------------------------------------------------

  const openEditExpense = (expense) => {
    setEditingExpense(expense);

    setExpenseForm({
      title: expense.title || '',
      category: expense.category || 'other',
      amount: expense.amount || '',
      date: expense.date
        ? new Date(expense.date)
            .toISOString()
            .slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      notes: expense.notes || '',
      branch:
        typeof expense.branch === 'object'
          ? expense.branch?._id
          : expense.branch || '',
    });

    setExpenseModalOpen(true);
  };

  // --------------------------------------------------
  // SAVE EXPENSE
  // --------------------------------------------------

  const submitExpense = async (e) => {
    e.preventDefault();

    if (!expenseForm.branch) {
      toast.error('Please select a branch');
      return;
    }

    if (!expenseForm.title.trim()) {
      toast.error('Please enter expense title');
      return;
    }

    if (
      !expenseForm.amount ||
      Number(expenseForm.amount) <= 0
    ) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: expenseForm.title.trim(),
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        date: expenseForm.date,
        notes: expenseForm.notes.trim(),
        branch: expenseForm.branch,
      };

      let response;

      if (editingExpense) {
        response = await api.patch(
          `/expenses/${editingExpense._id}`,
          payload
        );

        toast.success('Expense updated successfully');
      } else {
        response = await api.post(
          '/expenses',
          payload
        );

        toast.success('Expense recorded successfully');

        if (response.data?.budgetWarning) {
          toast(response.data.budgetWarning, {
            icon: '⚠️',
            duration: 7000,
          });
        }
      }

      setExpenseModalOpen(false);
      setEditingExpense(null);
      setExpenseForm(getDefaultExpenseForm());

      await loadData();
    } catch (err) {
      console.error('Save expense error:', err);

      toast.error(
        err.response?.data?.message ||
          'Could not save expense'
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  const askDeleteExpense = (expense) => {
    setExpenseToDelete(expense);
    setDeleteModalOpen(true);
  };

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;

    setDeleting(true);

    try {
      await api.delete(
        `/expenses/${expenseToDelete._id}`
      );

      toast.success('Expense deleted successfully');

      setDeleteModalOpen(false);
      setExpenseToDelete(null);

      await loadData();
    } catch (err) {
      console.error('Delete expense error:', err);

      toast.error(
        err.response?.data?.message ||
          'Could not delete expense'
      );
    } finally {
      setDeleting(false);
    }
  };

  // --------------------------------------------------
  // SAVE BUDGET
  // --------------------------------------------------

  const submitBudget = async (e) => {
    e.preventDefault();

    if (!budgetForm.branch) {
      toast.error('Please select a branch');
      return;
    }

    if (!budgetForm.category) {
      toast.error('Please select a category');
      return;
    }

    if (
      !budgetForm.monthlyLimit ||
      Number(budgetForm.monthlyLimit) <= 0
    ) {
      toast.error('Please enter a valid monthly limit');
      return;
    }

    setSaving(true);

    try {
      await api.post('/expenses/budgets', {
        branch: budgetForm.branch,
        category: budgetForm.category,
        monthlyLimit: Number(
          budgetForm.monthlyLimit
        ),
      });

      toast.success(
        'Budget saved successfully'
      );

      setBudgetModalOpen(false);
      setBudgetForm(getDefaultBudgetForm());

      await loadData();
    } catch (err) {
      console.error('Budget error:', err);

      toast.error(
        err.response?.data?.message ||
          'Could not save budget'
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // EDIT BUDGET
  // --------------------------------------------------

  const editBudget = (budget) => {
    setBudgetForm({
      branch:
        typeof budget.branch === 'object'
          ? budget.branch?._id
          : budget.branch || '',
      category: budget.category || 'other',
      monthlyLimit: budget.monthlyLimit || '',
    });

    setBudgetModalOpen(true);
  };

  // --------------------------------------------------
  // RESET FILTERS
  // --------------------------------------------------

  const resetFilters = () => {
    setFilters({
      branch: '',
      category: '',
      from: '',
      to: '',
      search: '',
    });
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <AppShell title="Expenses">

      {/* ==================================================
          HEADER
      ================================================== */}

      <PageHeader
        title="Expense Management"
        description={`Total recorded: ${formatCurrency(
          totalExpense
        )}`}
        action={
          <button
            type="button"
            onClick={openAddExpense}
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
            "
          >
            <Plus size={16} />
            Add Expense
          </button>
        }
      />

      {/* ==================================================
          SUMMARY CARDS
      ================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        {/* Total */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-ink-500">
                Total Expenses
              </p>

              <p className="text-2xl font-bold text-ink-950 mt-1">
                {formatCurrency(totalExpense)}
              </p>

              <p className="text-xs text-ink-500 mt-1">
                {expenses.length} records
              </p>
            </div>

            <div className="h-11 w-11 rounded-xl bg-violet-100 flex items-center justify-center">
              <Receipt
                size={21}
                className="text-violet-600"
              />
            </div>
          </div>
        </div>

        {/* Current month */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-ink-500">
                This Month
              </p>

              <p className="text-2xl font-bold text-ink-950 mt-1">
                {formatCurrency(currentMonthTotal)}
              </p>

              <p className="text-xs text-ink-500 mt-1">
                Current month spending
              </p>
            </div>

            <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center">
              <CalendarDays
                size={21}
                className="text-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-ink-500">
                Monthly Budgets
              </p>

              <p className="text-2xl font-bold text-ink-950 mt-1">
                {formatCurrency(totalMonthlyBudget)}
              </p>

              <p className="text-xs text-ink-500 mt-1">
                {budgets.length} budget rules
              </p>
            </div>

            <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Wallet
                size={21}
                className="text-emerald-600"
              />
            </div>
          </div>
        </div>

      </div>

      {/* ==================================================
          FILTERS
      ================================================== */}

      <div className="card p-4 mb-6">

        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} />
          <h3 className="font-semibold text-ink-950">
            Filter Expenses
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">

          {/* Search */}
          <div className="relative">
          

            <input
              className="input pl-9"
              placeholder="Search expenses..."
              value={filters.search}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  search: e.target.value,
                })
              }
            />
          </div>

          {/* Branch */}
          <select
            className="input"
            value={filters.branch}
            onChange={(e) =>
              setFilters({
                ...filters,
                branch: e.target.value,
              })
            }
          >
            <option value="">
              All Branches
            </option>

            {branches.map((branch) => (
              <option
                key={branch._id}
                value={branch._id}
              >
                {branch.name}
              </option>
            ))}
          </select>

          {/* Category */}
          <select
            className="input"
            value={filters.category}
            onChange={(e) =>
              setFilters({
                ...filters,
                category: e.target.value,
              })
            }
          >
            <option value="">
              All Categories
            </option>

            {categories.map((category) => (
              <option
                key={category}
                value={category}
              >
                {capitalize(category)}
              </option>
            ))}
          </select>

          {/* From */}
          <input
            type="date"
            className="input"
            value={filters.from}
            onChange={(e) =>
              setFilters({
                ...filters,
                from: e.target.value,
              })
            }
          />

          {/* To */}
          <input
            type="date"
            className="input"
            value={filters.to}
            onChange={(e) =>
              setFilters({
                ...filters,
                to: e.target.value,
              })
            }
          />

        </div>

        <div className="flex items-center justify-between mt-4">

          <p className="text-xs text-ink-500">
            Showing{' '}
            <span className="font-semibold text-ink-900">
              {filteredExpenses.length}
            </span>{' '}
            expenses ·{' '}
            <span className="font-semibold text-ink-900">
              {formatCurrency(filteredTotal)}
            </span>
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink-600 hover:text-ink-950"
          >
            <X size={14} />
            Reset Filters
          </button>

        </div>
      </div>

      {/* ==================================================
          EXPENSE TABLE
      ================================================== */}

      {loading ? (
        <div className="card p-10 text-center">
          <RefreshCw
            size={22}
            className="animate-spin mx-auto mb-3"
          />

          <p className="text-sm text-ink-600">
            Loading expenses...
          </p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          title={
            expenses.length === 0
              ? 'No expenses recorded yet'
              : 'No expenses found'
          }
          description={
            expenses.length === 0
              ? 'Track rent, marketing, salaries and more here.'
              : 'Try changing your filters to find expenses.'
          }
        />
      ) : (
        <div className="card overflow-hidden mb-8">

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>
                <tr className="text-left text-xs uppercase text-ink-600 border-b border-ink-100 bg-ink-50/50">

                  <th className="px-4 py-3">
                    Date
                  </th>

                  <th className="px-4 py-3">
                    Title
                  </th>

                  <th className="px-4 py-3">
                    Category
                  </th>

                  <th className="px-4 py-3">
                    Branch
                  </th>

                  <th className="px-4 py-3">
                    Amount
                  </th>

                  <th className="px-4 py-3">
                    Recorded By
                  </th>

                  <th className="px-4 py-3 text-right">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense._id}
                    className="border-b border-ink-100 last:border-0 hover:bg-ink-50/40 transition"
                  >

                    <td className="px-4 py-3 whitespace-nowrap text-ink-700">
                      {formatDate(expense.date)}
                    </td>

                    <td className="px-4 py-3">

                      <div>
                        <p className="font-semibold text-ink-950">
                          {expense.title}
                        </p>

                        {expense.notes && (
                          <p className="text-xs text-ink-500 mt-0.5 max-w-[220px] truncate">
                            {expense.notes}
                          </p>
                        )}
                      </div>

                    </td>

                    <td className="px-4 py-3">
                      <Badge tone="ink">
                        {capitalize(expense.category)}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">

                      <div className="flex items-center gap-2">
                        <Building2
                          size={14}
                          className="text-ink-400"
                        />

                        <span className="text-ink-700">
                          {getBranchName(expense.branch)}
                        </span>
                      </div>

                    </td>

                    <td className="px-4 py-3 font-bold text-clay-600 whitespace-nowrap">
                      {formatCurrency(expense.amount)}
                    </td>

                    <td className="px-4 py-3 text-ink-700">
                      {expense.recordedBy?.name || '-'}
                    </td>

                    <td className="px-4 py-3">

                      <div className="flex items-center justify-end gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            openEditExpense(expense)
                          }
                          className="
                            h-8 w-8
                            rounded-lg
                            flex items-center justify-center
                            text-blue-600
                            hover:bg-blue-50
                            transition
                          "
                          title="Edit Expense"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            askDeleteExpense(expense)
                          }
                          className="
                            h-8 w-8
                            rounded-lg
                            flex items-center justify-center
                            text-red-600
                            hover:bg-red-50
                            transition
                          "
                          title="Delete Expense"
                        >
                          <Trash2 size={15} />
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

      {/* ==================================================
          BUDGET MANAGEMENT
      ================================================== */}

      <div className="flex items-center justify-between mb-4">

        <div>
          <h2 className="text-lg font-bold text-ink-950">
            Budget Management
          </h2>

          <p className="text-xs text-ink-500 mt-1">
            Set monthly spending limits for each branch and category.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setBudgetForm({
              ...getDefaultBudgetForm(),
              branch:
                branches.length === 1
                  ? branches[0]._id
                  : '',
            });

            setBudgetModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={16} />
          Set Budget
        </button>

      </div>

      {budgets.length === 0 ? (
        <EmptyState
          title="No budgets configured"
          description="Set monthly budgets to track spending against limits."
        />
      ) : (
        <div className="card overflow-hidden mb-8">

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>
                <tr className="text-left text-xs uppercase text-ink-600 border-b border-ink-100 bg-ink-50/50">

                  <th className="px-4 py-3">
                    Branch
                  </th>

                  <th className="px-4 py-3">
                    Category
                  </th>

                  <th className="px-4 py-3">
                    Monthly Limit
                  </th>

                  <th className="px-4 py-3">
                    Spent This Month
                  </th>

                  <th className="px-4 py-3">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody>

                {budgets.map((budget) => {
                  const branchId =
                    typeof budget.branch === 'object'
                      ? budget.branch?._id
                      : budget.branch;

                  const spent = getCategorySpent(
                    budget.category,
                    branchId
                  );

                  const limit =
                    Number(budget.monthlyLimit || 0);

                  const percentage =
                    limit > 0
                      ? (spent / limit) * 100
                      : 0;

                  const exceeded =
                    spent > limit;

                  return (
                    <tr
                      key={budget._id}
                      className="border-b border-ink-100 last:border-0"
                    >

                      <td className="px-4 py-3 font-medium text-ink-900">
                        {getBranchName(
                          budget.branch
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <Badge tone="ink">
                          {capitalize(
                            budget.category
                          )}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 font-semibold">
                        {formatCurrency(limit)}
                      </td>

                      <td className="px-4 py-3 font-semibold">
                        {formatCurrency(spent)}
                      </td>

                      <td className="px-4 py-3">

                        {exceeded ? (
                          <Badge tone="clay">
                            <span className="inline-flex items-center gap-1">
                              <AlertTriangle size={12} />
                              Exceeded
                            </span>
                          </Badge>
                        ) : percentage >= 80 ? (
                          <Badge tone="ink">
                            Near Limit
                          </Badge>
                        ) : (
                          <Badge tone="ink">
                            Within Budget
                          </Badge>
                        )}

                      </td>

                      <td className="px-4 py-3 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            editBudget(budget)
                          }
                          className="
                            inline-flex
                            items-center
                            gap-2
                            px-3
                            py-2
                            rounded-lg
                            text-xs
                            font-semibold
                            text-blue-600
                            hover:bg-blue-50
                          "
                        >
                          <Pencil size={14} />
                          Edit
                        </button>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        </div>
      )}

      {/* ==================================================
          ADD / EDIT EXPENSE MODAL
      ================================================== */}

      <Modal
        open={expenseModalOpen}
        onClose={() => {
          if (!saving) {
            setExpenseModalOpen(false);
            setEditingExpense(null);
          }
        }}
        title={
          editingExpense
            ? 'Edit Expense'
            : 'Record Expense'
        }
      >

        <form
          onSubmit={submitExpense}
          className="space-y-4"
        >

          {/* Branch */}
          <div>
            <label className="label">
              Branch{' '}
              <span className="text-red-500">*</span>
            </label>

            <select
              className="input"
              required
              value={expenseForm.branch}
              onChange={(e) =>
                setExpenseForm({
                  ...expenseForm,
                  branch: e.target.value,
                })
              }
            >
              <option value="">
                Select Branch
              </option>

              {branches.map((branch) => (
                <option
                  key={branch._id}
                  value={branch._id}
                >
                  {branch.name}
                </option>
              ))}
            </select>

            {branches.length === 0 && (
              <p className="mt-1 text-xs text-red-500">
                No branches found. Please create a branch first.
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="label">
              Title{' '}
              <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              className="input"
              required
              placeholder="e.g. Office Rent"
              value={expenseForm.title}
              onChange={(e) =>
                setExpenseForm({
                  ...expenseForm,
                  title: e.target.value,
                })
              }
            />
          </div>

          {/* Category + Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              <label className="label">
                Category{' '}
                <span className="text-red-500">*</span>
              </label>

              <select
                className="input"
                required
                value={expenseForm.category}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    category: e.target.value,
                  })
                }
              >
                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {capitalize(category)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                Amount (₹){' '}
                <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <IndianRupee
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                />

                <input
                  type="number"
                  min="1"
                  step="0.01"
                  className="input pl-9"
                  required
                  placeholder="Enter amount"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      amount: e.target.value,
                    })
                  }
                />
              </div>
            </div>

          </div>

          {/* Date */}
          <div>
            <label className="label">
              Date
            </label>

            <input
              type="date"
              className="input"
              value={expenseForm.date}
              onChange={(e) =>
                setExpenseForm({
                  ...expenseForm,
                  date: e.target.value,
                })
              }
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label">
              Notes
            </label>

            <textarea
              className="input"
              rows={3}
              placeholder="Add any additional notes..."
              value={expenseForm.notes}
              onChange={(e) =>
                setExpenseForm({
                  ...expenseForm,
                  notes: e.target.value,
                })
              }
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                setExpenseModalOpen(false)
              }
              className="btn-secondary flex-1"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                branches.length === 0
              }
              className="btn-primary flex-1 disabled:opacity-50"
            >
              <Receipt size={16} />

              {saving
                ? 'Saving…'
                : editingExpense
                ? 'Update Expense'
                : 'Save Expense'}
            </button>

          </div>

        </form>

      </Modal>

      {/* ==================================================
          DELETE CONFIRMATION MODAL
      ================================================== */}

      <Modal
        open={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setExpenseToDelete(null);
          }
        }}
        title="Delete Expense"
      >

        <div className="space-y-5">

          <div className="flex gap-3">

            <div className="h-10 w-10 shrink-0 rounded-xl bg-red-100 flex items-center justify-center">
              <Trash2
                size={19}
                className="text-red-600"
              />
            </div>

            <div>
              <h3 className="font-semibold text-ink-950">
                Delete this expense?
              </h3>

              <p className="text-sm text-ink-600 mt-1">
                This action cannot be undone.
              </p>
            </div>

          </div>

          {expenseToDelete && (
            <div className="rounded-xl bg-ink-50 p-4">

              <div className="flex justify-between gap-4">

                <div>
                  <p className="font-semibold text-ink-950">
                    {expenseToDelete.title}
                  </p>

                  <p className="text-xs text-ink-500 mt-1">
                    {capitalize(
                      expenseToDelete.category
                    )}{' '}
                    ·{' '}
                    {formatDate(
                      expenseToDelete.date
                    )}
                  </p>
                </div>

                <p className="font-bold text-clay-600">
                  {formatCurrency(
                    expenseToDelete.amount
                  )}
                </p>

              </div>

            </div>
          )}

          <div className="flex gap-3">

            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                setDeleteModalOpen(false);
                setExpenseToDelete(null);
              }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={deleting}
              onClick={confirmDeleteExpense}
              className="
                flex-1
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                bg-red-600
                hover:bg-red-700
                disabled:opacity-50
              "
            >
              <Trash2 size={16} />

              {deleting
                ? 'Deleting…'
                : 'Delete Expense'}
            </button>

          </div>

        </div>

      </Modal>

      {/* ==================================================
          BUDGET MODAL
      ================================================== */}

      <Modal
        open={budgetModalOpen}
        onClose={() => {
          if (!saving) {
            setBudgetModalOpen(false);
          }
        }}
        title="Set Monthly Budget"
      >

        <form
          onSubmit={submitBudget}
          className="space-y-4"
        >

          {/* Branch */}
          <div>
            <label className="label">
              Branch{' '}
              <span className="text-red-500">*</span>
            </label>

            <select
              className="input"
              required
              value={budgetForm.branch}
              onChange={(e) =>
                setBudgetForm({
                  ...budgetForm,
                  branch: e.target.value,
                })
              }
            >
              <option value="">
                Select Branch
              </option>

              {branches.map((branch) => (
                <option
                  key={branch._id}
                  value={branch._id}
                >
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="label">
              Category{' '}
              <span className="text-red-500">*</span>
            </label>

            <select
              className="input"
              required
              value={budgetForm.category}
              onChange={(e) =>
                setBudgetForm({
                  ...budgetForm,
                  category: e.target.value,
                })
              }
            >
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {capitalize(category)}
                </option>
              ))}
            </select>
          </div>

          {/* Monthly Limit */}
          <div>
            <label className="label">
              Monthly Limit (₹){' '}
              <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <IndianRupee
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
              />

              <input
                type="number"
                min="1"
                step="0.01"
                className="input pl-9"
                required
                placeholder="e.g. 50000"
                value={budgetForm.monthlyLimit}
                onChange={(e) =>
                  setBudgetForm({
                    ...budgetForm,
                    monthlyLimit: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
            <p className="text-xs text-blue-700">
              If a budget already exists for this branch
              and category, it will be updated automatically.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                setBudgetModalOpen(false)
              }
              className="btn-secondary flex-1"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                branches.length === 0
              }
              className="btn-primary flex-1 disabled:opacity-50"
            >
              <Wallet size={16} />

              {saving
                ? 'Saving…'
                : 'Save Budget'}
            </button>

          </div>

        </form>

      </Modal>

    </AppShell>
  );
}