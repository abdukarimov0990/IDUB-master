import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";
import ScrollToTop from "./components/ScrollToTop";
import AnalyticsTracker from "./components/AnalyticsTracker";
import { AuthProvider } from "@/lib/auth";
import { SavedProvider } from "@/lib/saved-context";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://idub.uz";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "IDUB — Koreya Dramalari va Filmlar O'zbek Tilida",
    template: "%s | IDUB",
  },
  description:
    "IDUB — O'zbek tilidagi eng yaxshi koreya dramalari, filmlar va seriallarni onlayn tomosha qilish platformasi. Yangi qismlar, premyeralar va eksklyuziv kontent.",
  keywords: [
    "IDUB",
    "koreya dramasi",
    "koreya filmi",
    "dorama",
    "o'zbek tilida",
    "online tomosha",
    "kdrama",
    "k-drama",
    "serial",
    "film",
  ],
  applicationName: "IDUB",
  authors: [{ name: "IDUB" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "IDUB",
    title: "IDUB — Koreya Dramalari va Filmlar O'zbek Tilida",
    description:
      "O'zbek tilidagi eng yaxshi koreya dramalari, filmlar va seriallarni onlayn tomosha qiling.",
    url: SITE_URL,
    locale: "uz_UZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "IDUB — Koreya Dramalari va Filmlar",
    description:
      "O'zbek tilidagi eng yaxshi koreya dramalari va filmlarini tomosha qiling.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body
        suppressHydrationWarning
        className="antialiased bg-main font-text text-white"
      >
        <AuthProvider>
          <SavedProvider>
            <Header />
            {children}
            <ScrollToTop />
            <AnalyticsTracker />
          </SavedProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
