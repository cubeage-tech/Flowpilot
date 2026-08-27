import React, { useState } from 'react';

import {
  Settings,
  ShieldCheck,
  LockKeyhole,
  UserCog,
  Save,
  Check,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [saved, setSaved] = useState(false);

  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'IPMT Platform',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    language: 'English',
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    passwordExpiry: true,
    sessionTimeout: true,
  });

  const [userSettings, setUserSettings] = useState({
    allowRegistration: false,
    requireApproval: true,
    allowProfileChanges: true,
  });

  const handleSave = () => {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  return (
    <div className="w-full space-y-6 font-sans">

      {/* ==================== SETTINGS CONTENT ==================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[230px_minmax(0,1fr)]">

        {/* ==================== SETTINGS NAVIGATION ==================== */}

        <div
          className="
            h-fit
            w-full
            rounded-2xl
            border
            border-slate-200/80
            bg-white
            p-4
            shadow-[0_3px_12px_rgba(15,23,42,0.035)]
          "
        >

          <div className="space-y-1.5">

            {/* GENERAL */}

            <button
              type="button"
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                bg-slate-100
                px-4
                py-3.5
                text-left
              "
            >
              <Settings
                size={18}
                className="shrink-0 text-slate-700"
              />

              <span className="text-sm font-extrabold text-slate-800">
                General
              </span>
            </button>

            {/* SECURITY */}

            <button
              type="button"
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                px-4
                py-3.5
                text-left
                transition
                hover:bg-slate-50
              "
            >
              <ShieldCheck
                size={18}
                className="shrink-0 text-slate-400"
              />

              <span className="text-sm font-bold text-slate-500">
                Security
              </span>
            </button>

            {/* USER MANAGEMENT */}

            <button
              type="button"
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                px-4
                py-3.5
                text-left
                transition
                hover:bg-slate-50
              "
            >
              <UserCog
                size={18}
                className="shrink-0 text-slate-400"
              />

              <span className="text-sm font-bold text-slate-500">
                User Management
              </span>
            </button>

          </div>

        </div>


        {/* ==================== SETTINGS PANELS ==================== */}

        <div className="min-w-0 space-y-6">


          {/* ==================== GENERAL SETTINGS ==================== */}

          <div
            className="
              w-full
              rounded-2xl
              border
              border-slate-200/80
              bg-white
              p-7
              shadow-[0_3px_12px_rgba(15,23,42,0.035)]
              sm:p-8
            "
          >

            {/* CARD HEADER */}

            <div className="mb-7 flex items-center gap-4">

              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-100
                "
              >
                <Settings
                  size={20}
                  className="text-slate-600"
                />
              </div>

              <div>

                <h3 className="text-base font-extrabold text-slate-900">
                  General Settings
                </h3>

                <p className="mt-1 text-xs font-medium text-slate-400">
                  Configure basic platform preferences
                </p>

              </div>

            </div>


            {/* GENERAL FORM */}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              {/* PLATFORM NAME */}

              <div>

                <label
                  className="
                    mb-2.5
                    block
                    text-[11px]
                    font-extrabold
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  Platform Name
                </label>

                <input
                  type="text"
                  value={generalSettings.platformName}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      platformName: e.target.value,
                    })
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    py-3
                    text-sm
                    font-bold
                    text-slate-700
                    outline-none
                    transition
                    focus:border-slate-400
                  "
                />

              </div>


              {/* TIMEZONE */}

              <div>

                <label
                  className="
                    mb-2.5
                    block
                    text-[11px]
                    font-extrabold
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  Timezone
                </label>

                <select
                  value={generalSettings.timezone}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      timezone: e.target.value,
                    })
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    py-3
                    text-sm
                    font-bold
                    text-slate-700
                    outline-none
                    transition
                    focus:border-slate-400
                  "
                >
                  <option value="Asia/Kolkata">
                    Asia/Kolkata (IST)
                  </option>

                  <option value="UTC">
                    UTC
                  </option>

                  <option value="America/New_York">
                    America/New_York
                  </option>

                  <option value="Europe/London">
                    Europe/London
                  </option>
                </select>

              </div>


              {/* DATE FORMAT */}

              <div>

                <label
                  className="
                    mb-2.5
                    block
                    text-[11px]
                    font-extrabold
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  Date Format
                </label>

                <select
                  value={generalSettings.dateFormat}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      dateFormat: e.target.value,
                    })
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    py-3
                    text-sm
                    font-bold
                    text-slate-700
                    outline-none
                    transition
                    focus:border-slate-400
                  "
                >
                  <option value="DD/MM/YYYY">
                    DD/MM/YYYY
                  </option>

                  <option value="MM/DD/YYYY">
                    MM/DD/YYYY
                  </option>

                  <option value="YYYY-MM-DD">
                    YYYY-MM-DD
                  </option>
                </select>

              </div>


              {/* LANGUAGE */}

              <div>

                <label
                  className="
                    mb-2.5
                    block
                    text-[11px]
                    font-extrabold
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  Language
                </label>

                <select
                  value={generalSettings.language}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      language: e.target.value,
                    })
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    py-3
                    text-sm
                    font-bold
                    text-slate-700
                    outline-none
                    transition
                    focus:border-slate-400
                  "
                >
                  <option value="English">
                    English
                  </option>

                  <option value="Hindi">
                    Hindi
                  </option>

                  <option value="Marathi">
                    Marathi
                  </option>
                </select>

              </div>

            </div>

          </div>


          {/* ==================== SECURITY SETTINGS ==================== */}

          <div
            className="
              w-full
              rounded-2xl
              border
              border-slate-200/80
              bg-white
              p-7
              shadow-[0_3px_12px_rgba(15,23,42,0.035)]
              sm:p-8
            "
          >

            {/* CARD HEADER */}

            <div className="mb-5 flex items-center gap-4">

              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-100
                "
              >
                <LockKeyhole
                  size={20}
                  className="text-slate-600"
                />
              </div>

              <div>

                <h3 className="text-base font-extrabold text-slate-900">
                  Security
                </h3>

                <p className="mt-1 text-xs font-medium text-slate-400">
                  Configure account and authentication security
                </p>

              </div>

            </div>


            {/* SECURITY OPTIONS */}

            <div className="divide-y divide-slate-100">

              {/* TWO FACTOR */}

              <div className="flex min-h-[76px] items-center justify-between gap-6 py-4">

                <div className="min-w-0">

                  <div className="text-sm font-extrabold text-slate-700">
                    Two-Factor Authentication
                  </div>

                  <div className="mt-1.5 text-xs font-medium leading-5 text-slate-400">
                    Require additional verification for administrator accounts
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSecuritySettings({
                      ...securitySettings,
                      twoFactorAuth:
                        !securitySettings.twoFactorAuth,
                    })
                  }
                  aria-label="Toggle two-factor authentication"
                  className={`
                    relative
                    h-6
                    w-11
                    shrink-0
                    rounded-full
                    transition
                    ${
                      securitySettings.twoFactorAuth
                        ? 'bg-slate-900'
                        : 'bg-slate-200'
                    }
                  `}
                >
                  <span
                    className={`
                      absolute
                      top-1
                      h-4
                      w-4
                      rounded-full
                      bg-white
                      transition
                      ${
                        securitySettings.twoFactorAuth
                          ? 'left-6'
                          : 'left-1'
                      }
                    `}
                  />
                </button>

              </div>


              {/* PASSWORD */}

              <div className="flex min-h-[76px] items-center justify-between gap-6 py-4">

                <div className="min-w-0">

                  <div className="text-sm font-extrabold text-slate-700">
                    Password Expiry
                  </div>

                  <div className="mt-1.5 text-xs font-medium leading-5 text-slate-400">
                    Require users to periodically update their passwords
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordExpiry:
                        !securitySettings.passwordExpiry,
                    })
                  }
                  aria-label="Toggle password expiry"
                  className={`
                    relative
                    h-6
                    w-11
                    shrink-0
                    rounded-full
                    transition
                    ${
                      securitySettings.passwordExpiry
                        ? 'bg-slate-900'
                        : 'bg-slate-200'
                    }
                  `}
                >
                  <span
                    className={`
                      absolute
                      top-1
                      h-4
                      w-4
                      rounded-full
                      bg-white
                      transition
                      ${
                        securitySettings.passwordExpiry
                          ? 'left-6'
                          : 'left-1'
                      }
                    `}
                  />
                </button>

              </div>


              {/* SESSION */}

              <div className="flex min-h-[76px] items-center justify-between gap-6 py-4">

                <div className="min-w-0">

                  <div className="text-sm font-extrabold text-slate-700">
                    Session Timeout
                  </div>

                  <div className="mt-1.5 text-xs font-medium leading-5 text-slate-400">
                    Automatically sign out inactive users
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSecuritySettings({
                      ...securitySettings,
                      sessionTimeout:
                        !securitySettings.sessionTimeout,
                    })
                  }
                  aria-label="Toggle session timeout"
                  className={`
                    relative
                    h-6
                    w-11
                    shrink-0
                    rounded-full
                    transition
                    ${
                      securitySettings.sessionTimeout
                        ? 'bg-slate-900'
                        : 'bg-slate-200'
                    }
                  `}
                >
                  <span
                    className={`
                      absolute
                      top-1
                      h-4
                      w-4
                      rounded-full
                      bg-white
                      transition
                      ${
                        securitySettings.sessionTimeout
                          ? 'left-6'
                          : 'left-1'
                      }
                    `}
                  />
                </button>

              </div>

            </div>

          </div>


          {/* ==================== USER MANAGEMENT ==================== */}

          <div
            className="
              w-full
              rounded-2xl
              border
              border-slate-200/80
              bg-white
              p-7
              shadow-[0_3px_12px_rgba(15,23,42,0.035)]
              sm:p-8
            "
          >

            {/* CARD HEADER */}

            <div className="mb-5 flex items-center gap-4">

              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-100
                "
              >
                <UserCog
                  size={20}
                  className="text-slate-600"
                />
              </div>

              <div>

                <h3 className="text-base font-extrabold text-slate-900">
                  User Management
                </h3>

                <p className="mt-1 text-xs font-medium text-slate-400">
                  Configure how users are managed on the platform
                </p>

              </div>

            </div>


            {/* USER OPTIONS */}

            <div className="divide-y divide-slate-100">

              {/* REGISTRATION */}

              <div className="flex min-h-[76px] items-center justify-between gap-6 py-4">

                <div className="min-w-0">

                  <div className="text-sm font-extrabold text-slate-700">
                    Allow User Registration
                  </div>

                  <div className="mt-1.5 text-xs font-medium leading-5 text-slate-400">
                    Allow new users to create their own accounts
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setUserSettings({
                      ...userSettings,
                      allowRegistration:
                        !userSettings.allowRegistration,
                    })
                  }
                  aria-label="Toggle user registration"
                  className={`
                    relative
                    h-6
                    w-11
                    shrink-0
                    rounded-full
                    transition
                    ${
                      userSettings.allowRegistration
                        ? 'bg-slate-900'
                        : 'bg-slate-200'
                    }
                  `}
                >
                  <span
                    className={`
                      absolute
                      top-1
                      h-4
                      w-4
                      rounded-full
                      bg-white
                      transition
                      ${
                        userSettings.allowRegistration
                          ? 'left-6'
                          : 'left-1'
                      }
                    `}
                  />
                </button>

              </div>


              {/* APPROVAL */}

              <div className="flex min-h-[76px] items-center justify-between gap-6 py-4">

                <div className="min-w-0">

                  <div className="text-sm font-extrabold text-slate-700">
                    Require Admin Approval
                  </div>

                  <div className="mt-1.5 text-xs font-medium leading-5 text-slate-400">
                    New accounts must be approved by an administrator
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setUserSettings({
                      ...userSettings,
                      requireApproval:
                        !userSettings.requireApproval,
                    })
                  }
                  aria-label="Toggle admin approval"
                  className={`
                    relative
                    h-6
                    w-11
                    shrink-0
                    rounded-full
                    transition
                    ${
                      userSettings.requireApproval
                        ? 'bg-slate-900'
                        : 'bg-slate-200'
                    }
                  `}
                >
                  <span
                    className={`
                      absolute
                      top-1
                      h-4
                      w-4
                      rounded-full
                      bg-white
                      transition
                      ${
                        userSettings.requireApproval
                          ? 'left-6'
                          : 'left-1'
                      }
                    `}
                  />
                </button>

              </div>


              {/* PROFILE */}

              <div className="flex min-h-[76px] items-center justify-between gap-6 py-4">

                <div className="min-w-0">

                  <div className="text-sm font-extrabold text-slate-700">
                    Allow Profile Changes
                  </div>

                  <div className="mt-1.5 text-xs font-medium leading-5 text-slate-400">
                    Allow users to update their profile information
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setUserSettings({
                      ...userSettings,
                      allowProfileChanges:
                        !userSettings.allowProfileChanges,
                    })
                  }
                  aria-label="Toggle profile changes"
                  className={`
                    relative
                    h-6
                    w-11
                    shrink-0
                    rounded-full
                    transition
                    ${
                      userSettings.allowProfileChanges
                        ? 'bg-slate-900'
                        : 'bg-slate-200'
                    }
                  `}
                >
                  <span
                    className={`
                      absolute
                      top-1
                      h-4
                      w-4
                      rounded-full
                      bg-white
                      transition
                      ${
                        userSettings.allowProfileChanges
                          ? 'left-6'
                          : 'left-1'
                      }
                    `}
                  />
                </button>

              </div>

            </div>

          </div>


          {/* ==================== SECURITY NOTICE ==================== */}

          <div
            className="
              flex
              items-start
              gap-4
              rounded-2xl
              border
              border-slate-200/80
              bg-slate-50
              p-6
            "
          >

            <ShieldCheck
              size={20}
              className="mt-0.5 shrink-0 text-emerald-500"
            />

            <div>

              <div className="text-sm font-extrabold text-slate-800">
                Administrator Security
              </div>

              <p
                className="
                  mt-1.5
                  text-xs
                  font-medium
                  leading-5
                  text-slate-500
                "
              >
                Security settings help protect administrator
                accounts and sensitive platform information.
                Keep two-factor authentication enabled whenever possible.
              </p>

            </div>

          </div>


          {/* ==================== SAVE BUTTON ==================== */}

          <div className="flex justify-end">

            <button
              type="button"
              onClick={handleSave}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-slate-900
                px-5
                py-3
                text-sm
                font-extrabold
                text-white
                transition
                hover:bg-slate-800
              "
            >
              {saved ? (
                <>
                  <Check size={17} />
                  Saved
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save Changes
                </>
              )}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminSettings;

