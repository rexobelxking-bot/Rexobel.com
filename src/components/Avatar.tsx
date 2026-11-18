import { useEffect, useState } from 'react';
import { getInitials } from '../lib/avatar';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'w-7 h-7 text-[11px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
};

export function Avatar({ src, name, size = 'sm', className = '' }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const sizeClass = SIZE_CLASSES[size];
  const showImage = Boolean(src) && !imgError;

  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden bg-[#151922] text-[#19E6FF] font-display font-semibold tracking-wide shrink-0 border border-[#262E3D] ${sizeClass} ${className}`}
    >
      {showImage ? (
        <img
          src={src!}
          alt={`${name} profile picture`}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
    </span>
  );
}
