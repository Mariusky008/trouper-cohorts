"use client";

import { useEffect, useState } from "react";

type BulkSelectorControlsProps = {
  formId: string;
};

export function BulkSelectorControls({ formId }: BulkSelectorControlsProps) {
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!form) return;

    const boxes = Array.from(form.querySelectorAll<HTMLInputElement>('input[data-bulk-item="true"]'));
    const refreshCount = () => {
      const checked = boxes.filter((box) => box.checked).length;
      setSelectedCount(checked);
    };

    boxes.forEach((box) => box.addEventListener("change", refreshCount));
    refreshCount();

    return () => {
      boxes.forEach((box) => box.removeEventListener("change", refreshCount));
    };
  }, [formId]);

  const toggleAll = (checked: boolean) => {
    const root = document.getElementById(formId);
    if (!root) return;

    const boxes = root.querySelectorAll<HTMLInputElement>('input[data-bulk-item="true"]');
    boxes.forEach((box) => {
      box.checked = checked;
    });
    setSelectedCount(checked ? boxes.length : 0);
  };

  const setModeAndSubmit = (mode: "read" | "unread", selectAll: boolean) => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    if (selectAll) {
      const total = form.querySelectorAll<HTMLInputElement>('input[data-bulk-item="true"]').length;
      const label = mode === "read" ? "lues" : "non lues";
      const confirmed = window.confirm(`Confirmer la mise à jour de ${total} notification(s) en "${label}" ?`);
      if (!confirmed) return;
      toggleAll(true);
    } else {
      if (selectedCount === 0) {
        window.alert("Aucune notification sélectionnée.");
        return;
      }
    }

    const modeInput = form.querySelector<HTMLInputElement>('input[data-bulk-mode="true"]');
    if (modeInput) modeInput.value = mode;

    form.requestSubmit();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setModeAndSubmit("read", false)}
        className="rounded border px-3 py-1.5 text-sm disabled:pointer-events-none disabled:opacity-50"
        disabled={selectedCount === 0}
      >
        Marquer sélection lue
      </button>
      <button
        type="button"
        onClick={() => setModeAndSubmit("unread", false)}
        className="rounded border px-3 py-1.5 text-sm disabled:pointer-events-none disabled:opacity-50"
        disabled={selectedCount === 0}
      >
        Marquer sélection non lue
      </button>
      <button type="button" onClick={() => toggleAll(true)} className="rounded border px-3 py-1.5 text-sm">
        Tout cocher (page)
      </button>
      <button type="button" onClick={() => toggleAll(false)} className="rounded border px-3 py-1.5 text-sm">
        Tout décocher
      </button>
      <button type="button" onClick={() => setModeAndSubmit("read", true)} className="rounded border px-3 py-1.5 text-sm">
        Marquer toute la page lue
      </button>
      <button type="button" onClick={() => setModeAndSubmit("unread", true)} className="rounded border px-3 py-1.5 text-sm">
        Marquer toute la page non lue
      </button>
      <span className="text-xs text-muted-foreground">{selectedCount} sélectionnée(s)</span>
    </div>
  );
}
