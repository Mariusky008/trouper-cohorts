"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function InviteCard() {
    const [copied, setCopied] = useState(false);

    const shareText = `Salut ! ⚓️\nJe viens de rejoindre la Popey Academy pour structurer mon activité de freelance.\nC'est un programme de 14 jours super intense. On cherche encore des membres pour compléter l'équipage !\n\nRegarde ça : https://www.popey.academy`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareText);
        setCopied(true);
        toast.success("Message copié ! Tu n'as plus qu'à le coller.");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 min-w-[2.5rem] rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 shadow-sm">
                    <Ticket className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-yellow-900 text-sm">Agrandir l'équipage</h3>
                    <p className="text-xs text-yellow-700 leading-tight">Envie de faire le voyage avec un pote ? Invite-le.</p>
                </div>
                <Button size="sm" variant="outline" className="bg-white border-yellow-200 text-yellow-800 hover:bg-yellow-50 shadow-sm" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copied ? "Copié" : "Inviter"}
                </Button>
            </CardContent>
        </Card>
    );
}
