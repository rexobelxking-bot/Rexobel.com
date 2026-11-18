import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import type {
  CartItem,
  GarmentSize,
  MemberProfile,
  Order,
  PaymentMethodInfo,
  PaymentProvider,
  ShippingAddress,
} from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  user: MemberProfile | null;
  onClose: () => void;
  onRequireAuth: (mode: 'signin' | 'signup') => void;
  onUpdateQty: (productId: string, size: GarmentSize, delta: number) => void;
  onRemoveItem: (productId: string, size: GarmentSize) => void;
  onOrderCompleted: (order: Order, updatedUser: MemberProfile) => void;
}

export function CartDrawer({
  isOpen,
  items,
  user,
  onClose,
  onRequireAuth,
  onUpdateQty,
  onRemoveItem,
  onOrderCompleted,
}: CartDrawerProps) {
  const [step, setStep] = useState<'bag' | 'payment' | 'checkout' | 'confirmed'>('bag');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment provider state
  const [provider, setProvider] = useState<PaymentProvider>('card');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');

  // Shipping address state
  const [address, setAddress] = useState<ShippingAddress>({
    fullName: '',
    line1: '',
    city: '',
    postalCode: '',
    country: 'United Kingdom',
  });

  useEffect(() => {
    if (user) {
      setAddress({
        fullName: user.shippingAddress.fullName || user.name,
        line1: user.shippingAddress.line1 || '',
        city: user.shippingAddress.city || '',
        postalCode: user.shippingAddress.postalCode || '',
        country: user.shippingAddress.country || 'United Kingdom',
      });
      setCardHolder((prev) => prev || user.name);
      setPaypalEmail((prev) => prev || user.email);
    } else if (step === 'payment' || step === 'checkout') {
      setStep('bag');
    }
  }, [user, step]);

  useEffect(() => {
    if (!isOpen && step === 'confirmed') {
      setStep('bag');
      setConfirmedOrder(null);
      setError(null);
    }
  }, [isOpen, step]);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const freeShippingThreshold = 350;
  const remainingForFree = Math.max(0, freeShippingThreshold - subtotal);
  const shippingFee = subtotal === 0 || subtotal >= freeShippingThreshold ? 0 : 18;
  const total = subtotal + shippingFee;
  const totalCount = items.reduce((s, i) => s + i.quantity, 0);

  function formatCardInput(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  function formatExpiryInput(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  }

  function buildPaymentMethodInfo(): PaymentMethodInfo | null {
    if (provider === 'card') {
      const digits = cardNumber.replace(/\D/g, '');
      if (cardHolder.trim().length < 2) {
        setError('Enter the cardholder name.');
        return null;
      }
      if (digits.length < 12) {
        setError('Enter a valid card number (at least 12 digits).');
        return null;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry.trim())) {
        setError('Enter expiry in MM/YY format.');
        return null;
      }
      if (!/^\d{3,4}$/.test(cardCvc.trim())) {
        setError('Enter a 3 or 4 digit security code.');
        return null;
      }
      const last4 = digits.slice(-4);
      return {
        provider: 'card',
        label: 'Credit / Debit Card',
        summary: `Card •••• ${last4}`,
      };
    }

    if (provider === 'apple_pay') {
      return {
        provider: 'apple_pay',
        label: 'Apple Pay',
        summary: 'Apple Pay Express',
      };
    }

    if (provider === 'paypal') {
      const cleanEmail = paypalEmail.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        setError('Enter a valid PayPal account email.');
        return null;
      }
      return {
        provider: 'paypal',
        label: 'PayPal',
        summary: `PayPal · ${cleanEmail}`,
      };
    }

    return {
      provider: 'klarna',
      label: 'Klarna Pay in 4',
      summary: `Klarna · 4 × $${(total / 4).toFixed(2)}`,
    };
  }

  function handleContinueFromBag() {
    setError(null);
    if (!user) {
      onRequireAuth('signin');
      return;
    }
    setStep('payment');
  }

  function handleContinueFromPayment(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) {
      setStep('bag');
      onRequireAuth('signin');
      return;
    }
    const info = buildPaymentMethodInfo();
    if (!info) return;
    setStep('checkout');
  }

  async function handlePlaceOrder(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) {
      setStep('bag');
      onRequireAuth('signin');
      return;
    }
    const paymentMethod = buildPaymentMethodInfo();
    if (!paymentMethod) {
      setStep('payment');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.placeOrder({
        items: items.map((item) => ({
          productId: item.product.id,
          size: item.size,
          quantity: item.quantity,
        })),
        shippingAddress: address,
        paymentMethod,
      });
      setConfirmedOrder(res.order);
      setStep('confirmed');
      onOrderCompleted(res.order, res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete order.');
    } finally {
      setSubmitting(false);
    }
  }

  const activePaymentPreview: PaymentMethodInfo =
    provider === 'card'
      ? {
          provider: 'card',
          label: 'Credit / Debit Card',
          summary: `Card •••• ${cardNumber.replace(/\D/g, '').slice(-4) || '0000'}`,
        }
      : provider === 'apple_pay'
        ? { provider: 'apple_pay', label: 'Apple Pay', summary: 'Apple Pay Express' }
        : provider === 'paypal'
          ? { provider: 'paypal', label: 'PayPal', summary: `PayPal · ${paypalEmail || user?.email || ''}` }
          : { provider: 'klarna', label: 'Klarna Pay in 4', summary: `Klarna · 4 × $${(total / 4).toFixed(2)}` };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
    >
      <div className="w-full max-w-md bg-[#101319] h-full border-l border-[#232A36] flex flex-col shadow-2xl">
        <div className="px-6 py-5 border-b border-[#1E2430] space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#F3F5F8]">
                {step === 'bag' && `Shopping Bag (${totalCount})`}
                {step === 'payment' && 'Payment Provider'}
                {step === 'checkout' && 'Checkout & Dispatch'}
                {step === 'confirmed' && 'Order Confirmed'}
              </h2>
              {step === 'bag' && items.length > 0 && (
                <p className="text-xs font-mono-num text-[#19E6FF] mt-0.5">
                  {remainingForFree === 0
                    ? 'Complimentary express shipping unlocked'
                    : `Add $${remainingForFree} more for complimentary shipping`}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close shopping bag"
              className="w-10 h-10 inline-flex items-center justify-center rounded-md text-[#8892A2] hover:text-[#F3F5F8] hover:bg-[#161B24]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {items.length > 0 && step !== 'confirmed' && (
            <div className="flex items-center gap-2 text-[11px] font-mono-num uppercase tracking-[0.1em]">
              <span className={step === 'bag' ? 'text-[#19E6FF] font-semibold' : 'text-[#8892A2]'}>01. Bag</span>
              <span aria-hidden="true" className="text-[#5B6474]">·</span>
              <span className={step === 'payment' ? 'text-[#19E6FF] font-semibold' : 'text-[#8892A2]'}>
                02. Payment
              </span>
              <span aria-hidden="true" className="text-[#5B6474]">·</span>
              <span className={step === 'checkout' ? 'text-[#19E6FF] font-semibold' : 'text-[#8892A2]'}>
                03. Checkout
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'bag' && (
            <>
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
                  <ShoppingBag className="w-9 h-9 text-[#5B6474]" />
                  <p className="text-base font-medium text-[#F3F5F8]">Your bag is empty</p>
                  <p className="text-sm text-[#8892A2] max-w-xs">
                    Select garments from the technical system archive to begin your order.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={`${item.product.id}-${item.size}`}
                      className="flex gap-4 pb-4 border-b border-[#1E2430]"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-24 h-20 object-cover rounded-sm border border-[#232A36] shrink-0"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-[#F3F5F8] leading-snug">{item.product.name}</h3>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.product.id, item.size)}
                              aria-label={`Remove ${item.product.name}`}
                              className="text-[#6E7787] hover:text-[#FCA5A5] p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs font-mono-num text-[#8892A2] mt-0.5">
                            {item.product.colorName} · SIZE {item.size}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="inline-flex items-center border border-[#232A36] bg-[#090B0E] rounded-md">
                            <button
                              type="button"
                              onClick={() => onUpdateQty(item.product.id, item.size, -1)}
                              aria-label="Decrease quantity"
                              className="w-8 h-8 inline-flex items-center justify-center text-[#F3F5F8] hover:text-[#19E6FF]"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-mono-num font-medium text-[#F3F5F8]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQty(item.product.id, item.size, 1)}
                              aria-label="Increase quantity"
                              className="w-8 h-8 inline-flex items-center justify-center text-[#F3F5F8] hover:text-[#19E6FF]"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-mono-num font-medium text-[#19E6FF]">
                            ${item.product.price * item.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {!user && (
                    <div className="mt-4 p-4 bg-[#090B0E] border border-[#19E6FF]/40 rounded-md space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-mono-num uppercase tracking-[0.12em] text-[#19E6FF]">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>Sign In Required Before Checkout</span>
                      </div>
                      <p className="text-xs text-[#A2ACBC] leading-relaxed">
                        You must be signed in to a REXOBEL member account before choosing a payment provider and
                        completing your order.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {step === 'payment' && (
            <form id="payment-form" onSubmit={handleContinueFromPayment} className="space-y-4">
              {error && (
                <div role="alert" className="p-3.5 text-sm text-[#FCA5A5] bg-[#450A0A]/50 border border-[#7F1D1D] rounded-md">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between p-3.5 bg-[#090B0E] border border-[#1E2430] rounded-md text-xs">
                <span className="text-[#8892A2]">Order Total</span>
                <span className="font-mono-num font-semibold text-[#19E6FF]">${total}</span>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-mono-num uppercase tracking-[0.1em] text-[#A2ACBC]">
                  Select Payment Provider
                </p>

                {/* Card Provider */}
                <button
                  type="button"
                  onClick={() => {
                    setProvider('card');
                    setError(null);
                  }}
                  className={`w-full text-left p-4 rounded-md border transition-colors flex items-center justify-between gap-3 ${
                    provider === 'card'
                      ? 'bg-[#0D1620] border-[#19E6FF]'
                      : 'bg-[#090B0E] border-[#232A36] hover:border-[#3A4559]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className={`w-5 h-5 ${provider === 'card' ? 'text-[#19E6FF]' : 'text-[#8892A2]'}`} />
                    <div>
                      <p className="text-sm font-semibold text-[#F3F5F8]">Credit or Debit Card</p>
                      <p className="text-xs text-[#8892A2]">Visa · Mastercard · American Express</p>
                    </div>
                  </div>
                  <span
                    className={`w-4 h-4 rounded-full border-2 ${
                      provider === 'card' ? 'border-[#19E6FF] bg-[#19E6FF]' : 'border-[#5B6474]'
                    }`}
                  />
                </button>

                {provider === 'card' && (
                  <div className="p-4 bg-[#090B0E] border border-[#1E2430] rounded-md space-y-3">
                    <div>
                      <label htmlFor="pay-card-holder" className="block text-xs font-mono-num uppercase text-[#A2ACBC] mb-1">
                        Cardholder Name
                      </label>
                      <input
                        id="pay-card-holder"
                        type="text"
                        required
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Elena Vance"
                        className="w-full h-10 px-3 text-sm bg-[#101319] border border-[#232A36] rounded-md text-[#F3F5F8] focus:outline-none focus:border-[#19E6FF]"
                      />
                    </div>
                    <div>
                      <label htmlFor="pay-card-number" className="block text-xs font-mono-num uppercase text-[#A2ACBC] mb-1">
                        Card Number
                      </label>
                      <input
                        id="pay-card-number"
                        type="text"
                        inputMode="numeric"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardInput(e.target.value))}
                        placeholder="4242 4242 4242 4242"
                        className="w-full h-10 px-3 text-sm font-mono-num bg-[#101319] border border-[#232A36] rounded-md text-[#F3F5F8] focus:outline-none focus:border-[#19E6FF]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="pay-card-exp" className="block text-xs font-mono-num uppercase text-[#A2ACBC] mb-1">
                          Expiry
                        </label>
                        <input
                          id="pay-card-exp"
                          type="text"
                          inputMode="numeric"
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiryInput(e.target.value))}
                          placeholder="09/29"
                          className="w-full h-10 px-3 text-sm font-mono-num bg-[#101319] border border-[#232A36] rounded-md text-[#F3F5F8] focus:outline-none focus:border-[#19E6FF]"
                        />
                      </div>
                      <div>
                        <label htmlFor="pay-card-cvc" className="block text-xs font-mono-num uppercase text-[#A2ACBC] mb-1">
                          CVC
                        </label>
                        <input
                          id="pay-card-cvc"
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          required
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="424"
                          className="w-full h-10 px-3 text-sm font-mono-num bg-[#101319] border border-[#232A36] rounded-md text-[#F3F5F8] focus:outline-none focus:border-[#19E6FF]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Apple Pay */}
                <button
                  type="button"
                  onClick={() => {
                    setProvider('apple_pay');
                    setError(null);
                  }}
                  className={`w-full text-left p-4 rounded-md border transition-colors flex items-center justify-between gap-3 ${
                    provider === 'apple_pay'
                      ? 'bg-[#0D1620] border-[#19E6FF]'
                      : 'bg-[#090B0E] border-[#232A36] hover:border-[#3A4559]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className={`w-5 h-5 ${provider === 'apple_pay' ? 'text-[#19E6FF]' : 'text-[#8892A2]'}`} />
                    <div>
                      <p className="text-sm font-semibold text-[#F3F5F8]">Apple Pay</p>
                      <p className="text-xs text-[#8892A2]">Express device wallet authorization</p>
                    </div>
                  </div>
                  <span
                    className={`w-4 h-4 rounded-full border-2 ${
                      provider === 'apple_pay' ? 'border-[#19E6FF] bg-[#19E6FF]' : 'border-[#5B6474]'
                    }`}
                  />
                </button>

                {/* PayPal */}
                <button
                  type="button"
                  onClick={() => {
                    setProvider('paypal');
                    setError(null);
                  }}
                  className={`w-full text-left p-4 rounded-md border transition-colors flex items-center justify-between gap-3 ${
                    provider === 'paypal'
                      ? 'bg-[#0D1620] border-[#19E6FF]'
                      : 'bg-[#090B0E] border-[#232A36] hover:border-[#3A4559]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wallet className={`w-5 h-5 ${provider === 'paypal' ? 'text-[#19E6FF]' : 'text-[#8892A2]'}`} />
                    <div>
                      <p className="text-sm font-semibold text-[#F3F5F8]">PayPal</p>
                      <p className="text-xs text-[#8892A2]">Pay securely via your PayPal account</p>
                    </div>
                  </div>
                  <span
                    className={`w-4 h-4 rounded-full border-2 ${
                      provider === 'paypal' ? 'border-[#19E6FF] bg-[#19E6FF]' : 'border-[#5B6474]'
                    }`}
                  />
                </button>

                {provider === 'paypal' && (
                  <div className="p-4 bg-[#090B0E] border border-[#1E2430] rounded-md">
                    <label htmlFor="pay-paypal-email" className="block text-xs font-mono-num uppercase text-[#A2ACBC] mb-1">
                      PayPal Account Email
                    </label>
                    <input
                      id="pay-paypal-email"
                      type="email"
                      required
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full h-10 px-3 text-sm bg-[#101319] border border-[#232A36] rounded-md text-[#F3F5F8] focus:outline-none focus:border-[#19E6FF]"
                    />
                  </div>
                )}

                {/* Klarna */}
                <button
                  type="button"
                  onClick={() => {
                    setProvider('klarna');
                    setError(null);
                  }}
                  className={`w-full text-left p-4 rounded-md border transition-colors flex items-center justify-between gap-3 ${
                    provider === 'klarna'
                      ? 'bg-[#0D1620] border-[#19E6FF]'
                      : 'bg-[#090B0E] border-[#232A36] hover:border-[#3A4559]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className={`w-5 h-5 ${provider === 'klarna' ? 'text-[#19E6FF]' : 'text-[#8892A2]'}`} />
                    <div>
                      <p className="text-sm font-semibold text-[#F3F5F8]">Klarna Pay in 4</p>
                      <p className="text-xs font-mono-num text-[#8892A2]">
                        4 interest-free payments of ${(total / 4).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`w-4 h-4 rounded-full border-2 ${
                      provider === 'klarna' ? 'border-[#19E6FF] bg-[#19E6FF]' : 'border-[#5B6474]'
                    }`}
                  />
                </button>
              </div>
            </form>
          )}

          {step === 'checkout' && (
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
              {error && (
                <div role="alert" className="p-3.5 text-sm text-[#FCA5A5] bg-[#450A0A]/50 border border-[#7F1D1D] rounded-md">
                  {error}
                </div>
              )}

              <div className="p-4 bg-[#090B0E] border border-[#19E6FF]/35 rounded-md flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-mono-num uppercase tracking-[0.1em] text-[#19E6FF]">Payment Provider</p>
                  <p className="text-sm font-medium text-[#F3F5F8] mt-0.5">{activePaymentPreview.summary}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('payment')}
                  className="text-xs font-mono-num uppercase text-[#19E6FF] underline underline-offset-4 hover:text-[#52EEFF] shrink-0"
                >
                  Change
                </button>
              </div>

              <div className="p-4 bg-[#090B0E] border border-[#1E2430] rounded-md space-y-2 text-xs">
                <div className="flex justify-between text-[#8892A2]">
                  <span>Items ({totalCount})</span>
                  <span className="font-mono-num">${subtotal}</span>
                </div>
                <div className="flex justify-between text-[#8892A2]">
                  <span>Express Courier</span>
                  <span className="font-mono-num">{shippingFee === 0 ? 'Complimentary' : `$${shippingFee}`}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-[#F3F5F8] pt-2 border-t border-[#1E2430]">
                  <span>Total Due</span>
                  <span className="font-mono-num text-[#19E6FF]">${total}</span>
                </div>
              </div>

              <div>
                <label htmlFor="ship-name" className="block text-xs font-mono-num uppercase tracking-[0.1em] text-[#A2ACBC] mb-1">
                  Recipient Full Name
                </label>
                <input
                  id="ship-name"
                  type="text"
                  required
                  value={address.fullName}
                  onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                  className="w-full h-11 px-3.5 text-sm bg-[#090B0E] border border-[#232A36] rounded-md text-[#F3F5F8] focus:outline-none focus:border-[#19E6FF]"
                />
              </div>

              <div>
                <label htmlFor="ship-line1" className="block text-xs font-mono-num uppercase tracking-[0.1em] text-[#A2ACBC] mb-1">
                  Street Address
                </label>
                <input
                  id="ship-line1"
                  type="text"
                  required
                  value={address.line1}
                  onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                  placeholder="42 Redchurch Street"
                  className="w-full h-11 px-3.5 text-sm bg-[#090B0E] border border-[#232A36] rounded-md text-[#F3F5F8] placeholder:text-[#5B6474] focus:outline-none focus:border-[#19E6FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ship-city" className="block text-xs font-mono-num uppercase tracking-[0.1em] text-[#A2ACBC] mb-1">
                    City
                  </label>
                  <input
                    id="ship-city"
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="London"
                    className="w-full h-11 px-3.5 text-sm bg-[#090B0E] border border-[#232A36] rounded-md text-[#F3F5F8] placeholder:text-[#5B6474] focus:outline-none focus:border-[#19E6FF]"
                  />
                </div>
                <div>
                  <label htmlFor="ship-postal" className="block text-xs font-mono-num uppercase tracking-[0.1em] text-[#A2ACBC] mb-1">
                    Postal Code
                  </label>
                  <input
                    id="ship-postal"
                    type="text"
                    required
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    placeholder="E2 7DP"
                    className="w-full h-11 px-3.5 text-sm bg-[#090B0E] border border-[#232A36] rounded-md text-[#F3F5F8] placeholder:text-[#5B6474] focus:outline-none focus:border-[#19E6FF]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ship-country" className="block text-xs font-mono-num uppercase tracking-[0.1em] text-[#A2ACBC] mb-1">
                  Country
                </label>
                <input
                  id="ship-country"
                  type="text"
                  required
                  value={address.country}
                  onChange={(e) => setAddress({ ...address, country: e.target.value })}
                  className="w-full h-11 px-3.5 text-sm bg-[#090B0E] border border-[#232A36] rounded-md text-[#F3F5F8] focus:outline-none focus:border-[#19E6FF]"
                />
              </div>
            </form>
          )}

          {step === 'confirmed' && confirmedOrder && (
            <div className="py-6 space-y-5">
              <div className="p-5 bg-[#090B0E] border border-[#19E6FF]/40 rounded-md space-y-3">
                <CheckCircle2 className="w-8 h-8 text-[#19E6FF]" />
                <div>
                  <p className="text-xs font-mono-num text-[#19E6FF]">
                    ORDER #{confirmedOrder.orderNumber} · {confirmedOrder.trackingStatus?.toUpperCase() || 'PROCESSING'}
                  </p>
                  <h3 className="text-lg font-semibold text-[#F3F5F8] mt-0.5">
                    Order #{confirmedOrder.orderNumber} Confirmed — {confirmedOrder.trackingStatus || 'Processing'}
                  </h3>
                </div>
                <p className="text-xs text-[#8892A2] leading-relaxed">
                  Shipping to {confirmedOrder.shippingAddress.fullName}, {confirmedOrder.shippingAddress.line1},{' '}
                  {confirmedOrder.shippingAddress.city} {confirmedOrder.shippingAddress.postalCode}.
                </p>
                {confirmedOrder.trackingNumber && (
                  <p className="text-xs font-mono-num text-[#A2ACBC]">
                    Tracking ID: {confirmedOrder.trackingNumber}
                    {confirmedOrder.estimatedDelivery ? ` · ${confirmedOrder.estimatedDelivery}` : ''}
                  </p>
                )}
                {confirmedOrder.paymentMethod && (
                  <p className="text-xs font-mono-num text-[#19E6FF]">
                    Authorized via {confirmedOrder.paymentMethod.summary}
                  </p>
                )}
              </div>

              <div className="border border-[#1E2430] bg-[#0D1016] rounded-md p-4 space-y-2.5">
                {confirmedOrder.items.map((item) => (
                  <div key={`${item.productId}-${item.size}`} className="flex items-center justify-between text-xs">
                    <span className="text-[#D1D7E0]">
                      {item.name} · {item.size} × {item.quantity}
                    </span>
                    <span className="font-mono-num text-[#F3F5F8]">${item.unitPrice * item.quantity}</span>
                  </div>
                ))}
                <div className="pt-2.5 border-t border-[#1E2430] flex items-center justify-between text-sm font-semibold text-[#F3F5F8]">
                  <span>Total Paid</span>
                  <span className="font-mono-num text-[#19E6FF]">${confirmedOrder.total}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[#1E2430] bg-[#0B0D12]">
          {step === 'bag' && items.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#8892A2]">Subtotal</span>
                <span className="font-mono-num font-semibold text-[#19E6FF]">${subtotal}</span>
              </div>

              {user ? (
                <button
                  type="button"
                  onClick={handleContinueFromBag}
                  className="w-full h-11 bg-[#19E6FF] text-[#090B0E] text-xs font-mono-num font-semibold uppercase tracking-[0.14em] rounded-md hover:bg-[#52EEFF] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  SELECT PAYMENT PROVIDER
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => onRequireAuth('signin')}
                    className="w-full h-11 bg-[#19E6FF] text-[#090B0E] text-xs font-mono-num font-semibold uppercase tracking-[0.14em] rounded-md hover:bg-[#52EEFF] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    SIGN IN TO CHECK OUT
                  </button>
                  <button
                    type="button"
                    onClick={() => onRequireAuth('signup')}
                    className="w-full h-10 bg-[#151922] border border-[#232A36] text-[#F3F5F8] text-xs font-mono-num uppercase tracking-[0.12em] rounded-md hover:border-[#19E6FF] hover:text-[#19E6FF] transition-colors whitespace-nowrap"
                  >
                    CREATE ACCOUNT
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'payment' && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep('bag');
                }}
                className="h-11 px-4 border border-[#232A36] text-xs font-mono-num uppercase text-[#A2ACBC] rounded-md hover:border-[#19E6FF] hover:text-[#F3F5F8] whitespace-nowrap"
              >
                Back
              </button>
              <button
                type="submit"
                form="payment-form"
                className="flex-1 h-11 bg-[#19E6FF] text-[#090B0E] text-xs font-mono-num font-semibold uppercase tracking-[0.12em] rounded-md hover:bg-[#52EEFF] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                CONTINUE TO CHECKOUT
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 'checkout' && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep('payment');
                }}
                className="h-11 px-4 border border-[#232A36] text-xs font-mono-num uppercase text-[#A2ACBC] rounded-md hover:border-[#19E6FF] hover:text-[#F3F5F8] whitespace-nowrap"
              >
                Back
              </button>
              <button
                type="submit"
                form="checkout-form"
                disabled={submitting}
                className="flex-1 h-11 bg-[#19E6FF] text-[#090B0E] text-xs font-mono-num font-semibold uppercase tracking-[0.12em] rounded-md hover:bg-[#52EEFF] transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {submitting ? 'CONFIRMING ORDER...' : `CONFIRM ORDER · $${total}`}
              </button>
            </div>
          )}

          {step === 'confirmed' && (
            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 bg-[#19E6FF] text-[#090B0E] text-xs font-mono-num font-semibold uppercase tracking-[0.14em] rounded-md hover:bg-[#52EEFF] transition-colors whitespace-nowrap"
            >
              RETURN TO REXOBEL
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
