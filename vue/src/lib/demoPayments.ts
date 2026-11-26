// Explicit opt-in for built local previews; disabled in normal production builds.
export const demoPaymentsEnabled = import.meta.env.DEV || import.meta.env.VITE_DEMO_PAYMENTS === 'true';
