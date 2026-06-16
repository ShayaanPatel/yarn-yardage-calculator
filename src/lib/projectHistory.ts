export interface SavedProject {
  id: string;
  name: string;
  date: string;
  input: {
    yarnWeightId: number;
    projectType: string;
    width: number;
    height: number;
    stitchesPer4Inches: number;
    rowsPer4Inches: number;
    skeinYardage: number;
    unit: 'inches' | 'cm';
  };
  result: {
    yardageYards: number;
    yardageMeters: number;
    skeinsNeeded: number;
    yarnWeightName: string;
    projectLabel: string;
  };
}

const STORAGE_KEY = 'yarn-yardage-projects';
const MAX_PROJECTS = 20;

export function loadProjects(): SavedProject[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveProject(project: SavedProject): void {
  const projects = loadProjects();
  projects.unshift(project);
  // Keep only latest N
  while (projects.length > MAX_PROJECTS) projects.pop();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Storage full or unavailable
  }
}

export function deleteProject(id: string): void {
  const projects = loadProjects().filter(p => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // ignore
  }
}

export function exportAsText(project: SavedProject): string {
  return [
    `=== Yarn Yardage Calculation ===`,
    `Project: ${project.result.projectLabel}`,
    `Date: ${new Date(project.date).toLocaleDateString()}`,
    ``,
    `Yarn Weight: ${project.result.yarnWeightName}`,
    `Dimensions: ${project.input.width}" × ${project.input.height}"`,
    `Gauge: ${project.input.stitchesPer4Inches} sts × ${project.input.rowsPer4Inches} rows per 4"`,
    ``,
    `Estimated Yardage: ~${project.result.yardageYards} yards (${project.result.yardageMeters} meters)`,
    `Skeins Needed: ~${project.result.skeinsNeeded}`,
  ].join('\n');
}
