import React, { useState } from 'react';
import { X, Play, CheckCircle } from 'lucide-react';
import demoVideo from '../assets/flowpilot demo.mp4';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-5" onClick={onClose}>
      <div className="bg-white w-full max-w-[580px] p-8 rounded-3xl relative shadow-2xl" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 bg-slate-100 border-none w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <span className="bg-emerald-50 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            INTERACTIVE DEMO
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2.5 mb-1.5">Experience FlowPilot (IPMT v2.0)</h2>
          <p className="text-sm text-slate-500">Watch how enterprise Agile teams accelerate sprint delivery by 40%.</p>
        </div>

        <div className="mb-6">
          <div 
            className="h-[220px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer shadow-lg group relative overflow-hidden"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {!isPlaying ? (
              <>
                <div className="w-15 h-15 rounded-full bg-emerald-500 flex items-center justify-center pl-1 shadow-lg shadow-emerald-500/40 group-hover:scale-110 transition-transform">
                  <Play size={28} fill="#ffffff" color="#ffffff" />
                </div>
                <div className="text-white text-xs font-bold">Click to Play 2-Minute Walkthrough</div>
              </>
            ) : (
              <video 
                src={demoVideo}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <CheckCircle size={16} className="text-emerald-500" /> 19-Page SRS Spec Compliant
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <CheckCircle size={16} className="text-emerald-500" /> Real-time WebSocket Collaboration
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <CheckCircle size={16} className="text-emerald-500" /> Granular Role-Based Permissions
          </div>
        </div>

        <div>
          <button 
            onClick={onClose}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm py-3.5 rounded-full shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
          >
            Start 14-Day Free Trial
          </button>
        </div>
      </div>
    </div>
  );
};
