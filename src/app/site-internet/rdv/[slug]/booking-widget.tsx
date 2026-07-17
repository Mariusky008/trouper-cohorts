"use client";

// Widget de réservation : charge les vrais créneaux libres, le client en choisit
// un, saisit prénom + téléphone + consentement, et le créneau se bloque. Si le
// créneau vient d'être pris entre-temps, on recharge et on prévient (honnête).
import { useEffect, useState } from "react";

type Slot = { key: string; hhmm: string };
type Day = { date: string; label: string; slots: Slot[] };

export function BookingWidget({ slug, nom, ville, accent }: { slug: string; nom: string; ville: string; accent: string }) {
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [chosen, setChosen] = useState<{ key: string; label: string } | null>(null);
  const [prenom, setPrenom] = useState("");
  const [tel, setTel] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<string | null>(null);

  const loadSlots = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/site-internet/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action: "slots" }),
      });
      const j = await r.json().catch(() => ({}));
      if (Array.isArray(j.days)) setDays(j.days as Day[]);
      setEnabled(Boolean(j.enabled));
    } catch {
      /* réseau */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const pick = (day: Day, slot: Slot) => {
    setChosen({ key: slot.key, label: `${day.label} à ${slot.hhmm}` });
    setErr("");
  };

  const submit = async () => {
    if (!chosen || busy) return;
    if (!prenom.trim() || tel.replace(/\D/g, "").length < 9 || !consent) return;
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/site-internet/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action: "book", slot: chosen.key, prenom: prenom.trim(), tel: tel.trim(), consent: true }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        setDone(String(j.label || chosen.label));
      } else if (j.taken) {
        setErr("Ce créneau vient d'être réservé. Choisissez-en un autre.");
        setChosen(null);
        loadSlots();
      } else {
        setErr(typeof j.error === "string" ? j.error : "Réservation impossible.");
      }
    } catch {
      setErr("Réseau indisponible.");
    } finally {
      setBusy(false);
    }
  };

  const wrap: React.CSSProperties = {
    minHeight: "100vh",
    background: "#FBFAF7",
    fontFamily: "'Inter',system-ui,-apple-system,sans-serif",
    color: "#16160F",
    padding: "26px 18px 40px",
  };
  const inner: React.CSSProperties = { maxWidth: 460, margin: "0 auto" };

  if (done) {
    return (
      <main style={wrap}>
        <div style={{ ...inner, textAlign: "center", paddingTop: 40 }}>
          <div style={{ fontSize: 34, marginBottom: 12 }}>✓</div>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>C&apos;est réservé&nbsp;!</h1>
          <p style={{ fontSize: 15, color: "#3A3A32", lineHeight: 1.55 }}>
            Votre rendez-vous chez <b>{nom}</b> est confirmé&nbsp;: <b style={{ color: accent }}>{done}</b>.
          </p>
          <p style={{ fontSize: 13, color: "#8A8A80", marginTop: 12, lineHeight: 1.5 }}>
            Vous recevrez un rappel. Un imprévu&nbsp;? Contactez directement l&apos;établissement.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={wrap}>
      <div style={inner}>
        <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: accent, fontWeight: 700 }}>Prendre rendez-vous</div>
        <h1 style={{ fontFamily: "Georgia,serif", fontSize: 25, fontWeight: 700, margin: "6px 0 2px" }}>{nom}</h1>
        {ville && <div style={{ fontSize: 13, color: "#8A8A80", marginBottom: 18 }}>{ville}</div>}

        {loading ? (
          <p style={{ fontSize: 14, color: "#8A8A80" }}>Chargement des disponibilités…</p>
        ) : !enabled || days.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #E7E4DC", borderRadius: 14, padding: 16, fontSize: 14, color: "#3A3A32", lineHeight: 1.55 }}>
            Aucun créneau en ligne pour le moment. Appelez ou passez&nbsp;: on vous trouve une place avec plaisir.
          </div>
        ) : (
          <>
            {err && <div style={{ background: "#FBEDED", border: "1px solid #E7C4C4", color: "#9A3B3B", borderRadius: 11, padding: "10px 13px", fontSize: 13, marginBottom: 14 }}>{err}</div>}

            {days.map((day) => (
              <div key={day.date} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, textTransform: "capitalize" }}>{day.label}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {day.slots.map((slot) => {
                    const on = chosen?.key === slot.key;
                    return (
                      <button
                        key={slot.key}
                        type="button"
                        onClick={() => pick(day, slot)}
                        style={{
                          border: `1px solid ${on ? accent : "#E0DCD2"}`,
                          background: on ? accent : "#fff",
                          color: on ? "#fff" : "#16160F",
                          borderRadius: 11,
                          padding: "9px 13px",
                          fontSize: 13.5,
                          fontWeight: 600,
                          fontFamily: "inherit",
                          cursor: "pointer",
                        }}
                      >
                        {slot.hhmm}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {chosen && (
              <div style={{ position: "sticky", bottom: 0, background: "#FBFAF7", paddingTop: 12, marginTop: 6, borderTop: "1px solid #E7E4DC" }}>
                <div style={{ fontSize: 13.5, marginBottom: 10 }}>
                  Créneau choisi&nbsp;: <b style={{ color: accent }}>{chosen.label}</b>
                </div>
                <input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Votre prénom" style={field} />
                <input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="Votre téléphone" inputMode="tel" style={field} />
                <label style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 12.5, color: "#6E6E64", lineHeight: 1.4, margin: "2px 0 12px", cursor: "pointer" }}>
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 2, width: 17, height: 17, flex: "none", accentColor: accent }} />
                  <span>J&apos;accepte d&apos;être recontacté·e au sujet de ce rendez-vous.</span>
                </label>
                <button
                  type="button"
                  onClick={submit}
                  disabled={busy || !prenom.trim() || tel.replace(/\D/g, "").length < 9 || !consent}
                  style={{ width: "100%", background: accent, color: "#fff", border: "none", borderRadius: 13, padding: 14, fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", opacity: busy ? 0.6 : 1 }}
                >
                  {busy ? "Réservation…" : "Confirmer le rendez-vous"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

const field: React.CSSProperties = {
  width: "100%",
  border: "1px solid #E0DCD2",
  borderRadius: 11,
  padding: "12px 14px",
  fontSize: 15,
  fontFamily: "inherit",
  background: "#fff",
  marginBottom: 9,
};
