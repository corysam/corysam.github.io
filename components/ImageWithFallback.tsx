"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { useI18n } from "./I18nProvider";

export function ImageWithFallback({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [didError, setDidError] = useState(false);
  const [renderedSrc, setRenderedSrc] = useState(src);

  // L'état d'erreur suit la source : un échec passé ne condamne pas la suivante
  // (audit U1). L'ajustement se fait pendant le rendu plutôt que dans un effet,
  // ce qui évite un rendu en cascade (react-hooks/set-state-in-effect).
  if (src !== renderedSrc) {
    setRenderedSrc(src);
    setDidError(false);
  }

  if (didError) {
    return (
      <div className={`grid place-items-center bg-card text-muted ${className ?? ""}`}>
        <ImageOff size={28} aria-label={t.modal.imageUnavailable(alt)} />
      </div>
    );
  }

  // Export statique avec images non optimisées : <img> natif suffit ici.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setDidError(true)} />;
}
