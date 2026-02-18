'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Send, Users, Star, TrendingUp, Medal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { submitBuddyReport } from '@/app/actions/ranking';
import { useToast } from '@/hooks/use-toast';

export default function RankingPage({ ranking, myBuddy }: { ranking: any[], myBuddy: any }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [report, setReport] = useState({
        messages: 0,
        interactions: 0,
        appointments: 0,
        comment: ''
    });

    const handleSubmit = async () => {
        if (!myBuddy) {
            toast({ title: "Erreur", description: "Vous n'avez pas de binôme assigné.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        const res = await submitBuddyReport({
            target_user_id: myBuddy.id,
            messages_sent: Number(report.messages),
            interactions_received: Number(report.interactions),
            appointments_booked: Number(report.appointments),
            comment: report.comment
        });

        if (res.success) {
            toast({ title: "Rapport envoyé !", description: "Les points ont été attribués à votre binôme." });
            setReport({ messages: 0, interactions: 0, appointments: 0, comment: '' });
        } else {
            toast({ title: "Erreur", description: res.error, variant: "destructive" });
        }
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12 font-sans">
            <div className="max-w-5xl mx-auto space-y-12">
                
                {/* Header */}
                <div className="text-center space-y-4">
                    <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 uppercase tracking-widest px-4 py-1">
                        Championnat d'Activation
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter">
                        Le Panthéon <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600">des Troupers</span>
                    </h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        "On ne réussit pas seul. Ici, on mesure la force du collectif."
                    </p>
                </div>

                <Tabs defaultValue="ranking" className="space-y-8">
                    <div className="flex justify-center">
                        <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-full">
                            <TabsTrigger value="ranking" className="rounded-full px-8 py-2 data-[state=active]:bg-yellow-500 data-[state=active]:text-black font-bold uppercase tracking-wide">
                                <Trophy className="h-4 w-4 mr-2" />
                                Classement
                            </TabsTrigger>
                            <TabsTrigger value="report" className="rounded-full px-8 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase tracking-wide">
                                <Send className="h-4 w-4 mr-2" />
                                Déclarer pour mon Binôme
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* TAB 1: CLASSEMENT */}
                    <TabsContent value="ranking" className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-6 mb-12 items-end">
                            {/* 2nd Place */}
                            {ranking[1] && (
                                <Card className="bg-slate-900/50 border-slate-800 border-t-4 border-t-slate-400 transform translate-y-4">
                                    <CardContent className="p-6 text-center space-y-4">
                                        <div className="mx-auto h-20 w-20 rounded-full border-4 border-slate-400 bg-slate-800 flex items-center justify-center text-3xl font-black text-slate-400">2</div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{ranking[1].name}</h3>
                                            <p className="text-slate-500 text-sm uppercase font-bold tracking-wider">Vice-Champion</p>
                                        </div>
                                        <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-lg px-4 py-1">
                                            {ranking[1].total_score} PTS
                                        </Badge>
                                    </CardContent>
                                </Card>
                            )}

                            {/* 1st Place */}
                            {ranking[0] && (
                                <Card className="bg-gradient-to-b from-yellow-900/20 to-slate-900 border-yellow-500/50 border-t-4 border-t-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)] z-10">
                                    <CardContent className="p-8 text-center space-y-6">
                                        <div className="mx-auto h-24 w-24 rounded-full border-4 border-yellow-500 bg-yellow-900/50 flex items-center justify-center relative">
                                            <Trophy className="h-12 w-12 text-yellow-500" />
                                            <div className="absolute -top-3 bg-yellow-500 text-black font-black px-3 py-1 rounded-full text-xs uppercase tracking-widest border-2 border-slate-900">
                                                Leader
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white uppercase italic">{ranking[0].name}</h3>
                                            <p className="text-yellow-500 text-sm uppercase font-bold tracking-wider">Maître du Réseau</p>
                                        </div>
                                        <div className="text-5xl font-black text-white tracking-tighter">
                                            {ranking[0].total_score}
                                            <span className="text-lg text-slate-500 ml-2 font-medium">PTS</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* 3rd Place */}
                            {ranking[2] && (
                                <Card className="bg-slate-900/50 border-slate-800 border-t-4 border-t-orange-700 transform translate-y-8">
                                    <CardContent className="p-6 text-center space-y-4">
                                        <div className="mx-auto h-20 w-20 rounded-full border-4 border-orange-700 bg-slate-800 flex items-center justify-center text-3xl font-black text-orange-700">3</div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{ranking[2].name}</h3>
                                            <p className="text-slate-500 text-sm uppercase font-bold tracking-wider">Challenger</p>
                                        </div>
                                        <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-lg px-4 py-1">
                                            {ranking[2].total_score} PTS
                                        </Badge>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Full List */}
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Users className="h-5 w-5 text-slate-400" />
                                    Classement Général
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {ranking.slice(3).map((user, index) => (
                                        <div key={user.user_id} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-lg border border-slate-800/50 hover:border-slate-700 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <span className="font-mono text-slate-500 w-8 text-right font-bold">#{index + 4}</span>
                                                <Avatar className="h-10 w-10 border border-slate-700">
                                                    <AvatarFallback className="bg-slate-800 text-slate-400 font-bold">{user.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-bold text-slate-300">{user.name}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right hidden sm:block">
                                                    <span className="text-xs text-slate-500 uppercase font-bold">Rapports</span>
                                                    <p className="text-slate-300 font-mono">{user.reports_count}</p>
                                                </div>
                                                <Badge variant="outline" className="bg-slate-900 text-white border-slate-700 h-8 px-3 text-sm font-bold">
                                                    {user.total_score} PTS
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                    {ranking.length <= 3 && (
                                        <div className="text-center py-8 text-slate-500 italic">
                                            Le reste du classement s'affichera ici dès que d'autres points seront marqués.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 2: DÉCLARATION */}
                    <TabsContent value="report">
                        <Card className="bg-[#0d1220] border-blue-900/30 max-w-2xl mx-auto shadow-2xl">
                            <CardHeader className="bg-blue-900/10 border-b border-blue-900/20 pb-8">
                                <div className="flex justify-center mb-6">
                                    <div className="h-20 w-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40 rotate-3">
                                        <Send className="h-10 w-10 text-white" />
                                    </div>
                                </div>
                                <CardTitle className="text-center text-2xl font-black text-white uppercase italic">
                                    Rapport Quotidien
                                </CardTitle>
                                <p className="text-center text-blue-200/60 font-medium mt-2">
                                    Déclare les actions de ton binôme <span className="text-white font-bold">{myBuddy ? myBuddy.name : "(Aucun binôme)"}</span> pour aujourd'hui.
                                </p>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                {myBuddy ? (
                                    <>
                                        <div className="grid gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-slate-400 uppercase text-xs font-bold tracking-widest">Messages Envoyés (1 pt)</Label>
                                                <div className="flex items-center gap-4">
                                                    <Input 
                                                        type="number" 
                                                        min="0"
                                                        value={report.messages}
                                                        onChange={(e) => setReport({...report, messages: Number(e.target.value)})}
                                                        className="bg-slate-950 border-slate-800 text-white h-12 text-lg font-mono"
                                                    />
                                                    <Badge className="bg-slate-800 text-slate-400 h-8">x 1</Badge>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-slate-400 uppercase text-xs font-bold tracking-widest">Interactions Reçues (2 pts)</Label>
                                                <div className="flex items-center gap-4">
                                                    <Input 
                                                        type="number" 
                                                        min="0"
                                                        value={report.interactions}
                                                        onChange={(e) => setReport({...report, interactions: Number(e.target.value)})}
                                                        className="bg-slate-950 border-slate-800 text-white h-12 text-lg font-mono"
                                                    />
                                                    <Badge className="bg-blue-900/50 text-blue-400 h-8">x 2</Badge>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-orange-500 uppercase text-xs font-bold tracking-widest flex items-center gap-2">
                                                    <Star className="h-3 w-3 fill-orange-500" /> Rendez-vous Décrochés (10 pts)
                                                </Label>
                                                <div className="flex items-center gap-4">
                                                    <Input 
                                                        type="number" 
                                                        min="0"
                                                        value={report.appointments}
                                                        onChange={(e) => setReport({...report, appointments: Number(e.target.value)})}
                                                        className="bg-orange-950/20 border-orange-900/50 text-orange-100 h-12 text-lg font-mono focus-visible:ring-orange-500"
                                                    />
                                                    <Badge className="bg-orange-600 text-white h-8 font-bold animate-pulse">x 10</Badge>
                                                </div>
                                            </div>

                                            <div className="space-y-2 pt-4">
                                                <Label className="text-slate-400">Commentaire d'encouragement (Optionnel)</Label>
                                                <Textarea 
                                                    placeholder="Bravo pour ta persévérance aujourd'hui !"
                                                    value={report.comment}
                                                    onChange={(e) => setReport({...report, comment: e.target.value})}
                                                    className="bg-slate-950 border-slate-800 text-white min-h-[100px]"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-800/50 flex justify-between items-center">
                                            <div className="text-sm">
                                                <span className="text-slate-500">Total estimé : </span>
                                                <span className="text-2xl font-black text-white ml-2">
                                                    {(report.messages * 1) + (report.interactions * 2) + (report.appointments * 10)}
                                                </span>
                                                <span className="text-xs font-bold text-slate-600 ml-1">PTS</span>
                                            </div>
                                            <Button 
                                                onClick={handleSubmit} 
                                                disabled={isSubmitting}
                                                size="lg" 
                                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 shadow-lg shadow-blue-900/20"
                                            >
                                                {isSubmitting ? "Envoi..." : "Valider le Rapport"}
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-12 text-slate-500">
                                        <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                        <p>Vous devez avoir un binôme assigné pour déclarer des points.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
