/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {

      /* ─────────────────────────────────────────────────────
         BACKGROUND COLOURS   →  bg-{name}
      ───────────────────────────────────────────────────── */
      backgroundColor: {
        'navy-dark':    '#1a1a2e',   // OTP panel, page header gradient start
        'navy':         '#0f3460',   // collect button, active elements
        'red':          '#e94560',   // badge, generate-OTP button
        'amber':        '#f59e0b',   // amber accents
        'amber-light':  '#fef3c7',   // pending banner, arrived status pill
        'amber-pale':   '#fffbeb',   // resident prefs/DND banner
        'amber-glow':   'rgba(245,158,11,0.3)',  // pending stat card
        'blue-light':   '#dbeafe',   // notified status pill
        'indigo-light': '#e8f0fe',   // delivery type label bg
        'green-light':  '#dcfce7',   // collected status pill
        'green-pale':   '#f0fdf4',   // OTP pending / collected info bg
        'green-glow':   'rgba(34,197,94,0.3)',   // collected stat card
        'green':        '#166534',   // confirm collection button
        'red-light':    '#fee2e2',   // returned status pill / OTP error bg
        'red-pale':     '#fff5f5',   // returned info strip
        'violet-light': '#ede9fe',   // OTP guard display, secondary button
        'violet-dark':  '#5b21b6',   // generate OTP button
        'violet':       '#7c3aed',   // OTP-verified badge
        'note':         '#f0f4ff',   // resident note bg
        'form':         '#f8f9ff',   // collect / OTP action form bg
        'page':         '#f5f6fa',   // app page background
        'surface':      '#ffffff',   // cards, inputs
        'row-alt':      '#f0f5ff',   // alternating list row tint
        'subtle':       '#f5f5f5',   // very light row dividers
        'disabled':     '#666666',   // disabled button state
        'disabled-btn': '#cccccc',   // disabled button (light)
        'glass':        'rgba(255,255,255,0.15)', // prefs / cancel pill buttons
        'gray-100':     '#f3f4f6',
        'gray-50':      '#f9fafb',
        'gradient-pink': 'linear-gradient(135deg, #f43f5e 0%, #fbbf24 100%)', //tabs inside the page
      },

      /* ─────────────────────────────────────────────────────
         TEXT COLOURS   →  text-{name}
      ───────────────────────────────────────────────────── */
      textColor: {
        'navy-dark':    '#1a1a2e',   // primary heading text, detail values
        'navy':         '#0f3460',   // active tab, links
        'red':          '#e94560',   // accent / error
        'amber-dark':   '#92400e',   // banner heading, arrived status
        'amber-mid':    '#b45309',   // banner subtext
        'amber':        '#f59e0b',   // countdown urgent, star ratings
        'blue-dark':    '#1e40af',   // notified status
        'green-dark':   '#166534',   // collected status
        'red-dark':     '#991b1b',   // returned status
        'violet-dark':  '#5b21b6',   // OTP guard display, secondary btn text
        'indigo':       '#3730a3',   // resident note text, collect form picks
        'green-soft':   '#86efac',   // OTP countdown
        'muted':        '#888888',   // inactive tabs, detail-row labels
        'mid':          '#666666',   // resident name, secondary labels
        'faint':        '#aaaaaa',   // time labels
        'dim':          '#555555',   // empty-state paragraph
        'white-muted':  'rgba(255,255,255,0.70)', // page-header subtext
        'white-faint':  'rgba(255,255,255,0.60)', // OTP display label
      },

      /* ─────────────────────────────────────────────────────
         BORDER COLOURS   →  border-{name}
      ───────────────────────────────────────────────────── */
      borderColor: {
        'navy':         '#0f3460',   // active tab underline, input focus
        'red':          '#e94560',   // accent borders
        'amber':        '#f59e0b',   // pending banner, delivery card left accent
        'amber-light':  '#fcd34d',   // resident prefs/DND banner border
        'green-soft':   '#86efac',   // OTP pending banner border
        'indigo-light': '#c7d2fe',   // collect / OTP action form border
        'gray':         '#e5e7eb',   // inputs, history card left
        'mid':          '#dddddd',   // filter pill default border
        'light':        '#eeeeee',   // tabs strip bottom border
        'subtle':       '#f5f5f5',   // detail-row dividers
        'action':       '#f0f0f0',   // action section top divider
      },

      /* ─────────────────────────────────────────────────────
         FONT SIZES   →  text-{name}
      ───────────────────────────────────────────────────── */
      fontSize: {
        'badge':       ['11px', { lineHeight: '1' }],
        'xs':          ['12px', { lineHeight: '1.4' }],
        'sm':          ['13px', { lineHeight: '1.5' }],
        'md':          ['14px', { lineHeight: '1.5' }],
        'rg':          ['15px', { lineHeight: '1.5' }],
        'base':        ['16px', { lineHeight: '1.5' }],
        'lg':          ['18px', { lineHeight: '1.4' }],
        'xl':          ['20px', { lineHeight: '1.4' }],
        'heading':     ['22px', { lineHeight: '1.2' }],
        'icon-lg':     ['28px', { lineHeight: '1' }],
        'icon-xl':     ['48px', { lineHeight: '1' }],
        'otp-display': ['44px', { lineHeight: '1' }],
        'otp-code':    ['52px', { lineHeight: '1', letterSpacing: '16px' }],
      },

      /* ─────────────────────────────────────────────────────
         BORDER RADIUS   →  rounded-{name}
      ───────────────────────────────────────────────────── */
      borderRadius: {
        'ctrl':  '8px',    // inputs, status badges
        'btn':   '10px',   // action buttons
        'card':  '14px',   // delivery cards, OTP panel
        'pill':  '20px',   // top-bar pill links (prefs, back)
      },

      /* ─────────────────────────────────────────────────────
         LETTER SPACING   →  tracking-{name}
      ───────────────────────────────────────────────────── */
      letterSpacing: {
        'otp':       '12px',   // OTP code display (guard shows to resident)
        'otp-input': '8px',    // OTP input field (resident/guard enters code)
      },

      /* ─────────────────────────────────────────────────────
         BOX SHADOWS   →  shadow-{name}
      ───────────────────────────────────────────────────── */
      boxShadow: {
        'card':    '0 2px 8px rgba(0,0,0,0.06)',
        'card-md': '0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
      },

    },
  },
  plugins: [],
}