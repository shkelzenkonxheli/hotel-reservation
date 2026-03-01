"use client";
import Link from "next/link";
import PublicContainer from "./components/Public/PublicContainer";
import PublicSection from "./components/Public/PublicSection";
import PublicCard from "./components/Public/PublicCard";
import usePageTitle from "./hooks/usePageTitle";

export default function Home() {
  usePageTitle("Home | Dijari Premium");

  const experienceCards = [
    {
      title: "Sea-view apartments",
      description:
        "Wake up to open Adriatic views and calm private terraces in Ulqin.",
      image: "/hotel-images/seaview.JPG",
      className: "md:col-span-2 md:row-span-2",
      imageHeight: "h-[320px] md:h-full",
    },
    {
      title: "Poolside mornings",
      description:
        "A relaxed setting for long summer days and quiet evening breaks.",
      image: "/hotel-images/seaview2.JPG",
      className: "",
      imageHeight: "h-[220px]",
    },
    {
      title: "Comfort near everything",
      description:
        "Well connected to the beach, city centre, and key points around Ulqin.",
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
              A refined stay for business and leisure
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              Premium apartments in Ulqin with a practical location, sea-view
              stays, and a calm hospitality experience close to the coast.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/rooms" className="public-button primary">
                View Rooms
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
                Designed for relaxed stays in Ulqin
              </h2>
              <p className="text-slate-600 text-lg">
                Dijari Premium combines a calm apartment-style stay with a
                practical location in Ulqin. It is suited for guests who want
                easy access to the coast, a peaceful atmosphere, and a modern,
                well-kept space to return to.
              </p>
            </div>
            <PublicCard className="p-6 md:p-7">
              <h3 className="text-xl font-semibold mb-3">What you get</h3>
              <ul className="text-slate-600 space-y-2">
                <li>- Comfortable apartments with a premium, private feel</li>
                <li>
                  - Sea-view and poolside experience across selected stays
                </li>
                <li>- Convenient access to beaches, dining, and city routes</li>
                <li>
                  - A practical base for both short trips and longer stays
                </li>
              </ul>
            </PublicCard>
          </div>
        </PublicContainer>
      </PublicSection>

      <PublicSection className="bg-white !pt-2 !pb-10">
        <PublicContainer>
          <div className="max-w-3xl space-y-4">
            <h2 className="text-3xl font-bold">
              A stay shaped by sea views, quiet comfort, and easy access around
              Ulqin
            </h2>
            <p className="text-slate-600 text-lg">
              From poolside moments to open views and a location that keeps you
              close to the coast, Dijari Premium is designed for guests who want
              both relaxation and convenience in one place.
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
                title: "Comfort",
                desc: "Thoughtful interiors, calm rooms, and a stay that feels private and easy.",
              },
              {
                title: "Location",
                desc: "A convenient Ulqin location near the coast, beaches, and everyday essentials.",
              },
              {
                title: "Experience",
                desc: "Sea views, pool moments, and a more elevated holiday atmosphere.",
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
        &copy; {new Date().getFullYear()} Dijari Premium. All rights reserved.
      </footer>
    </div>
  );
}
