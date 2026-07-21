import { Font } from "@react-pdf/renderer";

// Register Inter font with Rupee (₹) symbol support from CDN
let isFontRegistered = false;

export function registerPdfFonts() {
  if (isFontRegistered) return;

  try {
    Font.register({
      family: "Inter",
      fonts: [
        {
          src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff",
          fontWeight: 400,
        },
        {
          src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.woff",
          fontWeight: 600,
        },
        {
          src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff",
          fontWeight: 700,
        },
      ],
    });
    isFontRegistered = true;
  } catch (err) {
    console.warn("PDF Font registration warning:", err);
  }
}
