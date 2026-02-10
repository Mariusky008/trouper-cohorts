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
import * as React from "react";

interface WelcomeEmailProps {
  firstName: string;
  loginUrl: string;
  cohortName: string;
}

export const WelcomeEmail = ({
  firstName,
  loginUrl,
  cohortName,
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Bienvenue dans l'aventure Popey ! ⚓️</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Bienvenue à bord, <strong>{firstName}</strong> !
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Ta candidature a été validée. Tu fais officiellement partie de l'équipage <strong>{cohortName}</strong>.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Il est temps de créer ton compte et de découvrir ta première mission.
              Pour ta sécurité, tu devras confirmer ton email lors de la première connexion.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={loginUrl}
              >
                Récupérer mon Pass d'Accès
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :
              <br />
              <a href={loginUrl} className="text-blue-600 no-underline">
                {loginUrl}
              </a>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;
