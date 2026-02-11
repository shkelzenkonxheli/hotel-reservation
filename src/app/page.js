"use client";
import Link from "next/link";
import PublicContainer from "./components/Public/PublicContainer";
import PublicSection from "./components/Public/PublicSection";
import PublicCard from "./components/Public/PublicCard";

export default function Home() {
  return (
    <div className="public-page min-h-screen">
      {/* Hero */}
      <section
        className="relative w-full min-h-[70vh] md:h-[78vh] bg-cover bg-center"
        style={{ backgroundImage: "url('/hotel-images/hotelbg1.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <PublicContainer className="h-full flex items-center">
          <div className="relative z-10 max-w-2xl text-white space-y-5">
            <span className="public-badge">Dijari Premium</span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              A refined stay for business and leisure
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              Boutique comfort, modern design, and impeccable service in the
              heart of the city.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/rooms" className="public-button primary">
                View Rooms
              </Link>
            </div>
          </div>
        </PublicContainer>
      </section>

      {/* About */}
      <PublicSection className="bg-white">
        <PublicContainer>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Designed for calm luxury</h2>
              <p className="text-slate-600 text-lg">
                Dijari Premium blends hospitality with a modern, understated
                aesthetic. Every room is curated for comfort, privacy, and
                effortless relaxation.
              </p>
              <Link href="/rooms" className="public-button primary">
                Explore Rooms
              </Link>
            </div>
            <PublicCard className="p-6">
              <h3 className="text-xl font-semibold mb-2">What you get</h3>
              <ul className="text-slate-600 space-y-2">
                <li>- Premium bedding and soundproofed rooms</li>
                <li>- High-speed Wi-Fi and smart workspace</li>
                <li>- Private check-in and concierge support</li>
              </ul>
            </PublicCard>
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
                desc: "Soft lighting, premium textiles, and quiet spaces.",
              },
              {
                title: "Location",
                desc: "Easy access to business hubs and city landmarks.",
              },
              {
                title: "Service",
                desc: "Discreet, professional, and always available.",
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
