import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

// O Sans é variable (omitir weight baixa um arquivo só); o Mono não é, então o
// weight é obrigatório. 500/600 é o que o <link> do Google Fonts carregava antes.
export const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
});

export const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});
