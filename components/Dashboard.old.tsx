'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Family {
  id: string;
  name: string;
  email: string;
  members: number;
  ages: number[];
}

interface Expense {
  _id: string;
  familyId: string;
  date: string;
  amount: number;
  category: string;
  description: string;
}

const categoryEmojis: { [key: string]: string } = {
  food: '🍔',
  transport: '🚗',
  shopping: '🛍️',
  utilities: '💡',
  entertainment: '🎬',
  health: '⚕️',
  other: '📌',
};

export default function Dashboard() {
  const router = useRouter();
  const [family, setFamily] = useState<Family | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');
  const [loading, setLoading] = useState(true);

  // Form state
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check if family is logged in
    const familyData = localStorage.getItem('currentFamily');
    if (!familyData) {
      router.push('/');
      return;
    }

    const parsedFamily = JSON.parse(familyData);
    setFamily(parsedFamily);
    fetchExpenses(parsedFamily.id);
  }, [router]);

  const fetchExpenses = async (familyId: string) => {
    try {
      const res = await fetch(`/api/expenses?familyId=${familyId}`);
      const data = await res.json();
      if (res.ok) {
        setExpenses(data.expenses);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentFamily');
    router.push('/');
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family) return;

    setSubmitting(true);

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: family.id,
          date: expenseDate,
          amount: parseFloat(expenseAmount),
          category: expenseCategory,
          description: expenseDescription,
        }),
      });

      if (res.ok) {
        // Reset form
        setExpenseDate(new Date().toISOString().split('T')[0]);
        setExpenseAmount('');
        setExpenseCategory('');
        setExpenseDescription('');
        
        // Refresh expenses
        fetchExpenses(family.id);
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const res = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok && family) {
        fetchExpenses(family.id);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
  };

  const isThisWeek = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo && date <= today;
  };

  const isThisMonth = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const calculateTotals = () => {
    const today = expenses.filter(e => isToday(e.date)).reduce((sum, e) => sum + e.amount, 0);
    const week = expenses.filter(e => isThisWeek(e.date)).reduce((sum, e) => sum + e.amount, 0);
    const month = expenses.filter(e => isThisMonth(e.date)).reduce((sum, e) => sum + e.amount, 0);
    return { today, week, month };
  };

  const getFilteredExpenses = () => {
    if (filter === 'today') return expenses.filter(e => isToday(e.date));
    if (filter === 'week') return expenses.filter(e => isThisWeek(e.date));
    return expenses;
  };

  const totals = calculateTotals();
  const filteredExpenses = getFilteredExpenses();

  if (loading || !family) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">💰 Family Expense Tracker</h1>
          <div className="flex items-center gap-4">
            <span className="font-semibold">{family.name}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Summary Cards */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Family Expense Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-sm font-medium opacity-90 mb-2">Today's Expenses</h3>
              <p className="text-3xl font-bold">${totals.today.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-sm font-medium opacity-90 mb-2">This Week</h3>
              <p className="text-3xl font-bold">${totals.week.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-sm font-medium opacity-90 mb-2">This Month</h3>
              <p className="text-3xl font-bold">${totals.month.toFixed(2)}</p>
            </div>
          </div>
        </section>

        {/* Add Expense Form */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Add Family Expense</h2>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                >
                  <option value="">Select Category</option>
                  <option value="food">Food & Dining</option>
                  <option value="transport">Transportation</option>
                  <option value="shopping">Shopping</option>
                  <option value="utilities">Utilities</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="health">Health</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="Brief description"
                  required
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Expense'}
            </button>
          </form>
        </section>

        {/* Recent Expenses */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Expenses</h2>
          
          {/* Filter Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('today')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'today'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-gray-50'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilter('week')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'week'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-gray-50'
              }`}
            >
              This Week
            </button>
          </div>

          {/* Expenses List */}
          <div className="space-y-3">
            {filteredExpenses.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No expenses found for this filter.</p>
            ) : (
              filteredExpenses.map((expense) => (
                <div
                  key={expense._id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition"
                >
                  <div className="text-3xl bg-white rounded-lg w-14 h-14 flex items-center justify-center">
                    {categoryEmojis[expense.category]}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{expense.description}</div>
                    <div className="text-sm text-gray-600">
                      <span className="capitalize">{expense.category}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(expense.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-indigo-600">
                    ${expense.amount.toFixed(2)}
                  </div>
                  <button
                    onClick={() => handleDeleteExpense(expense._id)}
                    className="w-10 h-10 bg-red-500 text-white rounded-full hover:bg-red-600 transition flex items-center justify-center text-xl font-bold"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
