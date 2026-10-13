import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ORIFACTA — Ideas made real.",
  description: "An independent digital studio in Sarajevo. We design and build distinctive websites, web and mobile applications, B2B software and thoughtful automation.",
  openGraph: { title: "ORIFACTA — Ideas made real.", description: "Distinctive digital experiences. Useful, beautifully built software. From the first idea to what comes next.", type: "website", images: [{ url: "/assets/brand/social.jpg", width: 1254, height: 1254, alt: "ORIFACTA" }] },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><head><link rel="preload" href="/assets/fonts/mona-sans-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /><meta name="theme-color" content="#0b0a18" /></head><body>{children}</body></html>;
}
