import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind,
  Link,
  Column,
  Row,
} from "@react-email/components";
import * as React from "react";

interface DailyMatchEmailProps {
  userName: string;
  matchName: string;
  matchJob: string;
  matchCity: string;
  matchAvatar: string;
  matchGoal: string;
  matchSuperpower?: string;
  matchNeed?: string;
  dashboardUrl: string;
}

export const DailyMatchEmail = ({
  userName = "Champion",
  matchName = "Thomas",
  matchJob = "Graphiste",
  matchCity = "Paris",
  matchAvatar = "https://ui.shadcn.com/avatars/02.png",
  matchGoal = "Trouver des clients",
  matchSuperpower,
  matchNeed,
  dashboardUrl = "https://popey.academy/mon-reseau-local/dashboard",
}: DailyMatchEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>⚓️ Votre opportunité Popey du jour est prête !</Preview>
      <Tailwind>
        <Body className="bg-slate-50 my-auto mx-auto font-sans">
          <Container className="border border-solid border-slate-200 rounded-3xl my-[40px] mx-auto p-[40px] max-w-[465px] bg-white shadow-xl">
            
            {/* Logo / Header */}
            <Section className="text-center mb-8">
                <Img
                    src="https://popey.academy/icon.png" // Replace with actual hosted logo if available
                    width="40"
                    height="40"
                    alt="Popey"
                    className="mx-auto mb-4 rounded-xl"
                />
                <Heading className="text-slate-900 text-[24px] font-black text-center p-0 my-0 leading-tight">
                  Bonjour {userName} ! 👋
                </Heading>
                <Text className="text-slate-500 text-[16px] text-center mt-2 mb-0">
                  Votre opportunité du jour est disponible.
                </Text>
            </Section>

            {/* Match Card */}
            <Section className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center mb-8">
                <Img
                    src={matchAvatar}
                    width="80"
                    height="80"
                    alt={matchName}
                    className="mx-auto rounded-full border-4 border-white shadow-md mb-4 object-cover"
                />
                <Text className="text-slate-900 text-[20px] font-black m-0 leading-tight">
                    {matchName}
                </Text>
                <Text className="text-slate-500 text-[12px] font-bold uppercase tracking-widest mt-1 mb-4">
                    {matchJob} • {matchCity}
                </Text>
                
                {matchSuperpower && matchNeed ? (
                    <div className="bg-white rounded-xl p-4 border border-slate-200 text-left">
                        <Text className="text-[12px] font-bold text-slate-400 uppercase m-0 mb-1">CE QU'IL CHERCHE :</Text>
                        <Text className="text-slate-800 text-[14px] m-0 mb-3 font-medium">"{matchNeed}"</Text>
                        
                        <div className="h-px bg-slate-100 w-full my-2"></div>
                        
                        <Text className="text-[12px] font-bold text-slate-400 uppercase m-0 mb-1">CE QU'IL OFFRE :</Text>
                        <Text className="text-slate-800 text-[14px] m-0 font-medium">"{matchSuperpower}"</Text>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl p-3 border border-slate-200 text-sm text-slate-600 italic">
                        "{matchName} cherche à <strong>{matchGoal.toLowerCase()}</strong> et votre profil l'intéresse."
                    </div>
                )}
            </Section>

            {/* CTA */}
            <Section className="text-center mb-8">
              <Button
                className="bg-blue-600 rounded-xl text-white text-[16px] font-bold no-underline text-center px-8 py-4 shadow-lg shadow-blue-200 block w-full"
                href={dashboardUrl}
              >
                Voir mon match maintenant 🚀
              </Button>
            </Section>

            {/* Footer / Gamification Nudge */}
            <Text className="text-slate-400 text-[12px] text-center leading-[20px]">
              Astuce : Répondez dans les 24h pour maintenir votre score de confiance au top. ⭐️
              <br/>
              <Link href={dashboardUrl} className="text-slate-400 underline mt-2 block">
                Gérer mes préférences
              </Link>
            </Text>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default DailyMatchEmail;
