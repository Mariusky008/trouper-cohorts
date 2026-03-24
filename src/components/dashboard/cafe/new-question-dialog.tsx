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
import { createFlashQuestion, createFlashCoCreationPost } from "@/lib/actions/network-flash";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

export function NewQuestionDialog({ city }: { city: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"question" | "co_creation">("co_creation");
  const [content, setContent] = useState<string>("");
  const [ideaTitle, setIdeaTitle] = useState("");
  const [targetClient, setTargetClient] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Basic validation
    const messageContent = content ? String(content) : "";
    if (!messageContent) return;
    if (mode === "co_creation" && (!ideaTitle || !targetClient || !lookingFor || !expectedOutcome)) return;
    
    setIsSubmitting(true);
    try {
      const res = mode === "co_creation"
        ? await createFlashCoCreationPost({
            city: String(city || ""),
            ideaTitle,
            content: messageContent,
            targetClient,
            lookingFor,
            expectedOutcome,
          })
        : await createFlashQuestion(messageContent, String(city || ""));
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(mode === "co_creation" ? "Appel à co-création publié !" : "Question publiée !");
        setOpen(false);
        setContent("");
        setIdeaTitle("");
        setTargetClient("");
        setLookingFor("");
        setExpectedOutcome("");
      }
    } catch {
      toast.error("Erreur inconnue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-900/20 h-12 px-6 border border-orange-400">
            <Plus className="mr-2 h-5 w-5" /> Publier une idée duo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Café Co-Création</DialogTitle>
          <DialogDescription>
            Publiez un appel à duo local ou une question classique pour {city}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={mode === "co_creation" ? "default" : "outline"} className="h-9" onClick={() => setMode("co_creation")}>
              Co-Création
            </Button>
            <Button type="button" variant={mode === "question" ? "default" : "outline"} className="h-9" onClick={() => setMode("question")}>
              Question
            </Button>
          </div>
          {mode === "co_creation" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="ideaTitle" className="font-bold">Nom de l&apos;idée</Label>
                <Input id="ideaTitle" placeholder="Ex: Pack visibilité locale artisans" value={ideaTitle} onChange={(e) => setIdeaTitle(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="targetClient" className="font-bold">Client cible local</Label>
                <Input id="targetClient" placeholder="Ex: Commerçants du centre-ville de Dax" value={targetClient} onChange={(e) => setTargetClient(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lookingFor" className="font-bold">Profil complémentaire recherché</Label>
                <Input id="lookingFor" placeholder="Ex: Closer B2B ou Ads Manager local" value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expectedOutcome" className="font-bold">Résultat attendu en 7 jours</Label>
                <Input id="expectedOutcome" placeholder="Ex: 3 rendez-vous qualifiés" value={expectedOutcome} onChange={(e) => setExpectedOutcome(e.target.value)} />
              </div>
            </>
          )}
          <div className="grid gap-2">
            <Label htmlFor="question" className="font-bold">{mode === "co_creation" ? "Description de l'appel à duo" : "Votre question / besoin"}</Label>
            <Textarea
              id="question"
              placeholder={mode === "co_creation" ? "Ex: Je cherche un profil complémentaire pour vendre une offre hybride locale dès cette semaine." : "Ex: Qui connaît un bon imprimeur sur Dax ?"}
              className="h-32 resize-none text-base"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!content || isSubmitting || (mode === "co_creation" && (!ideaTitle || !targetClient || !lookingFor || !expectedOutcome))} className="w-full bg-orange-600 hover:bg-orange-700 font-bold">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "co_creation" ? "Publier l'appel à duo" : "Publier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
