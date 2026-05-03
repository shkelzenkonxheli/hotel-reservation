"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import PublicContainer from "./components/Public/PublicContainer";
import PublicSection from "./components/Public/PublicSection";
import PublicCard from "./components/Public/PublicCard";
import usePageTitle from "./hooks/usePageTitle";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export default function Home() {
  const t = useTranslations("home");
  const headerT = useTranslations("header");
  const router = useRouter();
  usePageTitle(t("metaTitle"));

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [activeRoomSlide, setActiveRoomSlide] = useState(0);

  const suiteCards = [
    {
      title: t("curation.cards.0.title"),
      description: t("curation.cards.0.description"),
      price: t("curation.cards.0.price"),
      badge: t("curation.cards.0.badge"),
      image: "/hotel-images/seaview.JPG",
      layout: "large",
    },
    {
      title: t("curation.cards.1.title"),
      description: t("curation.cards.1.description"),
      price: t("curation.cards.1.price"),
      badge: t("curation.cards.1.badge"),
      image: "/hotel-images/breakfastpool.png",
      layout: "small",
    },
    {
      title: t("curation.cards.2.title"),
      description: t("curation.cards.2.description"),
      price: t("curation.cards.2.price"),
      badge: t("curation.cards.2.badge"),
      image: "/hotel-images/pool1.JPG",
      layout: "small",
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
    {
      name: "Sea Horizon Suite",
      image: "/hotel-images/hotel-room5.jpg",
    },
    {
      name: "Poolside Deluxe Room",
      image: "/hotel-images/hotel-room8.JPG",
    },
    {
      name: "Terrace Comfort Room",
      image: "/hotel-images/seaview1.JPG",
    },
  ];

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveRoomSlide((current) => (current + 1) % roomShowcase.length);
    }, 4000);

    return () => clearInterval(intervalId);
  }, [roomShowcase.length]);

  const handleAvailability = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "homeSearchDraft",
        JSON.stringify({
          startDate: checkIn,
          endDate: checkOut,
          guests,
        }),
      );
    }

    router.push("/rooms");
  };

  return (
    <div className="public-page min-h-screen bg-[#f4f7fb]">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/hotel-images/hotelbg1.jpg"
            alt="Dijari Premium"
            className="h-full w-full object-cover object-center"
            style={{
              filter: "brightness(0.78) contrast(1.14) saturate(1.08)",
              transform: "scale(1.015)",
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,18,34,0.20)_0%,rgba(8,18,34,0.38)_44%,rgba(8,18,34,0.56)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(132,174,243,0.16),transparent_38%)]" />
        </div>

        <PublicContainer className="relative flex min-h-[70vh] flex-col justify-center py-16 md:min-h-[80vh] md:py-20">
          <div className="mx-auto max-w-2xl text-center text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-white/72 md:text-xs">
              {t("hero.eyebrow")}
            </p>
            <h1 className="mt-4 text-[2rem] font-semibold leading-[1.08] md:text-[3.15rem]">
              {t("hero.title")}
            </h1>
            <div className="mt-7">
              <Link
                href="/rooms"
                className="inline-flex items-center justify-center rounded-full bg-[#1f6feb] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#195fd0]"
              >
                {headerT("bookNow")}
              </Link>
            </div>
          </div>

        </PublicContainer>
      </section>

      <PublicSection id="discover" className="scroll-mt-24 !pb-12 !pt-16">
        <PublicContainer>
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#4b74a8]">
                {t("story.eyebrow")}
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-900 md:text-[2.6rem]">
                {t("story.title")}
              </h2>
              <p className="mt-6 text-base leading-8 text-slate-600">
                {t("story.body.0")}
              </p>
              <p className="mt-4 text-base leading-8 text-slate-600">
                {t("story.body.1")}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {highlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[560px]">
              <div className="relative overflow-hidden rounded-[32px] shadow-[0_28px_70px_rgba(15,23,42,0.12)]">
                <div className="relative h-[320px] overflow-hidden rounded-[32px] md:h-[470px]">
                  {roomShowcase.map((room, index) => (
                    <img
                      key={room.name}
                      src={room.image}
                      alt={room.name}
                      className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                        index === activeRoomSlide
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-[1.02]"
                      }`}
                    />
                  ))}
                </div>
                <div className="absolute bottom-5 right-5 flex rounded-full bg-white/82 px-3 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.14)] backdrop-blur-sm">
                  <div className="flex gap-2">
                    {roomShowcase.map((room, index) => (
                      <button
                        key={room.name}
                        type="button"
                        aria-label={`Show ${room.name}`}
                        onClick={() => setActiveRoomSlide(index)}
                        className={`h-2.5 rounded-full transition-all ${
                          index === activeRoomSlide
                            ? "w-7 bg-[#1f6feb]"
                            : "w-2.5 bg-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PublicContainer>
      </PublicSection>

      <PublicSection id="amenities" className="scroll-mt-24 !py-12">
        <PublicContainer>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#4b74a8]">
                {t("curation.eyebrow")}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900 md:text-[2.35rem]">
                {t("curation.title")}
              </h2>
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
            <PublicCard className="group relative overflow-hidden rounded-[30px] border-0 bg-slate-900 p-0">
              <img
                src={suiteCards[0].image}
                alt={suiteCards[0].title}
                className="h-[420px] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
            </PublicCard>

            <div className="grid gap-5">
              {suiteCards.slice(1).map((card) => (
                <PublicCard
                  key={card.title}
                  className="group relative overflow-hidden rounded-[28px] border-0 bg-slate-900 p-0"
                >
                  <img
                    src={card.image}
                    alt={card.title}
                    className="h-[200px] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </PublicCard>
              ))}
            </div>
          </div>
        </PublicContainer>
      </PublicSection>

      <PublicSection className="!py-12">
        <PublicContainer>
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#4b74a8]">
              {t("testimonials.eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900 md:text-[2.2rem]">
              {t("testimonials.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500 md:text-base">
              {t("testimonials.subtitle")}
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {testimonials.map((item) => (
              <PublicCard
                key={item.name}
                className="rounded-[24px] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
              >
                <div className="flex gap-1 text-[#1f6feb]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span key={index}>★</span>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  “{item.quote}”
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                    {item.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.role}</p>
                  </div>
                </div>
              </PublicCard>
            ))}
          </div>
        </PublicContainer>
      </PublicSection>

      <PublicSection id="offers" className="scroll-mt-24 !pb-14 !pt-12">
        <PublicContainer>
          <div className="relative overflow-hidden rounded-[34px]">
            <img
              src="/hotel-images/seaview1.JPG"
              alt={t("cta.imageAlt")}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: "brightness(0.5) contrast(1.05)" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,24,46,0.2)_0%,rgba(10,24,46,0.74)_100%)]" />

            <div className="relative z-10 flex min-h-[300px] flex-col items-center justify-center px-6 py-14 text-center text-white md:min-h-[340px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-white/72">
                {t("cta.eyebrow")}
              </p>
              <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">
                {t("cta.title")}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82 md:text-base">
                {t("cta.subtitle")}
              </p>
            </div>
          </div>
        </PublicContainer>
      </PublicSection>

      <footer className="border-t border-slate-200/80 bg-[#f4f7fb] py-5">
        <PublicContainer>
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-base font-semibold text-slate-900">
              Dijari Premium
            </p>
            <p className="mt-1 text-sm text-slate-500">{t("footer.rights")}</p>
          </div>
        </PublicContainer>
      </footer>
    </div>
  );
}
