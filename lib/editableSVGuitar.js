//@ts-check

import fingeringToString from './fingeringToString.js';
import { SVGuitarChord } from 'svguitar';

/**
 * Available colors for dots: red and black only
 */
export const DOT_COLORS = {
  RED: '#e74c3c',
  BLACK: '#000000'
};

/**
 * EditableSVGuitarChord - Wrapper around SVGuitarChord that adds interactive editing capabilities
 * 
 * Features:
 * - Click on fretboard to add dots
 * - Click existing dots to edit/remove them
 * - Dialog for editing dot text and color
 * - Fret count selector
 * - Maintains same interface as SVGuitarChord
 */
export class EditableSVGuitarChord {
  /**
   * @param {HTMLElement} container
   * @param {any} SVGuitarChordClass
   */
  constructor(container, SVGuitarChordClass = SVGuitarChord) {
    this.container = container;
    this.SVGuitarChordClass = SVGuitarChordClass;
    
    /** @type {import("svguitar").Chord} */
    this.chordConfig = { fingers: [], barres: [], title: undefined, position: undefined };
    
    /** @type {any} */
    this.config = { frets: 5, noPosition: true };
    
    this.svgChord = null;
    this.isDialogOpen = false;
    this.controlsCreated = false;
    this.currentEditElement = null;
    
    /** @type {Function|null} */
    this.changeCallback = null;
    
    // Only create controls if we have a real DOM environment
    if (typeof document !== 'undefined') {
      this.createControls();
    }
    // Add the CSS rules if not already added
    this.addCustomCSS();
  }

  /**
   * Create controls and containers
   */
  createControls() {
    this.controlsCreated = true;
    
    // Create wrapper with flex layout
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'editable-svguitar-wrapper';
    this.wrapper.style.cssText = 'position: relative;';
    this.container.appendChild(this.wrapper);
    
    // Create settings button
    this.settingsButton = document.createElement('button');
    this.settingsButton.className = 'editable-svguitar-settings-btn';
    this.settingsButton.innerHTML = '⚙️';
    this.settingsButton.title = 'Edit title and position';
    this.settingsButton.style.cssText = `
      position: absolute;
      top: 5px;
      left: 5px;
      background: white;
      border: 1px solid #333;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 14px;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    this.settingsButton.addEventListener('click', () => this.openSettingsDialog());
    this.wrapper.appendChild(this.settingsButton);
    
    // Create SVG container
    this.svgContainer = document.createElement('div');
    this.svgContainer.className = 'editable-svguitar-svg';
    this.wrapper.appendChild(this.svgContainer);
    
    // Create dialogs
    this.createDialog();
    this.createSettingsDialog();
  }

  /**
   * Create the settings dialog for title and position
   */
  createSettingsDialog() {
    this.settingsDialog = document.createElement('div');
    this.settingsDialog.className = 'editable-svguitar-settings-dialog';
    this.settingsDialog.style.cssText = `
      display: none;
      position: absolute;
      background: white;
      border: 2px solid #333;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 1000;
      min-width: 280px;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Chord Settings';
    title.style.cssText = 'margin: 0 0 15px 0; font-size: 16px;';

    // Title input
    const titleSection = document.createElement('div');
    titleSection.style.cssText = 'margin-bottom: 15px;';
    
    const titleLabel = document.createElement('label');
    titleLabel.textContent = 'Title (optional): ';
    titleLabel.style.cssText = 'display: block; margin-bottom: 5px; font-weight: bold;';
    
    this.titleInput = document.createElement('input');
    this.titleInput.type = 'text';
    this.titleInput.placeholder = 'e.g., A min, G7';
    this.titleInput.style.cssText = 'width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 3px; box-sizing: border-box;';
    
    titleLabel.appendChild(this.titleInput);
    titleSection.appendChild(titleLabel);

    // Position input
    const positionSection = document.createElement('div');
    positionSection.style.cssText = 'margin-bottom: 15px;';
    
    const positionLabel = document.createElement('label');
    positionLabel.textContent = 'Position (optional): ';
    positionLabel.style.cssText = 'display: block; margin-bottom: 5px; font-weight: bold;';
    
    this.positionInput = document.createElement('input');
    this.positionInput.type = 'number';
    this.positionInput.min = '0';
    this.positionInput.max = '30';
    this.positionInput.placeholder = '0-30';
    this.positionInput.style.cssText = 'width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 3px; box-sizing: border-box;';
    
    positionLabel.appendChild(this.positionInput);
    positionSection.appendChild(positionLabel);

    // Buttons
    const buttonDiv = document.createElement('div');
    buttonDiv.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'padding: 6px 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;';
    cancelBtn.addEventListener('click', () => this.closeSettingsDialog());

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.style.cssText = 'padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;';
    saveBtn.addEventListener('click', () => this.saveSettings());

    buttonDiv.appendChild(cancelBtn);
    buttonDiv.appendChild(saveBtn);

    this.settingsDialog.appendChild(title);
    this.settingsDialog.appendChild(titleSection);
    this.settingsDialog.appendChild(positionSection);
    this.settingsDialog.appendChild(buttonDiv);

    document.body.appendChild(this.settingsDialog);

    // Add backdrop for settings dialog
    this.settingsBackdrop = document.createElement('div');
    this.settingsBackdrop.className = 'editable-svguitar-settings-backdrop';
    this.settingsBackdrop.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 999;
    `;
    this.settingsBackdrop.addEventListener('click', () => this.closeSettingsDialog());
    document.body.appendChild(this.settingsBackdrop);
  }

  /**
   * Create the edit dialog
   */
  createDialog() {
    this.dialog = document.createElement('div');
    this.dialog.className = 'editable-svguitar-dialog';
    this.dialog.style.cssText = `
      display: none;
      position: absolute;
      background: white;
      border: 2px solid #333;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 1000;
      min-width: 250px;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Edit Dot';
    title.style.cssText = 'margin: 0 0 15px 0; font-size: 16px;';

    // Color selection with radio buttons
    const colorSection = document.createElement('div');
    colorSection.style.cssText = 'margin-bottom: 15px;';
    
    const colorLabel = document.createElement('div');
    colorLabel.textContent = 'Color:';
    colorLabel.style.cssText = 'font-weight: bold; margin-bottom: 8px;';
    colorSection.appendChild(colorLabel);

    const colorOptions = document.createElement('div');
    colorOptions.style.cssText = 'display: flex; gap: 15px;';

    // Red option
    const redOption = document.createElement('label');
    redOption.style.cssText = 'display: flex; align-items: center; cursor: pointer;';
    
    this.redRadio = document.createElement('input');
    this.redRadio.type = 'radio';
    this.redRadio.name = 'dotColor';
    this.redRadio.value = DOT_COLORS.RED;
    this.redRadio.addEventListener('change', () => this.updateDotColor());
    
    const redLabel = document.createElement('span');
    redLabel.textContent = 'Red';
    redLabel.style.cssText = 'margin-left: 5px; color: #e74c3c; font-weight: bold;';
    
    redOption.appendChild(this.redRadio);
    redOption.appendChild(redLabel);

    // Black option  
    const blackOption = document.createElement('label');
    blackOption.style.cssText = 'display: flex; align-items: center; cursor: pointer;';
    
    this.blackRadio = document.createElement('input');
    this.blackRadio.type = 'radio';
    this.blackRadio.name = 'dotColor';
    this.blackRadio.value = DOT_COLORS.BLACK;
    this.blackRadio.checked = true; // Default to black
    this.blackRadio.addEventListener('change', () => this.updateDotColor());
    
    const blackLabel = document.createElement('span');
    blackLabel.textContent = 'Black';
    blackLabel.style.cssText = 'margin-left: 5px; color: #000000; font-weight: bold;';
    
    blackOption.appendChild(this.blackRadio);
    blackOption.appendChild(blackLabel);
    
    colorOptions.appendChild(redOption);
    colorOptions.appendChild(blackOption);
    colorSection.appendChild(colorOptions);

    // Text input (conditional on black color)
    this.textSection = document.createElement('div');
    this.textSection.style.cssText = 'margin-bottom: 15px;';
    
    const textLabel = document.createElement('label');
    textLabel.textContent = 'Text (optional): ';
    textLabel.style.cssText = 'display: block; margin-bottom: 5px; font-weight: bold;';
    
    this.textInput = document.createElement('input');
    this.textInput.type = 'text';
    this.textInput.maxLength = 2; // Reduced from 3 to 2
    this.textInput.placeholder = '1-2 chars';
    this.textInput.style.cssText = 'width: 60px; padding: 4px; border: 1px solid #ccc; border-radius: 3px;';
    
    // Add real-time text change listener
    this.textInput.addEventListener('input', () => this.updateDotText());
    
    textLabel.appendChild(this.textInput);
    this.textSection.appendChild(textLabel);

    const buttonDiv = document.createElement('div');
    buttonDiv.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.style.cssText = 'padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;';
    removeBtn.addEventListener('click', () => this.removeDot());

    const doneBtn = document.createElement('button');
    doneBtn.textContent = 'Done';
    doneBtn.style.cssText = 'padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;';
    doneBtn.addEventListener('click', () => this.closeDialog());

    buttonDiv.appendChild(removeBtn);
    buttonDiv.appendChild(doneBtn);

    this.dialog.appendChild(title);
    this.dialog.appendChild(colorSection);
    this.dialog.appendChild(this.textSection);
    this.dialog.appendChild(buttonDiv);

    document.body.appendChild(this.dialog);

    // Add backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'editable-svguitar-backdrop';
    this.backdrop.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 999;
    `;
    this.backdrop.addEventListener('click', () => this.closeDialog());
    document.body.appendChild(this.backdrop);
  }

  /**
   * Set chord configuration
   * @param {import("svguitar").Chord} config
   * @returns {EditableSVGuitarChord}
   */
  chord(config) {
    this.chordConfig = { 
      fingers: config.fingers || [], 
      barres: config.barres || [],
      title: config.title || '',
      position: config.position
    };
    // Update noPosition config based on whether position is set
    this.config.noPosition = config.position === undefined;
    return this;
  }

  /**
   * Configure SVGuitar options
   * @param {any} config
   * @returns {EditableSVGuitarChord}
   */
  configure(config) {
    this.config = { ...this.config, ...config };
    return this;
  }

  /**
   * Calculate dynamic fret count based on chord content
   * @returns {number} - Number of frets needed (minimum 3, max dot position + 1)
   */
  calculateDynamicFrets() {
    const { fingers } = this.chordConfig;
    
    // Find the highest fret position
    let maxFret = 0;
    for (const [, fret] of fingers) {
      if(typeof fret === 'string') continue; // skip 'x' positions
      if (fret > maxFret) {
        maxFret = fret;
      }
    }
    
    // Return minimum 3 frets, or highest fret + 1 for one empty fret above
    return Math.max(3, maxFret);
  }

  /**
   * Draw the chord with interactive capabilities
   * @param {number | undefined} [frets] - Force redraw even if already drawn
   * @returns {EditableSVGuitarChord}
   */
  draw(frets) {
    // Ensure controls are created if we have a DOM environment
    if (typeof document !== 'undefined' && !this.controlsCreated) {
      this.createControls();
    }
    
    // Update fret count dynamically
    this.config.frets = Math.max(frets ?? 0, this.calculateDynamicFrets());
    
    // Add transparent placeholder dots for all fret positions
    const chordWithPlaceholders = this.addPlaceholderDots(this.chordConfig);
    
    // Create new SVGuitar instance only if we have an svgContainer
    if (this.svgContainer) {
      this.svgChord = new this.SVGuitarChordClass(this.svgContainer);
      this.svgChord.chord(chordWithPlaceholders).configure(this.config).draw();
      
      // Add event listeners after drawing
      this.addEventListeners();
    }
    
    return this;
  }

  /**
   * Redraw the chord
   * @param {number | undefined} [frets] - Force redraw even if already drawn
   */
  redraw(frets) {
    if (this.svgContainer) {
      this.svgContainer.innerHTML = '';
    }
    this.draw(frets);
  }

  /**
   * Add transparent placeholder dots for empty positions
   * @param {import("svguitar").Chord} config
   * @returns {import("svguitar").Chord}
   */
  addPlaceholderDots(config) {
    const { fingers, title, position } = config;
    const placeholders = [];
    
    // Add placeholders for all string/fret combinations (they are both 1-based)
    for (let string = 1; string <= 6; string++) {
      for (let fret = 1; fret <= this.config.frets; fret++) {
        // Skip if there's already a finger at this position
        const exists = fingers.some(([s, f]) => s === string && f === fret);
        if (!exists) {
          /** @type {import("svguitar").Finger} */
          const placeholder = [string, fret, { 
            color: 'transparent', 
            className: 'placeholder-dot',
            text: ''
          }];
          placeholders.push(placeholder);
        }
      }
    }

    // Add placeholders for fret 0 (open strings) and handle CSS visibility
    for (let string = 1; string <= 6; string++) {
      const openString = fingers.some(([s, f]) => s === string && f === 0);
      
      if (!openString) {
        /** @type {import("svguitar").Finger} */
        const placeholder = [string, 0];
        placeholders.push(placeholder);
      }

      if (!this.svgContainer) continue;

      // Add placeholder if no open string or muted string exists
      if (openString) {
        this.svgContainer.classList.remove(`hide-open-string-${6 - string}`);
      } else {
        this.svgContainer.classList.add(`hide-open-string-${6 - string}`);
      }
    }

    // Build result with title and position included if they have values
    const result = {
      fingers: [...fingers, ...placeholders],
      barres: config.barres
    };
    
    // Only include title if it's not empty
    if (title && title.trim()) {
      result.title = title;
    }
    
    // Only include position if it's defined
    if (position !== undefined) {
      result.position = position;
    }

    return result;
  }

  /**
   * Add event listeners to SVG elements
   */
  addEventListeners() {
    const svg = this.svgContainer.querySelector('svg');
    if (!svg) return;

    // Use event delegation on the SVG
    svg.addEventListener('click', (event) => {
      const target = /** @type {Element} */ (event.target);
      
      // Check if clicked on an open string element
      if (target.classList.contains('open-string')) {
        this.handleOpenStringClick(target);
      }
      // Check if clicked on a finger circle
      else if (target.tagName === 'circle' && target.classList.contains('finger-circle')) {
        this.handleDotClick(target);
      } else if (target.tagName === 'text' && target.previousElementSibling && target.previousElementSibling.tagName === 'circle' && target.previousElementSibling.classList.contains('finger-circle')) {
        this.handleDotClick(target.previousElementSibling);
      }

    });


    const resizeOnHover = (size) => {
      this.redraw(size);
    }
    let hoverResizeTimeout = null;

    const overHandler = (event) => {
      const target = /** @type {Element} */ (event.target);
      
      if (target.tagName === 'circle' && target.classList.contains('finger-circle')) {
        const classes = Array.from(target.classList);
        const fretClass = classes.find(c => c.startsWith('finger-fret-'));
        
        if (fretClass) {
          const fretNumber = fretClass.replace('finger-fret-', '');
          // console.log(`Still hovering over fret: ${fretNumber}`);
          clearTimeout(hoverResizeTimeout);
          hoverResizeTimeout = setTimeout(resizeOnHover, 1000, parseInt(fretNumber, 10) + 2);
        }
      }
    }
    svg.addEventListener('mouseover', overHandler);
    svg.addEventListener('mouseout', (event) => {
      const target = /** @type {Element} */ (event.target);
      if (target.tagName === 'circle' && target.classList.contains('finger-circle')) {
        clearTimeout(hoverResizeTimeout);
        hoverResizeTimeout = setTimeout(resizeOnHover, 1000, undefined);
      }
    });
  }


  /**
   * Handle click on a dot (finger circle)
   * @param {Element} circleElement
   */
  handleDotClick(circleElement) {
    if (this.isDialogOpen) return;

    // Store the clicked element for positioning
    this.currentEditElement = circleElement;

    // Extract string and fret from classes
    const classes = Array.from(circleElement.classList);
    const stringClass = classes.find(c => c.startsWith('finger-string-'));
    const fretClass = classes.find(c => c.startsWith('finger-fret-'));
    
    if (!stringClass || !fretClass) return;
    
    // Convert to 1-based string and fret numbers
    // also invert string number (1=high E, 6=low E)
    const string = 6 - parseInt(stringClass.replace('finger-string-', ''), 10);
    const fret = 1 + parseInt(fretClass.replace('finger-fret-', ''), 10);
    
    // Check if this is a placeholder (transparent) or existing dot
    const isPlaceholder = circleElement.getAttribute('fill') === 'transparent';
    
    if (isPlaceholder) {
      // Add new dot
      this.addDot(string, fret);
    } else {
      // Edit existing dot
      this.editDot(string, fret);
    }
  }

  /**
   * Handle click on an open string element
   * @param {Element} openStringElement
   */
  handleOpenStringClick(openStringElement) {
    if (this.isDialogOpen) return;

    // Extract string number from classes
    const classes = Array.from(openStringElement.classList);
    const stringClass = classes.find(c => c.startsWith('open-string-'));
    
    if (!stringClass) return;
    
    // Convert to 1-based string number (class is 0-based, inverted)
    const stringIndex = parseInt(stringClass.replace('open-string-', ''), 10);
    const string = 6 - stringIndex;
    
    // Check current state of this string
    const existingFingerIndex = this.chordConfig.fingers.findIndex(([s, f]) => s === string && (f === 0 || f === 'x'));
    
    if (existingFingerIndex === -1) {
      // No fingering exists, add fret 0 (open string)
      this.chordConfig.fingers.push([string, 0]);
    } else {
      const existingFinger = this.chordConfig.fingers[existingFingerIndex];
      const existingFret = existingFinger[1];
      
      if (existingFret === 0) {
        // Change from open (0) to muted ('x')
        this.chordConfig.fingers[existingFingerIndex] = [string, 'x'];
      } else if (existingFret === 'x') {
        // Remove muted fingering
        this.chordConfig.fingers.splice(existingFingerIndex, 1);
      }
    }
    
    this.redraw();
    this.triggerChange();
  }

  /**
   * Add a new dot at the specified position
   * @param {number} string
   * @param {number} fret
   */
  addDot(string, fret) {
    // Add to fingers array (default to black to allow text)
    this.chordConfig.fingers.push([string, fret, { text: '', color: DOT_COLORS.BLACK }]);
    this.redraw();
    this.triggerChange();
  }

  /**
   * Edit an existing dot
   * @param {number} string
   * @param {number} fret
   */
  editDot(string, fret) {
    // Find the finger
    const finger = this.chordConfig.fingers.find(([s, f]) => s === string && f === fret);
    if (!finger) return;

    this.currentEditFinger = finger;
    this.currentEditString = string;
    this.currentEditFret = fret;


    // Populate dialog
    const currentColor = typeof finger[2] === 'object' && finger[2]?.color || DOT_COLORS.BLACK;
    const currentText = typeof finger[2] === 'object' && finger[2]?.text || '';
    
    // Normalize color to red or black (handle legacy colors)
    const normalizedColor = currentColor === DOT_COLORS.RED ? DOT_COLORS.RED : DOT_COLORS.BLACK;
    
    // Set radio buttons
    this.redRadio.checked = normalizedColor === DOT_COLORS.RED;
    this.blackRadio.checked = normalizedColor === DOT_COLORS.BLACK;
    
    // Set text and update visibility
    this.textInput.value = currentText;
    this.updateTextSectionVisibility();

    this.openDialog();
  }

  /**
   * Open the edit dialog
   */
  openDialog() {
    this.isDialogOpen = true;
    this.dialog.style.display = 'block';
    this.backdrop.style.display = 'block';
    
    // Position dialog relative to the clicked element
    if (this.currentEditElement) {
      this.positionDialog();
    }
    
    // Update text section visibility
    this.updateTextSectionVisibility();
    
    // Focus appropriate element
    if (this.blackRadio.checked && !this.textInput.disabled) {
      this.textInput.focus();
    }
  }

  /**
   * Position dialog relative to the clicked element
   */
  positionDialog() {
    if (!this.currentEditElement || !this.dialog) return;

    // Get the bounding rect of the clicked element
    const elementRect = this.currentEditElement.getBoundingClientRect();
    const dialogRect = this.dialog.getBoundingClientRect();
    
    // Calculate position
    const elementCenterX = elementRect.left + elementRect.width / 2;
    const elementCenterY = elementRect.top + elementRect.height / 2;
    
    // Position dialog to the right and slightly above the dot
    let dialogX = elementCenterX + 20;
    let dialogY = elementCenterY - dialogRect.height / 2;
    
    // Ensure dialog stays within viewport bounds
    const padding = 10;
    const maxX = window.innerWidth - dialogRect.width - padding;
    const maxY = window.innerHeight - dialogRect.height - padding;
    
    let arrowSide = 'left'; // Default: arrow points right (dot is to the left of dialog)
    
    if (dialogX > maxX) {
      // Position to the left of the dot instead
      dialogX = elementCenterX - dialogRect.width - 20;
      arrowSide = 'right'; // Arrow points left (dot is to the right of dialog)
    }
    if (dialogX < padding) dialogX = padding;
    if (dialogY < padding) dialogY = padding;
    if (dialogY > maxY) dialogY = maxY;
    
    // Apply positioning
    this.dialog.style.left = `${dialogX}px`;
    this.dialog.style.top = `${dialogY}px`;
    
    // Add arrow CSS class and calculate arrow position
    this.addArrowCSS(arrowSide, elementCenterY, dialogY, dialogRect.height);
  }

  /**
   * Add CSS arrow using ::after pseudo-element
   * @param {string} side - 'left' or 'right' indicating arrow direction
   * @param {number} dotY - Y position of the clicked dot
   * @param {number} dialogY - Y position of the dialog
   * @param {number} dialogHeight - Height of the dialog
   */
  addArrowCSS(side, dotY, dialogY, dialogHeight) {
    // Remove any existing arrow classes
    this.dialog.classList.remove('arrow-left', 'arrow-right');
    
    // Calculate arrow vertical position relative to dialog
    const arrowY = Math.max(20, Math.min(dialogHeight - 20, dotY - dialogY));
    
    // Add appropriate arrow class and set CSS custom property for position
    this.dialog.classList.add(`arrow-${side}`);
    this.dialog.style.setProperty('--arrow-y', `${arrowY}px`);    
  }

  /**
   * Ensure arrow CSS rules are added to the document
   */
  addCustomCSS() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('editable-svguitar-arrow-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'editable-svguitar-custom-CSS';
    style.textContent = `
      .editable-svguitar-dialog.arrow-left::after {
        content: '';
        position: absolute;
        left: -16px;
        top: var(--arrow-y, 50px);
        width: 0;
        height: 0;
        border: 8px solid transparent;
        border-right-color: white;
        transform: translateY(-50%);
      }
      
      .editable-svguitar-dialog.arrow-right::after {
        content: '';
        position: absolute;
        right: -16px;
        top: var(--arrow-y, 50px);
        width: 0;
        height: 0;
        border: 8px solid transparent;
        border-left-color: white;
        transform: translateY(-50%);
      }

      .editable-svguitar-svg .open-string{
        fill: transparent !important;
      }

      .editable-svguitar-svg.hide-open-string-0 .open-string-0,
      .editable-svguitar-svg.hide-open-string-1 .open-string-1,
      .editable-svguitar-svg.hide-open-string-2 .open-string-2,
      .editable-svguitar-svg.hide-open-string-3 .open-string-3,
      .editable-svguitar-svg.hide-open-string-4 .open-string-4,
      .editable-svguitar-svg.hide-open-string-5 .open-string-5 {
        stroke: transparent !important;
        fill: transparent !important;
      }
      
      .editable-svguitar-settings-btn:hover {
        background: #f0f0f0;
      }
      `;
    document.head.appendChild(style);
  }

  /**
   * Close the edit dialog
   */
  closeDialog() {
    this.isDialogOpen = false;
    this.dialog.style.display = 'none';
    this.backdrop.style.display = 'none';
    
    // Remove arrow CSS classes
    this.dialog.classList.remove('arrow-left', 'arrow-right');
    this.dialog.style.removeProperty('--arrow-y');
    
    this.currentEditFinger = null;
    this.currentEditElement = null;
  }

  /**
   * Update text section visibility based on color selection
   */
  updateTextSectionVisibility() {
    if (!this.textSection) return;
    
    const isBlack = this.blackRadio && this.blackRadio.checked;
    this.textSection.style.display = isBlack ? 'block' : 'none';
    
    // Disable text input for red dots
    if (this.textInput) {
      this.textInput.disabled = !isBlack;
    }
  }

  /**
   * Update dot text in real-time
   */
  updateDotText() {
    if (!this.currentEditFinger) return;
    
    // Update the finger options
    if (!this.currentEditFinger[2]) {
      this.currentEditFinger[2] = {};
    }

    const fingerOptions = typeof this.currentEditFinger[2] === 'object' ? this.currentEditFinger[2] : {};
    this.currentEditFinger[2] = { ...fingerOptions, text: this.textInput.value };

    this.redraw();
    this.triggerChange();
  }

  /**
   * Update dot color in real-time
   */
  updateDotColor() {
    if (!this.currentEditFinger) return;
    
    // Update the finger options
    if (!this.currentEditFinger[2]) {
      this.currentEditFinger[2] = {};
    }
    
    // Get selected color from radio buttons
    const selectedColor = this.redRadio.checked ? DOT_COLORS.RED : DOT_COLORS.BLACK;

    const fingerOptions = typeof this.currentEditFinger[2] === 'object' ? this.currentEditFinger[2] : {};
    this.currentEditFinger[2] = { ...fingerOptions, color: selectedColor };
    
    // Clear text if red is selected
    if (selectedColor === DOT_COLORS.RED) {
      this.currentEditFinger[2].text = '';
      this.textInput.value = '';
    }
    
    this.updateTextSectionVisibility();
    this.redraw();
    this.triggerChange();
  }

  /**
   * Save changes to the current dot
   */
  saveDot() {
    if (!this.currentEditFinger) return;

    // Update the finger options
    if (!this.currentEditFinger[2]) {
      this.currentEditFinger[2] = {};
    }
    
    // Get selected color from radio buttons
    const selectedColor = this.redRadio.checked ? DOT_COLORS.RED : DOT_COLORS.BLACK;
    this.currentEditFinger[2] = { text: this.textInput.value, color: selectedColor };

    this.closeDialog();
    this.redraw();
  }

  /**
   * Remove the current dot
   */
  removeDot() {
    if (!this.currentEditFinger) return;

    // Remove from fingers array
    const index = this.chordConfig.fingers.findIndex(
      ([s, f]) => s === this.currentEditString && f === this.currentEditFret
    );
    
    if (index >= 0) {
      this.chordConfig.fingers.splice(index, 1);
    }

    this.closeDialog();
    this.redraw();
    this.triggerChange();
  }

  /**
   * Open the settings dialog
   */
  openSettingsDialog() {
    // Populate current values
    this.titleInput.value = this.chordConfig.title || '';
    this.positionInput.value = this.chordConfig.position !== undefined ? String(this.chordConfig.position) : '';
    
    // Show dialog
    this.settingsDialog.style.display = 'block';
    this.settingsBackdrop.style.display = 'block';
    
    // Position dialog near the settings button
    this.positionSettingsDialog();
    
    // Focus title input
    this.titleInput.focus();
  }

  /**
   * Position settings dialog near the settings button
   */
  positionSettingsDialog() {
    if (!this.settingsButton || !this.settingsDialog) return;

    // Get the bounding rect of the settings button
    const buttonRect = this.settingsButton.getBoundingClientRect();
    const dialogRect = this.settingsDialog.getBoundingClientRect();
    
    // Position dialog below and to the right of the button
    let dialogX = buttonRect.left;
    let dialogY = buttonRect.bottom + 5;
    
    // Ensure dialog stays within viewport bounds
    const padding = 10;
    const maxX = window.innerWidth - dialogRect.width - padding;
    const maxY = window.innerHeight - dialogRect.height - padding;
    
    if (dialogX > maxX) dialogX = maxX;
    if (dialogX < padding) dialogX = padding;
    if (dialogY > maxY) dialogY = buttonRect.top - dialogRect.height - 5;
    if (dialogY < padding) dialogY = padding;
    
    // Apply positioning
    this.settingsDialog.style.left = `${dialogX}px`;
    this.settingsDialog.style.top = `${dialogY}px`;
  }

  /**
   * Close the settings dialog
   */
  closeSettingsDialog() {
    if (this.settingsDialog) {
      this.settingsDialog.style.display = 'none';
    }
    if (this.settingsBackdrop) {
      this.settingsBackdrop.style.display = 'none';
    }
  }

  /**
   * Save settings from the dialog
   */
  saveSettings() {
    // Get and validate values
    const title = this.titleInput.value.trim();
    const positionStr = this.positionInput.value.trim();
    
    // Update title (can be empty)
    this.chordConfig.title = title;
    
    // Update position with validation
    if (positionStr === '') {
      this.chordConfig.position = undefined;
    } else {
      const position = parseInt(positionStr, 10);
      if (isNaN(position) || position < 0 || position > 30) {
        alert('Position must be a number between 0 and 30');
        return;
      }
      this.chordConfig.position = position;
    }
    
    // Toggle noPosition based on whether position is set
    this.config.noPosition = this.chordConfig.position === undefined;
    
    this.closeSettingsDialog();
    this.redraw();
    this.triggerChange();
  }

  /**
   * Get current chord configuration
   * @returns {import("svguitar").Chord}
   */
  getChord() {
    return { ...this.chordConfig };
  }

  /**
   * Get string representation of the chord
   * @param {object} [options]
   * @param {boolean} [options.useUnicode=false] - Whether to use Unicode characters for string/fret markers
   * @returns {string}
   */
  toString(options) {
    return fingeringToString(this.chordConfig, options);
  }

  /**
   * Register a callback for when the chord changes
   * @param {Function} callback - Called with updated fingers array
   * @returns {EditableSVGuitarChord}
   */
  onChange(callback) {
    this.changeCallback = callback;
    return this;
  }

  /**
   * Trigger the change callback if registered
   */
  triggerChange() {
    if (this.changeCallback && typeof this.changeCallback === 'function') {
      // Only pass the fingers array to match the expected format
      this.changeCallback([...this.chordConfig.fingers]);
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.dialog && this.dialog.parentNode) {
      this.dialog.parentNode.removeChild(this.dialog);
    }
    if (this.backdrop && this.backdrop.parentNode) {
      this.backdrop.parentNode.removeChild(this.backdrop);
    }
  }
}