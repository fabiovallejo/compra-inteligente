# Reglas financieras de Compra Inteligente

Este documento consolida las reglas obligatorias descritas en `AGENTS.md` y alineadas con el informe de referencia del proyecto.

## Alcance financiero

- El sistema simula creditos vehiculares en Peru bajo la modalidad de Compra Inteligente.
- Los calculos deben usar el metodo frances vencido ordinario.
- Los periodos son mensuales de 30 dias.
- El sistema debe trabajar en soles peruanos (`PEN`) y dolares estadounidenses (`USD`).
- El flujo de caja se construye desde el punto de vista del deudor.

## Tasas

- Se deben soportar tasas efectivas anuales y tasas nominales anuales.
- Para tasas nominales, la capitalizacion es obligatoria.
- Toda tasa ingresada se debe convertir a tasa efectiva mensual antes de calcular cronogramas o indicadores.
- Conversion desde TEA: `TEM = (1 + TEA)^(1/12) - 1`.
- Conversion desde TNA: `TEM = (1 + TNA / m)^(m/12) - 1`, donde `m` es la frecuencia de capitalizacion anual.
- La tasa de descuento o COK tambien debe convertirse a tasa mensual para calcular VAN.

## Cuota balon

- La cuota balon es configurable.
- El porcentaje predeterminado de cuota balon es 50%.
- La cuota base se calcula con metodo frances considerando el valor presente de la cuota balon.
- Formula base: `R = (P - (VF / (1 + i)^n)) * (i / (1 - (1 + i)^-n))`.
- Si la tasa mensual es cero, la cuota base se calcula como `(P - VF) / n`.
- La ultima cuota incluye la cuota base, la cuota balon y los cargos correspondientes.

## Periodos de gracia

- Se permite gracia total y gracia parcial en el mismo credito.
- Los rangos de gracia no pueden superponerse.
- En gracia total no se paga cuota ni cargos.
- En gracia total los intereses se capitalizan y aumentan el saldo.
- En gracia parcial se pagan intereses y cargos, pero no se amortiza capital.
- En periodos normales se paga cuota base, intereses, amortizacion y cargos aplicables.

## Cargos e impuestos

- El seguro de desgravamen se calcula sobre el saldo del credito.
- El seguro vehicular se calcula sobre el valor del vehiculo.
- La comision periodica se incluye en cada periodo aplicable.
- El ITF se calcula sobre el monto de la operacion.
- Seguros, comision e ITF deben incluirse en el flujo usado para calcular la TCEA.

## Indicadores

- El sistema debe calcular VAN.
- El sistema debe calcular TIR mensual.
- El sistema debe calcular TIR anual.
- El sistema debe calcular TCEA.
- La TCEA se deriva de la TIR mensual: `TCEA = (1 + TIR_m)^12 - 1`.

## Precision y persistencia

- Los calculos financieros deben usar Decimal.js.
- No se deben usar numeros flotantes nativos para importes monetarios.
- Se debe mantener precision interna y redondear a dos decimales solo para presentacion.
- Se deben guardar entradas, resultados, cronograma e indicadores en PostgreSQL.
- Las contrasenas deben almacenarse mediante hash.
- No se pueden cambiar reglas financieras sin documentarlo.

## Experiencia de usuario obligatoria

- Cada campo de formulario debe tener un icono de ayuda o tooltip.
- El usuario debe poder registrar, editar y consultar clientes, vehiculos y simulaciones.
- Las pantallas previstas incluyen login, dashboard, clientes, vehiculos, configuracion del credito, plan de pago e indicadores.
