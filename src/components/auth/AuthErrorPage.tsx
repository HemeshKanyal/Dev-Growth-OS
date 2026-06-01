import React from 'react';
import { ShieldAlert, ArrowLeft, Calendar } from 'lucide-react';

interface AuthErrorPageProps {
  errorTitle?: string;
  errorDescription?: string;
  onReturn: () => void;
}

export const AuthErrorPage: React.FC<AuthErrorPageProps> = ({ 
  errorTitle = 'Authentication Error',
  errorDescription = 'The link is invalid or has expired. Please try again.',
  onReturn 
}) => {
  return (
    <div className="landing-page-root min-h-screen bg-[#0b0b0b] text-[#e3e3e3] flex flex-col font-sans">
      {/* Header */}
      <header className="px-10 py-6 border-b border-[#1a1a1a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="nav-logo-box">
            <Calendar className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wide text-white leading-none font-sans">
              DEV GROWTH
            </h1>
            <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase mt-1 font-semibold">
              Productivity OS
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="auth-card flex flex-col gap-4 relative mx-auto w-full" style={{ maxWidth: '460px' }}>
          {/* Decorative glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <ShieldAlert className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">{errorTitle}</h2>
                <p className="text-xs text-slate-400 font-mono mt-1.5 leading-relaxed">
                  {errorDescription.replace(/\+/g, ' ')}
                </p>
              </div>
            </div>

            <button
              onClick={onReturn}
              className="btn btn-outline w-full py-3 rounded-md font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer border border-slate-700 hover:border-slate-500 hover:bg-slate-800 mt-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Login</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
