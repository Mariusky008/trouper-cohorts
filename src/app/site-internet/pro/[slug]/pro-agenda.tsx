"use client";

// Espace Pro — mini-agenda : le pro définit ses disponibilités (une plage par
// jour + une durée de créneau) et voit / annule ses rendez-vous. Les clients
// réservent depuis la page publique /site-internet/rdv/[slug]. Disponible pour
// tous les métiers (la santé en profite le plus).
import { useEffect, useState } from "react";

type DayState = { open: boolean; start: string; end: string };
type Booking = { id: string; slot: string; label: string; prenom: string; tel: string };

const ORDER = [1, 2, 3, 4, 5, 6, 0];
const NAMES: Record<number, string> = { 1: "Lundi", 2: "Mardi", 3: "Mercredi", 4: "Jeudi", 5: "Vendredi", 6: "Samedi", 0: "Dimanche" };
const pad = (n: number) => String(n).padStart(2, "0");
const toMin = (t: string) => {
  const [h, m] = String(t || "").split(":").map((x) => Number(x) || 0);
  return h * 60 + m;
};
const toTime = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

const DEFAULT: Record<number, DayState> = Object.fromEntries(
  ORDER.map((wd) => [wd, { open: false, start: "09:00", end: "18:00" } as DayState])
);

export function ProAgenda({ slug, token }: { slug: string; token: string }) {
  const [slotMin, setSlotMin] = useState(30);
  const [dayState, setDayState] = useState<Record<number, DayState>>(DEFAULT);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const call = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/site-internet/pro/agenda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, token, ...body }),
    });
    return (await r.json().catch(() => ({}))) as Record<string, unknown>;
  };

  const apply = (j: Record<string, unknown>) => {
    if (typeof j.slotMinutes === "number") setSlotMin(j.slotMinutes);
    const next: Record<number, DayState> = Object.fromEntries(ORDER.map((wd) => [wd, { open: false, start: "09:00", end: "18:00" }]));
    if (Array.isArray(j.windows)) {
      for (const w of j.windows as Array<Record<string, unknown>>) {
        const wd = Number(w.weekday);
        if (wd in next) next[wd] = { open: true, start: toTime(Number(w.start_min)), end: toTime(Number(w.end_min)) };
      }
    }
    setDayState(next);
    if (Array.isArray(j.bookings)) setBookings(j.bookings as Booking[]);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const j = await call({ action: "get" });
        if (!cancelled) apply(j);
      } catch {
        /* best-effort */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, token]);

  const setDay = (wd: number, patch: Partial<DayState>) => setDayState((s) => ({ ...s, [wd]: { ...s[wd], ...patch } }));

  const save = async () => {
    setBusy(true);
    setSaved(false);
    const windows = ORDER.filter((wd) => dayState[wd].open && toMin(dayState[wd].end) > toMin(dayState[wd].start)).map((wd) => ({
      weekday: wd,
      start_min: toMin(dayState[wd].start),
      end_min: toMin(dayState[wd].end),
    }));
    try {
      const j = await call({ action: "set", slot_minutes: slotMin, windows });
      apply(j);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch {
      /* best-effort */
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id: string) => {
    setBookings((b) => b.filter((x) => x.id !== id));
    try {
      await call({ action: "cancel", id });
    } catch {
      /* best-effort */
    }
  };

  const anyOpen = ORDER.some((wd) => dayState[wd].open);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .agenda{margin-top:30px;border-top:1px solid var(--hair);padding-top:24px;}
          .pro .agenda .a-title{font-family:Georgia,serif;font-weight:700;font-size:19px;}
          .pro .agenda .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .agenda .slot{margin-top:16px;display:flex;align-items:center;gap:9px;font-size:13px;color:var(--soft);}
          .pro .agenda .slot select{border:1px solid var(--hair);border-radius:9px;padding:7px 9px;font-size:13px;font-family:inherit;background:#fff;}
          .pro .agenda .days{margin-top:14px;display:flex;flex-direction:column;gap:7px;}
          .pro .agenda .day{display:flex;align-items:center;gap:9px;border:1px solid var(--hair);border-radius:11px;padding:9px 11px;background:#fff;}
          .pro .agenda .day .nm{flex:0 0 84px;font-size:13px;font-weight:600;}
          .pro .agenda .day input[type=checkbox]{width:17px;height:17px;accent-color:#188038;flex:none;}
          .pro .agenda .day .times{margin-left:auto;display:flex;align-items:center;gap:6px;}
          .pro .agenda .day input[type=time]{border:1px solid var(--hair);border-radius:8px;padding:6px 7px;font-size:13px;font-family:inherit;background:#fff;}
          .pro .agenda .day.off .times{opacity:.35;pointer-events:none;}
          .pro .agenda .savebtn{margin-top:14px;width:100%;background:var(--ink);color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;}
          .pro .agenda .savebtn:disabled{opacity:.5;cursor:not-allowed;}
          .pro .agenda .link{margin-top:11px;font-size:11.5px;color:var(--faint);line-height:1.45;}
          .pro .agenda .rdv{margin-top:22px;}
          .pro .agenda .rdv .h{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--soft);font-weight:600;margin-bottom:11px;}
          .pro .agenda .b{display:flex;align-items:center;gap:11px;border:1px solid var(--hair);border-radius:11px;padding:10px 12px;background:#fff;margin-bottom:7px;}
          .pro .agenda .b .info{min-width:0;}
          .pro .agenda .b .info b{display:block;font-size:13px;font-weight:600;}
          .pro .agenda .b .info span{font-size:11.5px;color:var(--faint);}
          .pro .agenda .b .x{margin-left:auto;flex:none;border:1px solid var(--hair);background:none;color:var(--soft);border-radius:9px;padding:6px 10px;font-size:11.5px;font-weight:600;cursor:pointer;font-family:inherit;}
          .pro .agenda .none{font-size:13px;color:var(--faint);line-height:1.45;}
          `,
        }}
      />
      <div className="agenda">
        <div className="a-title">📅 Mes disponibilités</div>
        <div className="a-sub">
          Choisissez vos horaires&nbsp;: vos clients réservent un vrai créneau en ligne, et vous le retrouvez ici.
        </div>

        <div className="slot">
          Durée d&apos;un rendez-vous&nbsp;:
          <select value={slotMin} onChange={(e) => setSlotMin(Number(e.target.value))}>
            {[15, 20, 30, 45, 60, 90].map((m) => (
              <option key={m} value={m}>{m} min</option>
            ))}
          </select>
        </div>

        <div className="days">
          {ORDER.map((wd) => {
            const d = dayState[wd];
            return (
              <div key={wd} className={`day${d.open ? "" : " off"}`}>
                <input type="checkbox" checked={d.open} onChange={(e) => setDay(wd, { open: e.target.checked })} aria-label={NAMES[wd]} />
                <span className="nm">{NAMES[wd]}</span>
                <div className="times">
                  <input type="time" value={d.start} onChange={(e) => setDay(wd, { start: e.target.value })} />
                  <span>→</span>
                  <input type="time" value={d.end} onChange={(e) => setDay(wd, { end: e.target.value })} />
                </div>
              </div>
            );
          })}
        </div>

        <button className="savebtn" onClick={save} disabled={busy}>
          {busy ? "Enregistrement…" : saved ? "✓ Enregistré" : "Enregistrer mes disponibilités"}
        </button>
        {anyOpen && (
          <div className="link">
            Votre page de réservation&nbsp;: <b>/site-internet/rdv/{slug}</b> — c&apos;est elle qu&apos;ouvre le bouton « Prendre rendez-vous » de votre site.
          </div>
        )}

        <div className="rdv">
          <div className="h">Mes prochains rendez-vous</div>
          {loaded && bookings.length === 0 ? (
            <div className="none">Aucun rendez-vous à venir pour l&apos;instant.</div>
          ) : (
            bookings.map((b) => (
              <div className="b" key={b.id}>
                <div className="info">
                  <b>{b.label}</b>
                  <span>{b.prenom}{b.tel ? ` · ${b.tel}` : ""}</span>
                </div>
                <button className="x" onClick={() => cancel(b.id)}>Annuler</button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
