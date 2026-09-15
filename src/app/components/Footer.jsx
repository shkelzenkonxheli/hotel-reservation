"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  const tHeader = useTranslations("header");
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="u-wide public-section" style={{ paddingTop: 88, paddingBottom: 28 }}>
        <div className="grid gap-10 md:grid-cols-[1.3fr_0.9fr_0.9fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <img
                src="/hotel-images/Logo-round.svg"
                alt="Dijari Premium"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "#fff",
                  padding: 4,
                  boxShadow: "0 8px 22px -12px rgba(0,0,0,.9)",
                }}
              />
              <span className="display" style={{ fontSize: "1.45rem", color: "#fff" }}>
                Dijari Premium
              </span>
            </Link>
            <p style={{ maxWidth: 320, fontSize: 14, lineHeight: 1.8 }}>
              {t("description")}
            </p>
          </div>

          <div>
            <p className="footer-title">{t("navTitle")}</p>
            <ul className="flex flex-col gap-2.5" style={{ fontSize: 14 }}>
              <li><Link href="/">{t("nav.home")}</Link></li>
              <li><Link href="/rooms">{t("nav.rooms")}</Link></li>
              <li><Link href="/contact">{t("nav.contact")}</Link></li>
              <li><Link href="/reservations">{t("nav.reservations")}</Link></li>
            </ul>
          </div>

          <div>
            <p className="footer-title">{t("contactTitle")}</p>
            <ul className="flex flex-col gap-2.5" style={{ fontSize: 14 }}>
              <li>
                <a href="mailto:dijaripremium@gmail.com">dijaripremium@gmail.com</a>
              </li>
              <li>
                <a href="tel:+38268317993">+382 68 317 993</a>
              </li>
              <li>
                <a
                  href="https://www.bing.com/maps/default.aspx?v=2&pc=FACEBK&mid=8100&where1=Mujo%20Ul%C3%A7inaku%2C%20Ulcinj%2C%20Montenegro&FORM=FBKPL1&mkt=en-US"
                  target="_blank"
                  rel="noreferrer"
                >
                  Mujo Ulcinaku, Ulqin, Mali i Zi
                </a>
              </li>
            </ul>
          </div>

          <div className="surface-ink" style={{ background: "rgba(255,255,255,0.05)", borderRadius: 20, padding: "22px 20px" }}>
            <p className="footer-title">{t("bookTitle")}</p>
            <p style={{ fontSize: 13.5, lineHeight: 1.7, marginBottom: 16, opacity: 0.85 }}>
              {t("bookSubtitle")}
            </p>
            <Link href="/rooms" className="btn btn-primary btn-sm btn-block">
              {tHeader("bookNow")}
            </Link>
          </div>
        </div>

        <div
          className="flex flex-col md:flex-row items-center justify-between gap-3 mt-10 pt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.12)", fontSize: 12.5 }}
        >
          <span>&copy; {year} Dijari Premium. {t("rights")}</span>
          <div className="flex items-center gap-5">
            <Link href="/terms-conditions">{t("legal.terms")}</Link>
            <Link href="/privacy-policy">{t("legal.privacy")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
