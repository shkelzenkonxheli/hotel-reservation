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

export default function PrivacyPolicyPage() {
  const t = useTranslations("privacy");
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
            </PublicCard>
          </div>
        </PublicContainer>
      </PublicSection>
    </div>
  );
}
