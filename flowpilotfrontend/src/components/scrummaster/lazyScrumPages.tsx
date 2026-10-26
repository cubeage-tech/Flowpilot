import React, { lazy, Suspense } from 'react';

// ============================================
// LAZY-LOADED SCRUM MASTER PAGES
// Dedicated lazy loading registry for Scrum Master sub-pages
// ============================================
export const LazyScrumMasterDashboardView = lazy(() =>
  import('./ScrumMasterDashboardView').then(m => ({ default: m.ScrumMasterDashboardView }))
);

export const LazyScrumBoard = lazy(() =>
  import('./ScrumBoard').then(m => ({ default: m.ScrumBoard }))
);

export const LazyScrumBacklogs = lazy(() =>
  import('./ScrumBacklogs').then(m => ({ default: m.ScrumBacklogs }))
);

export const LazyScrumSprints = lazy(() =>
  import('./ScrumSprints').then(m => ({ default: m.ScrumSprints }))
);

export const LazyScrumBurndown = lazy(() =>
  import('./ScrumBurndown').then(m => ({ default: m.ScrumBurndown }))
);

export const LazyScrumStandups = lazy(() =>
  import('./ScrumStandups').then(m => ({ default: m.ScrumStandups }))
);

export const LazyScrumRetrospective = lazy(() =>
  import('./ScrumRetrospective').then(m => ({ default: m.ScrumRetrospective }))
);

// ============================================
// SLEEK GLASSMORPHIC LOADING FALLBACK
// ============================================
export const ScrumLoadingSkeleton: React.FC<{ message?: string }> = ({
  message = 'Loading view...'
}) => (
  <div className="min-h-[480px] w-full flex flex-col items-center justify-center p-8 space-y-6">
    <div className="relative">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center backdrop-blur-md shadow-lg shadow-emerald-500/5">
        <div className="w-7 h-7 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur -z-10 animate-pulse" />
    </div>

    <div className="flex flex-col items-center space-y-2">
      <p className="text-sm font-medium text-emerald-400/90 tracking-wide flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        {message}
      </p>
      <p className="text-xs text-slate-400">Fetching latest sprint telemetry</p>
    </div>

    {/* Subtle placeholder grid skeleton */}
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 opacity-40">
      <div className="h-24 rounded-xl bg-slate-800/40 border border-slate-700/40 animate-pulse" />
      <div className="h-24 rounded-xl bg-slate-800/40 border border-slate-700/40 animate-pulse delay-75" />
      <div className="h-24 rounded-xl bg-slate-800/40 border border-slate-700/40 animate-pulse delay-150" />
    </div>
  </div>
);

// ============================================
// SUSPENSE WRAPPER HELPER
// ============================================
export const SuspendedScrumPage: React.FC<{
  children: React.ReactNode;
  fallbackMessage?: string;
}> = ({ children, fallbackMessage }) => (
  <Suspense fallback={<ScrumLoadingSkeleton message={fallbackMessage} />}>
    {children}
  </Suspense>
);
