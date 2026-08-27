import React from 'react';
import { FileSpreadsheet, Mail, EyeOff, CopyX, Clock, Lock } from 'lucide-react';

export const ProblemSection: React.FC = () => {
  const problems = [
    {
      icon: <FileSpreadsheet className="text-emerald-500" size={24} />,
      title: 'Scattered Spreadsheets',
      desc: 'No central source of truth — data lives in 10 different Excel files.',
      glowClass: 'hover:border-rose-300 hover:shadow-rose-500/10'
    },
    {
      icon: <Mail className="text-blue-500" size={24} />,
      title: 'Email Thread Chaos',
      desc: 'Task context buried in 200-reply email threads no one can find.',
      glowClass: 'hover:border-purple-300 hover:shadow-purple-500/10'
    },
    {
      icon: <EyeOff className="text-indigo-500" size={24} />,
      title: 'No Sprint Visibility',
      desc: 'Poor burndown tracking — management never knows actual progress.',
      glowClass: 'hover:border-blue-300 hover:shadow-blue-500/10'
    },
    {
      icon: <CopyX className="text-cyan-500" size={24} />,
      title: 'Duplicate Work',
      desc: 'Two developers working the same ticket with no dependency tracking.',
      glowClass: 'hover:border-cyan-300 hover:shadow-cyan-500/10'
    },
    {
      icon: <Clock className="text-rose-500" size={24} />,
      title: 'Missed Deadlines',
      desc: 'No automated reminders. Deadlines pass silently.',
      glowClass: 'hover:border-rose-300 hover:shadow-rose-500/10'
    },
    {
      icon: <Lock className="text-amber-500" size={24} />,
      title: 'No Access Control',
      desc: 'Contractors see salary data. Junior devs can delete projects.',
      glowClass: 'hover:border-amber-300 hover:shadow-amber-500/10'
    }
  ];

  return (
    <section className="w-full bg-[#fdf4f5] py-24 px-6" id="solutions">
      <div className="max-w-[1200px] mx-auto">
      <div className="text-center max-w-[1100px] mx-auto mb-14">
        <span className="inline-block text-xs font-extrabold tracking-[0.2em] text-rose-500 uppercase mb-3">
          THE PROBLEM
        </span>
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 mb-4 leading-tight">
          Before Flowpilot, teams were <span className="drowning-effect">drowning</span>
        </h2>
        <p className="text-base sm:text-lg text-slate-500 leading-relaxed font-medium max-w-[660px] mx-auto">
          The SRS documents 10 specific organisational challenges that Flowpilot was built to eliminate. Here are the worst six.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
        {problems.map((p, index) => (
          <div 
            key={index} 
            className="bg-white/90 backdrop-blur-sm border border-rose-100 rounded-2xl p-6 shadow-xs hover:border-rose-300 hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-pink-400 opacity-60"></div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50/50 border border-rose-100/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                {p.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{p.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Solution Banner & Down Arrow Button */}
      <div className="mt-16 flex flex-col items-center justify-center gap-3">
        <span className="text-[13px] font-extrabold tracking-wider text-emerald-500 uppercase">
          FLOWPILOT SOLVES EVERY ONE OF THESE
        </span>
        <a 
          href="#how-it-works"
          className="w-10 h-10 rounded-full bg-white border border-slate-200/80 shadow-md flex items-center justify-center text-slate-800 hover:text-emerald-500 hover:border-emerald-300 hover:shadow-emerald-500/10 hover:translate-y-1 transition-all duration-300 cursor-pointer text-xl font-bold"
          aria-label="Scroll down to solutions"
        >
          ↓
        </a>
      </div>
      </div>
    </section>
  );
};
