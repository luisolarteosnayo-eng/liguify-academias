// =====================================================================
// Gestión de Academias — shell navegable con datos MOCK
// Alineado a ESPECIFICACION_FUNCIONAL.md (multi-tenant, Sede/Track/Tutor/Jugador)
// Sin backend todavía; Supabase se cablea después.
// =====================================================================

// ---------- Utilidades ----------
const S = (n) => 'S/ ' + Number(n || 0).toFixed(2);
const el = (id) => document.getElementById(id);
const nom = (p) => `${p.nombre} ${p.apellido}`;
const ceil = Math.ceil;
const PERIODO = '2026-07';
const anio = (fecha) => new Date(fecha).getFullYear();
let _seq = 100;
// Conectado a Supabase: ids UUID reales · demo: ids legibles (j101, c102...)
const uid = (p) => (window.AcademiasDB && window.AcademiasDB.on) ? crypto.randomUUID() : `${p}${_seq++}`;
// Años de categoría contenidos en el nombre del track (ej "2020 - 2019" -> [2020,2019])
const aniosTrack = (t) => (t.nombre_track.match(/\b(19|20)\d{2}\b/g) || []).map(Number);

// ---------- Datos mock (ejemplo San Miguel de la especificación) ----------
const DB = {
  academia: {
    id: 'ac1', nombre_academia: 'TALES', slug_url: 'tales',
    email: 'luisolarteosnayo@gmail.com', telefono: '989229154',
    direccion1: '', direccion2: '', ciudad: 'Lima', pais: 'Perú', codigo_postal: '',
    ruc: '', anio_fundacion: '', mision: '',
    whatsapp: '', instagram: '', facebook: '', tiktok: '', youtube: '', twitter: '',
    google_maps_url: '', logo_url: null,
    color_primario: '#4f46e5', color_secundario: '#f59e0b', plan_suscripcion: 'elite',
  },

  sedes: [
    { id: 's1', nombre_sede: 'San Miguel', direccion1: 'Araoz Pinto', ciudad: 'Lima', pais: 'Perú', telefono_coordinador: '987111222' },
    { id: 's2', nombre_sede: 'Surco',      direccion1: 'Futbol Plaza', ciudad: 'Lima', pais: 'Perú', telefono_coordinador: '987333444' },
  ],

  staff: [
    { id: 'st1', nombre: 'Carlos', apellido: 'Ramírez', rol: 'profesor', sede_id: 's1', modalidad_pago: 'sueldo_fijo', sueldo_fijo: 1800 },
    { id: 'st2', nombre: 'Lucía',  apellido: 'Fernández', rol: 'profesor', sede_id: 's1', modalidad_pago: 'por_horas', tarifa_hora: 40 },
    { id: 'st3', nombre: 'Diego',  apellido: 'Salas', rol: 'coordinador', sede_id: 's2' },
  ],

  tracks: [
    { id: 't1', sede_id: 's1', linea_negocio: 'academia', nombre_track: '2015 - 2016', capacidad_maxima: 20, mensualidad_sugerida: 220, clases_mensuales: 8, costo_mensual_cancha: 500, costo_mensual_profesores: 600, dias_horario: 'Lun/Mié 17:00' },
    { id: 't2', sede_id: 's1', linea_negocio: 'arqueros', nombre_track: 'ARQUEROS 5pm', capacidad_maxima: 20, mensualidad_sugerida: 250, clases_mensuales: 8, costo_mensual_cancha: 600, costo_mensual_profesores: 700, dias_horario: 'Mar/Jue 17:00' },
    { id: 't3', sede_id: 's2', linea_negocio: 'alto_rendimiento', nombre_track: '2016', capacidad_maxima: 18, mensualidad_sugerida: 200, clases_mensuales: 8, costo_mensual_cancha: 450, costo_mensual_profesores: 550, dias_horario: 'Sáb 10:00' },
  ],

  // cuerpo técnico M2M
  trackStaff: { t1: ['st1'], t2: ['st2'], t3: ['st1'] },

  tutores: [
    { id: 'tu1', dni_tutor: '40111222', telefono_celular: '987654321', email_tutor: 'rosa@mail.com', perfil_reclamado: true },
    { id: 'tu2', dni_tutor: '40333444', telefono_celular: '912345678', email_tutor: null,             perfil_reclamado: false },
    { id: 'tu3', dni_tutor: '40555666', telefono_celular: '900111000', email_tutor: null,             perfil_reclamado: false },
    { id: 'tu4', dni_tutor: '40777888', telefono_celular: '955000111', email_tutor: null,             perfil_reclamado: false },
    { id: 'tu5', dni_tutor: '40999000', telefono_celular: '966222333', email_tutor: null,             perfil_reclamado: false },
  ],

  jugadores: [
    { id: 'j1', tutor_id: 'tu1', sede_id: 's1', nombre: 'Mateo',  apellido: 'Quispe',  fecha_nacimiento: '2015-03-10', fecha_registro: '2026-07-01', posicion_juego: 'Delantero', numero_camiseta: 9,  talla_camiseta: 'S', talla_short: 'S', estado_alumno: 'activo',
              atributos: { velocidad: 78, potencia: 65, agilidad: 82, tecnica: 74, pase: 70, defensa: 55 } },
    { id: 'j2', tutor_id: 'tu1', sede_id: 's1', nombre: 'Sofía',  apellido: 'Quispe',  fecha_nacimiento: '2016-07-22', fecha_registro: '2026-07-01', posicion_juego: 'Mediocampista', numero_camiseta: 8, talla_camiseta: 'S', talla_short: 'S', estado_alumno: 'activo', atributos: null },
    { id: 'j3', tutor_id: 'tu2', sede_id: 's1', nombre: 'Diego',  apellido: 'Mendoza', fecha_nacimiento: '2015-11-05', fecha_registro: '2026-07-02', posicion_juego: 'Arquero',   numero_camiseta: 1,  talla_camiseta: 'M', talla_short: 'M', estado_alumno: 'activo', atributos: null },
    { id: 'j4', tutor_id: 'tu2', sede_id: 's1', nombre: 'Valeria',apellido: 'Mendoza', fecha_nacimiento: '2016-01-18', fecha_registro: '2026-06-28', posicion_juego: 'Defensa',   numero_camiseta: 4,  talla_camiseta: 'S', talla_short: 'S', estado_alumno: 'activo', atributos: null },
    { id: 'j5', tutor_id: 'tu3', sede_id: 's2', nombre: 'Adriano',apellido: 'Rojas',   fecha_nacimiento: '2016-05-30', fecha_registro: '2026-06-15', posicion_juego: 'Delantero', numero_camiseta: 7,  talla_camiseta: 'M', talla_short: 'M', estado_alumno: 'activo', atributos: null },
    { id: 'j6', tutor_id: 'tu4', sede_id: 's2', nombre: 'Camila', apellido: 'Torres',  fecha_nacimiento: '2015-09-12', fecha_registro: '2026-06-10', estado_alumno: 'activo', atributos: null },
    { id: 'j7', tutor_id: 'tu4', sede_id: 's1', nombre: 'Bruno',  apellido: 'Torres',  fecha_nacimiento: '2016-02-03', fecha_registro: '2026-06-20', estado_alumno: 'activo', atributos: null },
    { id: 'j8', tutor_id: 'tu5', sede_id: 's2', nombre: 'Lucas',  apellido: 'Ríos',    fecha_nacimiento: '2015-04-25', fecha_registro: '2026-07-03', estado_alumno: 'activo', atributos: null },
    { id: 'j9', tutor_id: 'tu5', sede_id: 's1', nombre: 'Renata', apellido: 'Ríos',    fecha_nacimiento: '2016-06-01', fecha_registro: '2026-07-04', estado_alumno: 'activo', atributos: null },
    { id: 'j10', tutor_id: 'tu3', sede_id: 's2', nombre: 'Thiago', apellido: 'Rojas',  fecha_nacimiento: '2015-12-20', fecha_registro: '2026-06-25', estado_alumno: 'activo', atributos: null },
    { id: 'j11', tutor_id: 'tu1', sede_id: 's1', nombre: 'Fabián', apellido: 'Quispe', fecha_nacimiento: '2016-08-14', fecha_registro: '2026-06-08', estado_alumno: 'activo', atributos: null },
    { id: 'j12', tutor_id: 'tu5', sede_id: 's2', nombre: 'Antonella', apellido: 'Ríos', fecha_nacimiento: '2015-07-07', fecha_registro: '2026-07-02', estado_alumno: 'activo', atributos: null },
  ],

  // Inscripción jugador<->track (costo personalizado = beca; null usa el sugerido)
  // Mateo (j1) está en DOS tracks de San Miguel: "2015-2016" y "ARQUEROS 5pm".
  // Cada inscripción activa es la DEFINICIÓN de un CR. ultima_fecha_corte = fin del último ciclo generado.
  // ciclo_dia = ciclo de pago asignado (para la generación masiva por ciclo).
  inscripciones: [
    { id: 'i1', jugador_id: 'j1', track_id: 't1', costo_mensual_personalizado: null, activo: true, fecha_inscripcion: '2026-04-07', ultima_fecha_corte: '2026-07-31', ciclo_dia: 1 },
    { id: 'i1b', jugador_id: 'j1', track_id: 't2', costo_mensual_personalizado: null, activo: true, fecha_inscripcion: '2026-04-07', ultima_fecha_corte: '2026-07-31', ciclo_dia: 1 },
    { id: 'i2', jugador_id: 'j2', track_id: 't1', costo_mensual_personalizado: 80,   activo: true, fecha_inscripcion: '2026-04-07', ultima_fecha_corte: '2026-07-31', ciclo_dia: 1 }, // media beca
    { id: 'i3', jugador_id: 'j3', track_id: 't1', costo_mensual_personalizado: null, activo: true, fecha_inscripcion: '2026-04-08', ultima_fecha_corte: '2026-07-31', ciclo_dia: 1 },
    { id: 'i4', jugador_id: 'j4', track_id: 't2', costo_mensual_personalizado: null, activo: true, fecha_inscripcion: '2026-04-08', ultima_fecha_corte: null, ciclo_dia: null },
    { id: 'i5', jugador_id: 'j5', track_id: 't3', costo_mensual_personalizado: null, activo: true, fecha_inscripcion: '2026-05-02', ultima_fecha_corte: '2026-07-31', ciclo_dia: 1 },
  ],

  // tipo: 'CR' (recurrente, mensualidad de track) | 'CNR' (no recurrente, eventual)
  // concepto = nombre del cargo; descripcion = detalle (SIN el nombre del alumno)
  cargos: [
    { id: 'c1',  tutor_id: 'tu1', jugador_id: 'j1', inscripcion_id: 'i1',  tipo: 'CR', origen: 'proceso', concepto: '2015 - 2016', descripcion: 'Del 01/07/2026 al 31/07/2026', ciclo_inicio: '2026-07-01', ciclo_fin: '2026-07-31', fecha_vencimiento: '2026-07-05', periodo: PERIODO, monto: 220, pagado_monto: 0,  estado: 'por_pagar' },
    { id: 'c1b', tutor_id: 'tu1', jugador_id: 'j1', inscripcion_id: 'i1b', tipo: 'CR', origen: 'proceso', concepto: 'ARQUEROS 5pm', descripcion: 'Del 01/07/2026 al 31/07/2026', ciclo_inicio: '2026-07-01', ciclo_fin: '2026-07-31', fecha_vencimiento: '2026-07-05', periodo: PERIODO, monto: 250, pagado_monto: 0,  estado: 'por_pagar' },
    { id: 'c2',  tutor_id: 'tu1', jugador_id: 'j2', inscripcion_id: 'i2',  tipo: 'CR', origen: 'proceso', concepto: '2015 - 2016', descripcion: 'Del 01/07/2026 al 31/07/2026', ciclo_inicio: '2026-07-01', ciclo_fin: '2026-07-31', fecha_vencimiento: '2026-07-05', periodo: PERIODO, monto: 80,  pagado_monto: 80, estado: 'pagado' },
    { id: 'c3',  tutor_id: 'tu2', jugador_id: 'j3', inscripcion_id: 'i3',  tipo: 'CR', origen: 'proceso', concepto: '2015 - 2016', descripcion: 'Del 01/07/2026 al 31/07/2026', ciclo_inicio: '2026-07-01', ciclo_fin: '2026-07-31', fecha_vencimiento: '2026-07-05', periodo: PERIODO, monto: 220, pagado_monto: 220, estado: 'pagado' },
    { id: 'c4',  tutor_id: 'tu2', jugador_id: 'j4', tipo: 'CNR', concepto: 'Matrícula anual', descripcion: '', fecha_vencimiento: '2026-06-15', periodo: PERIODO, monto: 150, pagado_monto: 0,  estado: 'por_pagar' },
    { id: 'c5',  tutor_id: 'tu3', jugador_id: 'j5', inscripcion_id: 'i5',  tipo: 'CR', origen: 'proceso', concepto: '2016', descripcion: 'Del 01/07/2026 al 31/07/2026', ciclo_inicio: '2026-07-01', ciclo_fin: '2026-07-31', fecha_vencimiento: '2026-07-05', periodo: PERIODO, monto: 200, pagado_monto: 0,  estado: 'por_pagar' },
    { id: 'c6',  tutor_id: 'tu1', jugador_id: 'j1', tipo: 'CNR', concepto: 'Uniforme', descripcion: '', periodo: PERIODO, monto: 120, pagado_monto: 0,  estado: 'por_pagar' },
  ],

  // Documentos de pago: cada pago cubre uno o más cargos (CR/CNR) y los marca Pagados.
  // detalle.cat = categoría de ingreso (Mensualidades para CR; nombre del concepto para CNR)
  pagos: [
    { id: 'pg1', tutor_id: 'tu1', jugador_id: 'j2', sede_id: 's1', fecha: '2026-07-01', medio: 'Yape', num_operacion: '00012345', voucher_url: 'mock.jpg', total: 80, estado: 'aprobado',
      detalle: [{ cargo_id: 'c2', concepto: '2015 - 2016 Del 01/07/2026 al 31/07/2026', cat: 'Mensualidades', tipo: 'CR', monto: 80 }] },
    { id: 'pg2', tutor_id: 'tu2', jugador_id: 'j3', sede_id: 's1', fecha: '2026-07-02', medio: 'Efectivo', num_operacion: '', voucher_url: 'mock.jpg', total: 220, estado: 'pendiente',
      detalle: [{ cargo_id: 'c3', concepto: '2015 - 2016 Del 01/07/2026 al 31/07/2026', cat: 'Mensualidades', tipo: 'CR', monto: 220 }] },
    { id: 'pg3', tutor_id: 'tu3', jugador_id: 'j5', sede_id: 's2', fecha: '2026-07-03', medio: 'Transferencia', num_operacion: 'OP-778', voucher_url: 'mock.jpg', total: 300, estado: 'aprobado',
      detalle: [{ cargo_id: 'h2', concepto: 'Mensualidad', cat: 'Mensualidades', tipo: 'CR', monto: 200 }, { cargo_id: 'h3', concepto: 'Inscripción torneo', cat: 'Inscripción torneo', tipo: 'CNR', monto: 100 }] },
    { id: 'pg4', tutor_id: 'tu2', jugador_id: 'j3', sede_id: 's1', fecha: '2026-06-28', medio: 'Yape', num_operacion: 'OP-551', voucher_url: 'mock.jpg', total: 220, estado: 'aprobado',
      detalle: [{ cargo_id: 'h4', concepto: 'Mensualidad', cat: 'Mensualidades', tipo: 'CR', monto: 220 }] },
    { id: 'pg5', tutor_id: 'tu2', jugador_id: 'j3', sede_id: 's1', fecha: '2026-06-20', medio: 'Efectivo', num_operacion: '', voucher_url: null, total: 150, estado: 'aprobado',
      detalle: [{ cargo_id: 'h5', concepto: 'Matrícula anual', cat: 'Matrícula anual', tipo: 'CNR', monto: 150 }] },
  ],

  // Medios de pago habilitados (configurables)
  mediosPago: [
    { id: 'mp1', nombre: 'Efectivo', activo: true },
    { id: 'mp2', nombre: 'Yape', activo: true },
    { id: 'mp3', nombre: 'Plin', activo: true },
    { id: 'mp4', nombre: 'Transferencia', activo: true },
    { id: 'mp5', nombre: 'Tarjeta', activo: true },
  ],

  // Ciclos de pago: día del mes de corte para generar los CR
  // dia = día de corte · dia_venc = día de vencimiento (día del mes del ciclo)
  ciclosPago: [
    { id: 'ci1', dia: 1, dia_venc: 5, es_default: true, activo: true },
    { id: 'ci2', dia: 6, dia_venc: 10, es_default: false, activo: true },
    { id: 'ci3', dia: 16, dia_venc: 20, es_default: false, activo: true },
  ],

  // Promociones NxM: N meses total, M pagados; los últimos (N−M) van gratis
  promociones: [
    { id: 'pr1', nombre: '3x2', meses_total: 3, meses_pagados: 2, activo: true },
    { id: 'pr2', nombre: '2x1', meses_total: 2, meses_pagados: 1, activo: true },
  ],

  asistencias: [],   // { track_id, jugador_id, fecha, estado }

  // Procesos de generación masiva de CR por ciclo (log)
  procesosCR: [],    // { id, fecha, ciclo_dia, corte, vencimiento, sede_id, cargo_ids:[], total }

  // Catálogo configurable de Cargos No Recurrentes (CNR)
  // maneja_stock: asociado a inventario (uniforme, buzo). es_torneo: inscripción a torneo (seguimiento especial).
  conceptosCNR: [
    { id: 'cn1', nombre: 'Uniforme', precio: 120, maneja_stock: true, es_torneo: false, activo: true },
    { id: 'cn2', nombre: 'Inscripción torneo', precio: 100, maneja_stock: false, es_torneo: true, activo: true },
    { id: 'cn3', nombre: 'Exámen médico', precio: 100, maneja_stock: false, es_torneo: false, activo: true },
    { id: 'cn4', nombre: 'Carta Pase', precio: 100, maneja_stock: false, es_torneo: false, activo: true },
  ],
};

// ---------- Lookups ----------
const sede    = (id) => DB.sedes.find((s) => s.id === id);
const track   = (id) => DB.tracks.find((t) => t.id === id);
const tutor   = (id) => DB.tutores.find((t) => t.id === id);
const jugador = (id) => DB.jugadores.find((j) => j.id === id);
const staffDe = (id) => DB.staff.find((s) => s.id === id);
// Fechas: ISO <-> dd/mm/yyyy, y cálculo del ciclo mensual siguiente
const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmtDMY = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
const isoAddDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return isoDate(d); };
// Próxima ocurrencia de 'dia' (día del mes) estrictamente posterior a 'desde'
function proximoDia(desdeIso, dia) {
  const d = new Date(desdeIso + 'T00:00:00');
  let b = new Date(d.getFullYear(), d.getMonth(), dia);
  if (b <= d) b = new Date(d.getFullYear(), d.getMonth() + 1, dia);
  return isoDate(b);
}
// Fecha de corte = (próxima ocurrencia del día del ciclo, estrictamente > inicio) − 1 día
const proximoCorte = (inicioIso, dia) => isoAddDays(proximoDia(inicioIso, dia), -1);
// Fecha de vencimiento = día de vencimiento en el mes del ciclo (mes de inicio);
// si cayera antes del inicio, pasa al mes siguiente.
function fechaVencimiento(inicioIso, diaVenc) {
  const d = new Date(inicioIso + 'T00:00:00');
  let v = new Date(d.getFullYear(), d.getMonth(), diaVenc);
  if (v < d) v = new Date(d.getFullYear(), d.getMonth() + 1, diaVenc);
  return isoDate(v);
}
// Inicio del CR: día siguiente a la última fecha de corte, o hoy si no hay
const inicioCR = (ultimaCorteIso) => (ultimaCorteIso ? isoAddDays(ultimaCorteIso, 1) : HOY);
// Ventana del mes actual (1 al último día) que contiene 'hoy'
function mesActualWindow(hoyIso) {
  const h = new Date(hoyIso + 'T00:00:00');
  return { inicio: isoDate(new Date(h.getFullYear(), h.getMonth(), 1)),
           fin: isoDate(new Date(h.getFullYear(), h.getMonth() + 1, 0)) };
}
// Ventana del mes anterior completo (1 al último día)
function mesAnteriorWindow(hoyIso) {
  const h = new Date(hoyIso + 'T00:00:00');
  return { inicio: isoDate(new Date(h.getFullYear(), h.getMonth() - 1, 1)),
           fin: isoDate(new Date(h.getFullYear(), h.getMonth(), 0)) };
}
// Ventana del ciclo (día N al día N−1 del mes siguiente) que contiene 'hoy'
function cicloWindow(dia, hoyIso) {
  const h = new Date(hoyIso + 'T00:00:00');
  let ini = new Date(h.getFullYear(), h.getMonth(), dia);
  if (h < ini) ini = new Date(h.getFullYear(), h.getMonth() - 1, dia);
  const fin = new Date(ini.getFullYear(), ini.getMonth() + 1, dia);
  fin.setDate(fin.getDate() - 1);
  return { inicio: isoDate(ini), fin: isoDate(fin) };
}
// Suma n meses conservando el día (recorta al último día del mes si no existe)
function addMonths(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(y, m - 1 + n, 1);
  const ultimoDia = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  t.setDate(Math.min(d, ultimoDia));
  return isoDate(t);
}
// Periodos de una promo anclada a 'ancla' (día de matrícula): [{inicio, fin, gratis}]
function periodosPromo(ancla, promo) {
  const gratisDesde = promo.meses_pagados; // los meses > pagados son gratis
  const out = [];
  for (let n = 1; n <= promo.meses_total; n++) {
    out.push({ inicio: addMonths(ancla, n - 1), fin: isoAddDays(addMonths(ancla, n), -1), gratis: n > gratisDesde });
  }
  return out;
}

// Descripción de un cargo (SIN el nombre del alumno)
// CR: "<track> Del <inicio> al <fin>"   ·   CNR: "<concepto> · <detalle>"
const descCargo = (c) => {
  const base = c.concepto || (c.tipo === 'CR' ? 'Mensualidad' : 'Cargo');
  if (!c.descripcion) return base;
  return c.tipo === 'CR' ? `${base} ${c.descripcion}` : `${base} · ${c.descripcion}`;
};
// Etiqueta de origen del CR: automático (proceso) o manual
const origenTag = (c) => {
  if (c.tipo !== 'CR' || c.origen === 'promo') return '';
  if (c.origen === 'proceso') return ' <span class="text-[10px] rounded bg-sky-100 text-sky-600 px-1 py-0.5 align-middle">⚙️ auto</span>';
  if (c.origen === 'manual') return ' <span class="text-[10px] rounded bg-slate-100 text-slate-500 px-1 py-0.5 align-middle">✋ manual</span>';
  return '';
};

// Cálculos de negocio (Flujo C)
function statsTrack(t) {
  const insc = DB.inscripciones.filter((i) => i.track_id === t.id && i.activo);
  const costoOperacion = t.costo_mensual_cancha + t.costo_mensual_profesores;
  const puntoEquilibrio = ceil(costoOperacion / t.mensualidad_sugerida);
  const ingresos = insc.reduce((s, i) =>
    s + (i.costo_mensual_personalizado ?? t.mensualidad_sugerida), 0);
  const utilidad = ingresos - costoOperacion;
  const rentable = insc.length >= puntoEquilibrio;
  // color: verde rentable; ámbar si hay algún alumno pero bajo umbral; rojo si muy por debajo
  const ratio = puntoEquilibrio ? insc.length / puntoEquilibrio : 0;
  const color = rentable ? 'emerald' : ratio >= 0.5 ? 'amber' : 'rose';
  const etiqueta = rentable ? 'Track Rentable' : ratio >= 0.5 ? 'Operando a pérdida' : 'Déficit crítico';
  return { insc, costoOperacion, puntoEquilibrio, ingresos, utilidad, rentable, color, etiqueta };
}

// ---------- Menú por rol ----------
const MENU = [
  { id: 'dashboard',   label: 'Dashboard',     icon: '📊', roles: ['admin','coordinador','tesorero','profesor'] },
  { id: 'tracks',      label: 'Tracks · Rentabilidad', icon: '🎯', roles: ['admin','coordinador'] },
  { id: 'alumnos',     label: 'Alumnos',       icon: '🧒', roles: ['admin','coordinador'] },
  { id: 'tesoreria',   label: 'Tesorería',     icon: '💵', roles: ['admin','coordinador','tesorero'] },
  { id: 'porcobrar',   label: 'Por cobrar',    icon: '📋', roles: ['admin','coordinador','tesorero'] },
  { id: 'aprobar',     label: 'Aprobar pagos', icon: '✔️', roles: ['admin','tesorero'] },
  { id: 'asistencia',  label: 'Asistencia',    icon: '✅', roles: ['admin','profesor'] },
  { id: 'cromos',      label: 'Cromos',        icon: '🃏', roles: ['admin','profesor'] },
  { id: 'config',      label: 'Configuración', icon: '⚙️', roles: ['admin'] },
];

let ROL = 'admin';
let SCREEN = 'dashboard';
let CONFIG_TAB = 'perfil';
let SEDE_EDIT = null;          // id de sede en edición (o null)
let SEDE_CABECERA = null;      // dataURL de la cabecera de la sede en edición
let CNR_EDIT = null;           // id de concepto CNR en edición (o null)
let MP_EDIT = null;            // id de medio de pago en edición (o null)
let CICLO_EDIT = null;         // id de ciclo de pago en edición (o null)
let PROMO_EDIT = null;         // id de promoción en edición (o null)
const nombreCiclo = (c) => c ? `Ciclo al ${c.dia}` : '';
let SEDE_ACTUAL = 's1';        // sede activa: cada sede se opera de forma independiente
let TRACK_SEL = null;          // track abierto en el detalle (o null = lista)
let ASIS_TRACK = null;         // track activo en Asistencia
let ASIS_FECHA = null;         // fecha activa en Asistencia
let DASH_SEDE = '';            // filtro de sede del Dashboard ('' = todas)
let DASH_PERIODO = 'mes';      // 'mes' (mes actual) | 'anterior' (mes anterior completo)
// Conectado: fecha real del dispositivo · demo: fecha fija de los datos mock
const HOY = (window.AcademiasDB && window.AcademiasDB.on)
  ? isoDate(new Date())
  : '2026-07-02';
let PAGO_VOUCHER = null;   // dataURL del voucher del pago en registro
// Imagen de comprobante de ejemplo (para los pagos mock que no tienen imagen real)
const VOUCHER_DEMO = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="440"><rect width="320" height="440" fill="#f1f5f9"/><rect x="20" y="20" width="280" height="400" rx="8" fill="#fff" stroke="#cbd5e1"/><text x="160" y="200" font-family="sans-serif" font-size="22" fill="#64748b" text-anchor="middle">Comprobante</text><text x="160" y="228" font-family="sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">(imagen de ejemplo)</text></svg>');
const fmtFecha = (iso) => iso ? new Date(iso + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Filtros por sede activa (aislamiento operativo)
const tracksSede   = () => DB.tracks.filter((t) => t.sede_id === SEDE_ACTUAL && t.activo !== false);
const alumnosSede  = () => DB.jugadores.filter((j) => j.sede_id === SEDE_ACTUAL);
const cargosSede   = () => { const ids = new Set(alumnosSede().map((j) => j.id)); const ts = tutoresSede();
  return DB.cargos.filter((c) => (c.jugador_id ? ids.has(c.jugador_id) : ts.has(c.tutor_id))); };
const tutoresSede  = () => new Set(alumnosSede().map((j) => j.tutor_id));
const pagosSede    = () => { const ts = tutoresSede(); return DB.pagos.filter((p) => ts.has(p.tutor_id)); };

function renderNav() {
  el('nav').innerHTML = MENU.filter((m) => m.roles.includes(ROL)).map((m) => `
    <button data-screen="${m.id}"
      class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left
             ${SCREEN === m.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}">
      <span>${m.icon}</span><span>${m.label}</span>
    </button>`).join('');
  el('nav').querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => { TRACK_SEL = null; go(b.dataset.screen); toggleNav(false); }));
}

function go(screen) {
  const item = MENU.find((m) => m.id === screen);
  SCREEN = item && item.roles.includes(ROL) ? screen : 'dashboard';
  el('pageTitle').textContent = (MENU.find((m) => m.id === SCREEN) || {}).label || '';
  renderNav();
  SCREENS[SCREEN]();
}

// ---------- Componentes ----------
const card = (label, value, sub = '') => `
  <div class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
    <div class="text-xs uppercase tracking-wide text-slate-400">${label}</div>
    <div class="mt-1 text-2xl font-bold">${value}</div>
    ${sub ? `<div class="mt-1 text-xs text-slate-400">${sub}</div>` : ''}
  </div>`;

const table = (headers, rows) => `
  <div class="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
    <table class="w-full text-sm">
      <thead class="bg-slate-50 text-slate-500 text-left">
        <tr>${headers.map((h) => `<th class="px-4 py-3 font-medium">${h}</th>`).join('')}</tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        ${rows.map((r) => `<tr>${r.map((c) => `<td class="px-4 py-3">${c}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>
  </div>`;

const badge = (txt, color) =>
  `<span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-${color}-100 text-${color}-700">${txt}</span>`;

const estadoColor = { pagado: 'emerald', por_pagar: 'amber', vencido: 'rose', parcial: 'sky',
                      aprobado: 'emerald', registrado: 'emerald', pendiente: 'amber', rechazado: 'rose' };

// ---------- Pantallas ----------
const SCREENS = {
  dashboard() {
    const win = DASH_PERIODO === 'anterior' ? mesAnteriorWindow(HOY) : mesActualWindow(HOY);
    const inDash = (sedeId) => !DASH_SEDE || sedeId === DASH_SEDE;
    const sedesDash = DB.sedes.filter((s) => inDash(s.id));
    const alumnosDash = DB.jugadores.filter((j) => inDash(j.sede_id));
    const tracksDash = DB.tracks.filter((t) => t.activo !== false && inDash(t.sede_id));
    const nuevos = alumnosDash.filter((j) => j.fecha_registro && j.fecha_registro >= win.inicio && j.fecha_registro <= win.fin);
    const activos = alumnosDash.filter((j) => j.estado_alumno === 'activo').length;
    const pagosDash = DB.pagos.filter((p) => p.estado === 'aprobado' && p.jugador_id && inDash(jugador(p.jugador_id).sede_id) && p.fecha >= win.inicio && p.fecha <= win.fin);
    const ingresosItems = pagosDash.flatMap((p) => (p.detalle || []).map((d) => ({ cat: d.cat || (d.tipo === 'CR' ? 'Mensualidades' : d.concepto || 'Otros'), monto: d.monto })))
      .filter((d) => d.monto > 0);   // los documentos en $0 (beca/promo) no suman al recaudado
    const totalIngresos = ingresosItems.reduce((s, d) => s + d.monto, 0);
    // Pagos del periodo aún pendientes de aprobación en Tesorería
    const porAprobar = DB.pagos
      .filter((p) => p.estado === 'pendiente' && p.jugador_id && inDash(jugador(p.jugador_id).sede_id) && p.fecha >= win.inicio && p.fecha <= win.fin)
      .reduce((s, p) => s + (p.total ?? p.monto ?? 0), 0);
    // Cuentas por cobrar (snapshot): cargos pendientes por tipo, no depende del periodo
    const porCobrarItems = DB.cargos
      .filter((c) => c.jugador_id && inDash(jugador(c.jugador_id).sede_id) && (c.monto - (c.pagado_monto || 0)) > 0)
      .map((c) => ({ cat: c.tipo === 'CR' ? 'Mensualidades' : (c.concepto || 'Otros'), monto: c.monto - (c.pagado_monto || 0) }));
    const totalPorCobrar = porCobrarItems.reduce((s, d) => s + d.monto, 0);

    el('content').innerHTML = `
      <div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label class="flex items-center gap-2 text-sm">
          <span class="text-slate-500">Sede</span>
          <select id="dashSede" onchange="dashSet('sede', this.value)" class="rounded-lg border border-slate-300 px-3 py-2 bg-white text-sm">
            <option value="" ${DASH_SEDE === '' ? 'selected' : ''}>Todas</option>
            ${DB.sedes.map((s) => `<option value="${s.id}" ${DASH_SEDE === s.id ? 'selected' : ''}>${s.nombre_sede}</option>`).join('')}
          </select>
        </label>
        <div class="inline-flex rounded-lg ring-1 ring-slate-300 overflow-hidden text-sm">
          <button onclick="dashSet('periodo','mes')" class="px-3 py-2 ${DASH_PERIODO === 'mes' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}">Mes actual</button>
          <button onclick="dashSet('periodo','anterior')" class="px-3 py-2 ${DASH_PERIODO === 'anterior' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}">Mes anterior</button>
        </div>
      </div>
      <p class="text-xs text-slate-400 mb-4">Periodo: <b>${fmtDMY(win.inicio)} al ${fmtDMY(win.fin)}</b> · ${DASH_SEDE ? sede(DASH_SEDE).nombre_sede : 'todas las sedes'}</p>

      <div class="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
        ${card('Alumnos nuevos', nuevos.length, 'en el periodo')}
        ${card('Recaudado', S(totalIngresos), porAprobar > 0 ? `+ <b class="text-amber-600">${S(porAprobar)}</b> por aprobar` : 'pagos del periodo')}
        ${card('Por cobrar', S(totalPorCobrar), 'pendiente total')}
        ${card('Alumnos activos', activos)}
      </div>

      <div class="grid gap-4 lg:grid-cols-2 mb-6">
        <div>
          <h3 class="mb-2 text-sm font-semibold text-slate-600">Ingresos del periodo por tipo</h3>
          ${donaPorCategoria(ingresosItems, 'Sin ingresos en el periodo.')}
        </div>
        <div>
          <h3 class="mb-2 text-sm font-semibold text-slate-600">Cuentas por cobrar por tipo</h3>
          ${donaPorCategoria(porCobrarItems, 'Sin cuentas por cobrar.')}
        </div>
      </div>

      <h3 class="mb-2 text-sm font-semibold text-slate-600">Alumnos nuevos por día</h3>
      <div class="mb-6">${chartNuevosPorDia(nuevos)}</div>

      <h3 class="mb-2 text-sm font-semibold text-slate-600">Salud de tracks (break-even)</h3>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        ${tracksDash.length ? tracksDash.map(trackCard).join('') : '<p class="text-sm text-slate-400">Sin tracks.</p>'}
      </div>`;
  },

  config() {
    const a = DB.academia;
    const tabs = [
      { id: 'perfil', t: 'Perfil' }, { id: 'sedes', t: 'Sedes' }, { id: 'cnr', t: 'Conceptos CNR' },
      { id: 'pagos', t: 'Medios de pago' }, { id: 'ciclos', t: 'Ciclos de pago' }, { id: 'promos', t: 'Promociones' }, { id: 'publica', t: 'Página pública' }, { id: 'invitaciones', t: 'Invitaciones' },
    ];
    el('content').innerHTML = `
      <div class="max-w-3xl">
        <div class="mb-4">
          <h2 class="text-xl font-bold">Configuración</h2>
          <p class="text-sm text-slate-400">Ajustes de la academia y página pública</p>
          <span class="mt-2 inline-block rounded-lg bg-indigo-50 px-3 py-1 text-xs text-slate-600">
            Plan actual: <b class="text-indigo-600 capitalize">${a.plan_suscripcion}</b></span>
        </div>
        <div class="flex gap-1 border-b border-slate-200 mb-6 text-sm overflow-x-auto">
          ${tabs.map((t) => `
            <button onclick="setConfigTab('${t.id}')"
              class="px-4 py-2 -mb-px border-b-2 whitespace-nowrap
                     ${CONFIG_TAB === t.id ? 'border-indigo-600 text-indigo-600 font-medium' : 'border-transparent text-slate-500 hover:text-slate-700'}">
              ${t.t}</button>`).join('')}
        </div>
        <div id="configTab"></div>
      </div>`;
    CONFIG_TABS[CONFIG_TAB]();
  },

  tracks() {
    if (TRACK_SEL) { renderTrackDetalle(); return; }
    el('content').innerHTML = `
      <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
        <p class="text-sm text-slate-500">Toca un track para ver sus alumnos · equilibrio = ⌈costo ÷ mensualidad⌉</p>
        <button onclick="formTrack()" class="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">+ Nuevo track</button>
      </div>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        ${tracksSede().map(trackCard).join('') || '<p class="text-sm text-slate-400">Esta sede aún no tiene tracks.</p>'}
      </div>`;
  },

  alumnos() {
    el('content').innerHTML = `
      <div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-slate-500"><b id="alCount">${alumnosSede().length}</b> alumnos en <b>${sede(SEDE_ACTUAL).nombre_sede}</b></p>
        <button onclick="formRegistroExpress()" class="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">+ Registro cero fricción</button>
      </div>
      <input id="al_q" oninput="renderAlumnosList()" placeholder="Buscar alumno por nombre..."
        class="w-full mb-3 rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
      <div id="alumnosList" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"></div>`;
    renderAlumnosList();
  },

  tesoreria() {
    const puedeAprobar = ROL === 'admin' || ROL === 'tesorero';
    const cargosS = cargosSede();
    const pagosS = pagosSede();
    const saldoC = (c) => c.monto - (c.pagado_monto || 0);
    const porCobrar = cargosS.filter((c) => saldoC(c) > 0);
    // Estado de cuenta consolidado por tutor (solo tutores con alumnos en la sede)
    const tIds = tutoresSede();
    const consolidado = DB.tutores.filter((t) => tIds.has(t.id)).map((t) => {
      const cargos = cargosS.filter((c) => c.tutor_id === t.id && saldoC(c) > 0);
      const deuda = cargos.reduce((s, c) => s + saldoC(c), 0);
      const hijos = alumnosSede().filter((j) => j.tutor_id === t.id).length;
      return { t, deuda, hijos, cargos };
    }).filter((x) => x.deuda > 0);

    el('content').innerHTML = `
      <div class="mb-4 flex flex-wrap justify-end gap-2">
        <button onclick="formGenerarCR()" class="rounded-lg bg-white ring-1 ring-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">⚙️ Generar CR por ciclo</button>
        <button onclick="formCargo()" class="rounded-lg bg-white ring-1 ring-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">+ Cargo eventual</button>
        <button onclick="formPago()" class="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">+ Registrar pago</button>
      </div>
      <div class="grid gap-4 md:grid-cols-3 mb-6">
        ${card('Por cobrar', S(porCobrar.reduce((s, c) => s + saldoC(c), 0)), `${porCobrar.length} cargos`)}
        ${card('Documentos de pago', pagosS.length, `${S(pagosS.filter((p) => p.estado === 'aprobado').reduce((s, p) => s + (p.total ?? p.monto ?? 0), 0))} recaudado`)}
        ${card('Periodo', 'Julio 2026')}
      </div>

      <h3 class="mb-2 text-sm font-semibold text-slate-600">Estado de cuenta consolidado (por familia/tutor)</h3>
      <div class="mb-6">
      ${table(['Tutor (DNI)', 'Hijos', 'Detalle de cargos', 'Deuda total'],
        consolidado.map((x) => [
          `DNI ${x.t.dni_tutor}`, x.hijos,
          x.cargos.map((c) => `${badge(c.tipo || 'CR', c.tipo === 'CNR' ? 'fuchsia' : 'indigo')} ${c.jugador_id ? nom(jugador(c.jugador_id)) + ' · ' : ''}${descCargo(c)} · ${S(saldoC(c))}`).join('<br>'),
          `<b>${S(x.deuda)}</b>`]))}
      </div>

      <h3 class="mb-2 text-sm font-semibold text-slate-600">Documentos de pago</h3>
      <div class="mb-6">
      ${table(['Alumno', 'Total', 'Medio', 'N° Op.', 'Fecha', 'Estado'],
        pagosS.map((p) => [
          p.jugador_id ? nom(jugador(p.jugador_id)) : `DNI ${tutor(p.tutor_id).dni_tutor}`,
          S(p.total ?? p.monto ?? 0), p.medio || '—', p.num_operacion || '—', fmtDMY(p.fecha),
          badge(p.estado, estadoColor[p.estado] || 'emerald')]))}
      </div>

      <h3 class="mb-2 text-sm font-semibold text-slate-600">Procesos de facturación (CR por ciclo)</h3>
      ${DB.procesosCR.filter((p) => p.sede_id === SEDE_ACTUAL).length
        ? table(['Fecha', 'Ciclo', 'Corte', 'Vencimiento', 'CRs', 'Total', ''],
            DB.procesosCR.filter((p) => p.sede_id === SEDE_ACTUAL).slice().reverse().map((p) => [
              fmtDMY(p.fecha), `Ciclo al ${p.ciclo_dia}`, fmtDMY(p.corte), fmtDMY(p.vencimiento),
              p.cargo_ids.length, S(p.total),
              `<button onclick="verProcesoCR('${p.id}')" class="text-indigo-600 hover:underline text-xs">Ver detalle</button>`]))
        : '<p class="text-sm text-slate-400">Aún no se ha ejecutado ningún proceso de facturación en esta sede.</p>'}`;
  },

  porcobrar() {
    const saldoC = (c) => c.monto - (c.pagado_monto || 0);
    const telDe = (j) => (tutor(j.tutor_id) && tutor(j.tutor_id).telefono_celular) || j.telefono || '';
    const alumnos = alumnosSede().map((j) => {
      const cs = cargosSede().filter((c) => c.jugador_id === j.id && saldoC(c) > 0);
      if (!cs.length) return null;
      const total = cs.reduce((s, c) => s + saldoC(c), 0);
      const venc = cs.filter((c) => c.fecha_vencimiento && c.fecha_vencimiento < HOY);
      return { j, total, totalVenc: venc.reduce((s, c) => s + saldoC(c), 0), tieneVencido: venc.length > 0 };
    }).filter(Boolean);
    const vencidos = alumnos.filter((a) => a.tieneVencido).sort((a, b) => b.totalVenc - a.totalVenc);
    const porVencer = alumnos.filter((a) => !a.tieneVencido).sort((a, b) => b.total - a.total);
    const totVenc = vencidos.reduce((s, a) => s + a.total, 0);
    const totPorVencer = porVencer.reduce((s, a) => s + a.total, 0);

    const pcCard = (a, esVencido) => {
      const j = a.j;
      const ini = ((j.nombre[0] || '') + (j.apellido[0] || '')).toUpperCase();
      const tel = telDe(j); const wa = tel.replace(/\D/g, '');
      return `<div class="rounded-xl bg-white ring-1 ring-slate-200 p-3">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            ${j.foto_url ? `<img src="${j.foto_url}" class="h-9 w-9 rounded-full object-cover">` : `<span class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">${ini}</span>`}
            <div class="min-w-0"><div class="font-medium truncate">${nom(j)}</div><div class="text-xs text-slate-400">Cat. ${anio(j.fecha_nacimiento)}</div></div>
          </div>
          <div class="text-right">
            <div class="font-bold ${esVencido ? 'text-rose-600' : 'text-slate-800'}">${S(a.total)}</div>
            ${esVencido ? `<div class="text-xs text-rose-500">${S(a.totalVenc)} vencido</div>` : ''}
          </div>
        </div>
        <div class="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
          ${tel ? `<a href="https://wa.me/51${wa}" target="_blank" class="text-emerald-600 hover:underline">📱 ${tel}</a>` : '<span class="text-slate-400">sin teléfono</span>'}
          <button onclick="formDocumentoCuenta('${j.id}')" class="font-medium text-indigo-600 hover:underline">Ver estado de cuenta</button>
        </div>
      </div>`;
    };
    const kpi = (label, val, sub, color) => `
      <div class="rounded-xl bg-${color}-50 ring-1 ring-${color}-100 p-4">
        <div class="text-xs uppercase tracking-wide text-${color}-500">${label}</div>
        <div class="mt-1 text-2xl font-bold text-${color}-600">${val}</div>
        <div class="text-xs text-slate-400">${sub}</div>
      </div>`;

    el('content').innerHTML = `
      <p class="text-sm text-slate-500 mb-3">Cuentas por cobrar de <b>${sede(SEDE_ACTUAL).nombre_sede}</b></p>
      <div class="grid grid-cols-2 gap-3 mb-5">
        ${kpi('Vencido', S(totVenc), `${vencidos.length} alumno(s)`, 'rose')}
        ${kpi('Por vencer', S(totPorVencer), `${porVencer.length} alumno(s)`, 'amber')}
      </div>
      <h3 class="mb-2 text-sm font-semibold text-rose-600">🔴 Vencidos (${vencidos.length})</h3>
      <div class="grid gap-2 md:grid-cols-2 mb-6">
        ${vencidos.length ? vencidos.map((a) => pcCard(a, true)).join('') : '<p class="text-sm text-slate-400">Ningún alumno con cargos vencidos. 🎉</p>'}
      </div>
      <h3 class="mb-2 text-sm font-semibold text-amber-600">🟡 Por vencer (${porVencer.length})</h3>
      <div class="grid gap-2 md:grid-cols-2">
        ${porVencer.length ? porVencer.map((a) => pcCard(a, false)).join('') : '<p class="text-sm text-slate-400">Sin cuentas por vencer.</p>'}
      </div>`;
  },

  aprobar() {
    const pagosDeSede = DB.pagos.filter((p) => p.sede_id === SEDE_ACTUAL);
    const pendientes = pagosDeSede.filter((p) => p.estado === 'pendiente');
    const aprobadosHoy = pagosDeSede.filter((p) => p.estado === 'aprobado' && (p.fecha_aprobacion || p.fecha) === HOY);
    const rechazadosHoy = pagosDeSede.filter((p) => p.estado === 'rechazado' && (p.fecha_rechazo === HOY || p.fecha === HOY));
    const sum = (arr) => arr.reduce((s, p) => s + (p.total ?? p.monto ?? 0), 0);
    const porMedio = {};
    aprobadosHoy.forEach((p) => { const m = p.medio || '—'; porMedio[m] = (porMedio[m] || 0) + (p.total ?? p.monto ?? 0); });
    const medios = Object.keys(porMedio).sort((a, b) => porMedio[b] - porMedio[a]);
    const kpi = (label, val, color) => `<div class="rounded-xl bg-${color}-50 ring-1 ring-${color}-100 p-4"><div class="text-xs uppercase tracking-wide text-${color}-500">${label}</div><div class="mt-1 text-2xl font-bold text-${color}-600">${val}</div></div>`;

    el('content').innerHTML = `
      <p class="text-sm text-slate-500 mb-3">Aprobación de pagos · <b>${sede(SEDE_ACTUAL).nombre_sede}</b></p>
      <h3 class="mb-2 text-sm font-semibold text-slate-600">Pagos del día por medio de pago</h3>
      <div class="grid gap-3 grid-cols-2 sm:grid-cols-4 mb-5">
        ${medios.length ? medios.map((m) => `<div class="rounded-xl bg-white ring-1 ring-slate-200 p-4"><div class="text-xs text-slate-400">${m}</div><div class="mt-1 text-xl font-bold text-slate-800">${S(porMedio[m])}</div></div>`).join('') : '<p class="text-sm text-slate-400 col-span-full">Sin pagos aprobados hoy.</p>'}
      </div>
      <div class="grid gap-3 grid-cols-3 mb-6">
        ${kpi('Pendientes', S(sum(pendientes)), 'amber')}
        ${kpi('Aprobados hoy', S(sum(aprobadosHoy)), 'emerald')}
        ${kpi('Rechazados hoy', S(sum(rechazadosHoy)), 'rose')}
      </div>
      <h3 class="mb-2 text-sm font-semibold text-slate-600">Pendientes de aprobación (${pendientes.length})</h3>
      <div class="grid gap-2 md:grid-cols-2">
        ${pendientes.length ? pendientes.map(pagoAprobCard).join('') : '<p class="text-sm text-slate-400">No hay pagos pendientes de aprobación. 🎉</p>'}
      </div>`;
  },

  asistencia() {
    const trks = tracksSede();
    if (!trks.length) { el('content').innerHTML = '<p class="text-sm text-slate-400">Esta sede no tiene tracks.</p>'; return; }
    if (!trks.some((t) => t.id === ASIS_TRACK)) ASIS_TRACK = trks[0].id;
    if (!ASIS_FECHA) ASIS_FECHA = HOY;
    el('content').innerHTML = `
      <div class="mb-3 grid gap-2 sm:grid-cols-3">
        <label class="block">
          <span class="block text-xs text-slate-500 mb-1">Track</span>
          <select id="asis_track" onchange="asisChange()" class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm bg-white">
            ${trks.map((t) => `<option value="${t.id}" ${t.id === ASIS_TRACK ? 'selected' : ''}>${t.nombre_track}</option>`).join('')}
          </select>
        </label>
        <label class="block">
          <span class="block text-xs text-slate-500 mb-1">Fecha</span>
          <input id="asis_fecha" type="date" value="${ASIS_FECHA}" onchange="asisChange()" class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
        </label>
        <label class="block">
          <span class="block text-xs text-slate-500 mb-1">Buscar alumno</span>
          <input id="asis_q" oninput="renderAsisList()" placeholder="Nombre..." class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
        </label>
      </div>
      <div id="asisResumen" class="mb-3 text-sm"></div>
      <div id="asisList" class="grid gap-2 md:grid-cols-2"></div>`;
    renderAsisList();
  },

  cromos() {
    const conCromo = alumnosSede().filter((j) => j.atributos);
    const sinCromo = alumnosSede().filter((j) => !j.atributos);
    el('content').innerHTML = `
      <p class="text-sm text-slate-500 mb-4">Cromo de rendimiento · 6 atributos (Velocidad, Potencia, Agilidad, Técnica, Pase, Defensa)</p>
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        ${conCromo.map(cromoCard).join('')}
        ${sinCromo.map((j) => `
          <div class="rounded-2xl border-2 border-dashed border-slate-200 p-6 flex flex-col items-center justify-center text-center text-slate-400">
            <div class="text-3xl mb-2">🃏</div>
            <div class="font-medium text-slate-600">${nom(j)}</div>
            <div class="text-xs">Categoría ${anio(j.fecha_nacimiento)} · sin evaluar</div>
            <button onclick="formCromo('${j.id}')" class="mt-3 text-xs text-indigo-600 hover:underline">Evaluar 6 atributos</button>
          </div>`).join('')}
      </div>`;
  },
};

// ---------- Asistencia (mobile-first, funcional) ----------
const clrAsis = { presente: 'emerald', ausente: 'rose', tardanza: 'amber', justificado: 'sky' };
const ASIS_ESTADOS = [['presente', 'Presente'], ['ausente', 'Ausente'], ['tardanza', 'Tardanza'], ['justificado', 'Justif.']];
const getAsis = (tid, jid, fecha) => {
  const a = DB.asistencias.find((x) => x.track_id === tid && x.jugador_id === jid && x.fecha === fecha);
  return a ? a.estado : null;
};
window.asisChange = () => { ASIS_TRACK = el('asis_track').value; ASIS_FECHA = el('asis_fecha').value; renderAsisList(); };
window.marcarAsistencia = (jid, estado) => {
  const a = DB.asistencias.find((x) => x.track_id === ASIS_TRACK && x.jugador_id === jid && x.fecha === ASIS_FECHA);
  if (a) a.estado = (a.estado === estado ? null : estado);   // volver a tocar = desmarcar
  else DB.asistencias.push({ id: uid('a'), track_id: ASIS_TRACK, jugador_id: jid, fecha: ASIS_FECHA, estado });
  renderAsisList();
};
function renderAsisList() {
  const q = (el('asis_q') ? el('asis_q').value : '').toLowerCase();
  let alumnos = DB.inscripciones.filter((i) => i.track_id === ASIS_TRACK && i.activo).map((i) => jugador(i.jugador_id));
  if (q) alumnos = alumnos.filter((a) => nom(a).toLowerCase().includes(q));
  const total = alumnos.length;
  const marcados = alumnos.filter((a) => getAsis(ASIS_TRACK, a.id, ASIS_FECHA)).length;
  const presentes = alumnos.filter((a) => getAsis(ASIS_TRACK, a.id, ASIS_FECHA) === 'presente').length;
  el('asisResumen').innerHTML = `<b class="text-emerald-600">${presentes} presente(s)</b> <span class="text-slate-400">· ${marcados}/${total} marcados</span>`;
  el('asisList').innerHTML = alumnos.length ? alumnos.map((a) => {
    const cur = getAsis(ASIS_TRACK, a.id, ASIS_FECHA);
    const ini = ((a.nombre[0] || '') + (a.apellido[0] || '')).toUpperCase();
    return `<div class="rounded-xl bg-white ring-1 ring-slate-200 p-3">
      <div class="flex items-center gap-2 mb-2">
        ${a.foto_url ? `<img src="${a.foto_url}" class="h-9 w-9 rounded-full object-cover">` : `<span class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">${ini}</span>`}
        <div class="font-medium text-slate-700">${nom(a)} <span class="ml-1 rounded bg-amber-100 text-amber-700 px-1.5 py-0.5 text-xs">${anio(a.fecha_nacimiento)}</span></div>
      </div>
      <div class="grid grid-cols-4 gap-1.5">
        ${ASIS_ESTADOS.map(([v, lbl]) => `<button onclick="marcarAsistencia('${a.id}','${v}')"
          class="py-2.5 rounded-lg text-xs font-semibold transition ${cur === v ? `bg-${clrAsis[v]}-500 text-white shadow` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">${lbl}</button>`).join('')}
      </div>
    </div>`;
  }).join('') : '<p class="text-sm text-slate-400 p-2 col-span-full">No hay alumnos que coincidan.</p>';
}

// ---------- Lista de alumnos (tarjetas, mobile-first) ----------
function renderAlumnosList() {
  const q = (el('al_q') ? el('al_q').value : '').toLowerCase();
  let als = alumnosSede();
  if (q) als = als.filter((j) => nom(j).toLowerCase().includes(q));
  if (el('alCount')) el('alCount').textContent = als.length;
  el('alumnosList').innerHTML = als.length ? als.map((j) => {
    const t = tutor(j.tutor_id);
    const trks = DB.inscripciones.filter((i) => i.jugador_id === j.id && i.activo).map((i) => track(i.track_id).nombre_track).join(', ') || 'sin track';
    const ini = ((j.nombre[0] || '') + (j.apellido[0] || '')).toUpperCase();
    const baja = j.estado_alumno !== 'activo';
    const perfil = t.perfil_reclamado
      ? '<span class="text-emerald-500">✓ perfil</span>'
      : `<button onclick="event.stopPropagation(); formOnboarding('${t.id}')" class="text-amber-500 underline">reclamar perfil</button>`;
    return `<div onclick="formEditarAlumno('${j.id}')" class="cursor-pointer rounded-xl bg-white ring-1 ring-slate-200 p-3 hover:ring-indigo-300 hover:shadow-sm transition ${baja ? 'opacity-60' : ''}">
      <div class="flex items-center gap-2">
        ${j.foto_url ? `<img src="${j.foto_url}" class="h-10 w-10 rounded-full object-cover">` : `<span class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-medium">${ini}</span>`}
        <div class="min-w-0 flex-1">
          <div class="font-medium text-slate-800 truncate">${nom(j)}${baja ? ' ' + badge('Baja', 'slate') : ''}</div>
          <div class="text-xs text-slate-400">Cat. ${anio(j.fecha_nacimiento)}${j.posicion_juego ? ' · ' + j.posicion_juego : ''}${j.numero_camiseta != null ? ' · #' + j.numero_camiseta : ''}</div>
        </div>
      </div>
      <div class="mt-2 text-xs text-slate-500 truncate">🎯 ${trks}</div>
      <div class="text-xs text-slate-400 mt-0.5">Tutor DNI ${t.dni_tutor} · ${perfil}</div>
    </div>`;
  }).join('') : '<p class="text-sm text-slate-400 p-2 col-span-full">No hay alumnos que coincidan.</p>';
}

// ---------- Dashboard: control + gráfico de alumnos nuevos por día ----------
window.dashSet = (key, val) => {
  if (key === 'sede') DASH_SEDE = val;
  else if (key === 'periodo') DASH_PERIODO = val;
  SCREENS.dashboard();
};
function chartNuevosPorDia(nuevos) {
  if (!nuevos.length) return '<div class="rounded-xl bg-white ring-1 ring-slate-200 p-6 text-center text-sm text-slate-400">Sin registros en el periodo.</div>';
  const palette = ['#6366f1', '#f59e0b', '#94a3b8', '#10b981', '#ec4899', '#0ea5e9'];
  const sedeIds = DB.sedes.map((s) => s.id).filter((sid) => nuevos.some((j) => j.sede_id === sid));
  const colorDe = {}; sedeIds.forEach((sid, i) => { colorDe[sid] = palette[i % palette.length]; });
  const dias = [...new Set(nuevos.map((j) => j.fecha_registro))].sort();
  const conteo = (dia, sid) => nuevos.filter((j) => j.fecha_registro === dia && j.sede_id === sid).length;
  const totalDia = (dia) => nuevos.filter((j) => j.fecha_registro === dia).length;
  const maxDia = Math.max(...dias.map(totalDia), 1);
  const barW = 34, gap = 12, padL = 10, padB = 22, padT = 16, h = 170;
  const w = padL * 2 + dias.length * (barW + gap);
  const chartH = h - padB - padT;
  const bars = dias.map((dia, di) => {
    const x = padL + di * (barW + gap);
    let y = h - padB;
    const segs = sedeIds.map((sid) => {
      const c = conteo(dia, sid);
      if (!c) return '';
      const segH = (c / maxDia) * chartH;
      y -= segH;
      return `<rect x="${x}" y="${y}" width="${barW}" height="${segH}" rx="2" fill="${colorDe[sid]}"><title>${sede(sid).nombre_sede}: ${c}</title></rect>`;
    }).join('');
    const topY = (h - padB) - (totalDia(dia) / maxDia) * chartH;
    return `${segs}
      <text x="${x + barW / 2}" y="${topY - 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#334155">${totalDia(dia)}</text>
      <text x="${x + barW / 2}" y="${h - padB + 14}" text-anchor="middle" font-size="10" fill="#64748b">${fmtDMY(dia).slice(0, 5)}</text>`;
  }).join('');
  const leyenda = sedeIds.map((sid) => `<span class="inline-flex items-center gap-1.5 text-xs text-slate-600"><span class="inline-block h-3 w-3 rounded-sm" style="background:${colorDe[sid]}"></span>${sede(sid).nombre_sede}</span>`).join('');
  const filas = sedeIds.map((sid) => `<tr><td class="px-3 py-1.5"><span class="inline-block h-2.5 w-2.5 rounded-sm mr-1.5 align-middle" style="background:${colorDe[sid]}"></span>${sede(sid).nombre_sede}</td><td class="px-3 py-1.5 text-right font-medium">${nuevos.filter((j) => j.sede_id === sid).length}</td></tr>`).join('');
  return `
    <div class="rounded-xl bg-white ring-1 ring-slate-200 p-4">
      <div class="flex flex-wrap gap-3 mb-3">${leyenda}</div>
      <div class="overflow-x-auto"><svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" class="block">${bars}</svg></div>
    </div>
    <div class="mt-2 max-w-xs rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden text-sm">
      <table class="w-full"><tbody class="divide-y divide-slate-100">
        ${filas}
        <tr class="bg-slate-50 font-semibold"><td class="px-3 py-1.5">Total general</td><td class="px-3 py-1.5 text-right">${nuevos.length}</td></tr>
      </tbody></table>
    </div>`;
}

// Gráfico circular (dona) por categoría. items = [{cat, monto}]
function donaPorCategoria(items, emptyMsg) {
  const totals = {};
  items.forEach((d) => { const cat = d.cat || 'Otros'; totals[cat] = (totals[cat] || 0) + d.monto; });
  const cats = Object.keys(totals).sort((a, b) => totals[b] - totals[a]);
  if (!cats.length) return `<div class="rounded-xl bg-white ring-1 ring-slate-200 p-6 text-center text-sm text-slate-400">${emptyMsg}</div>`;
  const total = cats.reduce((s, c) => s + totals[c], 0);
  const palette = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#0ea5e9', '#94a3b8'];
  const cx = 90, cy = 90, r = 82, rInner = 50;
  const rad = (a) => ((a - 90) * Math.PI) / 180;
  let acc = 0;
  const slices = cats.map((c, i) => {
    const start = (acc / total) * 360; acc += totals[c];
    const end = (acc / total) * 360;
    const color = palette[i % palette.length];
    if (cats.length === 1) return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"><title>${c}: ${S(totals[c])}</title></circle>`;
    const x1 = (cx + r * Math.cos(rad(start))).toFixed(2), y1 = (cy + r * Math.sin(rad(start))).toFixed(2);
    const x2 = (cx + r * Math.cos(rad(end))).toFixed(2), y2 = (cy + r * Math.sin(rad(end))).toFixed(2);
    const large = end - start > 180 ? 1 : 0;
    return `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${color}"><title>${c}: ${S(totals[c])}</title></path>`;
  }).join('');
  const donut = `<circle cx="${cx}" cy="${cy}" r="${rInner}" fill="white"/>
    <text x="${cx}" y="${cy - 3}" text-anchor="middle" font-size="9" fill="#94a3b8">Total</text>
    <text x="${cx}" y="${cy + 13}" text-anchor="middle" font-size="14" font-weight="700" fill="#334155">${S(total)}</text>`;
  const legend = cats.map((c, i) => {
    const pctTot = Math.round((totals[c] / total) * 100);
    return `<div class="flex items-center justify-between gap-2 text-xs py-1">
      <span class="flex items-center gap-1.5 min-w-0"><span class="inline-block h-3 w-3 rounded-sm shrink-0" style="background:${palette[i % palette.length]}"></span><span class="truncate text-slate-600">${c}</span></span>
      <span class="font-medium shrink-0">${S(totals[c])} · ${pctTot}%</span>
    </div>`;
  }).join('');
  return `
    <div class="rounded-xl bg-white ring-1 ring-slate-200 p-4">
      <div class="flex flex-col sm:flex-row items-center gap-4">
        <svg viewBox="0 0 180 180" width="180" height="180" class="shrink-0">${slices}${donut}</svg>
        <div class="flex-1 w-full min-w-0">${legend}</div>
      </div>
    </div>`;
}

// ---------- Tarjetas compuestas ----------
function trackCard(t) {
  const x = statsTrack(t);
  const pct = Math.min(100, Math.round((x.insc.length / t.capacidad_maxima) * 100));
  const pctBE = Math.round((x.puntoEquilibrio / t.capacidad_maxima) * 100);
  return `
    <div onclick="abrirTrack('${t.id}')" class="cursor-pointer rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 hover:ring-indigo-300 hover:shadow-md transition">
      <div class="flex justify-between items-start">
        <div>
          <div class="font-semibold">${t.nombre_track}</div>
          <div class="text-xs text-slate-400">${sede(t.sede_id).nombre_sede} · ${t.linea_negocio}</div>
        </div>
        ${badge(x.etiqueta, x.color)}
      </div>
      <div class="mt-3 text-xs text-slate-500 flex justify-between">
        <span>${x.insc.length}/${t.capacidad_maxima} alumnos</span>
        <span>equilibrio: ${x.puntoEquilibrio}</span>
      </div>
      <div class="relative mt-1 h-3 rounded-full bg-slate-100 overflow-hidden">
        <div class="h-full bg-${x.color}-500" style="width:${pct}%"></div>
        <div class="absolute top-0 h-3 w-px bg-slate-700" style="left:${pctBE}%" title="Punto de equilibrio"></div>
      </div>
      <div class="mt-3 flex justify-between text-sm">
        <span class="text-slate-500">Utilidad</span>
        <span class="font-semibold text-${x.color}-600">${S(x.utilidad)}</span>
      </div>
    </div>`;
}

function cromoCard(j) {
  const a = j.atributos;
  const barras = [['Velocidad', a.velocidad], ['Potencia', a.potencia], ['Agilidad', a.agilidad],
                 ['Técnica', a.tecnica], ['Pase', a.pase], ['Defensa', a.defensa]];
  const prom = Math.round(barras.reduce((s, b) => s + b[1], 0) / barras.length);
  return `
    <div class="rounded-2xl p-5 text-white shadow-lg" style="background:linear-gradient(135deg,${DB.academia.color_primario},#1e1b4b)">
      <div class="flex justify-between items-start">
        <div>
          <div class="text-3xl font-black leading-none">${prom}</div>
          <div class="text-xs opacity-80">${j.posicion_juego || ''}</div>
        </div>
        <div class="text-right">
          <div class="font-bold">${nom(j)}</div>
          <div class="text-xs opacity-80">#${j.numero_camiseta ?? '-'} · Cat. ${anio(j.fecha_nacimiento)}</div>
        </div>
      </div>
      <div class="mt-4 space-y-1.5">
        ${barras.map(([k, v]) => `
          <div class="flex items-center gap-2 text-xs">
            <span class="w-16 opacity-80">${k}</span>
            <div class="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div class="h-full bg-white" style="width:${v}%"></div>
            </div>
            <span class="w-6 text-right font-semibold">${v}</span>
          </div>`).join('')}
      </div>
      <button onclick="formCromo('${j.id}')" class="mt-4 w-full rounded-lg bg-white/15 hover:bg-white/25 py-1.5 text-xs font-medium">Re-evaluar</button>
    </div>`;
}

// =====================================================================
// DETALLE DE TRACK (alumnos del track)
// =====================================================================
window.abrirTrack = (id) => { TRACK_SEL = id; go('tracks'); };
window.cerrarTrack = () => { TRACK_SEL = null; go('tracks'); };

function renderTrackDetalle() {
  const t = track(TRACK_SEL);
  if (!t) { TRACK_SEL = null; SCREENS.tracks(); return; }
  const insc = DB.inscripciones.filter((i) => i.track_id === t.id && i.activo);
  const cats = [...new Set(DB.inscripciones.filter((i) => i.track_id === t.id)
    .map((i) => anio(jugador(i.jugador_id).fecha_nacimiento)))].sort();
  el('content').innerHTML = `
    <button onclick="cerrarTrack()" class="mb-3 text-sm text-indigo-600 hover:underline">← Volver a tracks</button>
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="text-xl font-bold">${t.nombre_track}</h2>
          <span id="trkCount" class="text-sm text-emerald-600 font-medium">${insc.length}/${t.capacidad_maxima}</span>
        </div>
        <div class="text-xs text-slate-400">${t.dias_horario || ''} · ${sede(t.sede_id).nombre_sede}</div>
      </div>
      <button onclick="formAgregarAlumno('${t.id}')" class="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">+ Agregar alumno</button>
    </div>
    <div class="mb-4 space-y-2">
      <input id="fltQ" oninput="renderTrackRows()" placeholder="Filtrar jugadores por nombre..."
        class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <select id="fltEstado" onchange="renderTrackRows()" class="rounded-lg border border-slate-300 px-2 py-2 bg-white text-sm text-slate-700">
          <option value="inscritos">Inscritos</option><option value="todos">Todos</option>
        </select>
        <select id="fltPago" onchange="renderTrackRows()" class="rounded-lg border border-slate-300 px-2 py-2 bg-white text-sm text-slate-700">
          <option value="">Pago: Todos</option><option value="pendiente">Pendiente</option><option value="aldia">Al día</option>
        </select>
        <select id="fltCat" onchange="renderTrackRows()" class="rounded-lg border border-slate-300 px-2 py-2 bg-white text-sm text-slate-700">
          <option value="">Categoría: Todas</option>${cats.map((c) => `<option value="${c}">Cat. ${c}</option>`).join('')}
        </select>
      </div>
    </div>
    <div id="trkDetalleRows"></div>`;
  renderTrackRows();
}

function renderTrackRows() {
  const t = track(TRACK_SEL);
  const estado = el('fltEstado') ? el('fltEstado').value : 'inscritos';
  const cat = el('fltCat') ? el('fltCat').value : '';
  const pago = el('fltPago') ? el('fltPago').value : '';
  const q = (el('fltQ') ? el('fltQ').value : '').toLowerCase();
  const debeDe = (jid) => cargosSede().filter((c) => c.jugador_id === jid).reduce((s, c) => s + (c.monto - (c.pagado_monto || 0)), 0);
  let insc = DB.inscripciones.filter((i) => i.track_id === t.id);
  if (estado === 'inscritos') insc = insc.filter((i) => i.activo);
  if (cat) insc = insc.filter((i) => String(anio(jugador(i.jugador_id).fecha_nacimiento)) === cat);
  if (pago === 'pendiente') insc = insc.filter((i) => debeDe(i.jugador_id) > 0);
  if (pago === 'aldia') insc = insc.filter((i) => debeDe(i.jugador_id) === 0);
  if (q) insc = insc.filter((i) => nom(jugador(i.jugador_id)).toLowerCase().includes(q));

  const cards = insc.map((i) => {
    const j = jugador(i.jugador_id);
    const efect = i.costo_mensual_personalizado ?? t.mensualidad_sugerida;
    const beca = i.costo_mensual_personalizado != null && i.costo_mensual_personalizado !== t.mensualidad_sugerida;
    const debe = cargosSede().filter((c) => c.jugador_id === j.id).reduce((s, c) => s + (c.monto - (c.pagado_monto || 0)), 0);
    const asis = DB.asistencias.filter((a) => a.track_id === t.id && a.jugador_id === j.id && a.estado !== 'ausente').length;
    const ini = ((j.nombre[0] || '') + (j.apellido[0] || '')).toUpperCase();
    return `<div class="rounded-xl bg-white ring-1 ring-slate-200 p-3 ${i.activo ? '' : 'opacity-60'}">
      <div class="flex items-start justify-between gap-2">
        <div onclick="formEditarAlumno('${j.id}')" class="flex items-center gap-2 cursor-pointer min-w-0 group">
          ${j.foto_url ? `<img src="${j.foto_url}" class="h-9 w-9 rounded-full object-cover">` : `<span class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">${ini}</span>`}
          <div class="min-w-0">
            <div class="font-medium text-slate-800 truncate group-hover:text-indigo-600">${nom(j)}</div>
            <div class="text-xs mt-0.5"><span class="rounded bg-amber-100 text-amber-700 px-1.5 py-0.5">${anio(j.fecha_nacimiento)}</span></div>
          </div>
        </div>
        ${debe > 0 ? badge('Pendiente', 'amber') : badge('Al día', 'emerald')}
      </div>
      <div class="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div><div class="text-slate-400">Inscrito</div><div class="font-medium">${fmtFecha(i.fecha_inscripcion)}</div></div>
        <div><div class="text-slate-400">Últ. corte</div><div class="font-medium">${i.ultima_fecha_corte ? fmtDMY(i.ultima_fecha_corte) : '—'}</div></div>
        <div><div class="text-slate-400">Asistencias</div><div class="font-medium">${asis}/${t.clases_mensuales || 8}</div></div>
        <div><div class="text-slate-400">Mensualidad</div><div class="font-medium">${beca ? `<span class="text-indigo-600">${S(efect)}</span>` : S(efect)}</div></div>
      </div>
      <div class="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
        <span>${debe > 0 ? `Debe <b class="text-rose-600">${S(debe)}</b>` : '<span class="text-emerald-600">Sin deuda</span>'}</span>
        <div class="flex gap-3">
          ${debe > 0 ? `<button onclick="formPagoAlumno('${j.id}')" class="font-medium text-indigo-600 hover:underline">Registrar pago</button>` : ''}
          ${i.activo ? `<button onclick="removerInscripcion('${i.id}')" class="text-rose-600 hover:underline">Remover</button>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');

  el('trkDetalleRows').innerHTML = insc.length
    ? `<div class="grid gap-2 md:grid-cols-2">${cards}</div>`
    : '<p class="text-sm text-slate-400 p-4">No hay jugadores que coincidan con el filtro.</p>';
  if (el('trkCount')) {
    const activos = DB.inscripciones.filter((i) => i.track_id === t.id && i.activo).length;
    el('trkCount').textContent = `${activos}/${t.capacidad_maxima}`;
  }
}

window.removerInscripcion = (id) => {
  const i = DB.inscripciones.find((x) => x.id === id);
  if (i) { i.activo = false; toast('Alumno removido del track'); renderTrackRows(); }
};
let NJ_FOTO = null;   // dataURL de la foto del nuevo jugador
const PAISES_TEL = [{ v: '+51', t: 'Perú (+51)' }, { v: '+56', t: 'Chile (+56)' }, { v: '+57', t: 'Colombia (+57)' },
  { v: '+593', t: 'Ecuador (+593)' }, { v: '+54', t: 'Argentina (+54)' }];

window.formAgregarAlumno = (tid) => {
  NJ_FOTO = null;
  const t = track(tid);
  openModal('Nuevo jugador', `
    <form onsubmit="guardarNuevoJugador(event,'${tid}')">
      <p class="mb-3 text-xs text-slate-500">Se inscribirá en el track <b>${t.nombre_track}</b>.
        <button type="button" onclick="formAgregarExistente('${tid}')" class="text-indigo-600 hover:underline">¿Alumno existente?</button></p>

      ${njFormBody(null)}
      ${submitBar('Crear jugador')}
    </form>`);
};

// Cuerpo reutilizable del formulario de jugador (nuevo o edición). j=null => nuevo.
// tracksJid: si se pasa, agrega como primera pestaña "Tracks" (mantenimiento).
function njFormBody(j, tracksJid) {
  const g = j || {};
  const showTracks = !!tracksJid;
  const act = showTracks ? 'cuenta' : 'personal';
  const hide = (id) => (id === act ? '' : 'hidden');
  const esc = (x) => (x == null ? '' : String(x)).replace(/"/g, '&quot;');
  const opts = (list, cur) => list.map((o) => `<option value="${o.v}" ${String(o.v) === String(cur ?? '') ? 'selected' : ''}>${o.t}</option>`).join('');
  const sel = (id, list, cur, attrs = '') => `<select id="${id}" ${attrs} class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white">${opts(list, cur)}</select>`;
  const ta = (id, v) => `<textarea id="${id}" rows="2" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">${esc(v)}</textarea>`;
  let pais = '+51', tel = g.telefono || '';
  const m = (g.telefono || '').match(/^(\+\d+)\s*(.*)$/);
  if (m) { pais = m[1]; tel = m[2]; }
  const fotoInner = NJ_FOTO ? `<img src="${NJ_FOTO}" class="h-16 w-16 rounded-lg object-cover">` : '⚽';
  return `
    <div class="mb-4 flex items-center gap-4">
      <div id="nj_fotoBox" class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-slate-300 text-2xl text-slate-300">${fotoInner}</div>
      <label class="cursor-pointer text-sm font-medium text-indigo-600 hover:underline">
        Agregar foto
        <input type="file" accept="image/png,image/jpeg" class="hidden" onchange="njFoto(this)">
        <div class="text-xs font-normal text-slate-400">Opcional · JPG, PNG</div>
      </label>
    </div>
    <div class="flex flex-wrap gap-1 border-b border-slate-200 mb-4 text-xs">
      ${['cuenta', 'tracks', 'pagos'].filter(() => showTracks).map((id) => {
        const lbl = { cuenta: '💳 Cuenta', tracks: '🎯 Tracks', pagos: '🧾 Pagos' }[id];
        return `<button type="button" id="njt_${id}" onclick="njTab('${id}')" class="px-2.5 py-2 -mb-px border-b-2 ${id === act ? 'border-indigo-600 text-indigo-600 font-medium' : 'border-transparent text-slate-500'}">${lbl}</button>`;
      }).join('')}
      <button type="button" id="njt_personal" onclick="njTab('personal')" class="px-2.5 py-2 -mb-px border-b-2 ${act === 'personal' ? 'border-indigo-600 text-indigo-600 font-medium' : 'border-transparent text-slate-500'}">👤 Personal</button>
      <button type="button" id="njt_deportiva" onclick="njTab('deportiva')" class="px-2.5 py-2 -mb-px border-b-2 border-transparent text-slate-500">📕 Deportiva</button>
      <button type="button" id="njt_academia" onclick="njTab('academia')" class="px-2.5 py-2 -mb-px border-b-2 border-transparent text-slate-500">🏫 Por academia</button>
    </div>
    ${showTracks ? `<div id="nj_cuenta" class="${hide('cuenta')}">${estadoCuentaHTML(tracksJid)}</div>` : ''}
    ${showTracks ? `<div id="nj_tracks" class="${hide('tracks')}">${fichaTracksHTML(tracksJid)}</div>` : ''}
    ${showTracks ? `<div id="nj_pagos" class="${hide('pagos')}">${pagosDocsHTML(tracksJid)}</div>` : ''}
    <div id="nj_personal" class="${hide('personal')}">
      <div class="grid grid-cols-2 gap-3">
        ${field('Nombre *', input('nj_nombre', `value="${esc(g.nombre)}"`))}
        ${field('Apellido *', input('nj_apellido', `value="${esc(g.apellido)}"`))}
      </div>
      ${field('Fecha de nacimiento *', input('nj_fnac', `type="date" value="${esc(g.fecha_nacimiento)}"`))}
      ${field('Sexo', sel('nj_sexo', [{ v: 'M', t: 'Masculino' }, { v: 'F', t: 'Femenino' }], g.sexo || 'M'))}
      <div class="grid grid-cols-2 gap-3">
        ${field('Tipo documento', sel('nj_tipodoc', [{ v: '', t: 'Sin especificar' }, { v: 'DNI', t: 'DNI' }, { v: 'CE', t: 'Carné de extranjería' }, { v: 'PAS', t: 'Pasaporte' }], g.tipo_documento))}
        ${field('N° documento', input('nj_numdoc', `value="${esc(g.num_documento)}" placeholder="Número"`))}
      </div>
      ${field('Teléfono', `<div class="flex gap-2">${sel('nj_paistel', PAISES_TEL, pais)}${input('nj_tel', `value="${esc(tel)}" placeholder="999 888 777"`)}</div>`)}
    </div>
    <div id="nj_deportiva" class="hidden">
      ${field('Tipo de sangre', sel('nj_sangre', [{ v: '', t: '—' }, ...['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((x) => ({ v: x, t: x }))], g.tipo_sangre))}
      ${field('Notas médicas', ta('nj_notas', g.notas_medicas))}
      ${field('Lesiones', ta('nj_lesiones', g.historial_lesiones))}
      ${field('Alergias', ta('nj_alergias', g.alergias))}
      ${field('Otras actividades físicas', ta('nj_otras', g.otras_actividades))}
    </div>
    <div id="nj_academia" class="hidden">
      <p class="mb-3 text-xs text-slate-400">Estos valores pueden ser distintos en cada academia donde esté inscrito el jugador.</p>
      <div class="grid grid-cols-3 gap-3">
        ${field('N° camiseta', input('nj_num', `type="number" value="${esc(g.numero_camiseta)}" placeholder="10"`))}
        ${field('Nombre camiseta', input('nj_nomcam', `value="${esc(g.nombre_camiseta)}" placeholder="Nombre"`))}
        ${field('Posición', sel('nj_pos', [{ v: '', t: '—' }, ...['Arquero', 'Defensa', 'Mediocampista', 'Delantero'].map((x) => ({ v: x, t: x }))], g.posicion_juego))}
      </div>
    </div>`;
}

// Contenido de la pestaña Tracks de la ficha (lista + agregar a nuevo track)
function fichaTracksHTML(jid) {
  const insc = DB.inscripciones.filter((i) => i.jugador_id === jid && i.activo);
  const lista = insc.map((i) => {
    const t = track(i.track_id);
    const efect = i.costo_mensual_personalizado ?? t.mensualidad_sugerida;
    const beca = i.costo_mensual_personalizado != null && i.costo_mensual_personalizado !== t.mensualidad_sugerida;
    return `<div class="flex items-center justify-between rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm">
      <div>
        <b>${t.nombre_track}</b> <span class="text-xs text-slate-400">${t.dias_horario || ''} · ${sede(t.sede_id).nombre_sede}</span>
        <div class="text-xs text-slate-400">Últ. fecha de corte: ${i.ultima_fecha_corte ? fmtDMY(i.ultima_fecha_corte) : '— (sin CR generado)'}</div>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-400">S/</span>
        <input type="number" step="0.01" value="${efect}" onchange="editarCostoTrack('${i.id}','${jid}',this.value)"
          class="w-24 rounded border border-slate-300 px-2 py-1 text-sm text-right ${beca ? 'text-indigo-600 font-medium' : ''}">
        ${beca ? `<span class="line-through text-slate-400 text-xs" title="Mensualidad sugerida">${S(t.mensualidad_sugerida)}</span>` : ''}
        <button type="button" onclick="quitarInscripcion('${i.id}','${jid}')" class="text-rose-600 hover:underline text-xs">Quitar</button>
      </div>
    </div>`;
  }).join('') || '<p class="text-xs text-slate-400">Sin tracks asignados. Agrégalo abajo.</p>';

  const yaIds = new Set(insc.map((i) => i.track_id));
  const disp = tracksSede().filter((t) => !yaIds.has(t.id));
  const addForm = disp.length
    ? `<div class="mt-3 rounded-lg bg-slate-50 ring-1 ring-slate-200 p-3">
         <div class="text-xs font-medium text-slate-500 mb-2">Agregar a un nuevo track</div>
         <div class="flex gap-2">
           <select id="nj_addtrack" class="flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm bg-white">
             ${disp.map((t) => `<option value="${t.id}">${t.nombre_track} · ${S(t.mensualidad_sugerida)}</option>`).join('')}
           </select>
           <input id="nj_addcosto" type="number" step="0.01" placeholder="Costo (opc.)" class="w-28 rounded border border-slate-300 px-2 py-1.5 text-sm">
           <button type="button" onclick="agregarInscripcion('${jid}')" class="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">Agregar</button>
         </div>
       </div>`
    : '<p class="mt-3 text-xs text-slate-400">El alumno ya está en todos los tracks de la sede.</p>';
  return `<div class="space-y-2">${lista}</div>${addForm}`;
}
window.renderFichaTracks = (jid) => { if (el('nj_tracks')) el('nj_tracks').innerHTML = fichaTracksHTML(jid); };
window.quitarInscripcion = (iid, jid) => {
  const i = DB.inscripciones.find((x) => x.id === iid);
  if (i) { i.activo = false; toast('Track quitado'); renderFichaTracks(jid); }
};
window.editarCostoTrack = (iid, jid, valor) => {
  const i = DB.inscripciones.find((x) => x.id === iid);
  if (!i) return;
  const t = track(i.track_id);
  const n = parseFloat(valor);
  // null => usa la mensualidad sugerida (sin beca)
  i.costo_mensual_personalizado = (isNaN(n) || n === t.mensualidad_sugerida) ? null : n;
  toast('Mensualidad del track actualizada'); renderFichaTracks(jid);
};
window.agregarInscripcion = (jid) => {
  const tid = val('nj_addtrack'); if (!tid) return;
  const t = track(tid); const j = jugador(jid);
  const costo = val('nj_addcosto') ? num('nj_addcosto') : null;
  let insc = DB.inscripciones.find((x) => x.jugador_id === jid && x.track_id === tid);
  if (insc) { insc.activo = true; insc.costo_mensual_personalizado = costo; }
  else DB.inscripciones.push({ id: uid('i'), jugador_id: jid, track_id: tid, costo_mensual_personalizado: costo, activo: true, fecha_inscripcion: HOY, ultima_fecha_corte: null });
  toast(`Agregado a ${t.nombre_track} (genera su CR desde Estado de cuenta)`); renderFichaTracks(jid);
};

// Estado de cuenta del alumno (CR = recurrentes, CNR = no recurrentes)
function estadoCuentaHTML(jid) {
  const j = jugador(jid);
  const cargos = DB.cargos.filter((c) => c.jugador_id === jid);
  const pagos = DB.pagos.filter((p) => p.jugador_id === jid);
  const saldoC = (c) => c.monto - (c.pagado_monto || 0);
  // Cargos aún no pagados (incluye los de $0 por beca/promo, para que se paguen junto al resto)
  const mostrar = cargos.filter((c) => c.estado !== 'pagado').sort((a, b) => ((a.periodo || '') < (b.periodo || '') ? -1 : 1));
  const totCR = mostrar.filter((c) => c.tipo === 'CR').reduce((s, c) => s + saldoC(c), 0);
  const totCNR = mostrar.filter((c) => c.tipo === 'CNR').reduce((s, c) => s + saldoC(c), 0);
  const saldo = totCR + totCNR;
  const hayPagables = mostrar.length > 0;
  const rows = mostrar.map((c) => {
    const vencido = c.fecha_vencimiento && c.fecha_vencimiento < HOY && saldoC(c) > 0;
    return [
      `${badge(c.tipo, c.tipo === 'CNR' ? 'fuchsia' : 'indigo')} ${descCargo(c)}${c.promo ? ` <span class="text-xs text-emerald-600">· Promo ${c.promo}</span>` : ''}${origenTag(c)}`,
      c.fecha_vencimiento
        ? `<span class="${vencido ? 'text-rose-600 font-medium' : 'text-slate-600'}">${fmtDMY(c.fecha_vencimiento)}</span>${vencido ? ' <span class="text-xs text-rose-500">(vencido)</span>' : ''}`
        : '—',
      saldoC(c) === 0
        ? `<span class="text-emerald-600 text-xs font-medium">${c.gratis ? 'Gratis' : 'Beca'}</span>`
        : S(saldoC(c)),
    ];
  });

  const cnrCat = DB.conceptosCNR.filter((c) => c.activo);
  const inscAct = DB.inscripciones.filter((i) => i.jugador_id === jid && i.activo);
  const firstI = inscAct[0];
  const firstMonto = firstI ? (firstI.costo_mensual_personalizado ?? track(firstI.track_id).mensualidad_sugerida) : 0;
  const ciclos = DB.ciclosPago.filter((c) => c.activo);
  const cicloDef = ciclos.find((c) => c.es_default) || ciclos[0];
  const firstInicio = firstI ? inicioCR(firstI.ultima_fecha_corte) : '';
  const firstFin = (firstI && cicloDef) ? proximoCorte(firstInicio, cicloDef.dia) : '';
  const firstVenc = (firstInicio && cicloDef && cicloDef.dia_venc) ? fechaVencimiento(firstInicio, cicloDef.dia_venc) : '';

  return `
    <div class="mb-4 rounded-xl p-4 ${saldo > 0 ? 'bg-rose-50' : saldo < 0 ? 'bg-emerald-50' : 'bg-slate-50'}">
      <div class="text-xs text-slate-500">Saldo actual</div>
      <div class="text-2xl font-bold ${saldo > 0 ? 'text-rose-600' : saldo < 0 ? 'text-emerald-600' : 'text-slate-700'}">
        ${saldo > 0 ? `Debe ${S(saldo)}` : saldo < 0 ? `A favor ${S(-saldo)}` : 'Al día'}</div>
      <div class="mt-1 text-xs text-slate-500">Pendiente CR: <b>${S(totCR)}</b> · Pendiente CNR: <b>${S(totCNR)}</b></div>
    </div>
    ${hayPagables ? `<div class="mb-3 flex justify-end">
      <button type="button" onclick="formPagoAlumno('${jid}')" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Registrar pago</button>
    </div>` : ''}
    ${rows.length ? table(['Concepto', 'Vence', 'Pendiente'], rows) : '<p class="text-sm text-slate-400 px-1">Sin cargos pendientes de pago. 🎉</p>'}
    <div class="mt-3 space-y-2 rounded-lg bg-slate-50 ring-1 ring-slate-200 p-3">
      <div class="text-xs font-medium text-slate-500">Agregar cargo recurrente (CR) — manual</div>
      ${inscAct.length && ciclos.length ? `
        <div class="flex gap-2">
          <select id="cr_track" onchange="crAutoDatos()" class="flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm bg-white">
            ${inscAct.map((i) => `<option value="${i.id}">${track(i.track_id).nombre_track}</option>`).join('')}
          </select>
          <input id="cr_monto" readonly value="${firstMonto}" title="Monto fijo del track (no editable)"
            class="w-24 rounded border border-slate-300 bg-slate-100 px-2 py-1.5 text-sm text-right text-slate-600">
        </div>
        <div class="flex items-center gap-2">
          <select id="cr_ciclo" onchange="crAutoDatos()" class="rounded border border-slate-300 px-2 py-1.5 text-sm bg-white">
            ${ciclos.map((c) => `<option value="${c.id}" ${c === cicloDef ? 'selected' : ''}>${nombreCiclo(c)}</option>`).join('')}
          </select>
          <span class="text-xs text-slate-500">→ <b id="cr_ciclotxt">Del ${fmtDMY(firstInicio)} al ${fmtDMY(firstFin)}${firstVenc ? ` · vence ${fmtDMY(firstVenc)}` : ''}</b></span>
        </div>
        <input type="hidden" id="cr_inicio" value="${firstInicio}"><input type="hidden" id="cr_fin" value="${firstFin}">
        <div class="flex gap-2">
          <input id="cr_desc" placeholder="Descripción (opc.)" class="flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm">
          <button type="button" onclick="agregarCR('${jid}')" class="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">Agregar</button>
        </div>`
        : (inscAct.length ? '<p class="text-xs text-slate-400">No hay ciclos de pago. Créalos en Configuración → Ciclos de pago.</p>' : '<p class="text-xs text-slate-400">El alumno no tiene tracks. Asígnalo en la pestaña Tracks.</p>')}
      ${inscAct.length && DB.promociones.some((p) => p.activo) ? `<div><button type="button" onclick="formPromo('${jid}')" class="text-xs text-indigo-600 hover:underline">🎁 Aplicar promoción (genera varios CR)</button></div>` : ''}
      <hr class="border-slate-200 my-2">
      <div class="text-xs font-medium text-slate-500">Agregar cargo no recurrente (CNR)</div>
      ${cnrCat.length ? `
        <div class="flex gap-2">
          <select id="cnr_concepto" onchange="cnrAutoPrecio('cnr_concepto','cnr_monto')" class="flex-1 min-w-0 rounded border border-slate-300 px-2 py-1.5 text-sm bg-white">
            ${cnrCat.map((c) => `<option value="${c.id}">${c.nombre}</option>`).join('')}
          </select>
          <input id="cnr_monto" type="number" step="0.01" value="${cnrCat[0].precio || ''}" placeholder="Monto" class="w-24 rounded border border-slate-300 px-2 py-1.5 text-sm text-right">
        </div>
        <div class="flex gap-2">
          <input id="cnr_desc" placeholder="Descripción (opc.)" class="flex-1 min-w-0 rounded border border-slate-300 px-2 py-1.5 text-sm">
          <button type="button" onclick="agregarCNR('${jid}')" class="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">Agregar</button>
        </div>` : '<p class="text-xs text-slate-400">No hay conceptos CNR. Créalos en Configuración → Conceptos CNR.</p>'}
    </div>`;
}
window.renderCuenta = (jid) => { if (el('nj_cuenta')) el('nj_cuenta').innerHTML = estadoCuentaHTML(jid); };
// Al cambiar el track del CR manual: fija el monto y sugiere el ciclo siguiente
window.crAutoDatos = () => {
  const i = DB.inscripciones.find((x) => x.id === el('cr_track').value);
  if (!i) return;
  const t = track(i.track_id);
  el('cr_monto').value = (i.costo_mensual_personalizado ?? t.mensualidad_sugerida);
  const ciclo = DB.ciclosPago.find((c) => c.id === el('cr_ciclo').value);
  const inicio = inicioCR(i.ultima_fecha_corte);
  const fin = proximoCorte(inicio, ciclo ? ciclo.dia : 1);
  const venc = ciclo && ciclo.dia_venc ? fechaVencimiento(inicio, ciclo.dia_venc) : null;
  el('cr_inicio').value = inicio;
  el('cr_fin').value = fin;
  el('cr_ciclotxt').textContent = `Del ${fmtDMY(inicio)} al ${fmtDMY(fin)}${venc ? ` · vence ${fmtDMY(venc)}` : ''}`;
};
window.agregarCR = (jid) => {
  const i = DB.inscripciones.find((x) => x.id === el('cr_track').value);
  if (!i) return;
  const t = track(i.track_id);
  const ciclo = DB.ciclosPago.find((c) => c.id === el('cr_ciclo').value);
  const inicio = el('cr_inicio').value, fin = el('cr_fin').value;
  if (!inicio || !fin) { toast('No se pudo calcular el ciclo'); return; }
  const monto = i.costo_mensual_personalizado ?? t.mensualidad_sugerida;   // fijo, no editable
  const nota = el('cr_desc').value.trim();
  const j = jugador(jid);
  const venc = ciclo && ciclo.dia_venc ? fechaVencimiento(inicio, ciclo.dia_venc) : null;
  const cargo = { id: uid('c'), tutor_id: j.tutor_id, jugador_id: jid, inscripcion_id: i.id, tipo: 'CR', origen: 'manual',
    concepto: t.nombre_track, descripcion: `Del ${fmtDMY(inicio)} al ${fmtDMY(fin)}${nota ? ' · ' + nota : ''}`,
    ciclo_inicio: inicio, ciclo_fin: fin, ciclo_dia: ciclo ? ciclo.dia : null, fecha_vencimiento: venc,
    periodo: inicio.slice(0, 7), monto, pagado_monto: 0, estado: 'por_pagar' };
  DB.cargos.push(cargo);
  i.ultima_fecha_corte = fin;             // actualiza la última fecha de corte del CR
  i.ciclo_dia = ciclo ? ciclo.dia : null; // recuerda el ciclo elegido en la inscripción
  toast(`CR generado · ${t.nombre_track} (corte ${fmtDMY(fin)})`); renderCuenta(jid);
};

// ---------- Aplicar promoción (genera la secuencia de CR) ----------
window.formPromo = (jid) => {
  const insc = DB.inscripciones.filter((i) => i.jugador_id === jid && i.activo);
  const promos = DB.promociones.filter((p) => p.activo);
  if (!insc.length || !promos.length) { toast('Faltan tracks o promociones activas'); return; }
  const j = jugador(jid);
  openModal(`Aplicar promoción · ${nom(j)}`, `
    <form onsubmit="guardarPromoAlumno(event,'${jid}')">
      <div class="grid grid-cols-2 gap-3">
        ${field('Track', select('promo_track', insc.map((i) => ({ v: i.id, t: track(i.track_id).nombre_track })), 'onchange="promoPreview()"'))}
        ${field('Promoción', select('promo_id', promos.map((p) => ({ v: p.id, t: `${p.nombre} · ${p.meses_pagados} pagados + ${p.meses_total - p.meses_pagados} gratis` })), 'onchange="promoPreview()"'))}
      </div>
      ${field('Fecha de matrícula (anclaje)', input('promo_ancla', `type="date" value="${HOY}" onchange="promoPreview()"`))}
      <div class="text-xs font-medium text-slate-500 mb-1">Periodos que se generarán</div>
      <div id="promoPreview" class="rounded-lg ring-1 ring-slate-200 divide-y divide-slate-100 mb-3"></div>
      ${submitBar('Generar promoción')}
    </form>`);
  promoPreview();
};
window.promoPreview = () => {
  const i = DB.inscripciones.find((x) => x.id === el('promo_track').value);
  const promo = DB.promociones.find((p) => p.id === el('promo_id').value);
  const ancla = val('promo_ancla');
  if (!i || !promo || !ancla) { el('promoPreview').innerHTML = ''; return; }
  const t = track(i.track_id);
  const precio = i.costo_mensual_personalizado ?? t.mensualidad_sugerida;
  const periodos = periodosPromo(ancla, promo);
  const sig = isoAddDays(periodos[periodos.length - 1].fin, 1);
  el('promoPreview').innerHTML = periodos.map((p, idx) => `
    <div class="flex items-center justify-between px-3 py-2 text-sm">
      <span>${idx + 1}. Del ${fmtDMY(p.inicio)} al ${fmtDMY(p.fin)}</span>
      <span class="font-medium ${p.gratis ? 'text-emerald-600' : ''}">${p.gratis ? 'Gratis' : S(precio)}</span>
    </div>`).join('') +
    `<div class="px-3 py-2 text-xs text-slate-500 bg-slate-50">Tras la promo, el siguiente CR sigue el ciclo general desde ${fmtDMY(sig)}.</div>`;
};
window.guardarPromoAlumno = (e, jid) => {
  e.preventDefault();
  const i = DB.inscripciones.find((x) => x.id === el('promo_track').value);
  const promo = DB.promociones.find((p) => p.id === el('promo_id').value);
  const ancla = val('promo_ancla');
  if (!i || !promo || !ancla) return;
  const t = track(i.track_id);
  const precio = i.costo_mensual_personalizado ?? t.mensualidad_sugerida;
  const j = jugador(jid);
  const cicloDef = DB.ciclosPago.find((c) => c.es_default && c.activo) || DB.ciclosPago.find((c) => c.activo);
  const diaVenc = cicloDef ? cicloDef.dia_venc : null;
  periodosPromo(ancla, promo).forEach((p) => {
    const monto = p.gratis ? 0 : precio;
    const cargo = { id: uid('c'), tutor_id: j.tutor_id, jugador_id: jid, inscripcion_id: i.id, tipo: 'CR', origen: 'promo',
      concepto: t.nombre_track, descripcion: `Del ${fmtDMY(p.inicio)} al ${fmtDMY(p.fin)}`,
      ciclo_inicio: p.inicio, ciclo_fin: p.fin, periodo: p.inicio.slice(0, 7),
      fecha_vencimiento: diaVenc ? fechaVencimiento(p.inicio, diaVenc) : null,
      promo: promo.nombre, gratis: !!p.gratis,
      monto, pagado_monto: 0, estado: 'por_pagar' };
    DB.cargos.push(cargo);
  });
  const periodos = periodosPromo(ancla, promo);
  i.ultima_fecha_corte = periodos[periodos.length - 1].fin;
  closeModal(); toast(`Promoción ${promo.nombre} aplicada · ${periodos.length} CR generados`); renderCuenta(jid);
};
// ---------- Generar CR por ciclo (masivo) + log de procesos ----------
function inscElegiblesCiclo(dia, corteIso, sedeId) {
  return DB.inscripciones.filter((i) => i.activo && i.ciclo_dia === dia
    && jugador(i.jugador_id) && jugador(i.jugador_id).sede_id === sedeId
    && i.ultima_fecha_corte && i.ultima_fecha_corte < corteIso);
}
window.formGenerarCR = () => {
  const ciclos = DB.ciclosPago.filter((c) => c.activo);
  if (!ciclos.length) { toast('No hay ciclos de pago'); return; }
  const cicloDef = ciclos.find((c) => c.es_default) || ciclos[0];
  openModal('Generar CR por ciclo', `
    <form onsubmit="guardarGenerarCR(event)">
      <p class="text-xs text-slate-500 mb-3">Genera las mensualidades del ciclo para los alumnos de <b>${sede(SEDE_ACTUAL).nombre_sede}</b> cuyo último corte sea anterior a la fecha de corte indicada.</p>
      ${field('Ciclo', select('gen_ciclo', ciclos.map((c) => ({ v: c.id, t: nombreCiclo(c) })), 'onchange="genCRAuto()"'))}
      <div class="grid grid-cols-2 gap-3">
        ${field('Fecha de corte (período)', input('gen_corte', 'type="date" onchange="genCRPreview()"'))}
        ${field('Fecha de vencimiento', input('gen_venc', 'type="date"'))}
      </div>
      <div id="genPreview" class="rounded-lg bg-slate-50 ring-1 ring-slate-200 p-3 text-sm mb-3"></div>
      ${submitBar('Generar CR')}
    </form>`);
  el('gen_ciclo').value = cicloDef.id;
  genCRAuto();
};
window.genCRAuto = () => {
  const ciclo = DB.ciclosPago.find((c) => c.id === el('gen_ciclo').value);
  if (!ciclo) return;
  const cortes = DB.inscripciones.filter((i) => i.activo && i.ciclo_dia === ciclo.dia
    && jugador(i.jugador_id) && jugador(i.jugador_id).sede_id === SEDE_ACTUAL && i.ultima_fecha_corte)
    .map((i) => i.ultima_fecha_corte).sort();
  const base = cortes.length ? isoAddDays(cortes[cortes.length - 1], 1) : HOY;
  const corte = proximoCorte(base, ciclo.dia);
  el('gen_corte').value = corte;
  el('gen_venc').value = ciclo.dia_venc ? fechaVencimiento(base, ciclo.dia_venc) : corte;
  genCRPreview();
};
window.genCRPreview = () => {
  const ciclo = DB.ciclosPago.find((c) => c.id === el('gen_ciclo').value);
  const corte = val('gen_corte');
  if (!ciclo || !corte) { el('genPreview').innerHTML = ''; return; }
  const eleg = inscElegiblesCiclo(ciclo.dia, corte, SEDE_ACTUAL);
  const total = eleg.reduce((s, i) => s + (i.costo_mensual_personalizado ?? track(i.track_id).mensualidad_sugerida), 0);
  el('genPreview').innerHTML = eleg.length
    ? `<b>${eleg.length}</b> CR a generar · total <b>${S(total)}</b><div class="text-xs text-slate-400 mt-1">Corte ${fmtDMY(corte)} · vence ${fmtDMY(val('gen_venc'))}</div>`
    : '<span class="text-slate-400">No hay inscripciones elegibles para este ciclo/corte.</span>';
};
window.guardarGenerarCR = (e) => {
  e.preventDefault();
  const ciclo = DB.ciclosPago.find((c) => c.id === el('gen_ciclo').value);
  const corte = val('gen_corte'), venc = val('gen_venc');
  if (!ciclo || !corte || !venc) { toast('Completa ciclo, corte y vencimiento'); return; }
  const eleg = inscElegiblesCiclo(ciclo.dia, corte, SEDE_ACTUAL);
  if (!eleg.length) { toast('No hay inscripciones elegibles'); return; }
  const procId = uid('proc');
  const cargoIds = []; let total = 0;
  eleg.forEach((i) => {
    const t = track(i.track_id), j = jugador(i.jugador_id);
    const inicio = isoAddDays(i.ultima_fecha_corte, 1);
    const monto = i.costo_mensual_personalizado ?? t.mensualidad_sugerida;
    const id = uid('c');
    const cargo = { id, tutor_id: j.tutor_id, jugador_id: j.id, inscripcion_id: i.id, tipo: 'CR', origen: 'proceso', proceso_id: procId,
      concepto: t.nombre_track, descripcion: `Del ${fmtDMY(inicio)} al ${fmtDMY(corte)}`,
      ciclo_inicio: inicio, ciclo_fin: corte, ciclo_dia: ciclo.dia, fecha_vencimiento: venc,
      periodo: corte.slice(0, 7), monto, pagado_monto: 0, estado: 'por_pagar' };
    DB.cargos.push(cargo);
    i.ultima_fecha_corte = corte;
    cargoIds.push(id); total += monto;
  });
  DB.procesosCR.push({ id: procId, fecha: HOY, ciclo_dia: ciclo.dia, corte, vencimiento: venc, sede_id: SEDE_ACTUAL, cargo_ids: cargoIds, total });
  closeModal(); toast(`${cargoIds.length} CR generados · ${S(total)}`); go('tesoreria');
};
window.verProcesoCR = (id) => {
  const p = DB.procesosCR.find((x) => x.id === id); if (!p) return;
  openModal('Detalle del proceso de facturación', `
    <p class="text-xs text-slate-500 mb-3">Ciclo al ${p.ciclo_dia} · corte ${fmtDMY(p.corte)} · vence ${fmtDMY(p.vencimiento)} · generado ${fmtDMY(p.fecha)}</p>
    ${table(['Alumno', 'Track', 'Periodo', 'Monto'], p.cargo_ids.map((cid) => {
      const c = DB.cargos.find((x) => x.id === cid);
      if (!c) return ['—', '—', '—', '—'];
      const j = jugador(c.jugador_id);
      return [j ? nom(j) : '—', c.concepto, c.descripcion, S(c.monto)];
    }))}
    <div class="mt-2 text-right text-sm">Total: <b>${S(p.total)}</b> · ${p.cargo_ids.length} CR</div>`);
};

window.agregarCNR = (jid) => {
  const j = jugador(jid);
  const cn = DB.conceptosCNR.find((c) => c.id === el('cnr_concepto').value);
  const monto = parseFloat(el('cnr_monto').value) || 0;
  if (monto <= 0) { toast('Ingresa un monto'); return; }
  const desc = el('cnr_desc').value.trim();
  DB.cargos.push({ id: uid('c'), tutor_id: j.tutor_id, jugador_id: jid, tipo: 'CNR', concepto: cn ? cn.nombre : 'Cargo', descripcion: desc, periodo: PERIODO,
    monto, pagado_monto: 0, estado: 'por_pagar' });
  toast('Cargo CNR agregado'); renderCuenta(jid);
};
// Registrar pago: selecciona CR/CNR pendientes, medio, N° operación y voucher
window.formPagoAlumno = (jid) => {
  PAGO_VOUCHER = null;
  const j = jugador(jid);
  const pend = DB.cargos.filter((c) => c.jugador_id === jid && c.estado !== 'pagado')
    .sort((a, b) => ((a.periodo || '') < (b.periodo || '') ? -1 : 1));
  if (!pend.length) { toast('No hay cargos pendientes de pago'); return; }
  const medios = DB.mediosPago.filter((m) => m.activo);
  openModal(`Registrar pago · ${nom(j)}`, `
    <form onsubmit="guardarPagoAlumno(event,'${jid}')">
      <p class="text-xs text-slate-500 mb-2">Marca los cargos a pagar. Desmarca los que no entran en este pago.</p>
      <div class="rounded-lg ring-1 ring-slate-200 divide-y divide-slate-100 mb-3 max-h-52 overflow-y-auto">
        ${pend.map((c) => `<label class="flex items-center gap-2.5 px-3 py-3 text-sm cursor-pointer active:bg-slate-50">
          <input type="checkbox" class="pgChk h-5 w-5 accent-indigo-600 shrink-0" value="${c.id}" data-monto="${c.monto - (c.pagado_monto || 0)}" checked onchange="pagoTotal()">
          ${badge(c.tipo, c.tipo === 'CNR' ? 'fuchsia' : 'indigo')}
          <span class="flex-1 min-w-0">${descCargo(c)}</span>
          <span class="font-medium shrink-0">${S(c.monto - (c.pagado_monto || 0))}</span>
        </label>`).join('')}
      </div>
      <div class="mb-3 flex items-center justify-between px-1">
        <span class="text-sm text-slate-500">Total a pagar</span>
        <span id="pgTotal" class="text-xl font-bold text-slate-800">S/ 0.00</span>
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${field('Medio de pago', select('pg_medio', medios.map((m) => ({ v: m.id, t: m.nombre })), 'onchange="pgVoucher()"'))}
        ${field('N° de operación', input('pg_op', 'placeholder="Ej: 000123456"'))}
      </div>
      <div id="pgVoucherBox">${field('Voucher del pago', input('pg_voucher', 'type="file" accept="image/*" onchange="pgVoucherFile(this)"'))}</div>
      ${submitBar('Registrar pago')}
    </form>`);
  pagoTotal();
  pgVoucher();
};
window.pagoTotal = () => {
  let t = 0;
  document.querySelectorAll('.pgChk:checked').forEach((c) => { t += parseFloat(c.dataset.monto) || 0; });
  if (el('pgTotal')) el('pgTotal').textContent = S(t);
};
// Voucher obligatorio salvo efectivo
window.pgVoucher = () => {
  const m = DB.mediosPago.find((x) => x.id === val('pg_medio'));
  const efectivo = m && m.nombre.toLowerCase() === 'efectivo';
  if (el('pgVoucherBox')) el('pgVoucherBox').style.display = efectivo ? 'none' : '';
};
window.pgVoucherFile = (inp) => {
  const f = inp.files && inp.files[0];
  if (!f) { PAGO_VOUCHER = null; return; }
  const r = new FileReader();
  r.onload = () => { PAGO_VOUCHER = r.result; };
  r.readAsDataURL(f);
};
window.guardarPagoAlumno = (e, jid) => {
  e.preventDefault();
  const sel = [...document.querySelectorAll('.pgChk:checked')].map((c) => c.value);
  if (!sel.length) { toast('Selecciona al menos un cargo'); return; }
  const medio = DB.mediosPago.find((m) => m.id === val('pg_medio'));
  const efectivo = medio && medio.nombre.toLowerCase() === 'efectivo';
  if (!efectivo && !PAGO_VOUCHER) { toast('Sube el voucher del pago'); return; }
  const j = jugador(jid);
  const detalle = sel.map((cid) => {
    const c = DB.cargos.find((x) => x.id === cid);
    return { cargo_id: cid, concepto: descCargo(c), cat: c.tipo === 'CR' ? 'Mensualidades' : (c.concepto || 'Otros'), tipo: c.tipo, monto: c.monto - (c.pagado_monto || 0) };
  });
  const total = detalle.reduce((s, d) => s + d.monto, 0);
  // Marcar los cargos como Pagados
  sel.forEach((cid) => { const c = DB.cargos.find((x) => x.id === cid); c.pagado_monto = c.monto; c.estado = 'pagado'; });
  DB.pagos.push({ id: uid('pg'), jugador_id: jid, tutor_id: j.tutor_id, sede_id: SEDE_ACTUAL, fecha: HOY,
    medio: medio ? medio.nombre : '', num_operacion: val('pg_op'), voucher_url: PAGO_VOUCHER,
    total, detalle, estado: 'pendiente' });   // Pendiente Aprobación (Tesorería la aprueba)
  closeModal();
  toast(`✓ Pago registrado · ${S(total)}`);
  formEditarAlumno(jid);   // reabre la ficha del alumno...
  njTab('pagos');          // ...en la pestaña Pagos, con el documento recién creado
};

// ---------- Aprobación de pagos (Tesorería) ----------
function pagoAprobCard(p) {
  const j = p.jugador_id ? jugador(p.jugador_id) : null;
  return `<div class="rounded-xl bg-white ring-1 ring-slate-200 p-3">
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <div class="font-medium truncate">${j ? nom(j) : 'DNI ' + ((tutor(p.tutor_id) || {}).dni_tutor || '—')}</div>
        <div class="text-xs text-slate-400">${p.medio || '—'}${p.num_operacion ? ' · Op. ' + p.num_operacion : ''} · ${fmtDMY(p.fecha)}${p.voucher_url ? ' · voucher ✔' : ''}</div>
      </div>
      <div class="text-lg font-bold text-slate-800">${S(p.total ?? p.monto ?? 0)}</div>
    </div>
    <div class="mt-2 border-t border-slate-100 pt-2 space-y-1">
      ${(p.detalle || []).map((d) => `<div class="flex justify-between text-xs"><span>${badge(d.tipo, d.tipo === 'CNR' ? 'fuchsia' : 'indigo')} ${d.concepto}</span><span>${S(d.monto)}</span></div>`).join('')}
    </div>
    <div class="mt-2 flex justify-end gap-3 items-center">
      ${p.voucher_url ? `<button onclick="verComprobante('${p.id}')" class="text-indigo-600 hover:underline text-sm">🖼️ Ver comprobante</button>` : '<span class="text-xs text-amber-600">sin comprobante</span>'}
      <button onclick="gestionarPago('${p.id}')" class="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">Aprobar / Rechazar</button>
    </div>
  </div>`;
}
window.gestionarPago = (id) => {
  const p = DB.pagos.find((x) => x.id === id); if (!p) return;
  const j = p.jugador_id ? jugador(p.jugador_id) : null;
  const medios = DB.mediosPago.filter((m) => m.activo);
  openModal('Aprobar / Rechazar pago', `
    <p class="text-sm mb-1">${j ? nom(j) : ''} · <b>${S(p.total ?? p.monto ?? 0)}</b></p>
    <p class="text-xs text-slate-400 mb-3">${p.num_operacion ? 'Op. ' + p.num_operacion + ' · ' : ''}${fmtDMY(p.fecha)}${p.voucher_url ? ' · voucher adjunto' : ' · sin voucher'}</p>
    <div class="rounded-lg ring-1 ring-slate-200 divide-y divide-slate-100 mb-3">
      ${(p.detalle || []).map((d) => `<div class="flex justify-between px-3 py-2 text-sm"><span>${badge(d.tipo, d.tipo === 'CNR' ? 'fuchsia' : 'indigo')} ${d.concepto}</span><span>${S(d.monto)}</span></div>`).join('')}
    </div>
    ${voucherSrc(p)
      ? `<div class="mb-3"><div class="text-xs font-medium text-slate-500 mb-1">Comprobante</div><img src="${voucherSrc(p)}" onclick="verComprobante('${id}')" class="w-full max-h-52 object-contain rounded-lg ring-1 ring-slate-200 cursor-zoom-in" title="Clic para ampliar"></div>`
      : '<p class="text-xs text-amber-600 mb-3">⚠️ Este pago no tiene comprobante adjunto.</p>'}
    ${field('Medio de pago', select('ap_medio', medios.map((m) => ({ v: m.nombre, t: m.nombre })), ''))}
    <div class="mt-3 flex items-center justify-between gap-2">
      <button type="button" onclick="rechazarPagoDoc('${id}')" class="rounded-lg px-4 py-2.5 text-sm font-medium text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50">Rechazar</button>
      <button type="button" onclick="aprobarPagoDoc('${id}')" class="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">Aprobar</button>
    </div>`);
  if (el('ap_medio')) el('ap_medio').value = p.medio || (medios[0] && medios[0].nombre) || '';
};
window.aprobarPagoDoc = (id) => {
  const p = DB.pagos.find((x) => x.id === id); if (!p || p.estado !== 'pendiente') return; // sin reversión: solo pendientes
  p.medio = val('ap_medio') || p.medio;
  p.estado = 'aprobado'; p.fecha_aprobacion = HOY;
  closeModal(); toast('Pago aprobado'); go('aprobar');
};
window.rechazarPagoDoc = (id) => {
  const p = DB.pagos.find((x) => x.id === id); if (!p || p.estado !== 'pendiente') return; // sin reversión: solo pendientes
  p.medio = val('ap_medio') || p.medio;
  p.estado = 'rechazado'; p.fecha_rechazo = HOY;
  revertirCargosPago(p);   // los CR/CNR vuelven a Pendiente de Pago
  closeModal(); toast('Pago rechazado · cargos vueltos a pendientes'); go('aprobar');
};
function revertirCargosPago(p) {
  (p.detalle || []).forEach((d) => {
    const c = DB.cargos.find((x) => x.id === d.cargo_id);
    if (!c) return;
    c.pagado_monto = Math.max(0, (c.pagado_monto || 0) - d.monto);
    c.estado = (c.monto > 0 && c.pagado_monto >= c.monto) ? 'pagado' : (c.pagado_monto > 0 ? 'parcial' : 'por_pagar');
  });
}
const voucherSrc = (p) => p && p.voucher_url ? (String(p.voucher_url).startsWith('data:') ? p.voucher_url : VOUCHER_DEMO) : null;
window.verComprobante = (id) => {
  const p = DB.pagos.find((x) => x.id === id); if (!p) return;
  const src = voucherSrc(p);
  if (!src) { toast('Este pago no tiene comprobante'); return; }
  openModal('Comprobante de pago', `
    <div class="text-center">
      <img src="${src}" class="mx-auto max-h-[70vh] rounded-lg ring-1 ring-slate-200">
      <div class="mt-2 text-xs text-slate-400">${p.medio || ''}${p.num_operacion ? ' · Op. ' + p.num_operacion : ''} · ${fmtDMY(p.fecha)}</div>
    </div>`);
};

// Documentos de pago del alumno
function pagosDocsHTML(jid) {
  const pagos = DB.pagos.filter((p) => p.jugador_id === jid).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  if (!pagos.length) return '<p class="text-sm text-slate-400">Sin documentos de pago aún.</p>';
  return pagos.map((p) => `
    <div class="rounded-xl ring-1 ring-slate-200 p-4 mb-3">
      <div class="flex items-start justify-between">
        <div>
          <div class="font-semibold">Documento de pago · ${fmtDMY(p.fecha)}</div>
          <div class="text-xs text-slate-500">${p.medio || ''}${p.num_operacion ? ` · Op. ${p.num_operacion}` : ''}${p.voucher_url ? ' · voucher ✔' : ''}</div>
        </div>
        <div class="text-lg font-bold text-emerald-600">${S(p.total ?? p.monto ?? 0)}</div>
      </div>
      <div class="mt-2 border-t border-slate-100 pt-2 space-y-1">
        ${(p.detalle || []).map((d) => `<div class="flex justify-between text-sm">
          <span>${badge(d.tipo, d.tipo === 'CNR' ? 'fuchsia' : 'indigo')} ${d.concepto}</span>
          <span>${S(d.monto)}</span></div>`).join('') || '<div class="text-xs text-slate-400">Sin detalle de cargos</div>'}
      </div>
    </div>`).join('');
}

// Documento descargable del estado de cuenta (con cabecera de la sede)
window.formDocumentoCuenta = (jid) => {
  const j = jugador(jid);
  const sd = sede(j.sede_id);
  const a = DB.academia;
  const saldoC = (c) => c.monto - (c.pagado_monto || 0);
  const pend = DB.cargos.filter((c) => c.jugador_id === jid && saldoC(c) > 0)
    .sort((x, y) => ((x.periodo || '') < (y.periodo || '') ? -1 : 1));
  const total = pend.reduce((s, c) => s + saldoC(c), 0);
  const arch = nom(j).replace(/\s+/g, '_');
  openModal('Estado de cuenta', `
    <div id="docCuenta" class="bg-white">
      ${sd && sd.cabecera_url
        ? `<img src="${sd.cabecera_url}" class="w-full block object-cover">`
        : `<div class="bg-indigo-600 text-white px-4 py-5 text-center"><div class="text-lg font-bold">${a.nombre_academia}</div><div class="text-sm opacity-80">${sd ? sd.nombre_sede : ''}</div></div>`}
      <div class="px-4 py-4">
        <div class="flex items-start justify-between mb-3">
          <div>
            <div class="text-[11px] uppercase tracking-wide text-slate-400">Alumno</div>
            <div class="font-semibold text-slate-800">${nom(j)}</div>
            <div class="text-xs text-slate-400">Categoría ${anio(j.fecha_nacimiento)}${sd ? ' · ' + sd.nombre_sede : ''}</div>
          </div>
          <div class="text-right">
            <div class="text-[11px] uppercase tracking-wide text-slate-400">Fecha</div>
            <div class="text-sm text-slate-700">${fmtDMY(HOY)}</div>
          </div>
        </div>
        <div class="text-sm font-semibold text-slate-700 mb-1">Estado de cuenta — cargos pendientes</div>
        <table class="w-full text-sm border-t border-slate-200">
          <thead><tr class="text-left text-slate-500"><th class="py-1.5 font-medium">Concepto</th><th class="py-1.5 font-medium text-center">Vence</th><th class="py-1.5 font-medium text-right">Monto</th></tr></thead>
          <tbody>
            ${pend.length ? pend.map((c) => {
              const vencido = c.fecha_vencimiento && c.fecha_vencimiento < HOY;
              return `<tr class="border-t border-slate-100">
                <td class="py-1.5 pr-2">${c.tipo} · ${descCargo(c)}</td>
                <td class="py-1.5 text-center ${vencido ? 'text-rose-600 font-medium' : 'text-slate-500'}">${c.fecha_vencimiento ? fmtDMY(c.fecha_vencimiento) : '—'}</td>
                <td class="py-1.5 text-right">${S(saldoC(c))}</td></tr>`;
            }).join('') : '<tr><td colspan="3" class="py-3 text-center text-slate-400">Sin cargos pendientes.</td></tr>'}
          </tbody>
          <tfoot><tr class="border-t-2 border-slate-300 font-bold"><td class="py-2" colspan="2">Total a pagar</td><td class="py-2 text-right text-rose-600">${S(total)}</td></tr></tfoot>
        </table>
        ${sd && sd.telefono_coordinador ? `<div class="mt-3 text-xs text-slate-400">Consultas: ${sd.telefono_coordinador}</div>` : ''}
      </div>
    </div>
    <div class="flex flex-wrap justify-end gap-2 mt-3">
      <button onclick="descargarDocCuenta('${arch}')" class="rounded-lg bg-white ring-1 ring-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">📥 Descargar</button>
      <button onclick="compartirDocCuenta('${arch}')" class="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">📲 Compartir</button>
    </div>`);
};
function docCanvas() { return html2canvas(el('docCuenta'), { scale: 2, backgroundColor: '#ffffff', useCORS: true }); }
window.descargarDocCuenta = async (nombre) => {
  if (typeof html2canvas === 'undefined') { toast('No se pudo cargar el generador de imagen'); return; }
  const canvas = await docCanvas();
  const link = document.createElement('a');
  link.download = `estado_cuenta_${nombre}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
window.compartirDocCuenta = async (nombre) => {
  if (typeof html2canvas === 'undefined') { toast('No se pudo cargar el generador de imagen'); return; }
  const canvas = await docCanvas();
  canvas.toBlob(async (blob) => {
    const file = new File([blob], `estado_cuenta_${nombre}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Estado de cuenta' }); } catch (e) { /* cancelado */ }
    } else {
      const link = document.createElement('a'); link.download = file.name; link.href = canvas.toDataURL('image/png'); link.click();
      toast('Imagen descargada · adjúntala en WhatsApp');
    }
  }, 'image/png');
};

// Ficha / mantenimiento de alumno (editar)
window.formEditarAlumno = (jid) => {
  const j = jugador(jid);
  if (!j) return;
  NJ_FOTO = j.foto_url || null;
  openModal(nom(j), `
    <form onsubmit="guardarEdicionAlumno(event,'${jid}')">
      <p class="mb-3 text-xs text-slate-500">Categoría <b>${anio(j.fecha_nacimiento)}</b> (inmutable)
        · Estado: ${badge(j.estado_alumno === 'activo' ? 'Activo' : 'Baja', j.estado_alumno === 'activo' ? 'emerald' : 'slate')}</p>
      ${njFormBody(j, jid)}
      <div class="sticky bottom-0 -mx-5 md:-mx-6 -mb-5 mt-4 flex items-center justify-between gap-2 border-t border-slate-200 bg-white px-5 md:px-6 py-3">
        <button type="button" onclick="toggleBajaAlumno('${jid}')"
          class="rounded-lg px-3 py-2 text-sm ${j.estado_alumno === 'activo' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}">
          ${j.estado_alumno === 'activo' ? 'Dar de baja' : 'Reactivar'}</button>
        <div class="flex gap-2">
          <button type="button" onclick="closeModal()" class="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancelar</button>
          <button type="submit" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Guardar</button>
        </div>
      </div>
    </form>`);
};
window.guardarEdicionAlumno = (e, jid) => {
  e.preventDefault();
  if (!val('nj_nombre') || !val('nj_apellido') || !val('nj_fnac')) { toast('Completa nombre, apellido y fecha'); njTab('personal'); return; }
  const j = jugador(jid);
  Object.assign(j, {
    nombre: val('nj_nombre'), apellido: val('nj_apellido'), fecha_nacimiento: val('nj_fnac'),
    sexo: val('nj_sexo') || null, tipo_documento: val('nj_tipodoc') || null, num_documento: val('nj_numdoc') || null,
    telefono: `${val('nj_paistel')} ${val('nj_tel')}`.trim(), foto_url: NJ_FOTO,
    tipo_sangre: val('nj_sangre') || null, notas_medicas: val('nj_notas') || null, historial_lesiones: val('nj_lesiones') || null,
    alergias: val('nj_alergias') || null, otras_actividades: val('nj_otras') || null,
    numero_camiseta: val('nj_num') ? num('nj_num') : null, nombre_camiseta: val('nj_nomcam') || null, posicion_juego: val('nj_pos') || null,
  });
  toast('Ficha guardada');
  njTab('cuenta');                    // tras guardar, muestra la pestaña Cuenta (no cierra)
  if (TRACK_SEL) renderTrackRows();   // refresca la pantalla detrás
  else if (SCREEN === 'alumnos') renderAlumnosList();
};
window.toggleBajaAlumno = (jid) => {
  const j = jugador(jid);
  j.estado_alumno = j.estado_alumno === 'activo' ? 'baja' : 'activo';
  closeModal(); toast(j.estado_alumno === 'baja' ? 'Alumno dado de baja' : 'Alumno reactivado');
  if (TRACK_SEL) renderTrackRows(); else go(SCREEN);
};

window.njTab = (name) => {
  ['tracks', 'cuenta', 'pagos', 'personal', 'deportiva', 'academia'].forEach((s) => {
    const sec = el('nj_' + s);
    if (sec) sec.classList.toggle('hidden', s !== name);
    const btn = el('njt_' + s);
    if (btn) btn.className = `px-2.5 py-2 -mb-px border-b-2 text-xs ${s === name ? 'border-indigo-600 text-indigo-600 font-medium' : 'border-transparent text-slate-500'}`;
  });
};

window.njFoto = (inp) => {
  const f = inp.files && inp.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => { NJ_FOTO = r.result; el('nj_fotoBox').innerHTML = `<img src="${NJ_FOTO}" class="h-16 w-16 rounded-lg object-cover">`; };
  r.readAsDataURL(f);
};

window.guardarNuevoJugador = (e, tid) => {
  e.preventDefault();
  if (!val('nj_nombre') || !val('nj_apellido') || !val('nj_fnac')) {
    toast('Completa nombre, apellido y fecha de nacimiento'); njTab('personal'); return;
  }
  const t = track(tid);
  // Tutor responsable: reusar por documento o crear uno nuevo
  const doc = val('nj_numdoc');
  const tel = `${val('nj_paistel')} ${val('nj_tel')}`.trim();
  let tut = doc ? DB.tutores.find((x) => x.dni_tutor === doc && tutoresSede().has(x.id)) : null;
  if (!tut) {
    tut = { id: uid('tu'), dni_tutor: doc || `S/D-${_seq}`, telefono_celular: tel, email_tutor: null, perfil_reclamado: false };
    DB.tutores.push(tut);
  }
  const j = { id: uid('j'), tutor_id: tut.id, sede_id: SEDE_ACTUAL,
    nombre: val('nj_nombre'), apellido: val('nj_apellido'), fecha_nacimiento: val('nj_fnac'),
    sexo: val('nj_sexo') || null, tipo_documento: val('nj_tipodoc') || null, num_documento: doc || null,
    telefono: tel, foto_url: NJ_FOTO,
    tipo_sangre: val('nj_sangre') || null, notas_medicas: val('nj_notas') || null,
    historial_lesiones: val('nj_lesiones') || null, alergias: val('nj_alergias') || null,
    otras_actividades: val('nj_otras') || null,
    numero_camiseta: val('nj_num') ? num('nj_num') : null, nombre_camiseta: val('nj_nomcam') || null,
    posicion_juego: val('nj_pos') || null, estado_alumno: 'activo', fecha_registro: HOY, atributos: null };
  DB.jugadores.push(j);
  DB.inscripciones.push({ id: uid('i'), jugador_id: j.id, track_id: tid, costo_mensual_personalizado: null, activo: true, fecha_inscripcion: HOY, ultima_fecha_corte: null });
  renderTrackRows();                                   // refresca el detalle del track detrás
  toast(`${nom(j)} creado · agrégale sus cargos`);
  formEditarAlumno(j.id);                              // abre la ficha en la pestaña Cuenta
};

window.formAgregarExistente = (tid) => {
  const t = track(tid);
  const yaIds = new Set(DB.inscripciones.filter((i) => i.track_id === tid && i.activo).map((i) => i.jugador_id));
  const disp = alumnosSede().filter((j) => !yaIds.has(j.id));
  openModal('Agregar alumno existente', `
    <form onsubmit="guardarAgregarAlumno(event,'${tid}')">
      <p class="mb-3 text-xs text-slate-500">Track: <b>${t.nombre_track}</b> · mensualidad sugerida ${S(t.mensualidad_sugerida)}</p>
      ${disp.length
        ? field('Alumno', select('f_al', disp.map((j) => ({ v: j.id, t: `${nom(j)} · Cat. ${anio(j.fecha_nacimiento)}` }))))
        : '<p class="text-sm text-rose-500 mb-3">No hay alumnos disponibles en la sede. Usa “Registro cero fricción” en Alumnos.</p>'}
      ${field('Costo mensual personalizado (opcional)', input('f_costo', 'type="number" step="0.01" placeholder="vacío = usa la mensualidad sugerida"'))}
      ${disp.length ? submitBar('Agregar')
        : `<div class="flex justify-end"><button type="button" onclick="closeModal()" class="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cerrar</button></div>`}
    </form>`);
};
window.guardarAgregarAlumno = (e, tid) => {
  e.preventDefault();
  const jid = val('f_al'); if (!jid) return;
  const t = track(tid);
  const j = jugador(jid);
  const costo = val('f_costo') ? num('f_costo') : null;
  DB.inscripciones.push({ id: uid('i'), jugador_id: jid, track_id: tid, costo_mensual_personalizado: costo, activo: true, fecha_inscripcion: HOY, ultima_fecha_corte: null });
  closeModal(); toast(`${nom(j)} agregado al track`); renderTrackRows();
};

// =====================================================================
// MODALES Y FORMULARIOS
// =====================================================================
function openModal(title, bodyHtml) {
  el('modalTitle').textContent = title;
  el('modalBody').innerHTML = bodyHtml;
  el('modalRoot').classList.remove('hidden');
}
window.closeModal = () => el('modalRoot').classList.add('hidden');

function toast(msg) {
  const t = el('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.add('hidden'), 2600);
}

// Helpers de campos
const field = (label, inner) => `
  <label class="block mb-3">
    <span class="block text-xs font-medium text-slate-500 mb-1">${label}</span>
    ${inner}
  </label>`;
const input = (id, attrs = '') =>
  `<input id="${id}" ${attrs} class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none">`;
const select = (id, opts, attrs = '') =>
  `<select id="${id}" ${attrs} class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm bg-white">
     ${opts.map((o) => `<option value="${o.v}">${o.t}</option>`).join('')}</select>`;
const submitBar = (txt = 'Guardar') => `
  <div class="sticky bottom-0 -mx-5 md:-mx-6 -mb-5 mt-4 flex justify-end gap-2 border-t border-slate-200 bg-white px-5 md:px-6 py-3">
    <button type="button" onclick="closeModal()" class="rounded-lg px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100">Cancelar</button>
    <button type="submit" class="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">${txt}</button>
  </div>`;
const val = (id) => (el(id) ? el(id).value.trim() : '');
const num = (id) => parseFloat(val(id)) || 0;

// ---------- Nuevo track (con break-even en vivo) ----------
let TRACK_HORARIOS = {};                       // { 'Mar': {ini,fin}, ... }
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

window.formTrack = () => {
  TRACK_HORARIOS = {};
  const coaches = DB.staff.filter((s) => s.rol === 'profesor' || s.rol === 'coordinador');
  openModal('Nuevo track', `
    <form onsubmit="guardarTrack(event)">
      <p class="mb-4 text-xs text-slate-500">Sede: <b class="text-slate-700">${sede(SEDE_ACTUAL).nombre_sede}</b></p>
      ${field('Nombre del track', input('f_nombre', 'required placeholder="Ej: Sub-12 Mañana"'))}
      ${field('Coach', select('f_coach', [{ v: '', t: 'Seleccionar coach...' },
        ...coaches.map((c) => ({ v: c.id, t: `${c.nombre} ${c.apellido}` }))]))}

      <div class="mb-3">
        <span class="block text-xs font-medium text-slate-500 mb-1">Días y horarios</span>
        <div id="trkDias" class="flex flex-wrap gap-2 mb-3"></div>
        <div id="trkHorarios" class="rounded-lg bg-slate-50 ring-1 ring-slate-200 p-3 space-y-2"></div>
      </div>

      ${field('Capacidad máxima', input('f_aforo', 'type="number" value="20" oninput="beCalc()"'))}
      <div class="grid grid-cols-2 gap-3">
        ${field('Mensualidad (S/.)', input('f_mens', 'type="number" step="0.01" placeholder="0.00" oninput="beCalc()"'))}
        ${field('Clases/mes', input('f_clases', 'type="number" placeholder="Ej: 8"'))}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${field('Costo aprox. cancha (S/.)', input('f_cancha', 'type="number" step="0.01" placeholder="0.00" oninput="beCalc()"'))}
        ${field('Costo aprox. profesores (S/.)', input('f_prof', 'type="number" step="0.01" placeholder="0.00" oninput="beCalc()"'))}
      </div>
      <div id="bePreview" class="rounded-lg bg-slate-50 ring-1 ring-slate-200 p-3 text-sm mb-3"></div>
      ${submitBar('Crear track')}
    </form>`);
  renderTrackDias();
  beCalc();
};

function renderTrackDias() {
  el('trkDias').innerHTML = DIAS.map((d) => {
    const on = TRACK_HORARIOS[d];
    return `<button type="button" onclick="toggleDia('${d}')"
      class="px-3 py-1.5 rounded-lg text-sm font-medium ${on ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}">${d}</button>`;
  }).join('');
  const dias = DIAS.filter((d) => TRACK_HORARIOS[d]);
  el('trkHorarios').innerHTML = dias.length
    ? dias.map((d, idx) => `
        <div class="flex items-center gap-2 text-sm">
          <span class="w-9 font-medium text-indigo-600">${d}</span>
          <input type="time" value="${TRACK_HORARIOS[d].ini}" onchange="setHora('${d}','ini',this.value)"
            class="rounded border border-slate-300 px-2 py-1">
          <span class="text-slate-400">–</span>
          <input type="time" value="${TRACK_HORARIOS[d].fin}" onchange="setHora('${d}','fin',this.value)"
            class="rounded border border-slate-300 px-2 py-1">
          ${idx === 0 ? `<button type="button" onclick="aplicarTodos()" class="ml-2 text-xs text-indigo-600 hover:underline">Aplicar a todos</button>` : ''}
        </div>`).join('')
    : '<p class="text-xs text-slate-400">Selecciona uno o más días.</p>';
}
window.toggleDia = (d) => {
  if (TRACK_HORARIOS[d]) delete TRACK_HORARIOS[d];
  else TRACK_HORARIOS[d] = { ini: '09:00', fin: '10:30' };
  renderTrackDias();
};
window.setHora = (d, k, v) => { if (TRACK_HORARIOS[d]) TRACK_HORARIOS[d][k] = v; };
window.aplicarTodos = () => {
  const dias = DIAS.filter((d) => TRACK_HORARIOS[d]);
  if (!dias.length) return;
  const first = TRACK_HORARIOS[dias[0]];
  dias.forEach((d) => { TRACK_HORARIOS[d] = { ini: first.ini, fin: first.fin }; });
  renderTrackDias();
};

window.beCalc = () => {
  const costo = num('f_cancha') + num('f_prof');
  const mens = num('f_mens');
  const be = mens > 0 ? Math.ceil(costo / mens) : 0;
  const aforo = num('f_aforo');
  el('bePreview').innerHTML = `
    <div class="flex justify-between"><span class="text-slate-500">Costo total de operación</span><b>${S(costo)}</b></div>
    <div class="flex justify-between"><span class="text-slate-500">Punto de equilibrio</span>
      <b class="text-indigo-600">${be} alumno(s)</b></div>
    <div class="mt-1 text-xs text-slate-400">Se necesitan ${be} de ${aforo} cupos para no operar a pérdida.</div>`;
};

window.guardarTrack = (e) => {
  e.preventDefault();
  const dias = DIAS.filter((d) => TRACK_HORARIOS[d]);
  const horarios = dias.map((d) => ({ dia: d, ini: TRACK_HORARIOS[d].ini, fin: TRACK_HORARIOS[d].fin }));
  let resumen = '';
  if (horarios.length) {
    const t0 = horarios[0];
    const mismos = horarios.every((h) => h.ini === t0.ini && h.fin === t0.fin);
    resumen = mismos
      ? `${dias.join('/')} ${t0.ini}-${t0.fin}`
      : horarios.map((h) => `${h.dia} ${h.ini}-${h.fin}`).join(', ');
  }
  const id = uid('t');
  DB.tracks.push({ id, sede_id: SEDE_ACTUAL, linea_negocio: 'academia',
    nombre_track: val('f_nombre'), capacidad_maxima: num('f_aforo'), mensualidad_sugerida: num('f_mens'),
    clases_mensuales: num('f_clases') || 8, costo_mensual_cancha: num('f_cancha'),
    costo_mensual_profesores: num('f_prof'), dias_horario: resumen, horarios,
    coach_id: val('f_coach') || null, activo: true });
  if (val('f_coach')) DB.trackStaff[id] = [val('f_coach')];
  closeModal(); toast('Track creado'); go('tracks');
};

// ---------- Registro cero fricción (Flujo A) ----------
window.formRegistroExpress = () => {
  openModal('Registro cero fricción (Flujo A)', `
    <form onsubmit="guardarRegistro(event)">
      <p class="text-xs text-slate-400 mb-3">Datos mínimos en cancha. El correo del tutor es opcional.</p>
      <div class="grid grid-cols-2 gap-3">
        ${field('Nombre del alumno', input('f_nombre', 'required'))}
        ${field('Apellido', input('f_apellido', 'required'))}
      </div>
      ${field('Fecha de nacimiento', input('f_fnac', 'type="date" required oninput="onFnac()"'))}
      <div id="catBox" class="hidden mb-3 rounded-lg bg-indigo-50 text-indigo-700 text-sm px-3 py-2"></div>
      <div class="grid grid-cols-2 gap-3">
        ${field('DNI del tutor', input('f_dni', 'required'))}
        ${field('Celular del tutor', input('f_tel', 'required'))}
      </div>
      ${field('Email del tutor (opcional)', input('f_email', 'type="email" placeholder="se puede completar luego"'))}
      ${field('Sede', select('f_sede',
        [sede(SEDE_ACTUAL), ...DB.sedes.filter((s) => s.id !== SEDE_ACTUAL)]
          .map((s) => ({ v: s.id, t: s.nombre_sede })), 'onchange="onFnac()"'))}
      <div id="tracksBox" class="mb-3"></div>
      ${submitBar('Registrar y generar deuda')}
    </form>`);
};
window.onFnac = () => {
  const f = val('f_fnac');
  if (!f) return;
  const cat = anio(f);
  el('catBox').classList.remove('hidden');
  el('catBox').innerHTML = `Categoría inmutable: <b>${cat}</b> (año de nacimiento, no editable)`;
  // Tracks compatibles de la sede
  const sedeId = val('f_sede');
  const compat = DB.tracks.filter((t) => t.sede_id === sedeId && t.activo !== false)
    .filter((t) => { const ys = aniosTrack(t); return ys.length === 0 || ys.includes(cat); });
  el('tracksBox').innerHTML = `
    <span class="block text-xs font-medium text-slate-500 mb-1">Tracks compatibles (marca uno o más)</span>
    ${compat.length ? compat.map((t) => `
      <label class="flex items-center gap-2 text-sm py-1">
        <input type="checkbox" class="trkChk accent-indigo-600" value="${t.id}">
        ${t.nombre_track} · ${S(t.mensualidad_sugerida)} · <span class="text-slate-400">${t.dias_horario || ''}</span>
      </label>`).join('') : '<p class="text-xs text-rose-500">No hay tracks compatibles con esta categoría en la sede.</p>'}`;
};
window.guardarRegistro = (e) => {
  e.preventDefault();
  const tracksSel = [...document.querySelectorAll('.trkChk:checked')].map((c) => c.value);
  if (!tracksSel.length) { toast('Selecciona al menos un track'); return; }
  // Tutor: reusar por DNI o crear
  let t = DB.tutores.find((x) => x.dni_tutor === val('f_dni'));
  if (!t) {
    t = { id: uid('tu'), dni_tutor: val('f_dni'), telefono_celular: val('f_tel'),
      email_tutor: val('f_email') || null, perfil_reclamado: !!val('f_email') };
    DB.tutores.push(t);
  }
  const j = { id: uid('j'), tutor_id: t.id, sede_id: val('f_sede'), nombre: val('f_nombre'), apellido: val('f_apellido'),
    fecha_nacimiento: val('f_fnac'), estado_alumno: 'activo', fecha_registro: HOY, atributos: null };
  DB.jugadores.push(j);
  // Inscripciones = definición de los CR (los cargos se generan aparte)
  tracksSel.forEach((tid) => {
    DB.inscripciones.push({ id: uid('i'), jugador_id: j.id, track_id: tid, costo_mensual_personalizado: null, activo: true, fecha_inscripcion: HOY, ultima_fecha_corte: null });
  });
  closeModal();
  toast(`${nom(j)} registrado · ${tracksSel.length} track(s) asignado(s)`);
  go('alumnos');
};

// ---------- Registrar pago desde Tesorería: elegir alumno y abrir el flujo ----------
window.formPago = () => {
  const als = alumnosSede().filter((j) => DB.cargos.some((c) => c.jugador_id === j.id && (c.monto - (c.pagado_monto || 0)) > 0));
  if (!als.length) { toast('No hay alumnos con cargos pendientes'); return; }
  openModal('Registrar pago', `
    <p class="text-xs text-slate-500 mb-2">Elige el alumno para registrar su pago:</p>
    <div class="space-y-1 max-h-72 overflow-y-auto">
      ${als.map((j) => {
        const debe = DB.cargos.filter((c) => c.jugador_id === j.id).reduce((s, c) => s + (c.monto - (c.pagado_monto || 0)), 0);
        return `<button type="button" onclick="formPagoAlumno('${j.id}')" class="w-full flex justify-between items-center rounded-lg px-3 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50">
          <span>${nom(j)} · Cat. ${anio(j.fecha_nacimiento)}</span><span class="font-medium text-rose-600">${S(debe)}</span></button>`;
      }).join('')}
    </div>`);
};

// ---------- Cargo eventual (no recurrente) ----------
window.formCargo = () => {
  const cnrCat = DB.conceptosCNR.filter((c) => c.activo);
  openModal('Cargo no recurrente (CNR)', `
    <form onsubmit="guardarCargo(event)">
      ${field('Alumno', select('f_alumno', alumnosSede().map((j) => ({ v: j.id, t: `${nom(j)} · Cat. ${anio(j.fecha_nacimiento)}` }))))}
      ${cnrCat.length
        ? field('Concepto', select('f_concepto', cnrCat.map((c) => ({ v: c.id, t: c.nombre })), 'onchange="cnrAutoPrecio(\'f_concepto\',\'f_monto\')"'))
        : '<p class="mb-3 text-sm text-rose-500">No hay conceptos CNR. Créalos en Configuración → Conceptos CNR.</p>'}
      ${field('Descripción (opcional)', input('f_desc'))}
      ${field('Monto (S/)', input('f_monto', `type="number" step="0.01" required value="${cnrCat[0] ? cnrCat[0].precio : ''}"`))}
      ${submitBar('Generar cargo')}
    </form>`);
};
window.guardarCargo = (e) => {
  e.preventDefault();
  const j = jugador(val('f_alumno'));
  const cn = DB.conceptosCNR.find((c) => c.id === val('f_concepto'));
  DB.cargos.push({ id: uid('c'), tutor_id: j.tutor_id, jugador_id: j.id, tipo: 'CNR', concepto: cn ? cn.nombre : 'Cargo', descripcion: val('f_desc'), periodo: PERIODO,
    monto: num('f_monto'), pagado_monto: 0, estado: 'por_pagar' });
  closeModal(); toast('Cargo no recurrente generado'); go('tesoreria');
};

// ---------- Evaluar cromo (6 atributos) ----------
window.formCromo = (jid) => {
  const j = jugador(jid);
  const a = j.atributos || {};
  const slider = (k, label) => `
    <label class="block mb-2">
      <div class="flex justify-between text-xs text-slate-500 mb-1"><span>${label}</span><span id="v_${k}">${a[k] || 50}</span></div>
      <input id="f_${k}" type="range" min="0" max="100" value="${a[k] || 50}" class="w-full accent-indigo-600"
        oninput="document.getElementById('v_${k}').textContent=this.value">
    </label>`;
  openModal(`Evaluar a ${nom(j)}`,
    `<form onsubmit="guardarCromo(event,'${jid}')">
      ${slider('velocidad', 'Velocidad')}${slider('potencia', 'Potencia')}${slider('agilidad', 'Agilidad')}
      ${slider('tecnica', 'Técnica')}${slider('pase', 'Pase')}${slider('defensa', 'Defensa')}
      <p class="text-xs text-slate-400 mb-2">Al guardar se dispara la alerta al tutor (Flujo B).</p>
      ${submitBar('Guardar cromo')}
    </form>`);
};
window.guardarCromo = (e, jid) => {
  e.preventDefault();
  const j = jugador(jid);
  j.atributos = { velocidad: num('f_velocidad'), potencia: num('f_potencia'), agilidad: num('f_agilidad'),
    tecnica: num('f_tecnica'), pase: num('f_pase'), defensa: num('f_defensa') };
  closeModal(); toast(`Cromo actualizado · alerta enviada al tutor (Flujo B)`); go('cromos');
};

// ---------- Onboarding del padre (Flujo B) ----------
window.formOnboarding = (tid) => {
  const t = tutor(tid);
  openModal('Activación del padre (Flujo B)', `
    <div id="obStep1">
      <p class="text-xs text-slate-400 mb-3">Doble factor: valida el DNI y teléfono registrados en cancha.</p>
      ${field('DNI del tutor', input('f_dni', `placeholder="registrado: ${t.dni_tutor}"`))}
      ${field('Celular', input('f_tel', `placeholder="registrado: ${t.telefono_celular}"`))}
      <div class="mt-2 flex justify-end">
        <button onclick="obValidar('${tid}')" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Validar identidad</button>
      </div>
    </div>`);
};
window.obValidar = (tid) => {
  const t = tutor(tid);
  if (val('f_dni') !== t.dni_tutor || val('f_tel') !== t.telefono_celular) {
    toast('DNI o teléfono no coinciden'); return;
  }
  el('modalBody').innerHTML = `
    <form onsubmit="obGuardar(event,'${tid}')">
      <div class="mb-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm px-3 py-2">¡Identidad confirmada! Define tu acceso.</div>
      ${field('Correo electrónico', input('f_email', 'type="email" required'))}
      ${field('Contraseña', input('f_pass', 'type="password" required'))}
      ${submitBar('Desbloquear panel')}
    </form>`;
};
window.obGuardar = (e, tid) => {
  e.preventDefault();
  const t = tutor(tid);
  t.email_tutor = val('f_email');
  t.perfil_reclamado = true;
  closeModal(); toast('Perfil del padre reclamado (email registrado)'); go('alumnos');
};

// =====================================================================
// CONFIGURACIÓN (Módulo I) — pestañas
// =====================================================================
window.setConfigTab = (tab) => { CONFIG_TAB = tab; SEDE_EDIT = null; SEDE_CABECERA = null; CNR_EDIT = null; MP_EDIT = null; CICLO_EDIT = null; PROMO_EDIT = null; SCREENS.config(); };

const stub = (txt) => `<div class="rounded-xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-400">${txt}<br><span class="text-xs">Próximamente</span></div>`;

const CONFIG_TABS = {
  perfil() {
    const a = DB.academia;
    const v = (x) => (x == null ? '' : String(x)).replace(/"/g, '&quot;');
    const logo = a.logo_url
      ? `<img src="${a.logo_url}" class="h-20 w-20 rounded-lg object-cover ring-1 ring-slate-200">`
      : `<div class="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-2xl text-slate-300">🎓</div>`;
    el('configTab').innerHTML = `
      <form onsubmit="guardarPerfil(event)" class="space-y-1">
        <div class="mb-5">
          <span class="block text-xs font-medium text-slate-500 mb-1">Logo de la academia</span>
          <div class="flex items-center gap-4">
            ${logo}
            <div>
              <label class="cursor-pointer text-sm font-medium text-indigo-600 hover:underline">
                Cambiar logo
                <input type="file" accept="image/png,image/jpeg,image/webp" class="hidden" onchange="cambiarLogo(this)">
              </label>
              <div class="text-xs text-slate-400">JPG, PNG o WebP</div>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          ${field('Nombre de la academia *', input('p_nombre', `required value="${v(a.nombre_academia)}"`))}
          ${field('Slug (URL)', input('p_slug', `value="${v(a.slug_url)}"`))}
          ${field('Email', input('p_email', `type="email" value="${v(a.email)}"`))}
          ${field('Teléfono', input('p_tel', `value="${v(a.telefono)}"`))}
        </div>
        ${field('Dirección línea 1', input('p_dir1', `value="${v(a.direccion1)}" placeholder="Av. Ejemplo 123"`))}
        ${field('Dirección línea 2', input('p_dir2', `value="${v(a.direccion2)}" placeholder="Piso 2, Of. 201"`))}
        <div class="grid grid-cols-3 gap-3">
          ${field('Ciudad', input('p_ciudad', `value="${v(a.ciudad)}"`))}
          ${field('País', input('p_pais', `value="${v(a.pais)}"`))}
          ${field('Código postal', input('p_cp', `value="${v(a.codigo_postal)}" placeholder="15001"`))}
        </div>
        <div class="grid grid-cols-2 gap-3">
          ${field('RUC', input('p_ruc', `value="${v(a.ruc)}"`))}
          ${field('Año de fundación', input('p_anio', `value="${v(a.anio_fundacion)}"`))}
        </div>
        ${field('Misión / Descripción',
          `<textarea id="p_mision" rows="3" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">${v(a.mision)}</textarea>`)}

        <div class="pt-2 pb-1 text-sm font-semibold text-slate-600">Redes sociales y contacto</div>
        <div class="grid grid-cols-2 gap-3">
          ${field('WhatsApp (número)', input('p_whatsapp', `value="${v(a.whatsapp)}" placeholder="+51 999 999 999"`))}
          ${field('Instagram', input('p_instagram', `value="${v(a.instagram)}" placeholder="https://instagram.com/..."`))}
          ${field('Facebook', input('p_facebook', `value="${v(a.facebook)}" placeholder="https://facebook.com/..."`))}
          ${field('TikTok', input('p_tiktok', `value="${v(a.tiktok)}" placeholder="https://tiktok.com/@..."`))}
          ${field('YouTube', input('p_youtube', `value="${v(a.youtube)}" placeholder="https://youtube.com/@..."`))}
          ${field('Twitter / X', input('p_twitter', `value="${v(a.twitter)}" placeholder="https://x.com/..."`))}
        </div>
        ${field('Google Maps URL', input('p_maps', `value="${v(a.google_maps_url)}" placeholder="https://maps.google.com/..."`))}
        <div class="flex justify-end pt-2">
          <button type="submit" class="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700">Guardar cambios</button>
        </div>
      </form>`;
  },

  sedes() {
    const editing = SEDE_EDIT ? sede(SEDE_EDIT) : null;
    const g = (k, def = '') => (editing ? (editing[k] ?? '') : def);
    el('configTab').innerHTML = `
      <div class="rounded-xl bg-white ring-1 ring-slate-200 p-5 mb-6">
        <div class="text-sm font-semibold text-slate-700 mb-3">${editing ? 'Editar sede' : 'Nueva sede'}</div>
        <form onsubmit="guardarSedeInline(event)">
          ${field('Nombre de la sede *', input('sd_nombre', `required value="${g('nombre_sede')}" placeholder="Sede principal"`))}
          ${field('Dirección línea 1', input('sd_dir1', `value="${g('direccion1')}" placeholder="Av. Ejemplo 123"`))}
          ${field('Dirección línea 2', input('sd_dir2', `value="${g('direccion2')}" placeholder="Piso 2, Of. 201"`))}
          <div class="grid grid-cols-3 gap-3">
            ${field('Ciudad', input('sd_ciudad', `value="${g('ciudad', 'Lima')}"`))}
            ${field('País', input('sd_pais', `value="${g('pais', 'Perú')}"`))}
            ${field('Código postal', input('sd_cp', `value="${g('codigo_postal')}" placeholder="15001"`))}
          </div>
          <div class="grid grid-cols-2 gap-3">
            ${field('Teléfono', input('sd_tel', `value="${g('telefono_coordinador')}" placeholder="+51 999 999 999"`))}
            ${field('Google Maps URL', input('sd_maps', `value="${g('google_maps_url')}" placeholder="https://maps.google.com/..."`))}
          </div>
          <div class="mb-3">
            <span class="block text-xs font-medium text-slate-500 mb-1">Cabecera del estado de cuenta</span>
            <div class="flex items-center gap-3">
              ${SEDE_CABECERA ? `<img src="${SEDE_CABECERA}" class="h-14 rounded ring-1 ring-slate-200 object-cover">` : '<div class="flex h-14 w-28 items-center justify-center rounded border-2 border-dashed border-slate-300 text-xs text-slate-400">sin imagen</div>'}
              <label class="cursor-pointer text-sm font-medium text-indigo-600 hover:underline">
                Cambiar cabecera
                <input type="file" accept="image/*" class="hidden" onchange="cambiarCabeceraSede(this)">
                <div class="text-xs font-normal text-slate-400">Se muestra arriba del estado de cuenta descargable</div>
              </label>
            </div>
          </div>
          <div class="flex gap-2">
            <button type="submit" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">${editing ? 'Guardar cambios' : 'Agregar'}</button>
            ${editing ? `<button type="button" onclick="cancelSedeEdit()" class="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancelar</button>` : ''}
          </div>
        </form>
      </div>
      ${table(['Sede', 'Dirección', 'Ciudad', 'Teléfono', ''],
        DB.sedes.map((s) => [
          `<b>${s.nombre_sede}</b>`, s.direccion1 || '—', s.ciudad || '—', s.telefono_coordinador || '—',
          `<button onclick="editarSede('${s.id}')" class="text-indigo-600 hover:underline text-xs mr-3">Editar</button>
           <button onclick="eliminarSede('${s.id}')" class="text-rose-600 hover:underline text-xs">Eliminar</button>`]))}`;
  },

  cnr() {
    const e = CNR_EDIT ? DB.conceptosCNR.find((c) => c.id === CNR_EDIT) : null;
    el('configTab').innerHTML = `
      <div class="rounded-xl bg-white ring-1 ring-slate-200 p-5 mb-6">
        <div class="text-sm font-semibold text-slate-700 mb-3">${e ? 'Editar concepto CNR' : 'Nuevo concepto CNR'}</div>
        <form onsubmit="guardarConceptoCNR(event)">
          <div class="grid grid-cols-2 gap-3">
            ${field('Concepto (nombre del cargo) *', input('cn_nombre', `required value="${e ? e.nombre.replace(/"/g, '&quot;') : ''}" placeholder="Ej: Uniforme"`))}
            ${field('Precio unitario (S/.)', input('cn_precio', `type="number" step="0.01" value="${e ? e.precio : ''}" placeholder="0.00"`))}
          </div>
          <div class="flex flex-wrap gap-5 mb-3">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" id="cn_stock" class="h-4 w-4 rounded accent-indigo-600" ${e && e.maneja_stock ? 'checked' : ''}>
              Maneja stock <span class="text-xs text-slate-400">(inventario: uniforme, buzo…)</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" id="cn_torneo" class="h-4 w-4 rounded accent-indigo-600" ${e && e.es_torneo ? 'checked' : ''}>
              Es torneo <span class="text-xs text-slate-400">(inscripción a torneo)</span>
            </label>
          </div>
          <div class="flex gap-2">
            <button type="submit" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">${e ? 'Guardar cambios' : 'Agregar'}</button>
            ${e ? `<button type="button" onclick="cancelCNREdit()" class="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancelar</button>` : ''}
          </div>
        </form>
      </div>
      <p class="text-xs text-slate-400 mb-2">Estos conceptos aparecen al generar un Cargo No Recurrente y autocompletan el precio. <b>Stock</b> = descuenta inventario · <b>Torneo</b> = seguimiento especial.</p>
      ${table(['Concepto', 'Precio unitario', 'Stock', 'Torneo', 'Estado', ''],
        DB.conceptosCNR.map((c) => [
          `<b>${c.nombre}</b>`, S(c.precio),
          c.maneja_stock ? badge('Stock', 'sky') : '—',
          c.es_torneo ? badge('Torneo', 'fuchsia') : '—',
          badge(c.activo ? 'Activo' : 'Inactivo', c.activo ? 'emerald' : 'slate'),
          `<button onclick="editarConceptoCNR('${c.id}')" class="text-indigo-600 hover:underline text-xs mr-3">Editar</button>
           <button onclick="toggleConceptoCNR('${c.id}')" class="text-slate-500 hover:underline text-xs mr-3">${c.activo ? 'Desactivar' : 'Activar'}</button>
           <button onclick="eliminarConceptoCNR('${c.id}')" class="text-rose-600 hover:underline text-xs">Eliminar</button>`]))}`;
  },

  pagos() {
    const e = MP_EDIT ? DB.mediosPago.find((m) => m.id === MP_EDIT) : null;
    el('configTab').innerHTML = `
      <div class="rounded-xl bg-white ring-1 ring-slate-200 p-5 mb-6">
        <div class="text-sm font-semibold text-slate-700 mb-3">${e ? 'Editar medio de pago' : 'Nuevo medio de pago'}</div>
        <form onsubmit="guardarMedioPago(event)">
          ${field('Nombre del medio *', input('mp_nombre', `required value="${e ? e.nombre.replace(/"/g, '&quot;') : ''}" placeholder="Ej: Yape"`))}
          <div class="flex gap-2">
            <button type="submit" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">${e ? 'Guardar cambios' : 'Agregar'}</button>
            ${e ? `<button type="button" onclick="cancelMPEdit()" class="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancelar</button>` : ''}
          </div>
        </form>
      </div>
      <p class="text-xs text-slate-400 mb-2">Los medios <b>activos</b> aparecen al registrar un pago.</p>
      ${table(['Medio', 'Estado', ''],
        DB.mediosPago.map((m) => [
          `<b>${m.nombre}</b>`,
          badge(m.activo ? 'Activo' : 'Inactivo', m.activo ? 'emerald' : 'slate'),
          `<button onclick="editarMedioPago('${m.id}')" class="text-indigo-600 hover:underline text-xs mr-3">Editar</button>
           <button onclick="toggleMedioPago('${m.id}')" class="text-slate-500 hover:underline text-xs mr-3">${m.activo ? 'Desactivar' : 'Activar'}</button>
           <button onclick="eliminarMedioPago('${m.id}')" class="text-rose-600 hover:underline text-xs">Eliminar</button>`]))}`;
  },
  ciclos() {
    const e = CICLO_EDIT ? DB.ciclosPago.find((c) => c.id === CICLO_EDIT) : null;
    el('configTab').innerHTML = `
      <div class="rounded-xl bg-white ring-1 ring-slate-200 p-5 mb-6">
        <div class="text-sm font-semibold text-slate-700 mb-3">${e ? 'Editar ciclo de pago' : 'Nuevo ciclo de pago'}</div>
        <form onsubmit="guardarCicloPago(event)">
          <div class="grid grid-cols-2 gap-3">
            ${field('Día del mes (corte) *', input('ci_dia', `type="number" min="1" max="28" required value="${e ? e.dia : ''}" placeholder="Ej: 1"`))}
            ${field('Día de vencimiento *', input('ci_venc', `type="number" min="1" max="28" required value="${e ? (e.dia_venc ?? '') : ''}" placeholder="Ej: 5"`))}
          </div>
          <label class="flex items-center gap-2 text-sm mb-3">
            <input type="checkbox" id="ci_default" class="h-4 w-4 rounded accent-indigo-600" ${e && e.es_default ? 'checked' : ''}>
            Predeterminado <span class="text-xs text-slate-400">(se usa por defecto al generar CR)</span>
          </label>
          <div class="flex gap-2">
            <button type="submit" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">${e ? 'Guardar cambios' : 'Agregar'}</button>
            ${e ? `<button type="button" onclick="cancelCicloEdit()" class="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancelar</button>` : ''}
          </div>
        </form>
      </div>
      <p class="text-xs text-slate-400 mb-2">El <b>día de corte</b> marca el fin del ciclo (día − 1). El <b>vencimiento</b> es ese día dentro del mes del ciclo (ej. ciclo 01/08–31/08 con venc. día 5 → 05/08).</p>
      ${table(['Ciclo', 'Corte', 'Vencimiento', 'Predeterminado', 'Estado', ''],
        DB.ciclosPago.map((c) => [
          `<b>${nombreCiclo(c)}</b>`, `día ${c.dia}`, `día ${c.dia_venc ?? '—'}`,
          c.es_default ? badge('Por defecto', 'indigo') : '—',
          badge(c.activo ? 'Activo' : 'Inactivo', c.activo ? 'emerald' : 'slate'),
          `<button onclick="editarCicloPago('${c.id}')" class="text-indigo-600 hover:underline text-xs mr-3">Editar</button>
           <button onclick="toggleCicloPago('${c.id}')" class="text-slate-500 hover:underline text-xs mr-3">${c.activo ? 'Desactivar' : 'Activar'}</button>
           <button onclick="eliminarCicloPago('${c.id}')" class="text-rose-600 hover:underline text-xs">Eliminar</button>`]))}`;
  },
  promos() {
    const e = PROMO_EDIT ? DB.promociones.find((p) => p.id === PROMO_EDIT) : null;
    el('configTab').innerHTML = `
      <div class="rounded-xl bg-white ring-1 ring-slate-200 p-5 mb-6">
        <div class="text-sm font-semibold text-slate-700 mb-3">${e ? 'Editar promoción' : 'Nueva promoción'}</div>
        <form onsubmit="guardarPromo(event)">
          <div class="grid grid-cols-3 gap-3">
            ${field('Nombre *', input('pr_nombre', `required value="${e ? e.nombre.replace(/"/g, '&quot;') : ''}" placeholder="Ej: 3x2"`))}
            ${field('Meses total *', input('pr_total', `type="number" min="1" required value="${e ? e.meses_total : ''}" placeholder="3"`))}
            ${field('Meses pagados *', input('pr_pagados', `type="number" min="0" required value="${e ? e.meses_pagados : ''}" placeholder="2"`))}
          </div>
          <p class="text-xs text-slate-400 mb-3">Los últimos <b>(total − pagados)</b> meses van gratis.</p>
          <div class="flex gap-2">
            <button type="submit" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">${e ? 'Guardar cambios' : 'Agregar'}</button>
            ${e ? `<button type="button" onclick="cancelPromoEdit()" class="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancelar</button>` : ''}
          </div>
        </form>
      </div>
      ${table(['Promoción', 'Meses', 'Pagados', 'Gratis', 'Estado', ''],
        DB.promociones.map((p) => [
          `<b>${p.nombre}</b>`, p.meses_total, p.meses_pagados, p.meses_total - p.meses_pagados,
          badge(p.activo ? 'Activo' : 'Inactivo', p.activo ? 'emerald' : 'slate'),
          `<button onclick="editarPromo('${p.id}')" class="text-indigo-600 hover:underline text-xs mr-3">Editar</button>
           <button onclick="togglePromo('${p.id}')" class="text-slate-500 hover:underline text-xs mr-3">${p.activo ? 'Desactivar' : 'Activar'}</button>
           <button onclick="eliminarPromo('${p.id}')" class="text-rose-600 hover:underline text-xs">Eliminar</button>`]))}`;
  },
  publica()      { el('configTab').innerHTML = stub('Página pública de la academia (marca blanca)'); },
  invitaciones() { el('configTab').innerHTML = stub('Invitaciones a staff y coordinadores'); },
};

window.guardarConceptoCNR = (ev) => {
  ev.preventDefault();
  const data = {
    nombre: val('cn_nombre'), precio: num('cn_precio'),
    maneja_stock: el('cn_stock').checked, es_torneo: el('cn_torneo').checked,
  };
  if (CNR_EDIT) {
    Object.assign(DB.conceptosCNR.find((c) => c.id === CNR_EDIT), data); CNR_EDIT = null; toast('Concepto actualizado');
  } else {
    DB.conceptosCNR.push({ id: uid('cn'), activo: true, ...data }); toast('Concepto agregado');
  }
  SCREENS.config();
};
window.editarConceptoCNR = (id) => { CNR_EDIT = id; SCREENS.config(); };
window.cancelCNREdit = () => { CNR_EDIT = null; SCREENS.config(); };
window.toggleConceptoCNR = (id) => { const c = DB.conceptosCNR.find((x) => x.id === id); if (c) { c.activo = !c.activo; SCREENS.config(); } };
window.eliminarConceptoCNR = (id) => {
  DB.conceptosCNR = DB.conceptosCNR.filter((c) => c.id !== id);
  if (CNR_EDIT === id) CNR_EDIT = null;
  toast('Concepto eliminado'); SCREENS.config();
};
// Autocompleta el monto según el concepto CNR elegido
window.cnrAutoPrecio = (selId, montoId) => {
  const c = DB.conceptosCNR.find((x) => x.id === el(selId).value);
  if (c && el(montoId)) el(montoId).value = c.precio || '';
};

// ---------- Medios de pago (config) ----------
window.guardarMedioPago = (ev) => {
  ev.preventDefault();
  const nombre = val('mp_nombre');
  if (MP_EDIT) { DB.mediosPago.find((m) => m.id === MP_EDIT).nombre = nombre; MP_EDIT = null; toast('Medio actualizado'); }
  else { DB.mediosPago.push({ id: uid('mp'), nombre, activo: true }); toast('Medio agregado'); }
  SCREENS.config();
};
window.editarMedioPago = (id) => { MP_EDIT = id; SCREENS.config(); };
window.cancelMPEdit = () => { MP_EDIT = null; SCREENS.config(); };
window.toggleMedioPago = (id) => { const m = DB.mediosPago.find((x) => x.id === id); if (m) { m.activo = !m.activo; SCREENS.config(); } };
window.eliminarMedioPago = (id) => {
  DB.mediosPago = DB.mediosPago.filter((m) => m.id !== id);
  if (MP_EDIT === id) MP_EDIT = null;
  toast('Medio eliminado'); SCREENS.config();
};

// ---------- Ciclos de pago (config) ----------
window.guardarCicloPago = (ev) => {
  ev.preventDefault();
  const dia = parseInt(val('ci_dia'), 10) || 1;
  const diaVenc = parseInt(val('ci_venc'), 10) || dia;
  const esDefault = el('ci_default').checked;
  if (esDefault) DB.ciclosPago.forEach((c) => { c.es_default = false; });
  if (CICLO_EDIT) { Object.assign(DB.ciclosPago.find((c) => c.id === CICLO_EDIT), { dia, dia_venc: diaVenc, es_default: esDefault }); CICLO_EDIT = null; toast('Ciclo actualizado'); }
  else { DB.ciclosPago.push({ id: uid('ci'), dia, dia_venc: diaVenc, es_default: esDefault, activo: true }); toast('Ciclo agregado'); }
  // Garantiza al menos un predeterminado
  if (!DB.ciclosPago.some((c) => c.es_default) && DB.ciclosPago[0]) DB.ciclosPago[0].es_default = true;
  SCREENS.config();
};
window.editarCicloPago = (id) => { CICLO_EDIT = id; SCREENS.config(); };
window.cancelCicloEdit = () => { CICLO_EDIT = null; SCREENS.config(); };
window.toggleCicloPago = (id) => { const c = DB.ciclosPago.find((x) => x.id === id); if (c) { c.activo = !c.activo; SCREENS.config(); } };
window.eliminarCicloPago = (id) => {
  DB.ciclosPago = DB.ciclosPago.filter((c) => c.id !== id);
  if (CICLO_EDIT === id) CICLO_EDIT = null;
  if (!DB.ciclosPago.some((c) => c.es_default) && DB.ciclosPago[0]) DB.ciclosPago[0].es_default = true;
  toast('Ciclo eliminado'); SCREENS.config();
};

// ---------- Promociones (config) ----------
window.guardarPromo = (ev) => {
  ev.preventDefault();
  const total = parseInt(val('pr_total'), 10) || 1;
  const pagados = parseInt(val('pr_pagados'), 10);
  if (pagados > total) { toast('Meses pagados no puede superar al total'); return; }
  const data = { nombre: val('pr_nombre'), meses_total: total, meses_pagados: isNaN(pagados) ? 0 : pagados };
  if (PROMO_EDIT) { Object.assign(DB.promociones.find((p) => p.id === PROMO_EDIT), data); PROMO_EDIT = null; toast('Promoción actualizada'); }
  else { DB.promociones.push({ id: uid('pr'), activo: true, ...data }); toast('Promoción agregada'); }
  SCREENS.config();
};
window.editarPromo = (id) => { PROMO_EDIT = id; SCREENS.config(); };
window.cancelPromoEdit = () => { PROMO_EDIT = null; SCREENS.config(); };
window.togglePromo = (id) => { const p = DB.promociones.find((x) => x.id === id); if (p) { p.activo = !p.activo; SCREENS.config(); } };
window.eliminarPromo = (id) => {
  DB.promociones = DB.promociones.filter((p) => p.id !== id);
  if (PROMO_EDIT === id) PROMO_EDIT = null;
  toast('Promoción eliminada'); SCREENS.config();
};

window.cambiarLogo = (inp) => {
  const f = inp.files && inp.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => { DB.academia.logo_url = r.result; SCREENS.config(); };
  r.readAsDataURL(f);
};

window.guardarPerfil = (e) => {
  e.preventDefault();
  Object.assign(DB.academia, {
    nombre_academia: val('p_nombre'), slug_url: val('p_slug'), email: val('p_email'), telefono: val('p_tel'),
    direccion1: val('p_dir1'), direccion2: val('p_dir2'), ciudad: val('p_ciudad'), pais: val('p_pais'),
    codigo_postal: val('p_cp'), ruc: val('p_ruc'), anio_fundacion: val('p_anio'), mision: val('p_mision'),
    whatsapp: val('p_whatsapp'), instagram: val('p_instagram'), facebook: val('p_facebook'),
    tiktok: val('p_tiktok'), youtube: val('p_youtube'), twitter: val('p_twitter'), google_maps_url: val('p_maps'),
  });
  toast('Perfil de la academia guardado');
};

window.cambiarCabeceraSede = (inp) => {
  const f = inp.files && inp.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { SEDE_CABECERA = r.result; SCREENS.config(); };
  r.readAsDataURL(f);
};
window.guardarSedeInline = (e) => {
  e.preventDefault();
  const data = {
    nombre_sede: val('sd_nombre'), direccion1: val('sd_dir1'), direccion2: val('sd_dir2'),
    ciudad: val('sd_ciudad'), pais: val('sd_pais'), codigo_postal: val('sd_cp'),
    telefono_coordinador: val('sd_tel'), google_maps_url: val('sd_maps'), cabecera_url: SEDE_CABECERA,
  };
  if (SEDE_EDIT) {
    Object.assign(sede(SEDE_EDIT), data); SEDE_EDIT = null; toast('Sede actualizada');
  } else {
    DB.sedes.push({ id: uid('s'), activo: true, ...data }); toast('Sede agregada');
  }
  SEDE_CABECERA = null;
  renderSedeSelect(); SCREENS.config();
};
window.editarSede = (id) => { SEDE_EDIT = id; SEDE_CABECERA = (sede(id) && sede(id).cabecera_url) || null; SCREENS.config(); };
window.cancelSedeEdit = () => { SEDE_EDIT = null; SEDE_CABECERA = null; SCREENS.config(); };
window.eliminarSede = (id) => {
  const usados = DB.tracks.filter((t) => t.sede_id === id).length;
  if (usados) { toast(`No se puede eliminar: la sede tiene ${usados} track(s)`); return; }
  DB.sedes = DB.sedes.filter((s) => s.id !== id);
  if (SEDE_EDIT === id) SEDE_EDIT = null;
  renderSedeSelect(); toast('Sede eliminada'); SCREENS.config();
};

// ---------- Navegación móvil (drawer) ----------
window.toggleNav = (open) => {
  const sb = el('sidebar'), ov = el('navOverlay');
  if (!sb) return;
  sb.classList.toggle('-translate-x-full', !open);
  ov.classList.toggle('hidden', !open);
};

// ---------- Selector de sede activa ----------
function renderSedeSelect() {
  if (!DB.sedes.some((s) => s.id === SEDE_ACTUAL)) SEDE_ACTUAL = DB.sedes[0] ? DB.sedes[0].id : null;
  el('sedeSelect').innerHTML = DB.sedes
    .map((s) => `<option value="${s.id}" ${s.id === SEDE_ACTUAL ? 'selected' : ''}>${s.nombre_sede}</option>`)
    .join('');
}

// =====================================================================
// INIT — arranque demo o conectado (Supabase)
// =====================================================================
function bootApp() {
  el('rolSelect').addEventListener('change', (e) => { ROL = e.target.value; TRACK_SEL = null; go(SCREEN); });
  el('sedeSelect').addEventListener('change', (e) => { SEDE_ACTUAL = e.target.value; TRACK_SEL = null; go(SCREEN); });
  renderSedeSelect();
  renderNav();
  go('dashboard');
}

// ---------- Auth UI ----------
window.showAuthScreen = (view) => {
  el('authScreen').classList.remove('hidden');
  ['authLogin', 'authSignup', 'authCrear'].forEach((id) => el(id).classList.add('hidden'));
  el('auth' + view[0].toUpperCase() + view.slice(1)).classList.remove('hidden');
  authMsg('');
};
function authMsg(txt, ok) {
  const m = el('authMsg');
  m.textContent = txt || '';
  m.classList.toggle('hidden', !txt);
  m.className = `mt-3 rounded-lg px-3 py-2 text-xs ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'} ${txt ? '' : 'hidden'}`;
}
window.authSubmit = async (ev, mode) => {
  ev.preventDefault();
  const A = window.AcademiasDB;
  try {
    if (mode === 'login') {
      await A.auth.signIn(el('au_email').value.trim(), el('au_pass').value);
      await entrarConectado();
    } else {
      const r = await A.auth.signUp(el('as_email').value.trim(), el('as_pass').value);
      if (!r.session) { authMsg('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.', true); showAuthScreenKeepMsg('login'); return; }
      showAuthScreen('crear');
    }
  } catch (e) { authMsg(traducirAuthError(e)); }
};
function showAuthScreenKeepMsg(view) {
  const m = el('authMsg').textContent;
  const cls = el('authMsg').className;
  showAuthScreen(view);
  el('authMsg').textContent = m; el('authMsg').className = cls;
}
function traducirAuthError(e) {
  const m = (e && e.message) || String(e);
  if (/invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
  if (/already registered/i.test(m)) return 'Ese correo ya está registrado. Inicia sesión.';
  if (/email not confirmed/i.test(m)) return 'Debes confirmar tu correo antes de entrar.';
  return m;
}
window.authCrear = async (ev) => {
  ev.preventDefault();
  try {
    await AcademiasDB.crearAcademia(el('ac_nombre').value.trim(), el('ac_sede').value.trim());
    await entrarConectado();
  } catch (e) { authMsg(traducirAuthError(e)); }
};
window.doLogoutAcademias = async () => {
  if (window.AcademiasDB && AcademiasDB.on) await AcademiasDB.auth.signOut();
  location.reload();
};

// ---------- Arranque conectado: hidratar DB y activar sincronización ----------
async function entrarConectado() {
  try {
    const data = await AcademiasDB.loadAll();
    if (!data.academia) { showAuthScreen('crear'); return; }
    Object.assign(DB, data);
    SEDE_ACTUAL = DB.sedes[0] ? DB.sedes[0].id : null;
    AcademiasDB.sync.onStatus((st, err) => {
      const d = el('syncDot');
      if (!d) return;
      d.classList.remove('hidden', 'bg-emerald-400', 'bg-amber-400', 'bg-rose-500', 'animate-pulse');
      if (st === 'saving') { d.classList.add('bg-amber-400', 'animate-pulse'); d.title = 'Guardando...'; }
      else if (st === 'error') { d.classList.add('bg-rose-500'); d.title = 'Error al guardar: ' + ((err && err.message) || ''); toast('⚠ Error al sincronizar: ' + ((err && err.message) || '')); }
      else { d.classList.add('bg-emerald-400'); d.title = 'Sincronizado'; }
    });
    AcademiasDB.sync.start(DB);
    el('syncDot').classList.remove('hidden');
    el('btnLogout').classList.remove('hidden');
    el('authScreen').classList.add('hidden');
    bootApp();
  } catch (e) {
    console.error(e);
    showAuthScreen('login');
    authMsg('No se pudo cargar la información: ' + ((e && e.message) || e));
  }
}

(async function init() {
  const A = window.AcademiasDB;
  if (!A || !A.on) { bootApp(); return; }               // modo demo (?demo=1 o sin config)
  const session = await A.auth.getSession();
  if (!session) { showAuthScreen('login'); return; }
  await entrarConectado();
})();
