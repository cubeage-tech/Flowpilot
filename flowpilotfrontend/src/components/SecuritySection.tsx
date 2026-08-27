import React from 'react';
import { Key, ShieldCheck, Lock, ClipboardList, Database, ShieldAlert } from 'lucide-react';

export const SecuritySection: React.FC = () => {
  const securityFeatures = [
    {
      icon: <Key className="text-amber-400" size={20} />,
      title: 'JWT + Refresh Tokens',
      desc: 'Stateless auth, auto-rotation'
    },
    {
      icon: <ShieldCheck className="text-rose-400" size={20} />,
      title: 'RBAC Enforcement',
      desc: '9 roles, action-level gating'
    },
    {
      icon: <Lock className="text-amber-400" size={20} />,
      title: 'AES-256 Encryption',
      desc: 'At rest and in transit'
    },
    {
      icon: <ClipboardList className="text-slate-300" size={20} />,
      title: 'Complete Audit Logs',
      desc: 'Every action traceable'
    },
    {
      icon: <Database className="text-amber-600" size={20} />,
      title: 'SQL Injection Guard',
      desc: 'Parameterized queries only'
    },
    {
      icon: <ShieldAlert className="text-rose-500" size={20} />,
      title: 'XSS + CSRF Protect',
      desc: 'Sanitization & CSRF tokens'
    }
  ];

  return (
    <section className="bg-[#0b0f19] text-white py-24 px-6 relative overflow-hidden my-12">
      {/* Glow Effects */}
      <div className="absolute top-1/2 -left-32 w-[40vw] h-[40vw] bg-emerald-500/10 blur-[130px] pointer-events-none"></div>

      <div className="max-w-[1240px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Heading & 6 Feature Cards */}
          <div className="relative z-10">
            <span className="inline-block text-xs font-extrabold tracking-widest text-emerald-400 uppercase mb-3">
              ENTERPRISE SECURITY
            </span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-6">
              Built secure <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">from the ground up</span>
            </h2>
            <p className="text-base text-slate-400 leading-relaxed font-medium mb-10">
              JWT + Refresh Token auth, AES-256 encryption, SQL injection and XSS protection, CSRF mitigation, role-scoped data access, complete audit trails, and 99.9% uptime SLA.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {securityFeatures.map((sec, idx) => (
                <div key={idx} className="bg-[#121826]/90 border border-slate-800/80 p-5 rounded-2xl flex items-start gap-4 shadow-lg">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    {sec.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200 mb-0.5">{sec.title}</h4>
                    <p className="text-xs text-slate-500">{sec.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Visual Lock Graphic matching Figma Screenshot 5 */}
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-60 blur-[1px] pointer-events-none lg:relative lg:inset-auto lg:min-h-[380px] lg:opacity-100 lg:blur-0">
            {/* Concentric Radar Rings */}
            <div className="absolute w-[360px] h-[360px] rounded-full border border-slate-800/60 animate-ping opacity-20"></div>
            <div className="absolute w-[300px] h-[300px] rounded-full border border-slate-800"></div>
            <div className="absolute w-[220px] h-[220px] rounded-full border border-emerald-500/20"></div>
            <div className="absolute w-[140px] h-[140px] rounded-full border border-emerald-500/40"></div>

            {/* Glowing Lock Box */}
            <div className="w-24 h-24 rounded-3xl bg-slate-900 border-2 border-emerald-500/50 flex items-center justify-center shadow-2xl shadow-emerald-500/20 relative z-10">
              <Lock size={38} className="text-emerald-400" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
