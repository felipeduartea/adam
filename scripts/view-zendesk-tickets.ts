import { prisma } from "../src/lib/prisma";

async function viewTickets() {
  const tickets = await prisma.zendeskTicket.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
    include: {
      integration: {
        select: {
          zendeskSubdomain: true,
        },
      },
    },
  });

  console.log(`\n📊 Found ${tickets.length} Zendesk tickets in database:\n`);

  tickets.forEach((ticket, index) => {
    console.log(`${index + 1}. [${ticket.priority}] ${ticket.subject}`);
    console.log(`   Status: ${ticket.status}`);
    console.log(`   External ID: ${ticket.externalId}`);
    console.log(`   Created: ${ticket.createdAt?.toLocaleString() || "N/A"}`);
    console.log(`   ---`);
  });

  // Count by status
  const statusCounts = tickets.reduce(
    (acc, ticket) => {
      acc[ticket.status || "unknown"] = (acc[ticket.status || "unknown"] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log(`\n📈 Status Distribution:`);
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });

  // Count by priority
  const priorityCounts = tickets.reduce(
    (acc, ticket) => {
      acc[ticket.priority || "unknown"] = (acc[ticket.priority || "unknown"] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log(`\n🎯 Priority Distribution:`);
  Object.entries(priorityCounts).forEach(([priority, count]) => {
    console.log(`   ${priority}: ${count}`);
  });

  await prisma.$disconnect();
}

viewTickets();

