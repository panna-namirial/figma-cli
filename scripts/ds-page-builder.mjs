/**
 * DS 2026 page builder — reusable scaffold
 *
 * Patterns:
 *   - Import DS library variables (Theme, Primitives) via teamLibrary API
 *   - Bind fills and font-family to variables on custom text/frame nodes
 *   - Create and configure DS component instances (input, toggle, tag, button)
 *
 * Run: node scripts/ds-page-builder.mjs
 */

import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const token = readFileSync(join(homedir(), '.figma-ds-cli', '.daemon-token'), 'utf8').trim();

const code = `(async () => {

  // ── Import DS library variables ───────────────────────────────────────────
  //
  // Variables live in the DS 2026 library (separate file), NOT in the current
  // document. getLocalVariablesAsync() returns 0 results. We must import them
  // via teamLibrary before use.
  //
  // Rule: always use theme/* variables for fills/strokes on custom nodes.
  //       Never use primitive colors (color/*) unless explicitly required.
  //       Component-specific variables (input/border, button/*) only inside
  //       their own DS components.

  const V = {};
  try {
    const libCols = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
    const themeCol = libCols.find(c => c.name === 'Theme');
    const primCol  = libCols.find(c => c.name === 'Primitives');

    // Add/remove entries as needed for your page
    const themeNeeded = [
      'theme/foreground',
      'theme/foreground-secondary',
      'theme/foreground-muted',
      'theme/background',
      'theme/background-secondary',
      'theme/divider',
    ];

    if (themeCol) {
      const tvars = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(themeCol.key);
      for (const lv of tvars) {
        if (themeNeeded.includes(lv.name)) {
          try { V[lv.name] = await figma.variables.importVariableByKeyAsync(lv.key); } catch(e) {}
        }
      }
    }
    if (primCol) {
      const pvars = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(primCol.key);
      const fv = pvars.find(v => v.name === 'font/family');
      if (fv) { try { V['font/family'] = await figma.variables.importVariableByKeyAsync(fv.key); } catch(e) {} }
    }
  } catch(e) {}

  // ── Helpers ───────────────────────────────────────────────────────────────

  function paint(varName) {
    const v = V[varName];
    if (!v) return null;
    try {
      return figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v
      );
    } catch(e) { return null; }
  }

  function applyFill(node, varName) {
    const p = paint(varName);
    if (p) node.fills = [p];
  }

  // ── Font family from DS variable ──────────────────────────────────────────
  let fontFamily = 'Inter'; // fallback
  const fontVar = V['font/family'];
  if (fontVar) {
    const modeId = Object.keys(fontVar.valuesByMode)[0];
    const val = fontVar.valuesByMode[modeId];
    if (typeof val === 'string') fontFamily = val;
  }

  await Promise.all([
    figma.loadFontAsync({ family: fontFamily, style: 'Regular' }),
    figma.loadFontAsync({ family: fontFamily, style: 'Medium' }),
    figma.loadFontAsync({ family: fontFamily, style: 'Bold' }),
  ]);

  // ── DS collections (from ds-config.js) ───────────────────────────────────
  const DIM    = 'VariableCollectionId:5a4931ead4cda523d6809f3631775f64aa023a18/1740:254';
  const INTENT = 'VariableCollectionId:0ce37a59cd310eed8b8df53a3ed5cc812040b9f8/1777:0';
  const MD_MODE        = '1107:0';
  const PRIMARY_MODE   = '78:5';
  const SECONDARY_MODE = '574:1';

  // ── DS component imports (keys from ds-config.js) ─────────────────────────
  const [inputComp, toggleComp, buttonComp, tagComp] = await Promise.all([
    figma.importComponentByKeyAsync('c924e7da19ee6aaba7e8a0ce4fd771b5fda9b458'), // input
    figma.importComponentByKeyAsync('e15034ad1155e858fe8fc2c8a7026b06b99456bc'), // toggle
    figma.importComponentByKeyAsync('4fec8b890726ad26baee56861e80c7065f6a37b6'), // button
    figma.importComponentByKeyAsync('c31ac239edb479cd0a5bcf3c005679afab4f03ba'), // tag (Intent)
  ]);

  // ── Node helpers ──────────────────────────────────────────────────────────

  /** Create a text node with DS font and variable color */
  function makeText(chars, style, size, colorVar) {
    const t = figma.createText();
    t.fontName = { family: fontFamily, style };
    t.fontSize = size;
    t.characters = chars;
    applyFill(t, colorVar);
    if (V['font/family']) {
      try { t.setBoundVariable('fontFamily', V['font/family']); } catch(e) {}
    }
    return t;
  }

  /** Append a node and set it to fill parent horizontally */
  function appendFill(parent, node) {
    parent.appendChild(node);
    node.layoutSizingHorizontal = 'FILL';
  }

  /** Card: vertical auto-layout frame with background + divider border */
  function makeCard(name) {
    const card = figma.createFrame();
    card.name = name;
    card.layoutMode = 'VERTICAL';
    card.primaryAxisSizingMode = 'AUTO';
    card.counterAxisSizingMode = 'AUTO';
    card.paddingTop = card.paddingBottom = card.paddingLeft = card.paddingRight = 24;
    card.itemSpacing = 16;
    card.cornerRadius = 8;
    applyFill(card, 'theme/background');
    const border = paint('theme/divider');
    if (border) { card.strokes = [border]; card.strokeWeight = 1; }
    return card;
  }

  /** Input component instance (md size, primary intent) */
  function makeInput(label, opts) {
    opts = opts || {};
    const inst = inputComp.createInstance();
    inst.setExplicitVariableModeForCollection(DIM, MD_MODE);
    inst.setExplicitVariableModeForCollection(INTENT, PRIMARY_MODE);
    inst.setProperties({ 'Show help text#1736:60': false });

    const labelInst = inst.children.find(c => c.name === 'Label');
    if (labelInst) {
      labelInst.setProperties({
        'Label text#1736:57': label,
        'Required#1581:0': false,
        'Optional#1583:12': false,
      });
    }
    const container = inst.children.find(c => c.name === 'Input container');
    const content = container?.children?.find(c => c.name === 'Input content');
    if (content && opts.type) {
      try { content.setProperties({ 'Type': opts.type }); } catch(e) {}
    }
    const textInst = content?.children?.find(c => c.type === 'INSTANCE');
    if (textInst) {
      let ph, status;
      if (opts.value)             { ph = opts.value;       status = 'Filled'; }
      else if (opts.type === 'Select') { ph = 'Select';    status = 'Text'; }
      else                         { ph = opts.placeholder || ''; status = 'Placeholder'; }
      try { textInst.setProperties({ 'Text#1341:0': ph, 'Status': status }); } catch(e) {}
    }
    return inst;
  }

  /** Toggle + label row */
  function makeToggleRow(label) {
    const row = figma.createFrame();
    row.name = label;
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisSizingMode = 'AUTO';
    row.counterAxisSizingMode = 'AUTO';
    row.counterAxisAlignItems = 'CENTER';
    row.itemSpacing = 12;
    row.fills = [];
    const toggle = toggleComp.createInstance();
    toggle.setProperties({ 'Selection': 'OFF', 'Interaction': 'Default' });
    row.appendChild(toggle);
    const txt = makeText(label, 'Regular', 14, 'theme/foreground');
    row.appendChild(txt);
    txt.layoutSizingHorizontal = 'FILL';
    return row;
  }

  // ── Build your page here ──────────────────────────────────────────────────

  // Example: replace old frame and place new one at (0, 0)
  // const old = figma.currentPage.children.find(n => n.name === 'My Page');
  // if (old) old.remove();
  //
  // const frame = figma.createFrame();
  // frame.name = 'My Page';
  // frame.layoutMode = 'VERTICAL';
  // ...
  // figma.currentPage.appendChild(frame);
  // figma.viewport.scrollAndZoomIntoView([frame]);

  return { font: fontFamily, varsLoaded: Object.keys(V) };
})()`;

const resp = await fetch('http://localhost:3456/exec', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Daemon-Token': token },
  body: JSON.stringify({ action: 'eval', code }),
});
const result = await resp.json();
if (result.error) { console.error('Error:', result.error); process.exit(1); }
console.log('Done:', result.result);
