"use client";
export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        background: "#07B083", color: "#0B0D12", border: "none",
        padding: "8px 20px", borderRadius: "8px", fontWeight: 800,
        fontSize: 14, cursor: "pointer",
      }}
    >
      🖨️ Imprimer / PDF
    </button>
  );
}
