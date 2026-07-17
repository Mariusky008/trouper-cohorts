"use client";

// Espace Pro — « Mes clients » : l'audience OPT-IN du commerçant.
// Le pro enregistre les clients qui ACCEPTENT d'être recontactés (consentement
// explicite obligatoire). Ensuite, en un tap sur un client, il ouvre WhatsApp
// avec la demande d'avis pré-rédigée — depuis SON numéro, rien n'est envoyé
// sans lui. C'est le socle de toute relance ciblée (et le préalable honnête à
// une future automatisation). Réservé au commerce (déonto none) : monté
// uniquement quand la sollicitation d'avis est permise.
import { useEffect, useState } from "react";
import { toWaDigits, maskPhone } from "@/lib/site-internet/phone";

type Contact = {
  id: string;
  prenom: string | null;
  phone_e164: string;
  last_contacted_at: string | null;
  created_at: string;
  unsub_token: string;
};

// Parse une liste collée : un client par ligne (« Julie, 06 12 34 56 78 »,
// « Julie 0612345678 », ou juste le numéro). On repère le numéro (suite de
// chiffres), le reste de la ligne = prénom. Fonction pure (module-level).
function parseContactLines(text: string): Array<{ prenom: string; phone: string }> {
  const out: Array<{ prenom: string; phone: string }> = [];
  for (const line of String(text || "").split(/\r?\n/)) {
    const l = line.trim();
    if (!l) continue;
    const m = l.match(/\+?\d[\d\s.\-()]{7,}\d/);
    if (!m) continue;
    const phone = m[0];
    const prenom = l.replace(phone, "").replace(/[,;:\t]+/g, " ").replace(/\s+/g, " ").trim();
    out.push({ prenom, phone });
  }
  return out;
}

export function ProContacts({ slug, token, reviewLink }: { slug: string; token: string; reviewLink: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [prenom, setPrenom] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // Import en masse (liste collée).
  const [imp, setImp] = useState("");
  const [impConsent, setImpConsent] = useState(false);
  const [impBusy, setImpBusy] = useState(false);
  const [impMsg, setImpMsg] = useState("");

  const call = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/site-internet/pro/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, token, ...body }),
    });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, j } as { ok: boolean; status: number; j: Record<string, unknown> };
  };

  // Chargement initial.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { ok, j } = await call({ action: "list" });
        if (!cancelled && ok && Array.isArray(j.contacts)) setContacts(j.contacts as Contact[]);
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

  const digits = toWaDigits(phone);
  const canAdd = consent && digits.length >= 9 && !busy;

  const add = async () => {
    if (!canAdd) return;
    setBusy(true);
    setErr("");
    try {
      const { ok, j } = await call({ action: "add", prenom: prenom.trim(), phone, consent: true });
      if (ok && Array.isArray(j.contacts)) {
        setContacts(j.contacts as Contact[]);
        setPrenom("");
        setPhone("");
        setConsent(false);
      } else {
        setErr(typeof j.error === "string" ? j.error : "Impossible d'ajouter ce client.");
      }
    } catch {
      setErr("Réseau indisponible.");
    } finally {
      setBusy(false);
    }
  };

  const parsedImport = parseContactLines(imp);
  const canImport = impConsent && parsedImport.length > 0 && !impBusy;

  const runImport = async () => {
    if (!canImport) return;
    setImpBusy(true);
    setImpMsg("");
    try {
      const { ok, j } = await call({ action: "add_bulk", consent: true, items: parsedImport });
      if (ok && Array.isArray(j.contacts)) {
        setContacts(j.contacts as Contact[]);
        const su = (j.summary && typeof j.summary === "object" ? j.summary : {}) as Record<string, number>;
        const parts: string[] = [];
        if (su.added) parts.push(`${su.added} ajouté${su.added > 1 ? "s" : ""}`);
        if (su.updated) parts.push(`${su.updated} déjà présent${su.updated > 1 ? "s" : ""}`);
        if (su.optedOut) parts.push(`${su.optedOut} désinscrit${su.optedOut > 1 ? "s" : ""} (ignoré${su.optedOut > 1 ? "s" : ""})`);
        if (su.invalid) parts.push(`${su.invalid} invalide${su.invalid > 1 ? "s" : ""}`);
        setImpMsg(parts.length ? parts.join(" · ") : "Rien à importer.");
        setImp("");
        setImpConsent(false);
      } else {
        setImpMsg(typeof j.error === "string" ? j.error : "Import impossible.");
      }
    } catch {
      setImpMsg("Réseau indisponible.");
    } finally {
      setImpBusy(false);
    }
  };

  const remove = async (id: string) => {
    setContacts((c) => c.filter((x) => x.id !== id)); // optimiste
    try {
      await call({ action: "remove", id });
    } catch {
      /* best-effort */
    }
  };

  // Demande d'avis à un client stocké : ouvre WhatsApp (son numéro) pré-rempli.
  const askReview = (c: Contact) => {
    const greeting = c.prenom ? `Bonjour ${c.prenom},` : "Bonjour,";
    const stopUrl = `${window.location.origin}/site-internet/stop/${c.unsub_token}`;
    const message = `${greeting}\nMerci beaucoup pour votre confiance. Si vous avez une minute, votre avis Google nous aiderait énormément :\n${reviewLink}\nMerci beaucoup !\n\nPour ne plus être recontacté·e : ${stopUrl}`;
    const href = `https://wa.me/${toWaDigits(c.phone_e164)}?text=${encodeURIComponent(message)}`;
    // Journalise (best-effort, ne bloque pas l'ouverture).
    try {
      call({ action: "touch", id: c.id });
      fetch("/api/site-internet/pro/review-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, client_name: c.prenom || null }),
        keepalive: true,
      });
    } catch {
      /* best-effort */
    }
    window.location.href = href;
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .contacts{margin-top:30px;border-top:1px solid var(--hair);padding-top:24px;}
          .pro .contacts .a-title{font-family:Georgia,serif;font-weight:700;font-size:19px;}
          .pro .contacts .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .contacts .add{margin-top:16px;background:#fff;border:1px solid var(--hair);border-radius:14px;padding:14px;}
          .pro .contacts .add .r2{display:flex;gap:9px;}
          .pro .contacts .add input{width:100%;border:1px solid var(--hair);border-radius:11px;padding:11px 13px;font-size:14px;font-family:inherit;background:#fff;}
          .pro .contacts .add input::placeholder{color:#C4C1B8;}
          .pro .contacts .add .f1{flex:0 0 38%;}
          .pro .contacts .add .f2{flex:1;}
          .pro .contacts .consent{display:flex;gap:9px;align-items:flex-start;margin-top:12px;font-size:12.5px;color:var(--soft);line-height:1.4;cursor:pointer;}
          .pro .contacts .consent input{margin-top:2px;width:17px;height:17px;flex:none;accent-color:#188038;}
          .pro .contacts .addbtn{margin-top:13px;width:100%;background:var(--ink);color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;}
          .pro .contacts .addbtn:disabled{opacity:.4;cursor:not-allowed;}
          .pro .contacts .err{margin-top:9px;font-size:12px;color:#B23B3B;}
          .pro .contacts .list{margin-top:18px;display:flex;flex-direction:column;gap:8px;}
          .pro .contacts .c{display:flex;align-items:center;gap:11px;border:1px solid var(--hair);border-radius:12px;padding:10px 12px;background:#fff;}
          .pro .contacts .c .av{width:34px;height:34px;border-radius:50%;background:#F1EFE7;color:var(--ink);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex:none;}
          .pro .contacts .c .nm{min-width:0;}
          .pro .contacts .c .nm b{display:block;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          .pro .contacts .c .nm span{font-size:11.5px;color:var(--faint);}
          .pro .contacts .c .ask{margin-left:auto;flex:none;display:inline-flex;align-items:center;gap:6px;background:#EAF4E4;border:1px solid #CFE6C2;color:#1B7A3E;border-radius:10px;padding:8px 11px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;}
          .pro .contacts .c .ask svg{width:14px;height:14px;}
          .pro .contacts .c .rm{flex:none;border:none;background:none;color:var(--faint);font-size:15px;cursor:pointer;padding:4px;}
          .pro .contacts .none{margin-top:16px;font-size:13px;color:var(--faint);line-height:1.45;}
          .pro .contacts .imp{margin-top:12px;border:1px solid var(--hair);border-radius:14px;background:#fff;overflow:hidden;}
          .pro .contacts .imp summary{list-style:none;cursor:pointer;padding:13px 14px;font-size:13.5px;font-weight:600;color:var(--ink);}
          .pro .contacts .imp summary::-webkit-details-marker{display:none;}
          .pro .contacts .imp[open] summary{border-bottom:1px solid var(--hair);}
          .pro .contacts .imp-body{padding:14px;}
          .pro .contacts .imp-hint{font-size:12px;color:var(--soft);line-height:1.45;margin-bottom:10px;}
          .pro .contacts .imp-body textarea{width:100%;border:1px solid var(--hair);border-radius:11px;padding:11px 13px;font-size:14px;font-family:inherit;background:#fff;resize:vertical;line-height:1.5;}
          .pro .contacts .imp-body textarea::placeholder{color:#C4C1B8;}
          .pro .contacts .imp-msg{margin-top:10px;font-size:12.5px;color:#1B7A3E;font-weight:600;line-height:1.4;}
          `,
        }}
      />
      <div className="contacts">
        <div className="a-title">👥 Mes clients</div>
        <div className="a-sub">
          Enregistrez les clients qui <b>acceptent d&apos;être recontactés</b>. Ensuite, un tap suffit pour leur
          demander un avis — depuis votre WhatsApp, rien n&apos;est envoyé sans vous.
        </div>

        <div className="add">
          <div className="r2">
            <input
              className="f1"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Prénom"
              autoComplete="off"
            />
            <input
              className="f2"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              autoComplete="off"
            />
          </div>
          <label className="consent">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>Ce client m&apos;a donné son accord pour être recontacté par WhatsApp (avis, disponibilités).</span>
          </label>
          <button className="addbtn" onClick={add} disabled={!canAdd}>
            {busy ? "Ajout…" : "Ajouter à mes clients"}
          </button>
          {err && <div className="err">{err}</div>}
        </div>

        <details className="imp">
          <summary>📋 Importer une liste de clients</summary>
          <div className="imp-body">
            <div className="imp-hint">Collez vos clients, <b>un par ligne</b> (prénom et numéro). Ex. « Julie, 06 12 34 56 78 ».</div>
            <textarea
              value={imp}
              onChange={(e) => setImp(e.target.value)}
              placeholder={"Julie, 06 12 34 56 78\nMarc 06 98 76 54 32\n07 11 22 33 44"}
              rows={5}
            />
            <label className="consent">
              <input type="checkbox" checked={impConsent} onChange={(e) => setImpConsent(e.target.checked)} />
              <span>Tous ces clients m&apos;ont donné leur accord pour être recontactés par WhatsApp.</span>
            </label>
            <button className="addbtn" onClick={runImport} disabled={!canImport}>
              {impBusy ? "Import…" : parsedImport.length > 0 ? `Importer ${parsedImport.length} client${parsedImport.length > 1 ? "s" : ""}` : "Importer"}
            </button>
            {impMsg && <div className="imp-msg">{impMsg}</div>}
          </div>
        </details>

        {loaded && contacts.length === 0 ? (
          <div className="none">
            Aucun client enregistré pour l&apos;instant. Ajoutez-en un après une visite — avec son accord.
          </div>
        ) : (
          <div className="list">
            {contacts.map((c) => (
              <div className="c" key={c.id}>
                <span className="av">{(c.prenom || "?").slice(0, 1).toUpperCase()}</span>
                <div className="nm">
                  <b>{c.prenom || "Client"}</b>
                  <span>{maskPhone(c.phone_e164)}</span>
                </div>
                <button className="ask" onClick={() => askReview(c)}>
                  <svg viewBox="0 0 24 24" fill="#1B7A3E"><path d="M12 2l2.9 6.3 6.9.6-5.2 4.5 1.6 6.7L12 17l-6.2 3.6 1.6-6.7L2.2 8.9l6.9-.6z" /></svg>
                  Avis
                </button>
                <button className="rm" aria-label="Retirer" onClick={() => remove(c.id)}>🗑</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
