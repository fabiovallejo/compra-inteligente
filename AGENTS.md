# Compra Inteligente - Instrucciones del proyecto

## Objetivo

Construir una aplicación web para simular créditos vehiculares en Perú bajo la modalidad de Compra Inteligente, utilizando el método francés vencido ordinario con periodos mensuales de 30 días.

## Reglas obligatorias

- Trabajar en soles PEN y dólares USD.
- Soportar tasas efectivas anuales y tasas nominales anuales.
- Para tasas nominales, la capitalización es obligatoria.
- Convertir todas las tasas a una tasa efectiva mensual antes de calcular.
- Utilizar cuota balón configurable.
- El porcentaje de cuota balón predeterminado será 50%.
- Permitir gracia total y parcial en el mismo crédito, siempre que los rangos no se superpongan.
- En gracia total no se paga cuota ni cargos y los intereses se capitalizan.
- En gracia parcial se pagan intereses y cargos, pero no se amortiza capital.
- La última cuota incluye la cuota base, la cuota balón y los cargos correspondientes.
- Construir el flujo de caja desde el punto de vista del deudor.
- Calcular VAN, TIR mensual, TIR anual y TCEA.
- Incluir seguros, comisión e ITF en el flujo utilizado para la TCEA.
- Utilizar Decimal.js para cálculos financieros. No usar números flotantes nativos para importes.
- Mantener precisión interna y redondear a dos decimales solo para presentación.
- Guardar entradas, resultados, cronograma e indicadores en PostgreSQL.
- Cada campo de formulario debe tener un ícono de ayuda o tooltip.
- El usuario debe poder registrar, editar y consultar clientes, vehículos y simulaciones.
- Las contraseñas deben almacenarse mediante hash.
- No cambiar reglas financieras sin documentarlo.

## Arquitectura

- Next.js con TypeScript y App Router.
- PostgreSQL y Prisma.
- Lógica financiera en src/domain/finance.
- Validación con Zod.
- Formularios con React Hook Form.
- Pruebas unitarias con Vitest.
- Pruebas end-to-end con Playwright.
- Docker Compose para PostgreSQL.

## Flujo de trabajo

Antes de modificar código:

1. Leer este archivo.
2. Leer docs/business-rules.md.
3. Revisar docs/test-cases.md.
4. Explicar brevemente el plan.
5. Implementar cambios pequeños y verificables.
6. Ejecutar lint, typecheck, pruebas y build.
7. Informar archivos modificados, pruebas ejecutadas y pendientes.

## Criterio de finalización

Una tarea no está terminada si:

- El proyecto no compila.
- Las pruebas financieras no pasan.
- Existen errores de TypeScript.
- Los formularios no muestran validaciones.
- Los campos nuevos no tienen ayuda electrónica.
- No se persisten los datos en la base de datos.