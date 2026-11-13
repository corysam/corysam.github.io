import { Heart } from "lucide-react";
import { dictionaries, type Locale } from "@/lib/i18n";

// Composant serveur : la langue arrive en prop plutôt que par le contexte client.
export function Footer({ name, locale }: { name: string; locale: Locale }) {
  const t = dictionaries[locale].footer;
  return (
    <footer className="mx-auto w-full max-w-5xl px-5 sm:px-6 py-12 text-center">
      <p className="flex items-center justify-center gap-1.5 text-sm text-muted">
        {t.developedWith}
        <Heart size={14} className="animate-pulse text-status-red fill-status-red" />
        {t.by} {name}
      </p>
    </footer>
  );
}
