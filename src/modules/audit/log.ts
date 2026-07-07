import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function writeAuditLog(input: {
  userId: string;
  action: string;
  entity: string;
  recordId: string;
  detail?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      recordId: input.recordId,
      detail: input.detail,
    },
  });
}
