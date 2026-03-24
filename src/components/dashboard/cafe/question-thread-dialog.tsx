"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { getFlashQuestionDetails, createFlashAnswer, FlashQuestion } from "@/lib/actions/network-flash";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";

export function QuestionThreadDialog({ 
  questionId, 
  open, 
  onOpenChange 
}: { 
  questionId: string | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const [data, setData] = useState<FlashQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (open && questionId) {
      setLoading(true);
      getFlashQuestionDetails(questionId)
        .then(setData)
        .catch(() => toast.error("Erreur chargement"))
        .finally(() => setLoading(false));
    } else {
        setData(null);
    }
  }, [open, questionId]);

  const handleReply = async () => {
    const replyContent = reply ? String(reply) : "";
    if (!replyContent || !questionId) return;
    
    setIsSending(true);
    try {
        const res = await createFlashAnswer(questionId, replyContent);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Réponse envoyée !");
            setReply("");
            // Refresh local data to show new answer immediately
            const updated = await getFlashQuestionDetails(questionId);
            setData(updated);
        }
    } catch {
        toast.error("Erreur inconnue");
    } finally {
        setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b border-stone-100 bg-stone-50/50">
          <DialogTitle>{data?.post_type === "co_creation" ? "Appel à Co-Création" : "Discussion"}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-stone-400" /></div>
            ) : data ? (
                <>
                    {/* ORIGINAL QUESTION */}
                    <div className="flex gap-4">
                        <Avatar className="h-12 w-12 border-2 border-orange-100">
                            <AvatarImage src={data.author.avatar_url || undefined} />
                            <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">{data.author.display_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-baseline">
                                <span className="font-bold text-[#2E130C]">{data.author.display_name}</span>
                                <span className="text-xs text-stone-400">{formatDistanceToNow(new Date(data.created_at), { addSuffix: true, locale: fr })}</span>
                            </div>
                            <div className="bg-orange-50/50 p-4 rounded-2xl rounded-tl-none border border-orange-100 text-[#2E130C] text-sm leading-relaxed font-medium">
                                {data.content}
                            </div>
                            {data.post_type === "co_creation" && (
                                <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs text-stone-700 space-y-1">
                                    <p><span className="font-black text-[#2E130C]">Idée:</span> {data.idea_title || "Non précisée"}</p>
                                    <p><span className="font-black text-[#2E130C]">Client cible:</span> {data.target_client || "Non précisé"}</p>
                                    <p><span className="font-black text-[#2E130C]">Profil recherché:</span> {data.looking_for || "Non précisé"}</p>
                                    <p><span className="font-black text-[#2E130C]">Objectif:</span> {data.expected_outcome || "Non précisé"}</p>
                                </div>
                            )}
                            {data.post_type === "co_creation" && (
                                <Button asChild variant="outline" size="sm" className="w-fit border-orange-200 text-orange-700 hover:bg-orange-50">
                                    <Link href="/mon-reseau-local/dashboard/offers">Continuer dans Duo IA</Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* ANSWERS */}
                    <div className="space-y-4 pl-8 border-l-2 border-stone-100 ml-6">
                        {data.answers && data.answers.length > 0 ? (
                            data.answers.map(answer => (
                                <div key={answer.id} className="flex gap-3">
                                    <Avatar className="h-8 w-8 border border-stone-200 mt-1">
                                        <AvatarImage src={answer.author.avatar_url || undefined} />
                                        <AvatarFallback className="bg-stone-100 text-stone-500 text-xs">{answer.author.display_name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-xs text-stone-600">{answer.author.display_name}</span>
                                            <span className="text-[10px] text-stone-400">{formatDistanceToNow(new Date(answer.created_at), { addSuffix: true, locale: fr })}</span>
                                        </div>
                                        <p className="text-sm text-stone-700 bg-white p-3 rounded-xl border border-stone-100 shadow-sm">
                                            {answer.content}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-stone-400 text-sm italic">
                                Aucune réponse pour le moment. Soyez le premier !
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="text-center py-12 text-stone-400">Impossible de charger la discussion.</div>
            )}
        </div>

        {/* FOOTER INPUT */}
        <div className="p-4 bg-white border-t border-stone-100 flex gap-2 items-end">
            <Textarea 
                placeholder={data?.post_type === "co_creation" ? "Présente ton profil et ta proposition de contribution..." : "Écrire une réponse..."} 
                className="min-h-[60px] max-h-[120px] resize-none border-stone-200 focus-visible:ring-orange-500/20"
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleReply();
                    }
                }}
            />
            <Button 
                size="icon" 
                className="h-[60px] w-[60px] bg-orange-600 hover:bg-orange-700 shrink-0 rounded-xl"
                onClick={handleReply}
                disabled={!reply || isSending}
            >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
