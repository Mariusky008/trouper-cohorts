import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container max-w-md mx-auto py-20 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Contactez-nous</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Une question ? Un problème ? L'équipe Popey est là.
          </p>
          
          <a 
            href="mailto:contact@popey.academy" 
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
          >
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium">Par Email</div>
              <div className="text-sm text-muted-foreground">contact@popey.academy</div>
            </div>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
