import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales } from "./config";
import { getMessages } from "./getMessages";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const requested = cookieStore.get("NEXT_LOCALE")?.value;
  const locale = locales.includes(requested) ? requested : defaultLocale;

  return {
    locale,
    messages: await getMessages(locale),
  };
});
