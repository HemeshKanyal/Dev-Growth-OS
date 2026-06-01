import React, { useRef, useEffect, useState } from 'react';
import { useGrowthStore } from '../../store/useGrowthStore';
import { supabase } from '../../utils/supabaseClient';
import { 
  X, User, Phone, Globe, Shield, Key, Check, AlertTriangle, 
  Eye, EyeOff, Save, ChevronDown, UploadCloud
} from 'lucide-react';

interface ProfileModalProps {
  onClose: () => void;
}

const PRESET_AVATARS = [
  { id: 'cat', name: 'Cyber Cat', emoji: '🐱', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&h=150&q=80' },
  { id: 'ninja', name: 'Code Ninja', emoji: '💻', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80' },
  { id: 'hacker', name: 'Cyber Hacker', emoji: '🤖', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80' },
  { id: 'synth', name: 'Synthwave AI', emoji: '⚡', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=150&h=150&q=80' },
  { id: 'voyager', name: 'Void Voyager', emoji: '🌌', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=150&h=150&q=80' }
];

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

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { profile, updateProfile } = useGrowthStore();

  const [activeTab, setActiveTab] = useState<'details' | 'security'>('details');

  // Details States
  const [displayName, setDisplayName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [role, setRole] = useState(profile?.role || ROLES[0]);
  const [goal, setGoal] = useState(profile?.productivity_goal || GOALS[0]);
  const [targetHours, setTargetHours] = useState(profile?.daily_target_hours || 2);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || PRESET_AVATARS[0].url);
  const [customAvatarUploaded, setCustomAvatarUploaded] = useState(false);

  // Security States (Password updates)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status handlers
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Open native modal on mount
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  // Click outside and Esc handling
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      dialog.close();
    };

    const handleClose = () => {
      onClose();
    };

    const handleBackdropClick = (e: MouseEvent) => {
      if (e.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        const isInside = (
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width
        );
        if (!isInside) {
          dialog.close();
        }
      }
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('click', handleBackdropClick);

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('click', handleBackdropClick);
    };
  }, [onClose]);

  const handleCloseClick = () => {
    dialogRef.current?.close();
  };

  // Convert custom image to Base64
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

  // Save profile details
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg('Profile name cannot be blank.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await updateProfile({
        name: displayName.trim(),
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        role,
        productivity_goal: goal,
        daily_target_hours: targetHours,
        avatar_url: avatarUrl
      });
      setSuccessMsg('Profile settings successfully updated and synchronized!');
    } catch (err: any) {
      setErrorMsg('Failed to update details. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  // Save secure credential changes
  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newPassword) {
      setErrorMsg('Please specify a new password to update.');
      return;
    }

    setLoading(true);

    try {
      if (newPassword) {
        if (newPassword.length < 6) {
          setErrorMsg('Passcode must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setErrorMsg('Passcodes do not match.');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setSuccessMsg('Account security password updated successfully.');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Credential modification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog 
      ref={dialogRef} 
      className="settings-dialog-card text-left p-0 border overflow-hidden flex flex-col max-h-[85vh] h-full"
    >
      <style>{`
        /* Scoped premium custom rules for the improved UI settings modal */
        .settings-dialog-card {
          border-radius: 20px !important;
          border: 1px solid #1f2025 !important;
          background: #0f1013 !important;
          box-shadow: 0 30px 70px rgba(0,0,0,0.85) !important;
          font-family: 'Inter', sans-serif !important;
          max-width: 820px !important;
          width: 95% !important;
          overflow: hidden !important;
        }

        .settings-header-bar {
          background: rgba(13, 14, 17, 0.95) !important;
          backdrop-filter: blur(12px) !important;
          border-bottom: 1px solid #1a1c22 !important;
          padding: 20px 24px !important;
        }

        .settings-nav-sidebar {
          background: #08090b !important;
          border-right: 1px solid #15161b !important;
          padding: 24px 16px !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 8px !important;
        }

        .settings-nav-tab {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          width: 100% !important;
          padding: 12px 16px !important;
          border-radius: 12px !important;
          color: #7a808e !important;
          font-family: 'Outfit', sans-serif !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          transition: all 0.25s ease !important;
          background: transparent !important;
          border: 1px solid transparent !important;
          cursor: pointer !important;
          text-align: left !important;
        }

        .settings-nav-tab:hover {
          color: #f1f5f9 !important;
          background: rgba(255, 255, 255, 0.02) !important;
        }

        .settings-nav-tab.active {
          color: #ffffff !important;
          background: rgba(89, 188, 114, 0.08) !important;
          border-color: rgba(89, 188, 114, 0.15) !important;
          box-shadow: 0 4px 12px rgba(89, 188, 114, 0.05) !important;
        }

        .settings-card-group {
          background: #121316 !important;
          border: 1px solid #1a1c22 !important;
          border-radius: 16px !important;
          padding: 24px !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 20px !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
        }

        .settings-group-header {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          font-family: 'Outfit', sans-serif !important;
          font-weight: 700 !important;
          font-size: 11px !important;
          letter-spacing: 0.08em !important;
          text-transform: uppercase !important;
          padding-bottom: 8px !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04) !important;
        }

        .settings-input-container {
          display: flex !important;
          flex-direction: column !important;
          gap: 8px !important;
        }

        .settings-input-label {
          font-family: 'JetBrains Mono', monospace !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          letter-spacing: 0.06em !important;
          text-transform: uppercase !important;
          color: #5d6370 !important;
        }

        .settings-input-wrapper {
          position: relative !important;
          display: flex !important;
          align-items: center !important;
        }

        .settings-textbox {
          width: 100% !important;
          background: #08090b !important;
          border: 1px solid #1f2025 !important;
          border-radius: 12px !important;
          padding: 12px 16px !important;
          color: #f1f5f9 !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          transition: all 0.2s ease !important;
          outline: none !important;
          font-family: 'Inter', sans-serif !important;
        }

        .settings-textbox:hover {
          border-color: #2e313c !important;
        }

        .settings-textbox:focus {
          border-color: #59bc72 !important; 
          background: #040506 !important;
          box-shadow: 0 0 0 3px rgba(89, 188, 114, 0.1) !important;
        }

        .settings-textbox-iconic {
          padding-left: 44px !important;
        }

        .settings-textbox-arrowed {
          padding-right: 44px !important;
          appearance: none !important;
          cursor: pointer !important;
        }

        .settings-field-icon {
          position: absolute !important;
          left: 16px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          color: #4b5263 !important;
          pointer-events: none !important;
          transition: color 0.2s ease !important;
        }

        .settings-textbox:focus + .settings-field-icon {
          color: #59bc72 !important;
        }

        .settings-dropdown-arrow {
          position: absolute !important;
          right: 16px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          color: #4b5263 !important;
          pointer-events: none !important;
        }

        .avatar-grid-wrapper {
          background: #08090b !important;
          border: 1px solid #1f2025 !important;
          border-radius: 16px !important;
          padding: 16px !important;
          display: flex !important;
          align-items: center !important;
          flex-wrap: wrap !important;
          gap: 12px !important;
        }

        .avatar-preset-button {
          position: relative !important;
          height: 52px !important;
          width: 52px !important;
          border-radius: 14px !important;
          overflow: hidden !important;
          border: 2px solid transparent !important;
          background: transparent !important;
          padding: 0 !important;
          cursor: pointer !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          outline: none !important;
        }

        .avatar-preset-button:hover {
          transform: translateY(-3px) scale(1.05) !important;
        }

        .avatar-preset-button.active {
          border-color: #59bc72 !important;
          box-shadow: 0 8px 20px rgba(89, 188, 114, 0.25) !important;
          transform: translateY(-3px) scale(1.05) !important;
        }

        .avatar-custom-uploader {
          position: relative !important;
          height: 52px !important;
          width: 52px !important;
          border-radius: 14px !important;
          border: 2px dashed #20242f !important;
          background: transparent !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          color: #4b5263 !important;
        }

        .avatar-custom-uploader:hover {
          border-color: #4b5263 !important;
          border-style: solid !important;
          color: #8c95a5 !important;
          transform: translateY(-3px) scale(1.05) !important;
        }

        .avatar-custom-uploader.active {
          border-color: #59bc72 !important;
          border-style: solid !important;
          box-shadow: 0 8px 20px rgba(89, 188, 114, 0.25) !important;
          transform: translateY(-3px) scale(1.05) !important;
        }

        .settings-glowing-save {
          width: 100% !important;
          padding: 15px !important;
          border-radius: 14px !important;
          background: #ffffff !important;
          color: #0b0b0b !important;
          font-family: 'JetBrains Mono', monospace !important;
          font-weight: 750 !important;
          font-size: 11px !important;
          letter-spacing: 0.08em !important;
          text-transform: uppercase !important;
          border: none !important;
          cursor: pointer !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 0 4px 15px rgba(255, 255, 255, 0.08) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
        }

        .settings-glowing-save:hover {
          background: #f1f5f9 !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 25px rgba(255, 255, 255, 0.18) !important;
        }

        .settings-glowing-save:active {
          transform: translateY(0) !important;
        }

        .settings-glowing-save:disabled {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
          transform: none !important;
          box-shadow: none !important;
        }
      `}</style>

      {/* Modal Header */}
      <div className="settings-header-bar flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img src={avatarUrl} alt="Avatar" className="h-9 w-9 rounded-xl object-cover border border-slate-800" />
          <div>
            <span className="text-[10px] text-blue-400 font-mono tracking-wider uppercase font-semibold">Workspace Settings</span>
            <h3 className="text-base font-bold text-slate-100 font-sans mt-0.5">{profile?.email}</h3>
          </div>
        </div>
        
        <button 
          onClick={handleCloseClick}
          className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex-center hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Modal Body with Left Tabs and Right forms */}
      <div className="flex-1 overflow-y-auto flex flex-col md:flex-row h-full">
        {/* Navigation Sidebar */}
        <div className="settings-nav-sidebar md:w-56 flex md:flex-col gap-1 p-3 sticky top-0 z-10 backdrop-blur-md">
          <button
            onClick={() => { setActiveTab('details'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`settings-nav-tab ${activeTab === 'details' ? 'active' : ''}`}
          >
            <User className="h-4 w-4" />
            Profile Details
          </button>
          <button
            onClick={() => { setActiveTab('security'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`settings-nav-tab ${activeTab === 'security' ? 'active' : ''}`}
          >
            <Shield className="h-4 w-4" />
            Security & Login
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 p-6 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-2 font-mono mb-4">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 flex items-center gap-2 font-mono mb-4">
              <Check className="h-4 w-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* PROFILE DETAILS TAB */}
          {activeTab === 'details' && (
            <form onSubmit={handleSaveDetails} className="flex flex-col gap-6">
              
              {/* Card 1: Avatar Archetype */}
              <div className="settings-card-group">
                <div className="settings-group-header text-blue-400">
                  <User className="h-4 w-4" />
                  <span>Visual Avatar Archetype</span>
                </div>
                
                <div className="avatar-grid-wrapper">
                  {PRESET_AVATARS.map((preset) => {
                    const isSelected = avatarUrl === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setAvatarUrl(preset.url);
                          setCustomAvatarUploaded(false);
                        }}
                        className={`avatar-preset-button ${isSelected ? 'active' : ''}`}
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="h-full w-full object-cover" />
                      </button>
                    );
                  })}
                  
                  {/* File Upload Selector */}
                  <label 
                    className={`avatar-custom-uploader ${customAvatarUploaded ? 'active' : ''}`}
                    title="Upload Custom Image"
                  >
                    {customAvatarUploaded ? (
                      <img src={avatarUrl} alt="Custom" className="h-full w-full object-cover" />
                    ) : (
                      <UploadCloud className="h-5 w-5" />
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload} 
                    />
                  </label>
                </div>
              </div>

              {/* Card 2: Personal details */}
              <div className="settings-card-group">
                <div className="settings-group-header text-blue-400">
                  <User className="h-4 w-4" />
                  <span>Identity & Persona</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Developer Name */}
                  <div className="settings-input-container">
                    <label className="settings-input-label">Developer Name</label>
                    <div className="settings-input-wrapper">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="settings-textbox settings-textbox-iconic"
                        required
                      />
                      <User className="settings-field-icon h-4 w-4" />
                    </div>
                  </div>

                  {/* Professional Role */}
                  <div className="settings-input-container">
                    <label className="settings-input-label">Professional Role</label>
                    <div className="settings-input-wrapper">
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="settings-textbox settings-textbox-iconic settings-textbox-arrowed"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <User className="settings-field-icon h-4 w-4" />
                      <ChevronDown className="settings-dropdown-arrow h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Goals and hours */}
              <div className="settings-card-group">
                <div className="settings-group-header text-orange-400">
                  <Save className="h-4 w-4" />
                  <span>Habits & Metrics</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="settings-input-container sm:col-span-2">
                    <label className="settings-input-label">Primary Habit Goal</label>
                    <div className="settings-input-wrapper">
                      <select
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="settings-textbox settings-textbox-iconic settings-textbox-arrowed"
                      >
                        {GOALS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <Save className="settings-field-icon h-4 w-4" />
                      <ChevronDown className="settings-dropdown-arrow h-4 w-4" />
                    </div>
                  </div>
                  
                  <div className="settings-input-container">
                    <label className="settings-input-label">Daily Focus Target</label>
                    <div className="settings-input-wrapper">
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={targetHours}
                        onChange={(e) => setTargetHours(Number(e.target.value))}
                        className="settings-textbox settings-textbox-iconic"
                      />
                      <Save className="settings-field-icon h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Contact details */}
              <div className="settings-card-group">
                <div className="settings-group-header text-blue-400">
                  <Globe className="h-4 w-4" />
                  <span>Contact & Location</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone Number */}
                  <div className="settings-input-container">
                    <label className="settings-input-label">Phone Number</label>
                    <div className="settings-input-wrapper">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="settings-textbox settings-textbox-iconic"
                      />
                      <Phone className="settings-field-icon h-4 w-4" />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="settings-input-container">
                    <label className="settings-input-label">Location / Country</label>
                    <div className="settings-input-wrapper">
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. United States"
                        className="settings-textbox settings-textbox-iconic"
                      />
                      <Globe className="settings-field-icon h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={loading}
                className="settings-glowing-save"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Saving Changes...' : 'Save Profile Details'}
              </button>

            </form>
          )}

          {/* SECURITY & CREDENTIALS TAB */}
          {activeTab === 'security' && (
            <div className="flex flex-col gap-6">
              
              {/* Password Update card */}
              <form onSubmit={handleUpdateCredentials} className="settings-card-group">
                <div className="settings-group-header text-purple-400">
                  <Key className="h-4 w-4" />
                  <span>Modify Access Passcode</span>
                </div>
                
                <p className="text-xs text-slate-400 leading-relaxed">
                  Update your authentication passcode. Passcodes must be at least 6 characters.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="settings-input-container">
                    <label className="settings-input-label">New Passcode</label>
                    <div className="settings-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="settings-textbox settings-textbox-iconic"
                      />
                      <Key className="settings-field-icon h-4 w-4" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-slate-500 hover:text-slate-350 bg-transparent border-0 outline-none cursor-pointer"
                        style={{ background: 'transparent', border: 'none' }}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="settings-input-container">
                    <label className="settings-input-label">Confirm Passcode</label>
                    <div className="settings-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="settings-textbox settings-textbox-iconic"
                      />
                      <Key className="settings-field-icon h-4 w-4" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="settings-glowing-save self-end sm:w-auto px-8"
                >
                  Update Passcode
                </button>
              </form>

            </div>
          )}
        </div>
      </div>
    </dialog>
  );
};
