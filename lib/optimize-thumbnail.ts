const MAX_INPUT_BYTES = 20 * 1024 * 1024;
const MAX_DIMENSION = 960;
const WEBP_QUALITY = 0.8;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function optimizeThumbnail(file: File): Promise<File> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error("封面仅支持 JPEG、PNG 或 WebP");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("封面原图不能超过 20 MB");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("无法读取封面图片");
  }

  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("浏览器不支持封面处理");
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY);
    });
    if (!blob) throw new Error("封面转换失败");

    const basename = file.name.replace(/\.[^.]+$/, "") || "thumbnail";
    return new File([blob], `${basename}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}
