export default function RoomsHero({ t }) {
  const eyebrow =
    typeof t.has === "function" && t.has("eyebrow")
      ? t("eyebrow")
      : "Dijari Premium";

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center md:gap-4">
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="display text-[2.3rem] leading-[1.08] text-[var(--ink)] md:text-[3.4rem]">
        {t("title")}
      </h1>
      <p className="mx-auto max-w-2xl text-[15px] leading-7 text-[var(--ink-soft)] md:text-base md:leading-7">
        {t("subtitle")}
      </p>
    </div>
  );
}
