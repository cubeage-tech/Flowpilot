import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, Bell, Search, LogOut, User, Settings, HelpCircle, Power, Menu, X } from 'lucide-react';

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

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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
                    {[
                      { icon: <User size={15} />, label: 'My Profile' },
                      { icon: <Settings size={15} />, label: 'Settings' },
                      { icon: <HelpCircle size={15} />, label: 'Help & Support' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-400">
                          {item.icon}
                        </span>

                        {item.label}
                      </button>
                    ))}
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
    </div>
  );
};

export default DashboardLayout;