export async function verifyTurnstileToken(req, token) {
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;

  if (!turnstileSecret) {
    return { ok: true, enabled: false };
  }

  if (!token) {
    return {
      ok: false,
      enabled: true,
      message: "Please complete the captcha challenge.",
    };
  }

  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "";

  const verifyRes = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: turnstileSecret,
        response: token,
        remoteip: ip,
      }),
    },
  );

  const verifyData = await verifyRes.json();

  if (!verifyData?.success) {
    return {
      ok: false,
      enabled: true,
      message: "Captcha verification failed. Please try again.",
    };
  }

  return { ok: true, enabled: true };
}
