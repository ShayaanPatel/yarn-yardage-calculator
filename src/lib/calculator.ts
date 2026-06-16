import type { CalculationInput, CalculationResult } from './yarnData';
import { YARN_WEIGHTS, PROJECT_TYPES, getAverageGauge } from './yarnData';

export function calculateTotalStitches(width: number, gaugeStitches: number, unit: 'inches' | 'cm'): number {
  const effectiveWidth = unit === 'cm' ? width / 2.54 : width;
  const stitchesPerInch = gaugeStitches / 4;
  return Math.ceil(effectiveWidth * stitchesPerInch);
}

export function calculateTotalRows(height: number, gaugeRows: number, unit: 'inches' | 'cm'): number {
  const effectiveHeight = unit === 'cm' ? height / 2.54 : height;
  const rowsPerInch = gaugeRows / 4;
  return Math.ceil(effectiveHeight * rowsPerInch);
}

export function estimateYardage(totalStitches: number, totalRows: number, yardageFactor: number): number {
  // Base yardage = (stitches per row × rows) × yardage per stitch
  const baseYardage = totalStitches * totalRows * yardageFactor;
  // Add 15% buffer for edge stitches, weaving, and tension variance
  return Math.ceil(baseYardage * 1.15);
}

export function convertYardsToMeters(yards: number): number {
  return Math.ceil(yards * 0.9144);
}

export function calculateSkeins(yardage: number, skeinYardage: number): number {
  if (skeinYardage <= 0) return 0;
  return Math.ceil(yardage / skeinYardage);
}

export function getSkeinYardageForWeight(yarnWeightId: number, skeinSizeGrams: number = 100): number {
  const weight = YARN_WEIGHTS.find(w => w.id === yarnWeightId);
  if (!weight) return 200;
  return Math.round((weight.typicalYardagePer100g / 100) * skeinSizeGrams);
}

export function getSubstitutionAdvice(fromId: number, toId: number): string {
  const from = YARN_WEIGHTS.find(w => w.id === fromId);
  const to = YARN_WEIGHTS.find(w => w.id === toId);
  if (!from || !to) return '';

  const diff = to.id - from.id;

  if (diff === 0) return 'Same yarn weight — no substitution needed.';
  if (diff === 1) return `Use ${to.name} as a slightly thicker alternative. Check gauge — you may need to go up a needle/hook size.`;
  if (diff === -1) return `Use ${to.name} as a slightly thinner alternative. Check gauge — you may need to go down a needle/hook size.`;

  if (diff >= 2) {
    const strandCount = Math.min(Math.ceil((from.yardageFactor * 2) / to.yardageFactor), 4);
    return `Substituting ${to.name} for ${from.name}: hold ${strandCount} strands together to approximate the thickness. Adjust needle size and swatch carefully. Yardage will increase significantly.`;
  }

  if (diff <= -2) {
    return `Substituting ${to.name} for ${from.name}: this is a much lighter yarn. You'll need significantly more yardage (approximately ${Math.round(from.yardageFactor / to.yardageFactor)}×). Work a gauge swatch first.`;
  }

  return '';
}

export function calculate(input: CalculationInput): CalculationResult {
  const yarnWeight = YARN_WEIGHTS.find(w => w.id === input.yarnWeightId) || YARN_WEIGHTS[4];
  const projectType = PROJECT_TYPES.find(p => p.id === input.projectType) || PROJECT_TYPES[7];

  const avgKnitGauge = input.stitchesPer4Inches > 0
    ? input.stitchesPer4Inches
    : getAverageGauge(yarnWeight.knitGauge);

  const avgRowGauge = input.rowsPer4Inches > 0
    ? input.rowsPer4Inches
    : getAverageGauge(yarnWeight.knitGauge) * 0.75; // rows are typically ~75% of stitch gauge

  // For cylindrical items (hat, socks), calculate area as circumference × height
  let totalStitches: number;
  let totalRows: number;

  if (input.projectType === 'hat') {
    // Hat: circumference × height
    totalStitches = calculateTotalStitches(input.width, avgKnitGauge, input.unit);
    totalRows = calculateTotalRows(input.height, avgRowGauge, input.unit);
  } else if (input.projectType === 'socks') {
    // Socks: per sock, then ×2
    totalStitches = calculateTotalStitches(input.width, avgKnitGauge, input.unit);
    totalRows = calculateTotalRows(input.height, avgRowGauge, input.unit);
    // Double for pair
    totalStitches *= 2;
  } else if (input.projectType === 'sweater' || input.projectType === 'cardigan') {
    // Sweater: front + back + sleeves (approximate total width 1.5× chest)
    const sweaterWidth = input.width * 1.5;
    totalStitches = calculateTotalStitches(sweaterWidth, avgKnitGauge, input.unit);
    totalRows = calculateTotalRows(input.height, avgRowGauge, input.unit);
  } else {
    // Flat items: width × height
    totalStitches = calculateTotalStitches(input.width, avgKnitGauge, input.unit);
    totalRows = calculateTotalRows(input.height, avgRowGauge, input.unit);
  }

  // Calculate yardage
  const totalStitchCount = totalStitches * totalRows;
  const skeinYardage = input.skeinYardage > 0 ? input.skeinYardage : getSkeinYardageForWeight(input.yarnWeightId);
  const yardageYards = estimateYardage(totalStitches, totalRows, yarnWeight.yardageFactor);
  const yardageMeters = convertYardsToMeters(yardageYards);
  const skeinsNeeded = calculateSkeins(yardageYards, skeinYardage);

  return {
    totalStitches,
    totalRows,
    totalStitchCount,
    yardageYards,
    yardageMeters,
    skeinsNeeded,
    skeinYardage,
    yarnWeight,
    projectLabel: projectType.label,
  };
}

/** Get a human-readable summary string */
export function formatResultSummary(result: CalculationResult): string {
  return [
    `Project: ${result.projectLabel}`,
    `Yarn weight: ${result.yarnWeight.name}`,
    `Yardage: ~${result.yardageYards} yards (${result.yardageMeters} meters)`,
    `Skeins needed: ${result.skeinsNeeded} (based on ${result.skeinYardage} yards/skein)`,
    `Stitches: ${result.totalStitches} per row × ${result.totalRows} rows`,
    `Total stitches: ${result.totalStitchCount.toLocaleString()}`,
  ].join('\n');
}
