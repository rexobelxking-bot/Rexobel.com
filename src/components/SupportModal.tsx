import { Check, CheckCircle2, Copy, Phone, Send, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { MemberProfile } from '../types';

interface SupportModalProps {
  isOpen: boolean;
  user: MemberProfile | null;
  onClose: () => void;
}

const SUPPORT_PHONE_DISPLAY = '+971 58 985 5251';
const SUPPORT_PHONE_TEL = 'tel:+971589855251';

export function SupportModal({ isOpen, user, onClose }: SupportModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName((prev) => prev || user?.name || '');
      setEmail((prev) => prev || user?.email || '');
      setError(null);
      setTicketId(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  async function handleCopyPhone() {
    try {
      await navigator.clipboard.writeText(SUPPORT_PHONE_DISPLAY);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored if blocked
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.submitSupportEnquiry({
        name,
        email,
        orderNumber: orderNumber.trim() || undefined,
        message,
      });
      setTicketId(res.ticketNumber);
      setMessage('');
      setOrderNumber('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send support request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-modal-title"
    >
      <div className="relative w-full max-w-lg bg-[#101319] border border-[#232A36] rounded-lg shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1E2430]">
          <div>
            <p className="text-xs font-mono-num tracking-[0.18em] uppercase text-[#19E6FF]">REXOBEL Client Care</p>
            <h2 id="support-modal-title" className="text-xl font-semibold text-[#F3F5F8] mt-1">
              Contact Support
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close contact support"
            className="w-10 h-10 inline-flex items-center justify-center rounded-md text-[#8892A2] hover:text-[#F3F5F8] hover:bg-[#161B24] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Direct Phone Support Card */}
          <div className="p-4 bg-[#090B0E] border border-[#19E6FF]/40 rounded-md space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-[#101A24] border border-[#19E6FF]/35 inline-flex items-center justify-center text-[#19E6FF] shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-mono-num uppercase tracking-[0.1em] text-[#8892A2]">Direct Support Line</p>
                  <a
                    href={SUPPORT_PHONE_TEL}
                    className="text-base font-mono-num font-semibold text-[#19E6FF] hover:text-[#52EEFF] transition-colors"
                  >
                    {SUPPORT_PHONE_DISPLAY}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-mono-num uppercase bg-[#151922] border border-[#232A36] text-[#F3F5F8] rounded-md hover:border-[#19E6FF] hover:text-[#19E6FF] transition-colors whitespace-nowrap"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#19E6FF]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <a
                  href={SUPPORT_PHONE_TEL}
                  className="h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-mono-num uppercase font-semibold bg-[#19E6FF] text-[#090B0E] rounded-md hover:bg-[#52EEFF] transition-colors whitespace-nowrap"
                >
                  Call
                </a>
              </div>
            </div>
            <p className="text-xs text-[#8892A2]">
              Available Sunday – Friday, 09:00 – 20:00 GST ·{' '}
              <span className="text-[#19E6FF] font-mono-num">REXOBEL.com</span> ·{' '}
              <a href="mailto:support@rexobel.com" className="text-[#19E6FF] font-mono-num hover:underline">
                support@rexobel.com
              </a>
            </p>
          </div>

          {ticketId ? (
            <div className="p-5 bg-[#090B0E] border border-[#19E6FF]/40 rounded-md space-y-3">
              <CheckCircle2 className="w-7 h-7 text-[#19E6FF]" />
              <div>
                <p className="text-xs font-mono-num text-[#19E6FF]">TICKET #{ticketId}</p>
                <h3 className="text-base font-semibold text-[#F3F5F8] mt-0.5">Support enquiry received</h3>
              </div>
              <p className="text-xs text-[#A2ACBC] leading-relaxed">
                Our studio team has logged your request. For urgent dispatch questions, call{' '}
                <a href={SUPPORT_PHONE_TEL} className="text-[#19E6FF] font-mono-num underline underline-offset-4">
                  {SUPPORT_PHONE_DISPLAY}
                </a>
                .
              </p>
              <button
                type="button"
                onClick={() => setTicketId(null)}
                className="h-9 px-4 text-xs font-mono-num uppercase bg-[#151922] border border-[#232A36] text-[#F3F5F8] rounded-md hover:border-[#19E6FF]"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div role="alert" className="p-3 text-sm text-[#FCA5A5] bg-[#450A0A]/50 border border-[#7F1D1D] rounded-md">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sup-name" className="block text-xs font-mono-num uppercase tracking-[0.1em] text-[#A2ACBC] mb-1">
                    Name
                  </label>
                  <input
                    id="sup-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full h-10 px-3 text-sm bg-[#090B0E] border border-[#232A36] rounded-md text-[#F3F5F8] placeholder:text-[#5B6474] focus:outline-none focus:border-[#19E6FF]"
                  />
                </div>
                <div>
                  <label htmlFor="sup-email" className="block text-xs font-mono-num uppercase tracking-[0.1em] text-[#A2ACBC] mb-1">
                    Email
                  </label>
                  <input
                    id="sup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full h-10 px-3 text-sm bg-[#090B0E] border border-[#232A36] rounded-md text-[#F3F5F8] placeholder:text-[#5B6474] focus:outline-none focus:border-[#19E6FF]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="sup-order" className="block text-xs font-mono-num uppercase tracking-[0.1em] text-[#A2ACBC] mb-1">
                  Order Number (Optional)
                </label>
                <input
                  id="sup-order"
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="VLT-1042"
                  className="w-full h-10 px-3 text-sm font-mono-num bg-[#090B0E] border border-[#232A36] rounded-md text-[#F3F5F8] placeholder:text-[#5B6474] focus:outline-none focus:border-[#19E6FF]"
                />
              </div>

              <div>
                <label htmlFor="sup-msg" className="block text-xs font-mono-num uppercase tracking-[0.1em] text-[#A2ACBC] mb-1">
                  How Can We Help?
                </label>
                <textarea
                  id="sup-msg"
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Sizing question, order tracking, or garment care..."
                  className="w-full p-3 text-sm bg-[#090B0E] border border-[#232A36] rounded-md text-[#F3F5F8] placeholder:text-[#5B6474] focus:outline-none focus:border-[#19E6FF]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-[#19E6FF] text-[#090B0E] text-xs font-mono-num font-semibold uppercase tracking-[0.14em] rounded-md hover:bg-[#52EEFF] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'SENDING...' : 'SEND SUPPORT MESSAGE'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
