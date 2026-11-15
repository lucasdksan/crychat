import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";

export const inter = DM_Sans({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const rootHtmlClassName = `${inter.variable} ${plusJakarta.variable} dark h-full antialiased`;
