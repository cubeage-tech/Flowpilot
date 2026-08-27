import React from 'react';
import { ArrowRight, LayoutGrid } from 'lucide-react';

interface HeaderProps {
  onOpenDemo: () => void;
  onOpenLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDemo, onOpenLogin }) => {
  return (
    <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="flex min-w-0 items-center justify-between w-full max-w-[1080px] bg-white/80 backdrop-blur-xl border border-white/90 shadow-xl shadow-rose-950/5 rounded-full py-2.5 pl-3 pr-2 sm:pl-5 sm:pr-3 transition-all duration-300">
        {/* Brand Logo */}
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25">
            <LayoutGrid size={20} />
          </div>
          <span className="truncate font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">Flowpilot</span>
          <span className="hidden sm:inline bg-emerald-50 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
            V2.0
          </span>
        </div>

        {/* Navigation Links */}
        <ul className="hidden md:flex items-center gap-7 list-none">
          <li><a href="#features" className="text-slate-600 text-sm font-semibold hover:text-emerald-500 transition-colors">Features</a></li>
          <li><a href="#solutions" className="text-slate-600 text-sm font-semibold hover:text-emerald-500 transition-colors">Solutions</a></li>
          <li><a href="#pricing" className="text-slate-600 text-sm font-semibold hover:text-emerald-500 transition-colors">Pricing</a></li>
          <li><a href="#docs" className="text-slate-600 text-sm font-semibold hover:text-emerald-500 transition-colors">Docs</a></li>
          <li><a href="#about" className="text-slate-600 text-sm font-semibold hover:text-emerald-500 transition-colors">About</a></li>
        </ul>

        {/* Action Buttons */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <button 
            onClick={onOpenLogin || onOpenDemo}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] sm:text-sm px-6 sm:px-8 py-2.5 rounded-full shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 transition-all whitespace-nowrap"
          >
            Login <ArrowRight size={14} className="sm:h-4 sm:w-4" />
          </button>
        </div>
      </nav>
    </header>
  );
};
