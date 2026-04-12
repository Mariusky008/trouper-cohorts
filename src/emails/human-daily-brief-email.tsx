import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

interface HumanDailyBriefEmailProps {
  firstName?: string;
  dateLabel: string;
  unreadNotifications: number;
  dispatchedSignals: number;
  pendingScoutReferrals: number;
  dashboardUrl: string;
}

export const HumanDailyBriefEmail = ({
  firstName = "Membre",
  dateLabel,
  unreadNotifications,
  dispatchedSignals,
  pendingScoutReferrals,
  dashboardUrl,
}: HumanDailyBriefEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Votre briefing Popey Human est disponible</Preview>
      <Tailwind>
        <Body className="bg-[#f8f5f1] my-auto mx-auto font-sans">
          <Container className="max-w-[520px] my-[28px] mx-auto rounded-2xl border border-[#eadfd1] bg-white p-8">
            <Heading className="text-[24px] leading-tight font-black text-[#2E130C] m-0">
              Bonjour {firstName},
            </Heading>
            <Text className="text-[14px] text-[#7a5a45] mt-2 mb-6">
              Voici votre briefing Popey Human du {dateLabel}.
            </Text>

            <Section className="rounded-xl border border-[#eadfd1] bg-[#fffaf4] p-4 mb-4">
              <Text className="text-[12px] uppercase tracking-wider font-bold text-[#9b6c4d] m-0">
                Notifications non lues
              </Text>
              <Text className="text-[28px] font-black text-[#2E130C] m-0">{unreadNotifications}</Text>
            </Section>

            <Section className="rounded-xl border border-[#eadfd1] bg-[#fffaf4] p-4 mb-4">
              <Text className="text-[12px] uppercase tracking-wider font-bold text-[#9b6c4d] m-0">
                Signaux dispatchés à traiter
              </Text>
              <Text className="text-[28px] font-black text-[#2E130C] m-0">{dispatchedSignals}</Text>
            </Section>

            <Section className="rounded-xl border border-[#eadfd1] bg-[#fffaf4] p-4 mb-7">
              <Text className="text-[12px] uppercase tracking-wider font-bold text-[#9b6c4d] m-0">
                Referrals éclaireurs en attente
              </Text>
              <Text className="text-[28px] font-black text-[#2E130C] m-0">{pendingScoutReferrals}</Text>
            </Section>

            <Button
              className="w-full rounded-xl bg-[#2E130C] text-white text-[15px] font-bold no-underline text-center py-4"
              href={dashboardUrl}
            >
              Ouvrir mon cockpit Popey Human
            </Button>

            <Text className="text-[12px] text-[#9b8b7f] mt-6 mb-0 leading-5">
              Conseil: traitez vos signaux prioritaires en premier pour augmenter la conversion du jour.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default HumanDailyBriefEmail;
