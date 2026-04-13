"use client";

import { useEffect, useRef, useState } from "react";
import { FaShareAlt, FaTelegramPlane, FaInstagram, FaLink, FaCheck } from "react-icons/fa";

type Props = {
  dramaId: string;
  title: string;
};

export default function ShareButton({ dramaId, title }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const getUrl = () =>
    typeof window !== "undefined"
      ? `${window.location.origin}/movie/${dramaId}`
      : `/movie/${dramaId}`;

  const shareText = `${title} — IDUB da tomosha qiling`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const shareTelegram = () => {
    const url = encodeURIComponent(getUrl());
    const text = encodeURIComponent(shareText);
    window.open(
      `https://t.me/share/url?url=${url}&text=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
    setOpen(false);
  };

  const shareInstagram = async () => {
    // Instagram doesn't support direct web URL sharing; copy link and open IG
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, text: shareText, url: getUrl() });
        setOpen(false);
        return true;
      } catch {
        // user cancelled or failed
      }
    }
    return false;
  };

  const onToggle = async () => {
    if (!open && (await nativeShare())) return;
    setOpen((v) => !v);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        aria-label="Ulashish"
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-green-500/15 hover:border-green-500/30 hover:text-green-400 transition-all duration-200"
      >
        <FaShareAlt className="size-3.5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 z-40 rounded-xl border border-white/10 bg-black/85 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden text-left"
        >
          <button
            onClick={shareTelegram}
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-sm"
          >
            <span className="w-8 h-8 rounded-lg bg-[#229ED9]/15 border border-[#229ED9]/30 flex items-center justify-center">
              <FaTelegramPlane className="text-[#229ED9]" />
            </span>
            <span className="font-semibold text-white/90">Telegram</span>
          </button>
          <button
            onClick={shareInstagram}
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-sm"
          >
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F58529]/20 via-[#DD2A7B]/20 to-[#8134AF]/20 border border-white/10 flex items-center justify-center">
              <FaInstagram className="text-[#E1306C]" />
            </span>
            <div className="flex flex-col items-start">
              <span className="font-semibold text-white/90">Instagram</span>
              <span className="text-[10px] text-gray-400">Havola nusxalanadi</span>
            </div>
          </button>
          <button
            onClick={copyLink}
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-sm border-t border-white/5"
          >
            <span className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
              {copied ? (
                <FaCheck className="text-green-400" />
              ) : (
                <FaLink className="text-white/80" />
              )}
            </span>
            <span className="font-semibold text-white/90">
              {copied ? "Nusxalandi" : "Havolani nusxalash"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
