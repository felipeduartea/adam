import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Middleware to automatically create an organization for new users
prisma.$use(async (params, next) => {
  if (params.model === "User" && params.action === "create") {
    // Execute the user creation first
    const result = await next(params);

    // After user is created, check if they have an organization
    const userId = result?.id;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true, email: true, name: true },
      });

      // Only create organization if user doesn't have one
      if (user && !user.organizationId) {
        // Generate organization name from email or use default
        let orgName = "My Organization";

        if (user.email) {
          // Extract domain from email and create a nice name
          const emailDomain = user.email.split("@")[1];
          const domainName = emailDomain?.split(".")[0];
          if (domainName) {
            orgName = domainName.charAt(0).toUpperCase() + domainName.slice(1);
          }
        } else if (user.name) {
          // Use user's name as organization name
          orgName = `${user.name}'s Organization`;
        }

        try {
          // Create organization and link to user
          await prisma.$transaction(async (tx) => {
            const organization = await tx.organization.create({
              data: {
                name: orgName,
              },
            });

            await tx.user.update({
              where: { id: userId },
              data: {
                organizationId: organization.id,
              },
            });
          });

          console.log(`✅ Auto-created organization "${orgName}" for user ${user.email || userId}`);
        } catch (error) {
          console.error("❌ Failed to auto-create organization for user:", error);
          // Don't throw - let user creation succeed even if org creation fails
        }
      }
    }

    return result;
  }

  // For all other operations, just continue
  return next(params);
});
