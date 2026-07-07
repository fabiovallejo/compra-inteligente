CREATE TYPE "VehicleCondition" AS ENUM ('NUEVO', 'SEMINUEVO');

ALTER TABLE "Client"
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Client_active_idx" ON "Client"("active");

ALTER TABLE "Vehicle"
  ALTER COLUMN "condition" TYPE "VehicleCondition"
  USING (
    CASE
      WHEN upper(coalesce("condition", '')) = 'SEMINUEVO'
        THEN 'SEMINUEVO'::"VehicleCondition"
      ELSE 'NUEVO'::"VehicleCondition"
    END
  );

ALTER TABLE "Vehicle"
  ALTER COLUMN "condition" SET NOT NULL;
