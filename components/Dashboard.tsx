'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateProfileCompletion, calculateMonthlyBalance } from '@/lib/profileCompletion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Family {
  id: string;
  name: string;
  email: string;
  members: number;
  ages: number[];
  genders?: string[];
  incomeStreams?: Array<{ source: string; amount: number }>;
  fixedPayments?: Array<{ name: string; amount: number }>;
  properties?: Array<{ name: string; value: number; monthlyPayment?: number }>;
  loans?: Array<{ name: string; monthlyAmount: number; endDate: string }>;
  economicTargets?: Array<{ description: string; targetAmount: number; type: 'expense' | 'savings'; category?: string }>;
}

interface Expense {
  _id: string;
  familyId: string;
  date: string;
  amount: number;
  category: string;
  subcategory?: string;
  description: string;
}

const categoryEmojis: { [key: string]: string } = {
  food: '🍔',
  gasoline: '⛽',
  clothing: '👗',
  utilities: '💡',
  restaurants: '🍽️',
  travelling: '✈️',
  leisure: '🎮',
  appliances: '📦',
  'home-renovations': '🔨',
  medicine: '💊',
  'vehicle-maintenance': '🔧',
  'personal-care': '🧴',
  taxes: '💰',
  sports: '⚽',
};

const subcategoryEmojis: { [key: string]: string } = {
  // Food subcategories
  meat: '🥩',
  fish: '🐟',
  chicken: '🍗',
  rice: '🍚',
  pasta: '🍝',
  sauces: '🥫',
  bread: '🥖',
  eggs: '🥚',
  milk: '🥛',
  water: '💧',
  candies: '🍬',
  pancakes: '🥞',
  cheese: '🧀',
  jam: '🍯',
  cereals: '🥣',
  protein: '💪',
  drinks: '🥤',
  'snacks-chips': '🍿',
  desserts: '🍰',
  // Gasoline subcategories
  diesel: '⛽',
  gasoline: '⛽',
  // Utilities subcategories
  kitchen: '🍳',
  bathroom: '🛁',
  housing: '🏠',
  // Restaurant subcategories
  breakfast: '🥐',
  lunch: '🍲',
  dinner: '🍴',
  snack: '☕',
  // Clothing subcategories
  kids: '🧒',
  adults: '👔',
  baby: '👶',
  // Medicine subcategories
  adult: '👨',
  child: '👦',
  // Vehicle Maintenance subcategories
  taxes: '💸',
  'general-maintenance': '🔧',
  repairs: '🔨',
  // Personal Care subcategories
  woman: '💄',
  men: '🧔',
  // Taxes subcategories
  properties: '🏠',
  vehicles: '🚗',
  // Sports subcategories
  clothing: '👟',
  courts: '🎾',
  accessories: '🎽',
};

const getExpenseIcon = (expense: Expense): string => {
  if (expense.subcategory && subcategoryEmojis[expense.subcategory]) {
    return subcategoryEmojis[expense.subcategory];
  }
  return categoryEmojis[expense.category] || '💰';
};

export default function Dashboard() {
  const router = useRouter();
  const [family, setFamily] = useState<Family | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth());
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [selectedReportDate, setSelectedReportDate] = useState<string | null>(null);
  const [reportViewMode, setReportViewMode] = useState<'daily' | 'weekly'>('daily');
  const [reportFilterMode, setReportFilterMode] = useState<'all' | 'by-category'>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Monthly income state
  const [monthlyIncome, setMonthlyIncome] = useState<any>(null);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeEntries, setIncomeEntries] = useState<Array<{ source: string; amount: number }>>([]);
  const [savingIncome, setSavingIncome] = useState(false);

  // Form state
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseSubcategory, setExpenseSubcategory] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const familyData = localStorage.getItem('currentFamily');
    if (!familyData) {
      router.push('/');
      return;
    }

    const parsedFamily = JSON.parse(familyData);
    setFamily(parsedFamily);
    const familyId = parsedFamily.id || parsedFamily._id;
    if (familyId) {
      fetchProfile(familyId);
      fetchExpenses(familyId);
      fetchMonthlyIncome(familyId);
    }
  }, [router]);

  const fetchProfile = async (familyId: string) => {
    try {
      const res = await fetch(`/api/profile?familyId=${familyId}`);
      const data = await res.json();
      
      if (res.ok) {
        const updatedFamily = { ...family, ...data.family };
        setFamily(updatedFamily as Family);
        setProfileCompletion(calculateProfileCompletion(data.family));
        // Update localStorage
        localStorage.setItem('currentFamily', JSON.stringify(updatedFamily));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

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

  const fetchMonthlyIncome = async (familyId: string) => {
    try {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const res = await fetch(`/api/monthly-income?familyId=${familyId}&month=${month}&year=${year}`);
      const data = await res.json();
      
      if (res.ok) {
        setMonthlyIncome(data.monthlyIncome);
        if (data.monthlyIncome) {
          setIncomeEntries(data.monthlyIncome.incomes);
        } else {
          // Pre-populate with profile income streams
          const defaultIncomes = family?.incomeStreams?.map(stream => ({
            source: stream.source,
            amount: stream.amount
          })) || [];
          setIncomeEntries(defaultIncomes);
        }
      }
    } catch (error) {
      console.error('Error fetching monthly income:', error);
    }
  };

  const handleSaveMonthlyIncome = async () => {
    if (!family) return;
    
    const familyId = family.id || (family as any)._id;
    if (!familyId) return;
    
    setSavingIncome(true);
    
    try {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const res = await fetch('/api/monthly-income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId,
          month,
          year,
          incomes: incomeEntries.filter(entry => entry.source && entry.amount > 0)
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setMonthlyIncome(data.monthlyIncome);
        setShowIncomeModal(false);
        // Refresh to update calculations
        fetchMonthlyIncome(familyId);
      }
    } catch (error) {
      console.error('Error saving monthly income:', error);
    } finally {
      setSavingIncome(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentFamily');
    router.push('/');
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family) return;

    const familyId = family.id || (family as any)._id;
    if (!familyId) return;

    setSubmitting(true);
    
    // Format date as YYYY-MM-DD using local time to avoid timezone shift
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    console.log('Adding expense for date:', {
      selectedDate: selectedDate.toString(),
      dateString,
      year, month, day
    });

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId,
          date: dateString,
          amount: parseFloat(expenseAmount),
          category: expenseCategory,
          subcategory: expenseSubcategory || undefined,
          description: expenseDescription,
        }),
      });

      if (res.ok) {
        setExpenseAmount('');
        setExpenseCategory('');
        setExpenseSubcategory('');
        setExpenseDescription('');
        fetchExpenses(familyId);
        // Keep the modal open to show the added expense
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
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    return dateString === todayStr;
  };

  const isThisWeek = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo && date <= today;
  };

  const isThisMonth = (dateString: string) => {
    const today = new Date();
    const [year, month] = dateString.split('-');
    return parseInt(month) === (today.getMonth() + 1) && parseInt(year) === today.getFullYear();
  };

  const isThisYear = (dateString: string) => {
    const today = new Date();
    const [year] = dateString.split('-');
    return parseInt(year) === today.getFullYear();
  };

  const calculateTotals = () => {
    const today = expenses.filter(e => isToday(e.date)).reduce((sum, e) => sum + e.amount, 0);
    const week = expenses.filter(e => isThisWeek(e.date)).reduce((sum, e) => sum + e.amount, 0);
    const month = expenses.filter(e => isThisMonth(e.date)).reduce((sum, e) => sum + e.amount, 0);
    const year = expenses.filter(e => isThisYear(e.date)).reduce((sum, e) => sum + e.amount, 0);
    return { today, week, month, year };
  };

  const calculateFinancials = () => {
    const totals = calculateTotals();
    
    // Use actual monthly income if available, otherwise use profile income streams
    const actualMonthlyIncome = monthlyIncome?.totalIncome || family?.incomeStreams?.reduce((sum, stream) => sum + stream.amount, 0) || 0;
    const yearlyIncome = actualMonthlyIncome * 12;
    
    const monthlyFixedPayments = family?.fixedPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const yearlyFixedPayments = monthlyFixedPayments * 12;
    
    const monthlyPropertyPayments = family?.properties?.reduce((sum, prop) => sum + (prop.monthlyPayment || 0), 0) || 0;
    const yearlyPropertyPayments = monthlyPropertyPayments * 12;
    
    const monthlyLoanPayments = family?.loans?.reduce((sum, loan) => sum + loan.monthlyAmount, 0) || 0;
    const yearlyLoanPayments = monthlyLoanPayments * 12;

    const currentIncome = viewMode === 'monthly' ? actualMonthlyIncome : yearlyIncome;
    const currentFixedPayments = viewMode === 'monthly' ? monthlyFixedPayments : yearlyFixedPayments;
    const currentPropertyPayments = viewMode === 'monthly' ? monthlyPropertyPayments : yearlyPropertyPayments;
    const currentLoanPayments = viewMode === 'monthly' ? monthlyLoanPayments : yearlyLoanPayments;
    const currentExpenses = viewMode === 'monthly' ? totals.month : totals.year;

    const balance = calculateMonthlyBalance(
      currentIncome,
      currentFixedPayments,
      currentPropertyPayments,
      currentLoanPayments,
      currentExpenses
    );

    return {
      totalIncome: currentIncome,
      totalFixedPayments: currentFixedPayments,
      totalPropertyPayments: currentPropertyPayments,
      totalLoanPayments: currentLoanPayments,
      monthlyBalance: balance,
      expenseTotals: totals
    };
  };

  const getFilteredExpenses = () => {
    if (filter === 'today') return expenses.filter(e => isToday(e.date));
    if (filter === 'week') return expenses.filter(e => isThisWeek(e.date));
    return expenses;
  };

  const generatePDFReport = (month: number, year: number) => {
    const selectedExpenses = expenses.filter(e => {
      const [expYear, expMonth] = e.date.split('-');
      return parseInt(expMonth) === (month + 1) && parseInt(expYear) === year;
    });

    const totalExpenses = selectedExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const categoryTotals: { [key: string]: number } = {};
    selectedExpenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month];

    // Create PDF
    const doc = new jsPDF();
    
    // Add logo text
    doc.setFontSize(24);
    doc.setTextColor(99, 102, 241); // Indigo color
    doc.text("Bull's Eye Economic Target", 105, 20, { align: 'center' });
    
    // Add report title
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(`Monthly Report - ${monthName} ${year}`, 105, 35, { align: 'center' });
    
    // Add family name
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Family: ${family?.name || 'N/A'}`, 105, 45, { align: 'center' });
    
    let yPos = 60;

    // Calculate monthly income and expenses
    const monthlyIncome = family?.incomeStreams?.reduce((sum, stream) => sum + stream.amount, 0) || 0;
    const monthlyFixedPayments = family?.fixedPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const monthlyPropertyPayments = family?.properties?.reduce((sum, prop) => sum + (prop.monthlyPayment || 0), 0) || 0;
    const monthlyLoanPayments = family?.loans?.reduce((sum, loan) => sum + loan.monthlyAmount, 0) || 0;
    const totalOutgoing = monthlyFixedPayments + monthlyPropertyPayments + monthlyLoanPayments + totalExpenses;
    const balance = monthlyIncome - totalOutgoing;

    // Draw financial health circle chart
    const centerX = 105;
    const centerY = yPos + 40;
    const radius = 30;
    
    // Background circle
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(229, 231, 235);
    doc.circle(centerX, centerY, radius, 'F');
    
    // Income circle (partial)
    if (monthlyIncome > 0) {
      const percentage = Math.min(totalOutgoing / monthlyIncome, 1);
      doc.setFillColor(99, 102, 241); // Indigo
      
      // Draw arc representing expenses
      const startAngle = -90;
      const endAngle = startAngle + (percentage * 360);
      
      // Simple filled circle for visualization
      if (percentage > 0) {
        doc.setFillColor(balance >= 0 ? 99 : 239, balance >= 0 ? 102 : 68, balance >= 0 ? 241 : 68);
        doc.circle(centerX, centerY, radius * percentage, 'F');
      }
    }
    
    // Center text - Balance
    doc.setFontSize(16);
    doc.setTextColor(balance >= 0 ? 22 : 239, balance >= 0 ? 163 : 68, balance >= 0 ? 74 : 68);
    doc.text(`€${Math.abs(balance).toFixed(0)}`, centerX, centerY, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(balance >= 0 ? 'Balance' : 'Deficit', centerX, centerY + 7, { align: 'center' });

    yPos += 90;

    // Summary boxes
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    // Income box
    doc.setFillColor(220, 252, 231);
    doc.rect(20, yPos, 80, 20, 'F');
    doc.text('Total Income', 25, yPos + 8);
    doc.setFontSize(14);
    doc.setTextColor(22, 163, 74);
    doc.text(`€${monthlyIncome.toFixed(2)}`, 25, yPos + 16);
    
    // Expenses box
    doc.setFillColor(254, 226, 226);
    doc.rect(110, yPos, 80, 20, 'F');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Total Expenses', 115, yPos + 8);
    doc.setFontSize(14);
    doc.setTextColor(239, 68, 68);
    doc.text(`€${totalExpenses.toFixed(2)}`, 115, yPos + 16);

    yPos += 35;

    // Category breakdown
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Expenses by Category', 20, yPos);
    yPos += 10;

    const categoryData = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => [
        category.charAt(0).toUpperCase() + category.slice(1),
        `€${amount.toFixed(2)}`
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Amount']],
      body: categoryData,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Transaction details
    doc.setFontSize(14);
    doc.text('Transaction Details', 20, yPos);
    yPos += 10;

    const transactionData = selectedExpenses.map((expense) => [
      new Date(expense.date).toLocaleDateString(),
      expense.description,
      expense.category.charAt(0).toUpperCase() + expense.category.slice(1),
      `€${expense.amount.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Description', 'Category', 'Amount']],
      body: transactionData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 70 },
        2: { cellWidth: 40 },
        3: { cellWidth: 30 },
      },
    });

    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
        105,
        285,
        { align: 'center' }
      );
    }

    // Save PDF
    doc.save(`BullsEye_Report_${monthName}_${year}.pdf`);
  };

  if (loading || !family) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const financials = calculateFinancials();
  const filteredExpenses = getFilteredExpenses();

  // Function to get family member emojis
  const getFamilyMemberEmojis = () => {
    if (!family?.ages || family.ages.length === 0) return null;
    
    return family.ages.map((age, index) => {
      const gender = (family.genders?.[index] || 'male').toLowerCase();
      // Check if gender indicates male (handles: male, m, boy)
      const isMale = ['male', 'm', 'boy'].includes(gender);
      
      if (age <= 2) return '👶'; // Baby (gender neutral)
      if (age <= 12) return isMale ? '👦' : '👧'; // Boy or Girl
      if (age <= 19) return isMale ? '🧑' : '👧'; // Teen boy or girl
      if (age <= 60) return isMale ? '👨' : '👩'; // Adult man or woman
      return isMale ? '👴' : '👵'; // Elderly man or woman
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 backdrop-blur-md shadow-lg border-b-2 border-indigo-200/50">
        <div className="max-w-7xl mx-auto px-2 py-4 sm:px-4 lg:px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Bull's Eye Logo" className="w-16 h-16 object-contain" />
            <h1 className="text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight" style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>Bull's Eye Economic Target</h1>
            {/* Family Members Icons */}
            {getFamilyMemberEmojis() && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full border border-indigo-200">
                <span className="text-sm font-bold text-indigo-700">Family:</span>
                {getFamilyMemberEmojis()?.map((emoji, idx) => (
                  <span key={idx} className="text-4xl">{emoji}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/profile')}
              className="px-3 py-1.5 text-sm bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-lg hover:from-indigo-200 hover:to-purple-200 transition font-medium flex items-center gap-2 border border-indigo-200"
            >
              <span>📊</span>
              <span>{profileCompletion === 100 ? 'Update' : 'Complete'} Profile</span>
              <span className="text-xs bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-2 py-0.5 rounded-full">{profileCompletion}%</span>
            </button>
            <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{family.name}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm text-gray-900 bg-white/50 rounded-lg hover:bg-white/80 transition border border-gray-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Financial Health Circle Chart */}
        <section className="mb-8">
          <div className="bg-gradient-to-br from-white via-indigo-50/50 to-purple-50/50 backdrop-blur-md rounded-xl shadow-xl p-8 border border-indigo-100/50">
            {/* View Mode Toggle and Report Button */}
            <div className="flex justify-center items-center gap-4 mb-6">
              <div className="inline-flex rounded-lg border-2 border-indigo-600 p-1 bg-white/50">
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-6 py-2 rounded-md font-semibold transition-all ${
                    viewMode === 'monthly'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  📅 Monthly View
                </button>
                <button
                  onClick={() => setViewMode('yearly')}
                  className={`px-6 py-2 rounded-md font-semibold transition-all ${
                    viewMode === 'yearly'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  📆 Yearly View
                </button>
              </div>
              
              <button
                onClick={() => {
                  // Pre-populate modal with current data
                  if (monthlyIncome) {
                    setIncomeEntries(monthlyIncome.incomes);
                  } else {
                    const defaultIncomes = family?.incomeStreams?.map(stream => ({
                      source: stream.source,
                      amount: stream.amount
                    })) || [{ source: '', amount: 0 }];
                    setIncomeEntries(defaultIncomes);
                  }
                  setShowIncomeModal(true);
                }}
                className={`px-6 py-2 rounded-lg transition shadow-md font-semibold flex items-center gap-2 ${
                  monthlyIncome
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 animate-pulse'
                }`}
              >
                💵 {monthlyIncome ? 'Update' : 'Record'} Monthly Income
              </button>
              
              <button
                onClick={() => setShowReportModal(true)}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition shadow-md font-semibold flex items-center gap-2"
              >
                📊 Generate Report
              </button>
            </div>
            
            <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {viewMode === 'monthly' ? 'Monthly' : 'Yearly'} Financial Health
            </h2>
            
            <div className="flex flex-col lg:flex-row items-start justify-center gap-12">
              {/* Economic Targets - Left Side */}
              <div className="space-y-4 min-w-[300px] max-w-[350px]">
                <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                  💰 Economic Targets
                </h3>
                {(!family?.economicTargets || family.economicTargets.length === 0) ? (
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                    <p className="text-gray-500 text-center text-sm">
                      No targets set yet. Add them in your profile!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {family.economicTargets.map((target, index) => {
                      const targetType = target.type || 'savings';
                      const targetCategory = target.category;
                      
                      let currentAmount = 0;
                      let isComplete = false;
                      
                      if (targetType === 'expense' && targetCategory) {
                        // For expense targets: check current month's spending in category
                        currentAmount = expenses
                          .filter(e => isThisMonth(e.date) && e.category === targetCategory)
                          .reduce((sum, e) => sum + e.amount, 0);
                        
                        // Complete if spending is UNDER target
                        isComplete = currentAmount <= target.targetAmount;
                      } else if (targetType === 'savings') {
                        // For savings targets: use monthly balance
                        currentAmount = financials.monthlyBalance > 0 
                          ? Math.min(financials.monthlyBalance, target.targetAmount) 
                          : 0;
                        
                        // Complete if savings reach target
                        isComplete = currentAmount >= target.targetAmount;
                      }
                      
                      const categoryIcons: { [key: string]: string } = {
                        // Expense categories
                        'food': '🍔', 'gasoline': '⛽', 'clothing': '👗', 'utilities': '💡',
                        'restaurants': '🍽️', 'travelling': '✈️', 'leisure': '🎮',
                        'appliances': '📦', 'home-renovations': '🔨', 'medicine': '💊',
                        'vehicle-maintenance': '🔧',
                        // Savings categories
                        'family-fund': '💰', 'education-fund': '🎓', 'holidays': '🏖️',
                        'general-savings': '💎', 'new-home': '🏠', 'new-car': '🚗',
                        'wedding': '💍', 'baby-fund': '👶'
                      };
                      
                      const categoryIcon = targetCategory ? categoryIcons[targetCategory] || '🎯' : '🎯';

                      return (
                        <div 
                          key={index} 
                          className={`p-4 rounded-xl border-2 transition-all shadow-md ${
                            isComplete 
                              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400'
                              : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-2xl ${
                              isComplete ? 'animate-bounce' : ''
                            }`}>
                              {isComplete ? '✅' : '❌'}
                            </span>
                            <span className="text-2xl">{categoryIcon}</span>
                            <div className="flex-1">
                              <p className={`font-bold text-xs mb-1 ${
                                isComplete ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {target.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <p className={`text-xs font-semibold ${
                                  isComplete ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {targetType === 'expense' ? 'Limit' : 'Goal'}: €{target.targetAmount.toFixed(0)}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {targetType === 'expense' ? 'Spent' : 'Saved'}: €{currentAmount.toFixed(0)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Circle Chart */}
              <div className="relative" style={{ width: '400px', height: '400px' }}>
                <svg className="transform -rotate-90" width="400" height="400" viewBox="0 0 400 400">
                  {/* Background circle (total income) */}
                  <circle
                    cx="200"
                    cy="200"
                    r="170"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="60"
                  />
                  
                  {/* Income circle (green) */}
                  <circle
                    cx="200"
                    cy="200"
                    r="170"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="60"
                    strokeDasharray={`${2 * Math.PI * 170}`}
                    strokeDashoffset="0"
                    opacity="0.3"
                  />
                  
                  {/* Expenses overlay (varies by amount) */}
                  {financials.totalIncome > 0 && (
                    <circle
                      cx="200"
                      cy="200"
                      r="170"
                      fill="none"
                      stroke={financials.monthlyBalance >= 0 ? '#6366f1' : '#ef4444'}
                      strokeWidth="60"
                      strokeDasharray={`${2 * Math.PI * 170}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 170 * (1 - (financials.totalIncome - financials.monthlyBalance) / financials.totalIncome)
                      }`}
                      strokeLinecap="round"
                    />
                  )}
                </svg>
                
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-center">
                    <p className={`text-6xl font-bold ${
                      financials.monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      €{Math.abs(financials.monthlyBalance).toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Legend and breakdown */}
              <div className="space-y-5 min-w-[300px]">
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-green-500 opacity-30"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Total Income</p>
                    <p className="text-2xl font-bold text-gray-900">€{financials.totalIncome.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full ${
                    financials.monthlyBalance >= 0 ? 'bg-indigo-600' : 'bg-red-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Total Outgoing</p>
                    <p className="text-2xl font-bold text-gray-900">
                      €{(financials.totalIncome - financials.monthlyBalance).toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t-2 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Fixed Payments:</span>
                    <span className="font-bold text-lg text-gray-900">€{financials.totalFixedPayments.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Property/Loans:</span>
                    <span className="font-bold text-lg text-gray-900">€{(financials.totalPropertyPayments + financials.totalLoanPayments).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{viewMode === 'monthly' ? 'Monthly' : 'Yearly'} Expenses:</span>
                    <span className="font-bold text-lg text-gray-900">€{viewMode === 'monthly' ? financials.expenseTotals.month.toFixed(2) : financials.expenseTotals.year.toFixed(2)}</span>
                  </div>
                </div>
                
                {financials.monthlyBalance < 0 && (
                  <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ Spending exceeds income
                    </p>
                  </div>
                )}
                
                {financials.totalIncome === 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      💡 Add income streams in your profile
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Monthly Income Modal */}
        {showIncomeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowIncomeModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  💵 Record Monthly Income
                </h2>
                <button
                  onClick={() => setShowIncomeModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-3xl font-bold hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center transition"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-2">
                  Record your actual income for <span className="font-bold text-indigo-600">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </p>
                {family?.incomeStreams && family.incomeStreams.length > 0 && !monthlyIncome && (
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    💡 Pre-filled with your profile income streams. Adjust amounts as needed.
                  </p>
                )}
              </div>

              <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                {incomeEntries.map((entry, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Income Source
                      </label>
                      <input
                        type="text"
                        value={entry.source}
                        onChange={(e) => {
                          const newEntries = [...incomeEntries];
                          newEntries[index].source = e.target.value;
                          setIncomeEntries(newEntries);
                        }}
                        placeholder="e.g., Salary, Freelance, etc."
                        className="w-full px-4 py-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                      />
                    </div>
                    <div className="w-40">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={entry.amount}
                        onChange={(e) => {
                          const newEntries = [...incomeEntries];
                          newEntries[index].amount = parseFloat(e.target.value) || 0;
                          setIncomeEntries(newEntries);
                        }}
                        className="w-full px-4 py-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const newEntries = incomeEntries.filter((_, i) => i !== index);
                        setIncomeEntries(newEntries.length > 0 ? newEntries : [{ source: '', amount: 0 }]);
                      }}
                      className="mt-7 w-10 h-10 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center justify-center"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setIncomeEntries([...incomeEntries, { source: '', amount: 0 }]);
                }}
                className="mb-6 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition font-medium flex items-center gap-2"
              >
                + Add Income Source
              </button>

              <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Total Monthly Income:</span>
                  <span className="text-3xl font-bold text-emerald-600">
                    €{incomeEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowIncomeModal(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMonthlyIncome}
                  disabled={savingIncome || incomeEntries.every(e => !e.source || e.amount <= 0)}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingIncome ? '⏳ Saving...' : '✨ Save Income'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowReportModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-7xl w-full h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  📊 Monthly Report
                </h2>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-3xl font-bold hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center transition"
                >
                  ×
                </button>
              </div>

              {/* Month/Year Selector and View Mode Toggle */}
              <div className="space-y-4 mb-4">
                {/* View Mode Toggle */}
                <div className="flex justify-center">
                  <div className="inline-flex rounded-lg border-2 border-indigo-600 p-1 bg-white/50">
                    <button
                      onClick={() => { setReportViewMode('daily'); setSelectedReportDate(null); }}
                      className={`px-6 py-2 rounded-md font-semibold transition-all ${
                        reportViewMode === 'daily'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                          : 'text-indigo-600 hover:bg-indigo-50'
                      }`}
                    >
                      📅 Daily View
                    </button>
                    <button
                      onClick={() => { setReportViewMode('weekly'); setSelectedReportDate(null); }}
                      className={`px-6 py-2 rounded-md font-semibold transition-all ${
                        reportViewMode === 'weekly'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                          : 'text-indigo-600 hover:bg-indigo-50'
                      }`}
                    >
                      📆 Weekly View
                    </button>
                  </div>
                </div>

                {/* Month/Year Selector */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      📅 Select Month
                    </label>
                    <select
                      value={reportMonth}
                      onChange={(e) => { setReportMonth(parseInt(e.target.value)); setSelectedReportDate(null); }}
                      className="w-full px-4 py-3 text-gray-900 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none bg-gradient-to-r from-white to-indigo-50 font-medium"
                    >
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                        <option key={idx} value={idx}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      📆 Select Year
                    </label>
                    <select
                      value={reportYear}
                      onChange={(e) => { setReportYear(parseInt(e.target.value)); setSelectedReportDate(null); }}
                      className="w-full px-4 py-3 text-gray-900 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none bg-gradient-to-r from-white to-indigo-50 font-medium"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Split Panel Content */}
              <div className="flex-1 overflow-hidden flex gap-6">

                {(() => {
                  const selectedExpenses = expenses.filter(e => {
                    const [expYear, expMonth] = e.date.split('-');
                    return parseInt(expMonth) === (reportMonth + 1) && parseInt(expYear) === reportYear;
                  });

                  const totalExpenses = selectedExpenses.reduce((sum, e) => sum + e.amount, 0);
                  
                  const categoryTotals: { [key: string]: number } = {};
                  selectedExpenses.forEach(e => {
                    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
                  });

                  // Group expenses by date
                  const expensesByDate: { [key: string]: Expense[] } = {};
                  selectedExpenses.forEach(e => {
                    if (!expensesByDate[e.date]) {
                      expensesByDate[e.date] = [];
                    }
                    expensesByDate[e.date].push(e);
                  });

                  // Group expenses by week
                  const getWeekNumber = (dateStr: string) => {
                    const date = new Date(dateStr + 'T12:00:00');
                    const firstDay = new Date(reportYear, reportMonth, 1);
                    const dayOfMonth = date.getDate();
                    const firstDayOfWeek = firstDay.getDay();
                    return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
                  };

                  const expensesByWeek: { [key: number]: Expense[] } = {};
                  selectedExpenses.forEach(e => {
                    const weekNum = getWeekNumber(e.date);
                    if (!expensesByWeek[weekNum]) {
                      expensesByWeek[weekNum] = [];
                    }
                    expensesByWeek[weekNum].push(e);
                  });

                  const weeklyTotals: { [key: number]: number } = {};
                  Object.keys(expensesByWeek).forEach(weekNum => {
                    weeklyTotals[parseInt(weekNum)] = expensesByWeek[parseInt(weekNum)].reduce((sum, e) => sum + e.amount, 0);
                  });

                  const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][reportMonth];
                  const daysInMonth = new Date(reportYear, reportMonth + 1, 0).getDate();

                  return (
                    <>
                      {/* Left Panel: Summary, Calendar & Categories */}
                      <div className="w-1/2 flex flex-col space-y-4 overflow-y-auto pr-3">
                        {/* Summary */}
                        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-4 border-2 border-indigo-200">
                          <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {monthName} {reportYear} Summary
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/80 rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-1">Total Expenses</p>
                              <p className="text-2xl font-bold text-indigo-600">€{totalExpenses.toFixed(2)}</p>
                            </div>
                            <div className="bg-white/80 rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-1">Transactions</p>
                              <p className="text-2xl font-bold text-purple-600">{selectedExpenses.length}</p>
                            </div>
                          </div>
                        </div>

                        {/* Daily/Weekly Selector */}
                        {reportViewMode === 'daily' ? (
                          <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                            <h4 className="text-md font-bold text-gray-900 mb-3">Select Day</h4>
                            <div className="grid grid-cols-7 gap-1">
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                <div key={i} className="text-center text-xs font-semibold text-gray-500 py-1">
                                  {day}
                                </div>
                              ))}
                              {(() => {
                                const firstDay = new Date(reportYear, reportMonth, 1).getDay();
                                const days = [];
                                
                                // Empty cells
                                for (let i = 0; i < firstDay; i++) {
                                  days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
                                }
                                
                                // Days
                                for (let day = 1; day <= daysInMonth; day++) {
                                  const dateStr = `${reportYear}-${String(reportMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                  const hasExpenses = expensesByDate[dateStr];
                                  const isSelected = selectedReportDate === dateStr;
                                  
                                  days.push(
                                    <button
                                      key={day}
                                      onClick={() => setSelectedReportDate(dateStr)}
                                      className={`aspect-square text-xs rounded-lg transition ${
                                        isSelected
                                          ? 'bg-indigo-600 text-white font-bold'
                                          : hasExpenses
                                          ? 'bg-red-100 hover:bg-red-200 text-red-700 font-semibold'
                                          : 'hover:bg-gray-100 text-gray-700'
                                      }`}
                                    >
                                      {day}
                                    </button>
                                  );
                                }
                                
                                return days;
                              })()}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                            <h4 className="text-md font-bold text-gray-900 mb-3">Select Week</h4>
                            <div className="space-y-2">
                              {Object.keys(expensesByWeek).sort((a, b) => parseInt(a) - parseInt(b)).map((weekNum) => {
                                const weekNumber = parseInt(weekNum);
                                const isSelected = selectedReportDate === `week-${weekNumber}`;
                                const weekExpenses = expensesByWeek[weekNumber];
                                const weekTotal = weeklyTotals[weekNumber];
                                
                                return (
                                  <button
                                    key={weekNum}
                                    onClick={() => setSelectedReportDate(`week-${weekNumber}`)}
                                    className={`w-full p-3 rounded-lg transition text-left ${
                                      isSelected
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-red-100 hover:bg-red-200 text-gray-900'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <div className="font-bold">Week {weekNumber}</div>
                                        <div className={`text-xs ${
                                          isSelected ? 'text-white/80' : 'text-gray-600'
                                        }`}>
                                          {weekExpenses.length} transaction{weekExpenses.length !== 1 ? 's' : ''}
                                        </div>
                                      </div>
                                      <div className={`text-lg font-bold ${
                                        isSelected ? 'text-white' : 'text-indigo-600'
                                      }`}>
                                        €{weekTotal.toFixed(2)}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                              {Object.keys(expensesByWeek).length === 0 && (
                                <p className="text-center text-gray-400 py-4 text-sm">No expenses this month</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Expenses by Category */}
                        <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                          <h4 className="text-md font-bold text-gray-900 mb-3">Expenses by Category</h4>
                          <div className="space-y-2">
                            {Object.entries(categoryTotals).length === 0 ? (
                              <p className="text-center text-gray-400 py-4 text-sm">No expenses this month</p>
                            ) : (
                              Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([category, amount]) => (
                                <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">{categoryEmojis[category]}</span>
                                    <span className="font-semibold capitalize text-sm text-gray-900">{category}</span>
                                  </div>
                                  <span className="text-sm font-bold text-indigo-600">€{amount.toFixed(2)}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Download Button */}
                        <button
                          onClick={() => generatePDFReport(reportMonth, reportYear)}
                          className="py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg flex items-center justify-center gap-2"
                        >
                          📊 Download PDF Report
                        </button>
                      </div>

                      {/* Right Panel: Transaction Details */}
                      <div className="w-1/2 flex flex-col bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                        {!selectedReportDate ? (
                          /* Monthly View - Show all expenses for the month */
                          <>
                            <div className="mb-3 space-y-3">
                              <h4 className="text-md font-bold text-gray-900">
                                Monthly Expenses - {monthName} {reportYear}
                              </h4>
                              
                              {/* Filter Toggle */}
                              <div className="inline-flex rounded-lg border-2 border-indigo-500 p-0.5 bg-white">
                                <button
                                  onClick={() => setReportFilterMode('all')}
                                  className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                                    reportFilterMode === 'all'
                                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                                      : 'text-indigo-600 hover:bg-indigo-50'
                                  }`}
                                >
                                  All Sorted
                                </button>
                                <button
                                  onClick={() => setReportFilterMode('by-category')}
                                  className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                                    reportFilterMode === 'by-category'
                                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                                      : 'text-indigo-600 hover:bg-indigo-50'
                                  }`}
                                >
                                  By Category
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto space-y-2">
                              {selectedExpenses.length === 0 ? (
                                <p className="text-center text-gray-400 py-12">No expenses this month</p>
                              ) : reportFilterMode === 'all' ? (
                                /* All expenses sorted by amount */
                                [...selectedExpenses].sort((a, b) => b.amount - a.amount).map((expense) => (
                                  <div key={expense._id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl">{getExpenseIcon(expense)}</span>
                                      <div>
                                        <div className="font-semibold text-gray-900">{expense.description}</div>
                                        <div className="text-xs text-gray-500">
                                          <span>{new Date(expense.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                          <span className="mx-1">•</span>
                                          <span className="capitalize">{expense.category}</span>
                                          {expense.subcategory && (
                                            <span className="text-indigo-600"> • {expense.subcategory}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <span className="text-lg font-bold text-indigo-600">€{expense.amount.toFixed(2)}</span>
                                  </div>
                                ))
                              ) : (
                                /* Expenses grouped by category, sorted within each group */
                                (() => {
                                  const expensesByCategory: { [key: string]: Expense[] } = {};
                                  selectedExpenses.forEach(e => {
                                    if (!expensesByCategory[e.category]) {
                                      expensesByCategory[e.category] = [];
                                    }
                                    expensesByCategory[e.category].push(e);
                                  });
                                  
                                  // Sort categories by total amount
                                  const sortedCategories = Object.entries(expensesByCategory)
                                    .sort((a, b) => {
                                      const totalA = a[1].reduce((sum, e) => sum + e.amount, 0);
                                      const totalB = b[1].reduce((sum, e) => sum + e.amount, 0);
                                      return totalB - totalA;
                                    });
                                  
                                  return sortedCategories.map(([category, categoryExpenses]) => {
                                    const categoryTotal = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
                                    const sortedExpenses = [...categoryExpenses].sort((a, b) => b.amount - a.amount);
                                    const isExpanded = expandedCategories.has(category);
                                    
                                    return (
                                      <div key={category} className="mb-2">
                                        <button
                                          onClick={() => {
                                            const newExpanded = new Set(expandedCategories);
                                            if (isExpanded) {
                                              newExpanded.delete(category);
                                            } else {
                                              newExpanded.add(category);
                                            }
                                            setExpandedCategories(newExpanded);
                                          }}
                                          className="w-full flex items-center justify-between p-3 bg-indigo-100 rounded-lg border-2 border-indigo-300 hover:bg-indigo-200 transition cursor-pointer"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
                                            <span className="text-xl">{categoryEmojis[category]}</span>
                                            <span className="font-bold capitalize text-sm text-gray-900">{category}</span>
                                            <span className="text-xs text-gray-600">({sortedExpenses.length})</span>
                                          </div>
                                          <span className="text-sm font-bold text-indigo-700">€{categoryTotal.toFixed(2)}</span>
                                        </button>
                                        {isExpanded && (
                                          <div className="space-y-1 mt-1 ml-4">
                                            {sortedExpenses.map((expense) => (
                                              <div key={expense._id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                                                <div className="flex items-center gap-3">
                                                  <span className="text-xl">{getExpenseIcon(expense)}</span>
                                                  <div>
                                                    <div className="font-semibold text-sm text-gray-900">{expense.description}</div>
                                                    <div className="text-xs text-gray-500">
                                                      <span>{new Date(expense.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                      {expense.subcategory && (
                                                        <span className="text-indigo-600"> • {expense.subcategory}</span>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                                <span className="text-base font-bold text-indigo-600">€{expense.amount.toFixed(2)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  });
                                })()
                              )}
                            </div>
                          </>
                        ) : reportViewMode === 'daily' ? (
                          /* Daily View - Show expenses for selected day */
                          <>
                            <h4 className="text-md font-bold text-gray-900 mb-3">
                              {`Transactions on ${new Date(selectedReportDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
                            </h4>
                            <div className="flex-1 overflow-y-auto space-y-2">
                              {expensesByDate[selectedReportDate] ? (
                                expensesByDate[selectedReportDate].map((expense) => (
                                  <div key={expense._id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl">{getExpenseIcon(expense)}</span>
                                      <div>
                                        <div className="font-semibold text-gray-900">{expense.description}</div>
                                        <div className="text-xs text-gray-500">
                                          <span className="capitalize">{expense.category}</span>
                                          {expense.subcategory && (
                                            <span className="text-indigo-600"> • {expense.subcategory}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <span className="text-lg font-bold text-indigo-600">€{expense.amount.toFixed(2)}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-center text-gray-400 py-12">No expenses on this day</p>
                              )}
                            </div>
                          </>
                        ) : (
                          /* Weekly View - Show expenses for selected week */
                          <>
                            <h4 className="text-md font-bold text-gray-900 mb-3">
                              {selectedReportDate.startsWith('week-')
                                ? `Transactions for Week ${selectedReportDate.replace('week-', '')}`
                                : 'Select a week to view transactions'}
                            </h4>
                            <div className="flex-1 overflow-y-auto space-y-2">
                              {selectedReportDate.startsWith('week-') && (() => {
                                const weekNumber = parseInt(selectedReportDate.replace('week-', ''));
                                const weekExpenses = expensesByWeek[weekNumber];
                                
                                if (weekExpenses && weekExpenses.length > 0) {
                                  return weekExpenses.map((expense) => (
                                    <div key={expense._id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                                      <div className="flex items-center gap-3">
                                        <span className="text-2xl">{getExpenseIcon(expense)}</span>
                                        <div>
                                          <div className="font-semibold text-gray-900">{expense.description}</div>
                                          <div className="text-xs text-gray-500">
                                            <span>{new Date(expense.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                            <span className="mx-1">•</span>
                                            <span className="capitalize">{expense.category}</span>
                                            {expense.subcategory && (
                                              <span className="text-indigo-600"> • {expense.subcategory}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <span className="text-lg font-bold text-indigo-600">€{expense.amount.toFixed(2)}</span>
                                    </div>
                                  ));
                                }
                                return <p className="text-center text-gray-400 py-12">No expenses this week</p>;
                              })()}
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Calendar and Expense Entry */}
        <section className="bg-gradient-to-br from-white via-purple-50/50 to-pink-50/50 backdrop-blur-md rounded-xl shadow-xl p-8 border border-purple-100/50">
          <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">🗓️ Add Daily Expenses</h2>
          
          {/* Calendar */}
          <div className="max-w-4xl mx-auto">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(currentMonth.getMonth() - 1);
                  setCurrentMonth(newMonth);
                }}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
              >
                ← Previous
              </button>
              <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(currentMonth.getMonth() + 1);
                  // Don't allow navigation beyond current month
                  if (newMonth <= new Date()) {
                    setCurrentMonth(newMonth);
                  }
                }}
                disabled={currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {(() => {
                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth();
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const today = new Date();
                const days = [];

                // Empty cells for days before month starts
                for (let i = 0; i < firstDay; i++) {
                  days.push(<div key={`empty-${i}`} className="p-2"></div>);
                }

                // Days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(year, month, day);
                  const isToday = date.toDateString() === today.toDateString();
                  const isFuture = date > today;
                  const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                  
                  // Count expenses for this day
                  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                  const dayExpenses = expenses.filter(e => e.date === dateStr);
                  const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

                  days.push(
                    <button
                      key={day}
                      onClick={() => {
                        if (!isFuture) {
                          setSelectedDate(date);
                          setShowExpenseModal(true);
                        }
                      }}
                      disabled={isFuture}
                      className={`p-3 rounded-lg border-2 transition ${
                        isFuture
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                          : isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : isToday
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-600 hover:bg-indigo-100'
                          : dayTotal > 0
                          ? 'bg-red-50 border-red-300 text-gray-800 hover:bg-red-100'
                          : 'border-gray-200 text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-semibold">{day}</div>
                      {dayTotal > 0 && !isFuture && (
                        <div className="text-xs mt-1">€{dayTotal.toFixed(0)}</div>
                      )}
                    </button>
                  );
                }

                return days;
              })()}
            </div>

            {/* Expense Entry Modal/Form */}
            {showExpenseModal && selectedDate && (
              <div className="mt-8 p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border-2 border-indigo-200 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    ✨ Add Expense for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => setShowExpenseModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold hover:bg-white/50 rounded-full w-8 h-8 flex items-center justify-center transition"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleAddExpense} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="text-lg">💵</span> Amount (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        required
                        className="w-full px-5 py-3 text-lg text-gray-900 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none bg-gradient-to-r from-white to-indigo-50 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="text-lg">🏷️</span> Category
                      </label>
                      <select
                        value={expenseCategory}
                        onChange={(e) => {
                          setExpenseCategory(e.target.value);
                          setExpenseSubcategory(''); // Reset subcategory when category changes
                        }}
                        required
                        className="w-full px-5 py-3 text-lg text-gray-900 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none bg-gradient-to-r from-white to-indigo-50 appearance-none cursor-pointer transition-all font-medium"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236366f1\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                      >
                        <option value="" className="text-gray-400">✨ Select Category</option>
                        <option value="food">🍔 Food</option>
                        <option value="gasoline">⛽ Gasoline</option>
                        <option value="clothing">👗 Clothing</option>
                        <option value="utilities">💡 Utilities</option>
                        <option value="restaurants">🍽️ Restaurants</option>
                        <option value="travelling">✈️ Travelling</option>
                        <option value="leisure">🎮 Leisure</option>
                        <option value="appliances">📦 Appliances</option>
                        <option value="home-renovations">🔨 Home Renovations</option>
                        <option value="medicine">💊 Medicine</option>
                        <option value="vehicle-maintenance">🔧 Vehicle Maintenance</option>
                        <option value="personal-care">🧴 Personal Care</option>
                        <option value="taxes">💰 Taxes</option>
                        <option value="sports">⚽ Sports</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Food Subcategory */}
                  {expenseCategory === 'food' && (
                    <div className="animate-fadeIn">
                      <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="text-lg">🍔</span> Food Type
                      </label>
                      <select
                        value={expenseSubcategory}
                        onChange={(e) => setExpenseSubcategory(e.target.value)}
                        required
                        className="w-full px-5 py-3 text-lg text-gray-900 border-2 border-green-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none bg-gradient-to-r from-white to-green-50 appearance-none cursor-pointer transition-all font-medium"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%2310b981\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                      >
                        <option value="">✨ Select Food Type</option>
                        <option value="meat">🥩 Meat</option>
                        <option value="fish">🐟 Fish</option>
                        <option value="chicken">🍗 Chicken</option>
                        <option value="rice">🍚 Rice</option>
                        <option value="pasta">🍝 Pasta</option>
                        <option value="sauces">🥫 Sauces</option>
                        <option value="bread">🥖 Bread</option>
                        <option value="eggs">🥚 Eggs</option>
                        <option value="milk">🥛 Milk</option>
                        <option value="water">💧 Water</option>
                        <option value="candies">🍬 Candies</option>
                        <option value="pancakes">🥞 Pancakes</option>
                        <option value="cheese">🧀 Cheese</option>
                        <option value="jam">🍯 Jam</option>
                        <option value="cereals">🥣 Cereals</option>
                        <option value="protein">💪 Protein</option>
                        <option value="drinks">🥤 Drinks</option>
                        <option value="snacks-chips">🍿 Snacks/Chips</option>
                        <option value="desserts">🍰 Desserts</option>
                        <option value="other">🍽️ Other</option>
                      </select>
                    </div>
                  )}

                  {/* Gasoline Subcategory */}
                  {expenseCategory === 'gasoline' && (
                    <div className="animate-fadeIn">
                      <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="text-lg">⛽</span> Fuel Type
                      </label>
                      <select
                        value={expenseSubcategory}
                        onChange={(e) => setExpenseSubcategory(e.target.value)}
                        required
                        className="w-full px-5 py-3 text-lg text-gray-900 border-2 border-yellow-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 focus:outline-none bg-gradient-to-r from-white to-yellow-50 appearance-none cursor-pointer transition-all font-medium"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23eab308\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                      >
                        <option value="">✨ Select Fuel Type</option>
                        <option value="diesel">⛽ Diesel</option>
                        <option value="gasoline">⛽ Gasoline</option>
                      </select>
                    </div>
                  )}

                  {/* Utilities Subcategory */}
                  {expenseCategory === 'utilities' && (
                    <div className="animate-fadeIn">
                      <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="text-lg">💡</span> Utility Area
                      </label>
                      <select
                        value={expenseSubcategory}
                        onChange={(e) => setExpenseSubcategory(e.target.value)}
                        required
                        className="w-full px-5 py-3 text-lg text-gray-900 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none bg-gradient-to-r from-white to-blue-50 appearance-none cursor-pointer transition-all font-medium"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%233b82f6\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                      >
                        <option value="">✨ Select Utility Area</option>
                        <option value="kitchen">🍳 Kitchen</option>
                        <option value="bathroom">🛁 Bathroom</option>
                        <option value="housing">🏠 Housing</option>
                      </select>
                    </div>
                  )}

                  {/* Restaurants Subcategory */}
                  {expenseCategory === 'restaurants' && (
                    <div className="animate-fadeIn">
                      <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="text-lg">🍽️</span> Meal Type
                      </label>
                      <select
                        value={expenseSubcategory}
                        onChange={(e) => setExpenseSubcategory(e.target.value)}
                        required
                        className="w-full px-5 py-3 text-lg text-gray-900 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none bg-gradient-to-r from-white to-orange-50 appearance-none cursor-pointer transition-all font-medium"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23f97316\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                      >
                        <option value="">✨ Select Meal Type</option>
                        <option value="breakfast">🥐 Breakfast</option>
                        <option value="lunch">🍲 Lunch</option>
                        <option value="dinner">🍴 Dinner</option>
                        <option value="snack">☕ Snack</option>
                      </select>
                    </div>
                  )}

                  {/* Clothing Subcategory */}
                  {expenseCategory === 'clothing' && (
                    <div className="animate-fadeIn">
                      <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="text-lg">👗</span> For Whom
                      </label>
                      <select
                        value={expenseSubcategory}
                        onChange={(e) => setExpenseSubcategory(e.target.value)}
                        required
                        className="w-full px-5 py-3 text-lg text-gray-900 border-2 border-pink-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none bg-gradient-to-r from-white to-pink-50 appearance-none cursor-pointer transition-all font-medium"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23ec4899\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                      >
                        <option value="">✨ Select Category</option>
                        <option value="kids">🧒 Kids</option>
                        <option value="adults">👔 Adults</option>
                        <option value="baby">👶 Baby</option>
                      </select>
                    </div>
                  )}

                  {/* Medicine Subcategory */}
                  {expenseCategory === 'medicine' && (
                    <div className="animate-fadeIn">
                      <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="text-lg">💊</span> For Whom
                      </label>
                      <select
                        value={expenseSubcategory}
                        onChange={(e) => setExpenseSubcategory(e.target.value)}
                        required
                        className="w-full px-5 py-3 text-lg text-gray-900 border-2 border-red-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none bg-gradient-to-r from-white to-red-50 appearance-none cursor-pointer transition-all font-medium"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23ef4444\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                      >
                        <option value="">✨ Select Category</option>
                        <option value="adult">👨 Adult</option>
                        <option value="child">👦 Child</option>
                      </select>
                    </div>
                  )}

                  {/* Vehicle Maintenance Subcategory */}
                  {expenseCategory === 'vehicle-maintenance' && (
                    <div className="animate-fadeIn">
                      <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="text-lg">🔧</span> Maintenance Type
                      </label>
                      <select
                        value={expenseSubcategory}
                        onChange={(e) => setExpenseSubcategory(e.target.value)}
                        required
                        className="w-full px-5 py-3 text-lg text-gray-900 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none bg-gradient-to-r from-white to-blue-50 appearance-none cursor-pointer transition-all font-medium"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%233b82f6\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                      >
                        <option value="">✨ Select Type</option>
                        <option value="taxes">💸 Taxes</option>
                        <option value="general-maintenance">🔧 General Maintenance</option>
                        <option value="repairs">🔨 Repairs</option>
                      </select>
                    </div>
                  )}

                  {/* Personal Care Subcategory */}
                  {expenseCategory === 'personal-care' && (
                    <div className="animate-fadeIn">
                      <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="text-lg">🧴</span> For Whom
                      </label>
                      <select
                        value={expenseSubcategory}
                        onChange={(e) => setExpenseSubcategory(e.target.value)}
                        required
                        className="w-full px-5 py-3 text-lg text-gray-900 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none bg-gradient-to-r from-white to-purple-50 appearance-none cursor-pointer transition-all font-medium"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23a855f7\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                      >
                        <option value="">✨ Select Category</option>
                        <option value="woman">💄 Woman</option>
                        <option value="men">🧔 Men</option>
                      </select>
                    </div>
                  )}

                  {/* Taxes Subcategory */}
                  {expenseCategory === 'taxes' && (
                    <div className="animate-fadeIn">
                      <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="text-lg">💰</span> Tax Type
                      </label>
                      <select
                        value={expenseSubcategory}
                        onChange={(e) => setExpenseSubcategory(e.target.value)}
                        required
                        className="w-full px-5 py-3 text-lg text-gray-900 border-2 border-green-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none bg-gradient-to-r from-white to-green-50 appearance-none cursor-pointer transition-all font-medium"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%2310b981\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                      >
                        <option value="">✨ Select Tax Type</option>
                        <option value="properties">🏠 Properties</option>
                        <option value="vehicles">🚗 Vehicles</option>
                      </select>
                    </div>
                  )}

                  {/* Sports Subcategory */}
                  {expenseCategory === 'sports' && (
                    <div className="animate-fadeIn">
                      <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="text-lg">⚽</span> Sports Type
                      </label>
                      <select
                        value={expenseSubcategory}
                        onChange={(e) => setExpenseSubcategory(e.target.value)}
                        required
                        className="w-full px-5 py-3 text-lg text-gray-900 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none bg-gradient-to-r from-white to-orange-50 appearance-none cursor-pointer transition-all font-medium"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23f97316\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                      >
                        <option value="">✨ Select Sports Type</option>
                        <option value="clothing">👟 Clothing</option>
                        <option value="courts">🎾 Courts</option>
                        <option value="accessories">🎽 Accessories</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="text-lg">📝</span> Description
                    </label>
                    <input
                      type="text"
                      value={expenseDescription}
                      onChange={(e) => setExpenseDescription(e.target.value)}
                      placeholder="What did you buy?"
                      required
                      className="w-full px-5 py-3 text-lg text-gray-900 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none bg-gradient-to-r from-white to-indigo-50 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {submitting ? '⏳ Adding...' : '✨ Add Expense'}
                  </button>
                </form>

                {/* Show expenses for selected day */}
                {(() => {
                  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
                  const dayExpenses = expenses.filter(e => e.date === selectedDateStr);

                  if (dayExpenses.length > 0) {
                    return (
                      <div className="mt-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Expenses for this day:</h4>
                        <div className="space-y-2">
                          {dayExpenses.map((expense) => (
                            <div
                              key={expense._id}
                              className="flex items-center justify-between p-3 bg-white rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{getExpenseIcon(expense)}</span>
                                <div>
                                  <div className="font-semibold text-gray-900">{expense.description}</div>
                                  <div className="text-sm text-gray-600">
                                    <span className="capitalize">{expense.category}</span>
                                    {expense.subcategory && (
                                      <span className="text-indigo-600"> • {expense.subcategory}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-indigo-600">
                                  €{expense.amount.toFixed(2)}
                                </span>
                                <button
                                  onClick={() => handleDeleteExpense(expense._id)}
                                  className="w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition flex items-center justify-center"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
