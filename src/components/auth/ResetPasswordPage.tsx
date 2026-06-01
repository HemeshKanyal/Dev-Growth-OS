import React, { useState } from 'react';
import { Shield, ArrowRight, Lock, ShieldAlert, Check, Calendar } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface ResetPasswordPageProps {
  onPasswordReset: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onPasswordReset }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!password || password.length < 6) {
      setErrorMsg('Passcode must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Your passcode has been successfully updated.');
        setTimeout(() => {
          onPasswordReset();
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

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
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Set New Passcode</h2>
                <p className="text-xs text-slate-400 font-mono mt-1.5 leading-relaxed">
                  Enter a new passcode to secure your developer workspace.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-2 font-mono">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 flex items-center gap-2 font-mono">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wide">New Passcode</label>
                <div className="relative flex items-center">
                  <Lock className="h-4 w-4 input-icon text-slate-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="landing-input pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || !!successMsg}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !!successMsg}
                className="btn btn-green w-full py-3 rounded-md font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer border-0 mt-2"
              >
                {loading ? (
                  <span className="animate-pulse">Updating...</span>
                ) : successMsg ? (
                  <span>Redirecting...</span>
                ) : (
                  <>
                    <span>Save Passcode</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
