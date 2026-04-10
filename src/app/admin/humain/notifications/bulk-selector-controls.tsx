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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => toggleAll(true)} className="rounded border px-3 py-1.5 text-sm">
        Tout cocher (page)
      </button>
      <button type="button" onClick={() => toggleAll(false)} className="rounded border px-3 py-1.5 text-sm">
        Tout décocher
      </button>
    </div>
  );
}
