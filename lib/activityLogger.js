import prisma from "./prisma";

export async function logActivity({
  action,
  entity,
  entity_id,
  description,
  performed_by,
}) {
  try {
    await prisma.activity_logs.create({
      data: {
        action,
        entity,
        entity_id,
        description,
        performed_by,
      },
    });
  } catch (err) {
    console.error("Activity log failed", err);
  }
}
