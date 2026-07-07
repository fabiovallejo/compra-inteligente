import bcrypt from "bcrypt";
import prismaClientPackage from "@prisma/client";

const {
  PrismaClient,
  Currency,
  UserRole,
  RateType,
  CapitalizationFrequency,
  VehicleStatus,
  VehicleCondition,
  FinancialProductCostType,
  CostCalculationType,
  CostCalculationBase,
} = prismaClientPackage;

const prisma = new PrismaClient();

async function main() {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
  const adminPasswordHash = await bcrypt.hash("Admin123!", saltRounds);
  const advisorPasswordHash = await bcrypt.hash("Asesor123!", saltRounds);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      role: UserRole.ADMIN,
      active: true,
      passwordHash: adminPasswordHash,
    },
    create: {
      username: "admin",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { username: "asesor" },
    update: {
      role: UserRole.ADVISOR,
      active: true,
      passwordHash: advisorPasswordHash,
    },
    create: {
      username: "asesor",
      passwordHash: advisorPasswordHash,
      role: UserRole.ADVISOR,
      active: true,
    },
  });

  await prisma.client.upsert({
    where: { dni: "45678912" },
    update: {},
    create: {
      dni: "45678912",
      firstNames: "Mariana Lucia",
      lastNames: "Torres Salazar",
      email: "mariana.torres@example.com",
      phone: "999111222",
      address: "Av. Javier Prado 1234, Lima",
      birthDate: new Date("1991-04-18T00:00:00.000Z"),
      occupation: "Analista financiera",
      monthlyIncome: "8500.00000000",
      incomeCurrency: Currency.PEN,
    },
  });

  await prisma.client.upsert({
    where: { dni: "47890123" },
    update: {},
    create: {
      dni: "47890123",
      firstNames: "Diego Alonso",
      lastNames: "Ramirez Vega",
      email: "diego.ramirez@example.com",
      phone: "988333444",
      address: "Calle Los Fresnos 456, Arequipa",
      birthDate: new Date("1988-10-05T00:00:00.000Z"),
      occupation: "Ingeniero de software",
      monthlyIncome: "3200.00000000",
      incomeCurrency: Currency.USD,
    },
  });

  await prisma.vehicle.upsert({
    where: { vin: "8APDE1234RA000001" },
    update: {},
    create: {
      vin: "8APDE1234RA000001",
      brand: "Toyota",
      model: "Corolla Cross",
      year: 2025,
      color: "Blanco perla",
      type: "SUV",
      condition: VehicleCondition.NUEVO,
      price: "70000.00000000",
      currency: Currency.PEN,
      status: VehicleStatus.AVAILABLE,
    },
  });

  await prisma.vehicle.upsert({
    where: { vin: "9BWDE5678RA000002" },
    update: {},
    create: {
      vin: "9BWDE5678RA000002",
      brand: "Volkswagen",
      model: "T-Cross",
      year: 2024,
      color: "Azul noche",
      type: "SUV",
      condition: VehicleCondition.NUEVO,
      price: "25000.00000000",
      currency: Currency.USD,
      status: VehicleStatus.AVAILABLE,
    },
  });

  const product = await prisma.financialProduct.upsert({
    where: {
      name_currency: {
        name: "Compra Inteligente Vehicular PEN",
        currency: Currency.PEN,
      },
    },
    update: {
      active: true,
      defaultDownPaymentRate: "20.000000000000",
      defaultResidualValueRate: "50.000000000000",
      defaultTermMonths: 36,
      defaultRateType: RateType.EFFECTIVE_ANNUAL,
      defaultAnnualRate: "15.000000000000",
      capitalization: CapitalizationFrequency.MONTHLY,
      cok: "10.000000000000",
    },
    create: {
      name: "Compra Inteligente Vehicular PEN",
      currency: Currency.PEN,
      defaultDownPaymentRate: "20.000000000000",
      defaultResidualValueRate: "50.000000000000",
      defaultTermMonths: 36,
      defaultRateType: RateType.EFFECTIVE_ANNUAL,
      defaultAnnualRate: "15.000000000000",
      capitalization: CapitalizationFrequency.MONTHLY,
      cok: "10.000000000000",
      active: true,
    },
  });

  const costs = [
    {
      costType: FinancialProductCostType.DEBT_RELIEF_INSURANCE,
      calculationType: CostCalculationType.PERCENTAGE,
      rate: "0.050000000000",
      fixedAmount: null,
      calculationBase: CostCalculationBase.BALANCE,
    },
    {
      costType: FinancialProductCostType.VEHICLE_INSURANCE,
      calculationType: CostCalculationType.PERCENTAGE,
      rate: "0.080000000000",
      fixedAmount: null,
      calculationBase: CostCalculationBase.VEHICLE_PRICE,
    },
    {
      costType: FinancialProductCostType.PERIODIC_COMMISSION,
      calculationType: CostCalculationType.FIXED_AMOUNT,
      rate: null,
      fixedAmount: "5.00000000",
      calculationBase: CostCalculationBase.FIXED,
    },
    {
      costType: FinancialProductCostType.ITF,
      calculationType: CostCalculationType.PERCENTAGE,
      rate: "0.005000000000",
      fixedAmount: null,
      calculationBase: CostCalculationBase.PAYMENT_AMOUNT,
    },
  ];

  for (const cost of costs) {
    await prisma.financialProductCost.upsert({
      where: {
        productId_costType: {
          productId: product.id,
          costType: cost.costType,
        },
      },
      update: cost,
      create: {
        productId: product.id,
        ...cost,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "SEED_DATABASE",
      entity: "Database",
      recordId: "seed",
      detail: {
        users: ["admin", "asesor"],
        product: product.name,
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
