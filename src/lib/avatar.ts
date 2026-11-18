export interface AvatarPreset {
  id: string;
  label: string;
  dataUrl: string;
}

function makeStudioPreset(bg1: string, bg2: string, stroke: string, accent: string, shape: 'arch' | 'grid' | 'monolith' | 'orb'): string {
  let motif = '';
  if (shape === 'arch') {
    motif = `<path d="M64 160 V94 C64 60 136 60 136 94 V160" fill="none" stroke="${stroke}" stroke-width="5"/><circle cx="100" cy="84" r="16" fill="${accent}"/>`;
  } else if (shape === 'grid') {
    motif = `<rect x="52" y="52" width="96" height="96" fill="none" stroke="${stroke}" stroke-width="4"/><line x1="100" y1="52" x2="100" y2="148" stroke="${stroke}" stroke-width="3"/><line x1="52" y1="100" x2="148" y2="100" stroke="${stroke}" stroke-width="3"/><rect x="86" y="86" width="28" height="28" fill="${accent}"/>`;
  } else if (shape === 'monolith') {
    motif = `<polygon points="100,42 146,148 54,148" fill="none" stroke="${stroke}" stroke-width="5"/><circle cx="100" cy="112" r="14" fill="${accent}"/>`;
  } else {
    motif = `<circle cx="100" cy="100" r="46" fill="none" stroke="${stroke}" stroke-width="4"/><circle cx="100" cy="100" r="24" fill="${accent}"/><line x1="40" y1="100" x2="160" y2="100" stroke="${stroke}" stroke-width="2.5"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/>${motif}</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export const STUDIO_AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'obsidian-arch',
    label: 'Obsidian Arch',
    dataUrl: makeStudioPreset('#111113', '#27272B', '#F6F5F2', '#254EDB', 'arch'),
  },
  {
    id: 'chalk-grid',
    label: 'Chalk Grid',
    dataUrl: makeStudioPreset('#EAE7DF', '#D6D2C7', '#111113', '#1E3A8A', 'grid'),
  },
  {
    id: 'cobalt-monolith',
    label: 'Cobalt Monolith',
    dataUrl: makeStudioPreset('#162654', '#1E3A8A', '#F6F5F2', '#E2DFD7', 'monolith'),
  },
  {
    id: 'slate-orb',
    label: 'Slate Form',
    dataUrl: makeStudioPreset('#2A2B30', '#16171A', '#D8D5CD', '#F6F5F2', 'orb'),
  },
];

export async function processProfileImageFile(file: File, zoom = 1): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a PNG, JPG, or WebP image file.');
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('Image file must be smaller than 12MB.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Unable to decode selected image.'));
      el.src = objectUrl;
    });

    const targetSize = 320;
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas image processing is unavailable.');
    }

    const minDim = Math.min(img.width, img.height);
    const cropSize = minDim / Math.max(1, Math.min(zoom, 2.5));
    const sx = (img.width - cropSize) / 2;
    const sy = (img.height - cropSize) / 2;

    ctx.fillStyle = '#F6F5F2';
    ctx.fillRect(0, 0, targetSize, targetSize);
    ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, targetSize, targetSize);

    return canvas.toDataURL('image/jpeg', 0.88);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'VT';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
