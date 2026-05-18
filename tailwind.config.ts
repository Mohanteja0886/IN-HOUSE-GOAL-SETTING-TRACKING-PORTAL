import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        "on-secondary-container": "#57657b",
        "surface-tint": "#565e74",
        "on-primary-fixed": "#131b2e",
        "primary": "#000000",
        "on-secondary": "#ffffff",
        "on-secondary-fixed": "#0d1c2f",
        "on-tertiary-fixed": "#001e2c",
        "outline-variant": "#c6c6cd",
        "secondary-fixed": "#d5e3fd",
        "on-background": "#191c1e",
        "on-primary": "#ffffff",
        "secondary-fixed-dim": "#b9c7e0",
        "tertiary": "#000000",
        "inverse-surface": "#2d3133",
        "on-surface-variant": "#45464d",
        "secondary-container": "#d5e3fd",
        "on-error-container": "#93000a",
        "tertiary-container": "#001e2c",
        "on-tertiary": "#ffffff",
        "tertiary-fixed-dim": "#7bd0ff",
        "tertiary-fixed": "#c4e7ff",
        "surface-container-low": "#f2f4f6",
        "surface": "#f7f9fb",
        "secondary": "#515f74",
        "on-surface": "#191c1e",
        "background": "#f7f9fb",
        "surface-variant": "#e0e3e5",
        "inverse-primary": "#bec6e0",
        "surface-container-lowest": "#ffffff",
        "on-primary-fixed-variant": "#3f465c",
        "surface-dim": "#d8dadc",
        "on-tertiary-container": "#008ebf",
        "inverse-on-surface": "#eff1f3",
        "error-container": "#ffdad6",
        "surface-container-high": "#e6e8ea",
        "surface-container-highest": "#e0e3e5",
        "primary-container": "#131b2e",
        "on-error": "#ffffff",
        "surface-container": "#eceef0",
        "surface-bright": "#f7f9fb",
        "primary-fixed": "#dae2fd",
        "on-secondary-fixed-variant": "#3a485c",
        "on-primary-container": "#7c839b",
        "error": "#ba1a1a",
        "primary-fixed-dim": "#bec6e0",
        "outline": "#76777d",
        "on-tertiary-fixed-variant": "#004c69"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      spacing: {
        "gutter": "24px",
        "container-max-width": "1280px",
        "margin-mobile": "16px",
        "unit": "8px",
        "margin-desktop": "32px"
      },
      fontFamily: {
        "body-lg": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "display-lg": ["Inter", "sans-serif"],
        "headline-md": ["Inter", "sans-serif"],
        "title-lg": ["Inter", "sans-serif"],
        "code-sm": ["Inter", "monospace"],
        "headline-lg-mobile": ["Inter", "sans-serif"],
        "headline-lg": ["Inter", "sans-serif"],
        "label-md": ["Inter", "sans-serif"]
      },
      fontSize: {
        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
        "display-lg": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
        "title-lg": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
        "code-sm": ["13px", { "lineHeight": "18px", "fontWeight": "400" }],
        "headline-lg-mobile": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
        "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
        "label-md": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "500" }]
      }
    }
  },
  plugins: [],
}

export default config
