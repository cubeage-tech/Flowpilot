import React, { useState } from 'react';
import { Check } from 'lucide-react';

export const PricingSection: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section className="py-24 px-6 max-w-[1240px] mx-auto" id="pricing">
      {/* Header */}
      <div className="text-center max-w-[750px] mx-auto mb-12">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 mb-6">
          Simple, honest pricing
        </h2>

        {/* Toggle Switch: Monthly vs Annual (-25%) */}
        <div className="flex items-center justify-center gap-3 text-xs font-bold text-slate-600">
          <span className={!isAnnual ? 'text-slate-900 font-extrabold' : 'text-slate-400'}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-12 h-6 rounded-full bg-emerald-500 p-1 flex items-center transition-all cursor-pointer shadow-xs"
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </button>
          <span className={isAnnual ? 'text-slate-900 font-extrabold flex items-center gap-1.5' : 'text-slate-400'}>
            Annual <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-black">-25%</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid matching Figma Screenshot 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">

        {/* Card 1: STARTER / Free */}
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl shadow-slate-900/5 flex flex-col justify-between hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-2 transition-all duration-300 group">
          <div>
            <span className="text-[10px] font-black tracking-wider text-emerald-600 uppercase mb-2 block">STARTER</span>
            <div className="text-4xl font-black text-slate-900 mb-1">Free</div>
            <p className="text-xs text-slate-400 font-medium mb-6">Free forever</p>
            <p className="text-xs text-slate-500 mb-6">For small teams exploring Agile.</p>

            <button className="w-full py-3.5 px-4 rounded-full border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-900 hover:text-white transition-all mb-8 cursor-pointer shadow-xs">
              Start Free
            </button>

            <ul className="flex flex-col gap-3 text-xs text-slate-600 font-medium">
              <li className="flex items-center gap-2.5"><Check size={14} className="text-emerald-500 shrink-0" /> Up to 5 members</li>
              <li className="flex items-center gap-2.5"><Check size={14} className="text-emerald-500 shrink-0" /> 3 active projects</li>
              <li className="flex items-center gap-2.5"><Check size={14} className="text-emerald-500 shrink-0" /> Basic Scrum board</li>
              <li className="flex items-center gap-2.5"><Check size={14} className="text-emerald-500 shrink-0" /> Task management</li>
              <li className="flex items-center gap-2.5"><Check size={14} className="text-emerald-500 shrink-0" /> Email notifications</li>
              <li className="flex items-center gap-2.5"><Check size={14} className="text-emerald-500 shrink-0" /> 5 GB storage</li>
            </ul>
          </div>
        </div>

        {/* Card 2: PROFESSIONAL / $18 (MOST POPULAR) */}
        <div className="bg-white rounded-[32px] p-8 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10 flex flex-col justify-between relative transform lg:-translate-y-2 hover:shadow-emerald-500/25 hover:-translate-y-3 transition-all duration-300 group">
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] font-black tracking-widest px-3.5 py-1 rounded-full uppercase">
            MOST POPULAR
          </span>

          <div>
            <span className="text-[10px] font-black tracking-wider text-emerald-600 uppercase mb-2 block">PROFESSIONAL</span>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-black text-slate-900">RS.{isAnnual ? '20,000' : '1,800'}</span>
              <span className="text-xs text-slate-400 font-bold">{isAnnual ? '/yr' : '/mo'}</span>
            </div>
            <p className="text-xs text-slate-400 font-medium mb-6">per user{isAnnual ? ' year' : ' month'}</p>
            <p className="text-xs text-slate-500 mb-6">Full Agile suite for growing teams.</p>

            <button className="w-full py-3.5 px-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all mb-8 cursor-pointer shadow-md shadow-emerald-500/20 group-hover:scale-102">
              Start Free 7-days Trial
            </button>

            <ul className="flex flex-col gap-3 text-xs text-slate-600 font-medium">
              <li className="flex items-center gap-2.5"><Check size={14} className="text-emerald-500 shrink-0" /> Unlimited members</li>
              <li className="flex items-center gap-2.5"><Check size={14} className="text-emerald-500 shrink-0" /> Unlimited projects</li>
              <li className="flex items-center gap-2.5"><Check size={14} className="text-emerald-500 shrink-0" /> Full Scrum workflow</li>
              <li className="flex items-center gap-2.5"><Check size={14} className="text-emerald-500 shrink-0" /> Sprint planning & velocity</li>
              <li className="flex items-center gap-2.5"><Check size={14} className="text-emerald-500 shrink-0" /> All 7 report types</li>
              <li className="flex items-center gap-2.5"><Check size={14} className="text-emerald-500 shrink-0" /> Role-based access (9 roles)</li>
              <li className="flex items-center gap-2.5"><Check size={14} className="text-emerald-500 shrink-0" /> Priority support</li>
            </ul>
          </div>
        </div>

        {/* Card 3: ENTERPRISE / Custom */}
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl shadow-slate-900/5 flex flex-col justify-between hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 transition-all duration-300 group">
          <div>
            <span className="text-[10px] font-black tracking-wider text-purple-600 uppercase mb-2 block">ENTERPRISE</span>
            <div className="text-4xl font-black text-slate-900 mb-1">Custom</div>
            <p className="text-xs text-slate-400 font-medium mb-6">contact sales</p>
            <p className="text-xs text-slate-500 mb-6">Advanced security, compliance & SLA.</p>

            <button className="w-full py-3.5 px-4 rounded-full border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-900 hover:text-white transition-all mb-8 cursor-pointer shadow-xs">
              Talk to Sales
            </button>

            <ul className="flex flex-col gap-3 text-xs text-slate-600 font-medium">
              <li className="flex items-center gap-2.5"><Check size={14} className="text-purple-500 shrink-0" /> Everything in Pro</li>
              <li className="flex items-center gap-2.5"><Check size={14} className="text-purple-500 shrink-0" /> SSO & SAML</li>
              <li className="flex items-center gap-2.5"><Check size={14} className="text-purple-500 shrink-0" /> SOC2 compliance docs</li>
              <li className="flex items-center gap-2.5"><Check size={14} className="text-purple-500 shrink-0" /> Dedicated CSM</li>
              <li className="flex items-center gap-2.5"><Check size={14} className="text-purple-500 shrink-0" /> Custom integrations</li>
              <li className="flex items-center gap-2.5"><Check size={14} className="text-purple-500 shrink-0" /> On-premise option</li>
              <li className="flex items-center gap-2.5"><Check size={14} className="text-purple-500 shrink-0" /> Uptime SLA</li>
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
};
