"use client";

type BulkSelectorControlsProps = {
  formId: string;
};

export function BulkSelectorControls({ formId }: BulkSelectorControlsProps) {
  const toggleAll = (checked: boolean) => {
    const root = document.getElementById(formId);
    if (!root) return;

    const boxes = root.querySelectorAll<HTMLInputElement>('input[data-bulk-item="true"]');
    boxes.forEach((box) => {
      box.checked = checked;
    });
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
      const selected = form.querySelectorAll<HTMLInputElement>('input[data-bulk-item="true"]:checked').length;
      if (selected === 0) {
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
      <button type="button" onClick={() => setModeAndSubmit("read", false)} className="rounded border px-3 py-1.5 text-sm">
        Marquer sélection lue
      </button>
      <button type="button" onClick={() => setModeAndSubmit("unread", false)} className="rounded border px-3 py-1.5 text-sm">
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
    </div>
  );
}
