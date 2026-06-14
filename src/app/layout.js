import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import { getMessages } from "../i18n/getMessages";
import { cookies } from "next/headers";
import { defaultLocale } from "@/i18n/config";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  applicationName: "Dijari Premium",
  title: {
    default: "Dijari Premium",
    template: "%s",
  },
  description:
    "Dijari Premium Apartment reservation platform for room browsing, bookings, and guest account management.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dijari Premium",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/hotel-images/Logo-round.svg", type: "image/svg+xml" },
      { url: "/hotel-images/Logo.png", sizes: "192x192", type: "image/png" },
      { url: "/hotel-images/Logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/hotel-images/Logo.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/hotel-images/Logo-round.svg"],
  },
};

export const viewport = {
  themeColor: "#f8fafc",
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || defaultLocale;
  const messages = await getMessages(locale);

  return (
    <html lang={locale}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
      >
        <Providers locale={locale} messages={messages}>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
