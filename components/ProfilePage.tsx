'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Family {
  id: string;
  name: string;
  incomeStreams?: Array<{ source: string; amount: number }>;
  fixedPayments?: Array<{ name: string; amount: number }>;
  properties?: Array<{ name: string; value: number; monthlyPayment?: number }>;
  loans?: Array<{ name: string; monthlyAmount: number; endDate: string }>;
}

type TabType = 'income' | 'payments' | 'properties' | 'loans';

export default function ProfilePage() {
  const router = useRouter();
  const [family, setFamily] = useState<Family | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('income');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Income Streams State
  const [incomeStreams, setIncomeStreams] = useState<Array<{ source: string; amount: number }>>([]);
  
  // Fixed Payments State
  const [fixedPayments, setFixedPayments] = useState<Array<{ name: string; amount: number }>>([]);
  
  // Properties State
  const [properties, setProperties] = useState<Array<{ name: string; value: number; monthlyPayment?: number }>>([]);
  
  // Loans State
  const [loans, setLoans] = useState<Array<{ name: string; monthlyAmount: number; endDate: string }>>([]);

  useEffect(() => {
    const familyData = localStorage.getItem('currentFamily');
    if (!familyData) {
      router.push('/');
      return;
    }

    const parsedFamily = JSON.parse(familyData);
    console.log('Parsed family:', parsedFamily);
    setFamily(parsedFamily);
    const familyId = parsedFamily.id || parsedFamily._id;
    if (familyId) {
      fetchProfile(familyId);
    } else {
      console.error('No family ID found');
      setLoading(false);
    }
  }, [router]);

  const fetchProfile = async (familyId: string) => {
    try {
      const res = await fetch(`/api/profile?familyId=${familyId}`);
      const data = await res.json();
      
      if (res.ok) {
        setIncomeStreams(data.family.incomeStreams || []);
        setFixedPayments(data.family.fixedPayments || []);
        setProperties(data.family.properties || []);
        setLoans(data.family.loans || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!family) return;

    const familyId = family.id || (family as any)._id;
    if (!familyId) {
      alert('Error: Family ID not found. Please log in again.');
      return;
    }

    // Filter out empty entries
    const validIncomeStreams = incomeStreams.filter(s => s.source && s.source.trim() && s.amount > 0);
    const validFixedPayments = fixedPayments.filter(p => p.name && p.name.trim() && p.amount > 0);
    const validProperties = properties.filter(p => p.name && p.name.trim() && p.value > 0);
    const validLoans = loans.filter(l => l.name && l.name.trim() && l.monthlyAmount > 0 && l.endDate);

    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId,
          incomeStreams: validIncomeStreams,
          fixedPayments: validFixedPayments,
          properties: validProperties,
          loans: validLoans,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update localStorage with new data
        const updatedFamily = { ...family, ...data.family };
        localStorage.setItem('currentFamily', JSON.stringify(updatedFamily));
        
        // Update local state with saved data
        setIncomeStreams(validIncomeStreams);
        setFixedPayments(validFixedPayments);
        setProperties(validProperties);
        setLoans(validLoans);
        
        alert('Profile saved successfully!');
      } else {
        const error = await res.json();
        alert(`Failed to save: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Income Streams Functions
  const addIncomeStream = () => {
    setIncomeStreams([...incomeStreams, { source: '', amount: 0 }]);
  };

  const updateIncomeStream = (index: number, field: 'source' | 'amount', value: string | number) => {
    const updated = [...incomeStreams];
    updated[index] = { ...updated[index], [field]: value };
    setIncomeStreams(updated);
  };

  const removeIncomeStream = (index: number) => {
    setIncomeStreams(incomeStreams.filter((_, i) => i !== index));
  };

  // Fixed Payments Functions
  const addFixedPayment = () => {
    setFixedPayments([...fixedPayments, { name: '', amount: 0 }]);
  };

  const updateFixedPayment = (index: number, field: 'name' | 'amount', value: string | number) => {
    const updated = [...fixedPayments];
    updated[index] = { ...updated[index], [field]: value };
    setFixedPayments(updated);
  };

  const removeFixedPayment = (index: number) => {
    setFixedPayments(fixedPayments.filter((_, i) => i !== index));
  };

  // Properties Functions
  const addProperty = () => {
    setProperties([...properties, { name: '', value: 0, monthlyPayment: 0 }]);
  };

  const updateProperty = (index: number, field: 'name' | 'value' | 'monthlyPayment', value: string | number) => {
    const updated = [...properties];
    updated[index] = { ...updated[index], [field]: value };
    setProperties(updated);
  };

  const removeProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index));
  };

  // Loans Functions
  const addLoan = () => {
    setLoans([...loans, { name: '', monthlyAmount: 0, endDate: '' }]);
  };

  const updateLoan = (index: number, field: 'name' | 'monthlyAmount' | 'endDate', value: string | number) => {
    const updated = [...loans];
    updated[index] = { ...updated[index], [field]: value };
    setLoans(updated);
  };

  const removeLoan = (index: number) => {
    setLoans(loans.filter((_, i) => i !== index));
  };

  if (loading || !family) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Bull's Eye Logo" className="w-14 h-14 object-contain" />
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight" style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>Bull's Eye Economic Target - Financial Profile</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 hover:from-indigo-200 hover:to-purple-200 rounded-lg transition border border-indigo-200 font-medium"
            >
              ← Back to Dashboard
            </button>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-md disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-xl p-6 border border-white/50">
          <div className="flex gap-2 mb-6 border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('income')}
              className={`px-6 py-3 font-semibold transition border-b-2 ${
                activeTab === 'income'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-indigo-600'
              }`}
            >
              💰 Income Streams
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-3 font-semibold transition border-b-2 ${
                activeTab === 'payments'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-indigo-600'
              }`}
            >
              💳 Fixed Payments
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className={`px-6 py-3 font-semibold transition border-b-2 ${
                activeTab === 'properties'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-indigo-600'
              }`}
            >
              🏠 Properties
            </button>
            <button
              onClick={() => setActiveTab('loans')}
              className={`px-6 py-3 font-semibold transition border-b-2 ${
                activeTab === 'loans'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-indigo-600'
              }`}
            >
              💸 Loans
            </button>
          </div>

          {/* Income Streams Tab */}
          {activeTab === 'income' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Monthly Income Streams</h3>
                <button
                  onClick={addIncomeStream}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  + Add Income
                </button>
              </div>

              {incomeStreams.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No income streams added yet.</p>
              ) : (
                incomeStreams.map((stream, index) => (
                  <div key={index} className="flex gap-4 items-center p-4 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      placeholder="Source (e.g., Salary, Freelance)"
                      value={stream.source}
                      onChange={(e) => updateIncomeStream(index, 'source', e.target.value)}
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={stream.amount || ''}
                      onChange={(e) => updateIncomeStream(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-40 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                    />
                    <button
                      onClick={() => removeIncomeStream(index)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Fixed Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Fixed Monthly Payments</h3>
                <button
                  onClick={addFixedPayment}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  + Add Payment
                </button>
              </div>

              {fixedPayments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No fixed payments added yet.</p>
              ) : (
                fixedPayments.map((payment, index) => (
                  <div key={index} className="flex gap-4 items-center p-4 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      placeholder="Payment name (e.g., Rent, Insurance)"
                      value={payment.name}
                      onChange={(e) => updateFixedPayment(index, 'name', e.target.value)}
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={payment.amount || ''}
                      onChange={(e) => updateFixedPayment(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-40 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                    />
                    <button
                      onClick={() => removeFixedPayment(index)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Properties</h3>
                <button
                  onClick={addProperty}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  + Add Property
                </button>
              </div>

              {properties.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No properties added yet.</p>
              ) : (
                properties.map((property, index) => (
                  <div key={index} className="flex gap-4 items-center p-4 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      placeholder="Property name"
                      value={property.name}
                      onChange={(e) => updateProperty(index, 'name', e.target.value)}
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Value"
                      value={property.value || ''}
                      onChange={(e) => updateProperty(index, 'value', parseFloat(e.target.value) || 0)}
                      className="w-40 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Monthly Payment"
                      value={property.monthlyPayment || ''}
                      onChange={(e) => updateProperty(index, 'monthlyPayment', parseFloat(e.target.value) || 0)}
                      className="w-40 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                    />
                    <button
                      onClick={() => removeProperty(index)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Loans Tab */}
          {activeTab === 'loans' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Loans</h3>
                <button
                  onClick={addLoan}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  + Add Loan
                </button>
              </div>

              {loans.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No loans added yet.</p>
              ) : (
                loans.map((loan, index) => (
                  <div key={index} className="flex gap-4 items-center p-4 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      placeholder="Loan name"
                      value={loan.name}
                      onChange={(e) => updateLoan(index, 'name', e.target.value)}
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Monthly Amount"
                      value={loan.monthlyAmount || ''}
                      onChange={(e) => updateLoan(index, 'monthlyAmount', parseFloat(e.target.value) || 0)}
                      className="w-40 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                    />
                    <input
                      type="date"
                      placeholder="End Date"
                      value={loan.endDate}
                      onChange={(e) => updateLoan(index, 'endDate', e.target.value)}
                      className="w-48 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                    />
                    <button
                      onClick={() => removeLoan(index)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
