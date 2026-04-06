const fs = require("fs/promises");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const UPLOADS_ROOT = path.join(__dirname, "..", "uploads");

/** Anonymous generations: one shared folder, not tied to any user. */
const GUEST_FOLDER = "guest";

/** Safe folder segment from email (keeps @ and .; strips invalid path chars). */
function folderNameFromEmail(email) {
  const e = String(email).trim().toLowerCase();
  if (!e) {
    throw new Error("email is required for generation storage folder");
  }
  return e.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").replace(/[. ]+$/g, "");
}

function generationsDir(email) {
  return path.join(UPLOADS_ROOT, folderNameFromEmail(email), "generations");
}

async function ensureGenerationsDir(email) {
  const dir = generationsDir(email);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

function extFromContentType(ct) {
  if (!ct) return ".png";
  const lower = ct.toLowerCase();
  if (lower.includes("png")) return ".png";
  if (lower.includes("jpeg") || lower.includes("jpg")) return ".jpg";
  if (lower.includes("webp")) return ".webp";
  if (lower.includes("gif")) return ".gif";
  return ".png";
}

/**
 * Downloads a remote image and saves it under uploads/<email>/generations/.
 * Returns { publicPath, filePath } where publicPath is e.g. /uploads/<email>/generations/<file>.png
 */
async function saveRemoteImageToUserGenerations(sourceUrl, email) {
  const folderSegment = folderNameFromEmail(email);

  const parsed = new URL(sourceUrl);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("image URL must be http or https");
  }

  const res = await fetch(sourceUrl, {
    redirect: "follow",
    headers: { "User-Agent": "ai-image-generator-backend/1.0" },
  });
  if (!res.ok) {
    throw new Error(`Failed to download image (${res.status})`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const ext = extFromContentType(res.headers.get("content-type"));
  const dir = await ensureGenerationsDir(email);
  const filename = `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`;
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, buf);

  const publicPath = `/uploads/${folderSegment}/generations/${filename}`;
  return { publicPath, filePath };
}

async function ensureGuestUploadsDir() {
  const dir = path.join(UPLOADS_ROOT, GUEST_FOLDER);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Saves a remote image under uploads/guest/ (not in MongoDB, not in user history).
 */
async function saveRemoteGuestImage(sourceUrl) {
  const parsed = new URL(sourceUrl);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("image URL must be http or https");
  }

  const res = await fetch(sourceUrl, {
    redirect: "follow",
    headers: { "User-Agent": "ai-image-generator-backend/1.0" },
  });
  if (!res.ok) {
    throw new Error(`Failed to download image (${res.status})`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const ext = extFromContentType(res.headers.get("content-type"));
  const dir = await ensureGuestUploadsDir();
  const filename = `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`;
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, buf);

  const publicPath = `/uploads/${GUEST_FOLDER}/${filename}`;
  return { publicPath, filePath };
}

module.exports = {
  saveRemoteImageToUserGenerations,
  saveRemoteGuestImage,
  ensureGenerationsDir,
  generationsDir,
  folderNameFromEmail,
};
