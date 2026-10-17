import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
} from "@react-email/components";
import * as React from "react";

interface RegistrationEmailProps {
  teamName: string;
  tournamentName: string;
  status: "pending" | "approved" | "waitlisted";
}

export const RegistrationEmail = ({ teamName, tournamentName, status }: RegistrationEmailProps) => {
  const getStatusMessage = () => {
    switch (status) {
      case "pending":
        return "Your registration is currently pending verification. We are reviewing your payment and roster details.";
      case "approved":
        return "Your slot is confirmed! Prepare for battle.";
      case "waitlisted":
        return "The tournament is currently full, and your team has been placed on the waitlist. We will notify you if a slot opens up.";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "pending": return "#D4AF37"; // Gold
      case "approved": return "#22c55e"; // Green
      case "waitlisted": return "#a3a3a3"; // Gray
    }
  };

  return (
    <Html>
      <Head />
      <Preview>Registration Update: {tournamentName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>ZENITH ESPORTS</Heading>
          
          <Section style={card}>
            <Heading style={h2}>Registration {status.toUpperCase()}</Heading>
            <Text style={text}>
              Captain, your registration for <strong>{tournamentName}</strong> under the team name <strong>{teamName}</strong> has been received.
            </Text>
            
            <Section style={{ ...statusBox, borderColor: getStatusColor() }}>
              <Text style={{ ...statusText, color: getStatusColor() }}>
                {getStatusMessage()}
              </Text>
            </Section>
            
            <Text style={subtext}>
              You can check your live registration status at any time via your Team Dashboard.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default RegistrationEmail;

const main = {
  backgroundColor: "#0a0a0a",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const h1 = {
  color: "#D4AF37",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  letterSpacing: "4px",
  margin: "0 0 40px",
};

const card = {
  backgroundColor: "#171717",
  border: "1px solid #262626",
  borderRadius: "8px",
  padding: "40px",
};

const h2 = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "600",
  margin: "0 0 16px",
};

const text = {
  color: "#a3a3a3",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 24px",
};

const statusBox = {
  backgroundColor: "#000000",
  borderLeft: "4px solid",
  padding: "16px",
  margin: "24px 0",
};

const statusText = {
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0",
  fontWeight: "500",
};

const subtext = {
  color: "#737373",
  fontSize: "14px",
  margin: "32px 0 0",
};
