import React, { useState } from 'react';
import {
  Calendar as CalendarIcon, BarChart2, Trophy,
  Terminal, Lock, Mail, ArrowRight, X, ShieldAlert,
  Zap, Star, Shield, Check, User, Sparkles
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface LandingPageProps {
  onLoginSuccess: (email: string) => void;
}

type AuthMethod = 'password' | 'magic-link';

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'reset-password'>('login');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password');

  // Form fields
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  // Magic link flow
  const [magicLinkSent, setMagicLinkSent] = useState<boolean>(false);

  // UI states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<string | null>(null);

  // Newsletter states
  const [newsletterEmail, setNewsletterEmail] = useState<string>('');
  const [newsletterSuccess, setNewsletterSuccess] = useState<boolean>(false);

  const resetFormState = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setMagicLinkSent(false);
    setLoadingState(null);
  };

  const switchAuthMode = (mode: 'login' | 'register' | 'reset-password') => {
    resetFormState();
    setAuthMode(mode);
  };

  const switchAuthMethod = (method: AuthMethod) => {
    resetFormState();
    setAuthMethod(method);
  };

  const resetAndClose = () => {
    if (loadingState) return;
    setShowAuthModal(false);
    setErrorMsg(null);
    setSuccessMsg(null);
    setName('');
    setEmail('');
    setPassword('');
    setMagicLinkSent(false);
    setLoadingState(null);
    setAuthMethod('password');
    setAuthMode('login');
  };

  const getFriendlyErrorMessage = (errorMsg: string) => {
    if (errorMsg.toLowerCase().includes('rate limit')) {
      return 'Rate limit exceeded. Please wait 60 seconds before requesting another link.';
    }
    return errorMsg;
  };

  // ─── Email/Password Auth ───
  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please enter a valid developer email address.');
      return;
    }

    if (authMode === 'reset-password') {
      setLoadingState('Dispatching reset link...');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      setLoadingState(null);
      if (error) {
        setErrorMsg(getFriendlyErrorMessage(error.message));
      } else {
        setSuccessMsg('Check your email for the password reset link.');
      }
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Passcode must be at least 6 characters long.');
      return;
    }

    if (authMode === 'register') {
      setLoadingState('Creating developer identity...');
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name || 'Developer' }
        }
      });
      setLoadingState(null);
      if (error) {
        setErrorMsg(getFriendlyErrorMessage(error.message));
      } else {
        setSuccessMsg('Check your email for a confirmation link to activate your account!');
      }
    } else {
      setLoadingState('Compiling credentials...');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setLoadingState(null);
      if (error) {
        setErrorMsg(getFriendlyErrorMessage(error.message));
      } else if (data.user) {
        onLoginSuccess(data.user.email || email);
      }
    }
  };

  // ─── Magic Link (Email OTP) ───
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoadingState('Dispatching magic link...');
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoadingState(null);

    if (error) {
      setErrorMsg(getFriendlyErrorMessage(error.message));
    } else {
      setMagicLinkSent(true);
      setSuccessMsg('Magic link sent! Check your inbox and click the link to sign in.');
    }
  };



  // ─── Social OAuth ───
  const handleSocialLogin = async (provider: 'google' | 'github' | 'twitter' | 'apple') => {
    setErrorMsg(null);
    setLoadingState(`Connecting to ${provider}...`);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin
      }
    });

    setLoadingState(null);
    if (error) {
      setErrorMsg(getFriendlyErrorMessage(error.message));
    }
    // On success, Supabase redirects automatically
  };

  // Handle Newsletter Submit
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) return;

    try {
      const { error } = await supabase.from('waitlist').insert({ email: newsletterEmail });
      if (error) {
        console.error('Error adding to waitlist:', error);
      }
    } catch (err) {
      console.error('Unexpected error adding to waitlist:', err);
    }

    setNewsletterSuccess(true);
    setNewsletterEmail('');
    setTimeout(() => {
      setNewsletterSuccess(false);
    }, 4000);
  };

  // ─── Auth method tab definitions ───
  const authTabs: { key: AuthMethod; label: string; icon: React.ReactNode }[] = [
    { key: 'password', label: 'Password', icon: <Lock className="h-3.5 w-3.5" /> },
    { key: 'magic-link', label: 'Magic Link', icon: <Sparkles className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="landing-page-root min-h-screen bg-[#0b0b0b] text-[#e3e3e3] flex flex-col selection:bg-white/10 selection:text-white font-sans">

      {/* Landing Navbar */}
      <header className="landing-nav-container">
        <div className="flex items-center gap-3">
          <div className="nav-logo-box">
            <CalendarIcon className="h-4.5 w-4.5" />
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



        {/* Buttons (Right) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              switchAuthMode('login');
              setShowAuthModal(true);
            }}
            className="btn-login-outline"
          >
            LOG IN
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl w-full mx-auto px-10 py-12 md:py-20 hero-section-grid">

        {/* Left Side: High Impact copy */}
        <div className="flex flex-col gap-6">
          <div className="hero-badge-capsule">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>VERSION 1.0 NOW DEPLOYED</span>
          </div>

          <h2 className="hero-h1 leading-tight">
            The Productivity OS <br /> for the <span className="text-slate-100 font-extrabold">Top 1%</span> Developers.
          </h2>

          <p className="hero-paragraph">
            Align your calendar grids, checklist scopes, weekly metrics, and streak dopamine systems into one unified, notion-minimalist sandbox designed to build absolute coding consistency.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={() => {
                switchAuthMode('register');
                setShowAuthModal(true);
              }}
              className="btn-hero-green"
            >
              <span>Initialize Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                const element = document.getElementById('features');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-hero-outline"
            >
              <span>Explore Docs</span>
              <svg className="h-4 w-4 text-slate-500 fill-none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6 border-t border-[#1a1a1a] pt-8 mt-6">
            <div className="stat-card-box">
              <div className="stat-card-number-row">
                <Shield className="h-4.5 w-4.5 stat-card-icon" />
                <span className="stat-card-number">100%</span>
              </div>
              <span className="stat-card-title">Local Persistence</span>
              <span className="stat-card-desc">Your data. Your control.</span>
            </div>

            <div className="stat-card-box">
              <div className="stat-card-number-row">
                <Zap className="h-4.5 w-4.5 stat-card-icon fill-white/10" />
                <span className="stat-card-number">&ge;80%</span>
              </div>
              <span className="stat-card-title">Streak Threshold</span>
              <span className="stat-card-desc">Built for consistency.</span>
            </div>

            <div className="stat-card-box">
              <div className="stat-card-number-row">
                <BarChart2 className="h-4.5 w-4.5 stat-card-icon" />
                <span className="stat-card-number">0px</span>
              </div>
              <span className="stat-card-title">Accented Gradients</span>
              <span className="stat-card-desc font-sans">Clean. Focused. Intentional.</span>
            </div>
          </div>
        </div>

        {/* Right Side: Mockup Image with green shadows */}
        <div className="relative">
          <div className="hero-glow-orb" />
          <div className="hero-mockup-container relative z-9">
            <img
              src="/developer_growth_hero.png"
              alt="Productivity OS Dashboard Mockup"
              className="w-full h-auto block select-none pointer-events-none"
            />
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="max-w-7xl w-full mx-auto px-10 py-16 border-t border-[#2c2c2c] flex flex-col gap-10">
        <div className="text-center max-w-xl mx-auto flex flex-col gap-2">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">System Modules</span>
          <h3 className="text-2xl font-bold tracking-tight text-white leading-tight">Engineered for Developer Consistency</h3>
          <p className="text-xs text-slate-400 mt-0.5">Every module is purpose-built to help you plan, track, and ship with relentless focus.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="feature-module-card">
            <div>
              <div className="feature-module-icon-box">
                <CalendarIcon className="h-4.5 w-4.5" />
              </div>
              <h4 className="feature-module-title">Unified Month Planner</h4>
              <p className="feature-module-desc">
                Schedule study scopes and priority tasks inside an 8-column calendar designed to balance focus cycles.
              </p>
            </div>
            <ArrowRight className="h-4.5 w-4.5 feature-module-chevron" />
          </div>

          {/* Card 2 */}
          <div className="feature-module-card">
            <div>
              <div className="feature-module-icon-box">
                <Terminal className="h-4.5 w-4.5" />
              </div>
              <h4 className="feature-module-title">Monochromatic Grid</h4>
              <p className="feature-module-desc">
                View grids shaped after GitHub contribution graphs, complete with monochromatic grey-and-whites and interactive hover tooltips.
              </p>
            </div>
            <ArrowRight className="h-4.5 w-4.5 feature-module-chevron" />
          </div>

          {/* Card 3 */}
          <div className="feature-module-card">
            <div>
              <div className="feature-module-icon-box">
                <BarChart2 className="h-4.5 w-4.5" />
              </div>
              <h4 className="feature-module-title">Weekly Analytics Sync</h4>
              <p className="feature-module-desc">
                Evaluate development curves, focus areas, and completion statistics across the past seven days.
              </p>
            </div>
            <ArrowRight className="h-4.5 w-4.5 feature-module-chevron" />
          </div>

          {/* Card 4 */}
          <div className="feature-module-card">
            <div>
              <div className="feature-module-icon-box">
                <Trophy className="h-4.5 w-4.5" />
              </div>
              <h4 className="feature-module-title">Trophy Milestones</h4>
              <p className="feature-module-desc">
                Earn milestone badges and streak records as rewards for sustaining daily target ratios of &ge;80% daily.
              </p>
            </div>
            <ArrowRight className="h-4.5 w-4.5 feature-module-chevron" />
          </div>
        </div>
      </section>

      {/* Newsletter & Early Access Block */}
      <section className="max-w-7xl w-full mx-auto px-10 py-16 border-t border-[#2c2c2c]">
        <div className="newsletter-banner-box">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">BUILT FOR DEVELOPERS. BACKED BY CONSISTENCY.</span>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-tight">
              Ship more. Stress less. <br /> Stay consistent.
            </h3>
            <p className="text-xs text-slate-400 max-w-[480px] leading-relaxed">
              Join thousands of developers who use Dev Growth OS to plan better, track smarter, and ship consistently.
            </p>

            {/* Overlapping developer Avatars */}
            <div className="flex items-center gap-3 mt-4 pt-2">
              <div className="avatar-group">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80" alt="Dev 1" className="avatar-overlap" />
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80" alt="Dev 2" className="avatar-overlap" />
                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80" alt="Dev 3" className="avatar-overlap" />
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80" alt="Dev 4" className="avatar-overlap" />
                <img src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=100&h=100&q=80" alt="Dev 5" className="avatar-overlap" />
              </div>
              <div>
                <div className="flex items-center gap-0.5 text-yellow-400">
                  <Star className="h-3.5 w-3.5 fill-yellow-400" />
                  <Star className="h-3.5 w-3.5 fill-yellow-400" />
                  <Star className="h-3.5 w-3.5 fill-yellow-400" />
                  <Star className="h-3.5 w-3.5 fill-yellow-400" />
                  <Star className="h-3.5 w-3.5 fill-yellow-400" />
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider block mt-0.5">Trusted by 1,000+ developers</span>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4 w-full">
            <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Get early access to new features and updates.</h4>

            {newsletterSuccess ? (
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-white font-mono flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>Welcome to the developer circle! Updates are on the way. ⚡</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="newsletter-input-group">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                />
                <button type="submit">
                  <span>Get Updates</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            )}

            <div className="flex items-center gap-6 mt-1 text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-slate-300" /> No spam ever</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-slate-300" /> Unsubscribe anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Minimal Footer */}
      <footer className="footer-container">
        <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-6 border-b border-[#151515] pb-8">
          {/* Left Side: Brand */}
          <div className="flex items-center gap-3">
            <div className="footer-brand-logo-box">
              <CalendarIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h4 className="footer-brand-name">DEV GROWTH</h4>
              <p className="text-[8px] text-slate-400 font-mono uppercase tracking-widest mt-0.5 font-bold">PRODUCTIVITY OS</p>
            </div>
          </div>

          {/* Middle: Genuine Description */}
          <p className="text-xs text-slate-500 text-center md:text-left max-w-md">
            The minimalist, local-first sandboxed productivity OS designed exclusively for high-performing developers to sustain absolute consistency.
          </p>

          {/* Right Side: Simple Links */}
          <div className="flex items-center gap-6 text-xs text-slate-400 font-mono">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="nav-link-static">GitHub</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="nav-link-static">Twitter</a>
          </div>
        </div>

        {/* Bottom Rights Row */}
        <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-[11px] text-slate-500 font-mono">
          <span>&copy; 2026 Dev Growth OS. All rights reserved.</span>
          <span>Made with focus &bull; Built for developers</span>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════════════
          PREMIUM MULTI-METHOD AUTH MODAL
          ═══════════════════════════════════════════════════════════════ */}
      <div className={`auth-modal-backdrop ${showAuthModal ? 'active' : ''}`}>
        <div className="auth-card flex flex-col gap-4 relative" style={{ maxWidth: '460px' }}>

          {/* Close button */}
          <button
            onClick={resetAndClose}
            className="absolute top-4 right-4 text-slate-550 hover:text-slate-350 transition cursor-pointer bg-transparent border-0 outline-none"
            disabled={!!loadingState}
          >
            <X className="h-4 w-4" />
          </button>

          {/* Modal Header */}
          <div>
            <h3 className="text-lg font-bold text-white leading-tight font-sans">
              {authMode === 'register' ? 'Create Developer Account' : authMode === 'reset-password' ? 'Reset Passcode' : 'Welcome Back, Dev'}
            </h3>
            <p className="text-[11px] text-muted font-sans mt-0.5">
              {authMode === 'register'
                ? 'Initialize your personal productivity workspace.'
                : authMode === 'reset-password' 
                  ? 'We will send a recovery link to your inbox.' 
                  : 'Sign in to your sandboxed calendar OS.'}
            </p>
          </div>

          {/* ── Social OAuth ── */}
          <div className="mt-3.5">
            <button
              className="social-btn w-full flex items-center justify-center gap-2.5 py-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleSocialLogin('google')}
              disabled={!!loadingState}
              title="Continue with Google"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-[12px] font-sans font-medium text-[#e3e3e3] tracking-wide">Continue with Google</span>
            </button>
          </div>

          {/* ── Divider ── */}
          <div className="divider-container">or continue with</div>

          {/* ── Auth Method Tabs ── */}
          <div className="auth-tabs-header">
            {authTabs.map(tab => (
              <button
                key={tab.key}
                className={`auth-tab-btn flex items-center gap-1.5 bg-transparent border-0 outline-none ${authMethod === tab.key ? 'active' : ''}`}
                onClick={() => switchAuthMethod(tab.key)}
                disabled={!!loadingState}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Error / Success Messages ── */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-2 font-mono">
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-[#529cca] flex items-center gap-2 font-mono">
              <Check className="h-4 w-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ═══════════════════════════════════════════
              METHOD 1: Email + Password
              ═══════════════════════════════════════════ */}
          {authMethod === 'password' && (
            <form onSubmit={handlePasswordAuth} className="flex flex-col gap-4">

              {/* Developer Name (register only) */}
              {authMode === 'register' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wide">Developer Name</label>
                  <div className="relative flex items-center">
                    <User className="h-4 w-4 input-icon" />
                    <input
                      type="text"
                      placeholder="Alex Mercer"
                      className="landing-input pl-10"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!!loadingState}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wide">Developer Email</label>
                <div className="relative flex items-center">
                  <Mail className="h-4 w-4 input-icon" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    className="landing-input pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!!loadingState}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              {authMode !== 'reset-password' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wide">Access Passcode</label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          resetFormState();
                          setAuthMode('reset-password');
                        }}
                        className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 bg-transparent border-0 outline-none cursor-pointer"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="h-4 w-4 input-icon" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="landing-input pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={!!loadingState}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-green w-full py-2.5 rounded-md font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 mt-1 transition cursor-pointer border-0"
                disabled={!!loadingState}
              >
                {loadingState ? (
                  <span className="animate-pulse">{loadingState}</span>
                ) : (
                  <>
                    <span>{authMode === 'register' ? 'Create Account' : authMode === 'reset-password' ? 'Send Reset Link' : 'Sign In'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ═══════════════════════════════════════════
              METHOD 2: Magic Link (Email OTP)
              ═══════════════════════════════════════════ */}
          {authMethod === 'magic-link' && (
            <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
              {!magicLinkSent ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wide">Developer Email</label>
                    <div className="relative flex items-center">
                      <Mail className="h-4 w-4 input-icon" />
                      <input
                        type="email"
                        placeholder="name@company.com"
                        className="landing-input pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={!!loadingState}
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      We'll send a passwordless sign-in link to your inbox.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!!loadingState}
                    className="btn btn-green w-full py-2.5 rounded-md font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 mt-1 transition cursor-pointer border-0"
                  >
                    {loadingState ? (
                      <span className="animate-pulse">{loadingState}</span>
                    ) : (
                      <>
                        <span>Send Magic Link</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-slate-900/60 border border-slate-800 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-sm text-slate-300 font-medium">Check your inbox</p>
                  <p className="text-[11px] text-slate-500 font-mono max-w-[280px]">
                    A magic link has been sent to <span className="text-white font-bold">{email}</span>. Click it to sign in instantly.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setMagicLinkSent(false); setSuccessMsg(null); }}
                    className="text-xs text-slate-400 hover:text-white hover:underline font-mono mt-2 bg-transparent border-0 outline-none cursor-pointer transition"
                  >
                    ← Try a different email
                  </button>
                </div>
              )}
            </form>
          )}


          {/* ── Toggle register / login ── */}
          <div className="auth-toggle-container">
            {authMode === 'register' ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    switchAuthMode('login');
                  }}
                  className="auth-toggle-btn"
                  disabled={!!loadingState}
                >
                  Log In
                </button>
              </span>
            ) : (
              <span>
                New to Dev Growth?{' '}
                <button
                  type="button"
                  onClick={() => {
                    switchAuthMode('register');
                  }}
                  className="auth-toggle-btn"
                  disabled={!!loadingState}
                >
                  Register / Sign Up
                </button>
                {authMode === 'reset-password' && (
                  <>
                    {' | '}
                    <button
                      type="button"
                      onClick={() => {
                        switchAuthMode('login');
                      }}
                      className="auth-toggle-btn"
                      disabled={!!loadingState}
                    >
                      Back to Login
                    </button>
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
