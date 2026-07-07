# Validation Report

| Caso probado | Entrada | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- | --- |
| Iniciar sesion | Usuario `admin`, contrasena segura del seed | Acceso a `/dashboard` con sesion en cookie HTTP-only | Flujo cubierto por prueba e2e de login y proteccion de rutas | Aprobado |
| Registrar cliente | DNI unico de 8 digitos, correo valido, telefono, ingreso mensual mayor que cero | Cliente activo guardado y visible en detalle | Flujo cubierto por prueba e2e de alta de cliente | Aprobado |
| Registrar vehiculo | VIN unico, precio positivo, moneda PEN, condicion NUEVO | Vehiculo activo guardado y visible en detalle | Flujo cubierto por prueba e2e de alta de vehiculo | Aprobado |
| Crear simulacion sin gracia | Precio PEN 70000, inicial 20%, residual 50%, TEA 15%, plazo 36 | Cronograma calculado con indicadores y saldo final cero | Flujo cubierto por prueba e2e de simulacion sin gracia | Aprobado |
| Crear simulacion con gracia total y parcial | Gracia total 1-2, gracia parcial 3-4, rangos no superpuestos | Cronograma diferencia gracia total/parcial y recalcula cuota normal | Flujo cubierto por prueba e2e de simulacion con ambas gracias | Aprobado |
| Verificar indicadores | VAN, TIR mensual, TIR anual y TCEA desde flujo completo | Indicadores visibles y consistentes con motor financiero | Cubierto por pruebas unitarias del motor y prueba e2e de resultados | Aprobado |
| Verificar saldo final cero | Ultimo periodo del cronograma | Saldo final formateado como 0.00 en moneda de la simulacion | Cubierto por prueba e2e y ajuste final del motor financiero | Aprobado |
| Editar y recalcular | Cambio de valor residual en simulacion guardada | Nueva version recalculada y cambio registrado en AuditLog | Flujo cubierto por prueba e2e de edicion y recalculo | Aprobado |
| Exportar cronograma | Simulacion guardada con cronograma completo | Descarga CSV con nombre `cronograma-*.csv`; PDF disponible desde detalle | CSV cubierto por prueba e2e; PDF implementado como ruta autenticada | Aprobado |
| Imprimir cronograma | Accion desde detalle de simulacion | Invoca impresion del navegador sobre la vista de resultados | Boton de impresion disponible en la pantalla de detalle | Aprobado |
| Filtros de simulaciones | Cliente, vehiculo, moneda, fecha y estado | Listado restringido segun criterios seleccionados | Filtros implementados en consulta server-side | Aprobado |
| Estados de simulacion | BORRADOR, CALCULADA, APROBADA, ARCHIVADA | Estado persistido, visible y modificable desde detalle | Enum y accion de cambio de estado implementados | Aprobado |
| Pagina de ayuda y glosario | Conceptos TEA, TNA, TEM, capitalizacion, metodo frances, cuota balon, gracias, VAN, TIR y TCEA | Explicaciones claras disponibles en `/ayuda` | Pagina actualizada con seccion de glosario financiero | Aprobado |
