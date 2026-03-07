import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { requireSameOrigin } from "@/lib/security";

const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_,
    secretAccessKey: process.env.AWS_SECRET_KEY_,
  },
});

// Handle POST requests for this route.
export async function POST(req) {
  try {
    const originError = requireSameOrigin(req);
    if (originError) return originError;

    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session?.user || (role !== "admin" && role !== "worker")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file"); // <input name="file" />
    const type = formData.get("type"); // room type string

    if (!file || !type) {
      return NextResponse.json(
        { error: "Missing file or type" },
        { status: 400 },
      );
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Normalize filename and add a timestamp to avoid collisions.
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
    const safeType = String(type).replace(/[^a-zA-Z0-9\-_]/g, "-");
    const key = `room-types/${safeType}/${Date.now()}-${safeName}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        ACL: "public-read",
      }),
    );

    const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({ url, key });
  } catch (err) {
    console.error("upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
