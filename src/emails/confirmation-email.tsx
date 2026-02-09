import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

export const ConfirmationEmail = ({ firstName }: { firstName: string }) => (
  <Html>
    <Head />
    <Preview>Candidature bien reçue ! ⚓️</Preview>
    <Tailwind>
      <Body className="bg-white my-auto mx-auto font-sans">
        <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
          <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
            Bien reçu, <strong>{firstName}</strong> !
          </Heading>
          <Text className="text-black text-[14px] leading-[24px]">
            Nous avons bien reçu ta demande pour rejoindre la <strong>Popey Academy</strong>.
          </Text>
          <Text className="text-black text-[14px] leading-[24px]">
            L'équipe va étudier ton profil. Si tout colle, tu recevras bientôt un email de validation avec ton ordre de mission et tes accès.
          </Text>
          <Text className="text-gray-500 text-[12px] mt-6 text-center italic">
            "Il n'y a pas de vent favorable pour celui qui ne sait pas où il va." — Sénèque
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default ConfirmationEmail;
