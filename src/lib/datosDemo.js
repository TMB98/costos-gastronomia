import { CAT_ING, CAT_PLATO, CAT_COSTO_DEFAULT } from "../config/constants.js";
import { uid } from "./formato.js";

const HIST_F = [
  { fecha: "2026-02-01", f: 0.78 },
  { fecha: "2026-04-01", f: 0.86 },
  { fecha: "2026-06-01", f: 0.93 },
  { fecha: "2026-08-01", f: 1 },
];
const histDe = (precio) =>
  precio == null ? [] : HIST_F.map((h) => ({ fecha: h.fecha, precio: Math.round(precio * h.f) }));

const ING = (id, nombre, categoria, unidad, precio, proveedor) => ({
  id, nombre, categoria, unidad, precio, proveedor,
  fechaPrecio: precio == null ? null : "2026-08-01",
  historial: histDe(precio),
});

function datosDemo() {
  const ingredientes = [
    ING("i01", "Harina 000", "Secos", "kg", 1200, "Molino Cañuelas"),
    ING("i02", "Azúcar", "Secos", "kg", 1500, "Distribuidora Sur"),
    ING("i03", "Huevos", "Otros", "docena", 4500, "Granja Quilmes"),
    ING("i04", "Manteca", "Lácteos", "kg", 12000, "La Serenísima"),
    ING("i05", "Leche entera", "Lácteos", "litro", 1600, "La Serenísima"),
    ING("i06", "Crema de leche", "Lácteos", "litro", 5200, "La Serenísima"),
    ING("i07", "Cacao amargo", "Secos", "kg", 14000, ""),
    ING("i08", "Galletitas de chocolate", "Secos", "kg", 8500, "Distribuidora Sur"),
    ING("i09", "Queso crema", "Lácteos", "kg", 9800, "La Serenísima"),
    ING("i10", "Dulce de leche repostero", "Otros", "kg", 6500, "Distribuidora Sur"),
    ING("i11", "Tomate", "Verduras", "kg", 1800, "Mercado Central"),
    ING("i12", "Cebolla", "Verduras", "kg", 1200, "Mercado Central"),
    ING("i13", "Papa", "Verduras", "kg", 900, "Mercado Central"),
    ING("i14", "Pechuga de pollo", "Carnes", "kg", 6500, "Frigorífico Berazategui"),
    ING("i15", "Carne molida (roast beef)", "Carnes", "kg", 8500, "Frigorífico Berazategui"),
    ING("i16", "Nalga para milanesa", "Carnes", "kg", 11000, "Frigorífico Berazategui"),
    ING("i17", "Aceite de girasol", "Secos", "litro", 2500, ""),
    ING("i18", "Sal fina", "Secos", "kg", 700, ""),
    ING("i19", "Levadura fresca", "Secos", "kg", 5000, ""),
    ING("i20", "Tapas de empanada", "Secos", "docena", 2800, "La Salteña"),
    ING("i21", "Queso muzzarella", "Lácteos", "kg", 9500, "Distribuidora Sur"),
    ING("i22", "Jamón cocido", "Carnes", "kg", 12000, "Distribuidora Sur"),
    ING("i23", "Pan rallado", "Secos", "kg", 2200, ""),
    ING("i24", "Condimento provenzal", "Secos", "kg", 6800, ""),
    ING("i25", "Vino tinto de la casa", "Bebidas", "litro", null, "Bodega Norte"),
  ];

  const platos = [
    {
      id: "p1", nombre: "Chocotorta", categoria: "Postre",
      descripcion: "Clásica, con dulce de leche repostero y queso crema.",
      foto: "", porciones: 10, tiempo: 30,
      notas: "1. Batir queso crema con dulce de leche.\n2. Mojar galletitas en leche.\n3. Armar capas y llevar 4 h a heladera.",
      precioVenta: 4500,
      items: [
        { id: uid("l"), ingId: "i08", cantidad: 0.6, unidad: "kg" },
        { id: uid("l"), ingId: "i10", cantidad: 0.7, unidad: "kg" },
        { id: uid("l"), ingId: "i09", cantidad: 0.6, unidad: "kg" },
        { id: uid("l"), ingId: "i05", cantidad: 200, unidad: "ml" },
      ],
    },
    {
      id: "p2", nombre: "Empanadas de carne (docena)", categoria: "Principal",
      descripcion: "Carne cortada a cuchillo, horneadas. Se venden por unidad.",
      foto: "", porciones: 12, tiempo: 60,
      notas: "Rehogar cebolla, sellar la carne, dejar enfriar el relleno antes de armar.",
      precioVenta: 1800,
      items: [
        { id: uid("l"), ingId: "i20", cantidad: 12, unidad: "unidad" },
        { id: uid("l"), ingId: "i15", cantidad: 0.9, unidad: "kg" },
        { id: uid("l"), ingId: "i12", cantidad: 0.5, unidad: "kg" },
        { id: uid("l"), ingId: "i03", cantidad: 2, unidad: "unidad" },
        { id: uid("l"), ingId: "i17", cantidad: 100, unidad: "ml" },
        { id: uid("l"), ingId: "i18", cantidad: 10, unidad: "g" },
        { id: uid("l"), ingId: "i24", cantidad: 20, unidad: "g" },
      ],
    },
    {
      id: "p3", nombre: "Milanesa napolitana con papas fritas", categoria: "Principal",
      descripcion: "Porción individual, nalga rebozada con muzzarella y jamón.",
      foto: "", porciones: 1, tiempo: 25,
      notas: "Freír la milanesa, gratinar con salsa, jamón y muzzarella. Papas bastón aparte.",
      precioVenta: 12000,
      items: [
        { id: uid("l"), ingId: "i16", cantidad: 250, unidad: "g" },
        { id: uid("l"), ingId: "i03", cantidad: 1, unidad: "unidad" },
        { id: uid("l"), ingId: "i23", cantidad: 80, unidad: "g" },
        { id: uid("l"), ingId: "i17", cantidad: 150, unidad: "ml" },
        { id: uid("l"), ingId: "i11", cantidad: 100, unidad: "g" },
        { id: uid("l"), ingId: "i21", cantidad: 80, unidad: "g" },
        { id: uid("l"), ingId: "i22", cantidad: 40, unidad: "g" },
        { id: uid("l"), ingId: "i13", cantidad: 350, unidad: "g" },
        { id: uid("l"), ingId: "i18", cantidad: 5, unidad: "g" },
      ],
    },
    {
      id: "p4", nombre: "Menú del día", categoria: "Menú del día",
      descripcion: "Entrada + principal (pollo con guarnición) + postre casero.",
      foto: "", porciones: 1, tiempo: 20,
      notas: "Rota según el día. Costo calculado sobre la versión de pollo al horno.",
      precioVenta: 9000,
      items: [
        { id: uid("l"), ingId: "i14", cantidad: 200, unidad: "g" },
        { id: uid("l"), ingId: "i13", cantidad: 300, unidad: "g" },
        { id: uid("l"), ingId: "i12", cantidad: 50, unidad: "g" },
        { id: uid("l"), ingId: "i17", cantidad: 50, unidad: "ml" },
        { id: uid("l"), ingId: "i01", cantidad: 50, unidad: "g" },
        { id: uid("l"), ingId: "i10", cantidad: 50, unidad: "g" },
        { id: uid("l"), ingId: "i05", cantidad: 100, unidad: "ml" },
        { id: uid("l"), ingId: "i02", cantidad: 30, unidad: "g" },
      ],
    },
    {
      id: "p5", nombre: "Medialunas de manteca (docena)", categoria: "Otro",
      descripcion: "Docena de medialunas. Se venden por unidad en el mostrador.",
      foto: "", porciones: 12, tiempo: 180,
      notas: "Masa con 3 vueltas de empaste. Levado lento 2 h. Almíbar al salir del horno.",
      precioVenta: 900,
      items: [
        { id: uid("l"), ingId: "i01", cantidad: 1, unidad: "kg" },
        { id: uid("l"), ingId: "i04", cantidad: 350, unidad: "g" },
        { id: uid("l"), ingId: "i02", cantidad: 250, unidad: "g" },
        { id: uid("l"), ingId: "i19", cantidad: 40, unidad: "g" },
        { id: uid("l"), ingId: "i03", cantidad: 2, unidad: "unidad" },
        { id: uid("l"), ingId: "i18", cantidad: 15, unidad: "g" },
        { id: uid("l"), ingId: "i05", cantidad: 250, unidad: "ml" },
      ],
    },
  ];

  const costosFijos = [
    { id: "c1", nombre: "Alquiler del local", categoria: "Alquiler", monto: 1300000, frecuencia: "mensual", notas: "Contrato con ajuste ICL trimestral." },
    { id: "c2", nombre: "Luz (Edesur)", categoria: "Servicios", monto: 180000, frecuencia: "mensual", notas: "" },
    { id: "c3", nombre: "Gas", categoria: "Servicios", monto: 60000, frecuencia: "mensual", notas: "" },
    { id: "c4", nombre: "Internet + teléfono", categoria: "Servicios", monto: 45000, frecuencia: "mensual", notas: "" },
    { id: "c5", nombre: "Sueldo cocinero", categoria: "Personal / sueldos", monto: 1400000, frecuencia: "mensual", notas: "Bruto + cargas estimadas." },
    { id: "c6", nombre: "Sueldo ayudante de cocina", categoria: "Personal / sueldos", monto: 1100000, frecuencia: "mensual", notas: "" },
    { id: "c7", nombre: "Sueldo cajero / salón", categoria: "Personal / sueldos", monto: 950000, frecuencia: "mensual", notas: "" },
    { id: "c8", nombre: "Seguro integral del comercio", categoria: "Seguro", monto: 55000, frecuencia: "mensual", notas: "" },
    { id: "c9", nombre: "Comisión fija apps de delivery", categoria: "Marketing", monto: 220000, frecuencia: "mensual", notas: "Estimado sobre volumen promedio." },
    { id: "c10", nombre: "Habilitación municipal", categoria: "Impuestos y tasas", monto: 480000, frecuencia: "anual", notas: "Se prorratea a $40.000 por mes." },
  ];

  const ventas = (() => {
    // Genera ~7 días de ventas de ejemplo, con distribución realista
    // (algunos platos venden mucho más que otros, para que el 80/20 se note).
    const hoy = new Date("2026-09-03");
    const patron = [
      { platoId: "p3", precio: 12000, costo: 3450, base: 14 }, // milanesa: la estrella
      { platoId: "p2", precio: 1800, costo: 620, base: 30 },   // empanadas: alto volumen
      { platoId: "p4", precio: 9000, costo: 3100, base: 8 },   // menu del dia
      { platoId: "p1", precio: 4500, costo: 1180, base: 3 },   // chocotorta: poco volumen
      { platoId: "p5", precio: 900, costo: 210, base: 10 },    // medialunas
    ];
    const nombres = { p1: "Chocotorta", p2: "Empanadas de carne (docena)", p3: "Milanesa napolitana con papas fritas", p4: "Menú del día", p5: "Medialunas de manteca (docena)" };
    const out = [];
    for (let d = 6; d >= 0; d--) {
      const fecha = new Date(hoy); fecha.setDate(hoy.getDate() - d);
      const fechaStr = fecha.toISOString().slice(0, 10);
      patron.forEach((p) => {
        const variacion = 0.7 + Math.random() * 0.6;
        const cantidad = Math.max(1, Math.round(p.base * variacion));
        out.push({
          id: uid("v"), fecha: fechaStr, platoId: p.platoId, platoNombre: nombres[p.platoId],
          cantidad, precioUnitario: p.precio, costoUnitario: p.costo, notas: "",
        });
      });
    }
    return out;
  })();

  return {
    ingredientes,
    platos,
    costosFijos,
    ventas,
    config: {
      margenObjetivo: 65,
      iva: 21,
      preciosIncluyenIVA: true,
      modoProrrateo: "unidades",
      horasPorDia: 10,
      diasPorMes: 30,
      categoriasCostos: [...CAT_COSTO_DEFAULT],
      categoriasIngredientes: [...CAT_ING],
      categoriasPlatos: [...CAT_PLATO],
      ayudaColapsada: {},
      unidades: { p1: 200, p2: 1500, p3: 300, p4: 600, p5: 1200 },
      benchmarks: [
        { id: "b1", nombre: "Margen bruto sobre ventas", min: 60, max: 70, mejorEs: "alto" },
        { id: "b2", nombre: "Food cost (ingredientes / venta)", min: 28, max: 35, mejorEs: "bajo" },
        { id: "b3", nombre: "Costo laboral sobre ventas", min: 25, max: 30, mejorEs: "bajo" },
        { id: "b4", nombre: "Alquiler sobre ventas", min: 8, max: 12, mejorEs: "bajo" },
      ],
    },
  };
}

export default datosDemo;
