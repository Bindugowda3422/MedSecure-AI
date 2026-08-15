import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefcf6",
          100: "#d5f7e8",
          400: "#22c07f",
          500: "#0f9d63",
          600: "#0c7f51",
          700: "#0a6642",
          900: "#0a3b28",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(16,24,40,0.06), 0 1px 3px 0 rgba(16,24,40,0.10)",
      },
    },
  },
  plugins: [],
};
export default config;
