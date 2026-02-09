import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Instagram, Linkedin, Globe, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CohortChat } from "@/components/app/cohort-chat";

export default async function CrewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const membershipRes = await supabase
    .from("cohort_members")
    .select("cohort_id")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!membershipRes.data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <h2 className="text-xl font-bold">Pas d'équipage</h2>
        <p className="text-muted-foreground">Rejoins une cohorte pour voir tes camarades.</p>
      </div>
    );
  }

  const { data: members } = await supabase
    .from("cohort_members")
    .select(`
      department_code,
      profiles (
        id,
        display_name,
        trade,
        bio,
        instagram_handle,
        linkedin_url,
        website_url,
        avatar_url
      )
    `)
    .eq("cohort_id", membershipRes.data.cohort_id);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight">Mon Équipage</h1>
        <p className="text-muted-foreground">
          Les {members?.length || 0} membres de ta cohorte. Connecte-toi avec eux.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Colonne Membres */}
        <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-700">
                <Users className="h-5 w-5"/> Annuaire
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members?.map((member) => {
                const profile = member.profiles as unknown as {
                    id: string;
                    display_name: string;
                    trade: string;
                    bio: string;
                    instagram_handle: string;
                    linkedin_url: string;
                    website_url: string;
                    avatar_url: string;
                };
                const isMe = profile.id === user.id;

                return (
                    <Card key={profile.id} className={isMe ? "border-primary/50 bg-primary/5" : ""}>
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <Avatar className="h-14 w-14 border-2 border-background">
                        <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} className="object-cover" />
                        <AvatarFallback className="font-bold">
                            {profile.display_name?.substring(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold truncate">
                            {profile.display_name || "Membre mystère"}
                            </CardTitle>
                            {isMe && <Badge variant="outline" className="text-[10px]">Moi</Badge>}
                        </div>
                        <CardDescription className="flex items-center gap-2 text-xs truncate">
                            <span>{profile.trade || "Métier non renseigné"}</span>
                            {member.department_code && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-muted rounded text-[10px]">
                                <MapPin className="h-3 w-3" /> {member.department_code}
                            </span>
                            )}
                        </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {profile.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {profile.bio}
                        </p>
                        )}
                        
                        <div className="flex gap-2">
                        {profile.instagram_handle && (
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" asChild>
                            <a href={`https://instagram.com/${profile.instagram_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                                <Instagram className="h-4 w-4" />
                            </a>
                            </Button>
                        )}
                        {profile.linkedin_url && (
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" asChild>
                            <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                                <Linkedin className="h-4 w-4" />
                            </a>
                            </Button>
                        )}
                        {profile.website_url && (
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" asChild>
                            <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                                <Globe className="h-4 w-4" />
                            </a>
                            </Button>
                        )}
                        </div>
                    </CardContent>
                    </Card>
                );
                })}
            </div>
        </div>

        {/* Colonne Chat */}
        <div className="lg:col-span-1">
            <div className="sticky top-20">
                <CohortChat cohortId={membershipRes.data.cohort_id} currentUserId={user.id} />
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800">
                    <p className="font-bold mb-1">💡 Le Conseil du Capitaine</p>
                    <p>Utilisez ce chat pour organiser vos rencontres physiques ! Proposez un café ou un coworking dans votre ville.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
