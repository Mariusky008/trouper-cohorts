"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createFlashQuestion } from "@/lib/actions/network-flash";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

export function NewQuestionDialog({ city }: { city: string }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Basic validation
    const messageContent = content ? String(content) : "";
    if (!messageContent) return;
    
    setIsSubmitting(true);
    try {
      const res = await createFlashQuestion(messageContent, String(city || ""));
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Question publiée !");
        setOpen(false);
        setContent("");
      }
    } catch (e) {
      toast.error("Erreur inconnue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-900/20 h-12 px-6 border border-orange-400">
            <Plus className="mr-2 h-5 w-5" /> Poser une question
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Poser une question au Café</DialogTitle>
          <DialogDescription>
            Votre message sera visible par tous les membres de {city}. Soyez précis pour avoir de l&apos;aide !
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="question" className="font-bold">Votre question / besoin</Label>
            <Textarea
              id="question"
              placeholder="Ex: Qui connaît un bon imprimeur sur Dax ?"
              className="h-32 resize-none text-base"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!content || isSubmitting} className="w-full bg-orange-600 hover:bg-orange-700 font-bold">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
