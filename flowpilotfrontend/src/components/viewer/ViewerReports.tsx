import React, { useState } from 'react';
import {
  Eye,
  X,
  FileText,
  FolderKanban,
  ListChecks,
  TrendingUp,
  Bug,
  Users,
  Rocket,
  LockKeyhole,
} from 'lucide-react';

interface Report {
  icon: React.ElementType;
  title: string;
  description: string;
  details: string;
  points: string[];
}

export const ViewerReports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const reports: Report[] = [
    {
      icon: FolderKanban,
      title: 'Project Status Overview',
      description:
        'High-level view of all active projects and their health',
      details:
        'Overview of current project progress, health, and delivery status across all active projects.',
      points: [
        'Total projects being monitored: 24',
        'Active / In Progress projects: 16',
        'Teams involved: 6',
        'Overall project progress: 76%',
      ],
    },
    {
      icon: ListChecks,
      title: 'Sprint Progress Summary',
      description:
        'Task completion by sprint across all projects',
      details:
        'Summary of sprint activity showing completed, in-progress, and pending work across projects.',
      points: [
        'Sprint 12 – IPMT Platform v2',
        'Sprint 8 – E-Commerce Relaunch',
        'Sprint 2 – Mobile App Development',
        'Sprint 5 – API Gateway Migration',
      ],
    },
    {
      icon: TrendingUp,
      title: 'Team Productivity',
      description:
        'Story points completed and velocity trend',
      details:
        'A summary of team productivity and development velocity across active projects.',
      points: [
        'Tracks completed work',
        'Monitors team velocity',
        'Compares productivity trends',
        'Helps identify delivery patterns',
      ],
    },
    {
      icon: Bug,
      title: 'Bug Trend Report',
      description:
        'Open vs. resolved bugs over time',
      details:
        'Provides an overview of reported bugs and their resolution progress.',
      points: [
        'Open bugs',
        'Resolved bugs',
        'Bug resolution trend',
        'Project-wise bug monitoring',
      ],
    },
    {
      icon: Users,
      title: 'Resource Allocation',
      description:
        'Team workload distribution across projects',
      details:
        'Overview of how team members and resources are distributed across active projects.',
      points: [
        'Team allocation',
        'Project workload',
        'Resource distribution',
        'Current team involvement',
      ],
    },
    {
      icon: Rocket,
      title: 'Release Readiness',
      description:
        'Go-live checklist status for upcoming releases',
      details:
        'Summary of release preparation and readiness for upcoming project deliveries.',
      points: [
        'Release checklist',
        'Pending release activities',
        'Project readiness',
        'Go-live preparation status',
      ],
    },
  ];

  return (
    <>
      <div className="w-full min-w-0">

        {/* =====================================================
            READ-ONLY ACCESS
            ===================================================== */}
        <div className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-100/70 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex min-w-0 items-start gap-3 text-xs font-semibold leading-5 text-slate-600 sm:items-center">
              <Eye
                size={15}
                strokeWidth={2}
                className="mt-0.5 shrink-0 text-slate-500 sm:mt-0"
              />

              <span>
                You have read-only access. To request additional permissions,
                contact your Admin.
              </span>
            </div>

            <button
              type="button"
              className="
                w-full
                shrink-0
                rounded-lg
                border border-slate-200
                bg-slate-200/70
                px-4
                py-2
                text-xs
                font-bold
                text-slate-700
                transition-colors
                duration-200
                hover:bg-slate-300
                sm:w-auto
              "
            >
              Request Access
            </button>

          </div>
        </div>


        {/* =====================================================
            EXPORT INFORMATION
            ===================================================== */}
        <div className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-100/70 px-4 py-3 sm:px-5">

          <div className="flex items-start gap-3 text-xs font-medium leading-5 text-slate-500">

            <FileText
              size={16}
              strokeWidth={2}
              className="shrink-0 text-slate-500"
            />

            <span>
              As a Viewer, you can view but not download or export reports.
              Request Admin access to enable exports.
            </span>

          </div>

        </div>


        {/* =====================================================
            REPORT CARDS
            ===================================================== */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

          {reports.map((report) => (
            <div
              key={report.title}
              className="
                flex
                min-h-[180px]
                w-full
                min-w-0
                flex-col
                rounded-2xl
                border
                border-slate-200/80
                bg-white
                p-5
                shadow-sm
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:shadow-md
              "
            >

              {/* ICON */}
              <div className="mb-4 flex h-8 w-8 items-center justify-start">
               <report.icon
                  size={32}
                  strokeWidth={2}
                  className="text-slate-700"
                  aria-label={`${report.title} icon`}
                />
              </div>


              {/* TITLE */}
              <h2 className="text-[14px] font-extrabold leading-5 text-slate-900 sm:text-[15px]">
                {report.title}
              </h2>


              {/* DESCRIPTION */}
              <p className="mt-1.5 min-h-[38px] text-xs leading-5 text-slate-500">
                {report.description}
              </p>


              {/* BUTTONS */}
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">

                {/* VIEW BUTTON */}
                <button
                  type="button"
                  onClick={() => setSelectedReport(report)}
                  className="
                    rounded-lg
                    border border-slate-200
                    bg-slate-50
                    px-4
                    py-2
                    text-xs
                    font-bold
                    text-slate-600
                    transition-colors
                    duration-200
                    hover:bg-slate-100
                    hover:text-slate-900
                    active:scale-95
                  "
                >
                  View
                </button>


                {/* EXPORT BUTTON */}
                <button
                  type="button"
                  disabled
                  title="Export requires Admin permission"
                  className="
                    cursor-not-allowed
                    rounded-lg
                    border border-slate-200
                    bg-slate-50
                    px-4
                    py-2
                    text-xs
                    font-bold
                    text-slate-300
                  "
                >
                  <span className="flex items-center gap-1.5">
                    Export
                    <LockKeyhole size={13} strokeWidth={2} />
                  </span>
                </button>

              </div>

            </div>
          ))}

        </div>

      </div>


      {/* =====================================================
          REPORT DETAILS MODAL
          ===================================================== */}
      {selectedReport && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-slate-950/40
            p-4
            backdrop-blur-[2px]
          "
          onClick={() => setSelectedReport(null)}
        >

          <div
            className="
              relative
              max-h-[90vh]
              w-full
              max-w-xl
              overflow-y-auto
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-2xl
              sm:p-6
            "
            onClick={(event) => event.stopPropagation()}
          >

            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={() => setSelectedReport(null)}
              aria-label="Close report"
              className="
                absolute
                right-4
                top-4
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                text-slate-400
                transition-colors
                hover:bg-slate-100
                hover:text-slate-700
              "
            >
              <X size={18} />
            </button>


            {/* MODAL HEADER */}
            <div className="pr-10">

              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <selectedReport.icon
                  size={24}
                  strokeWidth={2}
                  className="text-emerald-600"
                />
              </div>

              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                VIEWER REPORT
              </div>

              <h2 className="mt-1 text-xl font-black text-slate-900">
                {selectedReport.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {selectedReport.details}
              </p>

            </div>


            {/* REPORT INFORMATION */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">

              <div className="mb-3 flex items-center gap-2">

                <FileText
                  size={16}
                  className="text-slate-500"
                />

                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Report Information
                </span>

              </div>


              <div className="space-y-3">

                {selectedReport.points.map((point, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3"
                  >

                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />

                    <span className="text-sm leading-5 text-slate-600">
                      {point}
                    </span>

                  </div>
                ))}

              </div>

            </div>


            {/* MODAL FOOTER */}
            <div className="mt-5 flex justify-end">

              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="
                  rounded-lg
                  border border-slate-200
                  bg-slate-900
                  px-5
                  py-2.5
                  text-xs
                  font-bold
                  text-white
                  transition-colors
                  hover:bg-slate-800
                "
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
};

export default ViewerReports;