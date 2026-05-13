"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ChatThread = {
  phone: string;
  displayName: string | null;
  lastAt: string;
  lastReceivedAt: string | null;
  lastDirection: "inbound" | "outbound" | "status";
  lastMessage: string | null;
  inboundCount: number;
  outboundCount: number;
  unresolvedInboundCount: number;
  isUnreadLatest: boolean;
};

type ChatMessage = {
  id: string;
  phone: string;
  direction: "inbound" | "outbound" | "status";
  text: string | null;
  attachments: Array<{ url: string; contentType: string | null; fileName: string | null }>;
  classification: "positive" | "negative" | "stop" | "neutral" | null;
  eventType: string;
  providerMessageId: string | null;
  createdAt: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR");
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

type DeliveryStatus = "sent" | "delivered" | "read" | "failed";

function normalizeStatus(value: string): DeliveryStatus | null {
  const status = String(value || "").trim().toLowerCase();
  if (status === "sent") return "sent";
  if (status === "delivered") return "delivered";
  if (status === "read") return "read";
  if (status === "failed") return "failed";
  return null;
}

function statusPriority(status: DeliveryStatus): number {
  if (status === "failed") return 40;
  if (status === "read") return 30;
  if (status === "delivered") return 20;
  return 10;
}

function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className || ""}`}
    />
  );
}

export default function AdminHumainChatPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [newIncomingPhones, setNewIncomingPhones] = useState<Record<string, true>>({});
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [error, setError] = useState<string>("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [isDesktop, setIsDesktop] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [seenInboundAtByPhone, setSeenInboundAtByPhone] = useState<Record<string, string>>({});
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const threadsContainerRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("admin_humain_chat_seen_inbound_v1");
    if (!raw) return;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;
    const next: Record<string, string> = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([phone, value]) => {
      const cleanPhone = String(phone || "").trim();
      const cleanValue = String(value || "").trim();
      if (!cleanPhone || !cleanValue) return;
      next[cleanPhone] = cleanValue;
    });
    setSeenInboundAtByPhone(next);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("admin_humain_chat_seen_inbound_v1", JSON.stringify(seenInboundAtByPhone));
  }, [seenInboundAtByPhone]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(Boolean(mediaQuery.matches));
    apply();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", apply);
      return () => mediaQuery.removeEventListener("change", apply);
    }
    mediaQuery.addListener(apply);
    return () => mediaQuery.removeListener(apply);
  }, []);

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
          const container = threadsContainerRef.current;
          if (container) container.scrollTo({ top: 0, behavior: "smooth" });
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
    const hasFiles = selectedFiles.length > 0;
    if (!phone || sending) return;
    if (!message && !hasFiles) return;
    setSending(true);
    setError("");
    try {
      const response = hasFiles
        ? await fetch("/api/admin/humain/whatsapp/chat", {
            method: "POST",
            body: (() => {
              const formData = new FormData();
              formData.set("phone", phone);
              if (message) formData.set("message", message);
              selectedFiles.forEach((file) => {
                formData.append("files", file);
              });
              return formData;
            })(),
          })
        : await fetch("/api/admin/humain/whatsapp/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, message }),
          });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Envoi impossible.");
      }
      setDraft("");
      setSelectedFiles([]);
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
    if (!shouldAutoScrollRef.current) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, selectedPhone]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.phone === selectedPhone) || null,
    [threads, selectedPhone],
  );

  const isThreadUnread = useCallback(
    (thread: ChatThread) => {
      const lastInboundAt = String(thread.lastReceivedAt || "").trim();
      if (!lastInboundAt) return false;
      const seenAt = String(seenInboundAtByPhone[thread.phone] || "").trim();
      if (seenAt && seenAt >= lastInboundAt) return false;
      return thread.isUnreadLatest || Boolean(newIncomingPhones[thread.phone]);
    },
    [newIncomingPhones, seenInboundAtByPhone],
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredThreads = useMemo(
    () =>
      threads
        .filter((thread) => {
        const matchUnread = !showUnreadOnly || isThreadUnread(thread);
        const matchSearch =
          !normalizedSearch ||
          thread.phone.toLowerCase().includes(normalizedSearch) ||
          String(thread.lastMessage || "")
            .toLowerCase()
            .includes(normalizedSearch);
        return matchUnread && matchSearch;
      })
        .slice()
        .sort((a, b) => {
          const unreadA = isThreadUnread(a) ? 1 : 0;
          const unreadB = isThreadUnread(b) ? 1 : 0;
          if (unreadA !== unreadB) return unreadB - unreadA;
          return (b.lastReceivedAt || b.lastAt).localeCompare(a.lastReceivedAt || a.lastAt);
        }),
    [isThreadUnread, normalizedSearch, showUnreadOnly, threads],
  );
  const totalNewIncoming = Object.keys(newIncomingPhones).length;

  const canMarkAllRead = useMemo(() => {
    if (threads.length === 0) return false;
    return threads.some((thread) => isThreadUnread(thread));
  }, [isThreadUnread, threads]);

  function markAllAsRead() {
    setSeenInboundAtByPhone((current) => {
      const next = { ...current };
      threads.forEach((thread) => {
        const lastInboundAt = String(thread.lastReceivedAt || "").trim();
        if (!lastInboundAt) return;
        next[thread.phone] = lastInboundAt;
      });
      return next;
    });
    setNewIncomingPhones({});
  }

  function handleSelectThread(phone: string) {
    setSelectedPhone(phone);
    setMobileView("chat");
    shouldAutoScrollRef.current = true;
    setShowScrollToBottom(false);
    const thread = threads.find((candidate) => candidate.phone === phone);
    if (thread?.lastReceivedAt) {
      setSeenInboundAtByPhone((current) => ({ ...current, [phone]: thread.lastReceivedAt || "" }));
    }
    setNewIncomingPhones((current) => {
      if (!current[phone]) return current;
      const next = { ...current };
      delete next[phone];
      return next;
    });
  }

  const statusByProviderId = useMemo(() => {
    const map = new Map<string, { status: DeliveryStatus; at: string }>();
    messages.forEach((message) => {
      if (message.direction !== "status") return;
      const providerId = String(message.providerMessageId || "").trim();
      if (!providerId) return;
      const normalized = normalizeStatus(message.eventType);
      if (!normalized) return;
      const current = map.get(providerId);
      if (!current) {
        map.set(providerId, { status: normalized, at: message.createdAt });
        return;
      }
      const nextPriority = statusPriority(normalized);
      const currentPriority = statusPriority(current.status);
      if (nextPriority > currentPriority) {
        map.set(providerId, { status: normalized, at: message.createdAt });
        return;
      }
      if (nextPriority === currentPriority && message.createdAt > current.at) {
        map.set(providerId, { status: normalized, at: message.createdAt });
      }
    });
    return map;
  }, [messages]);

  const chatMessages = useMemo(() => messages.filter((message) => message.direction !== "status"), [messages]);

  function renderTicks(status: DeliveryStatus | null | undefined) {
    if (!status) return null;
    if (status === "failed") {
      return <span className="text-[11px] font-black text-red-600">!</span>;
    }
    const base = "text-[12px] font-black";
    if (status === "sent") return <span className={`${base} text-slate-500`}>✓</span>;
    if (status === "delivered") return <span className={`${base} text-slate-500`}>✓✓</span>;
    return <span className={`${base} text-sky-600`}>✓✓</span>;
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            WhatsApp privé{totalNewIncoming > 0 ? ` • ${totalNewIncoming} nouveau(x)` : ""}
          </p>
          <h1 className="text-2xl font-black">Inbox</h1>
        </div>
        <button
          type="button"
          onClick={() => setSoundEnabled((current) => !current)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            soundEnabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border bg-background text-muted-foreground"
          }`}
        >
          Son: {soundEnabled ? "ON" : "OFF"}
        </button>
      </div>

      {error ? <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="flex h-[calc(100dvh-210px)] min-h-[620px] flex-col gap-3 overflow-hidden rounded-2xl border bg-[#f0f2f5] lg:flex-row">
        <aside
          className={`${isDesktop || mobileView === "list" ? "flex" : "hidden"} flex-col bg-white lg:w-[380px] lg:shrink-0`}
        >
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-700">Discussions</h2>
              {loadingThreads ? <Spinner className="text-slate-500" /> : null}
            </div>
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={!canMarkAllRead}
              className="rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Tout lire
            </button>
          </div>
          <div className="space-y-2 border-b px-4 py-3">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher…"
              className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
            />
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={showUnreadOnly} onChange={(event) => setShowUnreadOnly(event.target.checked)} />
              Afficher seulement les non lus
            </label>
          </div>
          <div ref={threadsContainerRef} className="flex-1 overflow-y-auto">
            {filteredThreads.map((thread) => {
              const title = thread.displayName || thread.phone;
              const subtitle = thread.phone;
              const preview = thread.lastMessage || "";
              const timeLabel = formatTime(thread.lastReceivedAt || thread.lastAt);
              const showUnreadDot = isThreadUnread(thread);
              const hasNewPing = Boolean(newIncomingPhones[thread.phone]);
              const highlightUnread = showUnreadDot || hasNewPing;
              return (
                <button
                  key={thread.phone}
                  type="button"
                  onClick={() => handleSelectThread(thread.phone)}
                  className={`w-full border-b px-4 py-3 text-left transition ${
                    selectedPhone === thread.phone
                      ? "bg-emerald-50"
                      : highlightUnread
                        ? "bg-amber-50 hover:bg-amber-100"
                        : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`truncate text-sm text-slate-900 ${highlightUnread ? "font-black" : "font-bold"}`}>{title}</p>
                      <p className="truncate text-xs text-slate-600">{subtitle}</p>
                      <p className={`mt-0.5 line-clamp-1 text-[12px] ${highlightUnread ? "font-semibold text-slate-700" : "text-slate-400"}`}>
                        {preview}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
                      <span className={`text-[11px] font-semibold ${highlightUnread ? "text-slate-700" : "text-slate-400"}`}>{timeLabel}</span>
                      {showUnreadDot ? <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> : null}
                      {!showUnreadDot && hasNewPing ? <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> : null}
                    </div>
                  </div>
                </button>
              );
            })}
            {!loadingThreads && filteredThreads.length === 0 ? (
              <p className="px-4 py-5 text-sm text-slate-500">Aucune conversation pour le moment.</p>
            ) : null}
          </div>
        </aside>

        <div className={`${isDesktop || mobileView === "chat" ? "flex" : "hidden"} min-h-[620px] flex-1 flex-col`}>
          <div className="flex items-center justify-between gap-2 bg-[#075e54] px-4 py-3 text-white">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileView("list")}
                  className={`rounded-full bg-white/10 px-2 py-1 text-xs font-black ${isDesktop ? "hidden" : ""}`}
                >
                  Retour
                </button>
                <div className="min-w-0">
                  <p className="text-xs/4 font-semibold opacity-90">Conversation</p>
                  <p className="truncate text-sm font-black">{selectedThread?.displayName || selectedPhone || "Sélectionne une conversation"}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {loadingMessages ? <Spinner className="text-white/80" /> : null}
              {selectedThread ? (
                <p className="whitespace-nowrap text-xs/4 opacity-90">
                  {selectedThread.inboundCount} entrant(s) • {selectedThread.outboundCount} sortant(s)
                </p>
              ) : null}
            </div>
          </div>

          <div
            ref={messagesContainerRef}
            onScroll={() => {
              const container = messagesContainerRef.current;
              if (!container) return;
              const threshold = 140;
              const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
              shouldAutoScrollRef.current = remaining < threshold;
              setShowScrollToBottom(remaining >= threshold);
            }}
            className="flex-1 overflow-y-auto bg-[#efeae2] px-4 py-4"
          >
            <div className="relative space-y-2">
              {chatMessages.map((message) => {
                const isInbound = message.direction === "inbound";
                const isOutbound = message.direction === "outbound";
                const bubbleClass = isInbound
                  ? "mr-auto bg-white text-slate-900"
                  : isOutbound
                    ? "ml-auto bg-[#dcf8c6] text-slate-900"
                    : "mx-auto bg-white text-slate-700";
                const status = isOutbound && message.providerMessageId ? statusByProviderId.get(message.providerMessageId)?.status : null;
                return (
                  <div key={message.id} className={`w-fit max-w-[86%] rounded-2xl px-3 py-2 shadow-sm ${bubbleClass}`}>
                    {message.attachments.length > 0 ? (
                      <div className="space-y-2">
                        {message.attachments.map((attachment) => {
                          const isImage = String(attachment.contentType || "").startsWith("image/");
                          const label = attachment.fileName || "Pièce jointe";
                          return isImage ? (
                            <a key={attachment.url} href={attachment.url} target="_blank" rel="noreferrer" className="block">
                              <img
                                src={attachment.url}
                                alt={label}
                                loading="lazy"
                                className="max-h-[260px] w-full rounded-xl object-cover"
                              />
                            </a>
                          ) : (
                            <a
                              key={attachment.url}
                              href={attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block rounded-xl border border-slate-200 bg-white/50 px-3 py-2 text-sm font-semibold text-slate-700 underline"
                            >
                              {label}
                            </a>
                          );
                        })}
                      </div>
                    ) : null}
                    {message.text ? <p className="whitespace-pre-wrap text-sm">{message.text}</p> : null}
                    <div className="mt-1 flex items-end justify-end gap-2">
                      {isInbound && message.classification ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {message.classification}
                        </span>
                      ) : null}
                      <span className="text-[10px] text-slate-500">{formatTime(message.createdAt)}</span>
                      {isOutbound ? renderTicks(status) : null}
                    </div>
                  </div>
                );
              })}
              {!loadingMessages && selectedPhone && chatMessages.length === 0 ? (
                <p className="text-sm text-slate-500">Pas encore de message sur ce fil.</p>
              ) : null}
              {showScrollToBottom ? (
                <button
                  type="button"
                  onClick={() => {
                    const container = messagesContainerRef.current;
                    if (!container) return;
                    shouldAutoScrollRef.current = true;
                    container.scrollTop = container.scrollHeight;
                    setShowScrollToBottom(false);
                  }}
                  className="sticky bottom-2 ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-sm font-black text-slate-700 shadow-md"
                >
                  ↓
                </button>
              ) : null}
            </div>
          </div>

          <div className="border-t bg-[#f0f2f5] px-3 py-3">
            {selectedFiles.length > 0 ? (
              <div className="mb-2 flex flex-wrap gap-2">
                {selectedFiles.map((file) => (
                  <button
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    type="button"
                    onClick={() => setSelectedFiles((current) => current.filter((candidate) => candidate !== file))}
                    className="inline-flex max-w-full items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    <span className="truncate">{file.name}</span>
                    <span className="text-slate-400">✕</span>
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  setSelectedFiles(files.slice(0, 5));
                  event.target.value = "";
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedPhone || sending}
                className="h-[44px] w-[44px] shrink-0 rounded-full border bg-white text-sm font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                +
              </button>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" || event.shiftKey) return;
                  event.preventDefault();
                  void sendMessage();
                }}
                placeholder={selectedPhone ? "Écris un message…" : "Sélectionne une conversation pour répondre"}
                rows={2}
                disabled={!selectedPhone || sending}
                className="min-h-[44px] flex-1 resize-none rounded-2xl border bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 disabled:bg-slate-50"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!selectedPhone || (!draft.trim() && selectedFiles.length === 0) || sending}
                className="h-[44px] rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
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
