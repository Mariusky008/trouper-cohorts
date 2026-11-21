"use client";

/**
 * 📷 MA TÊTE, LUE PAR LA CAMÉRA (le lot V2 ; `docs/univers/decouvrir.md`, sections 28.3 et 28.7 ; la lecture :
 * `lire-visage.ts`, rien ne part du téléphone) — pour qu'une figurine fasse ma tête.
 *
 * `useMaTete(actif)` ouvre la caméra de devant tant que `actif` est vrai **et que la page est visible** (l'appli passe en
 * arrière-plan : la caméra s'arrête ; elle revient au retour), et rend ma tête du moment : l'expression (tenue un instant
 * avant de changer : elle ne clignote pas — 0,2 s pour changer, 0,5 s au moins), la tête penchée et tournée (lissées) ;
 * plus de visage depuis une seconde : le visage habituel. `quand` est appelé à chaque changement d'expression.
 */
import { useEffect, useRef, useState } from "react";
import type { ExpressionVisage } from "@/lib/direct/visage-essai";
import { ouvrirLecture, type LectureVisage } from "./lire-visage";

export type MaTete = { e: ExpressionVisage | null; depuis: number; roulis: number; lacet: number };
export type EtatCamera = "off" | "charge" | "on" | "refus" | "rate";
export const TETE_NEUTRE: MaTete = { e: null, depuis: 0, roulis: 0, lacet: 0 };

export function useMaTete(actif: boolean, quand?: (e: ExpressionVisage | null, avant: ExpressionVisage | null) => void) {
  const [etat, setEtat] = useState<EtatCamera>("off");
  const [tete, setTete] = useState<MaTete>(TETE_NEUTRE);
  const [visible, setVisible] = useState(true);
  const video = useRef<HTMLVideoElement>(null);
  const quandRef = useRef(quand);
  useEffect(() => {
    quandRef.current = quand;
  });
  useEffect(() => {
    const voir = () => setVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", voir);
    return () => document.removeEventListener("visibilitychange", voir);
  }, []);
  const ouverte = actif && visible;
  useEffect(() => {
    if (!ouverte) {
      void Promise.resolve().then(() => setTete(TETE_NEUTRE));
      return;
    }
    let fini = false;
    let r = 0;
    let fermer = () => undefined as void;
    let flux: MediaStream | null = null;
    let courante: MaTete = TETE_NEUTRE;
    void (async () => {
      await Promise.resolve();
      if (fini) return;
      setEtat("charge");
      try {
        flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 320, height: 240 }, audio: false });
        if (fini) return flux.getTracks().forEach((x) => x.stop());
        const v = video.current;
        if (!v) return;
        v.srcObject = flux;
        await v.play().catch(() => undefined);
        const lecture = await ouvrirLecture().catch(() => null);
        if (fini) return;
        if (!lecture) return setEtat("rate");
        fermer = lecture.fermer;
        setEtat("on");
        let candidat: ExpressionVisage | null = null;
        let candidatDepuis = 0;
        let derniere = 0;
        let vu = performance.now();
        const tour = () => {
          if (fini) return;
          r = window.requestAnimationFrame(tour);
          const maintenant = performance.now();
          if (maintenant - derniere < 70) return;
          derniere = maintenant;
          let l: LectureVisage | null = null;
          try {
            l = lecture.lire(v);
          } catch {
            l = null;
          }
          if (!l) {
            if (maintenant - vu < 1000) return;
            l = { expression: null, roulis: 0, lacet: 0 };
          } else vu = maintenant;
          if (l.expression !== candidat) {
            candidat = l.expression;
            candidatDepuis = maintenant;
          }
          let e = courante.e;
          if (candidat !== courante.e && maintenant - candidatDepuis > 200 && maintenant - courante.depuis > 500) {
            e = candidat;
            quandRef.current?.(e, courante.e);
          }
          const lisse = (a: number, b: number) => a + (b - a) * 0.35;
          const suivante: MaTete = { e, depuis: e !== courante.e ? maintenant : courante.depuis, roulis: lisse(courante.roulis, l.roulis), lacet: lisse(courante.lacet, l.lacet) };
          if (suivante.e !== courante.e || Math.abs(suivante.roulis - courante.roulis) > 0.01 || Math.abs(suivante.lacet - courante.lacet) > 0.01) setTete(suivante);
          courante = suivante;
        };
        tour();
      } catch {
        if (!fini) setEtat("refus");
      }
    })();
    return () => {
      fini = true;
      window.cancelAnimationFrame(r);
      // (la caméra s'arrête au milieu d'une expression : elle finit là)
      if (courante.e) quandRef.current?.(null, courante.e);
      fermer();
      flux?.getTracks().forEach((x) => x.stop());
      setEtat((x) => (x === "refus" || x === "rate" ? x : "off"));
    };
  }, [ouverte]);
  return { etat, tete, video };
}
