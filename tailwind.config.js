/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Exact values from drizzle.zip's app/globals.css (the real
        // marketing site) — the dashboard's own globals.css previously
        // drifted from these (see NX_TOKENS note in globals.css). Named
        // to match drizzle's own CSS variable names so `bg-panel`,
        // `text-orange`, `border-line` etc. map 1:1 to what the
        // marketing site already calls these colors.
        night:   '#020a16',
        night2:  '#041120',
        panel:   '#071728',
        panel2:  '#091d31',
        ink:     '#f7f9fc',
        muted:   '#98a8bc',
        line:    'rgba(112, 153, 198, .17)',
        blue:    '#168fff',
        cyan:    '#00bff8',
        orange:  '#ff4b0a',
        purple:  '#b15cff',
        green:   '#27d86d',
      },
      fontFamily: {
        // Matches drizzle's --font-product / --font-marketing split —
        // the dashboard is entirely "product" surface, so Inter is the
        // default everywhere; Manrope is only relevant on marketing
        // pages (the separate drizzle project), not used here.
        sans: ['Inter', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        // Reusable 3D-card shadow as a Tailwind utility (`shadow-card`)
        // instead of repeating the same 3-layer box-shadow string inline
        // on every converted component.
        card: '0 2px 4px rgba(0,0,0,.4), 0 16px 40px -10px rgba(0,0,0,.75), inset 0 1px 0 rgba(255,255,255,.07)',
        'card-hover': '0 2px 4px rgba(0,0,0,.45), 0 20px 48px -10px rgba(255,75,10,.35), inset 0 1px 0 rgba(255,255,255,.1)',
        btn: '0 2px 3px rgba(0,0,0,.3), 0 10px 22px -6px rgba(255,75,10,.7), inset 0 1px 0 rgba(255,255,255,.25)',
      },
      keyframes: {
        'modal-in': { from: { opacity: 0, transform: 'translateY(8px) scale(.98)' }, to: { opacity: 1, transform: 'translateY(0) scale(1)' } },
        'overlay-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'toast-in': { from: { opacity: 0, transform: 'translateY(-6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'page-in': { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        'modal-in': 'modal-in .22s cubic-bezier(.16,1,.3,1)',
        'overlay-in': 'overlay-in .18s ease-out',
        'toast-in': 'toast-in .25s cubic-bezier(.16,1,.3,1)',
        'page-in': 'page-in .2s ease-out',
      },
    },
  },
  plugins: [],
}
