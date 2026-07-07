CREATE TYPE "SimulationStatus_new" AS ENUM ('BORRADOR', 'CALCULADA', 'APROBADA', 'ARCHIVADA');

ALTER TABLE "CreditSimulation"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "CreditSimulation"
  ALTER COLUMN "status" TYPE "SimulationStatus_new"
  USING (
    CASE "status"::text
      WHEN 'DRAFT' THEN 'BORRADOR'
      WHEN 'CALCULATED' THEN 'CALCULADA'
      WHEN 'APPROVED' THEN 'APROBADA'
      WHEN 'ARCHIVED' THEN 'ARCHIVADA'
      ELSE 'CALCULADA'
    END
  )::"SimulationStatus_new";

DROP TYPE "SimulationStatus";

ALTER TYPE "SimulationStatus_new" RENAME TO "SimulationStatus";

ALTER TABLE "CreditSimulation"
  ALTER COLUMN "status" SET DEFAULT 'CALCULADA';
