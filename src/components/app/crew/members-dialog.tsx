"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Users, Instagram, Linkedin, Globe, MessageSquare, ChevronLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Member {
    id: string;
    display_name: string;
    trade: string;
    bio: string;
    instagram_handle: string;
    linkedin_url: string;
    website_url: string;
    avatar_url: string;
    department_code?: string;
}

interface MembersDialogProps {
    members: Member[];
    currentUserId: string;
}

export function MembersDialog({ members, currentUserId }: MembersDialogProps) {
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleSendMessage = (member: Member) => {
        // Feature "Bientôt"
        toast.info(`La messagerie privée avec ${member.display_name} arrive bientôt ! 🚀`);
    };

    const resetSelection = () => {
        setSelectedMember(null);
    };

    // Close dialog handler
    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) setTimeout(() => setSelectedMember(null), 300); // Reset after close animation
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-500/30 bg-blue-900/10 text-blue-400 hover:bg-blue-900/30 hover:text-blue-300 uppercase font-bold text-xs">
                    <Users className="h-4 w-4 mr-2" />
                    Membres <span className="ml-1 opacity-70">({members.length})</span>
                </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-md bg-[#0f1623] border-slate-800 text-slate-200 p-0 overflow-hidden flex flex-col h-[600px] max-h-[80vh]">
                <DialogHeader className="p-6 pb-4 border-b border-slate-800 bg-[#0f1623] shrink-0">
                    <div className="flex items-center gap-2">
                        {selectedMember && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={resetSelection} 
                                className="h-8 w-8 -ml-2 mr-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                        )}
                        <div>
                            <DialogTitle className="text-xl font-black uppercase italic tracking-tight text-white flex items-center gap-2">
                                {selectedMember ? selectedMember.display_name : (
                                    <>
                                        <Users className="h-5 w-5 text-blue-500"/> 
                                        L'Équipage
                                    </>
                                )}
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 text-xs">
                                {selectedMember ? (
                                    <span className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className="font-bold bg-slate-800 text-slate-300 border-slate-700 h-5 px-2">{selectedMember.trade || "Métier inconnu"}</Badge>
                                        {selectedMember.department_code && <Badge variant="outline" className="border-slate-700 text-slate-500 h-5 px-2">{selectedMember.department_code}</Badge>}
                                    </span>
                                ) : (
                                    `Liste des ${members.length} membres de votre cohorte.`
                                )}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden relative">
                    {selectedMember ? (
                        // VUE DÉTAIL MEMBRE
                        <ScrollArea className="h-full">
                            <div className="p-6 space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="flex justify-center mb-6">
                                    <Avatar className="h-32 w-32 border-4 border-[#0f1623] shadow-2xl ring-2 ring-slate-800">
                                        <AvatarImage src={selectedMember.avatar_url || undefined} className="object-cover" />
                                        <AvatarFallback className="text-3xl bg-slate-800 text-slate-400 font-black">
                                            {selectedMember.display_name?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                {selectedMember.bio && (
                                    <div className="bg-slate-900/50 p-5 rounded-xl text-sm text-slate-300 italic border border-slate-800 leading-relaxed relative">
                                        <span className="absolute top-2 left-2 text-4xl text-slate-800 font-serif leading-none">"</span>
                                        <p className="relative z-10 px-2">{selectedMember.bio}</p>
                                        <span className="absolute bottom-[-10px] right-4 text-4xl text-slate-800 font-serif leading-none rotate-180">"</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-3 gap-3">
                                    {selectedMember.instagram_handle && (
                                        <Button variant="outline" className="w-full flex flex-col h-auto py-3 gap-1 bg-[#111827] border-slate-800 text-slate-400 hover:bg-pink-900/20 hover:text-pink-400 hover:border-pink-500/30 transition-all group" asChild>
                                            <a href={`https://instagram.com/${selectedMember.instagram_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                                                <Instagram className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px]">Instagram</span>
                                            </a>
                                        </Button>
                                    )}
                                    {selectedMember.linkedin_url && (
                                        <Button variant="outline" className="w-full flex flex-col h-auto py-3 gap-1 bg-[#111827] border-slate-800 text-slate-400 hover:bg-blue-900/20 hover:text-blue-400 hover:border-blue-500/30 transition-all group" asChild>
                                            <a href={selectedMember.linkedin_url} target="_blank" rel="noopener noreferrer">
                                                <Linkedin className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px]">LinkedIn</span>
                                            </a>
                                        </Button>
                                    )}
                                    {selectedMember.website_url && (
                                        <Button variant="outline" className="w-full flex flex-col h-auto py-3 gap-1 bg-[#111827] border-slate-800 text-slate-400 hover:bg-emerald-900/20 hover:text-emerald-400 hover:border-emerald-500/30 transition-all group" asChild>
                                            <a href={selectedMember.website_url} target="_blank" rel="noopener noreferrer">
                                                <Globe className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px]">Site Web</span>
                                            </a>
                                        </Button>
                                    )}
                                </div>
                                
                                <Button 
                                    className="w-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all border border-slate-700" 
                                    size="lg" 
                                    onClick={() => handleSendMessage(selectedMember)}
                                >
                                    <MessageSquare className="mr-2 h-4 w-4" /> Envoyer un message
                                </Button>
                            </div>
                        </ScrollArea>
                    ) : (
                        // VUE LISTE MEMBRES
                        <ScrollArea className="h-full">
                            <div className="p-4 space-y-2 animate-in fade-in duration-300">
                                {members.map((member) => {
                                    const isMe = member.id === currentUserId;
                                    return (
                                        <div 
                                            key={member.id}
                                            onClick={() => setSelectedMember(member)}
                                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border border-transparent group ${isMe ? "bg-blue-900/10 border-blue-500/20 hover:bg-blue-900/20" : "hover:bg-slate-800/50 hover:border-slate-700 hover:translate-x-1"}`}
                                        >
                                            <Avatar className={`h-10 w-10 border transition-colors ${isMe ? "border-blue-500/30" : "border-slate-700 group-hover:border-slate-500"}`}>
                                                <AvatarImage src={member.avatar_url || undefined} className="object-cover" />
                                                <AvatarFallback className="text-xs bg-slate-800 text-slate-400 font-bold">
                                                    {member.display_name?.substring(0, 2).toUpperCase() || "??"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="font-bold text-sm truncate text-slate-200 flex items-center gap-2 group-hover:text-white transition-colors">
                                                    {member.display_name || "Membre"}
                                                    {isMe && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-bold border border-blue-500/30">Moi</span>}
                                                </div>
                                                <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                                                    <span>{member.trade || "Non renseigné"}</span>
                                                    {member.department_code && (
                                                        <span className="text-slate-600">• {member.department_code}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronLeft className="h-4 w-4 text-slate-600 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}