import { Check, Clock, PackageCheck, Truck } from 'lucide-react';
import type { OrderTrackingStatus } from '../types';

interface OrderTrackingProgressBarProps {
  status: OrderTrackingStatus;
}

interface StageConfig {
  status: OrderTrackingStatus;
  stepCode: string;
  caption: string;
}

const STAGES: StageConfig[] = [
  { status: 'Processing', stepCode: '01', caption: 'Atelier prep' },
  { status: 'In Transit', stepCode: '02', caption: 'With courier' },
  { status: 'Delivered', stepCode: '03', caption: 'Received' },
];

export function OrderTrackingProgressBar({ status }: OrderTrackingProgressBarProps) {
  const stageIndex = Math.max(0, STAGES.findIndex((s) => s.status === status));
  const fillWidthClass = stageIndex === 0 ? 'w-0' : stageIndex === 1 ? 'w-1/2' : 'w-full';

  return (
    <div
      role="progressbar"
      aria-label="Order tracking progress"
      aria-valuemin={1}
      aria-valuemax={STAGES.length}
      aria-valuenow={stageIndex + 1}
      aria-valuetext={status}
      className="pt-1 pb-0.5"
    >
      <div className="relative">
        {/* Background track connecting centers of stage 1 and stage 3 */}
        <div
          aria-hidden="true"
          className="absolute top-4 left-[16.6667%] right-[16.6667%] h-0.5 bg-[#1E2430] rounded-full overflow-hidden"
        >
          <div
            className={`h-full bg-[#19E6FF] transition-all duration-500 ease-out ${fillWidthClass}`}
          />
        </div>

        {/* 3 Stage Nodes */}
        <ol className="relative grid grid-cols-3 gap-2">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < stageIndex || (idx === stageIndex && status === 'Delivered');
            const isCurrent = idx === stageIndex;
            const isActiveOrDone = idx <= stageIndex;

            return (
              <li key={stage.status} className="flex flex-col items-center text-center">
                <div
                  className={`relative z-10 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-[#19E6FF] border-[#19E6FF] text-[#090B0E]'
                      : isCurrent
                        ? 'bg-[#091A22] border-[#19E6FF] text-[#19E6FF] ring-4 ring-[#19E6FF]/15'
                        : 'bg-[#0D1016] border-[#232A36] text-[#5B6474]'
                  }`}
                >
                  {isCompleted ? (
                    stage.status === 'Delivered' ? (
                      <PackageCheck className="w-4 h-4" />
                    ) : (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    )
                  ) : stage.status === 'Processing' ? (
                    <Clock className="w-4 h-4" />
                  ) : stage.status === 'In Transit' ? (
                    <Truck className="w-4 h-4" />
                  ) : (
                    <PackageCheck className="w-4 h-4" />
                  )}
                </div>

                <span
                  className={`mt-2 text-[11px] font-mono-num tracking-[0.04em] transition-colors ${
                    isActiveOrDone ? 'text-[#F3F5F8] font-semibold' : 'text-[#5B6474]'
                  }`}
                >
                  {stage.status}
                </span>

                <span
                  className={`text-[10px] font-mono-num transition-colors ${
                    isCurrent ? 'text-[#19E6FF]' : isActiveOrDone ? 'text-[#8892A2]' : 'text-[#475061]'
                  }`}
                >
                  {stage.stepCode} · {stage.caption}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
