import bcrypt from "bcrypt";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  Currency,
  PrismaClient,
  UserRole,
  VehicleCondition,
  VehicleStatus,
} from "@prisma/client";

const prisma = new PrismaClient();
const suffix = Date.now().toString();
let userId = "";
let clientId = "";
let vehicleId = "";

describe("client and vehicle persistence", () => {
  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        username: `integration-${suffix}`,
        passwordHash: await bcrypt.hash("Temporal123!", 8),
        role: UserRole.ADMIN,
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { userId } });
    if (clientId) {
      await prisma.client.deleteMany({ where: { id: clientId } });
    }
    if (vehicleId) {
      await prisma.vehicle.deleteMany({ where: { id: vehicleId } });
    }
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("creates, updates and logically deactivates a client with audit logs", async () => {
    const client = await prisma.client.create({
      data: {
        dni: suffix.slice(-8).padStart(8, "1"),
        firstNames: "Cliente",
        lastNames: "Integracion",
        email: `cliente-${suffix}@example.com`,
        phone: "999111222",
        monthlyIncome: "5000.00000000",
        incomeCurrency: Currency.PEN,
      },
    });
    clientId = client.id;

    await prisma.auditLog.create({
      data: {
        userId,
        action: "CREATE",
        entity: "Client",
        recordId: client.id,
      },
    });

    const updated = await prisma.client.update({
      where: { id: client.id },
      data: { firstNames: "Cliente Editado" },
    });
    await prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE",
        entity: "Client",
        recordId: client.id,
      },
    });

    const inactive = await prisma.client.update({
      where: { id: client.id },
      data: { active: false },
    });
    await prisma.auditLog.create({
      data: {
        userId,
        action: "DEACTIVATE",
        entity: "Client",
        recordId: client.id,
      },
    });

    const auditCount = await prisma.auditLog.count({
      where: { entity: "Client", recordId: client.id },
    });

    expect(updated.firstNames).toBe("Cliente Editado");
    expect(inactive.active).toBe(false);
    expect(auditCount).toBe(3);
  });

  it("creates, updates and logically deactivates a vehicle with audit logs", async () => {
    const vehicle = await prisma.vehicle.create({
      data: {
        vin: `8APDE${suffix.slice(-6).padStart(6, "0")}RA0000`,
        brand: "Toyota",
        model: "Yaris",
        year: 2025,
        condition: VehicleCondition.NUEVO,
        price: "65000.00000000",
        currency: Currency.PEN,
      },
    });
    vehicleId = vehicle.id;

    await prisma.auditLog.create({
      data: {
        userId,
        action: "CREATE",
        entity: "Vehicle",
        recordId: vehicle.id,
      },
    });

    const updated = await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { condition: VehicleCondition.SEMINUEVO },
    });
    await prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE",
        entity: "Vehicle",
        recordId: vehicle.id,
      },
    });

    const inactive = await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { status: VehicleStatus.INACTIVE },
    });
    await prisma.auditLog.create({
      data: {
        userId,
        action: "DEACTIVATE",
        entity: "Vehicle",
        recordId: vehicle.id,
      },
    });

    const auditCount = await prisma.auditLog.count({
      where: { entity: "Vehicle", recordId: vehicle.id },
    });

    expect(updated.condition).toBe(VehicleCondition.SEMINUEVO);
    expect(inactive.status).toBe(VehicleStatus.INACTIVE);
    expect(auditCount).toBe(3);
  });
});
