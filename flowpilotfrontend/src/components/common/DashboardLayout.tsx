import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, Bell, Search, LogOut, User, Settings, HelpCircle, Power, Menu, X, Key, CheckCircle2, Lock, Mail, Phone, Moon, Sun, Monitor, Send, Check } from 'lucide-react';

export interface NavItem {
  name: string;
  icon: React.ReactNode;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  color?: string;
}

export interface ProfileConfig {
  name: string;
  email: string;
  roleLabel: string;
  roleBadgeColor: string;
}

interface RoleConfig {
  label: string;
  color: string;
  name: string;
  dept: string;
  avatar: string;
  avatarBg: string;
}

interface DashboardLayoutProps {
  navItems: NavItem[];
  roleConfig: RoleConfig;
  activeTab: string;
  onTabChange: (tab: string) => void;
  pageTitle: string;
  onLogout?: () => void;
  notifications: NotificationItem[];
  profileConfig: ProfileConfig;
  children: React.ReactNode;
}

const currentDate = 'Thursday, 13 August 2026';

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  navItems,
  roleConfig,
  activeTab,
  onTabChange,
  pageTitle,
  onLogout,
  notifications: initialNotifications,
  profileConfig,
  children,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Change Password State
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [changePassError, setChangePassError] = useState('');
  const [changePassSuccess, setChangePassSuccess] = useState('');

  // My Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState(() => localStorage.getItem('name') || roleConfig.name);
  const [profilePhone, setProfilePhone] = useState(() => localStorage.getItem('phone') || '+1 (555) 019-2834');
  const [profileBio, setProfileBio] = useState(() => localStorage.getItem('bio') || 'Productive team contributor focused on high quality agile deliverables.');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(() => localStorage.getItem('pref_email_alerts') !== 'false');
  const [soundEffects, setSoundEffects] = useState(() => localStorage.getItem('pref_sound') === 'true');
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('pref_compact') === 'true');
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('pref_theme') || 'system');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Help & Support Modal State
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSending, setSupportSending] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassError('');
    setChangePassSuccess('');

    if (!currentPassword) {
      setChangePassError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setChangePassError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePassError('New password and confirm password do not match.');
      return;
    }

    setChangePassLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('jwt') || localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8080/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const responseText = await response.text();
      let data: any = null;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || responseText || 'Failed to change password.');
      }

      setChangePassSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowChangePassModal(false);
        setChangePassSuccess('');
      }, 2000);
    } catch (err: any) {
      setChangePassError(err.message || 'Failed to change password.');
    } finally {
      setChangePassLoading(false);
    }
  };

  // Get the currently logged-in user's name and email
  const loggedInName = localStorage.getItem('name') || roleConfig.name;
  const loggedInEmail = localStorage.getItem('email') || profileConfig.email;

  // Generate initials from the logged-in user's name
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const loggedInAvatar = getInitials(loggedInName);

  // Use logged-in user's name and initials everywhere,
  // while keeping the role and department from the existing roleConfig.
  const dynamicRoleConfig = {
    ...roleConfig,
    name: loggedInName,
    avatar: loggedInAvatar,
  };

  // Use logged-in user's name and email in the profile popup.
  const dynamicProfileConfig = {
    ...profileConfig,
    name: loggedInName,
    email: loggedInEmail,
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };

    document.addEventListener('mousedown', handler);

    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Body scroll lock when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // Close sidebar on Escape
  useEffect(() => {
    if (!sidebarOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };

    document.addEventListener('keydown', onKey);

    return () => document.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setSidebarOpen(false);
  };

  const SidebarContent = (
    <aside className="h-full w-64 bg-[#090d16] text-white flex flex-col justify-between p-5 border-r border-slate-800/60">
      <div className="min-h-0 flex flex-col">

        {/* LOGO */}
        <div className="flex items-center justify-between mb-6 px-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
              <LayoutGrid size={18} />
            </div>

            <div>
              <div className="font-extrabold text-base tracking-tight leading-none text-white">
                Flowpilot
              </div>

              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                PLATFORM V2.0
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white transition-colors p-1"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* ROLE BADGE */}
        <div className="mb-6 px-2 shrink-0">
          <span
            className={`inline-block w-full text-center text-[10px] font-black tracking-wider px-3 py-1.5 rounded-lg border ${dynamicRoleConfig.color}`}
          >
            ● {dynamicRoleConfig.label}
          </span>
        </div>

        {/* NAVIGATION */}
        <nav className="flex flex-col gap-1 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.name;

            return (
              <button
                key={item.name}
                type="button"
                onClick={() => handleTabChange(item.name)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left shrink-0 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-xs border border-white/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>
                  {item.icon}
                </span>

                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* USER AREA */}
      <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">

          <div
            className={`w-8 h-8 rounded-full ${dynamicRoleConfig.avatarBg} text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm`}
          >
            {dynamicRoleConfig.avatar}
          </div>

          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">
              {dynamicRoleConfig.name}
            </div>

            <div className="text-[10px] text-slate-400 truncate">
              {dynamicRoleConfig.dept}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          title="Log out"
          className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );

  return (
    <div className="h-screen w-full overflow-hidden bg-[#f8fafc] text-slate-800 font-sans flex">

      {/* ── DESKTOP SIDEBAR ── */}
      <div className="hidden lg:flex h-screen w-64 shrink-0 flex-col">
        {SidebarContent}
      </div>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer */}
          <div className="relative z-10 h-full w-[280px] max-w-[85vw] flex flex-col">
            {SidebarContent}
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 min-h-0 h-screen overflow-y-auto overflow-x-hidden bg-[#f8fafc]">

        {/* HEADER */}
        <header className="h-[60px] md:h-[72px] bg-white border-b border-slate-200/80 px-3 sm:px-5 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">

          <div className="flex items-center gap-2.5 min-w-0 flex-1">

            {/* Hamburger — mobile/tablet only */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base md:text-xl font-extrabold text-slate-900 tracking-tight truncate">
                {pageTitle}
              </h1>

              <div className="text-[10px] md:text-xs text-slate-400 font-medium hidden sm:block">
                {currentDate}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">

            {/* SEARCH — hidden on mobile */}
            <div className="relative w-40 md:w-56 hidden sm:block">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-slate-50 border border-slate-200/80 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* NOTIFICATIONS */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setShowNotifications((p) => !p);
                  setShowProfile(false);
                }}
                aria-label="Notifications"
                className="relative w-9 h-9 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Bell size={16} />

                {notifications.some((n) => n.unread) && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-11 w-[calc(100vw-24px)] max-w-[320px] sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">

                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Notifications
                      </h3>

                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {notifications.filter(n => n.unread).length} unread
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, unread: false }))
                        )
                      }
                      className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() =>
                          setNotifications((prev) =>
                            prev.map((item) =>
                              item.id === n.id
                                ? { ...item, unread: false }
                                : item
                            )
                          )
                        }
                        className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                          n.unread ? 'bg-emerald-50/40' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">

                          <div
                            className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                              n.color ??
                              (n.unread
                                ? 'bg-emerald-500'
                                : 'bg-slate-300')
                            }`}
                          />

                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900">
                              {n.title}
                            </div>

                            <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                              {n.message}
                            </div>

                            <div className="text-[10px] text-slate-400 mt-1">
                              {n.time}
                            </div>
                          </div>

                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* PROFILE AVATAR */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setShowProfile((p) => !p);
                  setShowNotifications(false);
                }}
                className={`w-9 h-9 rounded-full ${dynamicRoleConfig.avatarBg} text-white flex items-center justify-center font-extrabold text-xs cursor-pointer hover:opacity-90 transition-opacity`}
              >
                {dynamicRoleConfig.avatar}
              </button>

              {showProfile && (
                <div className="absolute right-0 top-11 w-[calc(100vw-24px)] max-w-[260px] sm:w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">

                  <div className="px-5 py-4 border-b border-slate-100">
                    <div className="font-bold text-slate-900 text-sm">
                      {dynamicProfileConfig.name}
                    </div>

                    <div className="text-xs text-slate-400 mt-0.5 truncate">
                      {dynamicProfileConfig.email}
                    </div>

                    <span
                      className={`inline-block mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full ${dynamicProfileConfig.roleBadgeColor}`}
                    >
                      {dynamicProfileConfig.roleLabel}
                    </span>
                  </div>

                  <div className="py-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfile(false);
                        setShowChangePassModal(true);
                        setChangePassError('');
                        setChangePassSuccess('');
                      }}
                      className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span className="text-slate-400">
                        <Key size={15} />
                      </span>
                      Change Password
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfile(false);
                        setShowProfileModal(true);
                        setProfileSuccess('');
                      }}
                      className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span className="text-slate-400">
                        <User size={15} />
                      </span>
                      My Profile
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfile(false);
                        setShowSettingsModal(true);
                        setSettingsSuccess('');
                      }}
                      className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span className="text-slate-400">
                        <Settings size={15} />
                      </span>
                      Settings
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfile(false);
                        setShowHelpModal(true);
                        setSupportSuccess('');
                      }}
                      className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span className="text-slate-400">
                        <HelpCircle size={15} />
                      </span>
                      Help & Support
                    </button>
                  </div>

                  <div className="border-t border-slate-100 py-2">
                    <button
                      type="button"
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Power size={15} />
                      Sign Out
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="p-3 sm:p-5 md:p-8 max-w-[1400px] w-full mx-auto space-y-4 md:space-y-6">
          {children}
        </div>

      </main>

      {/* CHANGE PASSWORD MODAL */}
      {showChangePassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Change Password
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Update your account login password
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePassModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="mt-4 space-y-3.5">
              {changePassSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{changePassSuccess}</span>
                </div>
              )}

              {changePassError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                  {changePassError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowChangePassModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changePassLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  <Lock size={13} />
                  {changePassLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MY PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-xl ${dynamicRoleConfig.avatarBg} text-white flex items-center justify-center font-extrabold text-sm shadow-md`}>
                  {dynamicRoleConfig.avatar}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    My Profile
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    View and update your personal details
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setProfileSaving(true);
                localStorage.setItem('name', profileName);
                localStorage.setItem('phone', profilePhone);
                localStorage.setItem('bio', profileBio);
                setTimeout(() => {
                  setProfileSaving(false);
                  setProfileSuccess('Profile details saved successfully!');
                  setTimeout(() => setProfileSuccess(''), 3000);
                }, 400);
              }}
              className="mt-4 space-y-3.5"
            >
              {profileSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={dynamicProfileConfig.email}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Designation & Role
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${dynamicRoleConfig.label} (${dynamicProfileConfig.roleLabel})`}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    disabled
                    value={dynamicRoleConfig.dept || 'Engineering'}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Bio / About Me
                </label>
                <textarea
                  rows={2}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-y"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  <Check size={14} />
                  {profileSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Preferences & Settings
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure your workspace preferences and notifications
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {settingsSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{settingsSuccess}</span>
                </div>
              )}

              {/* Preferences toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                      <Mail size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Email Notifications</p>
                      <p className="text-[11px] text-slate-400">Receive alerts when assigned to new tasks or mentions</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => {
                      setEmailAlerts(e.target.checked);
                      localStorage.setItem('pref_email_alerts', String(e.target.checked));
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
                      <Bell size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Sound Effects</p>
                      <p className="text-[11px] text-slate-400">Play chime when sprint card moves or task completes</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEffects}
                    onChange={(e) => {
                      setSoundEffects(e.target.checked);
                      localStorage.setItem('pref_sound', String(e.target.checked));
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                      <Monitor size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Compact Table Mode</p>
                      <p className="text-[11px] text-slate-400">Reduce table row padding for denser data views</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={compactMode}
                    onChange={(e) => {
                      setCompactMode(e.target.checked);
                      localStorage.setItem('pref_compact', String(e.target.checked));
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Theme selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Theme Appearance
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'light', label: 'Light', icon: <Sun size={14} /> },
                    { id: 'dark', label: 'Dark', icon: <Moon size={14} /> },
                    { id: 'system', label: 'System', icon: <Monitor size={14} /> },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        setThemeMode(theme.id);
                        localStorage.setItem('pref_theme', theme.id);
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        themeMode === theme.id
                          ? 'border-emerald-500 bg-emerald-50/60 text-emerald-700 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {theme.icon}
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HELP & SUPPORT MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Help & Support
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Get assistance, report bugs, or contact our support team
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {supportSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{supportSuccess}</span>
                </div>
              )}

              {/* Support Quick Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-2.5">
                  <Mail size={16} className="text-blue-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Helpdesk</p>
                    <p className="text-xs font-semibold text-slate-700 truncate">support@flowpilot.io</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-2.5">
                  <Phone size={16} className="text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Emergency Support</p>
                    <p className="text-xs font-semibold text-slate-700 truncate">+1 (800) 234-FLOW</p>
                  </div>
                </div>
              </div>

              {/* Ticket form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!supportSubject.trim() || !supportMessage.trim()) return;
                  setSupportSending(true);
                  setTimeout(() => {
                    setSupportSending(false);
                    setSupportSuccess('Support ticket submitted! Our team will respond shortly.');
                    setSupportSubject('');
                    setSupportMessage('');
                    setTimeout(() => setSupportSuccess(''), 4000);
                  }, 600);
                }}
                className="space-y-3 pt-1 border-t border-slate-100"
              >
                <p className="text-xs font-bold text-slate-800">Submit Support Request</p>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    placeholder="e.g. Issue moving card on Scrum board"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Message / Description
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Describe what you are encountering..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-y"
                  />
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={supportSending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    <Send size={13} />
                    {supportSending ? 'Submitting...' : 'Send Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;