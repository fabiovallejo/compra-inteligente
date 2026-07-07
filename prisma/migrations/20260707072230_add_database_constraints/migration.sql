CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "User"
  ADD CONSTRAINT "User_username_not_blank_chk"
  CHECK (length(btrim("username")) > 0),
  ADD CONSTRAINT "User_passwordHash_not_blank_chk"
  CHECK (length(btrim("passwordHash")) > 0);

ALTER TABLE "Client"
  ADD CONSTRAINT "Client_dni_format_chk"
  CHECK ("dni" ~ '^[0-9]{8}$'),
  ADD CONSTRAINT "Client_firstNames_not_blank_chk"
  CHECK (length(btrim("firstNames")) > 0),
  ADD CONSTRAINT "Client_lastNames_not_blank_chk"
  CHECK (length(btrim("lastNames")) > 0),
  ADD CONSTRAINT "Client_monthlyIncome_non_negative_chk"
  CHECK ("monthlyIncome" >= 0);

ALTER TABLE "Vehicle"
  ADD CONSTRAINT "Vehicle_vin_format_chk"
  CHECK ("vin" ~ '^[A-HJ-NPR-Z0-9]{17}$'),
  ADD CONSTRAINT "Vehicle_year_reasonable_chk"
  CHECK ("year" BETWEEN 1900 AND 2100),
  ADD CONSTRAINT "Vehicle_price_non_negative_chk"
  CHECK ("price" >= 0);

ALTER TABLE "FinancialProduct"
  ADD CONSTRAINT "FinancialProduct_defaultDownPaymentRate_range_chk"
  CHECK ("defaultDownPaymentRate" >= 0 AND "defaultDownPaymentRate" <= 100),
  ADD CONSTRAINT "FinancialProduct_defaultResidualValueRate_range_chk"
  CHECK ("defaultResidualValueRate" >= 0 AND "defaultResidualValueRate" <= 100),
  ADD CONSTRAINT "FinancialProduct_defaultTermMonths_positive_chk"
  CHECK ("defaultTermMonths" > 0),
  ADD CONSTRAINT "FinancialProduct_defaultAnnualRate_non_negative_chk"
  CHECK ("defaultAnnualRate" >= 0),
  ADD CONSTRAINT "FinancialProduct_cok_non_negative_chk"
  CHECK ("cok" >= 0),
  ADD CONSTRAINT "FinancialProduct_nominal_capitalization_required_chk"
  CHECK ("defaultRateType" <> 'NOMINAL_ANNUAL' OR "capitalization" IS NOT NULL);

ALTER TABLE "FinancialProductCost"
  ADD CONSTRAINT "FinancialProductCost_percentage_shape_chk"
  CHECK (
    ("calculationType" = 'PERCENTAGE' AND "rate" IS NOT NULL AND "rate" >= 0 AND "fixedAmount" IS NULL)
    OR
    ("calculationType" = 'FIXED_AMOUNT' AND "fixedAmount" IS NOT NULL AND "fixedAmount" >= 0 AND "rate" IS NULL)
  );

ALTER TABLE "CreditSimulation"
  ADD CONSTRAINT "CreditSimulation_tem_non_negative_chk"
  CHECK ("calculatedMonthlyEffectiveRate" >= 0),
  ADD CONSTRAINT "CreditSimulation_financedAmount_non_negative_chk"
  CHECK ("financedAmount" >= 0),
  ADD CONSTRAINT "CreditSimulation_balloonPayment_non_negative_chk"
  CHECK ("balloonPayment" >= 0),
  ADD CONSTRAINT "CreditSimulation_basePayment_non_negative_chk"
  CHECK ("basePayment" >= 0);

ALTER TABLE "GracePeriod"
  ADD CONSTRAINT "GracePeriod_period_range_chk"
  CHECK ("periodFrom" > 0 AND "periodTo" >= "periodFrom");

ALTER TABLE "GracePeriod"
  ADD CONSTRAINT "GracePeriod_no_overlap_excl"
  EXCLUDE USING gist (
    "simulationId" WITH =,
    int4range("periodFrom", "periodTo", '[]') WITH &&
  );

ALTER TABLE "PaymentScheduleItem"
  ADD CONSTRAINT "PaymentScheduleItem_period_positive_chk"
  CHECK ("periodNumber" > 0),
  ADD CONSTRAINT "PaymentScheduleItem_money_non_negative_chk"
  CHECK (
    "openingBalance" >= 0
    AND "interest" >= 0
    AND "basePayment" >= 0
    AND "debtReliefInsurance" >= 0
    AND "vehicleInsurance" >= 0
    AND "commission" >= 0
    AND "itf" >= 0
    AND "balloonPayment" >= 0
    AND "totalPayment" >= 0
    AND "closingBalance" >= 0
  ),
  ADD CONSTRAINT "PaymentScheduleItem_debtor_cash_flow_negative_chk"
  CHECK ("debtorCashFlow" <= 0);

ALTER TABLE "FinancialIndicator"
  ADD CONSTRAINT "FinancialIndicator_totals_non_negative_chk"
  CHECK ("totalInterest" >= 0 AND "totalCharges" >= 0 AND "totalPaid" >= 0),
  ADD CONSTRAINT "FinancialIndicator_rates_non_negative_chk"
  CHECK ("monthlyIrr" >= 0 AND "annualIrr" >= 0 AND "tcea" >= 0);

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_action_not_blank_chk"
  CHECK (length(btrim("action")) > 0),
  ADD CONSTRAINT "AuditLog_entity_not_blank_chk"
  CHECK (length(btrim("entity")) > 0),
  ADD CONSTRAINT "AuditLog_recordId_not_blank_chk"
  CHECK (length(btrim("recordId")) > 0);
