import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { apiClient } from "../../api/client";
import { resolveUploadUrl } from "../../api/uploads.api";
import { loadPdfJS } from "../../utils/dsrParser";

type UploadedFilePreviewProps = {
  src: string;
  pdfPage?: number;
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
  pdfPage,
  title = "Uploaded preview",
  alt = "Uploaded preview",
  small = false,
  className,
  imageClassName,
  imageStyle,
}: UploadedFilePreviewProps) {
  const [previewSrc, setPreviewSrc] = useState(() => isLocalPreview(src) ? src : "");
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
      .then(async (response) => {
        if (cancelled) return;
        const blob = response.data as Blob;
        const responseType = blob.type || response.headers["content-type"] || "";
        if (responseType.includes("text/html")) {
          setFailed(true);
          setPreviewSrc("");
          return;
        }
        const isPdf = responseType.toLowerCase().includes("pdf") || /\.pdf($|[?#])/i.test(src);
        if (isPdf && pdfPage) {
          const pdfjs = await loadPdfJS();
          const pdf = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise;
          const sourcePage = await pdf.getPage(Math.min(Math.max(pdfPage, 1), pdf.numPages));
          // Render at print-friendly density so fine text remains readable on
          // high-DPI screens while keeping memory usage bounded.
          const previewScale = Math.min(3, Math.max(2.25, window.devicePixelRatio || 1));
          const viewport = sourcePage.getViewport({ scale: previewScale });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) throw new Error("PDF preview canvas is unavailable");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          await sourcePage.render({ canvasContext: context, viewport }).promise;
          if (cancelled) return;
          setContentType("image/png");
          setPreviewSrc(canvas.toDataURL("image/png"));
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
  }, [src, pdfPage]);

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
        style={{
          ...imageStyle,
          display: "block",
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          objectPosition: "center",
        }}
      />
    );
  }

  return (
    <iframe
      title={title}
      src={`${previewSrc}#page=${pdfPage || 1}&toolbar=0&navpanes=0&pagemode=none&view=FitH&zoom=page-fit`}
      className={className || (small ? "mt-3 h-48 w-full rounded-lg border bg-white" : "absolute inset-0 w-full h-full")}
      style={{
        border: small ? "1px solid rgb(203 213 225)" : "0",
        boxSizing: "border-box",
        display: "block",
        maxHeight: "100%",
        maxWidth: "100%",
      }}
    />
  );
}
