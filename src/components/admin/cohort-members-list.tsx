"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { RemoveMemberButton } from "@/components/admin/remove-member-button";

interface CohortMembersListProps {
    members: any[];
    cohortId: string;
}

export function CohortMembersList({ members, cohortId }: CohortMembersListProps) {
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
                            <div className="flex items-center gap-3">
                                <div className="text-right flex flex-col items-end gap-1">
                                    <Badge variant="outline">{member.department_code}</Badge>
                                    <p className="text-xs text-muted-foreground capitalize">{member.trade}</p>
                                    {member.status === 'pending' && (
                                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded-full uppercase font-bold tracking-wider">
                                            En attente
                                        </span>
                                    )}
                                </div>
                                <RemoveMemberButton 
                                    userId={member.user_id} 
                                    cohortId={cohortId} 
                                    name={`${member.first_name} ${member.last_name}`} 
                                />
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
