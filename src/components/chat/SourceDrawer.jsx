import React from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useLang } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import { sectionRoute } from "@/lib/citations";

export default function SourceDrawer({ source, onClose }) {
  const { lang } = useLang();
  if (!source) return null;
  return (
    <div className="absolute inset-0 z-10 bg-background flex flex-col p-4">
      <button onClick={onClose} aria-label={t(lang, "chat_close")} className="self-end p-1">
        <X className="w-5 h-5" />
      </button>
      <h3 className="font-heading text-lg font-bold mb-2">{source.title}</h3>
      <p className="text-sm opacity-70 mb-4">{source.type}</p>
      <Link to={sectionRoute(source.type)} onClick={onClose} className="text-primary font-semibold underline">
        {t(lang, "chat_view_in_site")}
      </Link>
    </div>
  );
}
