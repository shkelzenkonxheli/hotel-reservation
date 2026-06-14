"use client";

import { useTranslations } from "next-intl";
import PublicContainer from "../components/Public/PublicContainer";
import PublicSection from "../components/Public/PublicSection";
import PublicCard from "../components/Public/PublicCard";
import usePageTitle from "../hooks/usePageTitle";

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-slate-600 md:text-base">
        {children}
      </div>
    </section>
  );
}

export default function TermsConditionsPage() {
  const t = useTranslations("terms");
  usePageTitle(t("metaTitle"));

  return (
    <div className="public-page min-h-screen bg-[#f4f7fb]">
      <PublicSection className="pt-10 pb-16">
        <PublicContainer>
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#4b74a8]">
                {t("eyebrow")}
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
                {t("title")}
              </h1>
              <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
                {t("intro")}
              </p>
            </div>

            <PublicCard className="space-y-8 p-6 md:p-8">
              <Section title={t("sections.scope.title")}>
                <p>{t("sections.scope.body")}</p>
              </Section>

              <Section title={t("sections.bookings.title")}>
                <p>{t("sections.bookings.body")}</p>
              </Section>

              <Section title={t("sections.confirmation.title")}>
                <p>{t("sections.confirmation.body")}</p>
              </Section>

              <Section title={t("sections.checkInOut.title")}>
                <p>{t("sections.checkInOut.body")}</p>
              </Section>

              <Section title={t("sections.prices.title")}>
                <p>{t("sections.prices.body")}</p>
              </Section>

              <Section title={t("sections.cancellations.title")}>
                <p>{t("sections.cancellations.body")}</p>
              </Section>

              <Section title={t("sections.guestResponsibility.title")}>
                <p>{t("sections.guestResponsibility.body")}</p>
              </Section>

              <Section title={t("sections.propertyRights.title")}>
                <p>{t("sections.propertyRights.body")}</p>
              </Section>

              <Section title={t("sections.liability.title")}>
                <p>{t("sections.liability.body")}</p>
              </Section>

              <Section title={t("sections.contact.title")}>
                <p>{t("sections.contact.body")}</p>
              </Section>
            </PublicCard>
          </div>
        </PublicContainer>
      </PublicSection>
    </div>
  );
}
