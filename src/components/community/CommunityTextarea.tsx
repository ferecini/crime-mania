"use client";

import { useEffect, useState } from "react";

const DRAFT_PREFIX = "cm-community-draft:";

export function useCommunityDraft(key: string) {
  const storageKey = DRAFT_PREFIX + key;
  const [value, setValue] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setValue(saved);
    } catch {
      /* ignore */
    }
  }, [storageKey]);
  useEffect(() => {
    try {
      if (value) localStorage.setItem(storageKey, value);
      else localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }, [storageKey, value]);
  return [value, setValue] as const;
}

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  rows?: number;
  hint?: string;
  disabled?: boolean;
};

export function CommunityTextarea({
  id,
  label,
  value,
  onChange,
  maxLength,
  rows = 6,
  hint,
  disabled,
}: Props) {
  return (
    <label htmlFor={id} className="block text-sm">
      <span className="mb-1.5 block text-cm-gray">{label}</span>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        rows={rows}
        disabled={disabled}
        className="cm-input min-h-[44px] w-full resize-y"
      />
      <span className="mt-1 block text-xs text-cm-gray">
        {value.length}/{maxLength}
        {hint ? ` — ${hint}` : ""}
      </span>
    </label>
  );
}

export function clearCommunityDraft(key: string) {
  try {
    localStorage.removeItem(DRAFT_PREFIX + key);
  } catch {
    /* ignore */
  }
}
