import React, { useState } from 'react';
import {
  ShieldCheck,
  Settings,
  FolderKanban,
  RefreshCw,
  Code2,
  TestTube2,
  Eye,
  Lock,
  BarChart3,
  Users,
  Bell,
  LayoutGrid,
  ArrowLeft,
} from 'lucide-react';

interface LoginPageProps {
  onBackToHome?: () => void;
  onLoginSuccess?: (role: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onBackToHome,
  onLoginSuccess,
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const roles = [
    {
      id: 'super-admin',
      name: 'Super Admin',
      subtitle: 'Full system control — all modules',
      icon: <ShieldCheck size={18} className="text-rose-400" />,
    },
    {
      id: 'admin',
      name: 'Admin',
      subtitle: 'User & department management',
      icon: <Settings size={18} className="text-purple-400" />,
    },
    {
      id: 'project-manager',
      name: 'Project Manager',
      subtitle: 'Projects, sprints & team oversight',
      icon: <FolderKanban size={18} className="text-amber-400" />,
    },
    {
      id: 'scrum-master',
      name: 'Scrum Master',
      subtitle: 'Sprint board, ceremonies & velocity',
      icon: <RefreshCw size={18} className="text-cyan-400" />,
    },
    {
      id: 'developer',
      name: 'Developer',
      subtitle: 'My tasks, sprint board & time log',
      icon: <Code2 size={18} className="text-emerald-400" />,
    },
    {
      id: 'qa-engineer',
      name: 'QA Engineer',
      subtitle: 'Test cases, bug reports & coverage',
      icon: <TestTube2 size={18} className="text-teal-400" />,
    },
    {
      id: 'viewer',
      name: 'Viewer',
      subtitle: 'Read-only: projects & reports',
      icon: <Eye size={18} className="text-slate-400" />,
    },
  ];

  const handleRoleSelect = (role: typeof roles[0]) => {
    setSelectedRole(role.name);
    setError('');
  };

  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');

    if (!selectedRole) {
      setError('Please select your role before signing in');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role: selectedRole,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(
          data.message || 'Invalid credentials or selected role'
        );
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.data.token);
      localStorage.setItem('role', data.data.role);
      localStorage.setItem('name', data.data.name);
      localStorage.setItem(
        'email',
        data.data.email || email
      );

      /*
       * Use the role returned by the backend.
       * The backend is the source of truth.
       */
      if (onLoginSuccess) {
        onLoginSuccess(data.data.role);
      }
    } catch {
      // backend unreachable — demo mode
      setError('Unable to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-white flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Subtle Ambient Background Gradients */}
      <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] bg-emerald-500/10 blur-[130px] pointer-events-none"></div>

      <div className="absolute top-[30%] -right-[10%] w-[45vw] h-[45vw] bg-purple-500/10 blur-[140px] pointer-events-none"></div>

      {/* Top Header */}
      <div className="px-4 pt-4 pb-1 md:px-12 flex items-center justify-between relative z-10">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={onBackToHome}
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25">
            <LayoutGrid size={24} />
          </div>

          <span className="font-extrabold text-2xl tracking-tight text-white">
            Flowpilot
          </span>

          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
            V2.0
          </span>
        </div>

      </div>

      {/* Main Grid Section */}
      <div className="max-w-[1240px] w-full mx-auto px-6 py-2 lg:py-2 grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-12 lg:gap-8 items-start relative z-10 flex-1">
        {/* Left Column: Brand Showcase */}
        <div className="flex flex-col justify-between h-full pt-0">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white mb-1">
              Enterprise Project <br />

              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-purple-400 bg-clip-text text-transparent">
                Management
              </span>
            </h1>

            <p className="text-slate-400 text-sm leading-relaxed mb-3 max-w-[420px]">
              Secure role-based access for every member of your team. Select your role and sign in to your personalized workspace.
            </p>

            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  <Lock size={16} className="text-emerald-400" />
                </div>

                <span className="text-sm font-semibold text-slate-200">
                  Role-based access control
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  <BarChart3 size={16} className="text-teal-400" />
                </div>

                <span className="text-sm font-semibold text-slate-200">
                  Real-time sprint analytics
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  <Users size={16} className="text-purple-400" />
                </div>

                <span className="text-sm font-semibold text-slate-200">
                  Cross-team collaboration
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  <Bell size={16} className="text-amber-400" />
                </div>

                <span className="text-sm font-semibold text-slate-200">
                  Smart notifications
                </span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-6 pt-2 border-t border-slate-800/80">
            <div>
              <div className="text-2xl font-black text-white">
                48+
              </div>

              <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                Team Members
              </div>
            </div>

            <div>
              <div className="text-2xl font-black text-white">
                24
              </div>

              <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                Active Projects
              </div>
            </div>

            <div>
              <div className="text-2xl font-black text-white">
                99.9%
              </div>

              <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                Uptime
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sign In Form & Role Quick Select */}
        <div className="bg-[#0b101b]/90 border border-slate-800/80 rounded-3xl p-6 pb-2 sm:p-7 lg:h-full lg:px-2 lg:py-3 lg:flex lg:flex-col lg:justify-between shadow-2xl backdrop-blur-xl relative">

          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="absolute top-4 right-4 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer bg-slate-900/60 px-4 py-2 rounded-full border border-slate-800"
            >
              <ArrowLeft size={14} />
              Back to Landing Page
            </button>
          )}

          <div className="mb-4 lg:mb-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight mb-1">
              Sign in to your workspace
            </h2>

            <p className="text-xs text-slate-400">
              Select your role and enter the credentials sent to you
            </p>
          </div>

          {/* Role Quick-Select Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-1 lg:mb-2 mb-6">
            {roles.map((role) => {
              const isSelected = selectedRole === role.name;

              return (
                <div
                  key={role.id}
                  onClick={() => handleRoleSelect(role)}
                  className={`p-2 lg:p-1.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-3 ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500/80 shadow-md shadow-emerald-500/10'
                      : 'bg-[#111726]/60 border-slate-800/80 hover:border-slate-700 hover:bg-[#131b2e]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 lg:w-7 lg:h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-emerald-500/15' : 'bg-slate-900'
                    }`}
                  >
                    {role.icon}
                  </div>

                  <div className="min-w-0">
                    <div
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {role.name}
                    </div>

                    <div className="text-[10px] text-slate-400 truncate">
                      {role.subtitle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Login Inputs Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 lg:gap-1.5"
          >
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                EMAIL ADDRESS
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@company.com"
                className="w-full bg-[#121929] border border-slate-800 rounded-xl px-4 py-2.5 lg:py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                PASSWORD
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#121929] border border-slate-800 rounded-xl px-4 py-2.5 lg:py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-extrabold text-sm py-3 lg:py-2.5 rounded-2xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer hover:-translate-y-0.5"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {error && (
              <p className="text-red-400 text-xs text-center mt-1">
                {error}
              </p>
            )}
          </form>

          {/* Credential Notice */}
          <div className="mt-3 lg:mt-2 bg-[#0f1725]/80 border border-slate-800/80 rounded-2xl p-2.5 lg:p-2 flex items-start gap-3">
            <Lock
              size={18}
              className="text-emerald-400 shrink-0 mt-0.5"
            />

            <div>
              <div className="text-xs font-bold text-emerald-400 mb-0.5">
                SECURE LOGIN
              </div>

              <div className="text-[11px] text-slate-400 leading-normal">
                Select your role and enter the email address and password sent to you.
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer copyright */}
      <div className="py-1.5 text-center text-xs text-slate-600 border-t border-slate-900">
        © 2026 Flowpilot Inc. All rights reserved.
      </div>
    </div>
  );
};

export default LoginPage;