import { YARN_WEIGHTS, PROJECT_TYPES, getAverageGauge } from '../lib/yarnData';
import { calculate, formatResultSummary } from '../lib/calculator';
import { saveProject, loadProjects, deleteProject } from '../lib/projectHistory';
import type { SavedProject } from '../lib/projectHistory';

export function initCalculator(): void {
  const form = document.getElementById('calculator-form');
  if (!form) return;

  const weightSelect = document.getElementById('yarn-weight') as HTMLSelectElement;
  const projectSelect = document.getElementById('project-type') as HTMLSelectElement;
  const widthInput = document.getElementById('project-width') as HTMLInputElement;
  const heightInput = document.getElementById('project-height') as HTMLInputElement;
  const stitchesInput = document.getElementById('gauge-stitches') as HTMLInputElement;
  const rowsInput = document.getElementById('gauge-rows') as HTMLInputElement;
  const skeinInput = document.getElementById('skein-yardage') as HTMLInputElement;
  const unitToggle = document.getElementById('unit-toggle') as HTMLSelectElement;
  const resultsArea = document.getElementById('calculator-results');
  const weightInfo = document.getElementById('weight-info');
  const historyList = document.getElementById('project-history-list');
  const saveBtn = document.getElementById('save-project-btn');
  const calcBtn = document.getElementById('calculate-btn') as HTMLButtonElement;

  // Populate weight dropdown
  if (weightSelect) {
    YARN_WEIGHTS.forEach(w => {
      const opt = document.createElement('option');
      opt.value = String(w.id);
      opt.textContent = `${w.symbol} - ${w.name}`;
      weightSelect.appendChild(opt);
    });
  }

  // Populate project dropdown
  if (projectSelect) {
    PROJECT_TYPES.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.label;
      projectSelect.appendChild(opt);
    });
  }

  function updateWeightInfo(): void {
    const id = parseInt(weightSelect?.value || '4');
    const weight = YARN_WEIGHTS.find(w => w.id === id);
    if (weight && weightInfo) {
      weightInfo.innerHTML = `
        <div class="text-sm space-y-1">
          <p><strong>Types:</strong> ${weight.yarnTypes}</p>
          <p><strong>Knit gauge:</strong> ${weight.knitGauge} sts / 4"</p>
          <p><strong>Needles:</strong> ${weight.needleMM} (US ${weight.needleUS})</p>
          <p><strong>Hooks:</strong> ${weight.hookMM} (US ${weight.hookUS})</p>
          <p><strong>Typical yardage:</strong> ~${weight.typicalYardagePer100g} yds / 100g</p>
        </div>
      `;
      // Auto-fill gauge
      if (stitchesInput) stitchesInput.value = String(Math.round(getAverageGauge(weight.knitGauge)));
      if (rowsInput) rowsInput.value = String(Math.round(getAverageGauge(weight.knitGauge) * 0.75));
    }
  }

  function updateProjectDimensions(): void {
    const id = projectSelect?.value || 'custom';
    const project = PROJECT_TYPES.find(p => p.id === id);
    if (project) {
      if (widthInput) widthInput.value = String(project.defaultWidth);
      if (heightInput) heightInput.value = String(project.defaultHeight);
      const note = document.getElementById('project-note');
      if (note) note.textContent = project.note || '';
    }
  }

  function doCalculate(): void {
    const weightId = parseInt(weightSelect?.value || '4');
    const projectType = projectSelect?.value || 'custom';
    const width = parseFloat(widthInput?.value || '10');
    const height = parseFloat(heightInput?.value || '10');
    const stitches = parseFloat(stitchesInput?.value || '16');
    const rows = parseFloat(rowsInput?.value || '12');
    const skeinYardage = parseFloat(skeinInput?.value || '0');
    const unit = (unitToggle?.value || 'inches') as 'inches' | 'cm';

    if (!width || !height || width <= 0 || height <= 0) {
      if (resultsArea) resultsArea.innerHTML = '<p class="text-terracotta p-4">Please enter valid project dimensions.</p>';
      return;
    }

    const result = calculate({
      yarnWeightId: weightId,
      projectType,
      width,
      height,
      stitchesPer4Inches: stitches,
      rowsPer4Inches: rows,
      skeinYardage,
      unit,
    });

    if (resultsArea) {
      resultsArea.innerHTML = `
        <div class="bg-[var(--color-bg-card)] rounded-xl p-6 shadow-sm border border-[var(--color-border)] space-y-6">
          <h3 class="text-xl font-semibold text-[var(--color-text)]">Results for ${result.projectLabel}</h3>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-4 bg-[var(--color-bg-sidebar)] rounded-lg">
              <div class="result-number">${result.yardageYards}</div>
              <div class="text-sm text-[var(--color-text-secondary)]">Yards Needed</div>
            </div>
            <div class="text-center p-4 bg-[var(--color-bg-sidebar)] rounded-lg">
              <div class="result-number">${result.yardageMeters}</div>
              <div class="text-sm text-[var(--color-text-secondary)]">Meters Needed</div>
            </div>
            <div class="text-center p-4 bg-[var(--color-bg-sidebar)] rounded-lg">
              <div class="result-number" style="color: var(--color-accent)">${result.skeinsNeeded}</div>
              <div class="text-sm text-[var(--color-text-secondary)]">Skeins (${result.skeinYardage} yds ea.)</div>
            </div>
            <div class="text-center p-4 bg-[var(--color-bg-sidebar)] rounded-lg">
              <div class="result-number" style="color: var(--color-accent)">${result.totalStitches.toLocaleString()}</div>
              <div class="text-sm text-[var(--color-text-secondary)]">Stitches per Row</div>
            </div>
          </div>

          <div class="flex gap-2 items-center text-sm text-[var(--color-text-secondary)]">
            <span>🧶 ${result.yarnWeight.name} weight</span>
            <span>·</span>
            <span>${result.totalRows.toLocaleString()} rows</span>
            <span>·</span>
            <span>${result.totalStitchCount.toLocaleString()} total stitches</span>
          </div>

          <button id="save-result-btn" class="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)] transition text-sm">
            💾 Save Calculation
          </button>
        </div>
      `;
    }

    // Enable save
    const saveResultBtn = document.getElementById('save-result-btn');
    if (saveResultBtn) {
      saveResultBtn.addEventListener('click', () => {
        const project: SavedProject = {
          id: Date.now().toString(),
          name: `${result.projectLabel} - ${new Date().toLocaleDateString()}`,
          date: new Date().toISOString(),
          input: { yarnWeightId: weightId, projectType, width, height, stitchesPer4Inches: stitches, rowsPer4Inches: rows, skeinYardage, unit },
          result: { yardageYards: result.yardageYards, yardageMeters: result.yardageMeters, skeinsNeeded: result.skeinsNeeded, yarnWeightName: result.yarnWeight.name, projectLabel: result.projectLabel },
        };
        saveProject(project);
        renderHistory();
      });
    }

    window.scrollTo({ top: resultsArea?.offsetTop ? resultsArea.offsetTop - 100 : 0, behavior: 'smooth' });
  }

  function renderHistory(): void {
    const projects = loadProjects();
    if (!historyList) return;
    if (projects.length === 0) {
      historyList.innerHTML = '<p class="text-sm text-[var(--color-text-secondary)] italic">No saved calculations yet.</p>';
      return;
    }
    historyList.innerHTML = projects.map(p => `
      <div class="flex justify-between items-center p-3 bg-[var(--color-bg-sidebar)] rounded-lg text-sm">
        <div>
          <strong>${p.result.projectLabel}</strong> — ${p.result.yardageYards} yds (${p.result.skeinsNeeded} skeins)
          <div class="text-xs text-[var(--color-text-secondary)]">${new Date(p.date).toLocaleDateString()} · ${p.result.yarnWeightName}</div>
        </div>
        <button class="delete-project text-terracotta hover:text-[var(--color-cta-hover)] text-xs" data-id="${p.id}">✕ Delete</button>
      </div>
    `).join('');

    // Attach delete handlers
    historyList.querySelectorAll('.delete-project').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id;
        if (id) deleteProject(id);
        renderHistory();
      });
    });
  }

  // Event listeners
  weightSelect?.addEventListener('change', updateWeightInfo);
  projectSelect?.addEventListener('change', updateProjectDimensions);
  calcBtn?.addEventListener('click', (e) => { e.preventDefault(); doCalculate(); });

  // Init
  updateWeightInfo();
  updateProjectDimensions();
  renderHistory();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalculator);
  } else {
    initCalculator();
  }
}
