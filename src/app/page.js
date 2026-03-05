"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import PublicContainer from "./components/Public/PublicContainer";
import PublicSection from "./components/Public/PublicSection";
import PublicCard from "./components/Public/PublicCard";
import usePageTitle from "./hooks/usePageTitle";

export default function Home() {
  const t = useTranslations("home");
  usePageTitle(t("metaTitle"));

  const experienceCards = [
    {
      title: t("experience.cards.0.title"),
      description: t("experience.cards.0.description"),
      image: "/hotel-images/seaview.JPG",
      className: "md:col-span-2 md:row-span-2",
      imageHeight: "h-[320px] md:h-full",
    },
    {
      title: t("experience.cards.1.title"),
      description: t("experience.cards.1.description"),
      image: "/hotel-images/seaview2.JPG",
      className: "",
      imageHeight: "h-[220px]",
    },
    {
      title: t("experience.cards.2.title"),
      description: t("experience.cards.2.description"),
      image: "/hotel-images/pool.JPG",
      className: "",
      imageHeight: "h-[220px]",
    },
  ];

  return (
    <div className="public-page min-h-screen">
      {/* Hero */}
      <section className="relative w-full min-h-[70vh] md:h-[78vh] overflow-hidden">
        <img
          src="/hotel-images/hotelbg1.jpg"
          alt="Dijari Premium hero"
          className="absolute inset-1 h-full w-full object-cover"
          style={{
            filter: "brightness(0.84) contrast(1.1) saturate(1.05)",
            transform: "scale(1.015)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/58 via-black/34 to-black/18" />
        <PublicContainer className="h-full flex items-center">
          <div className="relative z-10 max-w-2xl text-white space-y-5">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              {t("hero.title")}
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/rooms" className="public-button primary">
                {t("hero.cta")}
              </Link>
            </div>
          </div>
        </PublicContainer>
      </section>

      <PublicSection className="bg-white !pt-6">
        <PublicContainer>
          <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">
                {t("intro.title")}
              </h2>
              <p className="text-slate-600 text-lg">
                {t("intro.description")}
              </p>
            </div>
            <PublicCard className="p-6 md:p-7">
              <h3 className="text-xl font-semibold mb-3">{t("intro.listTitle")}</h3>
              <ul className="text-slate-600 space-y-2">
                <li>- {t("intro.items.0")}</li>
                <li>- {t("intro.items.1")}</li>
                <li>- {t("intro.items.2")}</li>
                <li>- {t("intro.items.3")}</li>
              </ul>
            </PublicCard>
          </div>
        </PublicContainer>
      </PublicSection>

      <PublicSection className="bg-white !pt-2 !pb-10">
        <PublicContainer>
          <div className="max-w-3xl space-y-4">
            <h2 className="text-3xl font-bold">
              {t("experience.title")}
            </h2>
            <p className="text-slate-600 text-lg">
              {t("experience.subtitle")}
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3 md:auto-rows-[220px]">
            {experienceCards.map((card) => (
              <PublicCard
                key={card.title}
                className={`group relative overflow-hidden p-0 ${card.className}`}
              >
                <img
                  src={card.image}
                  alt={card.title}
                  className={`w-full ${card.imageHeight} object-cover transition duration-500 group-hover:scale-[1.03]`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="mt-2 max-w-md text-xs leading-6 text-white/85">
                    {card.description}
                  </p>
                </div>
              </PublicCard>
            ))}
          </div>
        </PublicContainer>
      </PublicSection>

      {/* Features */}
      <PublicSection>
        <PublicContainer>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: t("features.cards.0.title"),
                desc: t("features.cards.0.desc"),
              },
              {
                title: t("features.cards.1.title"),
                desc: t("features.cards.1.desc"),
              },
              {
                title: t("features.cards.2.title"),
                desc: t("features.cards.2.desc"),
              },
            ].map((feature, i) => (
              <PublicCard key={i} className="p-6">
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </PublicCard>
            ))}
          </div>
        </PublicContainer>
      </PublicSection>

      {/* Footer */}
      <footer className="py-10 text-center text-slate-500">
        &copy; {new Date().getFullYear()} Dijari Premium. {t("footer")}
      </footer>
    </div>
  );
}
