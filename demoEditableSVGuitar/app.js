//@ts-check
import { EditableSVGuitarChord } from '../lib/editableSVGuitar.js';
import { SVGuitarChord } from 'svguitar';
import splitStringInRectangles from '../lib/splitStringInRectangles.js';
import stringToFingering from '../lib/stringToFingering.js';

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

// Tab switching
document.getElementById('tab-editor')?.addEventListener('click', () => {
  document.getElementById('tab-editor')?.classList.add('active');
  document.getElementById('tab-batch')?.classList.remove('active');
  document.getElementById('interactive-editor')?.classList.add('active');
  document.getElementById('batch-converter')?.classList.remove('active');
});

document.getElementById('tab-batch')?.addEventListener('click', () => {
  document.getElementById('tab-batch')?.classList.add('active');
  document.getElementById('tab-editor')?.classList.remove('active');
  document.getElementById('batch-converter')?.classList.add('active');
  document.getElementById('interactive-editor')?.classList.remove('active');
});

// Batch conversion
document.getElementById('convert-btn')?.addEventListener('click', () => {
  const textarea = /** @type {HTMLTextAreaElement} */(document.getElementById('batch-input'));
  const chordGrid = document.getElementById('chord-grid');
  
  if (!textarea || !chordGrid) {
    console.error('Required elements not found');
    return;
  }

  const input = textarea.value;
  if (!input.trim()) {
    console.warn('No input provided');
    return;
  }

  try {
    // Clear previous results
    chordGrid.innerHTML = '';

    // Split input into rectangles
    const rectangles = splitStringInRectangles(input);
    
    if (rectangles.length === 0) {
      console.warn('No chord diagrams found in input');
      return;
    }

    console.log(`Found ${rectangles.length} chord diagram(s)`);

    // Convert each rectangle to a chord and render
    rectangles.forEach((rectangle, index) => {
      try {
        const chordConfig = stringToFingering(rectangle);
        
        // Create container for this chord
        const container = document.createElement('div');
        container.className = 'chord-container';
        chordGrid.appendChild(container);

        // Render the chord
        const chart = new SVGuitarChord(container);
        const frets = Math.max(...chordConfig.fingers.map(f => (typeof f[1] === 'number' ? f[1] : 0)), 3);
        const noPosition = chordConfig.position === 0 || (chordConfig.position === undefined);
        console.log(chordConfig, noPosition, frets);
        chart
          .chord(chordConfig)
          .configure({ frets, noPosition })
          .draw();
      } catch (err) {
        console.error(`Error rendering chord ${index + 1}:`, err);
      }
    });
  } catch (err) {
    console.error('Error during batch conversion:', err);
  }
});
