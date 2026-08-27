import React, { useState } from 'react';

interface NotificationSetting {
  id: number;
  label: string;
  enabled: boolean;
}

const initialSettings: NotificationSetting[] = [
  {
    id: 1,
    label: 'New user registration',
    enabled: true,
  },
  {
    id: 2,
    label: 'User role change',
    enabled: true,
  },
  {
    id: 3,
    label: 'User disabled / enabled',
    enabled: true,
  },
  {
    id: 4,
    label: 'New project created',
    enabled: false,
  },
  {
    id: 5,
    label: 'Sprint started / closed',
    enabled: false,
  },
  {
    id: 6,
    label: 'System error or downtime',
    enabled: true,
  },
];

export const AdminNotifications: React.FC = () => {
  const [settings, setSettings] =
    useState<NotificationSetting[]>(initialSettings);

  const toggleSetting = (id: number) => {
    setSettings((previous) =>
      previous.map((setting) =>
        setting.id === id
          ? {
              ...setting,
              enabled: !setting.enabled,
            }
          : setting
      )
    );
  };

  return (
    <div className="w-full">

      {/* ==================== NOTIFICATION SETTINGS CARD ==================== */}

      <div
        className="
          w-full
          max-w-[550px]
          rounded-xl
          border
          border-slate-200/80
          bg-white
          px-6
          py-7
          shadow-[0_3px_12px_rgba(15,23,42,0.035)]
        "
      >

        {/* CARD TITLE */}

        <h2
          className="
            text-[16px]
            font-bold
            leading-5
            text-slate-900
          "
        >
          Email Notification Triggers
        </h2>

        {/* SETTINGS */}

        <div className="mt-4">

          {settings.map((setting, index) => (

            <div
              key={setting.id}
              className={`
                flex
                min-h-[45px]
                items-center
                justify-between
                gap-4
                py-3
                ${
                  index !== settings.length - 1
                    ? 'border-b border-slate-100'
                    : ''
                }
              `}
            >

              {/* LABEL */}

              <span
                className="
                  text-[14px]
                  font-medium
                  leading-5
                  text-slate-700
                "
              >
                {setting.label}
              </span>

              {/* TOGGLE */}

              <button
  type="button"
  onClick={() => toggleSetting(setting.id)}
  aria-label={`Toggle ${setting.label}`}
  aria-pressed={setting.enabled}
  className={`
    relative
    h-[18px]
    w-[34px]
    shrink-0
    rounded-full
    transition-colors
    duration-200
    focus:outline-none
    ${
      setting.enabled
        ? 'bg-[#20C56A]'
        : 'bg-[#E5E7EB]'
    }
  `}
>
  {/* TOGGLE KNOB */}

  <span
    className={`
      absolute
      top-[3px]
      left-[3px]
      h-[12px]
      w-[12px]
      rounded-full
      bg-white
      shadow-[0_1px_2px_rgba(15,23,42,0.15)]
      transition-all
      duration-200
      ${
        setting.enabled
          ? 'left-[19px]'
          : 'left-[2px]'
      }
    `}
  />
</button>
            </div>

          ))}

        </div>

      </div>

    </div>
  );
};

export default AdminNotifications;