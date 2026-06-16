export interface YarnWeight {
  id: number;
  name: string;
  symbol: string;
  yarnTypes: string;
  knitGauge: string;
  crochetGauge: string;
  needleMM: string;
  needleUS: string;
  hookMM: string;
  hookUS: string;
  yardageFactor: number; // yards per stitch (empirical starting point)
  typicalYardagePer100g: number; // typical yards per 100g skein
}

export interface ProjectType {
  id: string;
  label: string;
  defaultWidth: number;
  defaultHeight: number;
  unit: 'inches' | 'cm';
  note?: string;
}

export interface CalculationInput {
  yarnWeightId: number;
  projectType: string;
  width: number;
  height: number;
  stitchesPer4Inches: number;
  rowsPer4Inches: number;
  skeinYardage: number;
  unit: 'inches' | 'cm';
}

export interface CalculationResult {
  totalStitches: number;
  totalRows: number;
  totalStitchCount: number;
  yardageYards: number;
  yardageMeters: number;
  skeinsNeeded: number;
  skeinYardage: number;
  yarnWeight: YarnWeight;
  projectLabel: string;
}

export interface SavedProject {
  id: string;
  name: string;
  date: string;
  input: CalculationInput;
  result: CalculationResult;
}

export const YARN_WEIGHTS: YarnWeight[] = [
  { id: 0, name: 'Lace', symbol: '0', yarnTypes: 'Fingering, 10-count crochet thread', knitGauge: '33–40', crochetGauge: '32–42 dc', needleMM: '1.5–2.25 mm', needleUS: '000–1', hookMM: 'Steel 1.6–1.4 / Regular 2.25', hookUS: 'Steel 6,7,8 / B-1', yardageFactor: 0.035, typicalYardagePer100g: 800 },
  { id: 1, name: 'Super Fine', symbol: '1', yarnTypes: 'Sock, Fingering, Baby', knitGauge: '27–32', crochetGauge: '21–32', needleMM: '2.25–3.25 mm', needleUS: '1–3', hookMM: '2.25–3.5 mm', hookUS: 'B-1 to E-4', yardageFactor: 0.040, typicalYardagePer100g: 460 },
  { id: 2, name: 'Fine', symbol: '2', yarnTypes: 'Sport, Baby', knitGauge: '23–26', crochetGauge: '16–20', needleMM: '3.25–3.75 mm', needleUS: '3–5', hookMM: '3.5–4.5 mm', hookUS: 'E-4 to 7', yardageFactor: 0.045, typicalYardagePer100g: 370 },
  { id: 3, name: 'Light', symbol: '3', yarnTypes: 'DK, Light Worsted', knitGauge: '21–24', crochetGauge: '12–17', needleMM: '3.75–4.5 mm', needleUS: '5–7', hookMM: '4.5–5.5 mm', hookUS: '7 to I-9', yardageFactor: 0.050, typicalYardagePer100g: 300 },
  { id: 4, name: 'Medium', symbol: '4', yarnTypes: 'Worsted, Afghan, Aran', knitGauge: '16–20', crochetGauge: '11–14', needleMM: '4.5–5.5 mm', needleUS: '7–9', hookMM: '5.5–6.5 mm', hookUS: 'I-9 to K-10½', yardageFactor: 0.055, typicalYardagePer100g: 220 },
  { id: 5, name: 'Bulky', symbol: '5', yarnTypes: 'Chunky, Craft, Rug', knitGauge: '12–15', crochetGauge: '8–11', needleMM: '5.5–8 mm', needleUS: '9–11', hookMM: '6.5–9 mm', hookUS: 'K-10½ to M-13', yardageFactor: 0.065, typicalYardagePer100g: 160 },
  { id: 6, name: 'Super Bulky', symbol: '6', yarnTypes: 'Super Bulky, Roving', knitGauge: '7–11', crochetGauge: '7–9', needleMM: '8–12.75 mm', needleUS: '11–17', hookMM: '9–15 mm', hookUS: 'M-13 to Q', yardageFactor: 0.080, typicalYardagePer100g: 110 },
  { id: 7, name: 'Jumbo', symbol: '7', yarnTypes: 'Jumbo, Roving', knitGauge: '≤6', crochetGauge: '≤6', needleMM: '≥12.75 mm', needleUS: '≥17', hookMM: '≥15 mm', hookUS: 'Q and larger', yardageFactor: 0.100, typicalYardagePer100g: 80 },
];

export const PROJECT_TYPES: ProjectType[] = [
  { id: 'scarf', label: 'Scarf', defaultWidth: 8, defaultHeight: 60, unit: 'inches' },
  { id: 'blanket', label: 'Blanket', defaultWidth: 50, defaultHeight: 60, unit: 'inches' },
  { id: 'hat', label: 'Hat', defaultWidth: 20, defaultHeight: 8, unit: 'inches', note: 'Circumference × height' },
  { id: 'socks', label: 'Socks', defaultWidth: 8, defaultHeight: 10, unit: 'inches', note: 'Per sock (×2 for pair)' },
  { id: 'sweater', label: 'Sweater', defaultWidth: 40, defaultHeight: 26, unit: 'inches', note: 'Chest × body length + sleeves' },
  { id: 'shawl', label: 'Shawl', defaultWidth: 60, defaultHeight: 24, unit: 'inches' },
  { id: 'cardigan', label: 'Cardigan', defaultWidth: 42, defaultHeight: 27, unit: 'inches', note: 'Chest × body length + sleeves' },
  { id: 'custom', label: 'Custom', defaultWidth: 10, defaultHeight: 10, unit: 'inches' },
];

/** Get the average stitches per 4 inches from a gauge range string */
export function getAverageGauge(gaugeRange: string): number {
  const parts = gaugeRange.split('–');
  if (parts.length === 2) {
    const low = parseFloat(parts[0]);
    const high = parseFloat(parts[1]);
    if (!isNaN(low) && !isNaN(high)) return (low + high) / 2;
  }
  // For "≤6" type ranges
  const match = gaugeRange.match(/[≤≥]?\s*(\d+(?:\.\d+)?)/);
  if (match) return parseFloat(match[1]);
  return 16; // default fallback
}
