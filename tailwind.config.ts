import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        platform: {
          tiktok: "#fe2c55",
          facebook: "#1877f2",
          youtube: "#ff0000",
        },
      },
      animation: {
        "slide-up": "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fadeIn 0.8s ease-out forwards",
        ticker: "ticker 40s linear infinite",
        "ring-fill": "ringFill 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
      },
      keyframes: {
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        ringFill: {
          "0%": { strokeDashoffset: "440" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
