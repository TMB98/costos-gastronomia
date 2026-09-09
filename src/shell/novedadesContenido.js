const NOVEDADES = [
  {
    version: "1.15",
    fecha: "07/09/2026",
    items: [
      "Arreglo importante: la pestaña Ventas tenía un error de código que podía trabarla al abrirla. Ya está corregido y probado a fondo — de paso, confirmamos que el botón \"Usar en Pricing\" funciona bien: reemplaza las estimaciones a ojo de Pricing por lo que vendiste de verdad.",
    ],
  },
  {
    version: "1.14",
    fecha: "07/09/2026",
    items: [
      "Arriba de todo, al lado del título, ahora se ve con qué usuario estás conectado y tu rol (ej: \"/ Usuario: Juani (admin)\") — sin necesidad de abrir el menú de configuración para saberlo.",
      "El panel \"Correcciones de ventas\" ahora también muestra la hora exacta en la que se borró cada venta, no solo la fecha.",
    ],
  },
  {
    version: "1.13",
    fecha: "07/09/2026",
    items: [
      "Nuevo rol \"cajero\": puede cargar y corregir ventas con total libertad, pero no toca Materias primas, Platos, Costos fijos ni Pricing — ideal para quien atiende el mostrador día a día.",
      "Ahora SÍ se puede eliminar una venta cargada por error (antes no había forma) — al borrarla, se puede escribir el motivo (opcional, ej: \"cargué torta, era cookie\"), y queda un botón de \"Deshacer\" por si te arrepentís.",
      "Nuevo panel \"Correcciones de ventas\" (solo lo ve un admin) dentro de la pestaña Ventas: muestra cada venta que se borró, quién la borró, cuándo, y el motivo — para tener trazabilidad sin frenar el trabajo del día a día.",
    ],
  },
  {
    version: "1.12",
    fecha: "07/09/2026",
    items: [
      "Nuevo sistema de usuarios: ahora hay cuentas separadas con dos niveles — \"admin\" (puede cargar, editar y borrar todo) y \"visualizador\" (puede ver todo, pero no puede tocar nada). Antes había una sola contraseña compartida por todos.",
      "El menú de configuración ahora muestra con qué usuario estás conectado, y tiene la opción de \"Cerrar sesión\".",
      "Si entraste con un usuario visualizador, los botones de agregar/editar/borrar quedan ocultos en toda la app — podés navegar y mirar todo tranquilo, sin riesgo de tocar algo sin querer.",
    ],
  },
  {
    version: "1.11",
    fecha: "07/09/2026",
    items: [
      "Ventas ahora funciona por pedido, no por línea suelta: podés agregar varios platos a un mismo pedido (como una comanda) antes de confirmar la venta, viendo el total en vivo a medida que sumás ítems.",
      "Se agregó el medio de pago (Efectivo / Tarjeta / Transferencia) a cada venta.",
      "Nuevo: \"Ganancia real de este mes\" arriba de todo en Ventas — cruza lo que facturaste, el costo real de lo que vendiste, y tus costos fijos, para decirte si estás ganando plata de verdad este mes (no una estimación). También se ve desglosado por medio de pago.",
      "El historial de ventas ya no está bloqueado: ahora se ve de verdad, agrupado por pedido (\"Venta #1\", \"Venta #2\"...) con fecha, medio de pago y todos los ítems de cada uno.",
    ],
  },
  {
    version: "1.10",
    fecha: "06/09/2026",
    items: [
      "Historial de precios en Materias primas: ahora cada ingrediente tiene un botón de reloj que muestra cuánto varió el precio a lo largo del tiempo (ej. \"subió 40% en 3 meses\") — útil para saber cuándo conviene renegociar con un proveedor.",
      "Recordatorio de ajuste en Costos fijos: se puede cargar la fecha del próximo ajuste de un gasto (por ejemplo, un contrato de alquiler con ajuste trimestral), y la app avisa con un cartel cuando se acerca o ya venció.",
      "Acción masiva en Pricing: cuando hay platos que están perdiendo plata, aparece un cartel con un botón para actualizar el precio de todos esos platos de una sola vez, en vez de tener que ir uno por uno.",
    ],
  },
  {
    version: "1.9",
    fecha: "06/09/2026",
    items: [
      "Arreglo de contraste en modo noche: varios textos (títulos, precios, avisos) quedaban en un azul o verde que costaba leer sobre fondo oscuro. Ahora se aclaran solos en modo noche, sin cambiar nada en modo día.",
      "Simplificación en Pricing: el reparto de costos fijos ahora arranca directo en \"por unidades vendidas\" (la forma más simple). Si necesitás repartir de otra manera, hay un link \"Activar modo avanzado\" que muestra las otras 2 opciones — no molesta si no las necesitás.",
      "El dato de \"costo fijo por hora abierta\" en Costos fijos pasó de ser un cartel grande a una línea chica de referencia — sigue estando, pero ya no compite por atención con los datos más importantes.",
    ],
  },
  {
    version: "1.8",
    fecha: "06/09/2026",
    items: [
      "El ícono de la campanita ahora es una línea prolija, igual que el resto de los íconos (antes era un emoji suelto que desentonaba).",
      "Este mismo cartel de \"Novedades\" pasa a ser un historial de cambios de verdad: cada actualización va a quedar anotada acá, con fecha y número de versión, explicada en criollo.",
    ],
  },
  {
    version: "1.7",
    fecha: "06/09/2026",
    items: [
      "Header rediseñado: quedó mucho más chato y prolijo. El título va solo arriba, y los 3 botones (buscar, novedades, configuración) están agrupados juntos a la derecha, sin las cápsulas de color de antes.",
      "Los contadores de \"materias primas\" y \"productos\" se movieron a una franja más fina, debajo de las pestañas, con un estilo más discreto.",
      "Nuevo: botón de ojito para mostrar/ocultar la contraseña al ingresar a la app.",
      "Arreglo importante en Pricing: cuando todavía no cargaste \"unidades estimadas\" para ningún plato, antes aparecía \"$0,00\" en el reparto de costos fijos como si no hubiera nada que cubrir. Ahora avisa claramente que falta ese dato, en vez de mostrar un número que podía confundir.",
    ],
  },
  {
    version: "1.6",
    fecha: "06/09/2026",
    items: [
      "Buscador global: apretando el ícono de la lupa (o Ctrl+K en la compu) podés buscar cualquier plato o ingrediente y saltar directo a editarlo, sin importar en qué pestaña estés parado.",
      "En el celular, las tablas de Materias primas y Costos fijos ahora se ven como tarjetas apiladas en vez de una tabla apretada con scroll hacia el costado.",
      "Atajo en Ventas: si vas a registrar una venta y el plato todavía no existe, podés crearlo ahí mismo sin salir de la pantalla — queda seleccionado solo, listo para completar la venta.",
      "Arreglo: en el celular, la campanita y el menú de configuración se podían abrir pegados al borde izquierdo de la pantalla, inutilizables. Ahora siempre se abren en un lugar fijo y visible.",
    ],
  },
  {
    version: "1.5",
    fecha: "05/09/2026",
    items: [
      "Modo noche: hay un botón para cambiar entre pantalla clara y oscura, para cuidar la vista de noche.",
      "Los botones de \"descargar respaldo\", \"restaurar respaldo\" y \"restaurar ejemplo\" se agruparon en un menú con ícono de tuerca, para que el header no esté tan cargado.",
      "Cartel de \"primeros pasos\" que te guía qué cargar primero (ingredientes, platos, costos fijos, ventas) y se esconde solo cuando ya completaste todo.",
      "Todos los íconos de la app (lápiz, tacho de basura, etc.) pasaron de ser emojis a íconos de línea prolijos, iguales en cualquier celular o compu.",
      "Borrar algo (un ingrediente, un plato) ahora es directo, con un aviso de \"Deshacer\" por unos segundos, en vez de un cartel que te frena a confirmar cada vez.",
    ],
  },
  {
    version: "1.4",
    fecha: "04/09/2026",
    items: [
      "Pantalla de acceso con usuario y contraseña, para que no entre cualquiera que se tope con el link.",
    ],
  },
  {
    version: "1.3",
    fecha: "03/09/2026",
    items: [
      "Conexión a una base de datos real en la nube (Supabase): los datos ya no dependen de un solo navegador, se sincronizan.",
      "Las pestañas se reordenaron: Materias primas, Platos, Costos fijos y Pricing agrupadas por un lado; Ventas y Reportería por el otro.",
      "Los paneles de análisis (ranking 80/20, reportes) quedan en modo \"Próximamente\" hasta tener más datos reales cargados — mientras tanto, se puede seguir registrando información con normalidad.",
    ],
  },
  {
    version: "1.2",
    fecha: "01/09/2026",
    items: [
      "Nueva pestaña Ventas: registro rápido de lo que se vendió cada día.",
      "Panel de ranking 80/20 (qué platos generan el 80% de la facturación).",
    ],
  },
  {
    version: "1.1",
    fecha: "28/08/2026",
    items: [
      "Contadores de materias primas y productos, siempre visibles.",
      "Guía de \"objetivo y cómo usar cada sección\", plegable, en cada pestaña.",
      "Buscador y filtro por categoría en la sección Platos.",
      "Botón para Duplicar un plato — crea una copia lista para ajustar.",
      "Categorías editables: se pueden agregar categorías nuevas (de ingrediente, plato o costo fijo) sin tocar código.",
      "Botones de respaldo: descargar y restaurar todos los datos como archivo .json.",
    ],
  },
  {
    version: "1.0",
    fecha: "27/08/2026",
    items: [
      "Primera versión de la app: carga de materias primas, armado de platos con receta, costos fijos, cálculo de precio sugerido y reportería.",
    ],
  },
];

export default NOVEDADES;
