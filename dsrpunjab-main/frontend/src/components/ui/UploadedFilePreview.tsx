import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { apiClient } from "../../api/client";
import { resolveUploadUrl } from "../../api/uploads.api";

type UploadedFilePreviewProps = {
  src: string;
  title?: string;
  alt?: string;
  small?: boolean;
  className?: string;
  imageClassName?: string;
  imageStyle?: CSSProperties;
};

function isLocalPreview(src: string) {
  return /^(blob:|data:)/i.test(src);
}

function isImageUrl(src: string) {
  return src.startsWith("data:image") || /\.(jpe?g|png|gif|webp|bmp|tiff?)(#.*|\?.*)?$/i.test(src);
}

export default function UploadedFilePreview({
  src,
  title = "Uploaded preview",
  alt = "Uploaded preview",
  small = false,
  className,
  imageClassName,
  imageStyle,
}: UploadedFilePreviewProps) {
  const [previewSrc, setPreviewSrc] = useState(src);
  const [contentType, setContentType] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";
    const resolved = resolveUploadUrl(src);

    setFailed(false);
    setContentType("");

    if (!resolved) {
      setPreviewSrc("");
      setFailed(Boolean(src));
      return;
    }

    if (isLocalPreview(resolved)) {
      setPreviewSrc(resolved);
      return;
    }

    apiClient
      .get(resolved, { responseType: "blob" })
      .then((response) => {
        if (cancelled) return;
        const blob = response.data as Blob;
        const responseType = blob.type || response.headers["content-type"] || "";
        if (responseType.includes("text/html")) {
          setFailed(true);
          setPreviewSrc("");
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setContentType(responseType);
        setPreviewSrc(objectUrl);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Uploaded file preview failed:", error);
        setFailed(true);
        setPreviewSrc("");
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (failed) {
    return (
      <div className={`${className || ""} flex items-center justify-center bg-slate-100 text-center text-xs text-slate-500`}>
        Preview unavailable
      </div>
    );
  }

  if (!previewSrc) {
    return (
      <div className={`${className || ""} flex items-center justify-center bg-slate-100 text-xs text-slate-500`}>
        Loading preview...
      </div>
    );
  }

  const isImage = contentType.startsWith("image/") || isImageUrl(src);

  if (isImage) {
    return (
      <img
        src={previewSrc}
        alt={alt}
        className={imageClassName || className || (small ? "mt-3 max-h-48 w-full rounded-lg object-contain border" : "absolute inset-0 w-full h-full")}
        style={imageStyle}
      />
    );
  }

  return (
    <iframe
      title={title}
      src={`${previewSrc}#toolbar=0&navpanes=0&scrollbar=0&view=Fit&zoom=page-fit`}
      className={className || (small ? "mt-3 h-48 w-full rounded-lg border bg-white" : "absolute inset-0 w-full h-full")}
      style={{ border: "none", display: "block" }}
    />
  );
}
