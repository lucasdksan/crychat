import { Inter, Plus_Jakarta_Sans } from "next/font/google";

export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const rootHtmlClassName = `${inter.variable} ${plusJakarta.variable} dark h-full antialiased`;
