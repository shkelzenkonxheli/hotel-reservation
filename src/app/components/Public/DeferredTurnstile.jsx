"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Box } from "@mui/material";

export default function DeferredTurnstile({
  siteKey,
  show,
  onTokenChange,
  theme = "light",
}) {
  const [captchaReady, setCaptchaReady] = useState(false);
  const turnstileRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (!show || !captchaReady || !siteKey || !turnstileRef.current) return;
    if (!window.turnstile || widgetIdRef.current !== null) return;

    widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
      sitekey: siteKey,
      theme,
      callback: (token) => onTokenChange?.(token),
      "expired-callback": () => onTokenChange?.(""),
      "error-callback": () => onTokenChange?.(""),
    });
  }, [show, captchaReady, siteKey, theme, onTokenChange]);

  return (
    <>
      {siteKey ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setCaptchaReady(true)}
        />
      ) : null}

      {siteKey && show ? (
        <Box
          sx={{
            mt: 1,
            display: "flex",
            justifyContent: "center",
            overflow: "hidden",
            maxHeight: 90,
            opacity: 1,
            transition: "all 180ms ease",
          }}
        >
          <Box
            ref={turnstileRef}
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              "& iframe": {
                maxWidth: "100%",
              },
            }}
          />
        </Box>
      ) : null}
    </>
  );
}
