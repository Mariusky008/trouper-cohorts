"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const OPPORTUNITY_TARGETS = {
  Dax: [
    { metier: "Courtier", rewardType: "percent", rewardValue: 12, delayDays: 45 },
    { metier: "Agent immo", rewardType: "percent", rewardValue: 10, delayDays: 50 },
    { metier: "Diagnostiqueur", rewardType: "fixed", rewardValue: 180, delayDays: 30 },
  ],
  "Saint-Paul-les-Dax": [
    { metier: "Courtier", rewardType: "percent", rewardValue: 11, delayDays: 40 },
    { metier: "Agent immo", rewardType: "fixed", rewardValue: 350, delayDays: 55 },
    { metier: "Diagnostiqueur", rewardType: "fixed", rewardValue: 160, delayDays: 28 },
  ],
  Narrosse: [
    { metier: "Courtier", rewardType: "percent", rewardValue: 9, delayDays: 48 },
    { metier: "Agent immo", rewardType: "percent", rewardValue: 8, delayDays: 60 },
    { metier: "Diagnostiqueur", rewardType: "fixed", rewardValue: 140, delayDays: 35 },
  ],
} as const;

export default function EclaireurWebappPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenOrCode = (searchParams.get("token") || searchParams.get("code") || "").trim();
  const [activeScreen, setActiveScreen] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [portalError, setPortalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [lastReferralId, setLastReferralId] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [comment, setComment] = useState("");
  const [estimatedDealValue, setEstimatedDealValue] = useState("");
  const [projectTypeCustom, setProjectTypeCustom] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [portalData, setPortalData] = useState<{
    inviteToken: string | null;
    shortCode: string | null;
    sponsorName: string | null;
    sponsorPhone: string | null;
    scoutType: "perso" | "pro";
    availableTargets: Array<{ label: string; type: "metier" | "member" }>;
    referrals: Array<{
      id: string;
      contact_name: string;
      contact_phone: string;
      project_type: string | null;
      status: string;
      estimated_commission: number | null;
      final_commission: number | null;
      created_at: string;
      validated_at: string | null;
      offered_at: string | null;
      converted_at: string | null;
    }>;
  } | null>(null);

  async function loadPortal() {
    if (!tokenOrCode) {
      setPortalData(null);
      return;
    }
    try {
      setIsLoadingPortal(true);
      const response = await fetch(`/api/popey-human/eclaireur-preview/portal?token=${encodeURIComponent(tokenOrCode)}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        inviteToken?: string | null;
        shortCode?: string | null;
        sponsorName?: string | null;
        sponsorPhone?: string | null;
        scoutType?: "perso" | "pro";
        availableTargets?: Array<{ label: string; type: "metier" | "member" }>;
        referrals?: Array<{
          id: string;
          contact_name: string;
          contact_phone: string;
          project_type: string | null;
          status: string;
          estimated_commission: number | null;
          final_commission: number | null;
          created_at: string;
          validated_at: string | null;
          offered_at: string | null;
          converted_at: string | null;
        }>;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Impossible de charger le portail.");
      }
      setPortalData({
        inviteToken: payload.inviteToken || null,
        shortCode: payload.shortCode || null,
        sponsorName: payload.sponsorName || null,
        sponsorPhone: payload.sponsorPhone || null,
        scoutType: payload.scoutType === "pro" ? "pro" : "perso",
        availableTargets: payload.availableTargets || [],
        referrals: payload.referrals || [],
      });
      setPortalError("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de charger le portail.";
      setPortalError(message);
      setPortalData(null);
    } finally {
      setIsLoadingPortal(false);
    }
  }

  useEffect(() => {
    if (!tokenOrCode) {
      router.replace("/popey-human/eclaireur");
    }
  }, [router, tokenOrCode]);

  useEffect(() => {
    void loadPortal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenOrCode]);

  const [city, setCity] = useState<keyof typeof OPPORTUNITY_TARGETS>("Dax");
  const fallbackMetiers = useMemo(() => OPPORTUNITY_TARGETS[city].map((item) => item.metier), [city]);
  const availableMetiers = useMemo(() => {
    const fromMember = (portalData?.availableTargets || []).map((item) => item.label.trim()).filter(Boolean);
    if (fromMember.length > 0) {
      return Array.from(new Set(fromMember));
    }
    return fallbackMetiers;
  }, [fallbackMetiers, portalData?.availableTargets]);
  const [metier, setMetier] = useState<string>(OPPORTUNITY_TARGETS.Dax[0].metier);

  useEffect(() => {
    if (!availableMetiers.includes(metier)) {
      setMetier(availableMetiers[0] || "");
    }
  }, [availableMetiers, metier]);

  const selectedTarget = useMemo(() => {
    return OPPORTUNITY_TARGETS[city].find((item) => item.metier === metier) || OPPORTUNITY_TARGETS[city][0];
  }, [city, metier]);
  const projectType = [metier.trim(), projectTypeCustom.trim()].filter(Boolean).join(" • ");
  const rewardLabel = selectedTarget.rewardType === "percent" ? `${selectedTarget.rewardValue}%` : `fixe ${selectedTarget.rewardValue} EUR`;

  const referrals = portalData?.referrals || [];
  const latestReferral = referrals[0] || null;
  const potential = referrals.reduce((sum, item) => sum + Number(item.estimated_commission || 0), 0);
  const finalized = referrals.filter((item) => item.status === "converted").length;
  const remaining = Math.max(0, 5 - finalized);
  const liveToken = portalData?.inviteToken || (/^[a-f0-9]{16,64}$/i.test(tokenOrCode) ? tokenOrCode.toLowerCase() : "");
  const detailsHref = liveToken ? `/popey-human/eclaireur/${encodeURIComponent(liveToken)}?tab=history` : null;
  const whatsappHref = useMemo(() => {
    const phone = (portalData?.sponsorPhone || "").replace(/\D/g, "");
    if (!phone) return null;
    const text = latestReferral
      ? `Salut, je te relance sur l opportunite ${latestReferral.contact_name}.`
      : "Salut, je souhaite te contacter depuis mon portail eclaireur.";
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }, [latestReferral, portalData?.sponsorPhone]);

  async function submitOpportunity() {
    if (!tokenOrCode) {
      setSubmitMessage("Ajoute ?token=... ou ?code=... dans l URL pour activer l envoi reel.");
      return;
    }
    if (!contactName.trim() || !contactPhone.trim()) {
      setSubmitMessage("Nom et telephone sont obligatoires.");
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/popey-human/eclaireur-preview/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenOrCode,
          contactName,
          contactPhone,
          projectType,
          estimatedDealValue,
          comment,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; referralId?: string | null };
      if (!response.ok) {
        throw new Error(payload.error || "Envoi impossible.");
      }
      setSubmitMessage("Alerte envoyee avec succes.");
      setLastReferralId(payload.referralId || null);
      setContactName("");
      setContactPhone("");
      setComment("");
      setEstimatedDealValue("");
      setProjectTypeCustom("");
      setActiveScreen(2);
      await loadPortal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Envoi impossible.";
      setSubmitMessage(message);
      setLastReferralId(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  const screens = useMemo(
    () => [
      {
        label: "Ecran 1 - Onboarding Express",
        content: (
          <ScreenMagicLink
            tokenOrCode={tokenOrCode}
            isLoadingPortal={isLoadingPortal}
            portalError={portalError}
            sponsorName={portalData?.sponsorName || null}
            scoutType={portalData?.scoutType || "perso"}
            dossiersEnCours={referrals.length}
            commissionPrevisionnelle={potential}
            onGoSubmit={() => setActiveScreen(1)}
          />
        ),
      },
      {
        label: "Ecran 2 - Depot Opportunity",
        content: (
          <ScreenSubmitOpportunity
            tokenOrCode={tokenOrCode}
            city={city}
            setCity={setCity}
            metier={metier}
            setMetier={setMetier}
            cities={Object.keys(OPPORTUNITY_TARGETS) as Array<keyof typeof OPPORTUNITY_TARGETS>}
            metiers={availableMetiers}
            rewardLabel={rewardLabel}
            delayDays={selectedTarget.delayDays}
            contactName={contactName}
            setContactName={setContactName}
            contactPhone={contactPhone}
            setContactPhone={setContactPhone}
            projectTypeCustom={projectTypeCustom}
            setProjectTypeCustom={setProjectTypeCustom}
            estimatedDealValue={estimatedDealValue}
            setEstimatedDealValue={setEstimatedDealValue}
            comment={comment}
            setComment={setComment}
            submitMessage={submitMessage}
            lastReferralId={lastReferralId}
            isSubmitting={isSubmitting}
            onSubmit={submitOpportunity}
          />
        ),
      },
      {
        label: "Ecran 3 - Suivi & Commission",
        content: (
          <ScreenTrackingCommission
            latestReferral={latestReferral}
            finalized={finalized}
            remaining={remaining}
            onOpenDetails={() => setShowDetailsModal(true)}
            whatsappHref={whatsappHref}
          />
        ),
      },
    ],
    [
      city,
      comment,
      contactName,
      contactPhone,
      estimatedDealValue,
      finalized,
      isLoadingPortal,
      isSubmitting,
      latestReferral,
      availableMetiers,
      metier,
      portalData?.sponsorName,
      portalError,
      potential,
      projectTypeCustom,
      referrals.length,
      remaining,
      rewardLabel,
      selectedTarget.delayDays,
      submitMessage,
      lastReferralId,
      tokenOrCode,
    ],
  );

  function goTo(index: number) {
    if (index < 0 || index >= screens.length) return;
    setActiveScreen(index);
  }

  function onSwipeEnd() {
    if (touchStartX === null || touchEndX === null) return;
    const delta = touchStartX - touchEndX;
    if (delta > 45) goTo(activeScreen + 1);
    if (delta < -45) goTo(activeScreen - 1);
    setTouchStartX(null);
    setTouchEndX(null);
  }

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-xl">
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 p-2">
            <button
              type="button"
              onClick={() => goTo(activeScreen - 1)}
              disabled={activeScreen === 0}
              className="h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-xs font-black uppercase tracking-wide disabled:opacity-35"
            >
              Precedent
            </button>
            <div className="flex items-center gap-2">
              {screens.map((screen, index) => (
                <button
                  key={screen.label}
                  type="button"
                  onClick={() => goTo(index)}
                  className={`h-2.5 w-2.5 rounded-full transition ${activeScreen === index ? "bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.9)]" : "bg-white/35"}`}
                  aria-label={`Aller a ${screen.label}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => goTo(activeScreen + 1)}
              disabled={activeScreen === screens.length - 1}
              className="h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-xs font-black uppercase tracking-wide disabled:opacity-35"
            >
              Suivant
            </button>
          </div>

          <p className="mb-3 text-center text-xs font-black uppercase tracking-[0.12em] text-cyan-100/85">
            {screens[activeScreen]?.label} - Swipe gauche/droite
          </p>

          <div
            className="overflow-hidden"
            onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
            onTouchMove={(event) => setTouchEndX(event.touches[0]?.clientX ?? null)}
            onTouchEnd={onSwipeEnd}
          >
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${activeScreen * 100}%)` }}
            >
              {screens.map((screen) => (
                <div key={screen.label} className="w-full shrink-0">
                  <PhoneFrame label={screen.label}>{screen.content}</PhoneFrame>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-3 backdrop-blur-sm">
          <section className="w-full max-w-lg rounded-2xl border border-white/20 bg-[#0B1224] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-100">Detail de l opportunite</p>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-sm">
              <p><span className="text-white/65">Contact:</span> {latestReferral?.contact_name || "Aucune opportunite envoyee"}</p>
              <p><span className="text-white/65">Projet:</span> {latestReferral?.project_type || "-"}</p>
              <p>
                <span className="text-white/65">Statut:</span>{" "}
                {latestReferral?.status === "converted"
                  ? "Signe"
                  : latestReferral?.status === "offered"
                    ? "Offre"
                    : latestReferral?.status === "validated"
                      ? "RDV"
                      : latestReferral?.status === "submitted"
                        ? "Recu"
                        : "En attente"}
              </p>
              <p>
                <span className="text-white/65">Commission:</span>{" "}
                {latestReferral?.final_commission
                  ? `${Number(latestReferral.final_commission).toLocaleString("fr-FR")} EUR`
                  : latestReferral?.estimated_commission
                    ? `${Number(latestReferral.estimated_commission).toLocaleString("fr-FR")} EUR previsionnel`
                    : "En attente"}
              </p>
              {detailsHref ? (
                <a
                  href={detailsHref}
                  className="mt-3 inline-flex h-9 items-center rounded-lg border border-cyan-300/35 bg-cyan-300/15 px-3 text-[11px] font-black uppercase tracking-[0.08em] text-cyan-100"
                >
                  Ouvrir historique complet
                </a>
              ) : null}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function ScreenMagicLink({
  tokenOrCode,
  isLoadingPortal,
  portalError,
  sponsorName,
  scoutType,
  dossiersEnCours,
  commissionPrevisionnelle,
  onGoSubmit,
}: {
  tokenOrCode: string;
  isLoadingPortal: boolean;
  portalError: string;
  sponsorName: string | null;
  scoutType: "perso" | "pro";
  dossiersEnCours: number;
  commissionPrevisionnelle: number;
  onGoSubmit: () => void;
}) {
  const commissionLabel = commissionPrevisionnelle.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  return (
    <div className="relative h-full overflow-hidden rounded-[24px] border border-cyan-300/35 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(46,132,255,0.35)_0%,rgba(20,33,73,0.9)_45%,rgba(12,17,32,1)_100%)] p-4">
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-cyan-300/35 blur-3xl" />
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100/90">
        Bienvenue Eclaireur {scoutType === "pro" ? "Pro" : "Perso"}
      </p>
      <h2 className="mt-2 text-2xl font-black leading-tight">Salut Sarah, ton reseau vaut de l or</h2>
      <p className="mt-2 text-sm text-white/80">Tu nous envoies une opportunite, on traite le dossier, tu suis tout en direct.</p>

      <div className="mt-4 rounded-2xl border border-white/20 bg-black/25 p-3">
        <p className="text-[10px] uppercase tracking-[0.12em] text-white/70">Comment ca marche</p>
        <ul className="mt-2 space-y-1.5 text-xs text-white/80">
          <li>1. Tu detectes un besoin dans ton entourage.</li>
          <li>2. Tu soumets l opportunite en moins de 30 secondes.</li>
          <li>3. Tu suis le statut et ta commission en temps reel.</li>
        </ul>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <StatCard title="Dossiers en cours" value={String(dossiersEnCours)} tone="cyan" />
        <StatCard title="Commission previsionnelle" value={commissionLabel} tone="emerald" />
      </div>

      {tokenOrCode ? (
        <p className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-100">
          {isLoadingPortal ? "Chargement du portail reel..." : `Lien actif: ${tokenOrCode}`}
          {!isLoadingPortal && sponsorName ? ` • Parrain: ${sponsorName}` : ""}
        </p>
      ) : (
        <p className="mt-3 rounded-xl border border-amber-300/35 bg-amber-300/10 px-3 py-2 text-[11px] text-amber-100">
          Mode demo. Ouvre cette page avec `?token=...` ou `?code=...` pour activer le backend.
        </p>
      )}
      {portalError ? <p className="mt-2 rounded-xl border border-red-300/35 bg-red-500/10 px-3 py-2 text-[11px] text-red-100">{portalError}</p> : null}

      <button
        type="button"
        onClick={onGoSubmit}
        className="mt-5 h-12 w-full rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-emerald-300 text-sm font-black uppercase tracking-wide text-black shadow-[0_18px_30px_-20px_rgba(34,211,238,0.9)]"
      >
        Soumettre une opportunite
      </button>
    </div>
  );
}

function ScreenSubmitOpportunity({
  tokenOrCode,
  city,
  setCity,
  metier,
  setMetier,
  cities,
  metiers,
  rewardLabel,
  delayDays,
  contactName,
  setContactName,
  contactPhone,
  setContactPhone,
  projectTypeCustom,
  setProjectTypeCustom,
  estimatedDealValue,
  setEstimatedDealValue,
  comment,
  setComment,
  submitMessage,
  lastReferralId,
  isSubmitting,
  onSubmit,
}: {
  tokenOrCode: string;
  city: keyof typeof OPPORTUNITY_TARGETS;
  setCity: (value: keyof typeof OPPORTUNITY_TARGETS) => void;
  metier: string;
  setMetier: (value: string) => void;
  cities: Array<keyof typeof OPPORTUNITY_TARGETS>;
  metiers: string[];
  rewardLabel: string;
  delayDays: number;
  contactName: string;
  setContactName: (value: string) => void;
  contactPhone: string;
  setContactPhone: (value: string) => void;
  projectTypeCustom: string;
  setProjectTypeCustom: (value: string) => void;
  estimatedDealValue: string;
  setEstimatedDealValue: (value: string) => void;
  comment: string;
  setComment: (value: string) => void;
  submitMessage: string;
  lastReferralId: string | null;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="h-full rounded-[24px] border border-emerald-300/30 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(24,120,78,0.45)_0%,rgba(16,35,34,0.9)_48%,rgba(9,15,18,1)_100%)] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200/90">Nouvelle opportunite</p>
      <h2 className="mt-2 text-2xl font-black leading-tight">Formulaire 30 secondes</h2>

      <form
        className="mt-4 space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/70">Pour qui ? - Metier</p>
          <select
            value={metier}
            onChange={(event) => setMetier(event.target.value)}
            className="h-11 w-full rounded-xl border border-white/20 bg-black/25 px-3 text-sm text-white/90"
          >
            {metiers.map((item) => (
              <option key={item} value={item} className="bg-[#0C1224]">
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/70">Ville cible</p>
          <select
            value={city}
            onChange={(event) => setCity(event.target.value as keyof typeof OPPORTUNITY_TARGETS)}
            className="h-11 w-full rounded-xl border border-white/20 bg-black/25 px-3 text-sm text-white/90"
          >
            {cities.map((item) => (
              <option key={item} value={item} className="bg-[#0C1224]">
                {item}
              </option>
            ))}
          </select>
        </div>
        <InputMock label="Nom du contact">
          <input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Nicolas Martin" className="h-11 w-full rounded-xl border border-white/20 bg-black/25 px-3 text-sm text-white/90" />
        </InputMock>
        <InputMock label="Telephone">
          <input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="06 24 78 14 32" className="h-11 w-full rounded-xl border border-white/20 bg-black/25 px-3 text-sm text-white/90" />
        </InputMock>
        <InputMock label="Projet detecte">
          <input value={projectTypeCustom} onChange={(event) => setProjectTypeCustom(event.target.value)} placeholder={metier} className="h-11 w-full rounded-xl border border-white/20 bg-black/25 px-3 text-sm text-white/90" />
        </InputMock>
        <InputMock label="Valeur estimee (optionnel)">
          <input value={estimatedDealValue} onChange={(event) => setEstimatedDealValue(event.target.value)} type="number" min="1" placeholder="250000" className="h-11 w-full rounded-xl border border-white/20 bg-black/25 px-3 text-sm text-white/90" />
        </InputMock>
        <InputMock label="Commentaire libre">
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Contexte, urgence..." className="min-h-20 w-full rounded-xl border border-white/20 bg-black/25 px-3 py-2 text-sm text-white/90" />
        </InputMock>
      </form>

      <div className="mt-4 rounded-2xl border border-[#EAC886]/40 bg-[#EAC886]/12 p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#F8E7BF]">Motivation instantanee</p>
        <p className="mt-1 text-sm font-bold text-[#F8E7BF]">
          Commission affichee: {rewardLabel} | Delai moyen: {delayDays} jours
        </p>
      </div>

      <button
        type="submit"
        onClick={onSubmit}
        disabled={isSubmitting || !tokenOrCode}
        className="mt-4 h-12 w-full rounded-2xl bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 text-sm font-black uppercase tracking-wide text-black disabled:opacity-50"
      >
        {isSubmitting ? "Envoi..." : "Envoyer l opportunite"}
      </button>
      {submitMessage ? <p className="mt-2 rounded-xl border border-white/20 bg-black/25 px-3 py-2 text-xs text-white/80">{submitMessage}</p> : null}
      {lastReferralId ? (
        <p className="mt-2 rounded-xl border border-emerald-300/35 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
          Enregistre ✅ ID opportunite: {lastReferralId}
        </p>
      ) : null}
      <p className="mt-2 text-center text-xs text-white/65">Un bon d apport numerique est cree automatiquement.</p>
    </div>
  );
}

function ScreenTrackingCommission({
  latestReferral,
  finalized,
  remaining,
  onOpenDetails,
  whatsappHref,
}: {
  latestReferral: {
    id: string;
    contact_name: string;
    project_type: string | null;
    status: string;
    estimated_commission: number | null;
    final_commission: number | null;
    created_at: string;
    validated_at: string | null;
    offered_at: string | null;
    converted_at: string | null;
  } | null;
  finalized: number;
  remaining: number;
  onOpenDetails: () => void;
  whatsappHref: string | null;
}) {
  const statusStep = latestReferral?.status === "converted" ? 3 : latestReferral?.status === "offered" ? 2 : latestReferral?.status === "validated" ? 1 : 0;
  const timeline = [
    { label: "Opportunite recu", at: latestReferral?.created_at || null, idx: 0 },
    { label: "RDV pris", at: latestReferral?.validated_at || null, idx: 1 },
    { label: "Offre envoyee", at: latestReferral?.offered_at || null, idx: 2 },
    { label: "Signature finale", at: latestReferral?.converted_at || null, idx: 3 },
  ];
  return (
    <div className="h-full rounded-[24px] border border-fuchsia-300/30 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(131,51,173,0.45)_0%,rgba(36,21,55,0.9)_48%,rgba(14,12,24,1)_100%)] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-fuchsia-200/90">Suivi dossier</p>
      <h2 className="mt-2 text-2xl font-black leading-tight">Transparence totale</h2>

      <div className="mt-3 rounded-2xl border border-fuchsia-300/40 bg-fuchsia-300/12 p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-fuchsia-100">🚀 MON RESEAU ECLAIREURS = 0</p>
        <p className="mt-1 text-xs text-fuchsia-100/90">
          🎯 A partir de 5 opportunites finalisees, tu debloques ton reseau d eclaireurs et tu touches 3% de commissions.
        </p>
        <p className="mt-1 text-[11px] font-semibold text-fuchsia-100/90">
          {remaining > 0
            ? `🔥 Encore ${remaining} opportunite(s) finalisee(s) pour y pretendre.`
            : "✅ Objectif atteint, badge reseau debloque."}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-white/15 bg-black/25 p-3">
        <p className="text-sm font-black">Dossier: {latestReferral?.contact_name || "Aucune opportunite envoyee"}</p>
        <p className="text-xs text-white/70">
          {latestReferral?.created_at ? `Envoye le ${new Date(latestReferral.created_at).toLocaleDateString("fr-FR")}` : "En attente d une premiere alerte"}
          {latestReferral?.project_type ? ` - ${latestReferral.project_type}` : ""}
        </p>
        <p className="mt-2 text-sm text-fuchsia-100">
          Commission convenue:{" "}
          {latestReferral?.final_commission
            ? `${Number(latestReferral.final_commission).toLocaleString("fr-FR")} EUR`
            : latestReferral?.estimated_commission
              ? `${Number(latestReferral.estimated_commission).toLocaleString("fr-FR")} EUR previsionnel`
              : "En attente"}
        </p>
      </div>

      <ul className="mt-4 space-y-2 text-sm">
        {timeline.map((item) => (
          <TimelineItem
            key={item.label}
            label={item.label}
            date={item.at ? new Date(item.at).toLocaleDateString("fr-FR") : "En attente"}
            done={item.idx <= statusStep}
          />
        ))}
      </ul>

      <div className="mt-3 rounded-2xl border border-cyan-300/35 bg-cyan-500/12 p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100">Synchronisation membre metier</p>
        <p className="mt-1 text-xs text-cyan-100/90">
          Ces statuts sont traites et mis a jour dans la web app membre metier, puis synchronises automatiquement ici cote Eclaireur.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onOpenDetails}
          className="h-10 rounded-xl border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wide"
        >
          Voir details
        </button>
        {whatsappHref ? (
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="h-10 rounded-xl bg-fuchsia-300 text-xs font-black uppercase tracking-wide text-black inline-flex items-center justify-center">
            Message WhatsApp
          </a>
        ) : (
          <span className="h-10 rounded-xl bg-fuchsia-300/50 text-xs font-black uppercase tracking-wide text-black inline-flex items-center justify-center opacity-70">
            Message WhatsApp
          </span>
        )}
      </div>
      <p className="mt-2 text-[11px] text-white/60">Opportunites finalisees: {finalized}</p>
    </div>
  );
}

function PhoneFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <article className="rounded-[32px] border border-white/15 bg-[#0A1020] p-3 shadow-[0_26px_55px_-35px_rgba(0,0,0,0.9)]">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/65">{label}</p>
        <span className="rounded-full border border-white/20 bg-white/5 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white/60">
          iPhone
        </span>
      </div>
      <div className="rounded-[28px] border border-white/10 bg-black/20 p-2">{children}</div>
    </article>
  );
}

function StatCard({ title, value, tone }: { title: string; value: string; tone: "cyan" | "emerald" }) {
  const classes =
    tone === "cyan"
      ? "border-cyan-300/35 bg-cyan-500/15 text-cyan-100"
      : "border-emerald-300/35 bg-emerald-500/15 text-emerald-100";
  return (
    <div className={`rounded-xl border p-2 ${classes}`}>
      <p className="text-[10px] uppercase tracking-[0.1em] opacity-85">{title}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function InputMock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/70">{label}</p>
      {children}
    </div>
  );
}

function TimelineItem({ label, date, done = false }: { label: string; date: string; done?: boolean }) {
  return (
    <li className="flex items-center justify-between rounded-xl border border-white/15 bg-black/20 px-3 py-2">
      <span className="inline-flex items-center gap-2">
        <span className={`inline-flex h-2.5 w-2.5 rounded-full ${done ? "bg-emerald-300" : "bg-white/35"}`} />
        <span className="font-semibold">{label}</span>
      </span>
      <span className="text-xs text-white/70">{date}</span>
    </li>
  );
}
