import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppCustomization } from '../types';

export const TemaCircleLogo: React.FC<{
  size?: number;
  className?: string;
  customization?: AppCustomization;
}> = ({ size = 74, className = '', customization }) => {
  const logoType = customization?.logoType || 'letter';
  const letter = customization?.logoLetter || 'T';
  const imageUrl = customization?.logoImageUrl;
  const bgColor = customization?.logoBgColor || '#1877F2';
  const textColor = customization?.logoTextColor || '#FFFFFF';

  if (logoType === 'image' && imageUrl) {
    return (
      <div
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`rounded-full overflow-hidden shadow-sm select-none border border-slate-200 flex items-center justify-center bg-white ${className}`}
      >
        <img src={imageUrl} alt="App Logo" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: bgColor,
        color: textColor,
      }}
      className={`rounded-full flex items-center justify-center shadow-sm select-none transition-colors ${className}`}
    >
      <span className="font-bold text-[38px] leading-none tracking-tight font-sans">
        {letter}
      </span>
    </div>
  );
};

export const MetaInfinityLogo: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-5 h-5',
  color = '#0064e0',
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ color }}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12.0003 14.28C10.6603 15.68 9.32031 16.5 7.85031 16.5C5.23031 16.5 3.33031 14.48 3.33031 11.96C3.33031 9.45 5.23031 7.5 7.85031 7.5C9.32031 7.5 10.6603 8.32 12.0003 9.72C13.3403 8.32 14.6803 7.5 16.1503 7.5C18.7703 7.5 20.6703 9.45 20.6703 11.96C20.6703 14.48 18.7703 16.5 16.1503 16.5C14.6803 16.5 13.3403 15.68 12.0003 14.28ZM12.0003 11.66C11.0203 10.28 9.94031 9.38 7.85031 9.38C6.27031 9.38 5.17031 10.51 5.17031 11.96C5.17031 13.41 6.27031 14.62 7.85031 14.62C9.94031 14.62 11.0203 13.72 12.0003 12.34C12.9803 13.72 14.0603 14.62 16.1503 14.62C17.7303 14.62 18.8303 13.41 18.8303 11.96C18.8303 10.51 17.7303 9.38 16.1503 9.38C14.0603 9.38 12.9803 10.28 12.0003 11.66Z" />
    </svg>
  );
};

export const TemaFooterBrand: React.FC<{
  className?: string;
  customization?: AppCustomization;
  onHoldAdmin?: () => void;
  holdSeconds?: number;
}> = ({ className = '', customization, onHoldAdmin, holdSeconds = 15 }) => {
  const brandName = customization?.footerBrandName ?? 'Tema';
  const iconType = customization?.footerBrandIconType ?? 'meta';
  const customIconText = customization?.footerBrandIconText ?? '∞';
  const customImageUrl = customization?.footerBrandImageUrl;
  const color = customization?.footerBrandColor ?? '#0064e0';

  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdStartTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const triggeredRef = useRef(false);

  const stopHold = useCallback(() => {
    setIsHolding(false);
    setProgress(0);
    holdStartTimeRef.current = null;
    triggeredRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const startHold = useCallback((e?: React.SyntheticEvent) => {
    if (!onHoldAdmin) return;
    if (e && 'touches' in e && (e as unknown as TouchEvent).touches && (e as unknown as TouchEvent).touches.length > 1) return;

    setIsHolding(true);
    setProgress(0);
    triggeredRef.current = false;
    const startTime = Date.now();
    holdStartTimeRef.current = startTime;
    const targetDurationMs = holdSeconds * 1000;

    const tick = () => {
      if (!holdStartTimeRef.current) return;
      const elapsed = Date.now() - holdStartTimeRef.current;
      const currentPct = Math.min(100, (elapsed / targetDurationMs) * 100);
      setProgress(currentPct);

      if (elapsed >= targetDurationMs && !triggeredRef.current) {
        triggeredRef.current = true;
        stopHold();
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([70, 50, 100]);
          }
        } catch (_) {}
        onHoldAdmin();
      } else {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [holdSeconds, onHoldAdmin, stopHold]);

  // Window-level safety cleanup so lifting finger or cursor anywhere stops hold cleanly
  useEffect(() => {
    if (!isHolding) return;

    const handleWindowEnd = () => {
      stopHold();
    };

    window.addEventListener('mouseup', handleWindowEnd);
    window.addEventListener('touchend', handleWindowEnd);
    window.addEventListener('touchcancel', handleWindowEnd);

    return () => {
      window.removeEventListener('mouseup', handleWindowEnd);
      window.removeEventListener('touchend', handleWindowEnd);
      window.removeEventListener('touchcancel', handleWindowEnd);
    };
  }, [isHolding, stopHold]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      onMouseDown={startHold}
      onMouseUp={stopHold}
      onMouseLeave={stopHold}
      onTouchStart={startHold}
      onTouchEnd={stopHold}
      onTouchCancel={stopHold}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        WebkitTouchCallout: 'none',
        userSelect: 'none',
      }}
      className={`relative inline-flex flex-col items-center justify-center cursor-pointer select-none py-1.5 px-3 transition-transform ${
        isHolding ? 'scale-[0.98] opacity-90' : 'active:opacity-90'
      } ${className}`}
    >
      <div className="flex items-center justify-center gap-1.5 pointer-events-none">
        {iconType === 'image' && customImageUrl ? (
          <img src={customImageUrl} alt={brandName} className="w-5 h-5 object-contain pointer-events-none" />
        ) : iconType === 'custom_text' ? (
          <span style={{ color }} className="text-lg font-bold leading-none pointer-events-none">
            {customIconText}
          </span>
        ) : (
          <MetaInfinityLogo className="w-5 h-5 pointer-events-none" color={color} />
        )}
        <span className="text-[#1c1e21] font-semibold text-[17px] tracking-tight pointer-events-none">
          {brandName}
        </span>
      </div>

      {/* Discreet 15-second hold progress bar - only appears while actively pressing and holding */}
      {isHolding && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-200/80 rounded-full overflow-hidden shadow-xs">
          <div
            className="h-full bg-[#0064e0] rounded-full transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
