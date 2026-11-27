/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT_VT.LOGO
TAG: LEEWAY.AGENT_VT.ROTATING_LOGO.V1
WHAT: Rotate the LeeWay header medallion through eight supplied logo images with a distinct color treatment on every flip.
WHY: The existing logo flipped but kept the same image and color; each spin must land on a new color/texture.
WHO: LeeWay Industries / creator-authorized outside contributor (LW-OPENCODE).
WHERE: apps/agent-tablet/src/components/RotatingLeewayLogo.tsx
WHEN: 2026-11-27
HOW: Eight candidate assets are probed at runtime; missing slots fall back to the canonical logo with a per-slot CSS color treatment.
AUTHORITY: LOCAL_PRESENTATION_ONLY. No enrollment, Veritas, receipt or production claim.
LICENSE: Existing repository terms.
*/
import React, { useEffect, useState } from 'react';
import { tabletAssetUrl } from '../assetUrl';

const SLOT_COUNT = 9;
const HOLD_MS = 9000;
const SPIN_MS = 2000;
const baseLogo = tabletAssetUrl('/leeway-true-logo.png');
const slots = Array.from({ length: SLOT_COUNT }, (_, index) =>
  tabletAssetUrl(`/leeway-logos/leeway-logo-${String(index + 1).padStart(2, '0')}.png`));

export function RotatingLeewayLogo({ className = '' }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [available, setAvailable] = useState<boolean[]>(() => Array(SLOT_COUNT).fill(false));

  useEffect(() => {
    slots.forEach((src, slot) => {
      const probe = new Image();
      probe.onload = () => setAvailable(current => {
        if (current[slot]) return current;
        const next = [...current];
        next[slot] = true;
        return next;
      });
      probe.src = src;
    });
  }, []);

  // Hold one distinct color/image, spin once, switch, then hold the next one.
  useEffect(() => {
    if (spinning) {
      const timer = window.setTimeout(() => {
        setIndex(current => (current + 1) % SLOT_COUNT);
        setSpinning(false);
      }, SPIN_MS);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setSpinning(true), HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [spinning, index]);

  const src = available[index] ? slots[index] : baseLogo;
  return (
    <img
      key={index}
      src={src}
      alt=""
      aria-hidden="true"
      className={`leeway-header-logo leeway-logo-variant-${index} ${spinning ? 'leeway-logo-spinning' : ''} ${className}`}
    />
  );
}
