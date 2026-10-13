import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Shield, Wrench, Cog } from 'lucide-react';

const USERS = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    displayName: 'Administrator',
    description: 'Full system access'
  },
  {
    username: 'mechanic',
    password: 'mech123',
    role: 'mechanic',
    displayName: 'Field Mechanic',
    description: 'Operations & predictor access'
  }
];

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      const user = USERS.find(
        (u) => u.username === username.trim() && u.password === password
      );
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid username or password. Please try again.');
      }
      setLoading(false);
    }, 600);
  };

  const quickLogin = (user) => {
    setUsername(user.username);
    setPassword(user.password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-xl border border-gray-200">

        {/* Left Panel — Simple Branding */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-10 flex flex-col justify-between text-white">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Cog className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold">Machine Health Monitor</h1>
                <p className="text-xs text-blue-200">Factory Management System</p>
              </div>
            </div>

            {/* Simple headline */}
            <h2 className="text-3xl font-black leading-snug mb-4">
              Know before<br />your machine<br />breaks.
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed mb-8">
              Live prediction of machine failure — before it happens. Keep your factory running without unexpected breakdowns.
            </p>

            {/* Simple non-technical benefits */}
            <div className="space-y-4">
              {[
                { icon: '🔮', text: 'Predict machine failure in advance' },
                { icon: '⚙️', text: 'Monitor machines in real time' },
                { icon: '📊', text: 'See which machines need attention' },
                { icon: '🛠️', text: 'Plan maintenance before a breakdown' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm text-blue-100">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/20 text-xs text-blue-700">
            10,000 machine records analysed &bull; AI-powered predictions
          </div>
        </div>

        {/* Right Panel — Login Form */}
        <div className="bg-white p-10 flex flex-col justify-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-1">Welcome Back</h3>
            <p className="text-sm text-gray-400">Sign in to access your dashboard</p>
          </div>

          {/* Quick Role Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => quickLogin(USERS[0])}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 border-blue-100 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 text-left transition-all"
            >
              <Shield className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <div className="text-xs font-bold text-gray-700">Admin</div>
                <div className="text-[10px] text-gray-400">Full access</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => quickLogin(USERS[1])}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 border-emerald-100 hover:border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-left transition-all"
            >
              <Wrench className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <div className="text-xs font-bold text-gray-700">Mechanic</div>
                <div className="text-[10px] text-gray-400">Field view</div>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-100"></div>
            <span className="text-xs text-gray-400">or enter manually</span>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or mechanic"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition disabled:opacity-60 text-sm mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          {/* Credentials hint — simple */}
          <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-2">
            <div className="font-semibold text-gray-500 mb-1">Login credentials:</div>
            <div className="flex justify-between text-gray-500">
              <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-blue-700"/>Admin</span>
              <span className="font-mono text-gray-600">admin / admin123</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span className="flex items-center gap-1.5"><Wrench className="w-3 h-3 text-emerald-700"/>Mechanic</span>
              <span className="font-mono text-gray-600">mechanic / mech123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

