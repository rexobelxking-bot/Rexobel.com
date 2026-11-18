import { Camera, Eye, EyeOff, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, setStoredToken } from '../lib/api';
import { processProfileImageFile, STUDIO_AVATAR_PRESETS } from '../lib/avatar';
import type { GarmentSize, MemberProfile } from '../types';
import { Avatar } from './Avatar';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'signin' | 'signup';
  onClose: () => void;
  onAuthenticated: (user: MemberProfile) => void;
}

const SIZES: GarmentSize[] = ['XS', 'S', 'M', 'L', 'XL'];

export function AuthModal({ isOpen, initialMode = 'signin', onClose, onAuthenticated }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredSize, setPreferredSize] = useState<GarmentSize>('M');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  async function handleFileSelect(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      setRawFile(file);
      setZoom(1);
      const processed = await processProfileImageFile(file, 1);
      setAvatarUrl(processed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process image.');
    }
  }

  async function handleZoomChange(nextZoom: number) {
    setZoom(nextZoom);
    if (!rawFile) return;
    try {
      const processed = await processProfileImageFile(rawFile, nextZoom);
      setAvatarUrl(processed);
    } catch {
      // Keep current preview if zoom fails
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const res = await api.signup({
          name,
          email,
          password,
          avatarUrl,
          preferredSize,
        });
        setStoredToken(res.token);
        onAuthenticated(res.user);
      } else {
        const res = await api.login({ email, password });
        setStoredToken(res.token);
        onAuthenticated(res.user);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDemoLogin() {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.loginDemo();
      setStoredToken(res.token);
      onAuthenticated(res.user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in to demo account.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-lg bg-[#101319] border border-[#232A36] rounded-lg shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1E2430]">
          <div>
            <p className="text-xs font-mono-num tracking-[0.18em] uppercase text-[#19E6FF]">REXOBEL Member Access</p>
            <h2 id="auth-modal-title" className="text-xl font-semibold text-[#F3F5F8] mt-1">
              {mode === 'signin' ? 'Sign in to your account' : 'Create your REXOBEL profile'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="w-10 h-10 inline-flex items-center justify-center rounded-md text-[#8892A2] hover:text-[#F3F5F8] hover:bg-[#161B24] transition-colors focus-visible:outline-2 focus-visible:outline-[#19E6FF]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-5">
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#090B0E] rounded-md border border-[#1E2430]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`h-10 text-xs font-mono-num tracking-[0.12em] uppercase rounded-sm transition-colors whitespace-nowrap shrink-0 ${
                mode === 'signin' ? 'bg-[#19E6FF] text-[#090B0E] font-semibold' : 'text-[#8892A2] hover:text-[#F3F5F8]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`h-10 text-xs font-mono-num tracking-[0.12em] uppercase rounded-sm transition-colors whitespace-nowrap shrink-0 ${
                mode === 'signup' ? 'bg-[#19E6FF] text-[#090B0E] font-semibold' : 'text-[#8892A2] hover:text-[#F3F5F8]'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div role="alert" className="p-3.5 text-sm text-[#FCA5A5] bg-[#450A0A]/50 border border-[#7F1D1D] rounded-md">
              {error}
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div className="p-4 bg-[#0D1016] border border-[#1E2430] rounded-md space-y-3">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar src={avatarUrl} name={name || 'New Member'} size="lg" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Upload profile picture"
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#19E6FF] text-[#090B0E] inline-flex items-center justify-center border-2 border-[#101319] hover:bg-[#52EEFF] transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F3F5F8]">Profile Picture</p>
                    <p className="text-xs text-[#8892A2] mt-0.5">Upload a photo or select a studio mark</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#151922] border border-[#262E3D] text-[#F3F5F8] rounded-md hover:border-[#19E6FF] transition-colors whitespace-nowrap shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#19E6FF]" />
                        Upload Photo
                      </button>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarUrl(null);
                            setRawFile(null);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#8892A2] hover:text-[#FCA5A5] transition-colors whitespace-nowrap shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {rawFile && (
                  <div className="pt-2 border-t border-[#1E2430] flex items-center gap-3">
                    <label htmlFor="signup-avatar-zoom" className="text-xs font-medium text-[#8892A2] whitespace-nowrap">
                      Crop Zoom
                    </label>
                    <input
                      id="signup-avatar-zoom"
                      type="range"
                      min="1"
                      max="2.2"
                      step="0.1"
                      value={zoom}
                      onChange={(e) => handleZoomChange(Number(e.target.value))}
                      className="flex-1 accent-[#19E6FF]"
                    />
                    <span className="text-xs font-mono-num text-[#19E6FF]">{zoom.toFixed(1)}x</span>
                  </div>
                )}

                <div className="pt-2 border-t border-[#1E2430] flex items-center justify-between gap-2">
                  <span className="text-xs text-[#8892A2]">Studio Presets</span>
                  <div className="flex items-center gap-2">
                    {STUDIO_AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        title={preset.label}
                        onClick={() => {
                          setRawFile(null);
                          setAvatarUrl(preset.dataUrl);
                        }}
                        className={`w-8 h-8 rounded-full overflow-hidden border transition-transform hover:scale-105 ${
                          avatarUrl === preset.dataUrl ? 'border-[#19E6FF] ring-2 ring-[#19E6FF]/35' : 'border-[#262E3D]'
                        }`}
                      >
                        <img
                          src={preset.dataUrl}
                          alt={preset.label}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
              </div>

              <div>
                <label htmlFor="auth-name" className="block text-xs font-mono-num uppercase tracking-[0.1em] text-[#A2ACBC] mb-1.5">
                  Full Name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Marcus Sterling"
                  className="w-full h-11 px-3.5 text-sm bg-[#090B0E] border border-[#232A36] rounded-md text-[#F3F5F8] placeholder:text-[#5B6474] focus:outline-none focus:border-[#19E6FF]"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-mono-num uppercase tracking-[0.1em] text-[#A2ACBC] mb-1.5">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="w-full h-11 px-3.5 text-sm bg-[#090B0E] border border-[#232A36] rounded-md text-[#F3F5F8] placeholder:text-[#5B6474] focus:outline-none focus:border-[#19E6FF]"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-mono-num uppercase tracking-[0.1em] text-[#A2ACBC] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Enter your password'}
                className="w-full h-11 pl-3.5 pr-11 text-sm bg-[#090B0E] border border-[#232A36] rounded-md text-[#F3F5F8] placeholder:text-[#5B6474] focus:outline-none focus:border-[#19E6FF]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 inline-flex items-center justify-center text-[#8892A2] hover:text-[#19E6FF]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <span className="block text-xs font-mono-num uppercase tracking-[0.1em] text-[#A2ACBC] mb-1.5">
                Preferred Garment Size
              </span>
              <div className="grid grid-cols-5 gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPreferredSize(size)}
                    className={`h-10 text-xs font-mono-num font-medium rounded-md border transition-colors ${
                      preferredSize === size
                        ? 'bg-[#19E6FF] text-[#090B0E] border-[#19E6FF] font-semibold'
                        : 'bg-[#090B0E] text-[#A2ACBC] border-[#232A36] hover:border-[#19E6FF] hover:text-[#F3F5F8]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-[#19E6FF] text-[#090B0E] text-xs font-mono-num font-semibold tracking-[0.14em] uppercase rounded-md hover:bg-[#52EEFF] transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {isSubmitting ? 'AUTHENTICATING...' : mode === 'signin' ? 'SIGN IN' : 'CREATE REXOBEL ACCOUNT'}
          </button>

          {mode === 'signin' && (
            <div className="pt-3 border-t border-[#1E2430]">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDemoLogin}
                className="w-full h-10 bg-[#151922] border border-[#232A36] text-[#D1D7E0] text-xs font-medium rounded-md hover:border-[#19E6FF] hover:text-[#19E6FF] transition-colors whitespace-nowrap"
              >
                Quick Demo Sign In (Elena Vance)
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
