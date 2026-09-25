'use client';

/**
 * Udaan Aviation — marketing page
 * Design language: aerospace instrumentation × engineering blueprint.
 * Bright, warm off-white base (never pure white), a single safety-orange
 * accent, deep instrument-navy for secondary emphasis. No gradients —
 * every surface is a flat, considered color with hairline rules,
 * viewfinder-style corner marks, and a flight-plan HUD borrowed from
 * drone ground-control software.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { Barlow_Condensed, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';

const display = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
});

const body = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

function subscribeToReducedMotion(callback: () => void) {
  const mediaQuery = window.matchMedia(reducedMotionQuery);
  mediaQuery.addEventListener?.('change', callback);
  return () => mediaQuery.removeEventListener?.('change', callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(reducedMotionQuery).matches;
}

function getServerReducedMotionSnapshot() {
  return false;
}

/* ----------------------------------------------------------------------- */
/*  Data                                                                    */
/* ----------------------------------------------------------------------- */

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Firmware', href: '#firmware' },
  { label: 'Drone Components', href: '#components' },
  { label: 'How It Works', href: '#process' },
  { label: 'Contact', href: '#contact' },
];

interface FirmwareProduct {
  id: string;
  status: 'BEST SELLER' | 'COMING SOON';
  tags: string[];
  name: string;
  tagline: string;
  description: string;
  features: { label: string; active: boolean }[];
  priceOriginal: number;
  priceFinal: number | null;
  priceNote: string;
  cta: string;
  action: 'order' | 'notify';
}

const FIRMWARE: FirmwareProduct[] = [
  {
    id: 'flight-controller-v1',
    status: 'BEST SELLER',
    tags: ['v1.0', 'ESP32 compatible'],
    name: 'Udaan Flight Controller',
    tagline: 'Firmware v1.0',
    description:
      'A streamlined, app-controlled quadcopter firmware built as a reliable foundation — one you can expand and modify as your build gets more advanced.',
    features: [
      { label: 'Smartphone app control', active: true },
      { label: 'Smooth flight stabilization', active: true },
      { label: 'Modifiable for advanced features', active: true },
      { label: 'Easy motor calibration', active: true },
    ],
    priceOriginal: 99,
    priceFinal: 0,
    priceNote: 'Early access — free for a limited time',
    cta: 'Get firmware',
    action: 'order',
  },
  {
    id: 'fixed-wing-v2',
    status: 'COMING SOON',
    tags: ['v2.0', 'Fixed wing'],
    name: 'Udaan Fixed Wing',
    tagline: 'Autopilot firmware',
    description:
      'Next-generation autopilot for fixed-wing aircraft, with altitude hold and assisted flight modes for longer, steadier missions.',
    features: [
      { label: 'App control', active: false },
      { label: 'ESP8266 microcontroller', active: false },
      { label: 'Wi-Fi integrated', active: false },
      { label: 'Auto cutoff', active: false },
    ],
    priceOriginal: 199,
    priceFinal: null,
    priceNote: 'Starting at ₹199',
    cta: 'Notify me',
    action: 'notify',
  },
];

interface ComponentItem {
  id: string;
  kind: 'frame' | 'motor';
  name: string;
  description: string;
  price: number;
  tag?: string;
}

const COMPONENTS: ComponentItem[] = [
  {
    id: 'frame-v1',
    kind: 'frame',
    name: 'Drone Frame v1.0',
    description: '3D printed airframe built for the 8520 coreless motor.',
    price: 299,
  },
  {
    id: 'frame-v2',
    kind: 'frame',
    name: 'Drone Frame v2.0',
    description: 'Revised 8520 coreless-motor airframe — lighter, stiffer.',
    price: 299,
    tag: 'POPULAR',
  },
  {
    id: 'motor-driver',
    kind: 'motor',
    name: 'Motor Driver Module',
    description: 'Compact driver module for precise, low-latency ESC control.',
    price: 199,
  },
];

const PROCESS_STEPS = [
  {
    n: '01',
    title: 'Click “Get firmware”',
    desc: 'Pick a firmware product and select Get firmware. An order summary opens right away.',
  },
  {
    n: '02',
    title: 'Review your receipt',
    desc: 'Check the early-access discount applied — original ₹99, discount −₹99, final price ₹0.',
  },
  {
    n: '03',
    title: 'Download instantly',
    desc: 'Confirm and continue — your firmware downloads automatically. No payment required.',
  },
];

const CONTACT_CHANNELS = [
  {
    id: 'email',
    label: 'Email',
    value: 'bhartiaaditya741@gmail.com',
    href: 'mailto:bhartiaaditya741@gmail.com',
    icon: 'mail' as const,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    value: '@udaanaviation',
    href: 'https://instagram.com',
    icon: 'instagram' as const,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    value: 'Udaan Aviation',
    href: 'https://linkedin.com',
    icon: 'linkedin' as const,
  },
];

/* ----------------------------------------------------------------------- */
/*  Small helpers                                                          */
/* ----------------------------------------------------------------------- */

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const currency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** Subtle cursor-reactive tilt + glare for cards. Motion is user-triggered
 *  (hover), so it stays inside the "answers a person's action" allowance. */
function useTilt<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  const onMove = useCallback((e: ReactMouseEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--tiltX', `${((0.5 - py) * 4.5).toFixed(2)}deg`);
    el.style.setProperty('--tiltY', `${((px - 0.5) * 6.5).toFixed(2)}deg`);
    el.style.setProperty('--glareX', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--glareY', `${(py * 100).toFixed(1)}%`);
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--tiltX', '0deg');
    el.style.setProperty('--tiltY', '0deg');
  }, []);

  return { ref, onMove, onLeave };
}

/* ----------------------------------------------------------------------- */
/*  Icons — hand-drawn line marks, kept to one weight and one grid          */
/* ----------------------------------------------------------------------- */

type IconProps = { className?: string };

function IconMenu({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconClose({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconArrow({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4.5 12h15M13 5.5l6.5 6.5-6.5 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheck({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4.5 12.5l5 5 10-11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDot({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 3" />
    </svg>
  );
}

function IconMail({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 6.5l7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconInstagram({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16.6" cy="7.4" r="0.9" fill="currentColor" />
    </svg>
  );
}

function IconLinkedin({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.3 10.2v6.1M8.3 7.9v.02M12 16.3v-3.6c0-1.4.8-2.3 2-2.3 1.1 0 1.8.8 1.8 2.3v3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDownload({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 4.5v10.5M8 11.5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 17.5v1.8c0 .66.54 1.2 1.2 1.2h12.6c.66 0 1.2-.54 1.2-1.2v-1.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconDrone({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <rect x="20" y="20" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20 20L9 9M28 20l11-11M20 28L9 39M28 28l11 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="40" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8" cy="40" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="40" cy="40" r="4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconFrame({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path d="M9 9h30v30H9z" stroke="currentColor" strokeWidth="1.6" strokeDasharray="4 3" />
      <circle cx="9" cy="9" r="2.4" fill="currentColor" />
      <circle cx="39" cy="9" r="2.4" fill="currentColor" />
      <circle cx="9" cy="39" r="2.4" fill="currentColor" />
      <circle cx="39" cy="39" r="2.4" fill="currentColor" />
      <circle cx="24" cy="24" r="5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconMotor({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="11" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="24" cy="24" r="3" fill="currentColor" />
      <path
        d="M24 13v-5M24 40v-5M35 24h5M8 24h5M31.8 16.2l3.5-3.5M12.7 35.3l3.5-3.5M31.8 31.8l3.5 3.5M12.7 12.7l3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IndianFlag({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 30 20"
      fill="none"
      className={className}
      role="img"
      aria-label="Flag of India"
      preserveAspectRatio="xMidYMid meet"
    >
      <path d="M0 0h30v6.667H0z" fill="#FF9933" />
      <path d="M0 6.667h30v6.666H0z" fill="#FFFFFF" />
      <path d="M0 13.333h30V20H0z" fill="#138808" />
      <circle cx="15" cy="10" r="1.9" stroke="#000080" strokeWidth="0.4" />
      {Array.from({ length: 24 }, (_, index) => (
        <line
          key={index}
          x1="15"
          y1="8.25"
          x2="15"
          y2="11.75"
          stroke="#000080"
          strokeWidth="0.22"
          transform={`rotate(${index * 15} 15 10)`}
        />
      ))}
      <circle cx="15" cy="10" r="0.35" fill="#000080" />
    </svg>
  );
}

function IconSignal({ className, level }: IconProps & { level: number }) {
  const bars = [4, 8, 12, 16];
  return (
    <svg viewBox="0 0 24 18" fill="none" className={className} aria-hidden="true">
      {bars.map((h, i) => (
        <rect
          key={h}
          x={i * 6}
          y={18 - h}
          width="3.4"
          height={h}
          rx="0.6"
          fill="currentColor"
          opacity={i < level ? 1 : 0.22}
        />
      ))}
    </svg>
  );
}

/* ----------------------------------------------------------------------- */
/*  Corner-frame — viewfinder marks reused across panels & cards            */
/* ----------------------------------------------------------------------- */

function CornerFrame({ tone = 'border-[#14181B]/18' }: { tone?: string }) {
  const base = `pointer-events-none absolute h-3 w-3 ${tone}`;
  return (
    <>
      <span className={`${base} left-0 top-0 border-l-2 border-t-2`} />
      <span className={`${base} right-0 top-0 border-r-2 border-t-2`} />
      <span className={`${base} left-0 bottom-0 border-l-2 border-b-2`} />
      <span className={`${base} right-0 bottom-0 border-r-2 border-b-2`} />
    </>
  );
}

/* ----------------------------------------------------------------------- */
/*  Section heading                                                         */
/* ----------------------------------------------------------------------- */

function SectionHeading({
  kicker,
  title,
  align = 'left',
}: {
  kicker: string;
  title: ReactNode;
  align?: 'left' | 'center';
}) {
  return (
    <div className={align === 'center' ? 'text-center' : 'text-left'}>
      <div className={`flex items-center gap-2 text-[13px] font-medium tracking-[0.01em] text-[#5B6058] ${align === 'center' ? 'justify-center' : ''}`}>
        <span className="h-[6px] w-[6px] rounded-full bg-[#E15B12]" />
        {kicker}
      </div>
      <h2 className="mt-3 text-[clamp(2.1rem,4.4vw,3.1rem)] leading-[1.05] text-[#14181B] [font-family:var(--font-display)] font-bold">
        {title}
      </h2>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Altitude indicator — a scroll-position readout, doubling as a subtle    */
/*  progress cue. Desktop only; keeps the instrument-panel idea going       */
/*  past the hero instead of adding a generic progress bar.                 */
/* ----------------------------------------------------------------------- */

function AltitudeIndicator({ progress }: { progress: number }) {
  return (
    <div className="pointer-events-none fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-2.5 xl:flex">
      <span className="text-[10px] tracking-[0.14em] text-[#5B6058]/70 [font-family:var(--font-mono)]" style={{ writingMode: 'vertical-rl' }}>
        SCROLL
      </span>
      <div className="relative h-36 w-px overflow-hidden bg-[#14181B]/14">
        <div
          className="absolute bottom-0 left-0 w-px bg-[#E15B12]"
          style={{ height: `${progress * 100}%`, transition: 'height 120ms linear' }}
        />
      </div>
      <span className="w-8 text-center text-[10px] tabular-nums text-[#5B6058]/70 [font-family:var(--font-mono)]">
        {String(Math.round(progress * 100)).padStart(2, '0')}%
      </span>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Modal shell                                                             */
/* ----------------------------------------------------------------------- */

function Modal({
  open,
  onClose,
  children,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#14181B]/45 backdrop-blur-[2px] p-0 sm:items-center sm:p-6 modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="relative w-full max-w-[440px] rounded-t-2xl sm:rounded-md bg-[#F6F6F1] border border-[#14181B]/12 shadow-[0_28px_70px_-18px_rgba(20,24,27,0.38)] modal-panel"
      >
        <CornerFrame tone="border-[#14181B]/14" />
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-[#14181B]/14 text-[#14181B] transition-colors duration-150 hover:bg-[#14181B]/6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E15B12] active:scale-95"
        >
          <IconClose className="h-4 w-4" />
        </button>
        <div className="p-7 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Firmware card — extracted so each instance owns its own tilt state      */
/* ----------------------------------------------------------------------- */

function FirmwareCard({
  product,
  onOrder,
  onNotify,
}: {
  product: FirmwareProduct;
  onOrder: (p: FirmwareProduct) => void;
  onNotify: (p: FirmwareProduct) => void;
}) {
  const { ref, onMove, onLeave } = useTilt<HTMLDivElement>();

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="tilt-card relative flex flex-col overflow-hidden rounded-[8px] border border-[#14181B]/12 bg-[#F6F6F1] p-8 shadow-[0_1px_0_rgba(20,24,27,0.04)] transition-shadow duration-300 hover:shadow-[0_30px_64px_-32px_rgba(20,24,27,0.45)]"
    >
      <span aria-hidden="true" className="tilt-glare pointer-events-none absolute inset-0" />
      <CornerFrame />
      <div className="flex items-start justify-between">
        <span
          className={`inline-flex rounded-[3px] px-2.5 py-1 text-[11px] font-semibold tracking-[0.03em] ${
            product.status === 'BEST SELLER'
              ? 'bg-[#E15B12] text-[#F6F6F1]'
              : 'border border-[#14181B]/25 text-[#4A4F47]'
          }`}
        >
          {product.status}
        </span>
        <div className="flex gap-1.5">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-[3px] border border-[#14181B]/14 px-2 py-1 text-[11px] text-[#5B6058] [font-family:var(--font-mono)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <h3 className="mt-6 text-[27px] font-bold leading-tight tracking-[-0.01em] [font-family:var(--font-display)]">
        {product.name}
      </h3>
      <p className="mt-1 text-[14px] text-[#5B6058]">{product.tagline}</p>
      <p className="mt-4 max-w-[42ch] text-[14.5px] leading-relaxed text-[#4A4F47]">
        {product.description}
      </p>

      <ul className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {product.features.map((f) => (
          <li key={f.label} className="flex items-center gap-2 text-[13.5px] text-[#3A3F38]">
            {f.active ? (
              <IconCheck className="h-3.5 w-3.5 flex-shrink-0 text-[#E15B12]" />
            ) : (
              <IconDot className="h-3.5 w-3.5 flex-shrink-0 text-[#9AA095]" />
            )}
            {f.label}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-end justify-between border-t border-[#14181B]/10 pt-6">
        <div>
          {product.priceFinal !== null ? (
            <div className="flex items-baseline gap-2.5">
              <span className="text-[13px] text-[#9AA095] line-through [font-family:var(--font-mono)]">
                {currency(product.priceOriginal)}
              </span>
              <span className="text-[29px] font-bold text-[#E15B12] [font-family:var(--font-display)]">
                FREE
              </span>
            </div>
          ) : (
            <div className="text-[19px] font-semibold [font-family:var(--font-display)]">
              {product.priceNote}
            </div>
          )}
          {product.priceFinal !== null && (
            <div className="mt-1 text-[12px] text-[#5B6058]">{product.priceNote}</div>
          )}
        </div>

        <button
          onClick={() => (product.action === 'order' ? onOrder(product) : onNotify(product))}
          className={`inline-flex items-center gap-2 rounded-[3px] px-5 py-3 text-[14px] font-medium transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98] ${
            product.action === 'order'
              ? 'bg-[#14181B] text-[#EDEEE6] shadow-[0_10px_24px_-12px_rgba(20,24,27,0.55)] hover:bg-[#22282C]'
              : 'border border-[#14181B]/25 text-[#14181B] hover:border-[#14181B]/50'
          }`}
        >
          {product.cta}
          <IconArrow className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Component card — same tilt treatment, part-specific illustration        */
/* ----------------------------------------------------------------------- */

function ComponentCard({ item, onOrder }: { item: ComponentItem; onOrder: () => void }) {
  const { ref, onMove, onLeave } = useTilt<HTMLDivElement>();
  const Icon = item.kind === 'frame' ? IconFrame : IconMotor;

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="tilt-card relative flex flex-col overflow-hidden rounded-[8px] border border-[#14181B]/12 bg-[#F6F6F1] p-7 shadow-[0_1px_0_rgba(20,24,27,0.04)] transition-shadow duration-300 hover:shadow-[0_24px_54px_-30px_rgba(20,24,27,0.4)]"
    >
      <span aria-hidden="true" className="tilt-glare pointer-events-none absolute inset-0" />
      <CornerFrame />
      {item.tag && (
        <span className="absolute right-6 top-6 rounded-[3px] bg-[#1F3448] px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.03em] text-[#EDEEE6]">
          {item.tag}
        </span>
      )}

      <div className="relative grid h-16 w-16 place-items-center rounded-[6px] border border-[#1F3448]/18 bg-[#1F3448]/[0.05]">
        <Icon className="h-9 w-9 text-[#1F3448]" />
        {item.kind === 'frame' && (
          <>
            <span className="absolute -left-2 top-1/2 hidden h-px w-2 -translate-y-1/2 bg-[#1F3448]/30 sm:block" />
            <span className="absolute -right-2 top-1/2 hidden h-px w-2 -translate-y-1/2 bg-[#1F3448]/30 sm:block" />
          </>
        )}
      </div>

      <h3 className="mt-6 text-[19px] font-semibold [font-family:var(--font-display)]">{item.name}</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-[#4A4F47]">{item.description}</p>

      <div className="mt-7 flex items-end justify-between border-t border-[#14181B]/10 pt-5">
        <div>
          <div className="text-[22px] font-bold [font-family:var(--font-display)]">{currency(item.price)}</div>
          <div className="text-[12px] text-[#5B6058]">+ shipping charges</div>
        </div>
        <button
          onClick={onOrder}
          className="inline-flex items-center gap-2 rounded-[3px] border border-[#14181B]/25 px-4 py-2.5 text-[13.5px] font-medium text-[#14181B] transition-colors duration-200 hover:border-[#14181B]/50 active:scale-[0.98]"
        >
          Order online
          <IconArrow className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Main page                                                               */
/* ----------------------------------------------------------------------- */

type ModalKind = 'order' | 'download' | 'comingSoon' | 'notify' | null;

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [modal, setModal] = useState<ModalKind>(null);
  const [activeFirmware, setActiveFirmware] = useState<FirmwareProduct | null>(null);

  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySent, setNotifySent] = useState(false);

  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const reduceMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );
  const [telemetry, setTelemetry] = useState({ alt: 118, batt: 87, sats: 11, sig: 4 });
  const [reticle, setReticle] = useState({ x: 50, y: 42, active: false });
  const [scrollProgress, setScrollProgress] = useState(0);

  const processRef = useRef<HTMLDivElement | null>(null);
  const [processVisible, setProcessVisible] = useState(false);

  /* header shadow + scroll progress */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      const h = document.documentElement;
      const scrollable = h.scrollHeight - h.clientHeight;
      setScrollProgress(scrollable > 0 ? clamp(window.scrollY / scrollable, 0, 1) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* telemetry tick */
  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setTelemetry((t) => ({
        alt: Math.round(clamp(t.alt + rand(-4, 4), 78, 162)),
        batt: Math.round(clamp(t.batt + rand(-1.4, 0.6), 22, 100)),
        sats: Math.round(clamp(t.sats + rand(-1, 1), 6, 14)),
        sig: Math.round(clamp(t.sig + rand(-0.6, 0.6), 2, 4)),
      }));
    }, 1900);
    return () => clearInterval(id);
  }, [reduceMotion]);

  /* process line reveal */
  useEffect(() => {
    const el = processRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setProcessVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const handleNavClick = useCallback((href: string) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleHeroMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 4, 96);
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 6, 94);
    setReticle({ x, y, active: true });
  };

  const openOrder = (product: FirmwareProduct) => {
    setActiveFirmware(product);
    setDownloaded(false);
    setDownloading(false);
    setModal('order');
  };

  const openNotify = (product: FirmwareProduct) => {
    setActiveFirmware(product);
    setNotifySent(false);
    setNotifyEmail('');
    setModal('notify');
  };

  const confirmOrder = () => {
    setDownloading(true);
    window.setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
      try {
        const blob = new Blob(
          ['Udaan Aviation — firmware placeholder binary.\nThis is a demo download for the redesigned page.'],
          { type: 'application/octet-stream' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'udaan_flight_controller_v1.bin';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        /* no-op: environment may block programmatic downloads */
      }
      setModal('download');
    }, 900);
  };

  const submitNotify = (e: FormEvent) => {
    e.preventDefault();
    if (!notifyEmail) return;
    setNotifySent(true);
  };

  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen bg-[#EDEEE6] text-[#14181B] antialiased`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <GlobalStyle />

      {/* fine paper-grain texture over the whole page — keeps flat colors
          from feeling like plastic swatches */}
      <div aria-hidden="true" className="grain-overlay pointer-events-none fixed inset-0 z-[1]" />

      <AltitudeIndicator progress={scrollProgress} />

      {/* ---------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ---------------------------------------------------------------- */}
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300 ${
          scrolled
            ? 'border-[#14181B]/12 bg-[#EDEEE6]/92 shadow-[0_1px_0_rgba(20,24,27,0.06)] backdrop-blur'
            : 'border-transparent bg-[#EDEEE6]/0'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <a href="#home" onClick={(e) => { e.preventDefault(); handleNavClick('#home'); }} className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[4px] bg-[#14181B] text-[#EDEEE6]">
              <IconDrone className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[15px] font-semibold tracking-[0.01em] [font-family:var(--font-display)]">
              UDAAN AVIATION
            </span>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="relative text-[14px] text-[#3A3F38] transition-colors hover:text-[#14181B] nav-link"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavClick('#firmware')}
              className="hidden items-center gap-2 rounded-[3px] bg-[#14181B] px-5 py-2.5 text-[13.5px] font-medium text-[#EDEEE6] shadow-[0_10px_24px_-14px_rgba(20,24,27,0.6)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#22282C] active:translate-y-0 active:scale-[0.98] sm:inline-flex"
            >
              Shop now
              <IconArrow className="h-3.5 w-3.5" />
            </button>
            <button
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-[3px] border border-[#14181B]/14 text-[#14181B] transition-colors duration-150 hover:bg-[#14181B]/6 lg:hidden"
            >
              {menuOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-[#14181B]/10 bg-[#EDEEE6] px-5 pb-6 pt-2 lg:hidden">
            <nav className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }}
                  className="border-b border-[#14181B]/8 py-3.5 text-[15px] text-[#14181B]"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <button
              onClick={() => handleNavClick('#firmware')}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[3px] bg-[#14181B] px-5 py-3 text-[14px] font-medium text-[#EDEEE6] active:scale-[0.98]"
            >
              Shop now
              <IconArrow className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section id="home" className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-[0.5]" />
        <div className="mx-auto grid max-w-[1200px] gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr,0.95fr] lg:items-center lg:gap-10">
          {/* Copy */}
          <div className="relative z-10">
            <div className="hero-in hero-in-1 inline-flex items-center gap-2 rounded-[3px] border border-[#14181B]/14 bg-[#F6F6F1] px-3 py-1.5 text-[12.5px] text-[#3A3F38]">
              <IndianFlag className="h-3.5 w-5 rounded-[1px] border border-[#14181B]/15" />
              Made in India
            </div>

            <h1 className="hero-in hero-in-2 mt-6 text-[clamp(2.9rem,7vw,5.2rem)] font-bold leading-[0.97] tracking-[-0.015em] [font-family:var(--font-display)]">
              Fly beyond
              <br />
              <span className="text-[#E15B12]">limits.</span>
            </h1>

            <p className="hero-in hero-in-3 mt-6 max-w-[46ch] text-[16.5px] leading-relaxed text-[#4A4F47]">
              Professional-grade drone firmware and precision 3D-printed airframes.
              Designed by engineers, flight-tested by pilots, built end-to-end in India.
            </p>

            <div className="hero-in hero-in-4 mt-9 flex flex-wrap items-center gap-4">
              <button
                onClick={() => handleNavClick('#firmware')}
                className="group inline-flex items-center gap-2 rounded-[3px] bg-[#14181B] px-6 py-3.5 text-[14.5px] font-medium text-[#EDEEE6] shadow-[0_16px_34px_-16px_rgba(20,24,27,0.55)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#22282C] active:translate-y-0 active:scale-[0.98]"
              >
                Shop firmware
                <IconArrow className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => handleNavClick('#components')}
                className="inline-flex items-center gap-2 rounded-[3px] border border-[#14181B]/22 px-6 py-3.5 text-[14.5px] font-medium text-[#14181B] transition-colors duration-200 hover:border-[#14181B]/45 active:scale-[0.98]"
              >
                View drone components
              </button>
            </div>

            <div className="hero-in hero-in-5 mt-12 grid max-w-[420px] grid-cols-3 gap-5 border-t border-[#14181B]/12 pt-6">
              <div>
                <div className="text-[26px] font-bold text-[#E15B12] [font-family:var(--font-display)]">FREE</div>
                <div className="mt-1 text-[12.5px] text-[#5B6058]">Firmware, early access</div>
              </div>
              <div>
                <div className="text-[26px] font-bold [font-family:var(--font-display)]">₹299</div>
                <div className="mt-1 text-[12.5px] text-[#5B6058]">Frame price</div>
              </div>
              <div>
                <div className="text-[26px] font-bold [font-family:var(--font-display)]">ESP32</div>
                <div className="mt-1 text-[12.5px] text-[#5B6058]">Compatible</div>
              </div>
            </div>
          </div>

          {/* HUD mockup panel */}
          <div
            className="hero-in hero-in-3 relative"
            onMouseMove={handleHeroMouseMove}
            onMouseLeave={() => setReticle((r) => ({ ...r, active: false }))}
          >
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-[8px] border border-[#14181B]/16 bg-[#14181B]">
              <CornerFrame tone="border-[#EDEEE6]/45" />
              <div className="blueprint-grid-dark pointer-events-none absolute inset-0 opacity-40" />

              {/* flight-plan overlay — draws in once on load, then rests */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 100 125"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M13 100 C 30 80, 24 54, 45 47 S 80 36, 89 15"
                  fill="none"
                  stroke="#E15B12"
                  strokeWidth="0.55"
                  strokeDasharray="1.1 1.6"
                  strokeLinecap="round"
                  pathLength={1}
                  className={reduceMotion ? '' : 'flight-path'}
                  style={reduceMotion ? { strokeDashoffset: 0, opacity: 0.85 } : undefined}
                />
                <circle cx="13" cy="100" r="1.5" fill="#EDEEE6" className={reduceMotion ? '' : 'waypoint wp-1'} style={reduceMotion ? { opacity: 1 } : undefined} />
                <circle cx="45" cy="47" r="1.5" fill="#EDEEE6" className={reduceMotion ? '' : 'waypoint wp-2'} style={reduceMotion ? { opacity: 1 } : undefined} />
                <circle cx="89" cy="15" r="1.5" fill="#E15B12" className={reduceMotion ? '' : 'waypoint wp-3'} style={reduceMotion ? { opacity: 1 } : undefined} />
              </svg>

              {/* reticle */}
              <div
                className="pointer-events-none absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-150 ease-out"
                style={{ left: `${reticle.x}%`, top: `${reticle.y}%`, opacity: reticle.active ? 1 : 0.45 }}
              >
                <div className="relative h-full w-full">
                  <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-[#E15B12]" />
                  <span className="absolute left-1/2 bottom-0 h-3 w-px -translate-x-1/2 bg-[#E15B12]" />
                  <span className="absolute top-1/2 left-0 h-px w-3 -translate-y-1/2 bg-[#E15B12]" />
                  <span className="absolute top-1/2 right-0 h-px w-3 -translate-y-1/2 bg-[#E15B12]" />
                  <span className="absolute inset-[10px] rounded-full border border-[#E15B12]/70" />
                </div>
              </div>

              {/* drone glyph */}
              <div className="absolute inset-0 grid place-items-center">
                <IconDrone className={`h-28 w-28 text-[#EDEEE6]/85 ${reduceMotion ? '' : 'drone-float'}`} />
              </div>

              {/* telemetry readout */}
              <div className="absolute inset-x-3 bottom-3 rounded-[4px] border border-[#EDEEE6]/16 bg-[#EDEEE6]/[0.06] px-4 py-3.5 backdrop-blur-[1px]">
                <div className="flex items-center justify-between text-[10.5px] uppercase tracking-[0.14em] text-[#EDEEE6]/55">
                  <span>Flight telemetry</span>
                  <span className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full bg-[#E15B12] ${reduceMotion ? '' : 'telemetry-pulse'}`} />
                    Live
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-3 [font-family:var(--font-mono)] text-[#EDEEE6]">
                  <div>
                    <div className="text-[15px] leading-none">{telemetry.alt}<span className="text-[10px] text-[#EDEEE6]/50">m</span></div>
                    <div className="mt-1 text-[9.5px] text-[#EDEEE6]/45">ALT</div>
                  </div>
                  <div>
                    <div className="text-[15px] leading-none">{telemetry.batt}<span className="text-[10px] text-[#EDEEE6]/50">%</span></div>
                    <div className="mt-1 text-[9.5px] text-[#EDEEE6]/45">BATT</div>
                  </div>
                  <div>
                    <div className="text-[15px] leading-none">{telemetry.sats}</div>
                    <div className="mt-1 text-[9.5px] text-[#EDEEE6]/45">SATS</div>
                  </div>
                  <div>
                    <IconSignal level={Math.round(telemetry.sig)} className="h-4 w-6 text-[#EDEEE6]" />
                    <div className="mt-1 text-[9.5px] text-[#EDEEE6]/45">SIGNAL</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleNavClick('#about')}
          className="group absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[11.5px] uppercase tracking-[0.16em] text-[#5B6058] sm:flex"
        >
          Scroll
          <span className="relative h-8 w-px overflow-hidden bg-[#14181B]/15">
            <span className={`absolute inset-x-0 top-0 h-3 bg-[#E15B12] ${reduceMotion ? '' : 'scroll-tick'}`} />
          </span>
        </button>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* About                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section id="about" className="border-t border-[#14181B]/10 bg-[#E5E6DC] py-24 sm:py-28">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <SectionHeading kicker="Who we are" title={<>Crafted with passion,<br />engineered for precision</>} />

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-[8px] border border-[#14181B]/12 bg-[#F6F6F1] p-8 shadow-[0_1px_0_rgba(20,24,27,0.04)] transition-shadow duration-300 hover:shadow-[0_18px_44px_-26px_rgba(20,24,27,0.35)]">
              <CornerFrame />
              <div className="relative grid h-16 w-16 place-items-center rounded-[6px] border border-[#E15B12]/25 bg-[#E15B12]/[0.06]">
                <IconFrame className="h-9 w-9 text-[#E15B12]" />
              </div>
              <h3 className="mt-6 text-[21px] font-semibold [font-family:var(--font-display)]">Drone frames &amp; components</h3>
              <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[#4A4F47]">
                Premium 3D-printed drone frames engineered for aerodynamic efficiency, durability,
                and easy assembly — available in three configurations.
              </p>
              <div className="mt-6 flex items-center gap-4 border-t border-[#14181B]/10 pt-5 text-[12px] text-[#5B6058] [font-family:var(--font-mono)]">
                <span>PLA + PETG</span>
                <span className="h-3 w-px bg-[#14181B]/15" />
                <span>8520 coreless mount</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[8px] border border-[#14181B]/12 bg-[#F6F6F1] p-8 shadow-[0_1px_0_rgba(20,24,27,0.04)] transition-shadow duration-300 hover:shadow-[0_18px_44px_-26px_rgba(20,24,27,0.35)]">
              <CornerFrame />
              <IndianFlag className="h-16 w-16 rounded-[6px] border border-[#14181B]/15" />
              <h3 className="mt-6 text-[21px] font-semibold [font-family:var(--font-display)]">Made in India</h3>
              <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[#4A4F47]">
                Proudly built in India. We design, print, code, and test every product
                in-house, end to end, to hold one consistent quality bar.
              </p>
              <div className="mt-6 flex items-center gap-4 border-t border-[#14181B]/10 pt-5 text-[12px] text-[#5B6058] [font-family:var(--font-mono)]">
                <span>Design → print → test</span>
                <span className="h-3 w-px bg-[#14181B]/15" />
                <span>One team, one bar</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Firmware store                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section id="firmware" className="border-t border-[#14181B]/10 py-24 sm:py-28">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading kicker="Firmware store" title="Our firmware products" />
            <div className="flex items-center gap-2.5 rounded-[3px] border border-[#1F3448]/25 bg-[#1F3448]/[0.06] px-4 py-2.5 text-[13px] text-[#1F3448]">
              <IconDownload className="h-4 w-4" />
              Early access — download instantly, no payment needed
            </div>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {FIRMWARE.map((product) => (
              <FirmwareCard key={product.id} product={product} onOrder={openOrder} onNotify={openNotify} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Components                                                        */}
      {/* ---------------------------------------------------------------- */}
      <section id="components" className="border-t border-[#14181B]/10 bg-[#E5E6DC] py-24 sm:py-28">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <SectionHeading kicker="Parts &amp; accessories" title="Drone components" />
          <p className="mt-5 max-w-[56ch] text-[15px] leading-relaxed text-[#4A4F47]">
            Premium 3D-printed airframes and essential electronic components for your custom builds.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {COMPONENTS.map((c) => (
              <ComponentCard key={c.id} item={c} onOrder={() => setModal('comingSoon')} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Process                                                           */}
      {/* ---------------------------------------------------------------- */}
      <section id="process" className="border-t border-[#14181B]/10 py-24 sm:py-28" ref={processRef}>
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <SectionHeading kicker="Process" title={<>Get your firmware in<br />three simple steps</>} />

          <div className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
            <svg
              className="pointer-events-none absolute left-0 right-0 top-[26px] hidden h-px w-full md:block"
              viewBox="0 0 100 1"
              preserveAspectRatio="none"
            >
              <line
                x1="16" y1="0.5" x2="84" y2="0.5"
                stroke="#14181B" strokeOpacity="0.16" strokeWidth="0.5"
              />
              <line
                x1="16" y1="0.5" x2="84" y2="0.5"
                stroke="#E15B12" strokeWidth="0.7"
                strokeDasharray="70"
                strokeDashoffset={processVisible ? 0 : 70}
                style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.65,0,0.2,1)' }}
              />
            </svg>

            {PROCESS_STEPS.map((step) => (
              <div key={step.n} className="relative">
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[#14181B]/16 bg-[#EDEEE6] text-[15px] font-semibold [font-family:var(--font-mono)]">
                  {step.n}
                </div>
                <h3 className="mt-5 text-[19px] font-semibold [font-family:var(--font-display)]">{step.title}</h3>
                <p className="mt-2.5 max-w-[38ch] text-[14.5px] leading-relaxed text-[#4A4F47]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Contact                                                           */}
      {/* ---------------------------------------------------------------- */}
      <section id="contact" className="border-t border-[#14181B]/10 bg-[#14181B] py-24 text-[#EDEEE6] sm:py-28">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[#EDEEE6]/60">
            <span className="h-[6px] w-[6px] rounded-full bg-[#E15B12]" />
            Get in touch
          </div>
          <h2 className="mt-3 text-[clamp(2.1rem,4.4vw,3.1rem)] font-bold leading-[1.05] [font-family:var(--font-display)]">
            Have questions?
          </h2>
          <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-[#EDEEE6]/65">
            We&apos;re here to help with any queries about our firmware, frames, or custom builds.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {CONTACT_CHANNELS.map((c) => {
              const Icon = c.icon === 'mail' ? IconMail : c.icon === 'instagram' ? IconInstagram : IconLinkedin;
              return (
                <a
                  key={c.id}
                  href={c.href}
                  target={c.icon === 'mail' ? undefined : '_blank'}
                  rel="noreferrer"
                  className="group relative flex items-center justify-between overflow-hidden rounded-[8px] border border-[#EDEEE6]/14 p-6 transition-colors duration-200 hover:border-[#E15B12]/60 hover:bg-[#EDEEE6]/[0.03]"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="grid h-10 w-10 place-items-center rounded-[4px] border border-[#EDEEE6]/16">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div>
                      <div className="text-[14.5px] font-medium">{c.label}</div>
                      <div className="text-[12.5px] text-[#EDEEE6]/50">{c.value}</div>
                    </div>
                  </div>
                  <IconArrow className="h-4 w-4 text-[#EDEEE6]/40 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#E15B12]" />
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Footer                                                            */}
      {/* ---------------------------------------------------------------- */}
      <footer className="bg-[#14181B] pb-10 pt-2 text-[#EDEEE6]">
        <div className="mx-auto max-w-[1200px] border-t border-[#EDEEE6]/10 px-5 pt-10 sm:px-8">
          <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
            <div className="max-w-[34ch]">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-[4px] border border-[#EDEEE6]/20">
                  <IconDrone className="h-[18px] w-[18px]" />
                </span>
                <span className="text-[14px] font-semibold [font-family:var(--font-display)]">UDAAN AVIATION</span>
              </div>
              <p className="mt-4 text-[13.5px] leading-relaxed text-[#EDEEE6]/55">
                Building the future of flight, one drone at a time.
              </p>
            </div>

            <nav className="grid grid-cols-2 gap-x-10 gap-y-3 text-[13.5px] text-[#EDEEE6]/65 sm:flex sm:gap-8">
              {NAV_LINKS.filter((l) => l.label !== 'How It Works').map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }}
                  className="transition-colors hover:text-[#EDEEE6]"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-[#EDEEE6]/10 pt-6 text-[12.5px] text-[#EDEEE6]/45 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Udaan Aviation. All rights reserved.</span>
            <span className="[font-family:var(--font-mono)]">Designed &amp; built in India</span>
          </div>
        </div>
      </footer>

      {/* ---------------------------------------------------------------- */}
      {/* Modal: order summary                                             */}
      {/* ---------------------------------------------------------------- */}
      <Modal open={modal === 'order'} onClose={() => setModal(null)} labelledBy="order-title">
        {activeFirmware && (
          <>
            <div className="flex items-center gap-2 text-[12.5px] uppercase tracking-[0.12em] text-[#5B6058]">
              <IconFrame className="h-4 w-4 text-[#E15B12]" />
              Order summary
            </div>
            <h3 id="order-title" className="mt-2 text-[22px] font-bold [font-family:var(--font-display)]">
              Udaan Aviation
            </h3>

            <div className="mt-6 space-y-3 border-t border-[#14181B]/10 pt-5 [font-family:var(--font-mono)] text-[14px]">
              <div className="flex items-center justify-between text-[#3A3F38]">
                <span>{activeFirmware.name} — {activeFirmware.tagline}</span>
                <span>{currency(activeFirmware.priceOriginal)}</span>
              </div>
              <div className="flex items-center justify-between text-[#E15B12]">
                <span>Early access discount</span>
                <span>−{currency(activeFirmware.priceOriginal)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[#14181B]/10 pt-3 text-[16px] font-semibold text-[#14181B]">
                <span>Total</span>
                <span>₹0</span>
              </div>
            </div>

            <div className="mt-5 rounded-[4px] border border-[#1F3448]/20 bg-[#1F3448]/[0.06] px-4 py-3 text-[13px] text-[#1F3448]">
              You got it for free — no payment required.
            </div>

            <button
              onClick={confirmOrder}
              disabled={downloading}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-[3px] bg-[#14181B] px-5 py-3.5 text-[14.5px] font-medium text-[#EDEEE6] transition-colors duration-200 hover:bg-[#22282C] disabled:opacity-60 active:scale-[0.98]"
            >
              {downloading ? 'Preparing download…' : 'Continue & download'}
              {!downloading && <IconArrow className="h-4 w-4" />}
            </button>
          </>
        )}
      </Modal>

      {/* ---------------------------------------------------------------- */}
      {/* Modal: download success                                          */}
      {/* ---------------------------------------------------------------- */}
      <Modal open={modal === 'download'} onClose={() => setModal(null)} labelledBy="download-title">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-[#E15B12]/12 text-[#E15B12]">
          <IconCheck className="h-6 w-6" />
        </div>
        <h3 id="download-title" className="mt-5 text-[21px] font-bold leading-tight [font-family:var(--font-display)]">
          Firmware downloaded successfully
        </h3>
        <p className="mt-2.5 text-[14px] leading-relaxed text-[#4A4F47]">
          {downloaded ? 'Your download has started automatically.' : 'Preparing your file…'}
        </p>

        <div className="mt-6 flex items-center justify-between rounded-[4px] border border-[#14181B]/14 bg-[#EDEEE6] px-4 py-3.5">
          <span className="flex items-center gap-2 text-[13.5px] [font-family:var(--font-mono)]">
            <IconDownload className="h-4 w-4 text-[#E15B12]" />
            udaan_flight_controller_v1.bin
          </span>
        </div>

        <p className="mt-5 text-[13px] text-[#5B6058]">
          Didn&apos;t start automatically? Support:{' '}
          <a href="mailto:bhartiaaditya741@gmail.com" className="text-[#14181B] underline underline-offset-2">
            bhartiaaditya741@gmail.com
          </a>
        </p>

        <button
          onClick={() => setModal(null)}
          className="mt-7 inline-flex w-full items-center justify-center rounded-[3px] border border-[#14181B]/20 px-5 py-3 text-[14px] font-medium text-[#14181B] transition-colors hover:border-[#14181B]/45 active:scale-[0.98]"
        >
          Done
        </button>
      </Modal>

      {/* ---------------------------------------------------------------- */}
      {/* Modal: coming soon (components)                                  */}
      {/* ---------------------------------------------------------------- */}
      <Modal open={modal === 'comingSoon'} onClose={() => setModal(null)} labelledBy="soon-title">
        <div className="text-[12.5px] uppercase tracking-[0.12em] text-[#5B6058]">Online orders</div>
        <h3 id="soon-title" className="mt-2 text-[21px] font-bold leading-tight [font-family:var(--font-display)]">
          Checkout is coming soon
        </h3>
        <p className="mt-3 text-[14.5px] leading-relaxed text-[#4A4F47]">
          Our e-commerce checkout for drone frames is still under development. Reach out directly
          to place an order — we typically respond within 24 hours.
        </p>

        <div className="mt-6 space-y-2.5">
          {CONTACT_CHANNELS.map((c) => {
            const Icon = c.icon === 'mail' ? IconMail : c.icon === 'instagram' ? IconInstagram : IconLinkedin;
            return (
              <a
                key={c.id}
                href={c.href}
                target={c.icon === 'mail' ? undefined : '_blank'}
                rel="noreferrer"
                className="flex items-center justify-between rounded-[4px] border border-[#14181B]/14 px-4 py-3 transition-colors hover:border-[#14181B]/35"
              >
                <span className="flex items-center gap-2.5 text-[13.5px] text-[#14181B]">
                  <Icon className="h-4 w-4" />
                  {c.icon === 'mail' ? 'Email us' : `DM on ${c.label}`}
                </span>
                <IconArrow className="h-3.5 w-3.5 text-[#5B6058]" />
              </a>
            );
          })}
        </div>

        <p className="mt-5 text-[12.5px] text-[#5B6058]">
          ₹299 per frame · made to order · delivered across India.
        </p>
      </Modal>

      {/* ---------------------------------------------------------------- */}
      {/* Modal: notify me                                                 */}
      {/* ---------------------------------------------------------------- */}
      <Modal open={modal === 'notify'} onClose={() => setModal(null)} labelledBy="notify-title">
        {activeFirmware && !notifySent && (
          <>
            <div className="text-[12.5px] uppercase tracking-[0.12em] text-[#5B6058]">Coming soon</div>
            <h3 id="notify-title" className="mt-2 text-[21px] font-bold leading-tight [font-family:var(--font-display)]">
              Get notified — {activeFirmware.name}
            </h3>
            <p className="mt-3 text-[14.5px] leading-relaxed text-[#4A4F47]">
              Leave your email and we&apos;ll let you know the moment {activeFirmware.tagline.toLowerCase()} ships.
            </p>

            <form onSubmit={submitNotify} className="mt-6">
              <label htmlFor="notify-email" className="text-[12.5px] text-[#5B6058]">
                Email address
              </label>
              <input
                id="notify-email"
                type="email"
                required
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-[4px] border border-[#14181B]/18 bg-[#EDEEE6] px-4 py-3 text-[14px] text-[#14181B] outline-none transition-colors focus:border-[#E15B12]"
              />
              <button
                type="submit"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[3px] bg-[#14181B] px-5 py-3.5 text-[14.5px] font-medium text-[#EDEEE6] transition-colors hover:bg-[#22282C] active:scale-[0.98]"
              >
                Notify me
                <IconArrow className="h-4 w-4" />
              </button>
            </form>
          </>
        )}

        {notifySent && activeFirmware && (
          <>
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#E15B12]/12 text-[#E15B12]">
              <IconCheck className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-[21px] font-bold leading-tight [font-family:var(--font-display)]">
              You&apos;re on the list
            </h3>
            <p className="mt-2.5 text-[14px] leading-relaxed text-[#4A4F47]">
              We&apos;ll email {notifyEmail} as soon as {activeFirmware.name} is ready to ship.
            </p>
            <button
              onClick={() => setModal(null)}
              className="mt-7 inline-flex w-full items-center justify-center rounded-[3px] border border-[#14181B]/20 px-5 py-3 text-[14px] font-medium text-[#14181B] transition-colors hover:border-[#14181B]/45 active:scale-[0.98]"
            >
              Done
            </button>
          </>
        )}
      </Modal>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Global style — tokens, grid texture, keyframes                          */
/* ----------------------------------------------------------------------- */

function GlobalStyle() {
  return (
    <style jsx global>{`
      :root {
        --paper: #edeee6;
        --panel: #f6f6f1;
        --ink: #14181b;
        --ink-soft: #5b6058;
        --accent: #e15b12;
        --navy: #1f3448;
      }

      html {
        scroll-behavior: smooth;
      }

      ::selection {
        background: rgba(225, 91, 18, 0.22);
        color: var(--ink);
      }

      :focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }

      .blueprint-grid {
        background-image:
          linear-gradient(to right, rgba(20, 24, 27, 0.055) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(20, 24, 27, 0.055) 1px, transparent 1px);
        background-size: 42px 42px;
        mask-image: radial-gradient(ellipse 80% 70% at 50% 20%, #000 40%, transparent 90%);
      }

      .blueprint-grid-dark {
        background-image:
          linear-gradient(to right, rgba(237, 238, 230, 0.09) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(237, 238, 230, 0.09) 1px, transparent 1px);
        background-size: 24px 24px;
      }

      .grain-overlay {
        opacity: 0.035;
        mix-blend-mode: multiply;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      }

      .nav-link::after {
        content: '';
        position: absolute;
        left: 0;
        right: 100%;
        bottom: -6px;
        height: 1.5px;
        background: var(--accent);
        transition: right 0.25s ease;
      }
      .nav-link:hover::after {
        right: 0;
      }

      /* card tilt + glare — driven by --tiltX/--tiltY/--glareX/--glareY,
         set from JS on mousemove; rests at 0 with a spring-out transition */
      .tilt-card {
        --tiltX: 0deg;
        --tiltY: 0deg;
        --glareX: 50%;
        --glareY: 50%;
        transform: perspective(1000px) rotateX(var(--tiltX)) rotateY(var(--tiltY));
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        will-change: transform;
      }
      .tilt-card:hover {
        transition: transform 0.06s linear;
      }
      .tilt-glare {
        opacity: 0;
        background: radial-gradient(480px circle at var(--glareX) var(--glareY), rgba(225, 91, 18, 0.09), transparent 62%);
        transition: opacity 0.3s ease;
      }
      .tilt-card:hover .tilt-glare {
        opacity: 1;
      }

      @keyframes heroReveal {
        from {
          opacity: 0;
          transform: translateY(14px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .hero-in {
        opacity: 0;
        animation: heroReveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .hero-in-1 { animation-delay: 0.05s; }
      .hero-in-2 { animation-delay: 0.16s; }
      .hero-in-3 { animation-delay: 0.28s; }
      .hero-in-4 { animation-delay: 0.4s; }
      .hero-in-5 { animation-delay: 0.5s; }

      @keyframes droneFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      .drone-float {
        animation: droneFloat 4.5s ease-in-out infinite;
      }

      @keyframes telemetryPulse {
        0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(225, 91, 18, 0.5); }
        50% { opacity: 0.55; }
      }
      .telemetry-pulse {
        animation: telemetryPulse 1.8s ease-in-out infinite;
      }

      @keyframes scrollTick {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(200%); }
      }
      .scroll-tick {
        animation: scrollTick 1.8s ease-in-out infinite;
      }

      /* flight-plan draw-in: one orchestrated moment, not a loop */
      @keyframes pathDraw {
        to { stroke-dashoffset: 0; }
      }
      .flight-path {
        stroke-dashoffset: 1;
        animation: pathDraw 1.7s cubic-bezier(0.65, 0, 0.2, 1) 1.05s forwards;
      }
      @keyframes waypointIn {
        from { opacity: 0; transform: scale(0.3); }
        to { opacity: 1; transform: scale(1); }
      }
      .waypoint {
        opacity: 0;
        transform-origin: center;
        transform-box: fill-box;
        animation: waypointIn 0.45s ease forwards;
      }
      .wp-1 { animation-delay: 1.1s; }
      .wp-2 { animation-delay: 1.85s; }
      .wp-3 { animation-delay: 2.55s; }

      @keyframes modalIn {
        from { opacity: 0; transform: translateY(10px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .modal-panel {
        animation: modalIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      @keyframes backdropIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .modal-backdrop {
        animation: backdropIn 0.2s ease forwards;
      }

      @media (prefers-reduced-motion: reduce) {
        html { scroll-behavior: auto; }
        .hero-in, .drone-float, .telemetry-pulse, .scroll-tick,
        .modal-panel, .modal-backdrop, .flight-path, .waypoint,
        .tilt-card {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
          transition: none !important;
        }
      }
    `}</style>
  );
}