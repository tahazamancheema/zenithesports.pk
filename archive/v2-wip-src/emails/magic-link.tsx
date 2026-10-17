import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
} from "@react-email/components";
import * as React from "react";

interface MagicLinkEmailProps {
  loginUrl: string;
}

export const MagicLinkEmail = ({ loginUrl }: MagicLinkEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Zenith Esports Login Link</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>ZENITH ESPORTS</Heading>
          
          <Section style={card}>
            <Heading style={h2}>Access Portal</Heading>
            <Text style={text}>
              Click the link below to securely sign in to your Zenith Esports account. 
              This link will expire in 15 minutes.
            </Text>
            
            <Section style={buttonContainer}>
              <Link href={loginUrl} style={button}>
                Sign In to Zenith
              </Link>
            </Section>
            
            <Text style={subtext}>
              If you didn't request this email, you can safely ignore it.
            </Text>
          </Section>
          
          <Text style={footer}>
            © {new Date().getFullYear()} Zenith Esports. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default MagicLinkEmail;

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
  margin: "0 0 32px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#D4AF37",
  borderRadius: "4px",
  color: "#0a0a0a",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const subtext = {
  color: "#737373",
  fontSize: "14px",
  margin: "32px 0 0",
};

const footer = {
  color: "#525252",
  fontSize: "12px",
  textAlign: "center" as const,
  margin: "40px 0 0",
};
