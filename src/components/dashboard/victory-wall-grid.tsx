"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink, Flame, Trophy, Send } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface VictoryPost {
    id: string;
    userName: string;
    userAvatar?: string;
    linkUrl: string;
    description: string;
    likes: number;
    isLiked: boolean;
    created_at: string;
}

interface VictoryWallGridProps {
    cohortId?: string;
    currentUserId: string;
}

export function VictoryWallGrid({ cohortId, currentUserId }: VictoryWallGridProps) {
    const supabase = createClient();
    const [posts, setPosts] = useState<VictoryPost[]>([]);
    const [newDescription, setNewDescription] = useState("");
    const [loading, setLoading] = useState(true);

    // Charger les posts + Realtime
    useEffect(() => {
        if (!cohortId) return;

        const fetchPosts = async () => {
            const { data: proofs, error } = await supabase
                .from("proofs")
                .select(`
                    *,
                    profiles:user_id (display_name, avatar_url),
                    likes:proof_likes (user_id)
                `)
                .eq("cohort_id", cohortId)
                .order("created_at", { ascending: false })
                .limit(50); // Plus de posts pour la grille

            if (error) {
                console.error("Error loading wall:", error);
                return;
            }

            const formattedPosts = proofs.map((p: any) => ({
                id: p.id,
                userName: p.profiles?.display_name || "Membre",
                userAvatar: p.profiles?.avatar_url,
                linkUrl: p.proof_url,
                description: p.description || "Nouvelle victoire !",
                likes: p.likes?.length || 0,
                isLiked: p.likes?.some((l: any) => l.user_id === currentUserId),
                created_at: p.created_at
            }));
            
            setPosts(formattedPosts);
            setLoading(false);
        };

        fetchPosts();

        const channel = supabase
            .channel('victory_wall_grid')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'proofs', filter: `cohort_id=eq.${cohortId}` }, () => {
                fetchPosts();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'proof_likes' }, () => {
                 fetchPosts();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [cohortId, currentUserId, supabase]);

    const handlePost = async () => {
        if (!newDescription || !cohortId) return;

        // Pour l'instant on met une URL vide ou un placeholder si l'utilisateur n'a pas mis de lien
        // L'input demande "Quelle victoire...", on assume que c'est du texte principalement
        // Si on veut un lien, on pourrait l'ajouter, mais le design preview n'avait qu'un seul input.
        // On va assumer que c'est une description textuelle.
        
        const { error } = await supabase.from("proofs").insert({
            user_id: currentUserId,
            cohort_id: cohortId,
            proof_url: "", // Champ optionnel ou vide
            description: newDescription
        });

        if (error) {
            toast.error(`Erreur: ${error.message}`);
        } else {
            toast.success("Victoire partagée ! 🚀");
            setNewDescription("");
        }
    };

    const toggleLike = async (post: VictoryPost) => {
        const isLiked = post.isLiked;
        // Optimistic update
        setPosts(posts.map(p => p.id === post.id ? { ...p, isLiked: !isLiked, likes: isLiked ? p.likes - 1 : p.likes + 1 } : p));

        if (isLiked) {
            await supabase.from("proof_likes").delete().match({ proof_id: post.id, user_id: currentUserId });
        } else {
            await supabase.from("proof_likes").insert({ proof_id: post.id, user_id: currentUserId });
        }
    };

    if (!cohortId) return null;

    return (
        <div className="mt-16 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                    Journal de Bord • <span className="text-orange-500">Victoires de l'Équipage</span>
                </h3>
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-900/10 border border-yellow-500/20 rounded-full">
                    <Flame className="h-5 w-5 text-yellow-500 animate-pulse" />
                    <span className="text-yellow-500 font-black text-lg">24 🔥 / post</span>
                </div>
            </div>

            {/* Zone de Saisie Rapide */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 mb-10 shadow-xl">
                <div className="flex gap-4">
                    <Avatar className="h-12 w-12 border-2 border-slate-700">
                        <AvatarFallback className="bg-slate-800 text-white font-bold">MOI</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                        <Input 
                            placeholder="Quelle victoire as-tu décrochée aujourd'hui ?" 
                            className="bg-slate-900 border-slate-700 text-lg font-medium text-white h-14 px-6 rounded-xl focus-visible:ring-orange-500"
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePost()}
                        />
                        <div className="flex justify-end">
                            <Button 
                                size="lg" 
                                className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 rounded-xl shadow-lg shadow-orange-900/20"
                                onClick={handlePost}
                                disabled={!newDescription.trim()}
                            >
                                Poster ma Victoire 🚀
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {posts.map(post => (
                    <div key={post.id} className="flex gap-4 p-5 rounded-xl border border-slate-800 bg-[#111827] shadow-lg hover:border-slate-600 transition-all hover:-translate-y-1">
                        <Avatar className="h-12 w-12 border-2 border-slate-700 shrink-0">
                            <AvatarImage src={post.userAvatar || undefined} />
                            <AvatarFallback className="bg-slate-800 text-slate-400 font-bold">{post.userName[0]}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-base text-white">{post.userName}</h4>
                                <span className="text-xs font-medium text-slate-500">
                                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}
                                </span>
                            </div>
                            
                            <p className="text-sm leading-relaxed text-slate-400">{post.description}</p>
                            
                            {post.linkUrl && (
                                <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                                    <ExternalLink className="h-3 w-3" /> Voir le lien
                                </a>
                            )}

                            <div className="pt-2 flex items-center justify-end">
                                    <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={`h-8 px-2 rounded-full gap-2 ${post.isLiked ? 'text-orange-500 bg-orange-900/10' : 'text-slate-600 hover:bg-slate-800 hover:text-slate-400'}`}
                                    onClick={() => toggleLike(post)}
                                >
                                    <Flame className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                                    <span className="font-black text-xs">{post.likes}</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {posts.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 text-slate-500 italic">
                        Le mur est vide... À toi d'ouvrir le bal !
                    </div>
                )}
            </div>
        </div>
    );
}
