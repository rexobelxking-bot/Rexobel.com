import { ArrowRight, CheckCircle2, Clock, Truck } from 'lucide-react';
import { useState } from 'react';
import type { Order, OrderTrackingStatus } from '../types';
import { OrderTrackingProgressBar } from './OrderTrackingProgressBar';

interface OrderCardProps {
  order: Order;
  onAdvanceTracking: (orderId: string) => Promise<void>;
}

export function OrderCard({ order, onAdvanceTracking }: OrderCardProps) {
  const [advancing, setAdvancing] = useState(false);

  const currentStatus: OrderTrackingStatus =
    order.trackingStatus || (order.status === 'Shipped' ? 'Delivered' : 'Processing');

  async function handleSimulateStep() {
    if (currentStatus === 'Delivered' || advancing) return;
    setAdvancing(true);
    try {
      await onAdvanceTracking(order.id);
    } finally {
      setAdvancing(false);
    }
  }

  return (
    <div className="p-4 border border-[#1E2430] bg-[#0D1016] rounded-md space-y-4">
      {/* Order Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1E2430]">
        <div>
          <p className="text-sm font-mono-num font-semibold text-[#19E6FF]">ORDER #{order.orderNumber}</p>
          <p className="text-xs text-[#8892A2] mt-0.5">
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
            {order.paymentMethod ? ` · ${order.paymentMethod.summary}` : ''}
          </p>
        </div>
        <p className="text-sm font-mono-num font-semibold text-[#F3F5F8]">${order.total}</p>
      </div>

      {/* Simulated Order Tracking Status */}
      <div className="p-3.5 bg-[#090B0E] border border-[#1E2430] rounded-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {currentStatus === 'Processing' && <Clock className="w-4 h-4 text-[#19E6FF] shrink-0" />}
            {currentStatus === 'In Transit' && <Truck className="w-4 h-4 text-[#19E6FF] shrink-0" />}
            {currentStatus === 'Delivered' && <CheckCircle2 className="w-4 h-4 text-[#19E6FF] shrink-0" />}
            <span className="text-xs font-mono-num uppercase tracking-[0.08em] text-[#F3F5F8] font-semibold">
              Tracking: <span className="text-[#19E6FF]">{currentStatus}</span>
            </span>
          </div>

          <span className="text-[11px] font-mono-num text-[#8892A2]">
            {order.trackingNumber || `RXB-TRK-${order.orderNumber.replace(/\D/g, '')}`}
            {order.estimatedDelivery ? ` · ${order.estimatedDelivery}` : ''}
          </span>
        </div>

        <OrderTrackingProgressBar status={currentStatus} />

        {currentStatus !== 'Delivered' && (
          <div className="flex justify-end pt-1 border-t border-[#161B24]">
            <button
              type="button"
              disabled={advancing}
              onClick={handleSimulateStep}
              className="inline-flex items-center gap-1 text-[11px] font-mono-num uppercase tracking-[0.08em] text-[#19E6FF] hover:text-[#52EEFF] underline underline-offset-4 disabled:opacity-50 whitespace-nowrap"
            >
              {advancing ? 'Updating...' : 'Simulate Next Stage'}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Itemized Garments */}
      <div className="space-y-2">
        {order.items.map((item) => (
          <div key={`${order.id}-${item.productId}-${item.size}`} className="flex items-center justify-between text-xs">
            <span className="text-[#D1D7E0]">
              {item.name} · Size {item.size} × {item.quantity}
            </span>
            <span className="font-mono-num text-[#8892A2]">${item.unitPrice * item.quantity}</span>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-[#1E2430] text-[11px] text-[#8892A2]">
        Dispatch to {order.shippingAddress.fullName} · {order.shippingAddress.city}, {order.shippingAddress.postalCode}
      </div>
    </div>
  );
}
