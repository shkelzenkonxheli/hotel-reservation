import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section
        className="relative w-full h-screen bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('/hotel-images/hotelbg1.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/50"></div>

        <div className="relative z-10 text-center text-white px-4 space-y-4 animate-fadeIn">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-fadeIn delay-100">
            Welcome to Dijari Premium
          </h1>
          <p className="text-lg md:text-2xl mb-6 animate-fadeIn delay-200">
            Luxury stays, unforgettable experiences
          </p>
          <Link
            href="/rooms"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-lg font-semibold transition transform hover:scale-105 animate-fadeIn delay-300"
          >
            Book a Room
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-4">
          <h2 className="text-4xl font-bold mb-6 animate-fadeIn">About Us</h2>
          <p className="text-gray-700 text-lg mb-6 animate-fadeIn delay-100">
            Dijari Premium offers world-class service and unforgettable
            experiences. Relax in our luxurious rooms, enjoy gourmet dining, and
            make your stay truly memorable.
          </p>
          <Link
            href="/about"
            className="text-blue-600 hover:underline font-semibold animate-fadeIn delay-200"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Features / Services */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-10 text-center">
          {[
            {
              title: "Luxury Rooms",
              desc: "Elegant and comfortable rooms for a perfect stay.",
            },
            {
              title: "Fine Dining",
              desc: "Experience gourmet meals from top chefs.",
            },
            {
              title: "Spa & Wellness",
              desc: "Relax and rejuvenate in our world-class spa.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="p-6 bg-white rounded-xl shadow-lg transform transition hover:scale-105 hover:shadow-2xl animate-fadeIn"
              style={{ animationDelay: `${i * 200}ms` }}
            >
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-gray-800 text-white text-center">
        &copy; {new Date().getFullYear()} Dijari Premium. All rights reserved.
      </footer>
    </div>
  );
}
