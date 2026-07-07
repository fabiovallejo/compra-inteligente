import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { simulationToPdf } from "@/modules/simulations/exports";
import { getCurrentUser } from "@/server/auth/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });

  const { id } = await params;
  const simulation = await prisma.creditSimulation.findUnique({
    where: { id },
    include: {
      client: { select: { firstNames: true, lastNames: true, dni: true } },
      vehicle: { select: { brand: true, model: true, vin: true } },
      financialProduct: { select: { name: true, currency: true } },
      financialIndicator: true,
      paymentScheduleItems: { orderBy: { periodNumber: "asc" } },
    },
  });

  if (!simulation) return new NextResponse("No encontrada", { status: 404 });

  return new NextResponse(simulationToPdf(simulation), {
    headers: {
      "content-disposition": `attachment; filename="cronograma-${id}.pdf"`,
      "content-type": "application/pdf",
    },
  });
}
