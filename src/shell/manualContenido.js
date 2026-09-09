import { BarChart3, Beef, Building2, Calculator, Info, Receipt, Settings, UtensilsCrossed } from "../components/icons.jsx";

const MANUAL = [
  {
    id: "intro",
    icon: Info,
    titulo: "¿Qué es esta app y por dónde arranco?",
    resumen: "Es una calculadora de costos y precios para tu negocio gastronómico: cargás lo que comprás, armás tus recetas, y la app te dice cuánto te cuesta cada plato y cuánto tendrías que cobrar.",
    detalle: [
      "La lógica de la app sigue un orden, como una cadena: primero cargás las Materias primas (los ingredientes con su precio). Después armás los Platos, eligiendo ingredientes de esa lista y en qué cantidad — ahí la app calcula sola cuánto te cuesta cada receta. Con los Costos fijos (alquiler, sueldos, servicios) cargados, la pestaña Pricing te dice cuánto cobrar para cubrir todo eso y ganar la plata que buscás. Ventas es donde registrás lo que realmente vendés, y Reportería te muestra el panorama completo del negocio.",
      "Si sos nuevo usando la app, fijate el cartel de \"Primeros pasos\" que aparece arriba de todo — te va marcando qué te falta cargar y desaparece solo cuando ya completaste lo básico.",
      "Cada pestaña tiene también su propia cajita celeste de ayuda arriba (\"Objetivo de esta sección\"), más corta que este manual — para un recordatorio rápido mientras trabajás, no hace falta venir hasta acá.",
    ],
    tips: [
      "Si te trabás en algo puntual, buscá la sección de este manual que corresponda — están ordenadas en el mismo orden que las pestañas.",
    ],
  },
  {
    id: "materias",
    icon: Beef,
    titulo: "Materias primas",
    resumen: "Acá vive cada ingrediente que usás, con su precio actualizado. Es la base de todo: si un ingrediente no está cargado acá, no podés usarlo en ninguna receta.",
    detalle: [
      "Por cada ingrediente cargás: nombre, categoría, la unidad en la que lo comprás (kilos, litros, unidad, docena), el precio de esa unidad, y opcionalmente el proveedor.",
      "La categoría y el buscador de arriba te sirven para encontrar rápido un ingrediente cuando la lista crece. Si necesitás una categoría que no está en la lista (por ejemplo \"Panificados\"), hay un botón \"+\" al lado del selector de categoría, tanto acá como en el resto de los modales — no hace falta pedirle a nadie que la agregue por código.",
      "Cuando un ingrediente no tiene precio cargado, aparece marcado en rojo. Esto es a propósito: la app prefiere avisarte \"che, falta este dato\" antes que inventar un número. Cualquier plato que use ese ingrediente te va a avisar \"costo incompleto\" hasta que le pongas el precio.",
      "El botón \"Actualizar precios\" (arriba a la derecha de la tabla) te deja cambiar los precios de toda una categoría de un saque — útil cuando sube todo por inflación y no querés entrar ingrediente por ingrediente.",
      "El ícono de reloj al lado de cada ingrediente te muestra el historial de precio: cuánto valía antes y cuánto varió con el tiempo. Se va armando solo, cada vez que cambiás un precio — no hace falta cargar nada aparte. Es útil para detectar cuándo un ingrediente subió mucho y conviene buscar otro proveedor.",
    ],
    tips: [
      "Ojo con la unidad al cargar el precio: si compraste manteca en paquetes de 200 gramos, pero elegiste \"kg\" como unidad al cargarla, la cuenta te va a dar un número gigante y sin sentido apenas la uses en una receta. La unidad que cargás acá tiene que coincidir con cómo pensás el precio (precio por kilo, precio por litro, etc.) — la app convierte sola después, cuando arma la receta con gramos o mililitros.",
      "El proveedor es opcional, pero si trabajás con varios, cargalo — te ayuda a acordarte a quién comprarle cada cosa cuando el precio sube y querés comparar.",
    ],
  },
  {
    id: "platos",
    icon: UtensilsCrossed,
    titulo: "Platos",
    resumen: "Acá armás cada receta de tu menú: qué ingredientes lleva, en qué cantidad, y a qué precio la vendés. La app calcula sola el costo y el margen de cada plato.",
    detalle: [
      "Lo más importante de esta sección es cargar bien cuántas porciones rinde la receta completa. Si tu receta de chocotorta rinde 10 porciones, poné 10 — de ahí sale el costo por porción, que es el número que después se usa en todos los demás cálculos.",
      "Elegís los ingredientes de un desplegable (tienen que estar cargados antes en Materias primas). Por cada uno, ponés la cantidad que usa la receta y la unidad — no hace falta que sea la misma unidad con la que compraste el ingrediente, la app convierte sola (por ejemplo, podés comprar la harina por kilo y usar 300 gramos en la receta, sin problema).",
      "El semáforo de cada plato (🟢🟡🔴) te dice de un vistazo si el margen está bien: verde arriba del 65%, amarillo entre 40% y 65%, rojo por debajo del 40%. Es una referencia rápida, después en Pricing podés ver el detalle completo de por qué.",
      "El botón de duplicar (ícono de dos hojas) te crea una copia de un plato ya armado — útil para variantes de una receta (por ejemplo, \"Milanesa napolitana\" y \"Milanesa a caballo\" comparten casi toda la base).",
    ],
    tips: [
      "Si tenés varios platos parecidos, armá uno bien completo primero y después duplicalo para los demás — ahorra bastante tiempo de carga.",
      "El buscador y el filtro por categoría de esta sección funcionan igual que en Materias primas.",
    ],
  },
  {
    id: "fijos",
    icon: Building2,
    titulo: "Costos fijos",
    resumen: "Todo lo que pagás en tu negocio aunque no vendas nada: alquiler, sueldos, servicios, seguro. Esto se reparte entre los platos en Pricing para calcular el costo real de cada uno.",
    detalle: [
      "Cargás cada gasto con su monto y la frecuencia real con la que lo pagás (mensual, trimestral, anual) — la app hace la cuenta sola para convertir todo a un valor mensual comparable, no hace falta que dividas nada a mano.",
      "El costo fijo es tu \"piso\": lo que tenés que cubrir sí o sí antes de pensar en ganancia. Por eso arriba de la tabla vas a ver cuánto necesitás facturar por día solo para cubrir esos gastos — si un día vendés menos que ese número, ese día estuviste perdiendo plata aunque hayas facturado algo.",
      "El gráfico de barras te muestra qué categoría de gasto pesa más sobre el total — típicamente sueldos y alquiler son los más grandes en un local gastronómico chico.",
      "Si un gasto tiene una fecha conocida de próximo aumento (por ejemplo, un alquiler con ajuste trimestral), podés cargarla en \"Próximo ajuste\" al editar ese gasto. La app te avisa con un cartel cuando falta poco o cuando ya se pasó la fecha, para que no te agarre desprevenido.",
    ],
    tips: [
      "Si tenés un gasto que se paga una vez al año (como una habilitación municipal), cargalo con frecuencia \"anual\" — no lo dividas vos mismo, la app ya lo hace.",
    ],
  },
  {
    id: "pricing",
    icon: Calculator,
    titulo: "Pricing",
    resumen: "El motor de precios: te dice cuánto tenés que cobrar por cada plato para llegar al margen que buscás — no cuánto te gustaría cobrar.",
    detalle: [
      "Primero configurás 3 cosas que aplican a toda la carta: el margen objetivo (65% es el estándar del rubro en Argentina), el IVA (21%, 10,5% o sin IVA si sos monotributista), y si los precios que cargás en Platos ya incluyen IVA o son netos.",
      "Después definís cómo repartir los costos fijos entre los platos. Por defecto reparte por unidades vendidas (cada porción absorbe lo mismo, sin importar si es cara o barata) — es la forma más simple de pensarlo, y para la mayoría de los negocios alcanza y sobra. Si tu caso es más particular, hay un \"modo avanzado\" que agrega 2 formas más de repartir (por facturación, o por costo de ingredientes) — no hace falta activarlo si no lo necesitás.",
      "Para que el reparto de costos fijos funcione, tenés que cargar cuántas unidades estimás vender de cada plato por mes (en el cuadro de \"Unidades estimadas\"). Si no cargaste ese número para ningún plato todavía, la app te avisa con un cartel amarillo en vez de mostrarte un \"$0,00\" que podría confundirte — ese $0 no significa que no tengas costos que cubrir, significa que falta ese dato.",
      "La calculadora de precio sugerido te muestra, plato por plato, el costo real (ingredientes + parte de los costos fijos), el precio mínimo para no perder plata, y el precio sugerido a distintos márgenes. Ahí también ves un veredicto directo: si estás cobrando de más, de menos, en zona bien, o perdiendo plata con ese plato.",
      "Si hay platos que están perdiendo plata, arriba de todo aparece un cartel con un botón para actualizar el precio de todos esos platos de una sola vez, al margen objetivo que configuraste — así no tenés que ir plato por plato a mano.",
    ],
    tips: [
      "La fórmula del precio sugerido es costo dividido por (1 menos el margen), no costo por (1 más el margen) — son dos cuentas distintas, y la segunda (la trampa común de muchos excels caseros) te da un margen real más bajo del que pensás que estás cobrando.",
      "Si tenés ventas reales cargadas en la pestaña Ventas, usá el botón \"Usar en Pricing\" de ahí — reemplaza tus estimaciones a ojo por lo que de verdad vendiste, y el reparto de costos fijos se vuelve mucho más preciso.",
    ],
  },
  {
    id: "ventas",
    icon: Receipt,
    titulo: "Ventas",
    resumen: "Registrá lo que efectivamente vendiste, agrupado por pedido — como una comanda, no plato por plato suelto. Con estos datos reales sabés cuánto ganaste de verdad este mes.",
    detalle: [
      "Arriba de todo tenés el resumen de \"Ganancia real de este mes\": facturación, costo real de lo que vendiste, y la ganancia o pérdida final (facturación menos costo de lo vendido menos costos fijos). Es el número que responde \"¿gané plata este mes o no?\" — se actualiza solo con cada venta que cargás, y también se ve desglosado por medio de pago.",
      "Para registrar una venta: elegís un plato y una cantidad, y le das \"Agregar al pedido\" — podés seguir sumando ítems distintos al mismo pedido, viendo el total en vivo, antes de confirmar nada. Si te equivocaste, podés quitar un ítem del pedido con la cruz al lado de cada línea.",
      "Si el plato que vendiste todavía no existe en tu carta, no hace falta que salgas de esta pantalla: elegís \"Agregar plato nuevo\" en el desplegable, lo cargás, y queda seleccionado solo para agregarlo al pedido.",
      "Elegís el medio de pago (Efectivo, Tarjeta o Transferencia) y le das \"Confirmar venta\" — ahí se guarda todo el pedido junto, con fecha, medio de pago, y todos sus ítems.",
      "Más abajo, el \"Historial de ventas\" muestra cada pedido confirmado (\"Venta #1\", \"Venta #2\"...) con sus ítems y el total, más reciente primero. El panel de ranking 80/20 sigue en modo \"Próximamente\" hasta tener suficientes días de ventas cargadas — mientras tanto, esos datos ya se están guardando igual.",
    ],
    tips: [
      "Cuantos más días seguidos cargues, más confiable se vuelve el análisis cuando se active el 80/20 — vale la pena tomarlo como una costumbre diaria, no solo cuando te acordás.",
      "El número \"Venta #N\" es solo para identificar el pedido acá adentro de la app — no es un comprobante fiscal ni reemplaza una factura.",
      "Si te equivocaste al cargar una venta (admin o cajero), la podés borrar con el ícono de tacho en la tarjeta del pedido — te va a pedir un motivo opcional antes de confirmar. Queda un registro de esa corrección (quién, cuándo, por qué) visible solo para las cuentas admin, en el panel \"Correcciones de ventas\".",
    ],
  },
  {
    id: "reportes",
    icon: BarChart3,
    titulo: "Reportería",
    resumen: "El resumen ejecutivo del negocio: qué platos son rentables, cuáles hay que revisar ya mismo, y cómo estás parado contra el promedio del mercado gastronómico argentino.",
    detalle: [
      "El panel de arriba (resumen ejecutivo) siempre está visible: cuántos platos tenés, cuántos están en semáforo verde/amarillo/rojo, tu costo fijo mensual, y el margen promedio de toda la carta.",
      "El resto de los paneles (ranking de rentabilidad, platos problemáticos, materias primas más costosas, comparativa con el mercado, evolución de costos) están en modo \"Próximamente\" por la misma razón que en Ventas: se activan con más datos reales cargados, para no mostrarte un análisis que todavía no es confiable.",
    ],
    tips: [],
  },
  {
    id: "general",
    icon: Settings,
    titulo: "Funciones generales de la app",
    resumen: "Buscador global, modo noche, respaldos, y otras herramientas que no viven en una pestaña específica sino que están disponibles en cualquier lugar de la app.",
    detalle: [
      "Buscador (ícono de lupa, o Ctrl+K en la compu): busca cualquier plato o ingrediente por nombre y te lleva directo a editarlo, sin importar en qué pestaña estés parado.",
      "Campanita: ahí vive el historial de cambios de la app — cada actualización que se hace queda anotada con fecha y versión, explicada en criollo, para que sepas qué cambió sin que nadie te tenga que avisar aparte.",
      "Menú de configuración (ícono de tuerca): desde ahí podés cambiar entre modo día y modo noche, descargar un respaldo de todos tus datos como archivo, restaurar un respaldo que hayas descargado antes, o volver a los datos de ejemplo originales (esto último borra lo que hayas cargado, así que te lo confirma antes de hacerlo).",
      "Guardado automático: no hay botón de \"guardar\" en ningún lado porque no hace falta — cada cambio se guarda solo. Arriba vas a ver un cartel chico que te dice si se está guardando en la nube (sincronizado entre dispositivos) o solo en este aparato.",
      "En el celular, las tablas largas (como Materias primas o Costos fijos) se ven como tarjetas apiladas en vez de una tabla apretada — mismos datos, más fácil de leer con el dedo.",
      "Usuarios y roles: hay tres tipos de cuenta. \"admin\" puede cargar, editar y borrar de todo, incluido el catálogo (materias primas, platos, costos fijos, pricing). \"cajero\" puede cargar y corregir ventas con total libertad, pero no toca el resto del catálogo — pensado para quien atiende el día a día. \"visualizador\" puede ver absolutamente todo pero no toca nada — ideal para compartir con alguien que solo necesita mirar u opinar. Se ve en el menú de configuración con qué usuario estás conectado, y ahí mismo está \"Cerrar sesión\".",
    ],
    tips: [
      "El respaldo (.json) es tu seguro: bajalo de vez en cuando, sobre todo antes de hacer un cambio grande. Si algo sale mal, lo restaurás y volvés exactamente a como estaba.",
      "Cuando borrás algo (un ingrediente, un plato, un costo fijo), no te va a aparecer un cartel que te frene a confirmar — se borra directo, pero te queda un botón \"Deshacer\" abajo a la derecha por unos segundos, por si te arrepentís.",
    ],
  },
];


export default MANUAL;
