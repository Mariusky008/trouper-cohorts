"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink, Flame, Trophy } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface VictoryWallProps {
    cohortId?: string;
    currentUserId: string;
}

export function VictoryWall({ cohortId, currentUserId }: VictoryWallProps) {
    const supabase = createClient();
    const [posts, setPosts] = useState<VictoryPost[]>([]);
    const [newLink, setNewLink] = useState("");
    const [loading, setLoading] = useState(true);

    // Charger les posts + Realtime
    useEffect(() => {
        if (!cohortId) return;

        const fetchPosts = async () => {
            // 1. Charger les preuves
            console.log("Fetching posts for cohort:", cohortId);
            const { data: proofs, error } = await supabase
                .from("proofs")
                .select(`
                    *,
                    profiles:user_id (display_name, avatar_url),
                    likes:proof_likes (user_id)
                `)
                .eq("cohort_id", cohortId)
                .order("created_at", { ascending: false })
                .limit(20);

            console.log("Proofs loaded:", proofs?.length, error);

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

        // Realtime Subscription
        const channel = supabase
            .channel('victory_wall')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'proofs', filter: `cohort_id=eq.${cohortId}` }, () => {
                fetchPosts(); // Reload simple pour l'instant
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'proof_likes' }, () => {
                 fetchPosts(); // Reload pour les likes
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [cohortId, currentUserId, supabase]);

    const handlePost = async () => {
        if (!newLink || !cohortId) return;

        // Optimistic UI ? Non, on attend le serveur pour éviter les doublons complexes
        const { error } = await supabase.from("proofs").insert({
            user_id: currentUserId,
            cohort_id: cohortId,
            proof_url: newLink,
            description: "Je partage ma réussite ! 🔥"
        });

        if (error) {
            toast.error(`Erreur: ${error.message}`);
            console.error("Supabase Error:", error);
        } else {
            toast.success("Victoire partagée !");
            setNewLink("");
        }
    };

    const toggleLike = async (post: VictoryPost) => {
        // Optimistic UI
        const isLiked = post.isLiked;
        setPosts(posts.map(p => p.id === post.id ? { ...p, isLiked: !isLiked, likes: isLiked ? p.likes - 1 : p.likes + 1 } : p));

        if (isLiked) {
            // Unlike
            await supabase.from("proof_likes").delete().match({ proof_id: post.id, user_id: currentUserId });
        } else {
            // Like
            await supabase.from("proof_likes").insert({ proof_id: post.id, user_id: currentUserId });
        }
    };

    if (!cohortId) return <div className="h-full flex items-center justify-center text-slate-400">Chargement du mur...</div>;

    return (
        <Card className="h-full border-2 border-slate-100 shadow-sm bg-white flex flex-col">
            <CardHeader className="border-b bg-slate-50/50 pb-4 shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl font-black uppercase italic text-slate-800">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        Mur des Victoires
                    </CardTitle>
                    <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                        Objectif : 24 🔥 / post
                    </span>
                </div>
            </CardHeader>
            
            <div className="p-4 border-b bg-white shrink-0">
                <div className="flex gap-2">
                    <Input 
                        placeholder="Colle le lien de ton post ici..." 
                        value={newLink}
                        onChange={(e) => setNewLink(e.target.value)}
                        className="bg-slate-50"
                    />
                    <Button onClick={handlePost} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                        Poster
                    </Button>
                </div>
                <p className="text-xs text-slate-400 mt-2 ml-1">
                    👇 Likez et commentez les posts des autres pour recevoir la pareille !
                </p>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    {posts.length === 0 && !loading && (
                        <p className="text-center text-muted-foreground italic py-10">Soyez le premier à poster une victoire !</p>
                    )}
                    
                    {posts.map(post => (
                        <div key={post.id} className="flex gap-3 p-3 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all bg-white shadow-sm">
                             <Avatar className="h-10 w-10 border border-slate-200">
                                <AvatarImage src={post.userAvatar || undefined} />
                                <AvatarFallback>{post.userName[0]}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-sm text-slate-800">{post.userName}</h4>
                                    <span className="text-xs text-slate-400">
                                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}
                                    </span>
                                </div>
                                
                                <p className="text-sm text-slate-600">{post.description}</p>
                                
                                <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline mt-1">
                                    <ExternalLink className="h-3 w-3" /> Voir le post
                                </a>
                            </div>

                            <div className="flex flex-col items-center justify-center gap-1 pl-2 border-l border-slate-100">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className={`h-8 w-8 rounded-full ${post.isLiked ? 'text-orange-500 bg-orange-50' : 'text-slate-300 hover:text-orange-400'}`}
                                    onClick={() => toggleLike(post)}
                                >
                                    <Flame className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} />
                                </Button>
                                <span className="text-xs font-bold text-slate-600">{post.likes}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </Card>
    );
}
