"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import PublicContainer from "./components/Public/PublicContainer";
import PublicSection from "./components/Public/PublicSection";
import PublicCard from "./components/Public/PublicCard";
import usePageTitle from "./hooks/usePageTitle";

export default function Home() {
  const t = useTranslations("home");
  const headerT = useTranslations("header");
  usePageTitle(t("metaTitle"));

  const [activeRoomSlide, setActiveRoomSlide] = useState(0);

  const suiteCards = [
    {
      title: t("curation.cards.0.title"),
      description: t("curation.cards.0.description"),
      price: t("curation.cards.0.price"),
      badge: t("curation.cards.0.badge"),
      image: "/hotel-images/seaview.JPG",
    },
    {
      title: t("curation.cards.1.title"),
      description: t("curation.cards.1.description"),
      price: t("curation.cards.1.price"),
      badge: t("curation.cards.1.badge"),
      image: "/hotel-images/breakfastpool.png",
    },
    {
      title: t("curation.cards.2.title"),
      description: t("curation.cards.2.description"),
      price: t("curation.cards.2.price"),
      badge: t("curation.cards.2.badge"),
      image: "/hotel-images/pool1.JPG",
    },
  ];

  const testimonials = [
    {
      quote: t("testimonials.cards.0.quote"),
      name: t("testimonials.cards.0.name"),
      role: t("testimonials.cards.0.role"),
    },
    {
      quote: t("testimonials.cards.1.quote"),
      name: t("testimonials.cards.1.name"),
      role: t("testimonials.cards.1.role"),
    },
    {
      quote: t("testimonials.cards.2.quote"),
      name: t("testimonials.cards.2.name"),
      role: t("testimonials.cards.2.role"),
    },
  ];

  const highlights = [
    t("story.highlights.0"),
    t("story.highlights.1"),
    t("story.highlights.2"),
  ];

  const roomShowcase = [
    { name: "Sea Horizon Suite", image: "/hotel-images/hotel-room5.jpg" },
    { name: "Poolside Deluxe Room", image: "/hotel-images/hotel-room8.jpg" },
    { name: "Terrace Comfort Room", image: "/hotel-images/seaview1.JPG" },
  ];

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveRoomSlide((current) => (current + 1) % roomShowcase.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [roomShowcase.length]);

  return (
    <div className="public-page min-h-screen">
      {/* ============ HERO ============ */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/hotel-images/hotelbg1.jpg"
            alt="Dijari Premium"
            className="h-full w-full object-cover object-center"
            style={{ filter: "brightness(0.62) saturate(1.05)" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,29,40,0.45)_0%,rgba(11,29,40,0.30)_45%,rgba(11,29,40,0.82)_100%)]" />
        </div>

        <PublicContainer className="relative flex min-h-[82vh] flex-col justify-end pb-14 pt-28 md:min-h-[92vh] md:pb-20">
          <div className="fade-up max-w-3xl text-white">
            <div className="flex items-center gap-4">
              <span className="h-px w-14 bg-[var(--brass)]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-[#d9bd8e]">
                {t("hero.eyebrow")}
              </p>
            </div>

            <h1 className="display mt-6 text-[3rem] leading-[1.02] md:text-[5.2rem]">
              {t("hero.title")}
            </h1>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/rooms" className="public-button primary">
                {headerT("bookNow")}
              </Link>
              <a
                href="#discover"
                className="public-button ghost border-white/40 text-white hover:border-[var(--brass)] hover:text-[#e6cfa6]"
              >
                {t("story.eyebrow")}
              </a>
            </div>
          </div>
        </PublicContainer>
      </section>

      {/* ============ STORY ============ */}
      <PublicSection id="discover" className="scroll-mt-24">
        <PublicContainer>
          <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="max-w-xl">
              <p className="eyebrow">{t("story.eyebrow")}</p>
              <h2 className="display mt-5 text-[2.4rem] text-[var(--ink)] md:text-[3.4rem]">
                {t("story.title")}
              </h2>
              <div className="rule mt-6" />
              <p className="mt-7 text-[15px] leading-9 text-[var(--public-muted)] md:text-base">
                {t("story.body.0")}
              </p>
              <p className="mt-4 text-[15px] leading-9 text-[var(--public-muted)] md:text-base">
                {t("story.body.1")}
              </p>

              <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-[var(--public-border)] bg-[var(--public-border)] sm:grid-cols-3">
                {highlights.map((item) => (
                  <div
                    key={item}
                    className="bg-white px-5 py-6 text-center text-sm font-medium text-[var(--ink)]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[620px]">
              <div className="relative overflow-hidden rounded-[28px] shadow-[var(--public-shadow-lg)]">
                <div className="relative h-[360px] md:h-[520px]">
                  {roomShowcase.map((room, index) => (
                    <img
                      key={room.name}
                      src={room.image}
                      alt={room.name}
                      className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1200ms] ${
                        index === activeRoomSlide
                          ? "scale-100 opacity-100"
                          : "scale-[1.04] opacity-0"
                      }`}
                    />
                  ))}
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,rgba(11,29,40,0.6))]" />
                </div>

                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                  <p className="display text-2xl text-white">
                    {roomShowcase[activeRoomSlide].name}
                  </p>
                  <div className="flex gap-2">
                    {roomShowcase.map((room, index) => (
                      <button
                        key={room.name}
                        type="button"
                        aria-label={`Show ${room.name}`}
                        onClick={() => setActiveRoomSlide(index)}
                        className={`h-[3px] rounded-full transition-all duration-500 ${
                          index === activeRoomSlide
                            ? "w-10 bg-[var(--brass)]"
                            : "w-5 bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 -z-10 hidden h-40 w-40 rounded-[28px] border border-[var(--brass)] opacity-40 lg:block" />
            </div>
          </div>
        </PublicContainer>
      </PublicSection>

      {/* ============ CURATION ============ */}
      <PublicSection id="amenities" className="scroll-mt-24 !pt-0">
        <PublicContainer>
          <div className="max-w-2xl">
            <p className="eyebrow">{t("curation.eyebrow")}</p>
            <h2 className="display mt-5 text-[2.2rem] text-[var(--ink)] md:text-[3rem]">
              {t("curation.title")}
            </h2>
            <div className="rule mt-6" />
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {suiteCards.map((card, index) => (
              <article
                key={card.title}
                className={`hover-lift group relative overflow-hidden rounded-[26px] bg-[var(--ink)] ${
                  index === 0 ? "lg:col-span-2" : ""
                }`}
              >
                <div
                  className={`overflow-hidden ${index === 0 ? "h-[420px]" : "h-[420px] lg:h-[420px]"}`}
                >
                  <img
                    src={card.image}
                    alt={card.title}
                    className="img-zoom h-full w-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(11,29,40,0.86)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 p-7">
                  {card.badge ? (
                    <span className="inline-flex rounded-full border border-[var(--brass)]/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#e6cfa6]">
                      {card.badge}
                    </span>
                  ) : null}
                  <h3 className="display mt-4 text-[1.9rem] text-white">
                    {card.title}
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-7 text-white/70">
                    {card.description}
                  </p>
                  {card.price ? (
                    <p className="mt-3 text-sm font-semibold tracking-wide text-[#e6cfa6]">
                      {card.price}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </PublicContainer>
      </PublicSection>

      {/* ============ TESTIMONIALS ============ */}
      <PublicSection className="bg-[var(--sand-deep)]">
        <PublicContainer>
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">{t("testimonials.eyebrow")}</p>
            <h2 className="display mt-5 text-[2.1rem] text-[var(--ink)] md:text-[2.8rem]">
              {t("testimonials.title")}
            </h2>
            <p className="mt-4 text-sm leading-8 text-[var(--public-muted)] md:text-base">
              {t("testimonials.subtitle")}
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((item) => (
              <PublicCard
                key={item.name}
                className="public-card-flat hover-lift flex flex-col justify-between p-8"
              >
                <div>
                  <p className="display text-5xl leading-none text-[var(--brass)]">
                    &ldquo;
                  </p>
                  <p className="-mt-3 text-[15px] leading-8 text-[var(--ink-soft)]">
                    {item.quote}
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-3 border-t border-[var(--public-border)] pt-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brass-soft)] text-sm font-semibold text-[var(--brass-deep)]">
                    {item.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--ink)]">
                      {item.name}
                    </p>
                    <p className="text-sm text-[var(--public-muted)]">
                      {item.role}
                    </p>
                  </div>
                </div>
              </PublicCard>
            ))}
          </div>
        </PublicContainer>
      </PublicSection>

      {/* ============ CTA ============ */}
      <PublicSection id="offers" className="scroll-mt-24">
        <PublicContainer>
          <div className="relative overflow-hidden rounded-[30px]">
            <img
              src="/hotel-images/seaview1.JPG"
              alt={t("cta.imageAlt")}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: "brightness(0.45)" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(11,29,40,0.78)_0%,rgba(11,29,40,0.35)_100%)]" />

            <div className="relative z-10 flex min-h-[380px] flex-col items-center justify-center px-6 py-16 text-center text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-[#d9bd8e]">
                {t("cta.eyebrow")}
              </p>
              <h2 className="display mt-5 max-w-3xl text-[2.3rem] md:text-[3.4rem]">
                {t("cta.title")}
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-white/75 md:text-base">
                {t("cta.subtitle")}
              </p>
              <Link href="/rooms" className="public-button primary mt-9">
                {headerT("bookNow")}
              </Link>
            </div>
          </div>
        </PublicContainer>
      </PublicSection>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-[var(--public-border)] bg-[var(--ink)] py-12 text-white">
        <PublicContainer>
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <p className="display text-2xl">Dijari Premium</p>
              <p className="mt-1 text-sm text-white/55">{t("footer.rights")}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link
                href="/rooms"
                className="text-white/70 transition hover:text-[#e6cfa6]"
              >
                {headerT("bookNow")}
              </Link>
              <Link
                href="/privacy-policy"
                className="text-white/70 transition hover:text-[#e6cfa6]"
              >
                {t("footer.links.privacy")}
              </Link>
              <Link
                href="/terms-conditions"
                className="text-white/70 transition hover:text-[#e6cfa6]"
              >
                {t("footer.links.terms")}
              </Link>
            </div>
          </div>
        </PublicContainer>
      </footer>
    </div>
  );
}
