export default function manifest() {
  return {
    name: "Dijari Premium",
    short_name: "Dijari",
    description:
      "Dijari Premium Apartment booking platform for browsing rooms and managing reservations.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#f8fafc",
    lang: "en",
    icons: [
      {
        src: "/hotel-images/Logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/hotel-images/Logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/hotel-images/Logo-round.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
