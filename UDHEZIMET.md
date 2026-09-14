# Dijari — Ridizajn i plotë i pjesës së klientit (v2)

Kopjo përmbajtjen e këtij ZIP-i mbi projektin tënd (ruaj strukturën e dosjeve), pastaj:

    npm run dev

## Çfarë ndryshon
- `src/app/globals.css` — sistem i ri vizual (butona, karta, forma, badge, skeleton, footer, nav, animacione)
- `src/app/layout.js` + `src/app/components/Header.jsx`, `Footer.jsx`, `ConditionalFooter.jsx` — navigim i ri publik (transparent→solid, drawer mobil, Book Now) dhe footer i ri
- `src/app/page.js` — ballina e re (hero, widget disponueshmërie, dhoma, benefite, lehtësira, galeri, lokacion, CTA)
- `src/app/rooms/page.jsx` + `src/app/components/Rooms/*` — faqja e dhomave dhe detajet premium
- `src/app/checkoutBooking`, `success`, `reservations`, `profile` — rrjedha e rezervimit dhe llogaria
- `src/app/login`, `register`, `forgot-password`, `reset-password`, `contact`, `terms-conditions`, `privacy-policy`
- `messages/en.json`, `messages/sq.json` — vetëm çelësa të rinj teksti (asnjë i vjetër nuk u prek)

## Nuk është prekur
Backend, API, Prisma, autentikimi, logjika e rezervimeve/disponueshmërisë, paneli i adminit.
