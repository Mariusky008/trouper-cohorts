"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface CohortMembersListProps {
    members: any[];
}

export function CohortMembersList({ members }: CohortMembersListProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> Liste des Membres ({members.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {members.map((member) => (
                        <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback>{member.first_name?.[0] || "?"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold text-sm">
                                        {member.first_name} {member.last_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {member.email}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <Badge variant="outline">{member.department_code}</Badge>
                                <p className="text-xs text-muted-foreground mt-1 capitalize">{member.trade}</p>
                            </div>
                        </div>
                    ))}
                    {members.length === 0 && (
                        <p className="text-center text-muted-foreground py-8 italic">Aucun membre pour l'instant.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
