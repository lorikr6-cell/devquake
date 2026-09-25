import {
  Inter,
  JetBrains_Mono,
  Lora,
  Merriweather,
  Nunito,
  Playfair_Display,
  Poppins,
  Roboto,
} from 'next/font/google';

// Web fonts that custom themes can pick (lib/custom-theme.ts, ADR 0017). Self-hosted by Next and
// not preloaded: the @font-face rules are in the page, but a font file is only downloaded when
// a theme actually uses it. latin-ext covers Romanian and Hungarian letters. next/font needs
// literal options, so each call spells them out.

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-inter',
});
const roboto = Roboto({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: false,
  variable: '--font-roboto',
});
const poppins = Poppins({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '700'],
  display: 'swap',
  preload: false,
  variable: '--font-poppins',
});
const nunito = Nunito({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-nunito',
});
const lora = Lora({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-lora',
});
const merriweather = Merriweather({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  display: 'swap',
  preload: false,
  variable: '--font-merriweather',
});
const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-playfair',
});
const mono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-jetbrains-mono',
});

/** Class names that define the --font-* variables on <html>. */
export const themeFontVariables = [
  inter,
  roboto,
  poppins,
  nunito,
  lora,
  merriweather,
  playfair,
  mono,
]
  .map((f) => f.variable)
  .join(' ');
