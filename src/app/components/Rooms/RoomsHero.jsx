export default function RoomsHero({ t }) {
  const eyebrow =
    typeof t.has === "function" && t.has("eyebrow")
      ? t("eyebrow")
      : "Dijari Premium";

  return (
    <div className="stack-6 -my-8 text-center md:-my-10">
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="display text-[2.3rem] leading-tight text-[var(--ink)] md:text-[3.4rem]">
        {t("title")}
      </h1>
      <p className="mx-auto max-w-2xl text-[15px] leading-8 text-[var(--public-muted)] md:text-base">
        {t("subtitle")}
      </p>
    </div>
  );
}
