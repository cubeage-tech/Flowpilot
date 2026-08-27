import { useState } from "react";
import {
  LayoutGrid,
  CheckSquare,
  AlertTriangle,
  Activity,
  FileText,
  Bell,
  LogOut,
  Search,
} from "lucide-react";

import QADashboardView from "./QADashboardView";
import QATestCases from "./QATestCases";
import QABugReports from "./QABugReports";
import QATestCoverage from "./QATestCoverage";
import QAReports from "./QAReports";

interface QALayoutProps {
  onLogout?: () => void;
}

export interface QAUser {
  id?: string | number;
  name: string;
  username?: string;
  email?: string;
  department: string;
  role: string;
  avatar: string;
}

/*
 * ---------------------------------------------------------
 * GET LOGGED-IN USER
 * ---------------------------------------------------------
 *
 * We only read information already stored by the login.
 * Nothing outside QA needs to be changed.
 */

const getLoggedInUser = (): QAUser => {
  const possibleKeys = [
    "currentUser",
    "user",
    "auth",
    "userData",
    "loggedInUser",
  ];

  for (const key of possibleKeys) {
    const value = localStorage.getItem(key);

    if (!value) {
      continue;
    }

    try {
      const parsed = JSON.parse(value);

      /*
       * Some applications store:
       *
       * { user: {...} }
       *
       * while others store:
       *
       * {...}
       */

      const user = parsed?.user ?? parsed;

      if (
        user?.name ||
        user?.fullName ||
        user?.username ||
        user?.email
      ) {
        const name =
          user.name ||
          user.fullName ||
          user.username ||
          user.email ||
          "QA User";

        const avatar = name
          .split(" ")
          .filter(Boolean)
          .map((part: string) => part.charAt(0))
          .join("")
          .substring(0, 2)
          .toUpperCase();

        return {
          id: user.id ?? user.userId ?? user.employeeId,
          name,
          username: user.username,
          email: user.email,
          department:
            user.department ||
            user.designation ||
            "Quality",
          role:
            user.role ||
            user.jobTitle ||
            "QA ENGINEER",
          avatar: avatar || "QA",
        };
      }
    } catch {
      /*
       * Not JSON. Ignore and continue.
       */
    }
  }

  /*
   * If the application stores the user information
   * directly instead of JSON.
   */

  const name =
    localStorage.getItem("name") ||
    localStorage.getItem("username") ||
    localStorage.getItem("email");

  if (name) {
    const avatar = name
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();

    return {
      name,
      department: "Quality",
      role: "QA ENGINEER",
      avatar: avatar || "QA",
    };
  }

  /*
   * Fallback only if login storage cannot be found.
   *
   * This prevents the page from crashing.
   */

  return {
    name: "QA User",
    department: "Quality",
    role: "QA ENGINEER",
    avatar: "QA",
  };
};

const QALayout = ({ onLogout }: QALayoutProps) => {
  const [activeTab, setActiveTab] = useState("QA Dashboard");

  const [globalSearch, setGlobalSearch] = useState("");

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New bug reported",
      message: "A new bug has been added to QA bug reports.",
      time: "2 min ago",
      unread: true,
    },
    {
      id: 2,
      title: "Test task updated",
      message: "A test task has been updated.",
      time: "15 min ago",
      unread: true,
    },
    {
      id: 3,
      title: "Test coverage updated",
      message: "Test coverage information has been updated.",
      time: "1 hour ago",
      unread: false,
    },
  ]);

  /*
   * IMPORTANT:
   * Read this every time QALayout is created.
   */

  const qaUser = getLoggedInUser();

  const currentDate = new Date().toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  const navItems = [
    {
      name: "QA Dashboard",
      icon: <LayoutGrid size={18} />,
    },
    {
      name: "My Test Tasks",
      icon: <CheckSquare size={18} />,
    },
    {
      name: "Bug Reports",
      icon: <AlertTriangle size={18} />,
    },
    {
      name: "Test Coverage",
      icon: <Activity size={18} />,
    },
    {
      name: "Quality Reports",
      icon: <FileText size={18} />,
    },
  ];

  const getPageTitle = () => {
    switch (activeTab) {
      case "My Test Tasks":
        return "My Test Tasks";

      case "Bug Reports":
        return "Bug Reports";

      case "Test Coverage":
        return "Test Coverage";

      case "Quality Reports":
        return "Quality Reports";

      default:
        return "QA Dashboard";
    }
  };

  const handleNavigation = (tabName: string) => {
    setActiveTab(tabName);
    setGlobalSearch("");

    window.dispatchEvent(
      new CustomEvent("qa-global-search", {
        detail: "",
      })
    );
  };

  const renderQAContent = () => {
    switch (activeTab) {
      case "QA Dashboard":
        return <QADashboardView />;

      case "My Test Tasks":
        return <QATestCases />;

      case "Bug Reports":
        return <QABugReports />;

      case "Test Coverage":
        return <QATestCoverage />;

      case "Quality Reports":
        return <QAReports />;

      default:
        return <QADashboardView />;
    }
  };

  return (
    <div
      className="
        h-screen
        w-full
        overflow-hidden
        bg-[#f8fafc]
        text-slate-800
        font-sans
        flex
      "
    >
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className="
          h-screen
          w-64
          shrink-0
          bg-[#090d16]
          text-white
          flex
          flex-col
          justify-between
          p-5
          border-r
          border-slate-800/60
          overflow-hidden
        "
      >
        <div className="min-h-0 flex flex-col">

          {/* LOGO */}

          <div className="flex items-center gap-2.5 mb-6 px-2">
            <div
              className="
                w-8
                h-8
                rounded-xl
                bg-emerald-500
                flex
                items-center
                justify-center
                text-white
                font-bold
              "
            >
              <LayoutGrid size={18} />
            </div>

            <div>
              <div className="font-extrabold text-base leading-none">
                Flowpilot
              </div>

              <div
                className="
                  text-[10px]
                  font-bold
                  text-slate-500
                  uppercase
                  tracking-widest
                  mt-0.5
                "
              >
                PLATFORM V2.0
              </div>
            </div>
          </div>

          {/* ROLE */}

          <div className="mb-6 px-2">
            <span
              className="
                inline-block
                w-full
                text-center
                text-[10px]
                font-black
                tracking-wider
                px-3
                py-1.5
                rounded-lg
                border
                border-teal-500/30
                bg-teal-500/10
                text-teal-400
              "
            >
              ● QA ENGINEER
            </span>
          </div>

          {/* NAVIGATION */}

          <nav className="flex flex-col gap-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = activeTab === item.name;

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() =>
                    handleNavigation(item.name)
                  }
                  className={`
                    flex
                    items-center
                    gap-3
                    px-3.5
                    py-2.5
                    rounded-xl
                    text-xs
                    font-bold
                    text-left
                    transition-all

                    ${
                      isActive
                        ? "bg-white/10 text-white border border-white/10"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }
                  `}
                >
                  <span
                    className={
                      isActive
                        ? "text-emerald-400"
                        : "text-slate-400"
                    }
                  >
                    {item.icon}
                  </span>

                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* =====================================================
            LOGGED-IN QA USER
        ===================================================== */}

        <div
          className="
            pt-4
            mt-4
            border-t
            border-slate-800/80
            flex
            items-center
            justify-between
            px-2
          "
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="
                w-8
                h-8
                rounded-full
                bg-teal-500
                text-white
                flex
                items-center
                justify-center
                font-extrabold
                text-xs
                shrink-0
              "
            >
              {qaUser.avatar}
            </div>

            <div className="min-w-0">
              <div
                className="
                  text-xs
                  font-bold
                  text-white
                  truncate
                "
              >
                {qaUser.name}
              </div>

              <div
                className="
                  text-[10px]
                  text-slate-400
                  truncate
                "
              >
                {qaUser.department}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="Log out"
            className="
              w-8
              h-8
              rounded-xl
              bg-slate-900
              border
              border-slate-800
              text-slate-400
              hover:text-rose-400
              flex
              items-center
              justify-center
            "
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main
        className="
          flex-1
          min-w-0
          min-h-0
          h-screen
          overflow-y-auto
          overflow-x-hidden
          bg-[#f8fafc]
        "
      >
        {/* HEADER */}

        <header
          className="
            h-[76px]
            bg-white
            border-b
            border-slate-200/80
            px-8
            flex
            items-center
            justify-between
            sticky
            top-0
            z-30
          "
        >
          <div>
            <h1
              className="
                text-xl
                font-extrabold
                text-slate-900
                tracking-tight
              "
            >
              {getPageTitle()}
            </h1>

            <div
              className="
                text-xs
                text-slate-400
                font-medium
              "
            >
              {currentDate}
            </div>
          </div>

          <div className="flex items-center gap-4">

            {/* SEARCH */}

            <div className="relative w-64 hidden sm:block">
              <Search
                size={14}
                className="
                  absolute
                  left-3.5
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                type="text"
                placeholder="Search..."
                value={globalSearch}
                onChange={(e) => {
                  const value = e.target.value;

                  setGlobalSearch(value);

                  window.dispatchEvent(
                    new CustomEvent(
                      "qa-global-search",
                      {
                        detail: value,
                      }
                    )
                  );
                }}
                className="
                  w-full
                  bg-slate-50
                  border
                  border-slate-200/80
                  rounded-full
                  pl-9
                  pr-4
                  py-1.5
                  text-xs
                  text-slate-800
                  focus:outline-none
                  focus:border-emerald-500
                "
              />
            </div>

            {/* NOTIFICATIONS */}

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setShowNotifications(
                    (previous) => !previous
                  )
                }
                className="
                  relative
                  w-9
                  h-9
                  rounded-full
                  bg-slate-50
                  border
                  border-slate-200/80
                  flex
                  items-center
                  justify-center
                  text-slate-600
                "
              >
                <Bell size={16} />

                {notifications.some(
                  (notification) =>
                    notification.unread
                ) && (
                  <span
                    className="
                      absolute
                      top-0
                      right-0
                      w-2.5
                      h-2.5
                      bg-rose-500
                      rounded-full
                      border-2
                      border-white
                    "
                  />
                )}
              </button>

              {showNotifications && (
                <div
                  className="
                    absolute
                    right-0
                    top-12
                    w-80
                    bg-white
                    border
                    border-slate-200
                    rounded-2xl
                    shadow-xl
                    z-50
                    overflow-hidden
                  "
                >
                  <div
                    className="
                      px-4
                      py-3
                      border-b
                      border-slate-100
                      flex
                      items-center
                      justify-between
                    "
                  >
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Notifications
                      </h3>

                      <p className="text-[10px] text-slate-400">
                        Recent QA activity
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setNotifications(
                          (previous) =>
                            previous.map(
                              (notification) => ({
                                ...notification,
                                unread: false,
                              })
                            )
                        )
                      }
                      className="
                        text-[10px]
                        font-semibold
                        text-emerald-600
                      "
                    >
                      Mark all as read
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map(
                      (notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() =>
                            setNotifications(
                              (previous) =>
                                previous.map(
                                  (item) =>
                                    item.id ===
                                    notification.id
                                      ? {
                                          ...item,
                                          unread:
                                            false,
                                        }
                                      : item
                                )
                            )
                          }
                          className={`
                            w-full
                            text-left
                            px-4
                            py-3
                            border-b
                            border-slate-100

                            ${
                              notification.unread
                                ? "bg-emerald-50/40"
                                : "bg-white"
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`
                                mt-1
                                w-2
                                h-2
                                rounded-full
                                shrink-0
                                ${
                                  notification.unread
                                    ? "bg-emerald-500"
                                    : "bg-slate-300"
                                }
                              `}
                            />

                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                {notification.title}
                              </div>

                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {notification.message}
                              </div>

                              <div className="text-[10px] text-slate-400 mt-1">
                                {notification.time}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* USER AVATAR */}

            <div
              className="
                w-9
                h-9
                rounded-full
                bg-teal-500
                text-white
                flex
                items-center
                justify-center
                font-extrabold
                text-xs
              "
              title={qaUser.name}
            >
              {qaUser.avatar}
            </div>
          </div>
        </header>

        {/* CONTENT */}

        <div
          className="
            p-8
            max-w-[1400px]
            w-full
            mx-auto
          "
        >
          {renderQAContent()}
        </div>
      </main>
    </div>
  );
};

export { QALayout };
export default QALayout;