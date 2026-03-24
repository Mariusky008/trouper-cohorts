"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowRight, MapPin, Plus, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { FlashQuestion } from "@/lib/actions/network-flash";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function CafeWidget({ city, latestQuestion }: { city: string, latestQuestion: FlashQuestion | null }) {
  if (!city) return null;

  return (
    <div className="w-full mt-8 mb-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
            <div className="bg-orange-100 p-1.5 rounded-lg">
                <Sparkles className="w-4 h-4 text-orange-600" />
            </div>
            <h3 className="font-black text-lg text-[#2E130C]">Café Co-Création {city}</h3>
        </div>
        <Link href="/mon-reseau-local/dashboard/cafe">
            <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-bold text-xs">
                Tout voir <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
        </Link>
      </div>

      <Card className="border-2 border-orange-100 bg-orange-50/30 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-0">
            {latestQuestion ? (
                <Link href={`/mon-reseau-local/dashboard/cafe`}>
                    <div className="p-5 flex gap-4 items-start cursor-pointer hover:bg-orange-50/50 transition-colors">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm shrink-0">
                            <AvatarImage src={latestQuestion.author.avatar_url || undefined} />
                            <AvatarFallback className="bg-orange-200 text-orange-700 font-bold">
                                {latestQuestion.author.display_name?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-stone-500">
                                    {latestQuestion.author.display_name}
                                </span>
                                <span className="text-[10px] text-stone-400 font-medium">
                                    {formatDistanceToNow(new Date(latestQuestion.created_at), { addSuffix: true, locale: fr })}
                                </span>
                            </div>
                            <p className="font-bold text-[#2E130C] text-sm line-clamp-2 leading-relaxed mb-2">
                                {latestQuestion.content}
                            </p>
                            {latestQuestion.post_type === "co_creation" && (
                                <span className="inline-flex text-[10px] font-black text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full mb-2">
                                    Appel à duo
                                </span>
                            )}
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" />
                                    {latestQuestion.answers_count} réponses
                                </span>
                                <span className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {latestQuestion.city}
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
            ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                    <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-1">
                        <MessageSquare className="h-6 w-6 text-orange-500" />
                    </div>
                    <p className="text-stone-600 font-medium text-sm max-w-[250px]">
                        Lancez le premier appel à duo local et trouvez votre profil complémentaire.
                    </p>
                    <Link href="/mon-reseau-local/dashboard/cafe">
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl mt-2">
                            <Plus className="w-4 h-4 mr-1" /> Publier un appel
                        </Button>
                    </Link>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
