"use client";

import { useTranslations } from "next-intl";
import PublicContainer from "../components/Public/PublicContainer";
import PublicSection from "../components/Public/PublicSection";
import usePageTitle from "../hooks/usePageTitle";

function Section({ title, children }) {
  return (
    <section className="border-t border-[var(--public-border)] py-7 first:border-t-0 first:pt-0">
      <h2 className="display text-xl text-[var(--ink)] md:text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--public-muted)] md:text-base">
        {children}
      </div>
    </section>
  );
}

export default function TermsConditionsPage() {
  const t = useTranslations("terms");
  usePageTitle(t("metaTitle"));

  return (
    <div className="public-page min-h-screen bg-[var(--sand)]">
      <PublicSection className="pt-12 pb-16">
        <PublicContainer>
          <div className="mx-auto max-w-3xl">
            <div className="mb-10 text-center">
              <p className="eyebrow justify-center">{t("eyebrow")}</p>
              <h1 className="display mt-3 text-3xl text-[var(--ink)] md:text-4xl">{t("title")}</h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--public-muted)] md:text-base">
                {t("intro")}
              </p>
            </div>

            <div className="surface-raised rounded-3xl p-6 md:p-10">
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
            </div>
          </div>
        </PublicContainer>
      </PublicSection>
    </div>
  );
}
