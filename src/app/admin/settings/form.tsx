"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addAdminByEmail } from "@/actions/admin-management";

export function AdminAddForm() {
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const email = formData.get("email") as string;
    
    startTransition(async () => {
      const result = await addAdminByEmail(email);
      if (result.error) {
        toast.error("Erreur", { description: result.error });
      } else {
        toast.success("Succès", { description: result.message });
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email du futur administrateur</Label>
        <Input 
          id="email" 
          name="email" 
          type="email" 
          placeholder="collegue@popey.academy" 
          required 
        />
        <p className="text-xs text-muted-foreground">
          Assurez-vous que cette adresse email correspond exactement à celle utilisée lors de son inscription.
        </p>
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Ajout en cours..." : "Promouvoir Admin"}
      </Button>
    </form>
  );
}
