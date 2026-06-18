// Single source of truth for the focus-booth dimensions.
// All raw values are in millimeters (mm) exactly as given on the spec sheet.
// Geometry consumes the `M` (meters) helpers so 1 three.js unit = 1 meter.

export const MM = {
  // Overall
  overallWidth: 1600, // width (front)
  overallDepth: 1400, // depth (side)
  overallHeight: 2200, // height
  externalCornerRadius: 80,

  // Interior
  internalWidth: 1450,
  internalDepth: 1250,
  internalHeight: 2050,

  // Doors
  glassDoorWidth: 700, // each panel
  doorOpeningHeight: 2000,
  totalClearOpening: 1400,

  // Desk
  deskWidth: 900,
  deskDepth: 500,
  deskHeight: 730,

  // Seating
  beanBagDiameter: 875, // 850-900 mm
  clearLegroom: 700,

  // Wall construction
  acousticPanelThickness: 45, // 40-50 mm
  wallThickness: 80, // 70-90 mm total
} as const;

/** Convert millimeters to meters (three.js world units). */
export const m = (mm: number) => mm / 1000;

/** Pre-computed meter values for geometry. */
export const M = {
  width: m(MM.overallWidth),
  depth: m(MM.overallDepth),
  height: m(MM.overallHeight),
  cornerRadius: m(MM.externalCornerRadius),

  innerWidth: m(MM.internalWidth),
  innerDepth: m(MM.internalDepth),
  innerHeight: m(MM.internalHeight),

  doorWidth: m(MM.glassDoorWidth),
  doorHeight: m(MM.doorOpeningHeight),
  clearOpening: m(MM.totalClearOpening),

  deskWidth: m(MM.deskWidth),
  deskDepth: m(MM.deskDepth),
  deskHeight: m(MM.deskHeight),

  beanBag: m(MM.beanBagDiameter),
  legroom: m(MM.clearLegroom),

  wall: m(MM.wallThickness),
} as const;

// ---------------------------------------------------------------------------
// Structured spec list for the side panel. Same numbers, rendered as labels.
// ---------------------------------------------------------------------------

export type SpecRow = { label: string; value: string };
export type SpecGroup = { title: string; rows: SpecRow[] };

export const SPEC_GROUPS: SpecGroup[] = [
  {
    title: "Ерөнхий хэмжээс",
    rows: [
      { label: "Өргөн (урд)", value: "1600 мм" },
      { label: "Зузаан (хажуу)", value: "1400 мм" },
      { label: "Өндөр", value: "2200 мм" },
      { label: "Гадна булангийн радиус", value: "80 мм" },
    ],
  },
  {
    title: "Дотор хэмжээс",
    rows: [
      { label: "Дотор өргөн", value: "1450 мм" },
      { label: "Дотор зузаан", value: "1250 мм" },
      { label: "Дотор өндөр", value: "2050 мм" },
    ],
  },
  {
    title: "Хаалганы хэмжээс",
    rows: [
      { label: "Шилэн хаалганы өргөн (нэг хавтан)", value: "700 мм" },
      { label: "Хаалганы өндөр", value: "2000 мм" },
      { label: "Нийт нээгдэх зай", value: "1400 мм" },
    ],
  },
  {
    title: "Ширээний хэмжээс",
    rows: [
      { label: "Ширээний өргөн", value: "900 мм" },
      { label: "Ширээний зузаан", value: "500 мм" },
      { label: "Ширээний өндөр", value: "730 мм" },
    ],
  },
  {
    title: "Суух хэсэг",
    rows: [
      { label: "Зөөлөн суудлын голч", value: "850–900 мм" },
      { label: "Ширээний өмнөх хөлний зай", value: "700 мм" },
    ],
  },
  {
    title: "Ханын бүтэц",
    rows: [
      { label: "Дуу шингээгч хавтангийн зузаан", value: "40–50 мм" },
      { label: "Ханын зузаан (нийт)", value: "70–90 мм" },
    ],
  },
];

export const SPEC_NOTE = "Бүх хэмжээс миллиметрээр (мм) илэрхийлэгдсэн.";
