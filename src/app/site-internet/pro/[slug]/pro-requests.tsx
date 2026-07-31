"use client";

// « Demandes reçues » — les vrais clients qui ont laissé leurs coordonnées via
// l'assistante du site en ligne. Ce ne sont PAS des rendez-vous : personne n'a
// réservé de créneau, le client attend un rappel. L'écran sert donc à une seule
// chose : rappeler, puis marquer comme traité pour savoir ce qu'il reste à faire.
import { useCallback, useEffect, useState } from "react";
import { toWaDigits } from "@/lib/site-internet/phone";

type Req = {
  id: string;
  prenom: string;
  tel: string;
  kind: string;
  souhait: string | null;
  pour_qui: string | null;
  status: string;
  created_at: string;
};

const KIND_LABEL: Record<string, string> = {
  rdv: "Rendez-vous",
  rappel: "Rappel",
  devis: "Devis",
  acompte: "Réservation",
};

// « il y a 2 h », « hier », « le 12/03 » — plus parlant qu'une date brute.
function ago(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const min = Math.floor((Date.now() - t) / 60000);
  if (min < 2) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  if (h < 48) return "hier";
  return new Date(t).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export function ProRequests({ slug, token }: { slug: string; token: string }) {
  const [items, setItems] = useState<Req[]>([]);
  const [loaded, setLoaded] = useState(false);

  const call = useCallback(
    async (body: Record<string, unknown>) => {
      try {
        const r = await fetch("/api/site-internet/pro/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, token, ...body }),
        });
        const j = await r.json().catch(() => ({}));
        if (Array.isArray(j.requests)) setItems(j.requests as Req[]);
      } catch {
        /* best-effort : l'écran reste utilisable */
      } finally {
        setLoaded(true);
      }
    },
    [slug, token]
  );

  useEffect(() => {
    call({ action: "list" });
  }, [call]);

  const news = items.filter((i) => i.status !== "done");
  const done = items.filter((i) => i.status === "done");

  const row = (r: Req) => (
    <div className={`rq${r.status === "done" ? " off" : ""}`} key={r.id}>
      <div className="rq-b">
        <b>
          {r.prenom}
          <em className="kd">{KIND_LABEL[r.kind] || "Demande"}</em>
        </b>
        <span>
          {r.tel}
          {r.souhait ? ` · ${r.souhait}` : ""}
          {r.pour_qui ? ` · ${r.pour_qui}` : ""} · {ago(r.created_at)}
        </span>
      </div>
      {r.status === "done" ? (
        <button type="button" className="rq-undo" onClick={() => call({ action: "reopen", id: r.id })}>
          Rouvrir
        </button>
      ) : (
        <>
          <a className="rq-call" href={`tel:${r.tel.replace(/\s/g, "")}`}>📞 Rappeler</a>
          <a className="rq-wa" href={`https://wa.me/${toWaDigits(r.tel)}`} target="_blank" rel="noreferrer" aria-label="WhatsApp">
            💬
          </a>
          <button type="button" className="rq-ok" onClick={() => call({ action: "done", id: r.id })} aria-label="Marquer traité">
            ✓
          </button>
        </>
      )}
    </div>
  );

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .reqs .a-title{font-family:var(--fd),Georgia,serif;font-weight:700;font-size:19px;}
          .pro .reqs .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .reqs .list{margin-top:16px;display:flex;flex-direction:column;gap:8px;}
          .pro .reqs .rq{display:flex;align-items:center;gap:9px;border:1px solid var(--hair);border-radius:12px;padding:11px 12px;background:#fff;}
          .pro .reqs .rq.off{opacity:.55;background:#FAF9F5;}
          .pro .reqs .rq-b{min-width:0;flex:1;}
          .pro .reqs .rq-b b{display:block;font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          .pro .reqs .rq-b .kd{display:inline-block;margin-left:7px;font-style:normal;font-size:9.5px;font-weight:800;letter-spacing:.03em;
            color:#00926E;background:#F0EBFF;border-radius:5px;padding:2px 6px;vertical-align:1px;}
          .pro .reqs .rq-b span{display:block;font-size:11.5px;color:var(--faint);margin-top:2px;line-height:1.35;}
          .pro .reqs .rq-call{flex:none;text-decoration:none;background:#EAF4E4;border:1px solid #CFE6C2;color:#1B7A3E;border-radius:10px;
            padding:8px 11px;font-size:12.5px;font-weight:700;}
          .pro .reqs .rq-wa{flex:none;text-decoration:none;border:1px solid var(--hair);border-radius:10px;padding:8px 10px;font-size:13px;}
          .pro .reqs .rq-ok{flex:none;border:1px solid var(--hair);background:#fff;border-radius:10px;padding:8px 11px;font-size:13px;
            font-weight:800;color:var(--soft);cursor:pointer;font-family:inherit;}
          .pro .reqs .rq-undo{flex:none;border:none;background:none;color:var(--faint);font-size:12px;font-family:inherit;cursor:pointer;text-decoration:underline;}
          .pro .reqs .none{margin-top:16px;font-size:13px;color:var(--faint);line-height:1.45;}
          .pro .reqs .seph{margin-top:20px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);}
          `,
        }}
      />
      <div className="reqs">
        <div className="a-title">📥 Demandes reçues</div>
        <div className="a-sub">
          Les personnes qui ont laissé leurs coordonnées depuis votre site. Rien n&apos;est réservé dans votre agenda —
          elles attendent que vous les rappeliez.
        </div>

        {loaded && items.length === 0 ? (
          <div className="none">Aucune demande pour l&apos;instant. Elles arriveront ici, et vous recevrez un SMS à chaque fois.</div>
        ) : (
          <>
            {news.length > 0 && <div className="list">{news.map(row)}</div>}
            {done.length > 0 && (
              <>
                <div className="seph">Traitées</div>
                <div className="list">{done.map(row)}</div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
