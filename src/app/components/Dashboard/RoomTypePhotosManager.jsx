"use client";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import StarIcon from "@mui/icons-material/Star";

export default function RoomTypePhotosManager() {
  const t = useTranslations("dashboard.roomPhotos");
  const [loading, setLoading] = useState(true);
  const [roomTypes, setRoomTypes] = useState([]);
  const [images, setImages] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [openType, setOpenType] = useState(null);
  const [busyType, setBusyType] = useState(null);
  const [draggedImageId, setDraggedImageId] = useState(null);
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const notify = (message, severity = "success") => {
    setFeedback({ open: true, message, severity });
  };

  async function fetchAll() {
    setLoading(true);
    try {
      const [typesRes, imagesRes] = await Promise.all([
        fetch("/api/rooms-type"),
        fetch("/api/room-images"),
      ]);
      const typesData = await typesRes.json();
      const imagesData = await imagesRes.json();

      setRoomTypes(Array.isArray(typesData) ? typesData : []);
      setImages(Array.isArray(imagesData) ? imagesData : []);
    } catch (e) {
      console.error(e);
      setRoomTypes([]);
      setImages([]);
      notify(t("errors.load"), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  const imagesByType = useMemo(() => {
    const map = new Map();
    images.forEach((img) => {
      if (!map.has(img.type)) map.set(img.type, []);
      map.get(img.type).push(img);
    });
    map.forEach((list, type) => {
      map.set(
        type,
        [...list].sort((a, b) => {
          if (a.isCover !== b.isCover) return a.isCover ? -1 : 1;
          if (a.order !== b.order) return a.order - b.order;
          return a.id - b.id;
        }),
      );
    });
    return map;
  }, [images]);

  async function uploadForType(type) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        setBusyType(type);

        const fd = new FormData();
        fd.append("file", file);
        fd.append("type", type);

        const upRes = await fetch("/api/upload", { method: "POST", body: fd });
        const upData = await upRes.json();
        if (!upRes.ok) {
          notify(upData?.details || upData?.error || t("errors.upload"), "error");
          return;
        }

        const saveRes = await fetch("/api/room-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, url: upData.url }),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok) {
          notify(saveData?.error || t("errors.save"), "error");
          return;
        }

        await fetchAll();
        notify(t("messages.uploaded"));
      } catch (e) {
        console.error(e);
        notify(t("errors.generic"), "error");
      } finally {
        setBusyType(null);
      }
    };

    input.click();
  }

  async function deleteImage(id) {
    try {
      const res = await fetch(`/api/room-images/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        notify(data?.error || t("errors.delete"), "error");
        return;
      }
      await fetchAll();
      notify(t("messages.deleted"));
    } catch (e) {
      console.error(e);
      notify(t("errors.generic"), "error");
    }
  }

  async function setCoverImage(id) {
    try {
      const res = await fetch(`/api/room-images/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-cover" }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data?.error || t("errors.cover"), "error");
        return;
      }
      await fetchAll();
      notify(t("messages.coverUpdated"));
    } catch (e) {
      console.error(e);
      notify(t("errors.generic"), "error");
    }
  }

  async function persistImageOrder(type, orderedIds) {
    try {
      setBusyType(type);
      const res = await fetch("/api/room-images", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, orderedIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data?.error || t("errors.reorder"), "error");
        await fetchAll();
        return;
      }
      setImages((current) => {
        const typeImages = current.filter((img) => img.type === type);
        const otherImages = current.filter((img) => img.type !== type);
        const imageMap = new Map(typeImages.map((img) => [img.id, img]));
        const reordered = orderedIds
          .map((id, index) => {
            const image = imageMap.get(id);
            return image ? { ...image, order: index } : null;
          })
          .filter(Boolean);
        return [...otherImages, ...reordered];
      });
      notify(t("messages.reordered"));
    } catch (e) {
      console.error(e);
      notify(t("errors.generic"), "error");
      await fetchAll();
    } finally {
      setBusyType(null);
    }
  }

  function handleDragStart(id) {
    setDraggedImageId(id);
  }

  async function handleDropOnImage(targetId) {
    if (!openType || !draggedImageId || draggedImageId === targetId) {
      setDraggedImageId(null);
      return;
    }

    const currentImages = imagesByType.get(openType) || [];
    const fromIndex = currentImages.findIndex((img) => img.id === draggedImageId);
    const toIndex = currentImages.findIndex((img) => img.id === targetId);

    if (fromIndex === -1 || toIndex === -1) {
      setDraggedImageId(null);
      return;
    }

    const reordered = [...currentImages];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    setImages((current) => {
      const otherImages = current.filter((img) => img.type !== openType);
      return [
        ...otherImages,
        ...reordered.map((img, index) => ({ ...img, order: index })),
      ];
    });

    setDraggedImageId(null);
    await persistImageOrder(
      openType,
      reordered.map((img) => img.id),
    );
  }

  if (loading) {
    return (
      <Box textAlign="center" py={6}>
        <CircularProgress />
        <Typography mt={2}>{t("loading")}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={2}>
        {roomTypes.map((rt) => {
          const list = imagesByType.get(rt.type) || [];
          const count = list.length;
          const thumbs = list.slice(0, 2).map((x) => x.url);

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={rt.type}>
              <Card sx={{ borderRadius: 2, overflow: "hidden" }} elevation={3}>
                <CardContent>
                  <Typography fontWeight="bold">
                    {rt.name || rt.type}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {t("photoCount", { count })}
                  </Typography>

                  <Box display="flex" gap={1} mb={1}>
                    {thumbs.length > 0 ? (
                      thumbs.map((url, i) => (
                        <Box
                          key={i}
                          component="img"
                          src={url}
                          alt={`${rt.type}-${i}`}
                          sx={{
                            width: "50%",
                            height: 90,
                            objectFit: "cover",
                            borderRadius: 1,
                            border: "1px solid rgba(0,0,0,0.08)",
                            cursor: "pointer",
                          }}
                          onClick={() => setOpenType(rt.type)}
                        />
                      ))
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          height: 90,
                          borderRadius: 1,
                          bgcolor: "rgba(0,0,0,0.05)",
                          display: "grid",
                          placeItems: "center",
                          color: "text.secondary",
                          fontSize: 12,
                        }}
                      >
                        {t("noPhotosYet")}
                      </Box>
                    )}
                  </Box>

                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<AddPhotoAlternateIcon />}
                      disabled={busyType === rt.type}
                      onClick={() => uploadForType(rt.type)}
                    >
                      {busyType === rt.type ? t("actions.uploading") : t("actions.addPhoto")}
                    </Button>

                    <Button
                      size="small"
                      variant="outlined"
                      disabled={count === 0}
                      onClick={() => setOpenType(rt.type)}
                    >
                      {t("actions.manage")}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog
        open={!!openType}
        onClose={() => setOpenType(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t("dialog.managePhotos", { type: openType })}</DialogTitle>

        <DialogContent dividers>
          <Box display="flex" gap={2} flexWrap="wrap">
            {(imagesByType.get(openType) || []).map((img) => (
              <Box
                key={img.id}
                draggable={busyType !== openType}
                onDragStart={() => handleDragStart(img.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDropOnImage(img.id)}
                onDragEnd={() => setDraggedImageId(null)}
                sx={{
                  width: 180,
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid rgba(0,0,0,0.08)",
                  opacity: draggedImageId === img.id ? 0.5 : 1,
                  cursor: busyType === openType ? "progress" : "grab",
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                  }}
                >
                  {img.isCover ? (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        zIndex: 1,
                        px: 1,
                        py: 0.35,
                        borderRadius: 999,
                        bgcolor: "rgba(15, 23, 42, 0.78)",
                        color: "white",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {t("dialog.cover")}
                    </Box>
                  ) : null}
                  <Box
                    component="img"
                    src={img.url}
                    alt={String(img.id)}
                    onClick={() => setPreviewUrl(img.url)}
                    sx={{
                      width: "100%",
                      height: 120,
                      objectFit: "cover",
                      cursor: "pointer",
                    }}
                  />
                </Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  gap={1}
                  px={1}
                  py={0.75}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t("dialog.order")}: {img.order}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.25 }}
                    >
                      {t("dialog.dragHint")}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {!img.isCover ? (
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<StarIcon fontSize="small" />}
                        onClick={() => setCoverImage(img.id)}
                      >
                        {t("actions.setCover")}
                      </Button>
                    ) : null}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteImage(img.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            ))}

            {(imagesByType.get(openType) || []).length === 0 && (
              <Typography color="text.secondary">
                {t("dialog.noPhotosForType")}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => uploadForType(openType)} variant="contained">
            {t("actions.addPhoto")}
          </Button>
          <Button onClick={() => setOpenType(null)}>{t("dialog.close")}</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        maxWidth="lg"
      >
        <DialogContent sx={{ p: 0, bgcolor: "black" }}>
          {previewUrl && (
            <Box
              component="img"
              src={previewUrl}
              alt="Preview"
              sx={{
                maxWidth: "90vw",
                maxHeight: "85vh",
                width: "full",
                height: "70vh",
                display: "block",
                margin: "0 auto",
                objectFit: "contain",
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: "black" }}>
          <Button variant="contained" onClick={() => setPreviewUrl(null)}>
            {t("dialog.close")}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={feedback.open}
        autoHideDuration={3200}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={feedback.severity}
          variant="filled"
          onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

