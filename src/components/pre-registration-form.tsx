"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerInterest } from "@/app/actions/register";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";

export function PreRegistrationForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const res = await registerInterest(formData);

    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(res.message);
      (event.target as HTMLFormElement).reset();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto w-full">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input 
          name="email" 
          type="email" 
          placeholder="votre@email.com" 
          required 
          className="h-12 text-base bg-background/50 backdrop-blur-sm"
        />
        <Button type="submit" size="lg" className="h-12 px-6" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Rejoindre"}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input 
            name="trade" 
            placeholder="Métier (ex: Coach)" 
            className="bg-background/50 backdrop-blur-sm"
        />
        <Input 
            name="department_code" 
            placeholder="Dép. (ex: 75)" 
            className="bg-background/50 backdrop-blur-sm"
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Rejoignez la liste d'attente. Places limitées.
      </p>
    </form>
  );
}
