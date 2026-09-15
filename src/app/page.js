"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import PublicContainer from "./components/Public/PublicContainer";
import PublicSection from "./components/Public/PublicSection";
import PublicCard from "./components/Public/PublicCard";
import usePageTitle from "./hooks/usePageTitle";

import PoolOutlinedIcon from "@mui/icons-material/PoolOutlined";
import WifiOutlinedIcon from "@mui/icons-material/WifiOutlined";
import WavesOutlinedIcon from "@mui/icons-material/WavesOutlined";
import FreeBreakfastOutlinedIcon from "@mui/icons-material/FreeBreakfastOutlined";
import AcUnitOutlinedIcon from "@mui/icons-material/AcUnitOutlined";
import LocalParkingOutlinedIcon from "@mui/icons-material/LocalParkingOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import DeckOutlinedIcon from "@mui/icons-material/DeckOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import RoomServiceOutlinedIcon from "@mui/icons-material/RoomServiceOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";

const FACILITY_ICONS = [
  PoolOutlinedIcon,
  WifiOutlinedIcon,
  WavesOutlinedIcon,
  FreeBreakfastOutlinedIcon,
  AcUnitOutlinedIcon,
  LocalParkingOutlinedIcon,
  SupportAgentOutlinedIcon,
  DeckOutlinedIcon,
];

const BENEFIT_ICONS = [
  PlaceOutlinedIcon,
  SpaOutlinedIcon,
  PoolOutlinedIcon,
  RoomServiceOutlinedIcon,
];

export default function Home() {
  const t = useTranslations("home");
  const headerT = useTranslations("header");
  usePageTitle(t("metaTitle"));
  const [activeRoomSlide, setActiveRoomSlide] = useState(0);
  const [activeGallerySlide, setActiveGallerySlide] = useState(0);

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

  const benefits = [0, 1, 2, 3].map((i) => ({
    title: t(`benefits.items.${i}.title`),
    body: t(`benefits.items.${i}.body`),
    Icon: BENEFIT_ICONS[i],
  }));

  const facilities = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
    label: t(`facilities.items.${i}.label`),
    Icon: FACILITY_ICONS[i],
  }));

  const roomShowcase = [
    { name: "Sea Horizon Suite", image: "/hotel-images/hotel-room5.jpg" },
    { name: "Poolside Deluxe Room", image: "/hotel-images/hotel-room8.jpg" },
    { name: "Terrace Comfort Room", image: "/hotel-images/seaview1.JPG" },
  ];

  const galleryImages = [
    "/hotel-images/hotelbg2.jpg",
    "/hotel-images/pool2.JPG",
    "/hotel-images/hotel-room1.jpg",
    "/hotel-images/seaview2.JPG",
    "/hotel-images/hotel-room6.jpg",
    "/hotel-images/poolviewnight.JPG",
  ];

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveRoomSlide((current) => (current + 1) % roomShowcase.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [roomShowcase.length]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveGallerySlide((current) => (current + 1) % galleryImages.length);
    }, 4200);
    return () => clearInterval(intervalId);
  }, [galleryImages.length]);

  return (
    <div className="public-page min-h-screen bg-[var(--sand)]">
      {/* ============ HERO ============ */}
      <section className="relative isolate">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/hotel-images/hotelbg1.jpg"
            alt="Dijari Premium"
            className="h-full w-full object-cover object-center"
            style={{ filter: "brightness(0.6) saturate(1.05)" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,36,38,0.55)_0%,rgba(11,36,38,0.3)_45%,rgba(11,36,38,0.92)_100%)]" />
        </div>

        <PublicContainer className="relative flex min-h-[82vh] flex-col justify-end pb-28 pt-32 md:min-h-[94vh] md:pb-32 md:pt-40">
          <div className="fade-up max-w-3xl text-white">
            <div className="flex items-center gap-4">
              <span className="h-px w-14 bg-[var(--sea)]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--sea)]">
                {t("hero.eyebrow")}
              </p>
            </div>

            <h1 className="display-xl mt-7">
              Dijari Premium
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-8 text-white/80 md:text-base">
              {t("hero.subtitle")}
            </p>

            <div className="mt-5 flex items-center gap-2 text-sm text-white/70">
              <PlaceOutlinedIcon fontSize="small" className="text-[var(--sea)]" />
              <span>{t("location.address")}</span>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/rooms" className="btn btn-primary btn-lg">
                {headerT("bookNow")}
              </Link>
              <a
                href="#discover"
                className="btn btn-outline btn-lg border-white/40 text-white hover:border-[var(--sea)] hover:text-[var(--sea)]"
              >
                {t("story.eyebrow")}
              </a>
            </div>
          </div>
        </PublicContainer>

      </section>

      {/* ============ STORY ============ */}
      <PublicSection id="discover" className="scroll-mt-24 pt-24 md:pt-28">
        <PublicContainer>
          <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="max-w-xl">
              <p className="eyebrow">{t("story.eyebrow")}</p>
              <h2 className="display mt-5 text-[2.2rem] text-[var(--ink)] md:text-[3.2rem]">
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
                <div className="relative h-[320px] md:h-[500px]">
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
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,rgba(11, 36, 38,0.6))]" />
                </div>

                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                  <p className="display text-xl text-white md:text-2xl">
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

      {/* ============ FEATURED ROOMS ============ */}
      <PublicSection id="amenities" className="scroll-mt-24">
        <PublicContainer>
          <div className="sec-head">
            <p className="eyebrow">{t("curation.eyebrow")}</p>
            <h2 className="sec-title display text-[2.1rem] text-[var(--ink)] md:text-[3rem]">
              {t("curation.title")}
            </h2>
            <div className="rule" />
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {suiteCards.map((card) => (
              <article
                key={card.title}
                className="card-lux hover-lift group relative flex flex-col overflow-hidden"
              >
                <div className="media media-zoom h-[260px] overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="img-zoom h-full w-full object-cover"
                  />
                  {card.badge ? (
                    <span className="badge badge-brass absolute left-4 top-4">
                      {card.badge}
                    </span>
                  ) : null}
                </div>
                <div className="card-body flex flex-1 flex-col">
                  <h3 className="display text-[1.5rem] text-[var(--ink)]">
                    {card.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-7 text-[var(--public-muted)]">
                    {card.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-[var(--public-border)] pt-4">
                    {card.price ? (
                      <p className="price-line">
                        <span className="price-value text-[var(--brass-deep)]">
                          {card.price}
                        </span>
                      </p>
                    ) : (
                      <span />
                    )}
                    <Link href="/rooms" className="btn btn-quiet btn-sm">
                      {t("curation.viewAll")}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </PublicContainer>
      </PublicSection>

      {/* ============ WHY STAY WITH US ============ */}
      <PublicSection className="bg-[var(--sand-deep)]">
        <PublicContainer>
          <div className="sec-head center">
            <p className="eyebrow">{t("benefits.eyebrow")}</p>
            <h2 className="sec-title display text-[2.1rem] text-[var(--ink)] md:text-[2.8rem]">
              {t("benefits.title")}
            </h2>
            <div className="rule" />
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ title, body, Icon }) => (
              <PublicCard
                key={title}
                className="public-card-flat hover-lift flex flex-col items-start gap-4 p-7 text-left"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brass-soft)] text-[var(--brass-deep)]">
                  <Icon fontSize="medium" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--ink)]">
                  {title}
                </h3>
                <p className="text-sm leading-7 text-[var(--public-muted)]">
                  {body}
                </p>
              </PublicCard>
            ))}
          </div>
        </PublicContainer>
      </PublicSection>

      {/* ============ FACILITIES ============ */}
      <PublicSection>
        <PublicContainer>
          <div className="sec-head">
            <p className="eyebrow">{t("facilities.eyebrow")}</p>
            <h2 className="sec-title display text-[2.1rem] text-[var(--ink)] md:text-[2.8rem]">
              {t("facilities.title")}
            </h2>
            <div className="rule" />
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {facilities.map(({ label, Icon }) => (
              <div
                key={label}
                className="amenity flex min-h-[64px] items-center gap-3 rounded-2xl border border-[var(--public-border)] bg-white px-5 py-4"
              >
                <Icon fontSize="small" className="text-[var(--brass-deep)]" />
                <span className="text-sm font-medium text-[var(--ink)]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </PublicContainer>
      </PublicSection>

      {/* ============ GALLERY / EXPERIENCE ============ */}
      <PublicSection className="bg-[var(--ink)]">
        <PublicContainer>
          <div className="sec-head center">
            <p className="eyebrow text-[var(--sea)]">{t("gallery.eyebrow")}</p>
            <h2 className="sec-title display text-[2.1rem] text-white md:text-[2.8rem]">
              {t("gallery.title")}
            </h2>
          </div>

          <div className="relative mx-auto mt-12 h-[280px] max-w-5xl overflow-hidden rounded-[26px] shadow-[var(--public-shadow-lg)] md:h-[480px]">
            {galleryImages.map((src, index) => (
              <img
                key={src}
                src={src}
                alt=""
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1200ms] ${
                  index === activeGallerySlide
                    ? "scale-100 opacity-100"
                    : "scale-[1.04] opacity-0"
                }`}
              />
            ))}
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
              {galleryImages.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  aria-label={`Show image ${index + 1}`}
                  onClick={() => setActiveGallerySlide(index)}
                  className={`h-[3px] rounded-full transition-all duration-500 ${
                    index === activeGallerySlide
                      ? "w-10 bg-[var(--brass)]"
                      : "w-5 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </PublicContainer>
      </PublicSection>

      {/* ============ TESTIMONIALS ============ */}
      <PublicSection className="bg-[var(--sand-deep)]">
        <PublicContainer>
          <div className="sec-head center mx-auto max-w-2xl">
            <p className="eyebrow">{t("testimonials.eyebrow")}</p>
            <h2 className="sec-title display text-[2.1rem] text-[var(--ink)] md:text-[2.8rem]">
              {t("testimonials.title")}
            </h2>
            <p className="sec-sub text-sm leading-8 text-[var(--public-muted)] md:text-base">
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

      {/* ============ LOCATION ============ */}
      <PublicSection id="location" className="scroll-mt-24">
        <PublicContainer>
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="relative overflow-hidden rounded-[28px] shadow-[var(--public-shadow-lg)]">
              <img
                src="/hotel-images/seaview2.JPG"
                alt={t("location.imageAlt")}
                className="h-[280px] w-full object-cover md:h-[440px]"
              />
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/95 p-5 shadow-[var(--public-shadow-lg)] backdrop-blur">
                <p className="eyebrow">{t("location.cardEyebrow")}</p>
                <p className="mt-2 text-base font-semibold text-[var(--ink)]">
                  {t("location.cardTitle")}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--public-muted)]">
                  {t("location.cardBody")}
                </p>
              </div>
            </div>

            <div className="max-w-xl">
              <p className="eyebrow">{t("location.eyebrow")}</p>
              <h2 className="display mt-5 text-[2.1rem] text-[var(--ink)] md:text-[2.8rem]">
                {t("location.title")}
              </h2>
              <div className="rule mt-6" />
              <p className="mt-7 text-[15px] leading-9 text-[var(--public-muted)] md:text-base">
                {t("location.subtitle")}
              </p>

              <div className="mt-7 flex items-start gap-3 rounded-2xl border border-[var(--public-border)] bg-white p-5">
                <PlaceOutlinedIcon className="text-[var(--brass-deep)]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--public-muted)]">
                    {t("location.addressLabel")}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[var(--ink)]">
                    {t("location.address")}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    t("location.address")
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ink btn-lg"
                >
                  {t("location.primaryAction")}
                </a>
                <Link href="/contact" className="btn btn-outline btn-lg">
                  {t("location.secondaryAction")}
                </Link>
              </div>
            </div>
          </div>
        </PublicContainer>
      </PublicSection>

      {/* ============ FINAL CTA ============ */}
      <PublicSection id="offers" className="scroll-mt-24">
        <PublicContainer>
          <div className="relative overflow-hidden rounded-[30px]">
            <img
              src="/hotel-images/seaview1.JPG"
              alt={t("cta.imageAlt")}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: "brightness(0.45)" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(11, 36, 38,0.78)_0%,rgba(11, 36, 38,0.35)_100%)]" />

            <div className="relative z-10 flex min-h-[360px] flex-col items-center justify-center px-6 py-16 text-center text-white">
              <VerifiedOutlinedIcon className="text-[var(--brass)]" fontSize="large" />
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--sea)]">
                {t("cta.eyebrow")}
              </p>
              <h2 className="display mt-5 max-w-3xl text-[2.1rem] md:text-[3.2rem]">
                {t("cta.title")}
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-white/75 md:text-base">
                {t("cta.subtitle")}
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link href="/rooms" className="btn btn-primary btn-lg">
                  {t("cta.primary")}
                </Link>
                <Link href="/contact" className="btn btn-light btn-lg">
                  {t("cta.secondary")}
                </Link>
              </div>
            </div>
          </div>
        </PublicContainer>
      </PublicSection>
    </div>
  );
}
