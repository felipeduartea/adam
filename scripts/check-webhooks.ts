import { prisma } from "../src/lib/prisma";

async function checkWebhooks() {
  const webhooks = await prisma.zendeskWebhook.findMany({
    include: {
      integration: {
        select: {
          zendeskSubdomain: true,
          organizationId: true,
        },
      },
    },
  });

  console.log(`Found ${webhooks.length} webhook(s):\n`);

  webhooks.forEach((webhook) => {
    console.log(`Webhook ID: ${webhook.id}`);
    console.log(`Endpoint Path: ${webhook.endpointPath}`);
    console.log(`Organization: ${webhook.integration.organizationId}`);
    console.log(`Subdomain: ${webhook.integration.zendeskSubdomain}`);
    console.log(`Active: ${webhook.isActive}`);
    console.log(`---`);
  });

  await prisma.$disconnect();
}

checkWebhooks();

