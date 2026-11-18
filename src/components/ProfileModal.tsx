import { Camera, Check, LogOut, Package, Trash2, Upload, User as UserIcon, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, setStoredToken } from '../lib/api';
import { processProfileImageFile, STUDIO_AVATAR_PRESETS } from '../lib/avatar';
import type { GarmentSize, MemberProfile, Product } from '../types';
import { Avatar } from './Avatar';
import { OrderCard } from './OrderCard';

interface ProfileModalProps {
  isOpen: boolean;
  user: MemberProfile;
  products: Product[];
  initialTab?: 'profile' | 'wishlist' | 'orders';
  onClose: () => void;
  onUserUpdated: (user: MemberProfile) => void;
  onSignedOut: () => void;
  onAddToBag: (product: Product, size: GarmentSize) => void;
  onOpenSupport?: () => void;
}

const SIZES: GarmentSize[] = ['XS', 'S', 'M', 'L', 'XL'];

export function ProfileModal({
  isOpen,
  user,
  products,
  initialTab = 'profile',
  onClose,
  onUserUpdated,
  onSignedOut,
  onAddToBag,
  onOpenSupport,
}: ProfileModalProps) {
  const [tab, setTab] = useState<'profile' | 'wishlist' | 'orders'>(initialTab);
  const [name, setName] = useState(user.name);
  const [handle, setHandle] = useState(user.handle);
  const [bio, setBio] = useState(user.bio);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [preferredSize, setPreferredSize] = useState<GarmentSize>(user.preferredSize);
  const [address, setAddress] = useState(user.shippingAddress);
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    setName(user.name);
    setHandle(user.handle);
    setBio(user.bio);
    setAvatarUrl(user.avatarUrl);
    setPreferredSize(user.preferredSize);
    setAddress(user.shippingAddress);
    setRawFile(null);
    setZoom(1);
    setError(null);
  }, [user, isOpen]);

  if (!isOpen) return null;

  async function handleFileSelect(file: File | undefined) {
    if (!file) return;
    setError(null);
    setSavedBanner(false);
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
      // Ignore transient canvas failure
    }
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedBanner(false);
    try {
      const res = await api.updateProfile({
        name,
        handle,
        bio,
        avatarUrl,
        preferredSize,
        shippingAddress: address,
      });
      onUserUpdated(res.user);
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile changes.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveWishlist(productId: string) {
    try {
      const res = await api.toggleWishlist(productId);
      onUserUpdated({ ...user, wishlist: res.wishlist });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update wishlist.');
    }
  }

  async function handleSignOut() {
    try {
      await api.logout();
    } catch {
      // Clear local session regardless
    }
    setStoredToken(null);
    onSignedOut();
    onClose();
  }

  async function handleAdvanceTracking(orderId: string) {
    try {
      const res = await api.advanceOrderTracking(orderId);
      onUserUpdated(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update tracking status.');
    }
  }

  const savedProducts = products.filter((p) => user.wishlist.includes(p.id));
  const memberYear = new Date(user.memberSince).getFullYear();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-[#101319] border border-[#232A36] rounded-lg shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1E2430] shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar src={avatarUrl} name={user.name} size="md" />
            <div className="min-w-0">
              <h2 id="profile-modal-title" className="text-lg font-semibold text-[#F3F5F8] truncate">
                {user.name}
              </h2>
              <p className="text-xs font-mono-num text-[#19E6FF] truncate">
                @{user.handle} · MEMBER {memberYear} · SIZE {user.preferredSize}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 h-10 px-3.5 text-xs font-mono-num uppercase tracking-[0.08em] text-[#A2ACBC] hover:text-[#19E6FF] border border-[#232A36] rounded-md hover:border-[#19E6FF] transition-colors whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close profile studio"
              className="w-10 h-10 inline-flex items-center justify-center rounded-md text-[#8892A2] hover:text-[#F3F5F8] hover:bg-[#161B24] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 pt-4 border-b border-[#1E2430] bg-[#0B0D12] shrink-0">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setTab('profile')}
              className={`pb-3 text-xs font-mono-num uppercase tracking-[0.12em] border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                tab === 'profile'
                  ? 'border-[#19E6FF] text-[#19E6FF]'
                  : 'border-transparent text-[#8892A2] hover:text-[#F3F5F8]'
              }`}
            >
              Profile & Photo
            </button>
            <button
              type="button"
              onClick={() => setTab('wishlist')}
              className={`pb-3 text-xs font-mono-num uppercase tracking-[0.12em] border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                tab === 'wishlist'
                  ? 'border-[#19E6FF] text-[#19E6FF]'
                  : 'border-transparent text-[#8892A2] hover:text-[#F3F5F8]'
              }`}
            >
              Saved ({savedProducts.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('orders')}
              className={`pb-3 text-xs font-mono-num uppercase tracking-[0.12em] border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                tab === 'orders'
                  ? 'border-[#19E6FF] text-[#19E6FF]'
                  : 'border-transparent text-[#8892A2] hover:text-[#F3F5F8]'
              }`}
            >
              Orders ({user.orders.length})
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {tab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {error && (
                <div role="alert" className="p-3.5 text-sm text-[#FCA5A5] bg-[#450A0A]/50 border border-[#7F1D1D] rounded-md">
                  {error}
                </div>
              )}
              {savedBanner && (
                <div className="p-3.5 text-sm text-[#19E6FF] bg-[#0B2530] border border-[#19E6FF]/40 rounded-md flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  Profile and picture updated.
                </div>
              )}

              <div className="p-5 bg-[#0D1016] border border-[#1E2430] rounded-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="relative self-start">
                    <Avatar src={avatarUrl} name={name || user.name} size="xl" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Change profile picture"
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#19E6FF] text-[#090B0E] inline-flex items-center justify-center border-2 border-[#101319] hover:bg-[#52EEFF] transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-2">
                    <h3 className="text-sm font-semibold text-[#F3F5F8]">Profile Picture</h3>
                    <p className="text-xs text-[#8892A2] leading-relaxed">
                      Upload a portrait from your device (PNG, JPG, or WebP) or select a REXOBEL studio avatar.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-mono-num uppercase tracking-[0.08em] bg-[#19E6FF] text-[#090B0E] font-semibold rounded-md hover:bg-[#52EEFF] transition-colors whitespace-nowrap shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload Image
                      </button>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarUrl(null);
                            setRawFile(null);
                          }}
                          className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium bg-[#151922] border border-[#262E3D] text-[#A2ACBC] hover:text-[#FCA5A5] rounded-md transition-colors whitespace-nowrap shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Use Initials
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {rawFile && (
                  <div className="pt-3 border-t border-[#1E2430] flex items-center gap-3">
                    <label htmlFor="profile-avatar-zoom" className="text-xs font-medium text-[#8892A2] whitespace-nowrap">
                      Crop Zoom
                    </label>
                    <input
                      id="profile-avatar-zoom"
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

                <div className="pt-3 border-t border-[#1E2430] flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-[#8892A2]">Studio Avatars</span>
                  <div className="flex items-center gap-2.5">
                    {STUDIO_AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        title={preset.label}
                        onClick={() => {
                          setRawFile(null);
                          setAvatarUrl(preset.dataUrl);
                        }}
                        className={`w-9 h-9 rounded-full overflow-hidden border transition-transform hover:scale-105 ${
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="profile-name" className="block text-xs font-mono-num uppercase tracking-[0.1em] text-[#A2ACBC] mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 px-3.5 text-sm bg-[#090B0E] border border-[#232A36] rounded-md text-[#F3F5F8] focus:outline-none focus:border-[#19E6FF]"
                  />
                </div>
                <div>
                  <label htmlFor="profile-handle" className="block text-xs font-mono-num uppercase tracking-[0.1em] text-[#A2ACBC] mb-1.5">
                    Member Handle
                  </label>
                  <input
                    id="profile-handle"
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="w-full h-11 px-3.5 text-sm bg-[#090B0E] border border-[#232A36] rounded-md text-[#F3F5F8] focus:outline-none focus:border-[#19E6FF]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="profile-bio" className="block text-xs font-mono-num uppercase tracking-[0.1em] text-[#A2ACBC] mb-1.5">
                  Style Notes
                </label>
                <textarea
                  id="profile-bio"
                  rows={2}
                  maxLength={220}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Preferred technical textiles, fit notes, or archive focus"
                  className="w-full p-3.5 text-sm bg-[#090B0E] border border-[#232A36] rounded-md text-[#F3F5F8] placeholder:text-[#5B6474] focus:outline-none focus:border-[#19E6FF]"
                />
              </div>

              <div>
                <span className="block text-xs font-mono-num uppercase tracking-[0.1em] text-[#A2ACBC] mb-1.5">
                  Default Garment Size
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

              <div className="pt-4 border-t border-[#1E2430] space-y-3">
                <h3 className="text-xs font-mono-num uppercase tracking-[0.1em] text-[#19E6FF]">Saved Dispatch Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={address.line1}
                    onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                    className="sm:col-span-2 h-11 px-3.5 text-sm bg-[#090B0E] border border-[#232A36] rounded-md text-[#F3F5F8] placeholder:text-[#5B6474] focus:outline-none focus:border-[#19E6FF]"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="h-11 px-3.5 text-sm bg-[#090B0E] border border-[#232A36] rounded-md text-[#F3F5F8] placeholder:text-[#5B6474] focus:outline-none focus:border-[#19E6FF]"
                  />
                  <input
                    type="text"
                    placeholder="Postal Code"
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    className="h-11 px-3.5 text-sm bg-[#090B0E] border border-[#232A36] rounded-md text-[#F3F5F8] placeholder:text-[#5B6474] focus:outline-none focus:border-[#19E6FF]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 px-5 text-sm font-medium text-[#8892A2] hover:text-[#F3F5F8] rounded-md transition-colors whitespace-nowrap"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-11 px-6 bg-[#19E6FF] text-[#090B0E] text-xs font-mono-num font-semibold uppercase tracking-[0.12em] rounded-md hover:bg-[#52EEFF] transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {saving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          )}

          {tab === 'wishlist' && (
            <div className="space-y-4">
              {savedProducts.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <UserIcon className="w-8 h-8 text-[#5B6474] mx-auto" />
                  <p className="text-sm font-medium text-[#F3F5F8]">No saved garments yet</p>
                  <p className="text-xs text-[#8892A2]">Bookmark pieces from the collection to build your seasonal edit.</p>
                </div>
              ) : (
                savedProducts.map((product) => {
                  const chosenSize = product.sizes.includes(user.preferredSize) ? user.preferredSize : product.sizes[0];
                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 p-3.5 border border-[#1E2430] rounded-md bg-[#0D1016]"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-20 h-16 object-cover rounded-sm border border-[#232A36] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono-num text-[#19E6FF]">
                          {product.category} · {product.fabricWeight}
                        </p>
                        <h4 className="text-sm font-semibold text-[#F3F5F8] truncate">{product.name}</h4>
                        <p className="text-sm font-mono-num text-[#A2ACBC] mt-0.5">${product.price}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onAddToBag(product, chosenSize)}
                          className="h-9 px-3.5 text-xs font-mono-num uppercase bg-[#19E6FF] text-[#090B0E] font-semibold rounded-md hover:bg-[#52EEFF] transition-colors whitespace-nowrap"
                        >
                          Add ({chosenSize})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveWishlist(product.id)}
                          aria-label={`Remove ${product.name} from saved items`}
                          className="w-9 h-9 inline-flex items-center justify-center border border-[#232A36] rounded-md text-[#8892A2] hover:text-[#FCA5A5] bg-[#151922]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === 'orders' && (
            <div className="space-y-4">
              {user.orders.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Package className="w-8 h-8 text-[#5B6474] mx-auto" />
                  <p className="text-sm font-medium text-[#F3F5F8]">No orders placed yet</p>
                  <p className="text-xs text-[#8892A2]">Your confirmed REXOBEL dispatches will appear here.</p>
                </div>
              ) : (
                user.orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAdvanceTracking={handleAdvanceTracking}
                  />
                ))
              )}

              <div className="p-3.5 bg-[#090B0E] border border-[#1E2430] rounded-md flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-[#8892A2]">
                  Need order assistance? Call{' '}
                  <a href="tel:+971589855251" className="font-mono-num text-[#19E6FF] hover:underline">
                    +971 58 985 5251
                  </a>
                </span>
                {onOpenSupport && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSupport();
                    }}
                    className="font-mono-num uppercase tracking-[0.08em] text-[#19E6FF] hover:text-[#52EEFF] underline underline-offset-4 whitespace-nowrap"
                  >
                    Contact Support
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
