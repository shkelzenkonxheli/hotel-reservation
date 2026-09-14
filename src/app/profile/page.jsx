"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Avatar, Button, TextField, Snackbar, Alert } from "@mui/material";
import { useState } from "react";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

import ReservationsPage from "../reservations/page";
import PublicContainer from "../components/Public/PublicContainer";
import PublicSection from "../components/Public/PublicSection";
import PublicCard from "../components/Public/PublicCard";
import usePageTitle from "../hooks/usePageTitle";

export default function ProfilePage() {
  const t = useTranslations("profile");
  usePageTitle(t("metaTitle"));

  const { data: session, status, update } = useSession();

  const [value, setValue] = React.useState("1");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = React.useState({
    name: "",
    phone: "",
    address: "",
    email: "",
  });

  const [hasChanged, setHasChanged] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const router = useRouter();
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  React.useEffect(() => {
    if (session?.user) {
      const fallbackName = session.user.email?.split("@")?.[0] || "User";
      setForm({
        name: session.user.name || fallbackName,
        phone: session.user.phone || "",
        address: session.user.address || "",
        email: session.user.email || "",
      });
      setAvatarUrl(session.user.avatar_url || "");
      setHasChanged(false);
    }
  }, [session]);

  const handleChangeTab = (_e, newValue) => setValue(newValue);

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setHasChanged(true);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploadingAvatar(true);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          open: true,
          message: data?.error || t("messages.photoFailed"),
          severity: "error",
        });
        return;
      }
      setAvatarUrl(data.avatar_url || "");
      await update({ avatar_url: data.avatar_url || "" });
      setFeedback({
        open: true,
        message: t("messages.photoChanged"),
        severity: "success",
      });
    } catch (error) {
      console.error(error);
      setFeedback({
        open: true,
        message: t("messages.photoFailed"),
        severity: "error",
      });
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, avatar_url: avatarUrl }),
      });

      if (res.ok) {
        await update({
          name: form.name,
          phone: form.phone,
          address: form.address,
          avatar_url: avatarUrl,
        });
        setFeedback({
          open: true,
          message: t("messages.profileUpdated"),
          severity: "success",
        });
        setHasChanged(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setFeedback({
          open: true,
          message: data?.error || t("messages.profileUpdateFailed"),
          severity: "error",
        });
      }
    } catch (error) {
      console.error(error);
      setFeedback({
        open: true,
        message: t("messages.profileUpdateFailed"),
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!session?.user) return;
    const fallbackName = session.user.email?.split("@")?.[0] || "User";

    setForm({
      name: session.user.name || fallbackName,
      phone: session.user.phone || "",
      address: session.user.address || "",
      email: session.user.email || "",
    });
    setAvatarUrl(session.user.avatar_url || "");

    setHasChanged(false);
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/");
  }, [status, session, router]);

  if (status === "loading") {
    return <p className="text-center mt-10 text-slate-500">{t("loading")}</p>;
  }

  if (!session) return null;

  const user = session.user;
  const displayName = form.name || user.name || user.email?.split("@")?.[0] || "User";
  const roleLabel =
    user.role === "admin" ? t("roles.admin") : user.role === "worker" ? t("roles.worker") : t("roles.guest");

  return (
    <div className="public-page min-h-screen">
      <PublicSection>
        <PublicContainer>
          <div className="max-w-3xl mx-auto">
            <PublicCard className="p-6 md:p-8 mb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                <Avatar
                  sx={{
                    width: 96,
                    height: 96,
                    fontSize: 34,
                    bgcolor: "var(--brass)",
                    border: "3px solid var(--sand-deep)",
                  }}
                  src={avatarUrl || undefined}
                />
                <div className="flex-1 min-w-0">
                  <h1 className="display text-2xl">{displayName}</h1>
                  <p className="text-sm text-slate-500 mt-1 break-all">{user.email}</p>
                  <span className="badge badge-brass mt-2 inline-block">{roleLabel}</span>
                </div>
                <label className="btn btn-outline btn-sm cursor-pointer flex-shrink-0">
                  {uploadingAvatar ? t("buttons.uploading") : t("buttons.changePhoto")}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    disabled={uploadingAvatar}
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
            </PublicCard>

            <PublicCard className="p-4 md:p-6">
              <TabContext value={value}>
                <div className="mb-5">
                  <TabList
                    onChange={handleChangeTab}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    sx={{
                      minHeight: 0,
                      "& .MuiTabs-indicator": { display: "none" },
                      "& .MuiTab-root": {
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: 999,
                        minHeight: 48,
                        px: 2.4,
                        mr: 1,
                        bgcolor: "var(--sand-deep)",
                        color: "var(--ink-soft)",
                      },
                      "& .Mui-selected": {
                        bgcolor: "var(--brass)",
                        color: "white !important",
                      },
                    }}
                  >
                    <Tab label={t("tabs.profile")} value="1" />
                    <Tab label={t("tabs.reservations")} value="2" />
                  </TabList>
                </div>

                <TabPanel value="1" sx={{ p: 0 }}>
                  <div className="max-w-xl mx-auto">
                    <p className="eyebrow">{t("sections.account")}</p>
                    <div className="flex flex-col gap-4 mt-3">
                      <TextField
                        label={t("fields.fullName")}
                        name="name"
                        value={form.name}
                        onChange={handleInput}
                        fullWidth
                      />
                      <TextField
                        label={t("fields.email")}
                        name="email"
                        value={form.email}
                        fullWidth
                        disabled
                      />
                      <TextField
                        label={t("fields.phone")}
                        name="phone"
                        value={form.phone}
                        onChange={handleInput}
                        fullWidth
                      />
                      <TextField
                        label={t("fields.address")}
                        name="address"
                        value={form.address}
                        onChange={handleInput}
                        fullWidth
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={!hasChanged || saving}
                        className="btn btn-primary sm:w-auto w-full"
                      >
                        {saving ? t("buttons.saving") : t("buttons.saveChanges")}
                      </button>

                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={!hasChanged}
                        className="btn btn-outline sm:w-auto w-full"
                      >
                        {t("buttons.cancel")}
                      </button>
                    </div>
                  </div>

                  <Snackbar
                    open={feedback.open}
                    autoHideDuration={4000}
                    onClose={() => setFeedback({ ...feedback, open: false })}
                    anchorOrigin={{ vertical: "top", horizontal: "right" }}
                  >
                    <Alert
                      severity={feedback.severity}
                      variant="filled"
                      onClose={() => setFeedback({ ...feedback, open: false })}
                      sx={{ fontWeight: 600 }}
                    >
                      {feedback.message}
                    </Alert>
                  </Snackbar>
                </TabPanel>

                <TabPanel value="2" sx={{ p: 0 }}>
                  <div className="max-w-full mx-auto">
                    <ReservationsPage embedded />
                  </div>
                </TabPanel>
              </TabContext>
            </PublicCard>
          </div>
        </PublicContainer>
      </PublicSection>
    </div>
  );
}
