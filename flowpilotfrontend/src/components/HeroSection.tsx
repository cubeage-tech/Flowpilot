import React, { useState, useEffect } from 'react';
import { Play, Clock, ArrowUpRight, Zap, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface HeroSectionProps {
  onOpenDemo: () => void;
}

const dynamicWords = ['Together.', 'Smarter.', 'Faster.'];

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenDemo }) => {
  const [displayText, setDisplayText] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = dynamicWords[wordIdx];
    const speed = isDeleting ? 60 : 120;

    if (!isDeleting && displayText === currentWord) {
      const timeout = setTimeout(() => setIsDeleting(true), 1800);
      return () => clearTimeout(timeout);
    } else if (isDeleting && displayText === '') {
      setIsDeleting(false);
      setWordIdx((prev) => (prev + 1) % dynamicWords.length);
      return;
    }

    const timer = setTimeout(() => {
      setDisplayText(
        isDeleting
          ? currentWord.substring(0, displayText.length - 1)
          : currentWord.substring(0, displayText.length + 1)
      );
    }, speed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, wordIdx]);

  const [tasks, setTasks] = useState([
    { id: 1, title: 'DB Schema', sp: '3sp', user: 'AN', color: '#10b981', col: 'backlog' },
    { id: 2, title: 'API Docs', sp: '2sp', user: 'SR', color: '#10b981', col: 'backlog' },
    { id: 3, title: 'Auth Module', sp: '8sp', user: 'MK', color: '#3b82f6', col: 'inProgress' },
    { id: 4, title: 'Sprint UI', sp: '5sp', user: 'SR', color: '#3b82f6', col: 'inProgress' },
    { id: 5, title: 'JWT Flow', sp: '5sp', user: 'AK', color: '#f59e0b', col: 'review' },
    { id: 6, title: 'User Roles', sp: '3sp', user: 'PR', color: '#10b981', col: 'done' },
    { id: 7, title: 'Dashboard', sp: '8sp', user: 'DM', color: '#10b981', col: 'done' },
  ]);

  const handleStartTrial = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#8b5cf6']
    });
  };

  const moveTask = (id: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const order = ['backlog', 'inProgress', 'review', 'done'];
        const nextIdx = (order.indexOf(t.col) + 1) % order.length;
        return { ...t, col: order[nextIdx] };
      }
      return t;
    }));
  };

  return (
    <section className="relative pt-32 pb-0 bg-white overflow-hidden">
      {/* Exact Soft Mint Ambient Glow on Left */}
      <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] bg-[#a7f3d0]/35 blur-[90px] pointer-events-none z-0"></div>

      {/* Exact Soft Lavender Glow on Right */}
      <div className="absolute top-[5%] -right-[10%] w-[45vw] h-[45vw] bg-[#ddd6fe]/35 blur-[100px] pointer-events-none z-0"></div>

      {/* Floating 3D Translucent Glass Cubes matching Figma Image 1 */}
      <div className="absolute w-12 h-12 top-[38%] left-[4%] -rotate-15 bg-white/40 backdrop-blur-md border border-white/80 rounded-2xl shadow-sm pointer-events-none z-10 animate-cube-1"></div>
      <div className="absolute w-14 h-14 bottom-[30%] left-[5%] rotate-12 bg-white/40 backdrop-blur-md border border-white/80 rounded-2xl shadow-sm pointer-events-none z-10 animate-cube-2"></div>
      <div className="absolute w-16 h-16 top-[28%] right-[5%] rotate-20 bg-white/40 backdrop-blur-md border border-white/80 rounded-2xl shadow-sm pointer-events-none z-10 animate-cube-1"></div>
      <div className="absolute w-12 h-12 bottom-[32%] right-[4%] -rotate-12 bg-white/40 backdrop-blur-md border border-white/80 rounded-2xl shadow-sm pointer-events-none z-10 animate-cube-2"></div>

      <div className="max-w-[1240px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-start relative z-10">

        {/* Left Column */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider">
                + ENTERPRISE SAAS
              </span>
              <span className="bg-purple-500/10 text-purple-600 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider">
                AGILE & SCRUM
              </span>
              <span className="bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider">
                V2.0 LIVE
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-[74px] font-black leading-[0.98] tracking-tight text-slate-900 mb-6">
              Manage <br />
              Projects <br />
              <span className="bg-gradient-to-r from-[#4ade80] via-[#38bdf8] to-[#c084fc] bg-clip-text text-transparent">
                {displayText}
              </span>
              <span className="inline-block w-1.5 h-12 md:h-16 bg-[#34d399] ml-1.5 align-middle rounded-sm animate-blink-cursor"></span>
            </h1>

            <p className="text-base text-slate-500 leading-relaxed mb-8 max-w-[440px] font-medium">
              An enterprise-grade Agile workspace — Scrum boards, sprint planning, real-time analytics, role-based access, and burndown charts. Built from a 19-page SRS, not a template.
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={handleStartTrial}
                className="bg-[#10b981] hover:bg-emerald-600 text-white font-bold text-base px-8 py-3.5 rounded-full shadow-lg shadow-emerald-500/35 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                Start Free Trial
              </button>
              <button
                onClick={onOpenDemo}
                className="inline-flex items-center gap-2 bg-white/70 hover:bg-white text-slate-900 font-bold text-base px-7 py-3.5 rounded-full border border-slate-200/80 shadow-xs backdrop-blur-md hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-xs">
                  <Play size={12} fill="#0f172a" />
                </div>
                Watch Demo
              </button>
            </div>
          </div>

          {/* Stats Bar aligned under left CTAs matching exact Reference Image 1 */}
          <div className="mt-14 max-w-[440px]">
            <div className="flex items-center justify-around py-3.5 px-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm shadow-slate-900/5">
              <div className="text-center">
                <div className="text-2xl font-black text-slate-900 leading-none">500<span className="text-[#10b981]">+</span></div>
                <div className="text-[11px] font-semibold text-slate-400 mt-1">Teams</div>
              </div>
              <div className="w-px h-7 bg-slate-200"></div>
              <div className="text-center">
                <div className="text-2xl font-black text-slate-900 leading-none">99.9<span className="text-[#10b981]">%</span></div>
                <div className="text-[11px] font-semibold text-slate-400 mt-1">Uptime</div>
              </div>
              <div className="w-px h-7 bg-slate-200"></div>
              <div className="text-center">
                <div className="text-2xl font-black text-slate-900 leading-none">10</div>
                <div className="text-[11px] font-semibold text-slate-400 mt-1">Modules</div>
              </div>
              <div className="w-px h-7 bg-slate-200"></div>
              <div className="text-center">
                <div className="text-2xl font-black text-slate-900 leading-none">9</div>
                <div className="text-[10px] font-semibold text-slate-400 mt-1">User Roles</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Workspace Mockup matching Figma Image 1 dimensions */}
        <div className="relative">
          <div className="bg-slate-50/75 p-3 sm:p-7 rounded-[32px] border border-slate-200/80 shadow-2xl shadow-slate-900/10 min-h-[580px] flex flex-col justify-between">

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                </div>
                <div className="text-xs font-semibold text-slate-400">sprint-14 • ipmt.app</div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Live
                </div>
              </div>

              {/* Metric Boxes */}
              <div className="grid grid-cols-3 gap-3.5 mb-6">
                <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-xs">
                  <div className="text-2xl font-black text-slate-900">72%</div>
                  <div className="text-xs text-slate-500 mb-2">Sprint Progress</div>
                  <svg viewBox="0 0 100 30" className="w-full h-7">
                    <path d="M0 25 Q 30 20, 60 12 T 100 5 L 100 30 L 0 30 Z" fill="rgba(16,185,129,0.15)" />
                    <path d="M0 25 Q 30 20, 60 12 T 100 5" fill="none" stroke="#10b981" strokeWidth="2" />
                  </svg>
                  <div className="text-xs font-bold text-emerald-500 mt-1">+8% vs last</div>
                </div>

                <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-xs">
                  <div className="text-2xl font-black text-slate-900">87 pts</div>
                  <div className="text-xs text-slate-500 mb-2">Velocity</div>
                  <svg viewBox="0 0 100 30" className="w-full h-7">
                    <path d="M0 25 Q 40 18, 70 10 T 100 4 L 100 30 L 0 30 Z" fill="rgba(139,92,246,0.15)" />
                    <path d="M0 25 Q 40 18, 70 10 T 100 4" fill="none" stroke="#8b5cf6" strokeWidth="2" />
                  </svg>
                  <div className="text-xs font-bold text-purple-500 mt-1 inline-flex items-center">
                    <ArrowUpRight size={10} /> Sprint 14
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-xs">
                  <div className="text-2xl font-black text-slate-900">42/58</div>
                  <div className="text-xs text-slate-500 mb-2">Tasks Done</div>
                  <svg viewBox="0 0 100 30" className="w-full h-7">
                    <path d="M0 22 Q 35 15, 65 18 T 100 8 L 100 30 L 0 30 Z" fill="rgba(6,182,212,0.15)" />
                    <path d="M0 22 Q 35 15, 65 18 T 100 8" fill="none" stroke="#06b6d4" strokeWidth="2" />
                  </svg>
                  <div className="text-xs font-bold text-cyan-500 mt-1">0 blocked</div>
                </div>
              </div>

              {/* Kanban Columns */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 bg-slate-50 p-3 sm:p-4 rounded-2xl mb-6">
                <div className="flex min-w-0 flex-col">
                  <div className="flex min-h-7 items-start justify-between gap-1 text-[9px] sm:text-[10px] font-black text-slate-500 mb-2.5 uppercase leading-tight">
                    <span>BACKLOG</span>
                    <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">12</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {tasks.filter(t => t.col === 'backlog').map(t => (
                      <div key={t.id} onClick={() => moveTask(t.id)} className="bg-white border border-slate-200/80 rounded-xl p-2.5 min-h-[68px] cursor-pointer hover:-translate-y-0.5 transition-transform shadow-xs">
                        <div className="text-xs font-bold text-slate-800 mb-1 leading-tight">{t.title}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">{t.sp}</span>
                          <span className="w-4.5 h-4.5 rounded-full text-white text-[8px] font-bold flex items-center justify-center" style={{ background: t.color }}>{t.user}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex min-w-0 flex-col">
                  <div className="flex min-h-7 items-start justify-between gap-1 text-[9px] sm:text-[10px] font-black text-slate-500 mb-2.5 uppercase leading-tight">
                    <span>IN PROGRESS</span>
                    <span className="bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-md">6</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {tasks.filter(t => t.col === 'inProgress').map(t => (
                      <div key={t.id} onClick={() => moveTask(t.id)} className="bg-white border border-slate-200/80 rounded-xl p-2.5 min-h-[68px] cursor-pointer hover:-translate-y-0.5 transition-transform shadow-xs">
                        <div className="text-xs font-bold text-slate-800 mb-1 leading-tight">{t.title}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">{t.sp}</span>
                          <span className="w-4.5 h-4.5 rounded-full text-white text-[8px] font-bold flex items-center justify-center bg-emerald-600">{t.user}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex min-w-0 flex-col">
                  <div className="flex min-h-7 items-start justify-between gap-1 text-[9px] sm:text-[10px] font-black text-slate-500 mb-2.5 uppercase leading-tight">
                    <span>REVIEW</span>
                    <span className="bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md">4</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {tasks.filter(t => t.col === 'review').map(t => (
                      <div key={t.id} onClick={() => moveTask(t.id)} className="bg-white border border-slate-200/80 rounded-xl p-2.5 min-h-[68px] cursor-pointer hover:-translate-y-0.5 transition-transform shadow-xs">
                        <div className="text-xs font-bold text-slate-800 mb-1 leading-tight">{t.title}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">{t.sp}</span>
                          <span className="w-4.5 h-4.5 rounded-full text-white text-[8px] font-bold flex items-center justify-center bg-teal-600">{t.user}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex min-w-0 flex-col">
                  <div className="flex min-h-7 items-start justify-between gap-1 text-[9px] sm:text-[10px] font-black text-slate-500 mb-2.5 uppercase leading-tight">
                    <span>DONE</span>
                    <span className="bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-md">42</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {tasks.filter(t => t.col === 'done').map(t => (
                      <div key={t.id} onClick={() => moveTask(t.id)} className="bg-white border border-slate-200/80 rounded-xl p-2.5 min-h-[68px] cursor-pointer hover:-translate-y-0.5 transition-transform shadow-xs">
                        <div className="text-xs font-bold text-slate-800 mb-1 leading-tight">{t.title}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">{t.sp}</span>
                          <span className="w-4.5 h-4.5 rounded-full text-white text-[8px] font-bold flex items-center justify-center bg-emerald-500">{t.user}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-[1.25fr_1fr] gap-4">
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                <div className="text-xs font-bold text-slate-900 mb-2">Burndown - Sprint 14</div>
                <svg viewBox="0 0 200 60" className="w-full h-12">
                  <line x1="0" y1="5" x2="200" y2="55" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1.5" />
                  <path d="M0 5 L 40 18 L 80 22 L 120 38 L 160 42 L 200 52 L 200 60 L 0 60 Z" fill="rgba(16, 185, 129, 0.1)" />
                  <path d="M0 5 L 40 18 L 80 22 L 120 38 L 160 42 L 200 52" fill="none" stroke="#10b981" strokeWidth="2.5" />
                </svg>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                <div className="text-xs font-bold text-slate-900 mb-2">Live Activity</div>
                <ul className="flex flex-col gap-2 list-none">
                  <li className="flex items-center gap-2 text-xs">
                    <span className="w-4.5 h-4.5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0"><Check size={10} /></span>
                    <span className="text-slate-600 flex-1 truncate">JWT module merged</span>
                    <span className="text-slate-300 text-[11px]">1m</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs">
                    <span className="w-4.5 h-4.5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0"><Clock size={10} /></span>
                    <span className="text-slate-600 flex-1 truncate">SR commented</span>
                    <span className="text-slate-300 text-[11px]">3m</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs">
                    <span className="w-4.5 h-4.5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0"><Zap size={10} /></span>
                    <span className="text-slate-600 flex-1 truncate">Sprint 15 created</span>
                    <span className="text-slate-300 text-[11px]">8m</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Dark Feature Ticker Bar with clear margin separation */}
      <div className="mt-16 w-screen -ml-[calc(50vw-50%)] bg-[#090d16] py-4 overflow-hidden relative z-20 whitespace-nowrap">
        <div className="inline-flex items-center gap-8 animate-ticker">
          <span className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">BURNDOWN CHARTS</span><span className="text-emerald-500 text-xs">✦</span>
          <span className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">VELOCITY TRACKING</span><span className="text-emerald-500 text-xs">✦</span>
          <span className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">ROLE-BASED ACCESS</span><span className="text-emerald-500 text-xs">✦</span>
          <span className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">REAL-TIME COLLABORATION</span><span className="text-emerald-500 text-xs">✦</span>
          <span className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">TASK ASSIGNMENTS</span><span className="text-emerald-500 text-xs">✦</span>
          <span className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">AUDIT LOGS</span><span className="text-emerald-500 text-xs">✦</span>
          <span className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">NOTIFICATIONS</span><span className="text-emerald-500 text-xs">✦</span>
          <span className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">FILE SHARING</span><span className="text-emerald-500 text-xs">✦</span>

          <span className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">BURNDOWN CHARTS</span><span className="text-emerald-500 text-xs">✦</span>
          <span className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">VELOCITY TRACKING</span><span className="text-emerald-500 text-xs">✦</span>
          <span className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">ROLE-BASED ACCESS</span><span className="text-emerald-500 text-xs">✦</span>
          <span className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">REAL-TIME COLLABORATION</span><span className="text-emerald-500 text-xs">✦</span>
          <span className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">TASK ASSIGNMENTS</span><span className="text-emerald-500 text-xs">✦</span>
          <span className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">AUDIT LOGS</span><span className="text-emerald-500 text-xs">✦</span>
          <span className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">NOTIFICATIONS</span><span className="text-emerald-500 text-xs">✦</span>
          <span className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">FILE SHARING</span><span className="text-emerald-500 text-xs">✦</span>
        </div>
      </div>
    </section>
  );
};
