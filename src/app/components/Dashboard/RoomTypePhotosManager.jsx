"use client";
import { useEffect, useMemo, useState } from "react";
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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";

export default function RoomTypePhotosManager() {
  const [loading, setLoading] = useState(true);
  const [roomTypes, setRoomTypes] = useState([]);
  const [images, setImages] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [openType, setOpenType] = useState(null);
  const [busyType, setBusyType] = useState(null);

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
          alert(upData?.details || upData?.error || "Upload failed");
          return;
        }

        const saveRes = await fetch("/api/room-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, url: upData.url }),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok) {
          alert(saveData?.error || "Save failed");
          return;
        }

        await fetchAll();
      } catch (e) {
        console.error(e);
        alert("Something went wrong");
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
        alert(data?.error || "Delete failed");
        return;
      }
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Something went wrong");
    }
  }

  if (loading) {
    return (
      <Box textAlign="center" py={6}>
        <CircularProgress />
        <Typography mt={2}>Loading room types...</Typography>
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
                    {count} photo{count === 1 ? "" : "s"}
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
                        No photos yet
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
                      {busyType === rt.type ? "Uploading..." : "Add photo"}
                    </Button>

                    <Button
                      size="small"
                      variant="outlined"
                      disabled={count === 0}
                      onClick={() => setOpenType(rt.type)}
                    >
                      Manage
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
        <DialogTitle>Manage photos — {openType}</DialogTitle>

        <DialogContent dividers>
          <Box display="flex" gap={2} flexWrap="wrap">
            {(imagesByType.get(openType) || []).map((img) => (
              <Box
                key={img.id}
                sx={{
                  width: 180,
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid rgba(0,0,0,0.08)",
                }}
              >
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
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  px={1}
                  py={0.5}
                >
                  <Typography variant="caption" color="text.secondary">
                    order: {img.order}
                  </Typography>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => deleteImage(img.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}

            {(imagesByType.get(openType) || []).length === 0 && (
              <Typography color="text.secondary">
                No photos for this type yet.
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => uploadForType(openType)} variant="contained">
            Add photo
          </Button>
          <Button onClick={() => setOpenType(null)}>Close</Button>
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
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
