'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupMembers, setSignupMembers] = useState('');
  const [signupAges, setSignupAges] = useState('');
  const [signupGenders, setSignupGenders] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Store family data in localStorage
      localStorage.setItem('currentFamily', JSON.stringify(data.family));
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Parse and validate ages
    const agesArray = signupAges.split(',').map(age => age.trim()).filter(age => age);
    const numMembers = parseInt(signupMembers);

    if (agesArray.length !== numMembers) {
      setError(`Please enter ${numMembers} ages (one for each family member)`);
      return;
    }

    const ages = agesArray.map(age => parseInt(age));
    const validAges = ages.every(age => !isNaN(age) && age > 0 && age < 150);
    
    if (!validAges) {
      setError('Please enter valid ages (numbers between 1-149)');
      return;
    }

    // Parse and validate genders
    const gendersArray = signupGenders.split(',').map(g => g.trim().toLowerCase()).filter(g => g);
    
    if (gendersArray.length !== numMembers) {
      setError(`Please enter ${numMembers} genders (one for each family member)`);
      return;
    }

    const validGenders = gendersArray.every(g => ['m', 'male', 'f', 'female', 'boy', 'girl'].includes(g));
    
    if (!validGenders) {
      setError('Please enter valid genders (m/male/boy for males, f/female/girl for females)');
      return;
    }

    // Normalize genders to 'male' or 'female'
    const genders = gendersArray.map(g => {
      if (['m', 'male', 'boy'].includes(g)) return 'male';
      if (['f', 'female', 'girl'].includes(g)) return 'female';
      return 'male';
    });

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          members: numMembers,
          ages,
          genders,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Store family data in localStorage
      localStorage.setItem('currentFamily', JSON.stringify(data.family));
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-700 flex items-center justify-center p-5">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md animate-fadeIn">
        <div className="flex justify-center mb-4">
          <img src="/logo.png" alt="Bull's Eye Logo" className="w-28 h-28 object-contain" />
        </div>
        <h1 className="text-4xl font-extrabold text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 tracking-tight" style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>
          Bull's Eye Economic Target
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Hit your money targets!
        </p>

        {/* Tab Buttons */}
        <div className="flex gap-3 mb-8">
          <button
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'login'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-gray-50'
            }`}
            onClick={() => {
              setActiveTab('login');
              setError('');
            }}
          >
            Login
          </button>
          <button
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'signup'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-gray-50'
            }`}
            onClick={() => {
              setActiveTab('signup');
              setError('');
            }}
          >
            Add Family
          </button>
        </div>

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <h2 className="text-2xl font-semibold mb-5">Welcome Back!</h2>
            
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">
                Family Email
              </label>
              <input
                type="email"
                id="login-email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="login-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </form>
        )}

        {/* Signup Form */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-5">
            <h2 className="text-2xl font-semibold mb-5">Add Your Family</h2>
            
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 mb-2">
                Family Name
              </label>
              <input
                type="text"
                id="signup-name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="e.g., Rodriguez Family"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-2">
                Family Email
              </label>
              <input
                type="email"
                id="signup-email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="signup-members" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Family Members
              </label>
              <input
                type="number"
                id="signup-members"
                value={signupMembers}
                onChange={(e) => setSignupMembers(e.target.value)}
                min="1"
                max="20"
                placeholder="e.g., 4"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="signup-ages" className="block text-sm font-medium text-gray-700 mb-2">
                Ages of Family Members
              </label>
              <input
                type="text"
                id="signup-ages"
                value={signupAges}
                onChange={(e) => setSignupAges(e.target.value)}
                placeholder="e.g., 35, 32, 8, 5"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none transition"
              />
              <small className="text-gray-500 text-xs">Enter ages separated by commas</small>
            </div>

            <div>
              <label htmlFor="signup-genders" className="block text-sm font-medium text-gray-700 mb-2">
                Genders of Family Members
              </label>
              <input
                type="text"
                id="signup-genders"
                value={signupGenders}
                onChange={(e) => setSignupGenders(e.target.value)}
                placeholder="e.g., m, f, boy, girl"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none transition"
              />
              <small className="text-gray-500 text-xs">Use m/male/boy or f/female/girl, separated by commas</small>
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="signup-password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                minLength={6}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="signup-confirm-password"
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                minLength={6}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Family Account'}
            </button>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
