import { useState, lazy, Suspense } from 'react';
import { Header } from './components/common/Header';
import { HeroSection } from './components/HeroSection';
import { ProblemSection } from './components/ProblemSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { ModulesSection } from './components/ModulesSection';
import { PipelineSection } from './components/PipelineSection';
import { RolesSection } from './components/RolesSection';
import { ArchitectureSection } from './components/ArchitectureSection';
import { CollaborationSection } from './components/CollaborationSection';
import { AnalyticsSection } from './components/AnalyticsSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { RoadmapSection } from './components/RoadmapSection';
import { SecuritySection } from './components/SecuritySection';
import { PricingSection } from './components/PricingSection';
import { BottomCTASection } from './components/BottomCTASection';
import { Footer } from './components/common/Footer';
import { normalizeRole, APP_VIEWS, type AppView } from './routes/routes';

// ============================================
// LAZY-LOADED COMPONENTS & DASHBOARDS
// Code-split to drastically speed up initial page load
// ============================================
const DemoModal = lazy(() => import('./components/DemoModal').then(m => ({ default: m.DemoModal })));
const LoginPage = lazy(() => import('./components/common/LoginPage').then(m => ({ default: m.LoginPage })));
const SuperAdminLayout = lazy(() => import('./components/superadmin/SuperAdminLayout').then(m => ({ default: m.SuperAdminLayout })));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const PMLayout = lazy(() => import('./components/pm/PMLayout').then(m => ({ default: m.PMLayout })));
const ScrumMasterLayout = lazy(() => import('./components/scrummaster/ScrumMasterLayout').then(m => ({ default: m.ScrumMasterLayout })));
const DeveloperLayout = lazy(() => import('./components/developer/DeveloperLayout').then(m => ({ default: m.DeveloperLayout })));
const QALayout = lazy(() => import('./components/qa/QALayout').then(m => ({ default: m.QALayout })));
const ViewerLayout = lazy(() => import('./components/viewer/ViewerLayout').then(m => ({ default: m.ViewerLayout })));

// Sleek loading placeholder while dynamic chunks load
function PageLoadingFallback() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin" />
        <div className="absolute w-6 h-6 rounded-full bg-teal-500/20 animate-ping" />
      </div>
      <p className="mt-4 text-xs font-bold tracking-widest text-slate-400 uppercase">
        Loading Flowpilot...
      </p>
    </div>
  );
}

export function App() {
  const [currentView, setCurrentView] = useState<AppView>(APP_VIEWS.LANDING);
  const [activeRole, setActiveRole] = useState<string>('');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  if (currentView === APP_VIEWS.LOGIN) {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <LoginPage 
          onBackToHome={() => setCurrentView(APP_VIEWS.LANDING)} 
          onLoginSuccess={(role) => {
            setActiveRole(role);
            setCurrentView(APP_VIEWS.DASHBOARD);
          }}
        />
      </Suspense>
    );
  }

  if (currentView === APP_VIEWS.DASHBOARD && activeRole) {
    const logout = () => { setActiveRole(''); setCurrentView(APP_VIEWS.LANDING); };
    const norm = normalizeRole(activeRole);

    let dashboardComponent;
    switch (norm) {
      case 'SUPER_ADMIN':
        dashboardComponent = <SuperAdminLayout onLogout={logout} />;
        break;
      case 'ADMIN':
        dashboardComponent = <AdminLayout onLogout={logout} />;
        break;
      case 'PROJECT_MANAGER':
        dashboardComponent = <PMLayout onLogout={logout} />;
        break;
      case 'SCRUM_MASTER':
        dashboardComponent = <ScrumMasterLayout onLogout={logout} />;
        break;
      case 'DEVELOPER':
        dashboardComponent = <DeveloperLayout onLogout={logout} />;
        break;
      case 'QA_ENGINEER':
        dashboardComponent = <QALayout onLogout={logout} />;
        break;
      case 'VIEWER':
        dashboardComponent = <ViewerLayout onLogout={logout} />;
        break;
      default:
        dashboardComponent = <SuperAdminLayout onLogout={logout} />;
        break;
    }

    return (
      <Suspense fallback={<PageLoadingFallback />}>
        {dashboardComponent}
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen relative text-slate-900">
      {/* Floating Top Navigation */}
      <Header 
        onOpenDemo={() => setIsDemoModalOpen(true)} 
        onOpenLogin={() => setCurrentView(APP_VIEWS.LOGIN)}
      />

      {/* Main Landing Sections */}
      <main>
        <HeroSection onOpenDemo={() => setIsDemoModalOpen(true)} />
        <ProblemSection />
        <HowItWorksSection />
        <ModulesSection />
        <PipelineSection />
        <RolesSection />
        <ArchitectureSection />
        <CollaborationSection />
        <AnalyticsSection />
        <TestimonialsSection />
        <RoadmapSection />
        <SecuritySection />
        <PricingSection />
        <BottomCTASection onOpenDemo={() => setIsDemoModalOpen(true)} />
      </main>

      {/* Modern Footer */}
      <Footer />

      {/* Interactive Demo Video / Onboarding Modal */}
      {isDemoModalOpen && (
        <Suspense fallback={null}>
          <DemoModal
            isOpen={isDemoModalOpen}
            onClose={() => setIsDemoModalOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
