"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ChatThread = {
  phone: string;
  lastAt: string;
  lastDirection: "inbound" | "outbound" | "status";
  lastMessage: string | null;
  inboundCount: number;
  outboundCount: number;
  unresolvedInboundCount: number;
};

type ChatMessage = {
  id: string;
  phone: string;
  direction: "inbound" | "outbound" | "status";
  text: string | null;
  classification: "positive" | "negative" | "stop" | "neutral" | null;
  eventType: string;
  createdAt: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR");
}

export default function AdminHumainChatPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [newIncomingPhones, setNewIncomingPhones] = useState<Record<string, true>>({});
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [error, setError] = useState<string>("");
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    if (typeof window === "undefined") return;
    try {
      const audioContextClass =
        window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!audioContextClass) return;
      const context = new audioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 840;
      gain.gain.value = 0.0001;
      oscillator.connect(gain);
      gain.connect(context.destination);
      const now = context.currentTime;
      gain.gain.exponentialRampToValueAtTime(0.04, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      oscillator.start(now);
      oscillator.stop(now + 0.2);
      setTimeout(() => {
        void context.close().catch(() => null);
      }, 300);
    } catch {
      // Silent fallback if browser blocks autoplay/audio context.
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("admin_humain_chat_sound_enabled");
    if (saved === "0") setSoundEnabled(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("admin_humain_chat_sound_enabled", soundEnabled ? "1" : "0");
  }, [soundEnabled]);

  const loadThreads = useCallback(async () => {
    setLoadingThreads(true);
    try {
      const response = await fetch("/api/admin/humain/whatsapp/chat", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: string; threads?: ChatThread[] };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Impossible de charger les conversations.");
      }
      setThreads((currentThreads) => {
        const previousByPhone = new Map(currentThreads.map((thread) => [thread.phone, thread]));
        const nextThreads = payload.threads || [];
        const incomingUpdates = nextThreads
          .filter((thread) => {
            const previous = previousByPhone.get(thread.phone);
            if (!previous) return false;
            const hasNewInbound = thread.lastDirection === "inbound" && thread.lastAt !== previous.lastAt;
            const unresolvedIncreased = thread.unresolvedInboundCount > previous.unresolvedInboundCount;
            return hasNewInbound || unresolvedIncreased;
          })
          .map((thread) => thread.phone);
        if (incomingUpdates.length > 0) {
          setNewIncomingPhones((current) => {
            const next = { ...current };
            incomingUpdates.forEach((phone) => {
              next[phone] = true;
            });
            return next;
          });
          playNotificationSound();
        }
        return nextThreads;
      });
      setSelectedPhone((current) => current || payload.threads?.[0]?.phone || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger les conversations.");
    } finally {
      setLoadingThreads(false);
    }
  }, [playNotificationSound]);

  const loadMessages = useCallback(async (phone: string) => {
    if (!phone) return;
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/admin/humain/whatsapp/chat?phone=${encodeURIComponent(phone)}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: string; messages?: ChatMessage[] };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Impossible de charger les messages.");
      }
      setMessages(payload.messages || []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger les messages.");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  async function sendMessage() {
    const phone = selectedPhone;
    const message = draft.trim();
    if (!phone || !message || sending) return;
    setSending(true);
    try {
      const response = await fetch("/api/admin/humain/whatsapp/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message }),
      });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Envoi impossible.");
      }
      setDraft("");
      await Promise.all([loadMessages(phone), loadThreads()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    void loadThreads();
    const timer = setInterval(() => {
      void loadThreads();
      if (selectedPhone) {
        void loadMessages(selectedPhone);
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [loadMessages, loadThreads, selectedPhone]);

  useEffect(() => {
    if (!selectedPhone) return;
    void loadMessages(selectedPhone);
  }, [loadMessages, selectedPhone]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, selectedPhone]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.phone === selectedPhone) || null,
    [threads, selectedPhone],
  );
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredThreads = useMemo(
    () =>
      threads.filter((thread) => {
        const matchUnread = !showUnreadOnly || thread.unresolvedInboundCount > 0;
        const matchSearch =
          !normalizedSearch ||
          thread.phone.toLowerCase().includes(normalizedSearch) ||
          String(thread.lastMessage || "")
            .toLowerCase()
            .includes(normalizedSearch);
        return matchUnread && matchSearch;
      }),
    [normalizedSearch, showUnreadOnly, threads],
  );
  const totalNewIncoming = Object.keys(newIncomingPhones).length;

  function handleSelectThread(phone: string) {
    setSelectedPhone(phone);
    setNewIncomingPhones((current) => {
      if (!current[phone]) return current;
      const next = { ...current };
      delete next[phone];
      return next;
    });
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">WhatsApp privé</p>
        <h1 className="text-3xl font-black">Chat Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lecture et réponse aux messages Twilio depuis l&apos;interface admin.
          {totalNewIncoming > 0 ? ` • ${totalNewIncoming} nouveau(x) fil(s)` : ""}
        </p>
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setSoundEnabled((current) => !current)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              soundEnabled
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-border bg-background text-muted-foreground"
            }`}
          >
            Son notifications: {soundEnabled ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {error ? <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px,1fr]">
        <aside className="rounded-xl border bg-card p-3">
          <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-muted-foreground">Conversations</h2>
          <div className="mb-3 space-y-2">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Recherche numéro ou texte..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(event) => setShowUnreadOnly(event.target.checked)}
              />
              Afficher seulement les non lus
            </label>
          </div>
          {loadingThreads ? <p className="text-sm text-muted-foreground">Chargement...</p> : null}
          <div className="space-y-2">
            {filteredThreads.map((thread) => (
              <button
                key={thread.phone}
                type="button"
                onClick={() => handleSelectThread(thread.phone)}
                className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                  selectedPhone === thread.phone ? "border-blue-500 bg-blue-50" : "border-border bg-background hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{thread.phone}</p>
                    {newIncomingPhones[thread.phone] ? (
                      <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-white">Nouveau</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1">
                    {thread.unresolvedInboundCount > 0 ? (
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white">
                        {thread.unresolvedInboundCount}
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {thread.lastMessage || `Dernier événement: ${thread.lastDirection}`}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(thread.lastAt)}</p>
              </button>
            ))}
            {!loadingThreads && filteredThreads.length === 0 ? (
              <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">Aucune conversation pour le moment.</p>
            ) : null}
          </div>
        </aside>

        <div className="rounded-xl border bg-card p-3">
          <div className="mb-3 flex items-center justify-between gap-2 border-b pb-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Fil actif</p>
              <p className="font-semibold">{selectedPhone || "Sélectionne une conversation"}</p>
            </div>
            {selectedThread ? (
              <p className="text-xs text-muted-foreground">
                {selectedThread.inboundCount} entrant(s) • {selectedThread.outboundCount} sortant(s)
              </p>
            ) : null}
          </div>

          <div ref={messagesContainerRef} className="h-[460px] overflow-y-auto rounded-lg border bg-background p-3">
            {loadingMessages ? <p className="text-sm text-muted-foreground">Chargement des messages...</p> : null}
            <div className="space-y-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.direction === "inbound"
                      ? "mr-auto border border-emerald-300/60 bg-emerald-50"
                      : message.direction === "outbound"
                        ? "ml-auto border border-blue-300/60 bg-blue-50"
                        : "mx-auto border border-muted bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <p>{message.text || `[${message.eventType}]`}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatDate(message.createdAt)}
                    {message.classification ? ` • ${message.classification}` : ""}
                  </p>
                </div>
              ))}
              {!loadingMessages && selectedPhone && messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Pas encore de message sur ce fil.</p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.shiftKey) return;
                event.preventDefault();
                void sendMessage();
              }}
              placeholder={selectedPhone ? "Écris ta réponse WhatsApp..." : "Sélectionne une conversation pour répondre"}
              rows={4}
              disabled={!selectedPhone || sending}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-0 focus:border-blue-400"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!selectedPhone || !draft.trim() || sending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
