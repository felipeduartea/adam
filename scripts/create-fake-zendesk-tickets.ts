/**
 * Script to create fake Zendesk tickets by sending webhook events
 * Usage: npx tsx scripts/create-fake-zendesk-tickets.ts
 */

import { prisma } from "../src/lib/prisma";

const NGROK_URL = "https://mailable-juliann-nonhesitantly.ngrok-free.dev";

const priorities = ["low", "medium", "high", "urgent"];
const statuses = ["new", "open", "pending", "solved", "closed"];

const ticketTemplates = [
  {
    subject: "Cannot log in to dashboard",
    description: "Users are reporting they cannot log in to the main dashboard. Getting 'Invalid credentials' error even with correct password.",
  },
  {
    subject: "Payment processing failure",
    description: "Multiple customers experiencing payment failures during checkout. Credit cards are being declined incorrectly.",
  },
  {
    subject: "Slow page load times",
    description: "The application is loading very slowly, taking 10+ seconds to load the home page. This is affecting user experience.",
  },
  {
    subject: "Export feature not working",
    description: "When trying to export data to CSV, the download button does nothing. No error message is shown.",
  },
  {
    subject: "Mobile app crashes on startup",
    description: "iOS app crashes immediately after opening. This started happening after the latest update.",
  },
  {
    subject: "Email notifications not being sent",
    description: "Users are not receiving email notifications for important events. Email settings are configured correctly.",
  },
  {
    subject: "Search results are incorrect",
    description: "Search functionality is returning irrelevant results. Exact matches are not appearing in search.",
  },
  {
    subject: "API rate limiting too aggressive",
    description: "Our integration is hitting rate limits too quickly. Need higher limits for enterprise plan.",
  },
  {
    subject: "Dark mode not persisting",
    description: "When users enable dark mode, it resets back to light mode after page refresh.",
  },
  {
    subject: "Cannot upload large files",
    description: "File upload fails for files over 10MB. Gets stuck at 99% and then shows timeout error.",
  },
  {
    subject: "Dashboard widgets not updating",
    description: "Real-time dashboard widgets are not updating automatically. Users have to manually refresh the page.",
  },
  {
    subject: "Incorrect timezone in reports",
    description: "All reports are showing times in UTC instead of user's local timezone. Settings indicate correct timezone.",
  },
  {
    subject: "Two-factor authentication bypass",
    description: "Security concern: Found a way to bypass 2FA during login process. This needs immediate attention.",
  },
  {
    subject: "Broken images in email templates",
    description: "Email templates are showing broken image links. Images were working fine last week.",
  },
  {
    subject: "Duplicate entries in database",
    description: "System is creating duplicate records when users submit forms. Database needs cleanup.",
  },
  {
    subject: "Feature request: Bulk actions",
    description: "Would like ability to perform bulk actions on multiple items at once. Currently have to do one by one.",
  },
  {
    subject: "Integration with Slack not syncing",
    description: "Slack integration stopped syncing messages. Last successful sync was 3 days ago.",
  },
  {
    subject: "Password reset emails not arriving",
    description: "Users clicking 'Forgot Password' are not receiving reset emails. Checked spam folders.",
  },
  {
    subject: "Calendar sync issues with Google",
    description: "Google Calendar integration is not syncing events properly. Some events are missing.",
  },
  {
    subject: "Performance degradation during peak hours",
    description: "Application becomes very slow during peak hours (2-4 PM EST). Database queries timing out.",
  },
];

async function sendTicketWebhook(webhookUrl: string, ticketData: any, index: number) {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Zendesk-Webhook-Id": `webhook-${Date.now()}-${index}`,
        "X-Zendesk-Event-Type": "zen:event-type:ticket.created",
      },
      body: JSON.stringify(ticketData),
    });

    if (response.ok) {
      console.log(`✅ Ticket #${ticketData.detail.id}: "${ticketData.detail.subject}"`);
    } else {
      const errorText = await response.text();
      console.error(`❌ Failed to create ticket ${index + 1}:`, errorText);
    }
  } catch (error) {
    console.error(`❌ Error sending ticket ${index + 1}:`, error);
  }
}

async function createFakeTickets() {
  console.log(`🎫 Creating 20 fake Zendesk tickets...\n`);

  // Fetch the latest webhook from database
  const webhook = await prisma.zendeskWebhook.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      integration: true,
    },
  });

  if (!webhook) {
    console.error("❌ No active webhook found in database!");
    console.log("💡 Please generate a webhook first via the integrations page.");
    await prisma.$disconnect();
    return;
  }

  const webhookToken = webhook.endpointPath.replace("/webhook/", "");
  const webhookUrl = `${NGROK_URL}/api/zendesk/webhook/${webhookToken}`;

  console.log(`📍 Using webhook: ${webhookUrl}\n`);

  const baseTimestamp = Date.now();

  for (let i = 0; i < 20; i++) {
    const template = ticketTemplates[i];
    const ticketId = 10000 + i;
    const createdAt = new Date(baseTimestamp - (20 - i) * 3600000); // Spread over last 20 hours

    // Use the actual Zendesk webhook payload format
    const ticketPayload = {
      account_id: 22129848,
      detail: {
        actor_id: "8447388090494",
        assignee_id: Math.random() > 0.3 ? "8447388090494" : null,
        brand_id: "8447346621310",
        created_at: createdAt.toISOString(),
        custom_status: "8447320465790",
        description: template.description,
        external_id: `ZD-${ticketId}`,
        form_id: "8646151517822",
        group_id: "8447320466430",
        id: ticketId.toString(),
        is_public: true,
        organization_id: "8447346622462",
        priority: priorities[Math.floor(Math.random() * priorities.length)].toUpperCase(),
        requester_id: (8447388090494 + i).toString(),
        status: statuses[Math.floor(Math.random() * statuses.length)].toUpperCase(),
        subject: template.subject,
        submitter_id: "8447388090494",
        tags: ["web", "bug", "customer-support"],
        type: Math.random() > 0.5 ? "TASK" : "INCIDENT",
        updated_at: createdAt.toISOString(),
        via: {
          channel: Math.random() > 0.5 ? "web" : "email",
        },
      },
      event: {},
      id: `${Date.now()}-${i}`,
      subject: `zen:ticket:${ticketId}`,
      time: createdAt.toISOString(),
      type: "zen:event-type:ticket.created",
      zendesk_event_version: "2022-11-06",
    };

    await sendTicketWebhook(webhookUrl, ticketPayload, i);

    // Small delay to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`\n🎉 Done! Created 20 fake Zendesk tickets.`);
  console.log(`\n💡 Check your database or app to see the tickets!`);

  await prisma.$disconnect();
}

createFakeTickets();

