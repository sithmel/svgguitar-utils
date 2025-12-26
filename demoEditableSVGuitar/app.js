//@ts-check
import { EditableSVGuitarChord } from '../lib/editableSVGuitar.js';

/** @type {HTMLElement} */
const editor = /** @type {HTMLElement} */(document.getElementById('editor'));
/** @type {HTMLElement} */
const output = /** @type {HTMLElement} */(document.getElementById('output'));
/** @type {HTMLElement} */
const outputAscii = /** @type {HTMLElement} */(document.getElementById('output-ascii'));
/** @type {HTMLElement} */
const outputUnicode = /** @type {HTMLElement} */(document.getElementById('output-unicode'));


if (!editor || !outputAscii || !outputUnicode) {
  throw new Error('Required DOM elements not found');
}

const editable = new EditableSVGuitarChord(editor)
  .chord({ fingers: [], barres: [] })
  .configure({ frets: 5, noPosition: true })
  .draw();

editable.onChange(() => {
  updateJSON();
});

/** Update JSON panel */
function updateJSON() {
  output.textContent = JSON.stringify(editable.getChord(), null, 2);
  outputAscii.textContent = editable.toString({ useUnicode: false });
  outputUnicode.textContent = editable.toString({ useUnicode: true });
}

document.getElementById('clear')?.addEventListener('click', () => {
  editable.chord({ fingers: [], barres: [] }).redraw();
  updateJSON();
});

document.getElementById('copy-json')?.addEventListener('click', () => {
  navigator.clipboard.writeText(output.textContent || '').catch(err => {
    console.error('Failed to copy JSON:', err);
  });
});

document.getElementById('copy-ascii')?.addEventListener('click', () => {
  navigator.clipboard.writeText(outputAscii.textContent || '').catch(err => {
    console.error('Failed to copy ASCII:', err);
  });
});

document.getElementById('copy-unicode')?.addEventListener('click', () => {
  navigator.clipboard.writeText(outputUnicode.textContent || '').catch(err => {
    console.error('Failed to copy Unicode:', err);
  });
});

// Initial panel fill
updateJSON();