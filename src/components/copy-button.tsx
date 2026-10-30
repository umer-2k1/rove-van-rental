"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard is blocked in some browsers; the text stays selectable.
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 gap-1.5 px-2 text-[11px] text-muted-foreground hover:text-foreground"
      onClick={copy}
      aria-label={`${label} ${value}`}
    >
      {copied ? (
        <>
          <CheckIcon className="size-3" aria-hidden="true" />
          Copied
        </>
      ) : (
        <>
          <CopyIcon className="size-3" aria-hidden="true" />
          {label}
        </>
      )}
    </Button>
  );
}
