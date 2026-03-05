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

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || defaultLocale;
  const messages = await getMessages(locale);

  return (
    <html lang={locale}>
      <head>
        <link
          rel="icon"
          type="image/svg+xml"
          href="/hotel-images/Logo-round.svg"
        />
        <link
          rel="shortcut icon"
          type="image/svg+xml"
          href="/hotel-images/Logo-round.svg"
        />
        <link rel="apple-touch-icon" href="/hotel-images/Logo.png" />
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
