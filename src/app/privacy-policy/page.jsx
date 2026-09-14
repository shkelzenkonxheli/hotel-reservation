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

export default function PrivacyPolicyPage() {
  const t = useTranslations("privacy");
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
              <Section title={t("sections.whoWeAre.title")}>
                <p>{t("sections.whoWeAre.body")}</p>
              </Section>

              <Section title={t("sections.dataWeCollect.title")}>
                <ul className="list-disc space-y-2 pl-5">
                  <li>{t("sections.dataWeCollect.items.name")}</li>
                  <li>{t("sections.dataWeCollect.items.email")}</li>
                  <li>{t("sections.dataWeCollect.items.phone")}</li>
                  <li>{t("sections.dataWeCollect.items.address")}</li>
                  <li>{t("sections.dataWeCollect.items.booking")}</li>
                  <li>{t("sections.dataWeCollect.items.account")}</li>
                </ul>
              </Section>

              <Section title={t("sections.whyWeUseData.title")}>
                <ul className="list-disc space-y-2 pl-5">
                  <li>{t("sections.whyWeUseData.items.booking")}</li>
                  <li>{t("sections.whyWeUseData.items.communication")}</li>
                  <li>{t("sections.whyWeUseData.items.accounts")}</li>
                  <li>{t("sections.whyWeUseData.items.legal")}</li>
                </ul>
              </Section>

              <Section title={t("sections.cookies.title")}>
                <p>{t("sections.cookies.body1")}</p>
                <p>{t("sections.cookies.body2")}</p>
              </Section>

              <Section title={t("sections.services.title")}>
                <p>{t("sections.services.body")}</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>{t("sections.services.items.vercel")}</li>
                  <li>{t("sections.services.items.neon")}</li>
                  <li>{t("sections.services.items.resend")}</li>
                  <li>{t("sections.services.items.google")}</li>
                </ul>
              </Section>

              <Section title={t("sections.retention.title")}>
                <p>{t("sections.retention.body")}</p>
              </Section>

              <Section title={t("sections.rights.title")}>
                <p>{t("sections.rights.body")}</p>
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
