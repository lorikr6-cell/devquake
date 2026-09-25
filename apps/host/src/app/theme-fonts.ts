// Web fonts that custom themes can pick (lib/custom-theme.ts, ADR 0017). They come from npm
// packages (Fontsource) and are served by this site: nothing is downloaded from Google, neither
// at build time (a network hiccup there used to fail the build) nor by visitors. The CSS only
// declares @font-face rules; a font file is downloaded when a theme actually uses the font.
// Each package covers Latin and Latin Extended (Romanian and Hungarian letters).
import '@fontsource-variable/inter';
import '@fontsource-variable/nunito';
import '@fontsource-variable/lora';
import '@fontsource-variable/playfair-display';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/merriweather/400.css';
import '@fontsource/merriweather/700.css';
