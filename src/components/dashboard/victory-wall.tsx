"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink, Flame, Trophy } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VictoryPost {
    id: string;
    userName: string;
    userAvatar?: string;
    linkUrl: string;
    description: string;
    likes: number;
    isLiked: boolean;
    timeAgo: string;
}

export function VictoryWall() {
    // Mock Data pour la démo
    const [posts, setPosts] = useState<VictoryPost[]>([
        {
            id: "1",
            userName: "Sarah Connor",
            linkUrl: "https://linkedin.com/post/123",
            description: "Mon premier post sur l'IA, j'ai suivi le script à la lettre !",
            likes: 12,
            isLiked: false,
            timeAgo: "Il y a 2h"
        },
        {
            id: "2",
            userName: "John Wick",
            linkUrl: "https://tiktok.com/@john/video/456",
            description: "Vidéo de présentation (un peu sombre mais efficace).",
            likes: 24,
            isLiked: true,
            timeAgo: "Il y a 4h"
        }
    ]);

    const [newLink, setNewLink] = useState("");

    const handlePost = () => {
        if (!newLink) return;
        
        const newPost: VictoryPost = {
            id: Date.now().toString(),
            userName: "Moi", // À remplacer par le vrai user
            linkUrl: newLink,
            description: "Je viens de publier ça !",
            likes: 0,
            isLiked: false,
            timeAgo: "À l'instant"
        };
        
        setPosts([newPost, ...posts]);
        setNewLink("");
    };

    const toggleLike = (id: string) => {
        setPosts(posts.map(p => {
            if (p.id === id) {
                return {
                    ...p,
                    likes: p.isLiked ? p.likes - 1 : p.likes + 1,
                    isLiked: !p.isLiked
                };
            }
            return p;
        }));
    };

    return (
        <Card className="h-full border-2 border-slate-100 shadow-sm bg-white">
            <CardHeader className="border-b bg-slate-50/50 pb-4">
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
            
            <div className="p-4 border-b bg-white">
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

            <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-4">
                    {posts.map(post => (
                        <div key={post.id} className="flex gap-3 p-3 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all bg-white shadow-sm">
                             <Avatar className="h-10 w-10 border border-slate-200">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userName}`} />
                                <AvatarFallback>{post.userName[0]}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-sm text-slate-800">{post.userName}</h4>
                                    <span className="text-xs text-slate-400">{post.timeAgo}</span>
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
                                    onClick={() => toggleLike(post.id)}
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
