/** Fly a claimed credit badge from the claim button to the global balance. */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function animateCreditClaim(
  source: HTMLElement,
  target: HTMLElement,
  onArrive: () => void,
): () => void {
  if (prefersReducedMotion()) {
    onArrive();
    return () => {};
  }

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const token = document.createElement('span');
  token.dataset.creditClaimFlight = '';
  token.setAttribute('aria-hidden', 'true');
  Object.assign(token.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '999px',
    color: '#92400e',
    background: 'linear-gradient(135deg, #fff7c2, #fbbf24)',
    border: '1px solid rgba(245, 158, 11, 0.7)',
    boxShadow: '0 8px 22px rgba(245, 158, 11, 0.4)',
    pointerEvents: 'none',
    zIndex: '1000',
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '-0.02em',
  });
  const icon = target.closest('button')?.querySelector('svg')?.cloneNode(true) as SVGElement | undefined;
  if (icon) {
    icon.removeAttribute('class');
    icon.style.width = '34px';
    icon.style.height = '34px';
    token.appendChild(icon);
  } else token.textContent = '+10';
  document.body.appendChild(token);

  const start = { x: from.x + from.width / 2 - 22, y: from.y + from.height / 2 - 22 };
  const end = { x: to.x + to.width / 2 - 22, y: to.y + to.height / 2 - 22 };
  const control = { x: (start.x + end.x) / 2, y: Math.max(8, Math.min(start.y, end.y) - 200) };
  const frames = Array.from({ length: 41 }, (_, index) => {
    const t = index / 40;
    const x = (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t ** 2 * end.x;
    const y = (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t ** 2 * end.y;
    return {
      offset: t,
      transform: `translate(${x}px, ${y}px) scale(${1 - 0.35 * t})`,
      opacity: t > 0.9 ? (1 - t) * 10 : 1,
    };
  });

  let cancelled = false;
  let flight: Animation;
  try {
    flight = token.animate(frames, { duration: 850, easing: 'ease-in-out', fill: 'forwards' });
  } catch {
    token.remove();
    onArrive();
    return () => {};
  }
  void flight.finished
    .then(() => {
      if (!cancelled) onArrive();
    })
    .catch(() => {})
    .finally(() => token.remove());

  return () => {
    cancelled = true;
    flight.cancel();
    token.remove();
  };
}
