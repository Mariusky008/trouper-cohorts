"use client";

import { useState } from "react";
import { FlashQuestion } from "@/lib/actions/network-flash";
import { NewQuestionDialog } from "./new-question-dialog";
import { QuestionThreadDialog } from "./question-thread-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, MapPin, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

export function CafeFeed({ initialQuestions, city }: { initialQuestions: FlashQuestion[], city: string, currentUser?: unknown }) {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  return (
    <div>
      <div className="flex justify-between items-center mb-6 px-1">
        <h2 className="font-bold text-stone-500 uppercase text-xs tracking-widest">
            Appels locaux ({initialQuestions.length})
        </h2>
        <NewQuestionDialog city={city} />
      </div>

      <div className="space-y-4">
        {initialQuestions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-stone-200 border-dashed">
                <div className="h-16 w-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
                    <MessageSquare className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-[#2E130C] mb-2">Aucun appel pour l&apos;instant</h3>
                <p className="text-stone-500 max-w-xs mx-auto mb-6">
                    Lancez le premier appel à co-création du Café de {city}.
                </p>
                <NewQuestionDialog city={city} />
            </div>
        ) : (
            initialQuestions.map((q) => (
            <Card 
                key={q.id} 
                className="overflow-hidden hover:shadow-md transition-all cursor-pointer border-stone-200 group"
                onClick={() => setSelectedQuestion(q.id)}
            >
                <CardContent className="p-5">
                <div className="flex gap-4 items-start">
                    <Avatar className="h-12 w-12 border-2 border-stone-100 group-hover:border-orange-200 transition-colors">
                        <AvatarImage src={q.author.avatar_url || undefined} />
                        <AvatarFallback className="bg-stone-100 text-stone-500 font-bold group-hover:bg-orange-100 group-hover:text-orange-600">
                            {q.author.display_name?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-[#2E130C] text-base group-hover:text-orange-700 transition-colors">
                                    {q.author.display_name}
                                </h3>
                                <p className="text-xs text-stone-400 font-medium flex items-center gap-1">
                                    {q.author.trade || "Membre"} • {formatDistanceToNow(new Date(q.created_at), { addSuffix: true, locale: fr })}
                                </p>
                            </div>
                            {q.city && (
                                <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {q.city}
                                </span>
                            )}
                        </div>
                        {q.post_type === "co_creation" && (
                            <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-3 space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-wider text-orange-700 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Appel à Duo
                                </p>
                                <p className="text-sm font-black text-[#2E130C]">{q.idea_title || "Idée business locale"}</p>
                                <p className="text-xs text-stone-700">Client cible: {q.target_client || "Non précisé"}</p>
                                <p className="text-xs text-stone-700">Profil recherché: {q.looking_for || "Non précisé"}</p>
                                <p className="text-xs text-stone-700">Objectif 7 jours: {q.expected_outcome || "Non précisé"}</p>
                            </div>
                        )}

                        <p className="text-stone-700 text-sm leading-relaxed font-medium">
                            {q.content}
                        </p>

                        <div className="flex items-center gap-4 pt-2">
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-stone-500 hover:text-orange-600 hover:bg-orange-50 gap-1.5 -ml-2 rounded-lg transition-colors">
                                <MessageSquare className="w-4 h-4" />
                                <span className="font-bold text-xs">{q.answers_count > 0 ? `${q.answers_count} réponses` : q.post_type === "co_creation" ? "Proposer mon profil" : "Répondre"}</span>
                            </Button>
                            {q.post_type === "co_creation" && (
                                <Button asChild variant="outline" size="sm" className="h-8 rounded-lg border-orange-200 text-orange-700 hover:bg-orange-50">
                                    <Link href="/mon-reseau-local/dashboard/offers">Lancer Duo IA</Link>
                                </Button>
                            )}
                            {/* Future: Like button */}
                            {/* <Button variant="ghost" size="sm" className="h-8 px-2 text-stone-400 hover:text-pink-600 hover:bg-pink-50 gap-1.5 rounded-lg transition-colors">
                                <ThumbsUp className="w-4 h-4" />
                                <span className="font-bold text-xs">J&apos;aime</span>
                            </Button> */}
                        </div>
                    </div>
                </div>
                </CardContent>
            </Card>
            ))
        )}
      </div>

      <QuestionThreadDialog 
        questionId={selectedQuestion} 
        open={!!selectedQuestion} 
        onOpenChange={(open) => !open && setSelectedQuestion(null)} 
      />
    </div>
  );
}
