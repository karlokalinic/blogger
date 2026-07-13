"use client";

import { Check, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ShareButtonProps = {
  title: string;
};

export function ShareButton({ title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
  }, []);

  const share = async () => {
    const data = { title, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else await navigator.clipboard.writeText(data.url);
      setCopied(true);
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Closing the native share sheet is not an error the reader needs to see.
    }
  };

  return <button type="button" onClick={share}>{copied ? <Check size={14} /> : <Share2 size={14} />} {copied ? "Copied" : "Share"}</button>;
}
