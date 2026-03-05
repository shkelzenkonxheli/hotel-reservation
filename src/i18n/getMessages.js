import { defaultLocale } from "./config";

export async function getMessages(locale) {
  const safeLocale =
    locale === "en" || locale === "sq" ? locale : defaultLocale;

  if (safeLocale === "en") {
    const mod = await import("../../messages/en.json");
    return mod.default;
  }

  const mod = await import("../../messages/sq.json");
  return mod.default;
}
