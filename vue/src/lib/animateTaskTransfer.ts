/** Fly a submitted generation from its button to the project's video navigation. */
export function animateTaskTransfer(source: HTMLElement, target: HTMLElement): () => void {
  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const highlight = () => target.animate([
    { backgroundColor: '#e0f2fe', boxShadow: '0 0 0 0 rgba(14,165,233,0.3)' },
    { backgroundColor: '#f0f9ff', boxShadow: '0 0 0 7px rgba(14,165,233,0)' },
    { backgroundColor: getComputedStyle(target).backgroundColor, boxShadow: 'none' },
  ], { duration: 550, easing: 'ease-out' });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const pulse = highlight();
    return () => pulse.cancel();
  }
  const token = document.createElement('span');
  token.dataset.taskTransfer = '';
  token.setAttribute('aria-hidden', 'true');
  Object.assign(token.style, {
    position: 'fixed', left: '0', top: '0', width: '40px', height: '40px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '12px', color: 'white', background: 'linear-gradient(135deg,#11a3fd,#1769ff)',
    boxShadow: '0 6px 20px #0284c744', pointerEvents: 'none', zIndex: '1000',
    fontSize: '22px', fontWeight: '600',
  });
  token.textContent = '+';
  document.body.appendChild(token);
  const start = { x: from.x + from.width / 2 - 20, y: from.y + from.height / 2 - 20 };
  const end = { x: to.x + to.width / 2 - 20, y: to.y + to.height / 2 - 20 };
  const control = { x: (start.x + end.x) / 2, y: Math.max(8, Math.min(start.y, end.y) - 200) };
  const frames = Array.from({ length: 41 }, (_, i) => {
    const t = i / 40;
    const x = (1-t)**2 * start.x + 2*(1-t)*t*control.x + t*t*end.x;
    const y = (1-t)**2 * start.y + 2*(1-t)*t*control.y + t*t*end.y;
    return { offset: t, transform: `translate(${x}px, ${y}px) scale(${1 - 0.55*t})`, opacity: t > 0.9 ? (1-t)*10 : 1 };
  });
  const flight = token.animate(frames, { duration: 850, easing: 'ease-in-out', fill: 'forwards' });
  let pulse: Animation | undefined;
  let cancelled = false;
  void flight.finished.then(() => {
    if (!cancelled && target.isConnected) pulse = highlight();
  }).catch(() => {}).finally(() => token.remove());
  return () => { cancelled = true; flight.cancel(); pulse?.cancel(); token.remove(); };
}
