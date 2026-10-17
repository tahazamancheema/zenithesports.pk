/**
 * Discord Webhook Utility
 * Used to send notifications to the Zenith Esports staff Discord server.
 */

interface DiscordWebhookPayload {
  content?: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
    timestamp?: string;
  }>;
}

/**
 * Send a message to a Discord Webhook
 * Requires DISCORD_WEBHOOK_URL to be set in environment variables.
 */
export async function sendDiscordNotification(payload: DiscordWebhookPayload) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn("DISCORD_WEBHOOK_URL is not set. Skipping notification.");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Failed to send Discord notification:", error);
  }
}

// Pre-configured notification templates

export async function notifyNewRegistration(teamName: string, tournamentName: string) {
  await sendDiscordNotification({
    embeds: [
      {
        title: "🎟️ New Tournament Registration",
        color: 0xD4AF37, // Zenith Gold
        fields: [
          { name: "Team", value: teamName, inline: true },
          { name: "Tournament", value: tournamentName, inline: true }
        ],
        timestamp: new Date().toISOString()
      }
    ]
  });
}

export async function notifyPaymentProofUploaded(teamName: string, amount: string) {
  await sendDiscordNotification({
    embeds: [
      {
        title: "💰 Payment Proof Uploaded",
        description: "A new payment proof requires admin verification.",
        color: 0x3B82F6, // Blue
        fields: [
          { name: "Team", value: teamName, inline: true },
          { name: "Amount Claimed", value: amount, inline: true }
        ],
        timestamp: new Date().toISOString()
      }
    ]
  });
}
