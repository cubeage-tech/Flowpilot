import { useState } from 'react';
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
import { DemoModal } from './components/DemoModal';
import { LoginPage } from './components/common/LoginPage';
import { SuperAdminLayout } from './components/superadmin/SuperAdminLayout';
import { AdminLayout } from './components/admin/AdminLayout';
import { PMLayout } from './components/pm/PMLayout';
import { ScrumMasterLayout } from './components/scrummaster/ScrumMasterLayout';
import { DeveloperLayout } from './components/developer/DeveloperLayout';
import { QALayout } from './components/qa/QALayout';
import { ViewerLayout } from './components/viewer/ViewerLayout';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'dashboard'>('landing');
  const [activeRole, setActiveRole] = useState<string>('');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  if (currentView === 'login') {
    return (
      <LoginPage 
        onBackToHome={() => setCurrentView('landing')} 
        onLoginSuccess={(role) => {
          setActiveRole(role);
          setCurrentView('dashboard');
        }}
      />
    );
  }

  if (currentView === 'dashboard' && activeRole) {
    const logout = () => { setActiveRole(''); setCurrentView('landing'); };
    switch (activeRole) {
      case 'Super Admin': return <SuperAdminLayout onLogout={logout} />;
      case 'Admin': return <AdminLayout onLogout={logout} />;
      case 'Project Manager': return <PMLayout onLogout={logout} />;
      case 'Scrum Master': return <ScrumMasterLayout onLogout={logout} />;
      case 'Developer': return <DeveloperLayout onLogout={logout} />;
      case 'QA Engineer': return <QALayout onLogout={logout} />;
      case 'Viewer': return <ViewerLayout onLogout={logout} />;
      default: return <SuperAdminLayout onLogout={logout} />;
    }
  }

  return (
    <div className="min-h-screen relative text-slate-900">
      {/* Floating Top Navigation */}
      <Header 
        onOpenDemo={() => setIsDemoModalOpen(true)} 
        onOpenLogin={() => setCurrentView('login')}
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
      <DemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </div>
  );
}

export default App;
