import React, { useState } from 'react';
import { useGrowthStore } from '../../store/useGrowthStore';
import { 
  User, Sparkles, Phone, Globe, ArrowRight, ArrowLeft, Check, 
  Terminal, ShieldAlert, Cpu, Zap,
  Code2, Server, Layers, Brain, GraduationCap, Blocks, Cloud, Smartphone,
  Camera, Target, Rocket, BookOpen, GitBranch, Award, Flame, Upload
} from 'lucide-react';

const PRESET_AVATARS = [
  { id: 'cat', name: 'Cyber Cat', emoji: '🐱', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&h=150&q=80' },
  { id: 'ninja', name: 'Code Ninja', emoji: '💻', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80' },
  { id: 'hacker', name: 'Cyber Hacker', emoji: '🤖', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80' },
  { id: 'synth', name: 'Synthwave AI', emoji: '⚡', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=150&h=150&q=80' },
  { id: 'voyager', name: 'Void Voyager', emoji: '🌌', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=150&h=150&q=80' }
];

const ROLE_ICONS: Record<string, React.ReactNode> = {
  'Frontend Developer': <Code2 className="h-4 w-4" />,
  'Backend Developer': <Server className="h-4 w-4" />,
  'Fullstack Engineer': <Layers className="h-4 w-4" />,
  'AI / ML Specialist': <Brain className="h-4 w-4" />,
  'CS / Engineering Student': <GraduationCap className="h-4 w-4" />,
  'Web3 / Smart Contract Builder': <Blocks className="h-4 w-4" />,
  'DevOps / Systems Engineer': <Cloud className="h-4 w-4" />,
  'Mobile App Developer': <Smartphone className="h-4 w-4" />,
};

const GOAL_META: Record<string, { icon: React.ReactNode; color: string }> = {
  'Build Side Projects Consistently': { icon: <Rocket className="h-3.5 w-3.5" />, color: '#3b82f6' },
  'Master Data Structures & Algorithms': { icon: <BookOpen className="h-3.5 w-3.5" />, color: '#8b5cf6' },
  'Prepare for Technical Interviews': { icon: <Award className="h-3.5 w-3.5" />, color: '#f59e0b' },
  'Contribute to Open Source Software': { icon: <GitBranch className="h-3.5 w-3.5" />, color: '#10b981' },
  'Learn System Architecture & Cloud Systems': { icon: <Cloud className="h-3.5 w-3.5" />, color: '#06b6d4' },
  'Form Healthy Coding Habits': { icon: <Flame className="h-3.5 w-3.5" />, color: '#ef4444' },
};

const ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Fullstack Engineer',
  'AI / ML Specialist',
  'CS / Engineering Student',
  'Web3 / Smart Contract Builder',
  'DevOps / Systems Engineer',
  'Mobile App Developer'
];

const GOALS = [
  'Build Side Projects Consistently',
  'Master Data Structures & Algorithms',
  'Prepare for Technical Interviews',
  'Contribute to Open Source Software',
  'Learn System Architecture & Cloud Systems',
  'Form Healthy Coding Habits'
];

// Helper: get tier label and color from hours
const getHoursTier = (hours: number) => {
  if (hours <= 2) return { label: 'Casual', color: '#3b82f6', tier: 1 };
  if (hours <= 4) return { label: 'Focused', color: '#8b5cf6', tier: 2 };
  if (hours <= 6) return { label: 'Dedicated', color: '#f59e0b', tier: 3 };
  if (hours <= 8) return { label: 'Intense', color: '#ef4444', tier: 4 };
  return { label: 'Elite', color: '#ec4899', tier: 5 };
};

export const OnboardingWizard: React.FC = () => {
  const { profile, updateProfile } = useGrowthStore();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields State
  const [displayName, setDisplayName] = useState<string>(profile?.name || '');
  const [selectedRole, setSelectedRole] = useState<string>(ROLES[0]);
  const [selectedGoal, setSelectedGoal] = useState<string>(GOALS[0]);
  const [dailyTargetHours, setDailyTargetHours] = useState<number>(2);
  const [location, setLocation] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>(PRESET_AVATARS[0].url);
  const [customAvatarUploaded, setCustomAvatarUploaded] = useState<boolean>(false);

  // Handle custom image file upload converting to Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image size must be smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        setCustomAvatarUploaded(true);
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNextStep = () => {
    if (step === 1 && !displayName.trim()) {
      setErrorMsg('Please specify a developer identity name.');
      return;
    }
    setErrorMsg(null);
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setStep(prev => prev - 1);
  };

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg('Please specify a developer identity name.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await updateProfile({
        name: displayName.trim(),
        role: selectedRole,
        productivity_goal: selectedGoal,
        daily_target_hours: dailyTargetHours,
        location: location.trim() || undefined,
        phone: phone.trim() || undefined,
        avatar_url: avatarUrl,
        onboarding_completed: true
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to synchronize onboarding information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hoursTier = getHoursTier(dailyTargetHours);
  const sliderPercent = ((dailyTargetHours - 1) / 11) * 100;

  // Step labels for the indicator
  const stepLabels = ['Identity', 'Focus', 'Avatar'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto selection:bg-white/10 selection:text-white onboarding-overlay">
      {/* Animated background particles / grid */}
      <div className="onboarding-bg-grid" />
      <div className="onboarding-bg-glow" />

      {/* Main glassmorphic onboarding card */}
      <div className="onboarding-card w-full max-w-lg relative flex flex-col">
        
        {/* Premium gradient border glow (decorative pseudo via CSS) */}

        {/* ─── Step Indicator ─── */}
        <div className="onboarding-step-indicator">
          {[1, 2, 3].map((dotIndex) => (
            <React.Fragment key={dotIndex}>
              {/* Connector line (before dots 2 and 3) */}
              {dotIndex > 1 && (
                <div className="onboarding-step-connector">
                  <div 
                    className="onboarding-step-connector-fill"
                    style={{ width: step >= dotIndex ? '100%' : '0%' }}
                  />
                </div>
              )}
              {/* Dot */}
              <button
                type="button"
                className={`onboarding-step-dot ${
                  step === dotIndex ? 'active' : step > dotIndex ? 'completed' : 'pending'
                }`}
                onClick={() => {
                  // Only allow going back or to current step
                  if (dotIndex < step) {
                    setErrorMsg(null);
                    setStep(dotIndex);
                  }
                }}
              >
                {step > dotIndex ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  <span>{dotIndex}</span>
                )}
              </button>
            </React.Fragment>
          ))}
        </div>
        {/* Step labels */}
        <div className="onboarding-step-labels">
          {stepLabels.map((label, i) => (
            <span
              key={label}
              className={`onboarding-step-label ${step === i + 1 ? 'active' : step > i + 1 ? 'completed' : ''}`}
            >
              {label}
            </span>
          ))}
        </div>

        {errorMsg && (
          <div className="onboarding-error">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* STEP 1: DEVELOPER IDENTITY                */}
        {/* ═══════════════════════════════════════════ */}
        {step === 1 && (
          <div className="onboarding-step-content">
            {/* Header with gradient glow */}
            <div className="onboarding-section-header">
              <div className="onboarding-header-icon-wrap blue">
                <Terminal className="h-5 w-5" />
              </div>
              <div>
                <h2 className="onboarding-title">Initialize Developer Identity</h2>
                <p className="onboarding-subtitle">
                  Set your coding name and professional focus area to personalize your workspace.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4" style={{ marginTop: '20px' }}>
              {/* Developer Name with terminal cursor */}
              <div className="flex flex-col gap-1.5">
                <label className="onboarding-label">
                  <span className="onboarding-label-dot" style={{ background: '#3b82f6' }} />
                  Developer Name
                </label>
                <div className="onboarding-input-wrap">
                  <User className="h-4 w-4 onboarding-input-icon" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    className="onboarding-input"
                    required
                  />
                  <span className="onboarding-cursor-blink" />
                </div>
              </div>

              {/* Developer Focus Role */}
              <div className="flex flex-col gap-1.5">
                <label className="onboarding-label">
                  <span className="onboarding-label-dot" style={{ background: '#8b5cf6' }} />
                  Developer Persona / Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((role) => {
                    const isSelected = selectedRole === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={`onboarding-role-card ${isSelected ? 'selected' : ''}`}
                      >
                        <div className="onboarding-role-icon-wrap" style={isSelected ? { color: '#3b82f6' } : {}}>
                          {ROLE_ICONS[role]}
                        </div>
                        <span className="onboarding-role-label">{role}</span>
                        {isSelected && (
                          <div className="onboarding-role-check">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={handleNextStep}
              className="onboarding-btn-primary"
              style={{ marginTop: '20px' }}
            >
              <span>Continue Setup</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* STEP 2: PRODUCTIVITY PROFILE              */}
        {/* ═══════════════════════════════════════════ */}
        {step === 2 && (
          <div className="onboarding-step-content">
            <div className="onboarding-section-header">
              <div className="onboarding-header-icon-wrap purple">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h2 className="onboarding-title">Configure Focus Profiles</h2>
                <p className="onboarding-subtitle">
                  Establish your daily targets and learning parameters.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4" style={{ marginTop: '20px' }}>
              {/* Daily Target Coding Hours */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="onboarding-label" style={{ marginBottom: 0 }}>
                    <span className="onboarding-label-dot" style={{ background: hoursTier.color }} />
                    Daily Study / Coding Target
                  </label>
                  <div className="onboarding-hours-badge" style={{ 
                    background: `${hoursTier.color}15`,
                    borderColor: `${hoursTier.color}40`,
                    color: hoursTier.color
                  }}>
                    <Target className="h-3 w-3" />
                    <span>{dailyTargetHours}h / day</span>
                  </div>
                </div>

                {/* Animated ring gauge */}
                <div className="onboarding-gauge-row">
                  <div className="onboarding-gauge-ring">
                    <svg viewBox="0 0 60 60" className="onboarding-gauge-svg">
                      <circle cx="30" cy="30" r="25" className="onboarding-gauge-track" />
                      <circle 
                        cx="30" cy="30" r="25" 
                        className="onboarding-gauge-fill"
                        style={{ 
                          strokeDasharray: `${(dailyTargetHours / 12) * 157} 157`,
                          stroke: hoursTier.color
                        }}
                      />
                    </svg>
                    <span className="onboarding-gauge-value" style={{ color: hoursTier.color }}>
                      {dailyTargetHours}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    {/* Premium Range Slider */}
                    <div className="onboarding-slider-wrap">
                      <input
                        type="range"
                        min="1"
                        max="12"
                        step="1"
                        value={dailyTargetHours}
                        onChange={(e) => setDailyTargetHours(Number(e.target.value))}
                        className="onboarding-range-slider"
                        style={{
                          '--slider-percent': `${sliderPercent}%`,
                          '--slider-color': hoursTier.color,
                        } as React.CSSProperties}
                      />
                    </div>
                    {/* Tier zones */}
                    <div className="onboarding-tier-zones">
                      {['Casual', 'Focused', 'Dedicated', 'Intense', 'Elite'].map((tier, i) => {
                        const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];
                        const isActive = hoursTier.label === tier;
                        return (
                          <div
                            key={tier}
                            className={`onboarding-tier-zone ${isActive ? 'active' : ''}`}
                            style={{ 
                              '--zone-color': colors[i],
                              background: isActive ? `${colors[i]}20` : undefined,
                              borderColor: isActive ? `${colors[i]}50` : undefined,
                              color: isActive ? colors[i] : undefined,
                            } as React.CSSProperties}
                          >
                            {tier}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Coding Goal */}
              <div className="flex flex-col gap-1.5" style={{ marginTop: '4px' }}>
                <label className="onboarding-label">
                  <span className="onboarding-label-dot" style={{ background: '#8b5cf6' }} />
                  Primary Study Focus Objective
                </label>
                <div className="flex flex-col gap-1.5">
                  {GOALS.map((goal) => {
                    const isSelected = selectedGoal === goal;
                    const meta = GOAL_META[goal];
                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => setSelectedGoal(goal)}
                        className={`onboarding-goal-card ${isSelected ? 'selected' : ''}`}
                        style={isSelected ? { 
                          borderColor: `${meta.color}40`,
                          background: `${meta.color}08`,
                        } : {}}
                      >
                        <div className="onboarding-goal-icon" style={{ color: isSelected ? meta.color : undefined }}>
                          {meta.icon}
                        </div>
                        <span className="flex-1">{goal}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[2.5]" style={{ color: meta.color }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Nav Row */}
            <div className="grid grid-cols-3 gap-3" style={{ marginTop: '20px' }}>
              <button
                onClick={handlePrevStep}
                className="onboarding-btn-back"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                onClick={handleNextStep}
                className="onboarding-btn-primary"
                style={{ gridColumn: 'span 2' }}
              >
                <span>Continue Setup</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* STEP 3: CONTACT & VISUAL PROFILE          */}
        {/* ═══════════════════════════════════════════ */}
        {step === 3 && (
          <form onSubmit={handleCompleteSetup} className="onboarding-step-content">
            <div className="onboarding-section-header">
              <div className="onboarding-header-icon-wrap green">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="onboarding-title">Customize Developer Avatar</h2>
                <p className="onboarding-subtitle">
                  Select your developer archetype avatar and add contact details.
                </p>
              </div>
            </div>

            <div className="flex flex-col" style={{ marginTop: '20px', gap: '20px' }}>
              
              {/* Avatar Preset Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="onboarding-label">
                  <span className="onboarding-label-dot" style={{ background: '#10b981' }} />
                  Select Visual Avatar
                </label>
                <div className="onboarding-avatar-grid">
                  {PRESET_AVATARS.map((preset) => {
                    const isSelected = avatarUrl === preset.url && !customAvatarUploaded;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setAvatarUrl(preset.url);
                          setCustomAvatarUploaded(false);
                        }}
                        className={`onboarding-avatar-btn ${isSelected ? 'selected' : ''}`}
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="onboarding-avatar-img" />
                        {isSelected && (
                          <div className="onboarding-avatar-overlay">
                            <Check className="h-4 w-4" strokeWidth={3} />
                          </div>
                        )}
                        <span className="onboarding-avatar-name">{preset.emoji} {preset.name}</span>
                      </button>
                    );
                  })}
                  
                  {/* Upload Button */}
                  <label 
                    className={`onboarding-avatar-btn upload ${customAvatarUploaded ? 'selected' : ''}`}
                    title="Upload Custom Image"
                  >
                    {customAvatarUploaded ? (
                      <>
                        <img src={avatarUrl} alt="Custom" className="onboarding-avatar-img" />
                        <div className="onboarding-avatar-overlay">
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </div>
                      </>
                    ) : (
                      <div className="onboarding-upload-placeholder">
                        <Camera className="h-5 w-5" />
                        <Upload className="h-3 w-3" style={{ marginTop: '2px' }}/>
                      </div>
                    )}
                    <span className="onboarding-avatar-name">
                      {customAvatarUploaded ? '✨ Custom' : 'Upload'}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload} 
                    />
                  </label>
                </div>
              </div>

              {/* Divider */}
              <div className="onboarding-divider">
                <span>Contact Details</span>
              </div>

              {/* Location/Country */}
              <div className="flex flex-col gap-1.5">
                <label className="onboarding-label">
                  <span className="onboarding-label-dot" style={{ background: '#06b6d4' }} />
                  Location / Country
                </label>
                <div className="onboarding-input-wrap">
                  <Globe className="h-4 w-4 onboarding-input-icon" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. United States, India, Germany"
                    className="onboarding-input"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="flex flex-col gap-1.5">
                <label className="onboarding-label">
                  <span className="onboarding-label-dot" style={{ background: '#f59e0b' }} />
                  Phone Number
                </label>
                <div className="onboarding-input-wrap">
                  <Phone className="h-4 w-4 onboarding-input-icon" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 019-2834"
                    className="onboarding-input"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
              </div>

            </div>

            {/* Nav Row */}
            <div className="grid grid-cols-3 gap-3" style={{ marginTop: '20px' }}>
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={loading}
                className="onboarding-btn-back"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="onboarding-btn-launch"
                style={{ gridColumn: 'span 2' }}
              >
                {loading ? (
                  <span className="animate-pulse">Compiling Workspace...</span>
                ) : (
                  <>
                    <span>Initialize Workspace</span>
                    <Zap className="h-4 w-4" style={{ color: '#facc15', fill: 'rgba(250, 204, 21, 0.2)' }} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
