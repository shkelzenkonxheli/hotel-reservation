"use client";

import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { BookingProvider } from "@/context/BookingContext";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#9c27b0",
    },
  },
  typography: {
    fontFamily: "var(--font-geist-sans), Arial, sans-serif",
  },
});

export default function Providers({ children, locale, messages }) {
  return (
    <AppRouterCacheProvider>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ThemeProvider theme={theme}>
          <SessionProvider>
            <CssBaseline />
            <BookingProvider>{children}</BookingProvider>
          </SessionProvider>
        </ThemeProvider>
      </NextIntlClientProvider>
    </AppRouterCacheProvider>
  );
}
