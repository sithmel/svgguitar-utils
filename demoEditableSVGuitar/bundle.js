// lib/editableSVGuitar.js
var COLOR_PRESETS = [
  // Top row
  "#e74c3c",
  "#f39c12",
  "#f1c40f",
  "#8b4513",
  "#229954",
  "#9b59b6",
  "#3498db",
  // Bottom row  
  "#85c1e9",
  "#48c9b0",
  "#82e5aa",
  "#000000",
  "#555555",
  "#999999",
  "#cccccc"
];
var EditableSVGuitarChord = class {
  /**
   * @param {HTMLElement} container
   * @param {any} SVGuitarChordClass
   */
  constructor(container, SVGuitarChordClass) {
    this.container = container;
    this.SVGuitarChordClass = SVGuitarChordClass;
    this.chordConfig = { fingers: [], barres: [] };
    this.config = { frets: 5, noPosition: true };
    this.svgChord = null;
    this.isDialogOpen = false;
    this.controlsCreated = false;
    this.currentEditElement = null;
    this.changeCallback = null;
    if (typeof document !== "undefined") {
      this.createControls();
    }
    this.addCustomCSS();
  }
  /**
   * Create controls and containers
   */
  createControls() {
    this.controlsCreated = true;
    this.svgContainer = document.createElement("div");
    this.svgContainer.className = "editable-svguitar-svg";
    this.container.appendChild(this.svgContainer);
    this.createDialog();
  }
  /**
   * Create the edit dialog
   */
  createDialog() {
    this.dialog = document.createElement("div");
    this.dialog.className = "editable-svguitar-dialog";
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
    const title = document.createElement("h3");
    title.textContent = "Edit Dot";
    title.style.cssText = "margin: 0 0 15px 0; font-size: 16px;";
    const textLabel = document.createElement("label");
    textLabel.textContent = "Text: ";
    textLabel.style.cssText = "display: block; margin-bottom: 10px;";
    this.textInput = document.createElement("input");
    this.textInput.type = "text";
    this.textInput.maxLength = 3;
    this.textInput.style.cssText = "width: 38px; margin-left: 5px;";
    this.textInput.addEventListener("input", () => this.updateDotText());
    textLabel.appendChild(this.textInput);
    const colorLabel = document.createElement("label");
    colorLabel.textContent = "Color: ";
    colorLabel.style.cssText = "display: block; margin-bottom: 10px;";
    this.colorInput = document.createElement("input");
    this.colorInput.type = "color";
    this.colorInput.value = "#000000";
    this.colorInput.style.cssText = "margin-left: 5px; margin-bottom: 8px;";
    this.colorInput.addEventListener("input", () => this.updateDotColor());
    colorLabel.appendChild(this.colorInput);
    const colorsGrid = document.createElement("div");
    colorsGrid.style.cssText = "display: grid; grid-template-columns: repeat(7, 20px); gap: 3px; margin-left: 5px;";
    COLOR_PRESETS.forEach((color) => {
      const swatch = document.createElement("button");
      swatch.type = "button";
      swatch.style.cssText = `
        width: 20px;
        height: 20px;
        border: 1px solid #ccc;
        border-radius: 3px;
        background-color: ${color};
        cursor: pointer;
        padding: 0;
      `;
      swatch.addEventListener("click", () => {
        this.colorInput.value = color;
        this.updateDotColor();
      });
      colorsGrid.appendChild(swatch);
    });
    colorLabel.appendChild(colorsGrid);
    const buttonDiv = document.createElement("div");
    buttonDiv.style.cssText = "display: flex; gap: 10px; justify-content: flex-end;";
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.style.cssText = "padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;";
    removeBtn.addEventListener("click", () => this.removeDot());
    const doneBtn = document.createElement("button");
    doneBtn.textContent = "Done";
    doneBtn.style.cssText = "padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;";
    doneBtn.addEventListener("click", () => this.closeDialog());
    buttonDiv.appendChild(removeBtn);
    buttonDiv.appendChild(doneBtn);
    this.dialog.appendChild(title);
    this.dialog.appendChild(textLabel);
    this.dialog.appendChild(colorLabel);
    this.dialog.appendChild(buttonDiv);
    document.body.appendChild(this.dialog);
    this.backdrop = document.createElement("div");
    this.backdrop.className = "editable-svguitar-backdrop";
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
    this.backdrop.addEventListener("click", () => this.closeDialog());
    document.body.appendChild(this.backdrop);
  }
  /**
   * Set chord configuration
   * @param {ChordConfig} config
   * @returns {EditableSVGuitarChord}
   */
  chord(config) {
    this.chordConfig = { ...config };
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
    let maxFret = 0;
    for (const [, fret] of fingers) {
      if (typeof fret === "string") continue;
      if (fret > maxFret) {
        maxFret = fret;
      }
    }
    return Math.max(3, maxFret + 1);
  }
  /**
   * Draw the chord with interactive capabilities
   * @returns {EditableSVGuitarChord}
   */
  draw() {
    if (typeof document !== "undefined" && !this.controlsCreated) {
      this.createControls();
    }
    this.config.frets = this.calculateDynamicFrets();
    const chordWithPlaceholders = this.addPlaceholderDots(this.chordConfig);
    if (this.svgContainer) {
      this.svgChord = new this.SVGuitarChordClass(this.svgContainer);
      this.svgChord.chord(chordWithPlaceholders).configure(this.config).draw();
      this.addEventListeners();
    }
    return this;
  }
  /**
   * Redraw the chord
   */
  redraw() {
    if (this.svgContainer) {
      this.svgContainer.innerHTML = "";
    }
    this.draw();
  }
  /**
   * Add transparent placeholder dots for empty positions
   * @param {ChordConfig} config
   * @returns {ChordConfig}
   */
  addPlaceholderDots(config) {
    const { fingers } = config;
    const placeholders = [];
    for (let string = 1; string <= 6; string++) {
      for (let fret = 1; fret <= this.config.frets; fret++) {
        const exists = fingers.some(([s2, f2]) => s2 === string && f2 === fret);
        if (!exists) {
          const placeholder = [string, fret, {
            color: "transparent",
            className: "placeholder-dot",
            text: ""
          }];
          placeholders.push(placeholder);
        }
      }
    }
    for (let string = 1; string <= 6; string++) {
      const openString = fingers.some(([s2, f2]) => s2 === string && f2 === 0);
      const noPlayString = fingers.some(([s2, f2]) => s2 === string && f2 === "x");
      if (!openString) {
        const placeholder = [string, 0];
        placeholders.push(placeholder);
      }
      if (!this.svgContainer) continue;
      if (openString) {
        this.svgContainer.classList.remove(`hide-open-string-${6 - string}`);
      } else {
        this.svgContainer.classList.add(`hide-open-string-${6 - string}`);
      }
    }
    return {
      ...config,
      fingers: [...fingers, ...placeholders]
    };
  }
  /**
   * Add event listeners to SVG elements
   */
  addEventListeners() {
    const svg = this.svgContainer.querySelector("svg");
    if (!svg) return;
    svg.addEventListener("click", (event) => {
      const target = (
        /** @type {Element} */
        event.target
      );
      if (target.classList.contains("open-string")) {
        this.handleOpenStringClick(target);
      } else if (target.tagName === "circle" && target.classList.contains("finger-circle")) {
        this.handleDotClick(target);
      } else if (target.tagName === "text" && target.previousElementSibling && target.previousElementSibling.tagName === "circle" && target.previousElementSibling.classList.contains("finger-circle")) {
        this.handleDotClick(target.previousElementSibling);
      }
    });
  }
  /**
   * Handle click on a dot (finger circle)
   * @param {Element} circleElement
   */
  handleDotClick(circleElement) {
    if (this.isDialogOpen) return;
    this.currentEditElement = circleElement;
    const classes2 = Array.from(circleElement.classList);
    const stringClass = classes2.find((c2) => c2.startsWith("finger-string-"));
    const fretClass = classes2.find((c2) => c2.startsWith("finger-fret-"));
    if (!stringClass || !fretClass) return;
    const string = 6 - parseInt(stringClass.replace("finger-string-", ""), 10);
    const fret = 1 + parseInt(fretClass.replace("finger-fret-", ""), 10);
    const isPlaceholder = circleElement.getAttribute("fill") === "transparent";
    if (isPlaceholder) {
      this.addDot(string, fret);
    } else {
      this.editDot(string, fret);
    }
  }
  /**
   * Handle click on an open string element
   * @param {Element} openStringElement
   */
  handleOpenStringClick(openStringElement) {
    if (this.isDialogOpen) return;
    const classes2 = Array.from(openStringElement.classList);
    const stringClass = classes2.find((c2) => c2.startsWith("open-string-"));
    if (!stringClass) return;
    const stringIndex = parseInt(stringClass.replace("open-string-", ""), 10);
    const string = 6 - stringIndex;
    const existingFingerIndex = this.chordConfig.fingers.findIndex(([s2, f2]) => s2 === string && (f2 === 0 || f2 === "x"));
    if (existingFingerIndex === -1) {
      this.chordConfig.fingers.push([string, 0]);
    } else {
      const existingFinger = this.chordConfig.fingers[existingFingerIndex];
      const existingFret = existingFinger[1];
      if (existingFret === 0) {
        this.chordConfig.fingers[existingFingerIndex] = [string, "x"];
      } else if (existingFret === "x") {
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
    this.chordConfig.fingers.push([string, fret, { text: "", color: "#000000" }]);
    this.redraw();
    this.triggerChange();
  }
  /**
   * Edit an existing dot
   * @param {number} string
   * @param {number} fret
   */
  editDot(string, fret) {
    var _a6, _b;
    const finger = this.chordConfig.fingers.find(([s2, f2]) => s2 === string && f2 === fret);
    if (!finger) return;
    this.currentEditFinger = finger;
    this.currentEditString = string;
    this.currentEditFret = fret;
    this.textInput.value = ((_a6 = finger[2]) == null ? void 0 : _a6.text) || "";
    this.colorInput.value = ((_b = finger[2]) == null ? void 0 : _b.color) || "#000000";
    this.openDialog();
  }
  /**
   * Open the edit dialog
   */
  openDialog() {
    this.isDialogOpen = true;
    this.dialog.style.display = "block";
    this.backdrop.style.display = "block";
    if (this.currentEditElement) {
      this.positionDialog();
    }
    this.textInput.focus();
  }
  /**
   * Position dialog relative to the clicked element
   */
  positionDialog() {
    if (!this.currentEditElement || !this.dialog) return;
    const elementRect = this.currentEditElement.getBoundingClientRect();
    const dialogRect = this.dialog.getBoundingClientRect();
    const elementCenterX = elementRect.left + elementRect.width / 2;
    const elementCenterY = elementRect.top + elementRect.height / 2;
    let dialogX = elementCenterX + 20;
    let dialogY = elementCenterY - dialogRect.height / 2;
    const padding = 10;
    const maxX = window.innerWidth - dialogRect.width - padding;
    const maxY = window.innerHeight - dialogRect.height - padding;
    let arrowSide = "left";
    if (dialogX > maxX) {
      dialogX = elementCenterX - dialogRect.width - 20;
      arrowSide = "right";
    }
    if (dialogX < padding) dialogX = padding;
    if (dialogY < padding) dialogY = padding;
    if (dialogY > maxY) dialogY = maxY;
    this.dialog.style.left = `${dialogX}px`;
    this.dialog.style.top = `${dialogY}px`;
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
    this.dialog.classList.remove("arrow-left", "arrow-right");
    const arrowY = Math.max(20, Math.min(dialogHeight - 20, dotY - dialogY));
    this.dialog.classList.add(`arrow-${side}`);
    this.dialog.style.setProperty("--arrow-y", `${arrowY}px`);
  }
  /**
   * Ensure arrow CSS rules are added to the document
   */
  addCustomCSS() {
    if (typeof document === "undefined") return;
    if (document.getElementById("editable-svguitar-arrow-styles")) return;
    const style = document.createElement("style");
    style.id = "editable-svguitar-custom-CSS";
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
      `;
    document.head.appendChild(style);
  }
  /**
   * Close the edit dialog
   */
  closeDialog() {
    this.isDialogOpen = false;
    this.dialog.style.display = "none";
    this.backdrop.style.display = "none";
    this.dialog.classList.remove("arrow-left", "arrow-right");
    this.dialog.style.removeProperty("--arrow-y");
    this.currentEditFinger = null;
    this.currentEditElement = null;
  }
  /**
   * Update dot text in real-time
   */
  updateDotText() {
    if (!this.currentEditFinger) return;
    if (!this.currentEditFinger[2]) {
      this.currentEditFinger[2] = {};
    }
    this.currentEditFinger[2].text = this.textInput.value;
    this.redraw();
    this.triggerChange();
  }
  /**
   * Update dot color in real-time
   */
  updateDotColor() {
    if (!this.currentEditFinger) return;
    if (!this.currentEditFinger[2]) {
      this.currentEditFinger[2] = {};
    }
    this.currentEditFinger[2].color = this.colorInput.value;
    this.redraw();
    this.triggerChange();
  }
  /**
   * Save changes to the current dot
   */
  saveDot() {
    if (!this.currentEditFinger) return;
    if (!this.currentEditFinger[2]) {
      this.currentEditFinger[2] = {};
    }
    this.currentEditFinger[2].text = this.textInput.value;
    this.currentEditFinger[2].color = this.colorInput.value;
    this.closeDialog();
    this.redraw();
  }
  /**
   * Remove the current dot
   */
  removeDot() {
    if (!this.currentEditFinger) return;
    const index = this.chordConfig.fingers.findIndex(
      ([s2, f2]) => s2 === this.currentEditString && f2 === this.currentEditFret
    );
    if (index >= 0) {
      this.chordConfig.fingers.splice(index, 1);
    }
    this.closeDialog();
    this.redraw();
    this.triggerChange();
  }
  /**
   * Get current chord configuration
   * @returns {ChordConfig}
   */
  getChord() {
    return { ...this.chordConfig };
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
    if (this.changeCallback && typeof this.changeCallback === "function") {
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
};

// node_modules/svguitar/dist/svguitar.es5.js
var extendStatics = function(d2, b2) {
  extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b3) {
    d3.__proto__ = b3;
  } || function(d3, b3) {
    for (var p2 in b3) if (Object.prototype.hasOwnProperty.call(b3, p2)) d3[p2] = b3[p2];
  };
  return extendStatics(d2, b2);
};
function __extends(d2, b2) {
  if (typeof b2 !== "function" && b2 !== null)
    throw new TypeError("Class extends value " + String(b2) + " is not a constructor or null");
  extendStatics(d2, b2);
  function __() {
    this.constructor = d2;
  }
  d2.prototype = b2 === null ? Object.create(b2) : (__.prototype = b2.prototype, new __());
}
var __assign = function() {
  __assign = Object.assign || function __assign2(t2) {
    for (var s2, i = 1, n2 = arguments.length; i < n2; i++) {
      s2 = arguments[i];
      for (var p2 in s2) if (Object.prototype.hasOwnProperty.call(s2, p2)) t2[p2] = s2[p2];
    }
    return t2;
  };
  return __assign.apply(this, arguments);
};
function __read(o2, n2) {
  var m2 = typeof Symbol === "function" && o2[Symbol.iterator];
  if (!m2) return o2;
  var i = m2.call(o2), r2, ar = [], e2;
  try {
    while ((n2 === void 0 || n2-- > 0) && !(r2 = i.next()).done) ar.push(r2.value);
  } catch (error) {
    e2 = { error };
  } finally {
    try {
      if (r2 && !r2.done && (m2 = i["return"])) m2.call(i);
    } finally {
      if (e2) throw e2.error;
    }
  }
  return ar;
}
function __spreadArray(to2, from2, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l2 = from2.length, ar; i < l2; i++) {
    if (ar || !(i in from2)) {
      if (!ar) ar = Array.prototype.slice.call(from2, 0, i);
      ar[i] = from2[i];
    }
  }
  return to2.concat(ar || Array.prototype.slice.call(from2));
}
var constants = {
  /**
   * The viewbox width of the svg
   */
  width: 400
};
function t(t2, e2, s2) {
  if (t2 && t2.length) {
    const [n2, a2] = e2, o2 = Math.PI / 180 * s2, h2 = Math.cos(o2), r2 = Math.sin(o2);
    t2.forEach(((t3) => {
      const [e3, s3] = t3;
      t3[0] = (e3 - n2) * h2 - (s3 - a2) * r2 + n2, t3[1] = (e3 - n2) * r2 + (s3 - a2) * h2 + a2;
    }));
  }
}
function e(t2) {
  const e2 = t2[0], s2 = t2[1];
  return Math.sqrt(Math.pow(e2[0] - s2[0], 2) + Math.pow(e2[1] - s2[1], 2));
}
function s(e2, s2) {
  const n2 = s2.hachureAngle + 90;
  let a2 = s2.hachureGap;
  a2 < 0 && (a2 = 4 * s2.strokeWidth), a2 = Math.max(a2, 0.1);
  const o2 = [0, 0];
  if (n2) for (const s3 of e2) t(s3, o2, n2);
  const h2 = (function(t2, e3) {
    const s3 = [];
    for (const e4 of t2) {
      const t3 = [...e4];
      t3[0].join(",") !== t3[t3.length - 1].join(",") && t3.push([t3[0][0], t3[0][1]]), t3.length > 2 && s3.push(t3);
    }
    const n3 = [];
    e3 = Math.max(e3, 0.1);
    const a3 = [];
    for (const t3 of s3) for (let e4 = 0; e4 < t3.length - 1; e4++) {
      const s4 = t3[e4], n4 = t3[e4 + 1];
      if (s4[1] !== n4[1]) {
        const t4 = Math.min(s4[1], n4[1]);
        a3.push({ ymin: t4, ymax: Math.max(s4[1], n4[1]), x: t4 === s4[1] ? s4[0] : n4[0], islope: (n4[0] - s4[0]) / (n4[1] - s4[1]) });
      }
    }
    if (a3.sort(((t3, e4) => t3.ymin < e4.ymin ? -1 : t3.ymin > e4.ymin ? 1 : t3.x < e4.x ? -1 : t3.x > e4.x ? 1 : t3.ymax === e4.ymax ? 0 : (t3.ymax - e4.ymax) / Math.abs(t3.ymax - e4.ymax))), !a3.length) return n3;
    let o3 = [], h3 = a3[0].ymin;
    for (; o3.length || a3.length; ) {
      if (a3.length) {
        let t3 = -1;
        for (let e4 = 0; e4 < a3.length && !(a3[e4].ymin > h3); e4++) t3 = e4;
        a3.splice(0, t3 + 1).forEach(((t4) => {
          o3.push({ s: h3, edge: t4 });
        }));
      }
      if (o3 = o3.filter(((t3) => !(t3.edge.ymax <= h3))), o3.sort(((t3, e4) => t3.edge.x === e4.edge.x ? 0 : (t3.edge.x - e4.edge.x) / Math.abs(t3.edge.x - e4.edge.x))), o3.length > 1) for (let t3 = 0; t3 < o3.length; t3 += 2) {
        const e4 = t3 + 1;
        if (e4 >= o3.length) break;
        const s4 = o3[t3].edge, a4 = o3[e4].edge;
        n3.push([[Math.round(s4.x), h3], [Math.round(a4.x), h3]]);
      }
      h3 += e3, o3.forEach(((t3) => {
        t3.edge.x = t3.edge.x + e3 * t3.edge.islope;
      }));
    }
    return n3;
  })(e2, a2);
  if (n2) {
    for (const s3 of e2) t(s3, o2, -n2);
    !(function(e3, s3, n3) {
      const a3 = [];
      e3.forEach(((t2) => a3.push(...t2))), t(a3, s3, n3);
    })(h2, o2, -n2);
  }
  return h2;
}
var n = class {
  constructor(t2) {
    this.helper = t2;
  }
  fillPolygons(t2, e2) {
    return this._fillPolygons(t2, e2);
  }
  _fillPolygons(t2, e2) {
    const n2 = s(t2, e2);
    return { type: "fillSketch", ops: this.renderLines(n2, e2) };
  }
  renderLines(t2, e2) {
    const s2 = [];
    for (const n2 of t2) s2.push(...this.helper.doubleLineOps(n2[0][0], n2[0][1], n2[1][0], n2[1][1], e2));
    return s2;
  }
};
var a = class extends n {
  fillPolygons(t2, n2) {
    let a2 = n2.hachureGap;
    a2 < 0 && (a2 = 4 * n2.strokeWidth), a2 = Math.max(a2, 0.1);
    const o2 = s(t2, Object.assign({}, n2, { hachureGap: a2 })), h2 = Math.PI / 180 * n2.hachureAngle, r2 = [], i = 0.5 * a2 * Math.cos(h2), c2 = 0.5 * a2 * Math.sin(h2);
    for (const [t3, s2] of o2) e([t3, s2]) && r2.push([[t3[0] - i, t3[1] + c2], [...s2]], [[t3[0] + i, t3[1] - c2], [...s2]]);
    return { type: "fillSketch", ops: this.renderLines(r2, n2) };
  }
};
var o = class extends n {
  fillPolygons(t2, e2) {
    const s2 = this._fillPolygons(t2, e2), n2 = Object.assign({}, e2, { hachureAngle: e2.hachureAngle + 90 }), a2 = this._fillPolygons(t2, n2);
    return s2.ops = s2.ops.concat(a2.ops), s2;
  }
};
var h = class {
  constructor(t2) {
    this.helper = t2;
  }
  fillPolygons(t2, e2) {
    const n2 = s(t2, e2 = Object.assign({}, e2, { hachureAngle: 0 }));
    return this.dotsOnLines(n2, e2);
  }
  dotsOnLines(t2, s2) {
    const n2 = [];
    let a2 = s2.hachureGap;
    a2 < 0 && (a2 = 4 * s2.strokeWidth), a2 = Math.max(a2, 0.1);
    let o2 = s2.fillWeight;
    o2 < 0 && (o2 = s2.strokeWidth / 2);
    const h2 = a2 / 4;
    for (const r2 of t2) {
      const t3 = e(r2), i = t3 / a2, c2 = Math.ceil(i) - 1, l2 = t3 - c2 * a2, u2 = (r2[0][0] + r2[1][0]) / 2 - a2 / 4, p2 = Math.min(r2[0][1], r2[1][1]);
      for (let t4 = 0; t4 < c2; t4++) {
        const e2 = p2 + l2 + t4 * a2, r3 = u2 - h2 + 2 * Math.random() * h2, i2 = e2 - h2 + 2 * Math.random() * h2, c3 = this.helper.ellipse(r3, i2, o2, o2, s2);
        n2.push(...c3.ops);
      }
    }
    return { type: "fillSketch", ops: n2 };
  }
};
var r = class {
  constructor(t2) {
    this.helper = t2;
  }
  fillPolygons(t2, e2) {
    const n2 = s(t2, e2);
    return { type: "fillSketch", ops: this.dashedLine(n2, e2) };
  }
  dashedLine(t2, s2) {
    const n2 = s2.dashOffset < 0 ? s2.hachureGap < 0 ? 4 * s2.strokeWidth : s2.hachureGap : s2.dashOffset, a2 = s2.dashGap < 0 ? s2.hachureGap < 0 ? 4 * s2.strokeWidth : s2.hachureGap : s2.dashGap, o2 = [];
    return t2.forEach(((t3) => {
      const h2 = e(t3), r2 = Math.floor(h2 / (n2 + a2)), i = (h2 + a2 - r2 * (n2 + a2)) / 2;
      let c2 = t3[0], l2 = t3[1];
      c2[0] > l2[0] && (c2 = t3[1], l2 = t3[0]);
      const u2 = Math.atan((l2[1] - c2[1]) / (l2[0] - c2[0]));
      for (let t4 = 0; t4 < r2; t4++) {
        const e2 = t4 * (n2 + a2), h3 = e2 + n2, r3 = [c2[0] + e2 * Math.cos(u2) + i * Math.cos(u2), c2[1] + e2 * Math.sin(u2) + i * Math.sin(u2)], l3 = [c2[0] + h3 * Math.cos(u2) + i * Math.cos(u2), c2[1] + h3 * Math.sin(u2) + i * Math.sin(u2)];
        o2.push(...this.helper.doubleLineOps(r3[0], r3[1], l3[0], l3[1], s2));
      }
    })), o2;
  }
};
var i$1 = class {
  constructor(t2) {
    this.helper = t2;
  }
  fillPolygons(t2, e2) {
    const n2 = e2.hachureGap < 0 ? 4 * e2.strokeWidth : e2.hachureGap, a2 = e2.zigzagOffset < 0 ? n2 : e2.zigzagOffset, o2 = s(t2, e2 = Object.assign({}, e2, { hachureGap: n2 + a2 }));
    return { type: "fillSketch", ops: this.zigzagLines(o2, a2, e2) };
  }
  zigzagLines(t2, s2, n2) {
    const a2 = [];
    return t2.forEach(((t3) => {
      const o2 = e(t3), h2 = Math.round(o2 / (2 * s2));
      let r2 = t3[0], i = t3[1];
      r2[0] > i[0] && (r2 = t3[1], i = t3[0]);
      const c2 = Math.atan((i[1] - r2[1]) / (i[0] - r2[0]));
      for (let t4 = 0; t4 < h2; t4++) {
        const e2 = 2 * t4 * s2, o3 = 2 * (t4 + 1) * s2, h3 = Math.sqrt(2 * Math.pow(s2, 2)), i2 = [r2[0] + e2 * Math.cos(c2), r2[1] + e2 * Math.sin(c2)], l2 = [r2[0] + o3 * Math.cos(c2), r2[1] + o3 * Math.sin(c2)], u2 = [i2[0] + h3 * Math.cos(c2 + Math.PI / 4), i2[1] + h3 * Math.sin(c2 + Math.PI / 4)];
        a2.push(...this.helper.doubleLineOps(i2[0], i2[1], u2[0], u2[1], n2), ...this.helper.doubleLineOps(u2[0], u2[1], l2[0], l2[1], n2));
      }
    })), a2;
  }
};
var c = {};
var l = class {
  constructor(t2) {
    this.seed = t2;
  }
  next() {
    return this.seed ? (2 ** 31 - 1 & (this.seed = Math.imul(48271, this.seed))) / 2 ** 31 : Math.random();
  }
};
var u = { A: 7, a: 7, C: 6, c: 6, H: 1, h: 1, L: 2, l: 2, M: 2, m: 2, Q: 4, q: 4, S: 4, s: 4, T: 2, t: 2, V: 1, v: 1, Z: 0, z: 0 };
function p(t2, e2) {
  return t2.type === e2;
}
function f(t2) {
  const e2 = [], s2 = (function(t3) {
    const e3 = new Array();
    for (; "" !== t3; ) if (t3.match(/^([ \t\r\n,]+)/)) t3 = t3.substr(RegExp.$1.length);
    else if (t3.match(/^([aAcChHlLmMqQsStTvVzZ])/)) e3[e3.length] = { type: 0, text: RegExp.$1 }, t3 = t3.substr(RegExp.$1.length);
    else {
      if (!t3.match(/^(([-+]?[0-9]+(\.[0-9]*)?|[-+]?\.[0-9]+)([eE][-+]?[0-9]+)?)/)) return [];
      e3[e3.length] = { type: 1, text: `${parseFloat(RegExp.$1)}` }, t3 = t3.substr(RegExp.$1.length);
    }
    return e3[e3.length] = { type: 2, text: "" }, e3;
  })(t2);
  let n2 = "BOD", a2 = 0, o2 = s2[a2];
  for (; !p(o2, 2); ) {
    let h2 = 0;
    const r2 = [];
    if ("BOD" === n2) {
      if ("M" !== o2.text && "m" !== o2.text) return f("M0,0" + t2);
      a2++, h2 = u[o2.text], n2 = o2.text;
    } else p(o2, 1) ? h2 = u[n2] : (a2++, h2 = u[o2.text], n2 = o2.text);
    if (!(a2 + h2 < s2.length)) throw new Error("Path data ended short");
    for (let t3 = a2; t3 < a2 + h2; t3++) {
      const e3 = s2[t3];
      if (!p(e3, 1)) throw new Error("Param not a number: " + n2 + "," + e3.text);
      r2[r2.length] = +e3.text;
    }
    if ("number" != typeof u[n2]) throw new Error("Bad segment: " + n2);
    {
      const t3 = { key: n2, data: r2 };
      e2.push(t3), a2 += h2, o2 = s2[a2], "M" === n2 && (n2 = "L"), "m" === n2 && (n2 = "l");
    }
  }
  return e2;
}
function d(t2) {
  let e2 = 0, s2 = 0, n2 = 0, a2 = 0;
  const o2 = [];
  for (const { key: h2, data: r2 } of t2) switch (h2) {
    case "M":
      o2.push({ key: "M", data: [...r2] }), [e2, s2] = r2, [n2, a2] = r2;
      break;
    case "m":
      e2 += r2[0], s2 += r2[1], o2.push({ key: "M", data: [e2, s2] }), n2 = e2, a2 = s2;
      break;
    case "L":
      o2.push({ key: "L", data: [...r2] }), [e2, s2] = r2;
      break;
    case "l":
      e2 += r2[0], s2 += r2[1], o2.push({ key: "L", data: [e2, s2] });
      break;
    case "C":
      o2.push({ key: "C", data: [...r2] }), e2 = r2[4], s2 = r2[5];
      break;
    case "c": {
      const t3 = r2.map(((t4, n3) => n3 % 2 ? t4 + s2 : t4 + e2));
      o2.push({ key: "C", data: t3 }), e2 = t3[4], s2 = t3[5];
      break;
    }
    case "Q":
      o2.push({ key: "Q", data: [...r2] }), e2 = r2[2], s2 = r2[3];
      break;
    case "q": {
      const t3 = r2.map(((t4, n3) => n3 % 2 ? t4 + s2 : t4 + e2));
      o2.push({ key: "Q", data: t3 }), e2 = t3[2], s2 = t3[3];
      break;
    }
    case "A":
      o2.push({ key: "A", data: [...r2] }), e2 = r2[5], s2 = r2[6];
      break;
    case "a":
      e2 += r2[5], s2 += r2[6], o2.push({ key: "A", data: [r2[0], r2[1], r2[2], r2[3], r2[4], e2, s2] });
      break;
    case "H":
      o2.push({ key: "H", data: [...r2] }), e2 = r2[0];
      break;
    case "h":
      e2 += r2[0], o2.push({ key: "H", data: [e2] });
      break;
    case "V":
      o2.push({ key: "V", data: [...r2] }), s2 = r2[0];
      break;
    case "v":
      s2 += r2[0], o2.push({ key: "V", data: [s2] });
      break;
    case "S":
      o2.push({ key: "S", data: [...r2] }), e2 = r2[2], s2 = r2[3];
      break;
    case "s": {
      const t3 = r2.map(((t4, n3) => n3 % 2 ? t4 + s2 : t4 + e2));
      o2.push({ key: "S", data: t3 }), e2 = t3[2], s2 = t3[3];
      break;
    }
    case "T":
      o2.push({ key: "T", data: [...r2] }), e2 = r2[0], s2 = r2[1];
      break;
    case "t":
      e2 += r2[0], s2 += r2[1], o2.push({ key: "T", data: [e2, s2] });
      break;
    case "Z":
    case "z":
      o2.push({ key: "Z", data: [] }), e2 = n2, s2 = a2;
  }
  return o2;
}
function g(t2) {
  const e2 = [];
  let s2 = "", n2 = 0, a2 = 0, o2 = 0, h2 = 0, r2 = 0, i = 0;
  for (const { key: c2, data: l2 } of t2) {
    switch (c2) {
      case "M":
        e2.push({ key: "M", data: [...l2] }), [n2, a2] = l2, [o2, h2] = l2;
        break;
      case "C":
        e2.push({ key: "C", data: [...l2] }), n2 = l2[4], a2 = l2[5], r2 = l2[2], i = l2[3];
        break;
      case "L":
        e2.push({ key: "L", data: [...l2] }), [n2, a2] = l2;
        break;
      case "H":
        n2 = l2[0], e2.push({ key: "L", data: [n2, a2] });
        break;
      case "V":
        a2 = l2[0], e2.push({ key: "L", data: [n2, a2] });
        break;
      case "S": {
        let t3 = 0, o3 = 0;
        "C" === s2 || "S" === s2 ? (t3 = n2 + (n2 - r2), o3 = a2 + (a2 - i)) : (t3 = n2, o3 = a2), e2.push({ key: "C", data: [t3, o3, ...l2] }), r2 = l2[0], i = l2[1], n2 = l2[2], a2 = l2[3];
        break;
      }
      case "T": {
        const [t3, o3] = l2;
        let h3 = 0, c3 = 0;
        "Q" === s2 || "T" === s2 ? (h3 = n2 + (n2 - r2), c3 = a2 + (a2 - i)) : (h3 = n2, c3 = a2);
        const u2 = n2 + 2 * (h3 - n2) / 3, p2 = a2 + 2 * (c3 - a2) / 3, f2 = t3 + 2 * (h3 - t3) / 3, d2 = o3 + 2 * (c3 - o3) / 3;
        e2.push({ key: "C", data: [u2, p2, f2, d2, t3, o3] }), r2 = h3, i = c3, n2 = t3, a2 = o3;
        break;
      }
      case "Q": {
        const [t3, s3, o3, h3] = l2, c3 = n2 + 2 * (t3 - n2) / 3, u2 = a2 + 2 * (s3 - a2) / 3, p2 = o3 + 2 * (t3 - o3) / 3, f2 = h3 + 2 * (s3 - h3) / 3;
        e2.push({ key: "C", data: [c3, u2, p2, f2, o3, h3] }), r2 = t3, i = s3, n2 = o3, a2 = h3;
        break;
      }
      case "A": {
        const t3 = Math.abs(l2[0]), s3 = Math.abs(l2[1]), o3 = l2[2], h3 = l2[3], r3 = l2[4], i2 = l2[5], c3 = l2[6];
        if (0 === t3 || 0 === s3) e2.push({ key: "C", data: [n2, a2, i2, c3, i2, c3] }), n2 = i2, a2 = c3;
        else if (n2 !== i2 || a2 !== c3) {
          k(n2, a2, i2, c3, t3, s3, o3, h3, r3).forEach((function(t4) {
            e2.push({ key: "C", data: t4 });
          })), n2 = i2, a2 = c3;
        }
        break;
      }
      case "Z":
        e2.push({ key: "Z", data: [] }), n2 = o2, a2 = h2;
    }
    s2 = c2;
  }
  return e2;
}
function M(t2, e2, s2) {
  return [t2 * Math.cos(s2) - e2 * Math.sin(s2), t2 * Math.sin(s2) + e2 * Math.cos(s2)];
}
function k(t2, e2, s2, n2, a2, o2, h2, r2, i, c2) {
  const l2 = (u2 = h2, Math.PI * u2 / 180);
  var u2;
  let p2 = [], f2 = 0, d2 = 0, g2 = 0, b2 = 0;
  if (c2) [f2, d2, g2, b2] = c2;
  else {
    [t2, e2] = M(t2, e2, -l2), [s2, n2] = M(s2, n2, -l2);
    const h3 = (t2 - s2) / 2, c3 = (e2 - n2) / 2;
    let u3 = h3 * h3 / (a2 * a2) + c3 * c3 / (o2 * o2);
    u3 > 1 && (u3 = Math.sqrt(u3), a2 *= u3, o2 *= u3);
    const p3 = a2 * a2, k2 = o2 * o2, y3 = p3 * k2 - p3 * c3 * c3 - k2 * h3 * h3, m3 = p3 * c3 * c3 + k2 * h3 * h3, w3 = (r2 === i ? -1 : 1) * Math.sqrt(Math.abs(y3 / m3));
    g2 = w3 * a2 * c3 / o2 + (t2 + s2) / 2, b2 = w3 * -o2 * h3 / a2 + (e2 + n2) / 2, f2 = Math.asin(parseFloat(((e2 - b2) / o2).toFixed(9))), d2 = Math.asin(parseFloat(((n2 - b2) / o2).toFixed(9))), t2 < g2 && (f2 = Math.PI - f2), s2 < g2 && (d2 = Math.PI - d2), f2 < 0 && (f2 = 2 * Math.PI + f2), d2 < 0 && (d2 = 2 * Math.PI + d2), i && f2 > d2 && (f2 -= 2 * Math.PI), !i && d2 > f2 && (d2 -= 2 * Math.PI);
  }
  let y2 = d2 - f2;
  if (Math.abs(y2) > 120 * Math.PI / 180) {
    const t3 = d2, e3 = s2, r3 = n2;
    d2 = i && d2 > f2 ? f2 + 120 * Math.PI / 180 * 1 : f2 + 120 * Math.PI / 180 * -1, p2 = k(s2 = g2 + a2 * Math.cos(d2), n2 = b2 + o2 * Math.sin(d2), e3, r3, a2, o2, h2, 0, i, [d2, t3, g2, b2]);
  }
  y2 = d2 - f2;
  const m2 = Math.cos(f2), w2 = Math.sin(f2), x2 = Math.cos(d2), P2 = Math.sin(d2), v2 = Math.tan(y2 / 4), O2 = 4 / 3 * a2 * v2, S2 = 4 / 3 * o2 * v2, L2 = [t2, e2], T2 = [t2 + O2 * w2, e2 - S2 * m2], D2 = [s2 + O2 * P2, n2 - S2 * x2], A2 = [s2, n2];
  if (T2[0] = 2 * L2[0] - T2[0], T2[1] = 2 * L2[1] - T2[1], c2) return [T2, D2, A2].concat(p2);
  {
    p2 = [T2, D2, A2].concat(p2);
    const t3 = [];
    for (let e3 = 0; e3 < p2.length; e3 += 3) {
      const s3 = M(p2[e3][0], p2[e3][1], l2), n3 = M(p2[e3 + 1][0], p2[e3 + 1][1], l2), a3 = M(p2[e3 + 2][0], p2[e3 + 2][1], l2);
      t3.push([s3[0], s3[1], n3[0], n3[1], a3[0], a3[1]]);
    }
    return t3;
  }
}
var b = { randOffset: function(t2, e2) {
  return A$1(t2, e2);
}, randOffsetWithRange: function(t2, e2, s2) {
  return D(t2, e2, s2);
}, ellipse: function(t2, e2, s2, n2, a2) {
  const o2 = P(s2, n2, a2);
  return v(t2, e2, a2, o2).opset;
}, doubleLineOps: function(t2, e2, s2, n2, a2) {
  return I(t2, e2, s2, n2, a2, true);
} };
function y$2(t2, e2, s2, n2, a2) {
  return { type: "path", ops: I(t2, e2, s2, n2, a2) };
}
function m(t2, e2, s2) {
  const n2 = (t2 || []).length;
  if (n2 > 2) {
    const a2 = [];
    for (let e3 = 0; e3 < n2 - 1; e3++) a2.push(...I(t2[e3][0], t2[e3][1], t2[e3 + 1][0], t2[e3 + 1][1], s2));
    return e2 && a2.push(...I(t2[n2 - 1][0], t2[n2 - 1][1], t2[0][0], t2[0][1], s2)), { type: "path", ops: a2 };
  }
  return 2 === n2 ? y$2(t2[0][0], t2[0][1], t2[1][0], t2[1][1], s2) : { type: "path", ops: [] };
}
function w(t2, e2, s2, n2, a2) {
  return (function(t3, e3) {
    return m(t3, true, e3);
  })([[t2, e2], [t2 + s2, e2], [t2 + s2, e2 + n2], [t2, e2 + n2]], a2);
}
function x$2(t2, e2) {
  let s2 = _(t2, 1 * (1 + 0.2 * e2.roughness), e2);
  if (!e2.disableMultiStroke) {
    const n2 = _(t2, 1.5 * (1 + 0.22 * e2.roughness), (function(t3) {
      const e3 = Object.assign({}, t3);
      e3.randomizer = void 0, t3.seed && (e3.seed = t3.seed + 1);
      return e3;
    })(e2));
    s2 = s2.concat(n2);
  }
  return { type: "path", ops: s2 };
}
function P(t2, e2, s2) {
  const n2 = Math.sqrt(2 * Math.PI * Math.sqrt((Math.pow(t2 / 2, 2) + Math.pow(e2 / 2, 2)) / 2)), a2 = Math.ceil(Math.max(s2.curveStepCount, s2.curveStepCount / Math.sqrt(200) * n2)), o2 = 2 * Math.PI / a2;
  let h2 = Math.abs(t2 / 2), r2 = Math.abs(e2 / 2);
  const i = 1 - s2.curveFitting;
  return h2 += A$1(h2 * i, s2), r2 += A$1(r2 * i, s2), { increment: o2, rx: h2, ry: r2 };
}
function v(t2, e2, s2, n2) {
  const [a2, o2] = z(n2.increment, t2, e2, n2.rx, n2.ry, 1, n2.increment * D(0.1, D(0.4, 1, s2), s2), s2);
  let h2 = W(a2, null, s2);
  if (!s2.disableMultiStroke && 0 !== s2.roughness) {
    const [a3] = z(n2.increment, t2, e2, n2.rx, n2.ry, 1.5, 0, s2), o3 = W(a3, null, s2);
    h2 = h2.concat(o3);
  }
  return { estimatedPoints: o2, opset: { type: "path", ops: h2 } };
}
function O(t2, e2, s2, n2, a2, o2, h2, r2, i) {
  const c2 = t2, l2 = e2;
  let u2 = Math.abs(s2 / 2), p2 = Math.abs(n2 / 2);
  u2 += A$1(0.01 * u2, i), p2 += A$1(0.01 * p2, i);
  let f2 = a2, d2 = o2;
  for (; f2 < 0; ) f2 += 2 * Math.PI, d2 += 2 * Math.PI;
  d2 - f2 > 2 * Math.PI && (f2 = 0, d2 = 2 * Math.PI);
  const g2 = 2 * Math.PI / i.curveStepCount, M2 = Math.min(g2 / 2, (d2 - f2) / 2), k2 = E(M2, c2, l2, u2, p2, f2, d2, 1, i);
  if (!i.disableMultiStroke) {
    const t3 = E(M2, c2, l2, u2, p2, f2, d2, 1.5, i);
    k2.push(...t3);
  }
  return h2 && (r2 ? k2.push(...I(c2, l2, c2 + u2 * Math.cos(f2), l2 + p2 * Math.sin(f2), i), ...I(c2, l2, c2 + u2 * Math.cos(d2), l2 + p2 * Math.sin(d2), i)) : k2.push({ op: "lineTo", data: [c2, l2] }, { op: "lineTo", data: [c2 + u2 * Math.cos(f2), l2 + p2 * Math.sin(f2)] })), { type: "path", ops: k2 };
}
function S(t2, e2) {
  const s2 = [];
  for (const n2 of t2) if (n2.length) {
    const t3 = e2.maxRandomnessOffset || 0, a2 = n2.length;
    if (a2 > 2) {
      s2.push({ op: "move", data: [n2[0][0] + A$1(t3, e2), n2[0][1] + A$1(t3, e2)] });
      for (let o2 = 1; o2 < a2; o2++) s2.push({ op: "lineTo", data: [n2[o2][0] + A$1(t3, e2), n2[o2][1] + A$1(t3, e2)] });
    }
  }
  return { type: "fillPath", ops: s2 };
}
function L(t2, e2) {
  return (function(t3, e3) {
    let s2 = t3.fillStyle || "hachure";
    if (!c[s2]) switch (s2) {
      case "zigzag":
        c[s2] || (c[s2] = new a(e3));
        break;
      case "cross-hatch":
        c[s2] || (c[s2] = new o(e3));
        break;
      case "dots":
        c[s2] || (c[s2] = new h(e3));
        break;
      case "dashed":
        c[s2] || (c[s2] = new r(e3));
        break;
      case "zigzag-line":
        c[s2] || (c[s2] = new i$1(e3));
        break;
      case "hachure":
      default:
        s2 = "hachure", c[s2] || (c[s2] = new n(e3));
    }
    return c[s2];
  })(e2, b).fillPolygons(t2, e2);
}
function T(t2) {
  return t2.randomizer || (t2.randomizer = new l(t2.seed || 0)), t2.randomizer.next();
}
function D(t2, e2, s2, n2 = 1) {
  return s2.roughness * n2 * (T(s2) * (e2 - t2) + t2);
}
function A$1(t2, e2, s2 = 1) {
  return D(-t2, t2, e2, s2);
}
function I(t2, e2, s2, n2, a2, o2 = false) {
  const h2 = o2 ? a2.disableMultiStrokeFill : a2.disableMultiStroke, r2 = C(t2, e2, s2, n2, a2, true, false);
  if (h2) return r2;
  const i = C(t2, e2, s2, n2, a2, true, true);
  return r2.concat(i);
}
function C(t2, e2, s2, n2, a2, o2, h2) {
  const r2 = Math.pow(t2 - s2, 2) + Math.pow(e2 - n2, 2), i = Math.sqrt(r2);
  let c2 = 1;
  c2 = i < 200 ? 1 : i > 500 ? 0.4 : -16668e-7 * i + 1.233334;
  let l2 = a2.maxRandomnessOffset || 0;
  l2 * l2 * 100 > r2 && (l2 = i / 10);
  const u2 = l2 / 2, p2 = 0.2 + 0.2 * T(a2);
  let f2 = a2.bowing * a2.maxRandomnessOffset * (n2 - e2) / 200, d2 = a2.bowing * a2.maxRandomnessOffset * (t2 - s2) / 200;
  f2 = A$1(f2, a2, c2), d2 = A$1(d2, a2, c2);
  const g2 = [], M2 = () => A$1(u2, a2, c2), k2 = () => A$1(l2, a2, c2), b2 = a2.preserveVertices;
  return o2 && (h2 ? g2.push({ op: "move", data: [t2 + (b2 ? 0 : M2()), e2 + (b2 ? 0 : M2())] }) : g2.push({ op: "move", data: [t2 + (b2 ? 0 : A$1(l2, a2, c2)), e2 + (b2 ? 0 : A$1(l2, a2, c2))] })), h2 ? g2.push({ op: "bcurveTo", data: [f2 + t2 + (s2 - t2) * p2 + M2(), d2 + e2 + (n2 - e2) * p2 + M2(), f2 + t2 + 2 * (s2 - t2) * p2 + M2(), d2 + e2 + 2 * (n2 - e2) * p2 + M2(), s2 + (b2 ? 0 : M2()), n2 + (b2 ? 0 : M2())] }) : g2.push({ op: "bcurveTo", data: [f2 + t2 + (s2 - t2) * p2 + k2(), d2 + e2 + (n2 - e2) * p2 + k2(), f2 + t2 + 2 * (s2 - t2) * p2 + k2(), d2 + e2 + 2 * (n2 - e2) * p2 + k2(), s2 + (b2 ? 0 : k2()), n2 + (b2 ? 0 : k2())] }), g2;
}
function _(t2, e2, s2) {
  const n2 = [];
  n2.push([t2[0][0] + A$1(e2, s2), t2[0][1] + A$1(e2, s2)]), n2.push([t2[0][0] + A$1(e2, s2), t2[0][1] + A$1(e2, s2)]);
  for (let a2 = 1; a2 < t2.length; a2++) n2.push([t2[a2][0] + A$1(e2, s2), t2[a2][1] + A$1(e2, s2)]), a2 === t2.length - 1 && n2.push([t2[a2][0] + A$1(e2, s2), t2[a2][1] + A$1(e2, s2)]);
  return W(n2, null, s2);
}
function W(t2, e2, s2) {
  const n2 = t2.length, a2 = [];
  if (n2 > 3) {
    const o2 = [], h2 = 1 - s2.curveTightness;
    a2.push({ op: "move", data: [t2[1][0], t2[1][1]] });
    for (let e3 = 1; e3 + 2 < n2; e3++) {
      const s3 = t2[e3];
      o2[0] = [s3[0], s3[1]], o2[1] = [s3[0] + (h2 * t2[e3 + 1][0] - h2 * t2[e3 - 1][0]) / 6, s3[1] + (h2 * t2[e3 + 1][1] - h2 * t2[e3 - 1][1]) / 6], o2[2] = [t2[e3 + 1][0] + (h2 * t2[e3][0] - h2 * t2[e3 + 2][0]) / 6, t2[e3 + 1][1] + (h2 * t2[e3][1] - h2 * t2[e3 + 2][1]) / 6], o2[3] = [t2[e3 + 1][0], t2[e3 + 1][1]], a2.push({ op: "bcurveTo", data: [o2[1][0], o2[1][1], o2[2][0], o2[2][1], o2[3][0], o2[3][1]] });
    }
    if (e2 && 2 === e2.length) {
      const t3 = s2.maxRandomnessOffset;
      a2.push({ op: "lineTo", data: [e2[0] + A$1(t3, s2), e2[1] + A$1(t3, s2)] });
    }
  } else 3 === n2 ? (a2.push({ op: "move", data: [t2[1][0], t2[1][1]] }), a2.push({ op: "bcurveTo", data: [t2[1][0], t2[1][1], t2[2][0], t2[2][1], t2[2][0], t2[2][1]] })) : 2 === n2 && a2.push(...I(t2[0][0], t2[0][1], t2[1][0], t2[1][1], s2));
  return a2;
}
function z(t2, e2, s2, n2, a2, o2, h2, r2) {
  const i = [], c2 = [];
  if (0 === r2.roughness) {
    t2 /= 4, c2.push([e2 + n2 * Math.cos(-t2), s2 + a2 * Math.sin(-t2)]);
    for (let o3 = 0; o3 <= 2 * Math.PI; o3 += t2) {
      const t3 = [e2 + n2 * Math.cos(o3), s2 + a2 * Math.sin(o3)];
      i.push(t3), c2.push(t3);
    }
    c2.push([e2 + n2 * Math.cos(0), s2 + a2 * Math.sin(0)]), c2.push([e2 + n2 * Math.cos(t2), s2 + a2 * Math.sin(t2)]);
  } else {
    const l2 = A$1(0.5, r2) - Math.PI / 2;
    c2.push([A$1(o2, r2) + e2 + 0.9 * n2 * Math.cos(l2 - t2), A$1(o2, r2) + s2 + 0.9 * a2 * Math.sin(l2 - t2)]);
    const u2 = 2 * Math.PI + l2 - 0.01;
    for (let h3 = l2; h3 < u2; h3 += t2) {
      const t3 = [A$1(o2, r2) + e2 + n2 * Math.cos(h3), A$1(o2, r2) + s2 + a2 * Math.sin(h3)];
      i.push(t3), c2.push(t3);
    }
    c2.push([A$1(o2, r2) + e2 + n2 * Math.cos(l2 + 2 * Math.PI + 0.5 * h2), A$1(o2, r2) + s2 + a2 * Math.sin(l2 + 2 * Math.PI + 0.5 * h2)]), c2.push([A$1(o2, r2) + e2 + 0.98 * n2 * Math.cos(l2 + h2), A$1(o2, r2) + s2 + 0.98 * a2 * Math.sin(l2 + h2)]), c2.push([A$1(o2, r2) + e2 + 0.9 * n2 * Math.cos(l2 + 0.5 * h2), A$1(o2, r2) + s2 + 0.9 * a2 * Math.sin(l2 + 0.5 * h2)]);
  }
  return [c2, i];
}
function E(t2, e2, s2, n2, a2, o2, h2, r2, i) {
  const c2 = o2 + A$1(0.1, i), l2 = [];
  l2.push([A$1(r2, i) + e2 + 0.9 * n2 * Math.cos(c2 - t2), A$1(r2, i) + s2 + 0.9 * a2 * Math.sin(c2 - t2)]);
  for (let o3 = c2; o3 <= h2; o3 += t2) l2.push([A$1(r2, i) + e2 + n2 * Math.cos(o3), A$1(r2, i) + s2 + a2 * Math.sin(o3)]);
  return l2.push([e2 + n2 * Math.cos(h2), s2 + a2 * Math.sin(h2)]), l2.push([e2 + n2 * Math.cos(h2), s2 + a2 * Math.sin(h2)]), W(l2, null, i);
}
function $(t2, e2, s2, n2, a2, o2, h2, r2) {
  const i = [], c2 = [r2.maxRandomnessOffset || 1, (r2.maxRandomnessOffset || 1) + 0.3];
  let l2 = [0, 0];
  const u2 = r2.disableMultiStroke ? 1 : 2, p2 = r2.preserveVertices;
  for (let f2 = 0; f2 < u2; f2++) 0 === f2 ? i.push({ op: "move", data: [h2[0], h2[1]] }) : i.push({ op: "move", data: [h2[0] + (p2 ? 0 : A$1(c2[0], r2)), h2[1] + (p2 ? 0 : A$1(c2[0], r2))] }), l2 = p2 ? [a2, o2] : [a2 + A$1(c2[f2], r2), o2 + A$1(c2[f2], r2)], i.push({ op: "bcurveTo", data: [t2 + A$1(c2[f2], r2), e2 + A$1(c2[f2], r2), s2 + A$1(c2[f2], r2), n2 + A$1(c2[f2], r2), l2[0], l2[1]] });
  return i;
}
function G$1(t2) {
  return [...t2];
}
function R(t2, e2) {
  return Math.pow(t2[0] - e2[0], 2) + Math.pow(t2[1] - e2[1], 2);
}
function q(t2, e2, s2) {
  const n2 = R(e2, s2);
  if (0 === n2) return R(t2, e2);
  let a2 = ((t2[0] - e2[0]) * (s2[0] - e2[0]) + (t2[1] - e2[1]) * (s2[1] - e2[1])) / n2;
  return a2 = Math.max(0, Math.min(1, a2)), R(t2, j(e2, s2, a2));
}
function j(t2, e2, s2) {
  return [t2[0] + (e2[0] - t2[0]) * s2, t2[1] + (e2[1] - t2[1]) * s2];
}
function F(t2, e2, s2, n2) {
  const a2 = n2 || [];
  if ((function(t3, e3) {
    const s3 = t3[e3 + 0], n3 = t3[e3 + 1], a3 = t3[e3 + 2], o3 = t3[e3 + 3];
    let h3 = 3 * n3[0] - 2 * s3[0] - o3[0];
    h3 *= h3;
    let r2 = 3 * n3[1] - 2 * s3[1] - o3[1];
    r2 *= r2;
    let i = 3 * a3[0] - 2 * o3[0] - s3[0];
    i *= i;
    let c2 = 3 * a3[1] - 2 * o3[1] - s3[1];
    return c2 *= c2, h3 < i && (h3 = i), r2 < c2 && (r2 = c2), h3 + r2;
  })(t2, e2) < s2) {
    const s3 = t2[e2 + 0];
    if (a2.length) {
      (o2 = a2[a2.length - 1], h2 = s3, Math.sqrt(R(o2, h2))) > 1 && a2.push(s3);
    } else a2.push(s3);
    a2.push(t2[e2 + 3]);
  } else {
    const n3 = 0.5, o3 = t2[e2 + 0], h3 = t2[e2 + 1], r2 = t2[e2 + 2], i = t2[e2 + 3], c2 = j(o3, h3, n3), l2 = j(h3, r2, n3), u2 = j(r2, i, n3), p2 = j(c2, l2, n3), f2 = j(l2, u2, n3), d2 = j(p2, f2, n3);
    F([o3, c2, p2, d2], 0, s2, a2), F([d2, f2, u2, i], 0, s2, a2);
  }
  var o2, h2;
  return a2;
}
function V(t2, e2) {
  return Z(t2, 0, t2.length, e2);
}
function Z(t2, e2, s2, n2, a2) {
  const o2 = a2 || [], h2 = t2[e2], r2 = t2[s2 - 1];
  let i = 0, c2 = 1;
  for (let n3 = e2 + 1; n3 < s2 - 1; ++n3) {
    const e3 = q(t2[n3], h2, r2);
    e3 > i && (i = e3, c2 = n3);
  }
  return Math.sqrt(i) > n2 ? (Z(t2, e2, c2 + 1, n2, o2), Z(t2, c2, s2, n2, o2)) : (o2.length || o2.push(h2), o2.push(r2)), o2;
}
function Q(t2, e2 = 0.15, s2) {
  const n2 = [], a2 = (t2.length - 1) / 3;
  for (let s3 = 0; s3 < a2; s3++) {
    F(t2, 3 * s3, e2, n2);
  }
  return s2 && s2 > 0 ? Z(n2, 0, n2.length, s2) : n2;
}
var H = "none";
var N = class {
  constructor(t2) {
    this.defaultOptions = { maxRandomnessOffset: 2, roughness: 1, bowing: 1, stroke: "#000", strokeWidth: 1, curveTightness: 0, curveFitting: 0.95, curveStepCount: 9, fillStyle: "hachure", fillWeight: -1, hachureAngle: -41, hachureGap: -1, dashOffset: -1, dashGap: -1, zigzagOffset: -1, seed: 0, disableMultiStroke: false, disableMultiStrokeFill: false, preserveVertices: false }, this.config = t2 || {}, this.config.options && (this.defaultOptions = this._o(this.config.options));
  }
  static newSeed() {
    return Math.floor(Math.random() * 2 ** 31);
  }
  _o(t2) {
    return t2 ? Object.assign({}, this.defaultOptions, t2) : this.defaultOptions;
  }
  _d(t2, e2, s2) {
    return { shape: t2, sets: e2 || [], options: s2 || this.defaultOptions };
  }
  line(t2, e2, s2, n2, a2) {
    const o2 = this._o(a2);
    return this._d("line", [y$2(t2, e2, s2, n2, o2)], o2);
  }
  rectangle(t2, e2, s2, n2, a2) {
    const o2 = this._o(a2), h2 = [], r2 = w(t2, e2, s2, n2, o2);
    if (o2.fill) {
      const a3 = [[t2, e2], [t2 + s2, e2], [t2 + s2, e2 + n2], [t2, e2 + n2]];
      "solid" === o2.fillStyle ? h2.push(S([a3], o2)) : h2.push(L([a3], o2));
    }
    return o2.stroke !== H && h2.push(r2), this._d("rectangle", h2, o2);
  }
  ellipse(t2, e2, s2, n2, a2) {
    const o2 = this._o(a2), h2 = [], r2 = P(s2, n2, o2), i = v(t2, e2, o2, r2);
    if (o2.fill) if ("solid" === o2.fillStyle) {
      const s3 = v(t2, e2, o2, r2).opset;
      s3.type = "fillPath", h2.push(s3);
    } else h2.push(L([i.estimatedPoints], o2));
    return o2.stroke !== H && h2.push(i.opset), this._d("ellipse", h2, o2);
  }
  circle(t2, e2, s2, n2) {
    const a2 = this.ellipse(t2, e2, s2, s2, n2);
    return a2.shape = "circle", a2;
  }
  linearPath(t2, e2) {
    const s2 = this._o(e2);
    return this._d("linearPath", [m(t2, false, s2)], s2);
  }
  arc(t2, e2, s2, n2, a2, o2, h2 = false, r2) {
    const i = this._o(r2), c2 = [], l2 = O(t2, e2, s2, n2, a2, o2, h2, true, i);
    if (h2 && i.fill) if ("solid" === i.fillStyle) {
      const h3 = Object.assign({}, i);
      h3.disableMultiStroke = true;
      const r3 = O(t2, e2, s2, n2, a2, o2, true, false, h3);
      r3.type = "fillPath", c2.push(r3);
    } else c2.push((function(t3, e3, s3, n3, a3, o3, h3) {
      const r3 = t3, i2 = e3;
      let c3 = Math.abs(s3 / 2), l3 = Math.abs(n3 / 2);
      c3 += A$1(0.01 * c3, h3), l3 += A$1(0.01 * l3, h3);
      let u2 = a3, p2 = o3;
      for (; u2 < 0; ) u2 += 2 * Math.PI, p2 += 2 * Math.PI;
      p2 - u2 > 2 * Math.PI && (u2 = 0, p2 = 2 * Math.PI);
      const f2 = (p2 - u2) / h3.curveStepCount, d2 = [];
      for (let t4 = u2; t4 <= p2; t4 += f2) d2.push([r3 + c3 * Math.cos(t4), i2 + l3 * Math.sin(t4)]);
      return d2.push([r3 + c3 * Math.cos(p2), i2 + l3 * Math.sin(p2)]), d2.push([r3, i2]), L([d2], h3);
    })(t2, e2, s2, n2, a2, o2, i));
    return i.stroke !== H && c2.push(l2), this._d("arc", c2, i);
  }
  curve(t2, e2) {
    const s2 = this._o(e2), n2 = [], a2 = x$2(t2, s2);
    if (s2.fill && s2.fill !== H && t2.length >= 3) {
      const e3 = Q((function(t3, e4 = 0) {
        const s3 = t3.length;
        if (s3 < 3) throw new Error("A curve must have at least three points.");
        const n3 = [];
        if (3 === s3) n3.push(G$1(t3[0]), G$1(t3[1]), G$1(t3[2]), G$1(t3[2]));
        else {
          const s4 = [];
          s4.push(t3[0], t3[0]);
          for (let e5 = 1; e5 < t3.length; e5++) s4.push(t3[e5]), e5 === t3.length - 1 && s4.push(t3[e5]);
          const a3 = [], o2 = 1 - e4;
          n3.push(G$1(s4[0]));
          for (let t4 = 1; t4 + 2 < s4.length; t4++) {
            const e5 = s4[t4];
            a3[0] = [e5[0], e5[1]], a3[1] = [e5[0] + (o2 * s4[t4 + 1][0] - o2 * s4[t4 - 1][0]) / 6, e5[1] + (o2 * s4[t4 + 1][1] - o2 * s4[t4 - 1][1]) / 6], a3[2] = [s4[t4 + 1][0] + (o2 * s4[t4][0] - o2 * s4[t4 + 2][0]) / 6, s4[t4 + 1][1] + (o2 * s4[t4][1] - o2 * s4[t4 + 2][1]) / 6], a3[3] = [s4[t4 + 1][0], s4[t4 + 1][1]], n3.push(a3[1], a3[2], a3[3]);
          }
        }
        return n3;
      })(t2), 10, (1 + s2.roughness) / 2);
      "solid" === s2.fillStyle ? n2.push(S([e3], s2)) : n2.push(L([e3], s2));
    }
    return s2.stroke !== H && n2.push(a2), this._d("curve", n2, s2);
  }
  polygon(t2, e2) {
    const s2 = this._o(e2), n2 = [], a2 = m(t2, true, s2);
    return s2.fill && ("solid" === s2.fillStyle ? n2.push(S([t2], s2)) : n2.push(L([t2], s2))), s2.stroke !== H && n2.push(a2), this._d("polygon", n2, s2);
  }
  path(t2, e2) {
    const s2 = this._o(e2), n2 = [];
    if (!t2) return this._d("path", n2, s2);
    t2 = (t2 || "").replace(/\n/g, " ").replace(/(-\s)/g, "-").replace("/(ss)/g", " ");
    const a2 = s2.fill && "transparent" !== s2.fill && s2.fill !== H, o2 = s2.stroke !== H, h2 = !!(s2.simplification && s2.simplification < 1), r2 = (function(t3, e3, s3) {
      const n3 = g(d(f(t3))), a3 = [];
      let o3 = [], h3 = [0, 0], r3 = [];
      const i = () => {
        r3.length >= 4 && o3.push(...Q(r3, e3)), r3 = [];
      }, c2 = () => {
        i(), o3.length && (a3.push(o3), o3 = []);
      };
      for (const { key: t4, data: e4 } of n3) switch (t4) {
        case "M":
          c2(), h3 = [e4[0], e4[1]], o3.push(h3);
          break;
        case "L":
          i(), o3.push([e4[0], e4[1]]);
          break;
        case "C":
          if (!r3.length) {
            const t5 = o3.length ? o3[o3.length - 1] : h3;
            r3.push([t5[0], t5[1]]);
          }
          r3.push([e4[0], e4[1]]), r3.push([e4[2], e4[3]]), r3.push([e4[4], e4[5]]);
          break;
        case "Z":
          i(), o3.push([h3[0], h3[1]]);
      }
      if (c2(), !s3) return a3;
      const l2 = [];
      for (const t4 of a3) {
        const e4 = V(t4, s3);
        e4.length && l2.push(e4);
      }
      return l2;
    })(t2, 1, h2 ? 4 - 4 * s2.simplification : (1 + s2.roughness) / 2);
    return a2 && ("solid" === s2.fillStyle ? n2.push(S(r2, s2)) : n2.push(L(r2, s2))), o2 && (h2 ? r2.forEach(((t3) => {
      n2.push(m(t3, false, s2));
    })) : n2.push((function(t3, e3) {
      const s3 = g(d(f(t3))), n3 = [];
      let a3 = [0, 0], o3 = [0, 0];
      for (const { key: t4, data: h3 } of s3) switch (t4) {
        case "M": {
          const t5 = 1 * (e3.maxRandomnessOffset || 0), s4 = e3.preserveVertices;
          n3.push({ op: "move", data: h3.map(((n4) => n4 + (s4 ? 0 : A$1(t5, e3)))) }), o3 = [h3[0], h3[1]], a3 = [h3[0], h3[1]];
          break;
        }
        case "L":
          n3.push(...I(o3[0], o3[1], h3[0], h3[1], e3)), o3 = [h3[0], h3[1]];
          break;
        case "C": {
          const [t5, s4, a4, r3, i, c2] = h3;
          n3.push(...$(t5, s4, a4, r3, i, c2, o3, e3)), o3 = [i, c2];
          break;
        }
        case "Z":
          n3.push(...I(o3[0], o3[1], a3[0], a3[1], e3)), o3 = [a3[0], a3[1]];
      }
      return { type: "path", ops: n3 };
    })(t2, s2))), this._d("path", n2, s2);
  }
  opsToPath(t2, e2) {
    let s2 = "";
    for (const n2 of t2.ops) {
      const t3 = "number" == typeof e2 && e2 >= 0 ? n2.data.map(((t4) => +t4.toFixed(e2))) : n2.data;
      switch (n2.op) {
        case "move":
          s2 += `M${t3[0]} ${t3[1]} `;
          break;
        case "bcurveTo":
          s2 += `C${t3[0]} ${t3[1]}, ${t3[2]} ${t3[3]}, ${t3[4]} ${t3[5]} `;
          break;
        case "lineTo":
          s2 += `L${t3[0]} ${t3[1]} `;
      }
    }
    return s2.trim();
  }
  toPaths(t2) {
    const e2 = t2.sets || [], s2 = t2.options || this.defaultOptions, n2 = [];
    for (const t3 of e2) {
      let e3 = null;
      switch (t3.type) {
        case "path":
          e3 = { d: this.opsToPath(t3), stroke: s2.stroke, strokeWidth: s2.strokeWidth, fill: H };
          break;
        case "fillPath":
          e3 = { d: this.opsToPath(t3), stroke: H, strokeWidth: 0, fill: s2.fill || H };
          break;
        case "fillSketch":
          e3 = this.fillSketch(t3, s2);
      }
      e3 && n2.push(e3);
    }
    return n2;
  }
  fillSketch(t2, e2) {
    let s2 = e2.fillWeight;
    return s2 < 0 && (s2 = e2.strokeWidth / 2), { d: this.opsToPath(t2), stroke: e2.fill || H, strokeWidth: s2, fill: H };
  }
};
var B = class {
  constructor(t2, e2) {
    this.canvas = t2, this.ctx = this.canvas.getContext("2d"), this.gen = new N(e2);
  }
  draw(t2) {
    const e2 = t2.sets || [], s2 = t2.options || this.getDefaultOptions(), n2 = this.ctx, a2 = t2.options.fixedDecimalPlaceDigits;
    for (const o2 of e2) switch (o2.type) {
      case "path":
        n2.save(), n2.strokeStyle = "none" === s2.stroke ? "transparent" : s2.stroke, n2.lineWidth = s2.strokeWidth, s2.strokeLineDash && n2.setLineDash(s2.strokeLineDash), s2.strokeLineDashOffset && (n2.lineDashOffset = s2.strokeLineDashOffset), this._drawToContext(n2, o2, a2), n2.restore();
        break;
      case "fillPath": {
        n2.save(), n2.fillStyle = s2.fill || "";
        const e3 = "curve" === t2.shape || "polygon" === t2.shape || "path" === t2.shape ? "evenodd" : "nonzero";
        this._drawToContext(n2, o2, a2, e3), n2.restore();
        break;
      }
      case "fillSketch":
        this.fillSketch(n2, o2, s2);
    }
  }
  fillSketch(t2, e2, s2) {
    let n2 = s2.fillWeight;
    n2 < 0 && (n2 = s2.strokeWidth / 2), t2.save(), s2.fillLineDash && t2.setLineDash(s2.fillLineDash), s2.fillLineDashOffset && (t2.lineDashOffset = s2.fillLineDashOffset), t2.strokeStyle = s2.fill || "", t2.lineWidth = n2, this._drawToContext(t2, e2, s2.fixedDecimalPlaceDigits), t2.restore();
  }
  _drawToContext(t2, e2, s2, n2 = "nonzero") {
    t2.beginPath();
    for (const n3 of e2.ops) {
      const e3 = "number" == typeof s2 && s2 >= 0 ? n3.data.map(((t3) => +t3.toFixed(s2))) : n3.data;
      switch (n3.op) {
        case "move":
          t2.moveTo(e3[0], e3[1]);
          break;
        case "bcurveTo":
          t2.bezierCurveTo(e3[0], e3[1], e3[2], e3[3], e3[4], e3[5]);
          break;
        case "lineTo":
          t2.lineTo(e3[0], e3[1]);
      }
    }
    "fillPath" === e2.type ? t2.fill(n2) : t2.stroke();
  }
  get generator() {
    return this.gen;
  }
  getDefaultOptions() {
    return this.gen.defaultOptions;
  }
  line(t2, e2, s2, n2, a2) {
    const o2 = this.gen.line(t2, e2, s2, n2, a2);
    return this.draw(o2), o2;
  }
  rectangle(t2, e2, s2, n2, a2) {
    const o2 = this.gen.rectangle(t2, e2, s2, n2, a2);
    return this.draw(o2), o2;
  }
  ellipse(t2, e2, s2, n2, a2) {
    const o2 = this.gen.ellipse(t2, e2, s2, n2, a2);
    return this.draw(o2), o2;
  }
  circle(t2, e2, s2, n2) {
    const a2 = this.gen.circle(t2, e2, s2, n2);
    return this.draw(a2), a2;
  }
  linearPath(t2, e2) {
    const s2 = this.gen.linearPath(t2, e2);
    return this.draw(s2), s2;
  }
  polygon(t2, e2) {
    const s2 = this.gen.polygon(t2, e2);
    return this.draw(s2), s2;
  }
  arc(t2, e2, s2, n2, a2, o2, h2 = false, r2) {
    const i = this.gen.arc(t2, e2, s2, n2, a2, o2, h2, r2);
    return this.draw(i), i;
  }
  curve(t2, e2) {
    const s2 = this.gen.curve(t2, e2);
    return this.draw(s2), s2;
  }
  path(t2, e2) {
    const s2 = this.gen.path(t2, e2);
    return this.draw(s2), s2;
  }
};
var J = "http://www.w3.org/2000/svg";
var K = class {
  constructor(t2, e2) {
    this.svg = t2, this.gen = new N(e2);
  }
  draw(t2) {
    const e2 = t2.sets || [], s2 = t2.options || this.getDefaultOptions(), n2 = this.svg.ownerDocument || window.document, a2 = n2.createElementNS(J, "g"), o2 = t2.options.fixedDecimalPlaceDigits;
    for (const h2 of e2) {
      let e3 = null;
      switch (h2.type) {
        case "path":
          e3 = n2.createElementNS(J, "path"), e3.setAttribute("d", this.opsToPath(h2, o2)), e3.setAttribute("stroke", s2.stroke), e3.setAttribute("stroke-width", s2.strokeWidth + ""), e3.setAttribute("fill", "none"), s2.strokeLineDash && e3.setAttribute("stroke-dasharray", s2.strokeLineDash.join(" ").trim()), s2.strokeLineDashOffset && e3.setAttribute("stroke-dashoffset", `${s2.strokeLineDashOffset}`);
          break;
        case "fillPath":
          e3 = n2.createElementNS(J, "path"), e3.setAttribute("d", this.opsToPath(h2, o2)), e3.setAttribute("stroke", "none"), e3.setAttribute("stroke-width", "0"), e3.setAttribute("fill", s2.fill || ""), "curve" !== t2.shape && "polygon" !== t2.shape || e3.setAttribute("fill-rule", "evenodd");
          break;
        case "fillSketch":
          e3 = this.fillSketch(n2, h2, s2);
      }
      e3 && a2.appendChild(e3);
    }
    return a2;
  }
  fillSketch(t2, e2, s2) {
    let n2 = s2.fillWeight;
    n2 < 0 && (n2 = s2.strokeWidth / 2);
    const a2 = t2.createElementNS(J, "path");
    return a2.setAttribute("d", this.opsToPath(e2, s2.fixedDecimalPlaceDigits)), a2.setAttribute("stroke", s2.fill || ""), a2.setAttribute("stroke-width", n2 + ""), a2.setAttribute("fill", "none"), s2.fillLineDash && a2.setAttribute("stroke-dasharray", s2.fillLineDash.join(" ").trim()), s2.fillLineDashOffset && a2.setAttribute("stroke-dashoffset", `${s2.fillLineDashOffset}`), a2;
  }
  get generator() {
    return this.gen;
  }
  getDefaultOptions() {
    return this.gen.defaultOptions;
  }
  opsToPath(t2, e2) {
    return this.gen.opsToPath(t2, e2);
  }
  line(t2, e2, s2, n2, a2) {
    const o2 = this.gen.line(t2, e2, s2, n2, a2);
    return this.draw(o2);
  }
  rectangle(t2, e2, s2, n2, a2) {
    const o2 = this.gen.rectangle(t2, e2, s2, n2, a2);
    return this.draw(o2);
  }
  ellipse(t2, e2, s2, n2, a2) {
    const o2 = this.gen.ellipse(t2, e2, s2, n2, a2);
    return this.draw(o2);
  }
  circle(t2, e2, s2, n2) {
    const a2 = this.gen.circle(t2, e2, s2, n2);
    return this.draw(a2);
  }
  linearPath(t2, e2) {
    const s2 = this.gen.linearPath(t2, e2);
    return this.draw(s2);
  }
  polygon(t2, e2) {
    const s2 = this.gen.polygon(t2, e2);
    return this.draw(s2);
  }
  arc(t2, e2, s2, n2, a2, o2, h2 = false, r2) {
    const i = this.gen.arc(t2, e2, s2, n2, a2, o2, h2, r2);
    return this.draw(i);
  }
  curve(t2, e2) {
    const s2 = this.gen.curve(t2, e2);
    return this.draw(s2);
  }
  path(t2, e2) {
    const s2 = this.gen.path(t2, e2);
    return this.draw(s2);
  }
};
var U = { canvas: (t2, e2) => new B(t2, e2), svg: (t2, e2) => new K(t2, e2), generator: (t2) => new N(t2), newSeed: () => N.newSeed() };
var defs = "\n<defs>\n  <style>\n    @font-face {\n      font-family: 'Patrick Hand';\n      font-style: normal;\n      font-weight: 400;\n      font-display: swap;\n      src: local('Patrick Hand'), local('PatrickHand-Regular'), url(data:font/woff2;base64,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) format('woff2');\n      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;\n    }\n  </style>\n</defs>\n";
var Alignment;
(function(Alignment2) {
  Alignment2["LEFT"] = "left";
  Alignment2["MIDDLE"] = "middle";
  Alignment2["RIGHT"] = "right";
})(Alignment || (Alignment = {}));
var Renderer = (
  /** @class */
  (function() {
    function Renderer2(container) {
      this.container = container;
    }
    Renderer2.trianglePath = function(x2, y2, size2) {
      return "M".concat(x2 + size2 / 2, " ").concat(y2, " L").concat(x2 + size2, " ").concat(y2 + size2, " L").concat(x2, " ").concat(y2 + size2);
    };
    Renderer2.ngonPath = function(x2, y2, size2, edges) {
      var i;
      var a2;
      var degrees = 360 / edges;
      var radius = size2 / 2;
      var points = [];
      var curX = x2;
      var curY = y2;
      for (i = 0; i < edges; i += 1) {
        a2 = i * degrees - 90;
        curX = radius + radius * Math.cos(a2 * Math.PI / 180);
        curY = radius + radius * Math.sin(a2 * Math.PI / 180);
        points.push([curX, curY]);
      }
      var lines = points.reduce(function(acc, _a6) {
        var _b = __read(_a6, 2), posX = _b[0], posY = _b[1];
        return "".concat(acc, " L").concat(posX, " ").concat(posY);
      }, "");
      return "M".concat(curX, " ").concat(curY, " ").concat(lines);
    };
    Renderer2.toClassName = function(classes2) {
      if (!classes2) {
        return "";
      }
      return Array.isArray(classes2) ? classes2.join(" ") : classes2;
    };
    return Renderer2;
  })()
);
var FONT_FAMLILY = "Patrick Hand";
var RoughJsRenderer = (
  /** @class */
  (function(_super) {
    __extends(RoughJsRenderer2, _super);
    function RoughJsRenderer2(container) {
      var _this = _super.call(this, container) || this;
      if (container instanceof HTMLElement) {
        _this.containerNode = container;
      } else {
        _this.containerNode = container;
        var node = document.querySelector(container);
        if (!node) {
          throw new Error('No element found with selector "'.concat(container, '"'));
        }
        _this.containerNode = node;
      }
      _this.svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      _this.svgNode.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      _this.svgNode.setAttribute("version", "1.1");
      _this.svgNode.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
      _this.svgNode.setAttribute("xmlns:svgjs", "http://svgjs.com/svgjs");
      _this.svgNode.setAttribute("preserveAspectRatio", "xMidYMid meet");
      _this.svgNode.setAttribute("viewBox", "0 0 400 400");
      _this.embedDefs();
      _this.containerNode.appendChild(_this.svgNode);
      _this.rc = U.svg(_this.svgNode);
      return _this;
    }
    RoughJsRenderer2.prototype.embedDefs = function() {
      var _this = this;
      setTimeout(function() {
        var _a6, _b, _c;
        if (_this.svgNode.querySelector("defs [data-svguitar-def]")) {
          return;
        }
        var currentDefs = _this.svgNode.querySelector("defs");
        if (!currentDefs) {
          currentDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
          _this.svgNode.prepend(currentDefs);
        }
        var template = document.createElement("template");
        template.innerHTML = defs.trim();
        var defsToAdd = (_c = (_b = (_a6 = template.content.firstChild) === null || _a6 === void 0 ? void 0 : _a6.firstChild) === null || _b === void 0 ? void 0 : _b.parentElement) === null || _c === void 0 ? void 0 : _c.children;
        if (defsToAdd) {
          Array.from(defsToAdd).forEach(function(def) {
            def.setAttribute("data-svguitar-def", "true");
            currentDefs === null || currentDefs === void 0 ? void 0 : currentDefs.appendChild(def);
          });
        }
      });
    };
    RoughJsRenderer2.prototype.title = function(title) {
      var titleEl = document.createElement("title");
      titleEl.textContent = title;
      this.svgNode.appendChild(titleEl);
    };
    RoughJsRenderer2.prototype.circle = function(x2, y2, diameter, strokeWidth, strokeColor, fill, classes2) {
      var _a6;
      var options = {
        fill: fill || "none",
        fillWeight: 2.5,
        stroke: strokeColor || fill || "none",
        roughness: 1.5
      };
      if (strokeWidth > 0) {
        options.strokeWidth = strokeWidth;
      }
      var circle = this.rc.circle(x2 + diameter / 2, y2 + diameter / 2, diameter, options);
      (_a6 = circle.classList).add.apply(_a6, __spreadArray([], __read(RoughJsRenderer2.toClassArray(classes2)), false));
      this.svgNode.appendChild(circle);
      return RoughJsRenderer2.boxToElement(circle.getBBox(), function() {
        return circle ? circle.remove() : void 0;
      });
    };
    RoughJsRenderer2.prototype.clear = function() {
      while (this.svgNode.firstChild) {
        this.svgNode.removeChild(this.svgNode.firstChild);
      }
      this.rc = U.svg(this.svgNode);
      this.embedDefs();
    };
    RoughJsRenderer2.prototype.remove = function() {
      this.svgNode.remove();
    };
    RoughJsRenderer2.prototype.line = function(x1, y1, x2, y2, strokeWidth, color, classes2) {
      var _a6;
      if (strokeWidth > 5 && (x1 - x2 === 0 || y1 - y2 === 0)) {
        if (Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
          this.rect(x1, y1, x2 - x1, strokeWidth, 0, color, color);
        } else {
          this.rect(x1 - strokeWidth / 2, y1, strokeWidth, y2 - y1, 0, color, color);
        }
      } else {
        var line = this.rc.line(x1, y1, x2, y2, {
          strokeWidth,
          stroke: color
        });
        (_a6 = line.classList).add.apply(_a6, __spreadArray([], __read(RoughJsRenderer2.toClassArray(classes2)), false));
        this.svgNode.appendChild(line);
      }
    };
    RoughJsRenderer2.prototype.rect = function(x2, y2, width2, height2, strokeWidth, strokeColor, classes2, fill, radius) {
      var _a6, _b;
      var rect2 = this.rc.rectangle(x2, y2, width2, height2, {
        // fill: fill || 'none',
        fill: "none",
        fillWeight: 2,
        strokeWidth,
        stroke: strokeColor,
        roughness: 2.8,
        fillStyle: "cross-hatch",
        hachureAngle: 60,
        hachureGap: 4
      });
      var rectRadius = radius || 0;
      var path = RoughJsRenderer2.roundedRectData(width2, height2, rectRadius, rectRadius, rectRadius, rectRadius);
      var rect = this.rc.path(path, {
        fill: fill || "none",
        fillWeight: 2.5,
        stroke: strokeColor || fill || "none",
        roughness: 1.5
      });
      rect.setAttribute("transform", "translate(".concat(x2, ", ").concat(y2, ")"));
      (_a6 = rect.classList).add.apply(_a6, __spreadArray([], __read(RoughJsRenderer2.toClassArray(classes2)), false));
      (_b = rect2.classList).add.apply(_b, __spreadArray([], __read(RoughJsRenderer2.toClassArray(classes2)), false));
      this.svgNode.appendChild(rect);
      this.svgNode.appendChild(rect2);
      return RoughJsRenderer2.boxToElement(rect.getBBox(), function() {
        return rect.remove();
      });
    };
    RoughJsRenderer2.prototype.triangle = function(x2, y2, size2, strokeWidth, strokeColor, classes2, fill) {
      var _a6;
      var triangle = this.rc.path(Renderer.trianglePath(0, 0, size2), {
        fill: fill || "none",
        fillWeight: 2.5,
        stroke: strokeColor || fill || "none",
        roughness: 1.5
      });
      triangle.setAttribute("transform", "translate(".concat(x2, ", ").concat(y2, ")"));
      (_a6 = triangle.classList).add.apply(_a6, __spreadArray([], __read(RoughJsRenderer2.toClassArray(classes2)), false));
      this.svgNode.appendChild(triangle);
      return RoughJsRenderer2.boxToElement(triangle.getBBox(), function() {
        return triangle.remove();
      });
    };
    RoughJsRenderer2.prototype.pentagon = function(x2, y2, size2, strokeWidth, strokeColor, fill, classes2, spikes) {
      var _a6;
      if (spikes === void 0) {
        spikes = 5;
      }
      var pentagon = this.rc.path(Renderer.ngonPath(0, 0, size2, spikes), {
        fill: fill || "none",
        fillWeight: 2.5,
        stroke: strokeColor || fill || "none",
        roughness: 1.5
      });
      pentagon.setAttribute("transform", "translate(".concat(x2, ", ").concat(y2, ")"));
      (_a6 = pentagon.classList).add.apply(_a6, __spreadArray([], __read(RoughJsRenderer2.toClassArray(classes2)), false));
      this.svgNode.appendChild(pentagon);
      return RoughJsRenderer2.boxToElement(pentagon.getBBox(), function() {
        return pentagon.remove();
      });
    };
    RoughJsRenderer2.prototype.size = function(width2, height2) {
      this.svgNode.setAttribute("viewBox", "0 0 ".concat(Math.ceil(width2), " ").concat(Math.ceil(height2)));
    };
    RoughJsRenderer2.prototype.background = function(color) {
      var bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bg.setAttributeNS(null, "width", "100%");
      bg.setAttributeNS(null, "height", "100%");
      bg.setAttributeNS(null, "fill", color);
      this.svgNode.insertBefore(bg, this.svgNode.firstChild);
    };
    RoughJsRenderer2.prototype.text = function(text, x2, y2, fontSize, color, fontFamily, alignment, classes2, plain2) {
      var _a6;
      var txtElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
      txtElem.setAttributeNS(null, "x", String(x2));
      txtElem.setAttributeNS(null, "y", String(y2));
      txtElem.setAttributeNS(null, "font-size", String(fontSize));
      txtElem.setAttributeNS(null, "font-family", FONT_FAMLILY);
      txtElem.setAttributeNS(null, "align", alignment);
      txtElem.setAttributeNS(null, "fill", color);
      if (plain2) {
        txtElem.setAttributeNS(null, "dominant-baseline", "central");
      }
      txtElem.appendChild(document.createTextNode(text));
      this.svgNode.appendChild(txtElem);
      var bbox2 = txtElem.getBBox();
      var xOffset;
      switch (alignment) {
        case Alignment.MIDDLE:
          xOffset = -(bbox2.width / 2);
          break;
        case Alignment.LEFT:
          xOffset = 0;
          break;
        case Alignment.RIGHT:
          xOffset = -bbox2.width;
          break;
        default:
          throw new Error("Invalid alignment ".concat(alignment));
      }
      (_a6 = txtElem.classList).add.apply(_a6, __spreadArray([], __read(RoughJsRenderer2.toClassArray(classes2)), false));
      txtElem.setAttributeNS(null, "x", String(x2 + xOffset));
      txtElem.setAttributeNS(null, "y", String(y2 + (plain2 ? 0 : bbox2.height / 2)));
      return RoughJsRenderer2.boxToElement(txtElem.getBBox(), txtElem.remove.bind(txtElem));
    };
    RoughJsRenderer2.boxToElement = function(box, remove) {
      return {
        width: box.width,
        height: box.height,
        x: box.x,
        y: box.y,
        remove
      };
    };
    RoughJsRenderer2.roundedRectData = function(w2, h2, tlr, trr, brr, blr) {
      return "M 0 ".concat(tlr, " A ").concat(tlr, " ").concat(tlr, " 0 0 1 ").concat(tlr, " 0") + " L ".concat(w2 - trr, " 0") + " A ".concat(trr, " ").concat(trr, " 0 0 1 ").concat(w2, " ").concat(trr, " L ").concat(w2, " ").concat(h2 - brr, " A ").concat(brr, " ").concat(brr, " 0 0 1 ").concat(w2 - brr, " ").concat(h2, " L ").concat(blr, " ").concat(h2, " A ").concat(blr, " ").concat(blr, " 0 0 1 0 ").concat(h2 - blr, " Z");
    };
    RoughJsRenderer2.toClassArray = function(classes2) {
      if (!classes2) {
        return [];
      }
      return Renderer.toClassName(classes2).split(" ");
    };
    return RoughJsRenderer2;
  })(Renderer)
);
var methods$1 = {};
var names = [];
function registerMethods(name, m2) {
  if (Array.isArray(name)) {
    for (const _name of name) {
      registerMethods(_name, m2);
    }
    return;
  }
  if (typeof name === "object") {
    for (const _name in name) {
      registerMethods(_name, name[_name]);
    }
    return;
  }
  addMethodNames(Object.getOwnPropertyNames(m2));
  methods$1[name] = Object.assign(methods$1[name] || {}, m2);
}
function getMethodsFor(name) {
  return methods$1[name] || {};
}
function getMethodNames() {
  return [...new Set(names)];
}
function addMethodNames(_names) {
  names.push(..._names);
}
function map(array2, block) {
  var i;
  var il = array2.length;
  var result = [];
  for (i = 0; i < il; i++) {
    result.push(block(array2[i]));
  }
  return result;
}
function radians(d2) {
  return d2 % 360 * Math.PI / 180;
}
function camelCase(s2) {
  return s2.toLowerCase().replace(/-(.)/g, function(m2, g2) {
    return g2.toUpperCase();
  });
}
function unCamelCase(s2) {
  return s2.replace(/([A-Z])/g, function(m2, g2) {
    return "-" + g2.toLowerCase();
  });
}
function capitalize(s2) {
  return s2.charAt(0).toUpperCase() + s2.slice(1);
}
function proportionalSize(element, width2, height2, box) {
  if (width2 == null || height2 == null) {
    box = box || element.bbox();
    if (width2 == null) {
      width2 = box.width / box.height * height2;
    } else if (height2 == null) {
      height2 = box.height / box.width * width2;
    }
  }
  return {
    width: width2,
    height: height2
  };
}
function getOrigin(o2, element) {
  const origin = o2.origin;
  let ox, oy;
  if (typeof origin === "string" || origin == null) {
    const string = (origin || "center").toLowerCase().trim();
    const { height: height2, width: width2, x: x2, y: y2 } = element.bbox();
    const bx = string.includes("left") ? x2 : string.includes("right") ? x2 + width2 : x2 + width2 / 2;
    const by = string.includes("top") ? y2 : string.includes("bottom") ? y2 + height2 : y2 + height2 / 2;
    ox = o2.ox != null ? o2.ox : bx;
    oy = o2.oy != null ? o2.oy : by;
  } else {
    ox = origin[0];
    oy = origin[1];
  }
  return [ox, oy];
}
var ns = "http://www.w3.org/2000/svg";
var xmlns = "http://www.w3.org/2000/xmlns/";
var xlink = "http://www.w3.org/1999/xlink";
var svgjs = "http://svgjs.com/svgjs";
var globals = {
  window: typeof window === "undefined" ? null : window,
  document: typeof document === "undefined" ? null : document
};
var Base = class {
  // constructor (node/*, {extensions = []} */) {
  //   // this.tags = []
  //   //
  //   // for (let extension of extensions) {
  //   //   extension.setup.call(this, node)
  //   //   this.tags.push(extension.name)
  //   // }
  // }
};
var elements = {};
var root = "___SYMBOL___ROOT___";
function create(name) {
  return globals.document.createElementNS(ns, name);
}
function makeInstance(element) {
  if (element instanceof Base) return element;
  if (typeof element === "object") {
    return adopter(element);
  }
  if (element == null) {
    return new elements[root]();
  }
  if (typeof element === "string" && element.charAt(0) !== "<") {
    return adopter(globals.document.querySelector(element));
  }
  var node = create("svg");
  node.innerHTML = element;
  element = adopter(node.firstChild);
  return element;
}
function nodeOrNew(name, node) {
  return node instanceof globals.window.Node ? node : create(name);
}
function adopt(node) {
  if (!node) return null;
  if (node.instance instanceof Base) return node.instance;
  var className = capitalize(node.nodeName || "Dom");
  if (className === "LinearGradient" || className === "RadialGradient") {
    className = "Gradient";
  } else if (!elements[className]) {
    className = "Dom";
  }
  return new elements[className](node);
}
var adopter = adopt;
function register(element, name = element.name, asRoot = false) {
  elements[name] = element;
  if (asRoot) elements[root] = element;
  addMethodNames(Object.getOwnPropertyNames(element.prototype));
  return element;
}
function getClass(name) {
  return elements[name];
}
var did = 1e3;
function eid(name) {
  return "Svgjs" + capitalize(name) + did++;
}
function assignNewId(node) {
  for (var i = node.children.length - 1; i >= 0; i--) {
    assignNewId(node.children[i]);
  }
  if (node.id) {
    return adopt(node).id(eid(node.nodeName));
  }
  return adopt(node);
}
function extend(modules, methods2, attrCheck) {
  var key, i;
  modules = Array.isArray(modules) ? modules : [modules];
  for (i = modules.length - 1; i >= 0; i--) {
    for (key in methods2) {
      let method = methods2[key];
      if (attrCheck) {
        method = wrapWithAttrCheck(methods2[key]);
      }
      modules[i].prototype[key] = method;
    }
  }
}
function wrapWithAttrCheck(fn) {
  return function(...args) {
    const o2 = args[args.length - 1];
    if (o2 && o2.constructor === Object && !(o2 instanceof Array)) {
      return fn.apply(this, args.slice(0, -1)).attr(o2);
    } else {
      return fn.apply(this, args);
    }
  };
}
function siblings() {
  return this.parent().children();
}
function position() {
  return this.parent().index(this);
}
function next() {
  return this.siblings()[this.position() + 1];
}
function prev() {
  return this.siblings()[this.position() - 1];
}
function forward() {
  var i = this.position() + 1;
  var p2 = this.parent();
  p2.removeElement(this).add(this, i);
  if (typeof p2.isRoot === "function" && p2.isRoot()) {
    p2.node.appendChild(p2.defs().node);
  }
  return this;
}
function backward() {
  var i = this.position();
  if (i > 0) {
    this.parent().removeElement(this).add(this, i - 1);
  }
  return this;
}
function front() {
  var p2 = this.parent();
  p2.node.appendChild(this.node);
  if (typeof p2.isRoot === "function" && p2.isRoot()) {
    p2.node.appendChild(p2.defs().node);
  }
  return this;
}
function back() {
  if (this.position() > 0) {
    this.parent().removeElement(this).add(this, 0);
  }
  return this;
}
function before(element) {
  element = makeInstance(element);
  element.remove();
  var i = this.position();
  this.parent().add(element, i);
  return this;
}
function after(element) {
  element = makeInstance(element);
  element.remove();
  var i = this.position();
  this.parent().add(element, i + 1);
  return this;
}
function insertBefore(element) {
  element = makeInstance(element);
  element.before(this);
  return this;
}
function insertAfter(element) {
  element = makeInstance(element);
  element.after(this);
  return this;
}
registerMethods("Dom", {
  siblings,
  position,
  next,
  prev,
  forward,
  backward,
  front,
  back,
  before,
  after,
  insertBefore,
  insertAfter
});
var numberAndUnit = /^([+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?)([a-z%]*)$/i;
var hex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
var rgb = /rgb\((\d+),(\d+),(\d+)\)/;
var reference = /(#[a-z0-9\-_]+)/i;
var transforms = /\)\s*,?\s*/;
var whitespace = /\s/g;
var isHex = /^#[a-f0-9]{3,6}$/i;
var isRgb = /^rgb\(/;
var isBlank = /^(\s+)?$/;
var isNumber = /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
var isImage = /\.(jpg|jpeg|png|gif|svg)(\?[^=]+.*)?/i;
var delimiter = /[\s,]+/;
var hyphen = /([^e])-/gi;
var pathLetters = /[MLHVCSQTAZ]/gi;
var isPathLetter = /[MLHVCSQTAZ]/i;
var numbersWithDots = /((\d?\.\d+(?:e[+-]?\d+)?)((?:\.\d+(?:e[+-]?\d+)?)+))+/gi;
var dots = /\./g;
function classes() {
  var attr2 = this.attr("class");
  return attr2 == null ? [] : attr2.trim().split(delimiter);
}
function hasClass(name) {
  return this.classes().indexOf(name) !== -1;
}
function addClass(name) {
  if (!this.hasClass(name)) {
    var array2 = this.classes();
    array2.push(name);
    this.attr("class", array2.join(" "));
  }
  return this;
}
function removeClass(name) {
  if (this.hasClass(name)) {
    this.attr("class", this.classes().filter(function(c2) {
      return c2 !== name;
    }).join(" "));
  }
  return this;
}
function toggleClass(name) {
  return this.hasClass(name) ? this.removeClass(name) : this.addClass(name);
}
registerMethods("Dom", {
  classes,
  hasClass,
  addClass,
  removeClass,
  toggleClass
});
function css(style, val) {
  const ret = {};
  if (arguments.length === 0) {
    this.node.style.cssText.split(/\s*;\s*/).filter(function(el) {
      return !!el.length;
    }).forEach(function(el) {
      const t2 = el.split(/\s*:\s*/);
      ret[t2[0]] = t2[1];
    });
    return ret;
  }
  if (arguments.length < 2) {
    if (Array.isArray(style)) {
      for (const name of style) {
        const cased = camelCase(name);
        ret[cased] = this.node.style[cased];
      }
      return ret;
    }
    if (typeof style === "string") {
      return this.node.style[camelCase(style)];
    }
    if (typeof style === "object") {
      for (const name in style) {
        this.node.style[camelCase(name)] = style[name] == null || isBlank.test(style[name]) ? "" : style[name];
      }
    }
  }
  if (arguments.length === 2) {
    this.node.style[camelCase(style)] = val == null || isBlank.test(val) ? "" : val;
  }
  return this;
}
function show() {
  return this.css("display", "");
}
function hide() {
  return this.css("display", "none");
}
function visible() {
  return this.css("display") !== "none";
}
registerMethods("Dom", {
  css,
  show,
  hide,
  visible
});
function data(a2, v2, r2) {
  if (typeof a2 === "object") {
    for (v2 in a2) {
      this.data(v2, a2[v2]);
    }
  } else if (arguments.length < 2) {
    try {
      return JSON.parse(this.attr("data-" + a2));
    } catch (e2) {
      return this.attr("data-" + a2);
    }
  } else {
    this.attr(
      "data-" + a2,
      v2 === null ? null : r2 === true || typeof v2 === "string" || typeof v2 === "number" ? v2 : JSON.stringify(v2)
    );
  }
  return this;
}
registerMethods("Dom", { data });
function remember(k2, v2) {
  if (typeof arguments[0] === "object") {
    for (var key in k2) {
      this.remember(key, k2[key]);
    }
  } else if (arguments.length === 1) {
    return this.memory()[k2];
  } else {
    this.memory()[k2] = v2;
  }
  return this;
}
function forget() {
  if (arguments.length === 0) {
    this._memory = {};
  } else {
    for (var i = arguments.length - 1; i >= 0; i--) {
      delete this.memory()[arguments[i]];
    }
  }
  return this;
}
function memory() {
  return this._memory = this._memory || {};
}
registerMethods("Dom", { remember, forget, memory });
var listenerId = 0;
var windowEvents = {};
function getEvents(instance) {
  let n2 = instance.getEventHolder();
  if (n2 === globals.window) n2 = windowEvents;
  if (!n2.events) n2.events = {};
  return n2.events;
}
function getEventTarget(instance) {
  return instance.getEventTarget();
}
function clearEvents(instance) {
  const n2 = instance.getEventHolder();
  if (n2.events) n2.events = {};
}
function on(node, events, listener, binding, options) {
  var l2 = listener.bind(binding || node);
  var instance = makeInstance(node);
  var bag = getEvents(instance);
  var n2 = getEventTarget(instance);
  events = Array.isArray(events) ? events : events.split(delimiter);
  if (!listener._svgjsListenerId) {
    listener._svgjsListenerId = ++listenerId;
  }
  events.forEach(function(event) {
    var ev = event.split(".")[0];
    var ns2 = event.split(".")[1] || "*";
    bag[ev] = bag[ev] || {};
    bag[ev][ns2] = bag[ev][ns2] || {};
    bag[ev][ns2][listener._svgjsListenerId] = l2;
    n2.addEventListener(ev, l2, options || false);
  });
}
function off(node, events, listener, options) {
  var instance = makeInstance(node);
  var bag = getEvents(instance);
  var n2 = getEventTarget(instance);
  if (typeof listener === "function") {
    listener = listener._svgjsListenerId;
    if (!listener) return;
  }
  events = Array.isArray(events) ? events : (events || "").split(delimiter);
  events.forEach(function(event) {
    var ev = event && event.split(".")[0];
    var ns2 = event && event.split(".")[1];
    var namespace, l2;
    if (listener) {
      if (bag[ev] && bag[ev][ns2 || "*"]) {
        n2.removeEventListener(ev, bag[ev][ns2 || "*"][listener], options || false);
        delete bag[ev][ns2 || "*"][listener];
      }
    } else if (ev && ns2) {
      if (bag[ev] && bag[ev][ns2]) {
        for (l2 in bag[ev][ns2]) {
          off(n2, [ev, ns2].join("."), l2);
        }
        delete bag[ev][ns2];
      }
    } else if (ns2) {
      for (event in bag) {
        for (namespace in bag[event]) {
          if (ns2 === namespace) {
            off(n2, [event, ns2].join("."));
          }
        }
      }
    } else if (ev) {
      if (bag[ev]) {
        for (namespace in bag[ev]) {
          off(n2, [ev, namespace].join("."));
        }
        delete bag[ev];
      }
    } else {
      for (event in bag) {
        off(n2, event);
      }
      clearEvents(instance);
    }
  });
}
function dispatch(node, event, data2) {
  var n2 = getEventTarget(node);
  if (event instanceof globals.window.Event) {
    n2.dispatchEvent(event);
  } else {
    event = new globals.window.CustomEvent(event, { detail: data2, cancelable: true });
    n2.dispatchEvent(event);
  }
  return event;
}
function sixDigitHex(hex2) {
  return hex2.length === 4 ? [
    "#",
    hex2.substring(1, 2),
    hex2.substring(1, 2),
    hex2.substring(2, 3),
    hex2.substring(2, 3),
    hex2.substring(3, 4),
    hex2.substring(3, 4)
  ].join("") : hex2;
}
function componentHex(component) {
  const integer = Math.round(component);
  const bounded = Math.max(0, Math.min(255, integer));
  const hex2 = bounded.toString(16);
  return hex2.length === 1 ? "0" + hex2 : hex2;
}
function is(object, space) {
  for (let i = space.length; i--; ) {
    if (object[space[i]] == null) {
      return false;
    }
  }
  return true;
}
function getParameters(a2, b2) {
  const params = is(a2, "rgb") ? { _a: a2.r, _b: a2.g, _c: a2.b, space: "rgb" } : is(a2, "xyz") ? { _a: a2.x, _b: a2.y, _c: a2.z, _d: 0, space: "xyz" } : is(a2, "hsl") ? { _a: a2.h, _b: a2.s, _c: a2.l, _d: 0, space: "hsl" } : is(a2, "lab") ? { _a: a2.l, _b: a2.a, _c: a2.b, _d: 0, space: "lab" } : is(a2, "lch") ? { _a: a2.l, _b: a2.c, _c: a2.h, _d: 0, space: "lch" } : is(a2, "cmyk") ? { _a: a2.c, _b: a2.m, _c: a2.y, _d: a2.k, space: "cmyk" } : { _a: 0, _b: 0, _c: 0, space: "rgb" };
  params.space = b2 || params.space;
  return params;
}
function cieSpace(space) {
  if (space === "lab" || space === "xyz" || space === "lch") {
    return true;
  } else {
    return false;
  }
}
function hueToRgb(p2, q2, t2) {
  if (t2 < 0) t2 += 1;
  if (t2 > 1) t2 -= 1;
  if (t2 < 1 / 6) return p2 + (q2 - p2) * 6 * t2;
  if (t2 < 1 / 2) return q2;
  if (t2 < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - t2) * 6;
  return p2;
}
var Color = class _Color {
  constructor(...inputs) {
    this.init(...inputs);
  }
  init(a2 = 0, b2 = 0, c2 = 0, d2 = 0, space = "rgb") {
    a2 = !a2 ? 0 : a2;
    if (this.space) {
      for (const component in this.space) {
        delete this[this.space[component]];
      }
    }
    if (typeof a2 === "number") {
      space = typeof d2 === "string" ? d2 : space;
      d2 = typeof d2 === "string" ? 0 : d2;
      Object.assign(this, { _a: a2, _b: b2, _c: c2, _d: d2, space });
    } else if (a2 instanceof Array) {
      this.space = b2 || (typeof a2[3] === "string" ? a2[3] : a2[4]) || "rgb";
      Object.assign(this, { _a: a2[0], _b: a2[1], _c: a2[2], _d: a2[3] || 0 });
    } else if (a2 instanceof Object) {
      const values = getParameters(a2, b2);
      Object.assign(this, values);
    } else if (typeof a2 === "string") {
      if (isRgb.test(a2)) {
        const noWhitespace = a2.replace(whitespace, "");
        const [_a7, _b2, _c2] = rgb.exec(noWhitespace).slice(1, 4).map((v2) => parseInt(v2));
        Object.assign(this, { _a: _a7, _b: _b2, _c: _c2, _d: 0, space: "rgb" });
      } else if (isHex.test(a2)) {
        const hexParse = (v2) => parseInt(v2, 16);
        const [, _a7, _b2, _c2] = hex.exec(sixDigitHex(a2)).map(hexParse);
        Object.assign(this, { _a: _a7, _b: _b2, _c: _c2, _d: 0, space: "rgb" });
      } else throw Error("Unsupported string format, can't construct Color");
    }
    const { _a: _a6, _b, _c, _d } = this;
    const components = this.space === "rgb" ? { r: _a6, g: _b, b: _c } : this.space === "xyz" ? { x: _a6, y: _b, z: _c } : this.space === "hsl" ? { h: _a6, s: _b, l: _c } : this.space === "lab" ? { l: _a6, a: _b, b: _c } : this.space === "lch" ? { l: _a6, c: _b, h: _c } : this.space === "cmyk" ? { c: _a6, m: _b, y: _c, k: _d } : {};
    Object.assign(this, components);
  }
  /*
  Conversion Methods
  */
  rgb() {
    if (this.space === "rgb") {
      return this;
    } else if (cieSpace(this.space)) {
      let { x: x2, y: y2, z: z2 } = this;
      if (this.space === "lab" || this.space === "lch") {
        let { l: l2, a: a2, b: b3 } = this;
        if (this.space === "lch") {
          const { c: c2, h: h2 } = this;
          const dToR = Math.PI / 180;
          a2 = c2 * Math.cos(dToR * h2);
          b3 = c2 * Math.sin(dToR * h2);
        }
        const yL = (l2 + 16) / 116;
        const xL = a2 / 500 + yL;
        const zL = yL - b3 / 200;
        const ct = 16 / 116;
        const mx = 8856e-6;
        const nm = 7.787;
        x2 = 0.95047 * (xL ** 3 > mx ? xL ** 3 : (xL - ct) / nm);
        y2 = 1 * (yL ** 3 > mx ? yL ** 3 : (yL - ct) / nm);
        z2 = 1.08883 * (zL ** 3 > mx ? zL ** 3 : (zL - ct) / nm);
      }
      const rU = x2 * 3.2406 + y2 * -1.5372 + z2 * -0.4986;
      const gU = x2 * -0.9689 + y2 * 1.8758 + z2 * 0.0415;
      const bU = x2 * 0.0557 + y2 * -0.204 + z2 * 1.057;
      const pow = Math.pow;
      const bd = 31308e-7;
      const r2 = rU > bd ? 1.055 * pow(rU, 1 / 2.4) - 0.055 : 12.92 * rU;
      const g2 = gU > bd ? 1.055 * pow(gU, 1 / 2.4) - 0.055 : 12.92 * gU;
      const b2 = bU > bd ? 1.055 * pow(bU, 1 / 2.4) - 0.055 : 12.92 * bU;
      const color = new _Color(255 * r2, 255 * g2, 255 * b2);
      return color;
    } else if (this.space === "hsl") {
      let { h: h2, s: s2, l: l2 } = this;
      h2 /= 360;
      s2 /= 100;
      l2 /= 100;
      if (s2 === 0) {
        l2 *= 255;
        const color2 = new _Color(l2, l2, l2);
        return color2;
      }
      const q2 = l2 < 0.5 ? l2 * (1 + s2) : l2 + s2 - l2 * s2;
      const p2 = 2 * l2 - q2;
      const r2 = 255 * hueToRgb(p2, q2, h2 + 1 / 3);
      const g2 = 255 * hueToRgb(p2, q2, h2);
      const b2 = 255 * hueToRgb(p2, q2, h2 - 1 / 3);
      const color = new _Color(r2, g2, b2);
      return color;
    } else if (this.space === "cmyk") {
      const { c: c2, m: m2, y: y2, k: k2 } = this;
      const r2 = 255 * (1 - Math.min(1, c2 * (1 - k2) + k2));
      const g2 = 255 * (1 - Math.min(1, m2 * (1 - k2) + k2));
      const b2 = 255 * (1 - Math.min(1, y2 * (1 - k2) + k2));
      const color = new _Color(r2, g2, b2);
      return color;
    } else {
      return this;
    }
  }
  lab() {
    const { x: x2, y: y2, z: z2 } = this.xyz();
    const l2 = 116 * y2 - 16;
    const a2 = 500 * (x2 - y2);
    const b2 = 200 * (y2 - z2);
    const color = new _Color(l2, a2, b2, "lab");
    return color;
  }
  xyz() {
    const { _a: r255, _b: g255, _c: b255 } = this.rgb();
    const [r2, g2, b2] = [r255, g255, b255].map((v2) => v2 / 255);
    const rL = r2 > 0.04045 ? Math.pow((r2 + 0.055) / 1.055, 2.4) : r2 / 12.92;
    const gL = g2 > 0.04045 ? Math.pow((g2 + 0.055) / 1.055, 2.4) : g2 / 12.92;
    const bL = b2 > 0.04045 ? Math.pow((b2 + 0.055) / 1.055, 2.4) : b2 / 12.92;
    const xU = (rL * 0.4124 + gL * 0.3576 + bL * 0.1805) / 0.95047;
    const yU = (rL * 0.2126 + gL * 0.7152 + bL * 0.0722) / 1;
    const zU = (rL * 0.0193 + gL * 0.1192 + bL * 0.9505) / 1.08883;
    const x2 = xU > 8856e-6 ? Math.pow(xU, 1 / 3) : 7.787 * xU + 16 / 116;
    const y2 = yU > 8856e-6 ? Math.pow(yU, 1 / 3) : 7.787 * yU + 16 / 116;
    const z2 = zU > 8856e-6 ? Math.pow(zU, 1 / 3) : 7.787 * zU + 16 / 116;
    const color = new _Color(x2, y2, z2, "xyz");
    return color;
  }
  lch() {
    const { l: l2, a: a2, b: b2 } = this.lab();
    const c2 = Math.sqrt(a2 ** 2 + b2 ** 2);
    let h2 = 180 * Math.atan2(b2, a2) / Math.PI;
    if (h2 < 0) {
      h2 *= -1;
      h2 = 360 - h2;
    }
    const color = new _Color(l2, c2, h2, "lch");
    return color;
  }
  hsl() {
    const { _a: _a6, _b, _c } = this.rgb();
    const [r2, g2, b2] = [_a6, _b, _c].map((v2) => v2 / 255);
    const max = Math.max(r2, g2, b2);
    const min = Math.min(r2, g2, b2);
    const l2 = (max + min) / 2;
    const isGrey = max === min;
    const delta = max - min;
    const s2 = isGrey ? 0 : l2 > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    const h2 = isGrey ? 0 : max === r2 ? ((g2 - b2) / delta + (g2 < b2 ? 6 : 0)) / 6 : max === g2 ? ((b2 - r2) / delta + 2) / 6 : max === b2 ? ((r2 - g2) / delta + 4) / 6 : 0;
    const color = new _Color(360 * h2, 100 * s2, 100 * l2, "hsl");
    return color;
  }
  cmyk() {
    const { _a: _a6, _b, _c } = this.rgb();
    const [r2, g2, b2] = [_a6, _b, _c].map((v2) => v2 / 255);
    const k2 = Math.min(1 - r2, 1 - g2, 1 - b2);
    if (k2 === 1) {
      return new _Color(0, 0, 0, 1, "cmyk");
    }
    const c2 = (1 - r2 - k2) / (1 - k2);
    const m2 = (1 - g2 - k2) / (1 - k2);
    const y2 = (1 - b2 - k2) / (1 - k2);
    const color = new _Color(c2, m2, y2, k2, "cmyk");
    return color;
  }
  /*
  Input and Output methods
  */
  _clamped() {
    const { _a: _a6, _b, _c } = this.rgb();
    const { max, min, round } = Math;
    const format = (v2) => max(0, min(round(v2), 255));
    return [_a6, _b, _c].map(format);
  }
  toHex() {
    const [r2, g2, b2] = this._clamped().map(componentHex);
    return `#${r2}${g2}${b2}`;
  }
  toString() {
    return this.toHex();
  }
  toRgb() {
    const [rV, gV, bV] = this._clamped();
    const string = `rgb(${rV},${gV},${bV})`;
    return string;
  }
  toArray() {
    const { _a: _a6, _b, _c, _d, space } = this;
    return [_a6, _b, _c, _d, space];
  }
  /*
  Generating random colors
  */
  static random(mode = "vibrant", t2, u2) {
    const { random, round, sin, PI: pi } = Math;
    if (mode === "vibrant") {
      const l2 = (81 - 57) * random() + 57;
      const c2 = (83 - 45) * random() + 45;
      const h2 = 360 * random();
      const color = new _Color(l2, c2, h2, "lch");
      return color;
    } else if (mode === "sine") {
      t2 = t2 == null ? random() : t2;
      const r2 = round(80 * sin(2 * pi * t2 / 0.5 + 0.01) + 150);
      const g2 = round(50 * sin(2 * pi * t2 / 0.5 + 4.6) + 200);
      const b2 = round(100 * sin(2 * pi * t2 / 0.5 + 2.3) + 150);
      const color = new _Color(r2, g2, b2);
      return color;
    } else if (mode === "pastel") {
      const l2 = (94 - 86) * random() + 86;
      const c2 = (26 - 9) * random() + 9;
      const h2 = 360 * random();
      const color = new _Color(l2, c2, h2, "lch");
      return color;
    } else if (mode === "dark") {
      const l2 = 10 + 10 * random();
      const c2 = (125 - 75) * random() + 86;
      const h2 = 360 * random();
      const color = new _Color(l2, c2, h2, "lch");
      return color;
    } else if (mode === "rgb") {
      const r2 = 255 * random();
      const g2 = 255 * random();
      const b2 = 255 * random();
      const color = new _Color(r2, g2, b2);
      return color;
    } else if (mode === "lab") {
      const l2 = 100 * random();
      const a2 = 256 * random() - 128;
      const b2 = 256 * random() - 128;
      const color = new _Color(l2, a2, b2, "lab");
      return color;
    } else if (mode === "grey") {
      const grey = 255 * random();
      const color = new _Color(grey, grey, grey);
      return color;
    }
  }
  /*
  Constructing colors
  */
  // Test if given value is a color string
  static test(color) {
    return typeof color === "string" && (isHex.test(color) || isRgb.test(color));
  }
  // Test if given value is an rgb object
  static isRgb(color) {
    return color && typeof color.r === "number" && typeof color.g === "number" && typeof color.b === "number";
  }
  // Test if given value is a color
  static isColor(color) {
    return color && (color instanceof _Color || this.isRgb(color) || this.test(color));
  }
};
var Point = class _Point {
  // Initialize
  constructor(...args) {
    this.init(...args);
  }
  init(x2, y2) {
    const base = { x: 0, y: 0 };
    const source = Array.isArray(x2) ? { x: x2[0], y: x2[1] } : typeof x2 === "object" ? { x: x2.x, y: x2.y } : { x: x2, y: y2 };
    this.x = source.x == null ? base.x : source.x;
    this.y = source.y == null ? base.y : source.y;
    return this;
  }
  // Clone point
  clone() {
    return new _Point(this);
  }
  transform(m2) {
    return this.clone().transformO(m2);
  }
  // Transform point with matrix
  transformO(m2) {
    if (!Matrix.isMatrixLike(m2)) {
      m2 = new Matrix(m2);
    }
    const { x: x2, y: y2 } = this;
    this.x = m2.a * x2 + m2.c * y2 + m2.e;
    this.y = m2.b * x2 + m2.d * y2 + m2.f;
    return this;
  }
  toArray() {
    return [this.x, this.y];
  }
};
function point(x2, y2) {
  return new Point(x2, y2).transform(this.screenCTM().inverse());
}
function closeEnough(a2, b2, threshold) {
  return Math.abs(b2 - a2) < (threshold || 1e-6);
}
var Matrix = class _Matrix {
  constructor(...args) {
    this.init(...args);
  }
  // Initialize
  init(source) {
    var base = _Matrix.fromArray([1, 0, 0, 1, 0, 0]);
    source = source instanceof Element ? source.matrixify() : typeof source === "string" ? _Matrix.fromArray(source.split(delimiter).map(parseFloat)) : Array.isArray(source) ? _Matrix.fromArray(source) : typeof source === "object" && _Matrix.isMatrixLike(source) ? source : typeof source === "object" ? new _Matrix().transform(source) : arguments.length === 6 ? _Matrix.fromArray([].slice.call(arguments)) : base;
    this.a = source.a != null ? source.a : base.a;
    this.b = source.b != null ? source.b : base.b;
    this.c = source.c != null ? source.c : base.c;
    this.d = source.d != null ? source.d : base.d;
    this.e = source.e != null ? source.e : base.e;
    this.f = source.f != null ? source.f : base.f;
    return this;
  }
  // Clones this matrix
  clone() {
    return new _Matrix(this);
  }
  // Transform a matrix into another matrix by manipulating the space
  transform(o2) {
    if (_Matrix.isMatrixLike(o2)) {
      var matrix = new _Matrix(o2);
      return matrix.multiplyO(this);
    }
    var t2 = _Matrix.formatTransforms(o2);
    var current = this;
    const { x: ox, y: oy } = new Point(t2.ox, t2.oy).transform(current);
    var transformer = new _Matrix().translateO(t2.rx, t2.ry).lmultiplyO(current).translateO(-ox, -oy).scaleO(t2.scaleX, t2.scaleY).skewO(t2.skewX, t2.skewY).shearO(t2.shear).rotateO(t2.theta).translateO(ox, oy);
    if (isFinite(t2.px) || isFinite(t2.py)) {
      const origin = new Point(ox, oy).transform(transformer);
      const dx = t2.px ? t2.px - origin.x : 0;
      const dy = t2.py ? t2.py - origin.y : 0;
      transformer.translateO(dx, dy);
    }
    transformer.translateO(t2.tx, t2.ty);
    return transformer;
  }
  // Applies a matrix defined by its affine parameters
  compose(o2) {
    if (o2.origin) {
      o2.originX = o2.origin[0];
      o2.originY = o2.origin[1];
    }
    var ox = o2.originX || 0;
    var oy = o2.originY || 0;
    var sx = o2.scaleX || 1;
    var sy = o2.scaleY || 1;
    var lam = o2.shear || 0;
    var theta = o2.rotate || 0;
    var tx = o2.translateX || 0;
    var ty = o2.translateY || 0;
    var result = new _Matrix().translateO(-ox, -oy).scaleO(sx, sy).shearO(lam).rotateO(theta).translateO(tx, ty).lmultiplyO(this).translateO(ox, oy);
    return result;
  }
  // Decomposes this matrix into its affine parameters
  decompose(cx2 = 0, cy2 = 0) {
    var a2 = this.a;
    var b2 = this.b;
    var c2 = this.c;
    var d2 = this.d;
    var e2 = this.e;
    var f2 = this.f;
    var determinant = a2 * d2 - b2 * c2;
    var ccw = determinant > 0 ? 1 : -1;
    var sx = ccw * Math.sqrt(a2 * a2 + b2 * b2);
    var thetaRad = Math.atan2(ccw * b2, ccw * a2);
    var theta = 180 / Math.PI * thetaRad;
    var ct = Math.cos(thetaRad);
    var st = Math.sin(thetaRad);
    var lam = (a2 * c2 + b2 * d2) / determinant;
    var sy = c2 * sx / (lam * a2 - b2) || d2 * sx / (lam * b2 + a2);
    const tx = e2 - cx2 + cx2 * ct * sx + cy2 * (lam * ct * sx - st * sy);
    const ty = f2 - cy2 + cx2 * st * sx + cy2 * (lam * st * sx + ct * sy);
    return {
      // Return the affine parameters
      scaleX: sx,
      scaleY: sy,
      shear: lam,
      rotate: theta,
      translateX: tx,
      translateY: ty,
      originX: cx2,
      originY: cy2,
      // Return the matrix parameters
      a: this.a,
      b: this.b,
      c: this.c,
      d: this.d,
      e: this.e,
      f: this.f
    };
  }
  // Left multiplies by the given matrix
  multiply(matrix) {
    return this.clone().multiplyO(matrix);
  }
  multiplyO(matrix) {
    var l2 = this;
    var r2 = matrix instanceof _Matrix ? matrix : new _Matrix(matrix);
    return _Matrix.matrixMultiply(l2, r2, this);
  }
  lmultiply(matrix) {
    return this.clone().lmultiplyO(matrix);
  }
  lmultiplyO(matrix) {
    var r2 = this;
    var l2 = matrix instanceof _Matrix ? matrix : new _Matrix(matrix);
    return _Matrix.matrixMultiply(l2, r2, this);
  }
  // Inverses matrix
  inverseO() {
    var a2 = this.a;
    var b2 = this.b;
    var c2 = this.c;
    var d2 = this.d;
    var e2 = this.e;
    var f2 = this.f;
    var det = a2 * d2 - b2 * c2;
    if (!det) throw new Error("Cannot invert " + this);
    var na = d2 / det;
    var nb = -b2 / det;
    var nc = -c2 / det;
    var nd = a2 / det;
    var ne = -(na * e2 + nc * f2);
    var nf = -(nb * e2 + nd * f2);
    this.a = na;
    this.b = nb;
    this.c = nc;
    this.d = nd;
    this.e = ne;
    this.f = nf;
    return this;
  }
  inverse() {
    return this.clone().inverseO();
  }
  // Translate matrix
  translate(x2, y2) {
    return this.clone().translateO(x2, y2);
  }
  translateO(x2, y2) {
    this.e += x2 || 0;
    this.f += y2 || 0;
    return this;
  }
  // Scale matrix
  scale(x2, y2, cx2, cy2) {
    return this.clone().scaleO(...arguments);
  }
  scaleO(x2, y2 = x2, cx2 = 0, cy2 = 0) {
    if (arguments.length === 3) {
      cy2 = cx2;
      cx2 = y2;
      y2 = x2;
    }
    const { a: a2, b: b2, c: c2, d: d2, e: e2, f: f2 } = this;
    this.a = a2 * x2;
    this.b = b2 * y2;
    this.c = c2 * x2;
    this.d = d2 * y2;
    this.e = e2 * x2 - cx2 * x2 + cx2;
    this.f = f2 * y2 - cy2 * y2 + cy2;
    return this;
  }
  // Rotate matrix
  rotate(r2, cx2, cy2) {
    return this.clone().rotateO(r2, cx2, cy2);
  }
  rotateO(r2, cx2 = 0, cy2 = 0) {
    r2 = radians(r2);
    const cos = Math.cos(r2);
    const sin = Math.sin(r2);
    const { a: a2, b: b2, c: c2, d: d2, e: e2, f: f2 } = this;
    this.a = a2 * cos - b2 * sin;
    this.b = b2 * cos + a2 * sin;
    this.c = c2 * cos - d2 * sin;
    this.d = d2 * cos + c2 * sin;
    this.e = e2 * cos - f2 * sin + cy2 * sin - cx2 * cos + cx2;
    this.f = f2 * cos + e2 * sin - cx2 * sin - cy2 * cos + cy2;
    return this;
  }
  // Flip matrix on x or y, at a given offset
  flip(axis, around) {
    return this.clone().flipO(axis, around);
  }
  flipO(axis, around) {
    return axis === "x" ? this.scaleO(-1, 1, around, 0) : axis === "y" ? this.scaleO(1, -1, 0, around) : this.scaleO(-1, -1, axis, around || axis);
  }
  // Shear matrix
  shear(a2, cx2, cy2) {
    return this.clone().shearO(a2, cx2, cy2);
  }
  shearO(lx, cx2 = 0, cy2 = 0) {
    const { a: a2, b: b2, c: c2, d: d2, e: e2, f: f2 } = this;
    this.a = a2 + b2 * lx;
    this.c = c2 + d2 * lx;
    this.e = e2 + f2 * lx - cy2 * lx;
    return this;
  }
  // Skew Matrix
  skew(x2, y2, cx2, cy2) {
    return this.clone().skewO(...arguments);
  }
  skewO(x2, y2 = x2, cx2 = 0, cy2 = 0) {
    if (arguments.length === 3) {
      cy2 = cx2;
      cx2 = y2;
      y2 = x2;
    }
    x2 = radians(x2);
    y2 = radians(y2);
    const lx = Math.tan(x2);
    const ly = Math.tan(y2);
    const { a: a2, b: b2, c: c2, d: d2, e: e2, f: f2 } = this;
    this.a = a2 + b2 * lx;
    this.b = b2 + a2 * ly;
    this.c = c2 + d2 * lx;
    this.d = d2 + c2 * ly;
    this.e = e2 + f2 * lx - cy2 * lx;
    this.f = f2 + e2 * ly - cx2 * ly;
    return this;
  }
  // SkewX
  skewX(x2, cx2, cy2) {
    return this.skew(x2, 0, cx2, cy2);
  }
  skewXO(x2, cx2, cy2) {
    return this.skewO(x2, 0, cx2, cy2);
  }
  // SkewY
  skewY(y2, cx2, cy2) {
    return this.skew(0, y2, cx2, cy2);
  }
  skewYO(y2, cx2, cy2) {
    return this.skewO(0, y2, cx2, cy2);
  }
  // Transform around a center point
  aroundO(cx2, cy2, matrix) {
    var dx = cx2 || 0;
    var dy = cy2 || 0;
    return this.translateO(-dx, -dy).lmultiplyO(matrix).translateO(dx, dy);
  }
  around(cx2, cy2, matrix) {
    return this.clone().aroundO(cx2, cy2, matrix);
  }
  // Check if two matrices are equal
  equals(other) {
    var comp = new _Matrix(other);
    return closeEnough(this.a, comp.a) && closeEnough(this.b, comp.b) && closeEnough(this.c, comp.c) && closeEnough(this.d, comp.d) && closeEnough(this.e, comp.e) && closeEnough(this.f, comp.f);
  }
  // Convert matrix to string
  toString() {
    return "matrix(" + this.a + "," + this.b + "," + this.c + "," + this.d + "," + this.e + "," + this.f + ")";
  }
  toArray() {
    return [this.a, this.b, this.c, this.d, this.e, this.f];
  }
  valueOf() {
    return {
      a: this.a,
      b: this.b,
      c: this.c,
      d: this.d,
      e: this.e,
      f: this.f
    };
  }
  static fromArray(a2) {
    return { a: a2[0], b: a2[1], c: a2[2], d: a2[3], e: a2[4], f: a2[5] };
  }
  static isMatrixLike(o2) {
    return o2.a != null || o2.b != null || o2.c != null || o2.d != null || o2.e != null || o2.f != null;
  }
  static formatTransforms(o2) {
    var flipBoth = o2.flip === "both" || o2.flip === true;
    var flipX = o2.flip && (flipBoth || o2.flip === "x") ? -1 : 1;
    var flipY = o2.flip && (flipBoth || o2.flip === "y") ? -1 : 1;
    var skewX = o2.skew && o2.skew.length ? o2.skew[0] : isFinite(o2.skew) ? o2.skew : isFinite(o2.skewX) ? o2.skewX : 0;
    var skewY = o2.skew && o2.skew.length ? o2.skew[1] : isFinite(o2.skew) ? o2.skew : isFinite(o2.skewY) ? o2.skewY : 0;
    var scaleX = o2.scale && o2.scale.length ? o2.scale[0] * flipX : isFinite(o2.scale) ? o2.scale * flipX : isFinite(o2.scaleX) ? o2.scaleX * flipX : flipX;
    var scaleY = o2.scale && o2.scale.length ? o2.scale[1] * flipY : isFinite(o2.scale) ? o2.scale * flipY : isFinite(o2.scaleY) ? o2.scaleY * flipY : flipY;
    var shear = o2.shear || 0;
    var theta = o2.rotate || o2.theta || 0;
    var origin = new Point(o2.origin || o2.around || o2.ox || o2.originX, o2.oy || o2.originY);
    var ox = origin.x;
    var oy = origin.y;
    var position2 = new Point(o2.position || o2.px || o2.positionX, o2.py || o2.positionY);
    var px = position2.x;
    var py = position2.y;
    var translate = new Point(o2.translate || o2.tx || o2.translateX, o2.ty || o2.translateY);
    var tx = translate.x;
    var ty = translate.y;
    var relative = new Point(o2.relative || o2.rx || o2.relativeX, o2.ry || o2.relativeY);
    var rx2 = relative.x;
    var ry2 = relative.y;
    return {
      scaleX,
      scaleY,
      skewX,
      skewY,
      shear,
      theta,
      rx: rx2,
      ry: ry2,
      tx,
      ty,
      ox,
      oy,
      px,
      py
    };
  }
  // left matrix, right matrix, target matrix which is overwritten
  static matrixMultiply(l2, r2, o2) {
    var a2 = l2.a * r2.a + l2.c * r2.b;
    var b2 = l2.b * r2.a + l2.d * r2.b;
    var c2 = l2.a * r2.c + l2.c * r2.d;
    var d2 = l2.b * r2.c + l2.d * r2.d;
    var e2 = l2.e + l2.a * r2.e + l2.c * r2.f;
    var f2 = l2.f + l2.b * r2.e + l2.d * r2.f;
    o2.a = a2;
    o2.b = b2;
    o2.c = c2;
    o2.d = d2;
    o2.e = e2;
    o2.f = f2;
    return o2;
  }
};
function ctm() {
  return new Matrix(this.node.getCTM());
}
function screenCTM() {
  if (typeof this.isRoot === "function" && !this.isRoot()) {
    var rect = this.rect(1, 1);
    var m2 = rect.node.getScreenCTM();
    rect.remove();
    return new Matrix(m2);
  }
  return new Matrix(this.node.getScreenCTM());
}
register(Matrix, "Matrix");
function parser() {
  if (!parser.nodes) {
    const svg = makeInstance().size(2, 0);
    svg.node.style.cssText = [
      "opacity: 0",
      "position: absolute",
      "left: -100%",
      "top: -100%",
      "overflow: hidden"
    ].join(";");
    svg.attr("focusable", "false");
    svg.attr("aria-hidden", "true");
    const path = svg.path().node;
    parser.nodes = { svg, path };
  }
  if (!parser.nodes.svg.node.parentNode) {
    const b2 = globals.document.body || globals.document.documentElement;
    parser.nodes.svg.addTo(b2);
  }
  return parser.nodes;
}
function isNulledBox(box) {
  return !box.width && !box.height && !box.x && !box.y;
}
function domContains(node) {
  return node === globals.document || (globals.document.documentElement.contains || function(node2) {
    while (node2.parentNode) {
      node2 = node2.parentNode;
    }
    return node2 === globals.document;
  }).call(globals.document.documentElement, node);
}
var Box = class _Box {
  constructor(...args) {
    this.init(...args);
  }
  init(source) {
    var base = [0, 0, 0, 0];
    source = typeof source === "string" ? source.split(delimiter).map(parseFloat) : Array.isArray(source) ? source : typeof source === "object" ? [source.left != null ? source.left : source.x, source.top != null ? source.top : source.y, source.width, source.height] : arguments.length === 4 ? [].slice.call(arguments) : base;
    this.x = source[0] || 0;
    this.y = source[1] || 0;
    this.width = this.w = source[2] || 0;
    this.height = this.h = source[3] || 0;
    this.x2 = this.x + this.w;
    this.y2 = this.y + this.h;
    this.cx = this.x + this.w / 2;
    this.cy = this.y + this.h / 2;
    return this;
  }
  // Merge rect box with another, return a new instance
  merge(box) {
    const x2 = Math.min(this.x, box.x);
    const y2 = Math.min(this.y, box.y);
    const width2 = Math.max(this.x + this.width, box.x + box.width) - x2;
    const height2 = Math.max(this.y + this.height, box.y + box.height) - y2;
    return new _Box(x2, y2, width2, height2);
  }
  transform(m2) {
    if (!(m2 instanceof Matrix)) {
      m2 = new Matrix(m2);
    }
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;
    const pts = [
      new Point(this.x, this.y),
      new Point(this.x2, this.y),
      new Point(this.x, this.y2),
      new Point(this.x2, this.y2)
    ];
    pts.forEach(function(p2) {
      p2 = p2.transform(m2);
      xMin = Math.min(xMin, p2.x);
      xMax = Math.max(xMax, p2.x);
      yMin = Math.min(yMin, p2.y);
      yMax = Math.max(yMax, p2.y);
    });
    return new _Box(
      xMin,
      yMin,
      xMax - xMin,
      yMax - yMin
    );
  }
  addOffset() {
    this.x += globals.window.pageXOffset;
    this.y += globals.window.pageYOffset;
    return this;
  }
  toString() {
    return this.x + " " + this.y + " " + this.width + " " + this.height;
  }
  toArray() {
    return [this.x, this.y, this.width, this.height];
  }
  isNulled() {
    return isNulledBox(this);
  }
};
function getBox(cb, retry) {
  let box;
  try {
    box = cb(this.node);
    if (isNulledBox(box) && !domContains(this.node)) {
      throw new Error("Element not in the dom");
    }
  } catch (e2) {
    box = retry(this);
  }
  return box;
}
function bbox() {
  return new Box(getBox.call(this, (node) => node.getBBox(), (el) => {
    try {
      const clone2 = el.clone().addTo(parser().svg).show();
      const box = clone2.node.getBBox();
      clone2.remove();
      return box;
    } catch (e2) {
      throw new Error('Getting bbox of element "' + el.node.nodeName + '" is not possible. ' + e2.toString());
    }
  }));
}
function rbox(el) {
  const box = new Box(getBox.call(this, (node) => node.getBoundingClientRect(), (el2) => {
    throw new Error('Getting rbox of element "' + el2.node.nodeName + '" is not possible');
  }));
  if (el) return box.transform(el.screenCTM().inverse());
  return box.addOffset();
}
registerMethods({
  viewbox: {
    viewbox(x2, y2, width2, height2) {
      if (x2 == null) return new Box(this.attr("viewBox"));
      return this.attr("viewBox", new Box(x2, y2, width2, height2));
    },
    zoom(level, point2) {
      let width2 = this.node.clientWidth;
      let height2 = this.node.clientHeight;
      const v2 = this.viewbox();
      if (!width2 && !height2) {
        var style = window.getComputedStyle(this.node);
        width2 = parseFloat(style.getPropertyValue("width"));
        height2 = parseFloat(style.getPropertyValue("height"));
      }
      const zoomX = width2 / v2.width;
      const zoomY = height2 / v2.height;
      const zoom = Math.min(zoomX, zoomY);
      if (level == null) {
        return zoom;
      }
      let zoomAmount = zoom / level;
      if (zoomAmount === Infinity) zoomAmount = Number.MIN_VALUE;
      point2 = point2 || new Point(width2 / 2 / zoomX + v2.x, height2 / 2 / zoomY + v2.y);
      const box = new Box(v2).transform(
        new Matrix({ scale: zoomAmount, origin: point2 })
      );
      return this.viewbox(box);
    }
  }
});
register(Box, "Box");
var subClassArray = (function() {
  try {
    return Function("name", "baseClass", "_constructor", [
      "baseClass = baseClass || Array",
      "return {",
      "  [name]: class extends baseClass {",
      "    constructor (...args) {",
      "      super(...args)",
      "      _constructor && _constructor.apply(this, args)",
      "    }",
      "  }",
      "}[name]"
    ].join("\n"));
  } catch (e2) {
    return (name, baseClass = Array, _constructor) => {
      const Arr = function() {
        baseClass.apply(this, arguments);
        _constructor && _constructor.apply(this, arguments);
      };
      Arr.prototype = Object.create(baseClass.prototype);
      Arr.prototype.constructor = Arr;
      Arr.prototype.map = function(fn) {
        const arr = new Arr();
        arr.push.apply(arr, Array.prototype.map.call(this, fn));
        return arr;
      };
      return Arr;
    };
  }
})();
var List = subClassArray("List", Array, function(arr = []) {
  if (typeof arr === "number") return this;
  this.length = 0;
  this.push(...arr);
});
extend(List, {
  each(fnOrMethodName, ...args) {
    if (typeof fnOrMethodName === "function") {
      return this.map((el) => {
        return fnOrMethodName.call(el, el);
      });
    } else {
      return this.map((el) => {
        return el[fnOrMethodName](...args);
      });
    }
  },
  toArray() {
    return Array.prototype.concat.apply([], this);
  }
});
var reserved = ["toArray", "constructor", "each"];
List.extend = function(methods2) {
  methods2 = methods2.reduce((obj, name) => {
    if (reserved.includes(name)) return obj;
    if (name[0] === "_") return obj;
    obj[name] = function(...attrs2) {
      return this.each(name, ...attrs2);
    };
    return obj;
  }, {});
  extend(List, methods2);
};
function baseFind(query, parent) {
  return new List(map((parent || globals.document).querySelectorAll(query), function(node) {
    return adopt(node);
  }));
}
function find(query) {
  return baseFind(query, this.node);
}
function findOne(query) {
  return adopt(this.node.querySelector(query));
}
var EventTarget = class extends Base {
  constructor({ events = {} } = {}) {
    super();
    this.events = events;
  }
  addEventListener() {
  }
  dispatch(event, data2) {
    return dispatch(this, event, data2);
  }
  dispatchEvent(event) {
    const bag = this.getEventHolder().events;
    if (!bag) return true;
    const events = bag[event.type];
    for (const i in events) {
      for (const j2 in events[i]) {
        events[i][j2](event);
      }
    }
    return !event.defaultPrevented;
  }
  // Fire given event
  fire(event, data2) {
    this.dispatch(event, data2);
    return this;
  }
  getEventHolder() {
    return this;
  }
  getEventTarget() {
    return this;
  }
  // Unbind event from listener
  off(event, listener) {
    off(this, event, listener);
    return this;
  }
  // Bind given event to listener
  on(event, listener, binding, options) {
    on(this, event, listener, binding, options);
    return this;
  }
  removeEventListener() {
  }
};
register(EventTarget, "EventTarget");
function noop() {
}
var timeline = {
  duration: 400,
  ease: ">",
  delay: 0
};
var attrs = {
  // fill and stroke
  "fill-opacity": 1,
  "stroke-opacity": 1,
  "stroke-width": 0,
  "stroke-linejoin": "miter",
  "stroke-linecap": "butt",
  fill: "#000000",
  stroke: "#000000",
  opacity: 1,
  // position
  x: 0,
  y: 0,
  cx: 0,
  cy: 0,
  // size
  width: 0,
  height: 0,
  // radius
  r: 0,
  rx: 0,
  ry: 0,
  // gradient
  offset: 0,
  "stop-opacity": 1,
  "stop-color": "#000000",
  // text
  "text-anchor": "start"
};
var SVGArray = subClassArray("SVGArray", Array, function(arr) {
  this.init(arr);
});
extend(SVGArray, {
  init(arr) {
    if (typeof arr === "number") return this;
    this.length = 0;
    this.push(...this.parse(arr));
    return this;
  },
  toArray() {
    return Array.prototype.concat.apply([], this);
  },
  toString() {
    return this.join(" ");
  },
  // Flattens the array if needed
  valueOf() {
    const ret = [];
    ret.push(...this);
    return ret;
  },
  // Parse whitespace separated string
  parse(array2 = []) {
    if (array2 instanceof Array) return array2;
    return array2.trim().split(delimiter).map(parseFloat);
  },
  clone() {
    return new this.constructor(this);
  },
  toSet() {
    return new Set(this);
  }
});
var SVGNumber = class _SVGNumber {
  // Initialize
  constructor(...args) {
    this.init(...args);
  }
  init(value, unit) {
    unit = Array.isArray(value) ? value[1] : unit;
    value = Array.isArray(value) ? value[0] : value;
    this.value = 0;
    this.unit = unit || "";
    if (typeof value === "number") {
      this.value = isNaN(value) ? 0 : !isFinite(value) ? value < 0 ? -34e37 : 34e37 : value;
    } else if (typeof value === "string") {
      unit = value.match(numberAndUnit);
      if (unit) {
        this.value = parseFloat(unit[1]);
        if (unit[5] === "%") {
          this.value /= 100;
        } else if (unit[5] === "s") {
          this.value *= 1e3;
        }
        this.unit = unit[5];
      }
    } else {
      if (value instanceof _SVGNumber) {
        this.value = value.valueOf();
        this.unit = value.unit;
      }
    }
    return this;
  }
  toString() {
    return (this.unit === "%" ? ~~(this.value * 1e8) / 1e6 : this.unit === "s" ? this.value / 1e3 : this.value) + this.unit;
  }
  toJSON() {
    return this.toString();
  }
  toArray() {
    return [this.value, this.unit];
  }
  valueOf() {
    return this.value;
  }
  // Add number
  plus(number) {
    number = new _SVGNumber(number);
    return new _SVGNumber(this + number, this.unit || number.unit);
  }
  // Subtract number
  minus(number) {
    number = new _SVGNumber(number);
    return new _SVGNumber(this - number, this.unit || number.unit);
  }
  // Multiply number
  times(number) {
    number = new _SVGNumber(number);
    return new _SVGNumber(this * number, this.unit || number.unit);
  }
  // Divide number
  divide(number) {
    number = new _SVGNumber(number);
    return new _SVGNumber(this / number, this.unit || number.unit);
  }
  convert(unit) {
    return new _SVGNumber(this.value, unit);
  }
};
var hooks = [];
function registerAttrHook(fn) {
  hooks.push(fn);
}
function attr(attr2, val, ns2) {
  if (attr2 == null) {
    attr2 = {};
    val = this.node.attributes;
    for (const node of val) {
      attr2[node.nodeName] = isNumber.test(node.nodeValue) ? parseFloat(node.nodeValue) : node.nodeValue;
    }
    return attr2;
  } else if (attr2 instanceof Array) {
    return attr2.reduce((last, curr) => {
      last[curr] = this.attr(curr);
      return last;
    }, {});
  } else if (typeof attr2 === "object" && attr2.constructor === Object) {
    for (val in attr2) this.attr(val, attr2[val]);
  } else if (val === null) {
    this.node.removeAttribute(attr2);
  } else if (val == null) {
    val = this.node.getAttribute(attr2);
    return val == null ? attrs[attr2] : isNumber.test(val) ? parseFloat(val) : val;
  } else {
    val = hooks.reduce((_val, hook) => {
      return hook(attr2, _val, this);
    }, val);
    if (typeof val === "number") {
      val = new SVGNumber(val);
    } else if (Color.isColor(val)) {
      val = new Color(val);
    } else if (val.constructor === Array) {
      val = new SVGArray(val);
    }
    if (attr2 === "leading") {
      if (this.leading) {
        this.leading(val);
      }
    } else {
      typeof ns2 === "string" ? this.node.setAttributeNS(ns2, attr2, val.toString()) : this.node.setAttribute(attr2, val.toString());
    }
    if (this.rebuild && (attr2 === "font-size" || attr2 === "x")) {
      this.rebuild();
    }
  }
  return this;
}
var Dom = class _Dom extends EventTarget {
  constructor(node, attrs2) {
    super(node);
    this.node = node;
    this.type = node.nodeName;
    if (attrs2 && node !== attrs2) {
      this.attr(attrs2);
    }
  }
  // Add given element at a position
  add(element, i) {
    element = makeInstance(element);
    if (i == null) {
      this.node.appendChild(element.node);
    } else if (element.node !== this.node.childNodes[i]) {
      this.node.insertBefore(element.node, this.node.childNodes[i]);
    }
    return this;
  }
  // Add element to given container and return self
  addTo(parent) {
    return makeInstance(parent).put(this);
  }
  // Returns all child elements
  children() {
    return new List(map(this.node.children, function(node) {
      return adopt(node);
    }));
  }
  // Remove all elements in this container
  clear() {
    while (this.node.hasChildNodes()) {
      this.node.removeChild(this.node.lastChild);
    }
    return this;
  }
  // Clone element
  clone() {
    this.writeDataToDom();
    return assignNewId(this.node.cloneNode(true));
  }
  // Iterates over all children and invokes a given block
  each(block, deep) {
    var children = this.children();
    var i, il;
    for (i = 0, il = children.length; i < il; i++) {
      block.apply(children[i], [i, children]);
      if (deep) {
        children[i].each(block, deep);
      }
    }
    return this;
  }
  element(nodeName) {
    return this.put(new _Dom(create(nodeName)));
  }
  // Get first child
  first() {
    return adopt(this.node.firstChild);
  }
  // Get a element at the given index
  get(i) {
    return adopt(this.node.childNodes[i]);
  }
  getEventHolder() {
    return this.node;
  }
  getEventTarget() {
    return this.node;
  }
  // Checks if the given element is a child
  has(element) {
    return this.index(element) >= 0;
  }
  // Get / set id
  id(id) {
    if (typeof id === "undefined" && !this.node.id) {
      this.node.id = eid(this.type);
    }
    return this.attr("id", id);
  }
  // Gets index of given element
  index(element) {
    return [].slice.call(this.node.childNodes).indexOf(element.node);
  }
  // Get the last child
  last() {
    return adopt(this.node.lastChild);
  }
  // matches the element vs a css selector
  matches(selector) {
    const el = this.node;
    return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector);
  }
  // Returns the parent element instance
  parent(type) {
    var parent = this;
    if (!parent.node.parentNode) return null;
    parent = adopt(parent.node.parentNode);
    if (!type) return parent;
    while (parent) {
      if (typeof type === "string" ? parent.matches(type) : parent instanceof type) return parent;
      if (!parent.node.parentNode || parent.node.parentNode.nodeName === "#document" || parent.node.parentNode.nodeName === "#document-fragment") return null;
      parent = adopt(parent.node.parentNode);
    }
  }
  // Basically does the same as `add()` but returns the added element instead
  put(element, i) {
    this.add(element, i);
    return element;
  }
  // Add element to given container and return container
  putIn(parent) {
    return makeInstance(parent).add(this);
  }
  // Remove element
  remove() {
    if (this.parent()) {
      this.parent().removeElement(this);
    }
    return this;
  }
  // Remove a given child
  removeElement(element) {
    this.node.removeChild(element.node);
    return this;
  }
  // Replace this with element
  replace(element) {
    element = makeInstance(element);
    this.node.parentNode.replaceChild(element.node, this.node);
    return element;
  }
  round(precision = 2, map2) {
    const factor = 10 ** precision;
    const attrs2 = this.attr();
    if (!map2) {
      map2 = Object.keys(attrs2);
    }
    const newAttrs = {};
    map2.forEach((key) => {
      newAttrs[key] = Math.round(attrs2[key] * factor) / factor;
    });
    this.attr(newAttrs);
    return this;
  }
  // Return id on string conversion
  toString() {
    return this.id();
  }
  // Import raw svg
  svg(svgOrFn, outerHTML) {
    var well, len, fragment;
    if (svgOrFn === false) {
      outerHTML = false;
      svgOrFn = null;
    }
    if (svgOrFn == null || typeof svgOrFn === "function") {
      outerHTML = outerHTML == null ? true : outerHTML;
      this.writeDataToDom();
      let current = this;
      if (svgOrFn != null) {
        current = adopt(current.node.cloneNode(true));
        if (outerHTML) {
          const result = svgOrFn(current);
          current = result || current;
          if (result === false) return "";
        }
        current.each(function() {
          const result = svgOrFn(this);
          const _this = result || this;
          if (result === false) {
            this.remove();
          } else if (result && this !== _this) {
            this.replace(_this);
          }
        }, true);
      }
      return outerHTML ? current.node.outerHTML : current.node.innerHTML;
    }
    outerHTML = outerHTML == null ? false : outerHTML;
    well = globals.document.createElementNS(ns, "svg");
    fragment = globals.document.createDocumentFragment();
    well.innerHTML = svgOrFn;
    for (len = well.children.length; len--; ) {
      fragment.appendChild(well.firstElementChild);
    }
    const parent = this.parent();
    return outerHTML ? this.replace(fragment) && parent : this.add(fragment);
  }
  words(text) {
    this.node.textContent = text;
    return this;
  }
  // write svgjs data to the dom
  writeDataToDom() {
    this.each(function() {
      this.writeDataToDom();
    });
    return this;
  }
};
extend(Dom, { attr, find, findOne });
register(Dom, "Dom");
var Element = class extends Dom {
  constructor(node, attrs2) {
    super(node, attrs2);
    this.dom = {};
    this.node.instance = this;
    if (node.hasAttribute("svgjs:data")) {
      this.setData(JSON.parse(node.getAttribute("svgjs:data")) || {});
    }
  }
  // Move element by its center
  center(x2, y2) {
    return this.cx(x2).cy(y2);
  }
  // Move by center over x-axis
  cx(x2) {
    return x2 == null ? this.x() + this.width() / 2 : this.x(x2 - this.width() / 2);
  }
  // Move by center over y-axis
  cy(y2) {
    return y2 == null ? this.y() + this.height() / 2 : this.y(y2 - this.height() / 2);
  }
  // Get defs
  defs() {
    return this.root().defs();
  }
  // Relative move over x and y axes
  dmove(x2, y2) {
    return this.dx(x2).dy(y2);
  }
  // Relative move over x axis
  dx(x2 = 0) {
    return this.x(new SVGNumber(x2).plus(this.x()));
  }
  // Relative move over y axis
  dy(y2 = 0) {
    return this.y(new SVGNumber(y2).plus(this.y()));
  }
  // Get parent document
  root() {
    const p2 = this.parent(getClass(root));
    return p2 && p2.root();
  }
  getEventHolder() {
    return this;
  }
  // Set height of element
  height(height2) {
    return this.attr("height", height2);
  }
  // Checks whether the given point inside the bounding box of the element
  inside(x2, y2) {
    const box = this.bbox();
    return x2 > box.x && y2 > box.y && x2 < box.x + box.width && y2 < box.y + box.height;
  }
  // Move element to given x and y values
  move(x2, y2) {
    return this.x(x2).y(y2);
  }
  // return array of all ancestors of given type up to the root svg
  parents(until = globals.document) {
    until = makeInstance(until);
    const parents = new List();
    let parent = this;
    while ((parent = parent.parent()) && parent.node !== until.node && parent.node !== globals.document) {
      parents.push(parent);
    }
    return parents;
  }
  // Get referenced element form attribute value
  reference(attr2) {
    attr2 = this.attr(attr2);
    if (!attr2) return null;
    const m2 = attr2.match(reference);
    return m2 ? makeInstance(m2[1]) : null;
  }
  // set given data to the elements data property
  setData(o2) {
    this.dom = o2;
    return this;
  }
  // Set element size to given width and height
  size(width2, height2) {
    const p2 = proportionalSize(this, width2, height2);
    return this.width(new SVGNumber(p2.width)).height(new SVGNumber(p2.height));
  }
  // Set width of element
  width(width2) {
    return this.attr("width", width2);
  }
  // write svgjs data to the dom
  writeDataToDom() {
    this.node.removeAttribute("svgjs:data");
    if (Object.keys(this.dom).length) {
      this.node.setAttribute("svgjs:data", JSON.stringify(this.dom));
    }
    return super.writeDataToDom();
  }
  // Move over x-axis
  x(x2) {
    return this.attr("x", x2);
  }
  // Move over y-axis
  y(y2) {
    return this.attr("y", y2);
  }
};
extend(Element, {
  bbox,
  rbox,
  point,
  ctm,
  screenCTM
});
register(Element, "Element");
var sugar = {
  stroke: ["color", "width", "opacity", "linecap", "linejoin", "miterlimit", "dasharray", "dashoffset"],
  fill: ["color", "opacity", "rule"],
  prefix: function(t2, a2) {
    return a2 === "color" ? t2 : t2 + "-" + a2;
  }
};
["fill", "stroke"].forEach(function(m2) {
  var extension = {};
  var i;
  extension[m2] = function(o2) {
    if (typeof o2 === "undefined") {
      return this.attr(m2);
    }
    if (typeof o2 === "string" || o2 instanceof Color || Color.isRgb(o2) || o2 instanceof Element) {
      this.attr(m2, o2);
    } else {
      for (i = sugar[m2].length - 1; i >= 0; i--) {
        if (o2[sugar[m2][i]] != null) {
          this.attr(sugar.prefix(m2, sugar[m2][i]), o2[sugar[m2][i]]);
        }
      }
    }
    return this;
  };
  registerMethods(["Element", "Runner"], extension);
});
registerMethods(["Element", "Runner"], {
  // Let the user set the matrix directly
  matrix: function(mat, b2, c2, d2, e2, f2) {
    if (mat == null) {
      return new Matrix(this);
    }
    return this.attr("transform", new Matrix(mat, b2, c2, d2, e2, f2));
  },
  // Map rotation to transform
  rotate: function(angle, cx2, cy2) {
    return this.transform({ rotate: angle, ox: cx2, oy: cy2 }, true);
  },
  // Map skew to transform
  skew: function(x2, y2, cx2, cy2) {
    return arguments.length === 1 || arguments.length === 3 ? this.transform({ skew: x2, ox: y2, oy: cx2 }, true) : this.transform({ skew: [x2, y2], ox: cx2, oy: cy2 }, true);
  },
  shear: function(lam, cx2, cy2) {
    return this.transform({ shear: lam, ox: cx2, oy: cy2 }, true);
  },
  // Map scale to transform
  scale: function(x2, y2, cx2, cy2) {
    return arguments.length === 1 || arguments.length === 3 ? this.transform({ scale: x2, ox: y2, oy: cx2 }, true) : this.transform({ scale: [x2, y2], ox: cx2, oy: cy2 }, true);
  },
  // Map translate to transform
  translate: function(x2, y2) {
    return this.transform({ translate: [x2, y2] }, true);
  },
  // Map relative translations to transform
  relative: function(x2, y2) {
    return this.transform({ relative: [x2, y2] }, true);
  },
  // Map flip to transform
  flip: function(direction, around) {
    var directionString = typeof direction === "string" ? direction : isFinite(direction) ? "both" : "both";
    var origin = direction === "both" && isFinite(around) ? [around, around] : direction === "x" ? [around, 0] : direction === "y" ? [0, around] : isFinite(direction) ? [direction, direction] : [0, 0];
    return this.transform({ flip: directionString, origin }, true);
  },
  // Opacity
  opacity: function(value) {
    return this.attr("opacity", value);
  }
});
registerMethods("radius", {
  // Add x and y radius
  radius: function(x2, y2) {
    var type = (this._element || this).type;
    return type === "radialGradient" || type === "radialGradient" ? this.attr("r", new SVGNumber(x2)) : this.rx(x2).ry(y2 == null ? x2 : y2);
  }
});
registerMethods("Path", {
  // Get path length
  length: function() {
    return this.node.getTotalLength();
  },
  // Get point at length
  pointAt: function(length2) {
    return new Point(this.node.getPointAtLength(length2));
  }
});
registerMethods(["Element", "Runner"], {
  // Set font
  font: function(a2, v2) {
    if (typeof a2 === "object") {
      for (v2 in a2) this.font(v2, a2[v2]);
      return this;
    }
    return a2 === "leading" ? this.leading(v2) : a2 === "anchor" ? this.attr("text-anchor", v2) : a2 === "size" || a2 === "family" || a2 === "weight" || a2 === "stretch" || a2 === "variant" || a2 === "style" ? this.attr("font-" + a2, v2) : this.attr(a2, v2);
  }
});
registerMethods("Text", {
  ax(x2) {
    return this.attr("x", x2);
  },
  ay(y2) {
    return this.attr("y", y2);
  },
  amove(x2, y2) {
    return this.ax(x2).ay(y2);
  }
});
var methods = [
  "click",
  "dblclick",
  "mousedown",
  "mouseup",
  "mouseover",
  "mouseout",
  "mousemove",
  "mouseenter",
  "mouseleave",
  "touchstart",
  "touchmove",
  "touchleave",
  "touchend",
  "touchcancel"
].reduce(function(last, event) {
  const fn = function(f2) {
    if (f2 === null) {
      off(this, event);
    } else {
      on(this, event, f2);
    }
    return this;
  };
  last[event] = fn;
  return last;
}, {});
registerMethods("Element", methods);
function untransform() {
  return this.attr("transform", null);
}
function matrixify() {
  var matrix = (this.attr("transform") || "").split(transforms).slice(0, -1).map(function(str) {
    var kv = str.trim().split("(");
    return [
      kv[0],
      kv[1].split(delimiter).map(function(str2) {
        return parseFloat(str2);
      })
    ];
  }).reverse().reduce(function(matrix2, transform2) {
    if (transform2[0] === "matrix") {
      return matrix2.lmultiply(Matrix.fromArray(transform2[1]));
    }
    return matrix2[transform2[0]].apply(matrix2, transform2[1]);
  }, new Matrix());
  return matrix;
}
function toParent(parent) {
  if (this === parent) return this;
  var ctm2 = this.screenCTM();
  var pCtm = parent.screenCTM().inverse();
  this.addTo(parent).untransform().transform(pCtm.multiply(ctm2));
  return this;
}
function toRoot() {
  return this.toParent(this.root());
}
function transform(o2, relative) {
  if (o2 == null || typeof o2 === "string") {
    var decomposed = new Matrix(this).decompose();
    return o2 == null ? decomposed : decomposed[o2];
  }
  if (!Matrix.isMatrixLike(o2)) {
    o2 = { ...o2, origin: getOrigin(o2, this) };
  }
  var cleanRelative = relative === true ? this : relative || false;
  var result = new Matrix(cleanRelative).transform(o2);
  return this.attr("transform", result);
}
registerMethods("Element", {
  untransform,
  matrixify,
  toParent,
  toRoot,
  transform
});
function rx(rx2) {
  return this.attr("rx", rx2);
}
function ry(ry2) {
  return this.attr("ry", ry2);
}
function x$1(x2) {
  return x2 == null ? this.cx() - this.rx() : this.cx(x2 + this.rx());
}
function y$1(y2) {
  return y2 == null ? this.cy() - this.ry() : this.cy(y2 + this.ry());
}
function cx(x2) {
  return x2 == null ? this.attr("cx") : this.attr("cx", x2);
}
function cy(y2) {
  return y2 == null ? this.attr("cy") : this.attr("cy", y2);
}
function width$1(width2) {
  return width2 == null ? this.rx() * 2 : this.rx(new SVGNumber(width2).divide(2));
}
function height$1(height2) {
  return height2 == null ? this.ry() * 2 : this.ry(new SVGNumber(height2).divide(2));
}
var circled = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  rx,
  ry,
  x: x$1,
  y: y$1,
  cx,
  cy,
  width: width$1,
  height: height$1
});
var Shape$1 = class extends Element {
};
register(Shape$1, "Shape");
var Circle = class extends Shape$1 {
  constructor(node) {
    super(nodeOrNew("circle", node), node);
  }
  radius(r2) {
    return this.attr("r", r2);
  }
  // Radius x value
  rx(rx2) {
    return this.attr("r", rx2);
  }
  // Alias radius x value
  ry(ry2) {
    return this.rx(ry2);
  }
  size(size2) {
    return this.radius(new SVGNumber(size2).divide(2));
  }
};
extend(Circle, { x: x$1, y: y$1, cx, cy, width: width$1, height: height$1 });
registerMethods({
  Container: {
    // Create circle element
    circle: wrapWithAttrCheck(function(size2) {
      return this.put(new Circle()).size(size2).move(0, 0);
    })
  }
});
register(Circle, "Circle");
var Container = class _Container extends Element {
  flatten(parent) {
    this.each(function() {
      if (this instanceof _Container) return this.flatten(parent).ungroup(parent);
      return this.toParent(parent);
    });
    this.node.firstElementChild || this.remove();
    return this;
  }
  ungroup(parent) {
    parent = parent || this.parent();
    this.each(function() {
      return this.toParent(parent);
    });
    this.remove();
    return this;
  }
};
register(Container, "Container");
var Defs = class extends Container {
  constructor(node) {
    super(nodeOrNew("defs", node), node);
  }
  flatten() {
    return this;
  }
  ungroup() {
    return this;
  }
};
register(Defs, "Defs");
var Ellipse = class extends Shape$1 {
  constructor(node) {
    super(nodeOrNew("ellipse", node), node);
  }
  size(width2, height2) {
    var p2 = proportionalSize(this, width2, height2);
    return this.rx(new SVGNumber(p2.width).divide(2)).ry(new SVGNumber(p2.height).divide(2));
  }
};
extend(Ellipse, circled);
registerMethods("Container", {
  // Create an ellipse
  ellipse: wrapWithAttrCheck(function(width2 = 0, height2 = width2) {
    return this.put(new Ellipse()).size(width2, height2).move(0, 0);
  })
});
register(Ellipse, "Ellipse");
var Stop = class extends Element {
  constructor(node) {
    super(nodeOrNew("stop", node), node);
  }
  // add color stops
  update(o2) {
    if (typeof o2 === "number" || o2 instanceof SVGNumber) {
      o2 = {
        offset: arguments[0],
        color: arguments[1],
        opacity: arguments[2]
      };
    }
    if (o2.opacity != null) this.attr("stop-opacity", o2.opacity);
    if (o2.color != null) this.attr("stop-color", o2.color);
    if (o2.offset != null) this.attr("offset", new SVGNumber(o2.offset));
    return this;
  }
};
register(Stop, "Stop");
function from(x2, y2) {
  return (this._element || this).type === "radialGradient" ? this.attr({ fx: new SVGNumber(x2), fy: new SVGNumber(y2) }) : this.attr({ x1: new SVGNumber(x2), y1: new SVGNumber(y2) });
}
function to(x2, y2) {
  return (this._element || this).type === "radialGradient" ? this.attr({ cx: new SVGNumber(x2), cy: new SVGNumber(y2) }) : this.attr({ x2: new SVGNumber(x2), y2: new SVGNumber(y2) });
}
var gradiented = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  from,
  to
});
var Gradient = class extends Container {
  constructor(type, attrs2) {
    super(
      nodeOrNew(type + "Gradient", typeof type === "string" ? null : type),
      attrs2
    );
  }
  // Add a color stop
  stop(offset, color, opacity) {
    return this.put(new Stop()).update(offset, color, opacity);
  }
  // Update gradient
  update(block) {
    this.clear();
    if (typeof block === "function") {
      block.call(this, this);
    }
    return this;
  }
  // Return the fill id
  url() {
    return "url(#" + this.id() + ")";
  }
  // Alias string convertion to fill
  toString() {
    return this.url();
  }
  // custom attr to handle transform
  attr(a2, b2, c2) {
    if (a2 === "transform") a2 = "gradientTransform";
    return super.attr(a2, b2, c2);
  }
  targets() {
    return baseFind('svg [fill*="' + this.id() + '"]');
  }
  bbox() {
    return new Box();
  }
};
extend(Gradient, gradiented);
registerMethods({
  Container: {
    // Create gradient element in defs
    gradient: wrapWithAttrCheck(function(type, block) {
      return this.defs().gradient(type, block);
    })
  },
  // define gradient
  Defs: {
    gradient: wrapWithAttrCheck(function(type, block) {
      return this.put(new Gradient(type)).update(block);
    })
  }
});
register(Gradient, "Gradient");
var Pattern = class extends Container {
  // Initialize node
  constructor(node) {
    super(nodeOrNew("pattern", node), node);
  }
  // Return the fill id
  url() {
    return "url(#" + this.id() + ")";
  }
  // Update pattern by rebuilding
  update(block) {
    this.clear();
    if (typeof block === "function") {
      block.call(this, this);
    }
    return this;
  }
  // Alias string convertion to fill
  toString() {
    return this.url();
  }
  // custom attr to handle transform
  attr(a2, b2, c2) {
    if (a2 === "transform") a2 = "patternTransform";
    return super.attr(a2, b2, c2);
  }
  targets() {
    return baseFind('svg [fill*="' + this.id() + '"]');
  }
  bbox() {
    return new Box();
  }
};
registerMethods({
  Container: {
    // Create pattern element in defs
    pattern(...args) {
      return this.defs().pattern(...args);
    }
  },
  Defs: {
    pattern: wrapWithAttrCheck(function(width2, height2, block) {
      return this.put(new Pattern()).update(block).attr({
        x: 0,
        y: 0,
        width: width2,
        height: height2,
        patternUnits: "userSpaceOnUse"
      });
    })
  }
});
register(Pattern, "Pattern");
var Image = class extends Shape$1 {
  constructor(node) {
    super(nodeOrNew("image", node), node);
  }
  // (re)load image
  load(url, callback) {
    if (!url) return this;
    var img = new globals.window.Image();
    on(img, "load", function(e2) {
      var p2 = this.parent(Pattern);
      if (this.width() === 0 && this.height() === 0) {
        this.size(img.width, img.height);
      }
      if (p2 instanceof Pattern) {
        if (p2.width() === 0 && p2.height() === 0) {
          p2.size(this.width(), this.height());
        }
      }
      if (typeof callback === "function") {
        callback.call(this, e2);
      }
    }, this);
    on(img, "load error", function() {
      off(img);
    });
    return this.attr("href", img.src = url, xlink);
  }
};
registerAttrHook(function(attr2, val, _this) {
  if (attr2 === "fill" || attr2 === "stroke") {
    if (isImage.test(val)) {
      val = _this.root().defs().image(val);
    }
  }
  if (val instanceof Image) {
    val = _this.root().defs().pattern(0, 0, (pattern) => {
      pattern.add(val);
    });
  }
  return val;
});
registerMethods({
  Container: {
    // create image element, load image and set its size
    image: wrapWithAttrCheck(function(source, callback) {
      return this.put(new Image()).size(0, 0).load(source, callback);
    })
  }
});
register(Image, "Image");
var PointArray = subClassArray("PointArray", SVGArray);
extend(PointArray, {
  // Convert array to string
  toString() {
    for (var i = 0, il = this.length, array2 = []; i < il; i++) {
      array2.push(this[i].join(","));
    }
    return array2.join(" ");
  },
  // Convert array to line object
  toLine() {
    return {
      x1: this[0][0],
      y1: this[0][1],
      x2: this[1][0],
      y2: this[1][1]
    };
  },
  // Get morphed array at given position
  at(pos) {
    if (!this.destination) return this;
    for (var i = 0, il = this.length, array2 = []; i < il; i++) {
      array2.push([
        this[i][0] + (this.destination[i][0] - this[i][0]) * pos,
        this[i][1] + (this.destination[i][1] - this[i][1]) * pos
      ]);
    }
    return new PointArray(array2);
  },
  // Parse point string and flat array
  parse(array2 = [[0, 0]]) {
    var points = [];
    if (array2 instanceof Array) {
      if (array2[0] instanceof Array) {
        return array2;
      }
    } else {
      array2 = array2.trim().split(delimiter).map(parseFloat);
    }
    if (array2.length % 2 !== 0) array2.pop();
    for (var i = 0, len = array2.length; i < len; i = i + 2) {
      points.push([array2[i], array2[i + 1]]);
    }
    return points;
  },
  // transform points with matrix (similar to Point.transform)
  transform(m2) {
    const points = [];
    for (let i = 0; i < this.length; i++) {
      const point2 = this[i];
      points.push([
        m2.a * point2[0] + m2.c * point2[1] + m2.e,
        m2.b * point2[0] + m2.d * point2[1] + m2.f
      ]);
    }
    return new PointArray(points);
  },
  // Move point string
  move(x2, y2) {
    var box = this.bbox();
    x2 -= box.x;
    y2 -= box.y;
    if (!isNaN(x2) && !isNaN(y2)) {
      for (var i = this.length - 1; i >= 0; i--) {
        this[i] = [this[i][0] + x2, this[i][1] + y2];
      }
    }
    return this;
  },
  // Resize poly string
  size(width2, height2) {
    var i;
    var box = this.bbox();
    for (i = this.length - 1; i >= 0; i--) {
      if (box.width) this[i][0] = (this[i][0] - box.x) * width2 / box.width + box.x;
      if (box.height) this[i][1] = (this[i][1] - box.y) * height2 / box.height + box.y;
    }
    return this;
  },
  // Get bounding box of points
  bbox() {
    var maxX = -Infinity;
    var maxY = -Infinity;
    var minX = Infinity;
    var minY = Infinity;
    this.forEach(function(el) {
      maxX = Math.max(el[0], maxX);
      maxY = Math.max(el[1], maxY);
      minX = Math.min(el[0], minX);
      minY = Math.min(el[1], minY);
    });
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
});
var MorphArray = PointArray;
function x(x2) {
  return x2 == null ? this.bbox().x : this.move(x2, this.bbox().y);
}
function y(y2) {
  return y2 == null ? this.bbox().y : this.move(this.bbox().x, y2);
}
function width(width2) {
  const b2 = this.bbox();
  return width2 == null ? b2.width : this.size(width2, b2.height);
}
function height(height2) {
  const b2 = this.bbox();
  return height2 == null ? b2.height : this.size(b2.width, height2);
}
var pointed = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  MorphArray,
  x,
  y,
  width,
  height
});
var Line = class extends Shape$1 {
  // Initialize node
  constructor(node) {
    super(nodeOrNew("line", node), node);
  }
  // Get array
  array() {
    return new PointArray([
      [this.attr("x1"), this.attr("y1")],
      [this.attr("x2"), this.attr("y2")]
    ]);
  }
  // Overwrite native plot() method
  plot(x1, y1, x2, y2) {
    if (x1 == null) {
      return this.array();
    } else if (typeof y1 !== "undefined") {
      x1 = { x1, y1, x2, y2 };
    } else {
      x1 = new PointArray(x1).toLine();
    }
    return this.attr(x1);
  }
  // Move by left top corner
  move(x2, y2) {
    return this.attr(this.array().move(x2, y2).toLine());
  }
  // Set element size to given width and height
  size(width2, height2) {
    var p2 = proportionalSize(this, width2, height2);
    return this.attr(this.array().size(p2.width, p2.height).toLine());
  }
};
extend(Line, pointed);
registerMethods({
  Container: {
    // Create a line element
    line: wrapWithAttrCheck(function(...args) {
      return Line.prototype.plot.apply(
        this.put(new Line()),
        args[0] != null ? args : [0, 0, 0, 0]
      );
    })
  }
});
register(Line, "Line");
var Marker = class extends Container {
  // Initialize node
  constructor(node) {
    super(nodeOrNew("marker", node), node);
  }
  // Set width of element
  width(width2) {
    return this.attr("markerWidth", width2);
  }
  // Set height of element
  height(height2) {
    return this.attr("markerHeight", height2);
  }
  // Set marker refX and refY
  ref(x2, y2) {
    return this.attr("refX", x2).attr("refY", y2);
  }
  // Update marker
  update(block) {
    this.clear();
    if (typeof block === "function") {
      block.call(this, this);
    }
    return this;
  }
  // Return the fill id
  toString() {
    return "url(#" + this.id() + ")";
  }
};
registerMethods({
  Container: {
    marker(...args) {
      return this.defs().marker(...args);
    }
  },
  Defs: {
    // Create marker
    marker: wrapWithAttrCheck(function(width2, height2, block) {
      return this.put(new Marker()).size(width2, height2).ref(width2 / 2, height2 / 2).viewbox(0, 0, width2, height2).attr("orient", "auto").update(block);
    })
  },
  marker: {
    // Create and attach markers
    marker(marker, width2, height2, block) {
      var attr2 = ["marker"];
      if (marker !== "all") attr2.push(marker);
      attr2 = attr2.join("-");
      marker = arguments[1] instanceof Marker ? arguments[1] : this.defs().marker(width2, height2, block);
      return this.attr(attr2, marker);
    }
  }
});
register(Marker, "Marker");
function makeSetterGetter(k2, f2) {
  return function(v2) {
    if (v2 == null) return this[v2];
    this[k2] = v2;
    if (f2) f2.call(this);
    return this;
  };
}
var easing = {
  "-": function(pos) {
    return pos;
  },
  "<>": function(pos) {
    return -Math.cos(pos * Math.PI) / 2 + 0.5;
  },
  ">": function(pos) {
    return Math.sin(pos * Math.PI / 2);
  },
  "<": function(pos) {
    return -Math.cos(pos * Math.PI / 2) + 1;
  },
  bezier: function(x1, y1, x2, y2) {
    return function(t2) {
      if (t2 < 0) {
        if (x1 > 0) {
          return y1 / x1 * t2;
        } else if (x2 > 0) {
          return y2 / x2 * t2;
        } else {
          return 0;
        }
      } else if (t2 > 1) {
        if (x2 < 1) {
          return (1 - y2) / (1 - x2) * t2 + (y2 - x2) / (1 - x2);
        } else if (x1 < 1) {
          return (1 - y1) / (1 - x1) * t2 + (y1 - x1) / (1 - x1);
        } else {
          return 1;
        }
      } else {
        return 3 * t2 * (1 - t2) ** 2 * y1 + 3 * t2 ** 2 * (1 - t2) * y2 + t2 ** 3;
      }
    };
  },
  // see https://www.w3.org/TR/css-easing-1/#step-timing-function-algo
  steps: function(steps, stepPosition = "end") {
    stepPosition = stepPosition.split("-").reverse()[0];
    let jumps = steps;
    if (stepPosition === "none") {
      --jumps;
    } else if (stepPosition === "both") {
      ++jumps;
    }
    return (t2, beforeFlag = false) => {
      let step = Math.floor(t2 * steps);
      const jumping = t2 * step % 1 === 0;
      if (stepPosition === "start" || stepPosition === "both") {
        ++step;
      }
      if (beforeFlag && jumping) {
        --step;
      }
      if (t2 >= 0 && step < 0) {
        step = 0;
      }
      if (t2 <= 1 && step > jumps) {
        step = jumps;
      }
      return step / jumps;
    };
  }
};
var Stepper = class {
  done() {
    return false;
  }
};
var Ease = class extends Stepper {
  constructor(fn) {
    super();
    this.ease = easing[fn || timeline.ease] || fn;
  }
  step(from2, to2, pos) {
    if (typeof from2 !== "number") {
      return pos < 1 ? from2 : to2;
    }
    return from2 + (to2 - from2) * this.ease(pos);
  }
};
var Controller = class extends Stepper {
  constructor(fn) {
    super();
    this.stepper = fn;
  }
  step(current, target, dt, c2) {
    return this.stepper(current, target, dt, c2);
  }
  done(c2) {
    return c2.done;
  }
};
function recalculate() {
  var duration = (this._duration || 500) / 1e3;
  var overshoot = this._overshoot || 0;
  var eps = 1e-10;
  var pi = Math.PI;
  var os = Math.log(overshoot / 100 + eps);
  var zeta = -os / Math.sqrt(pi * pi + os * os);
  var wn = 3.9 / (zeta * duration);
  this.d = 2 * zeta * wn;
  this.k = wn * wn;
}
var Spring = class extends Controller {
  constructor(duration, overshoot) {
    super();
    this.duration(duration || 500).overshoot(overshoot || 0);
  }
  step(current, target, dt, c2) {
    if (typeof current === "string") return current;
    c2.done = dt === Infinity;
    if (dt === Infinity) return target;
    if (dt === 0) return current;
    if (dt > 100) dt = 16;
    dt /= 1e3;
    var velocity = c2.velocity || 0;
    var acceleration = -this.d * velocity - this.k * (current - target);
    var newPosition = current + velocity * dt + acceleration * dt * dt / 2;
    c2.velocity = velocity + acceleration * dt;
    c2.done = Math.abs(target - newPosition) + Math.abs(velocity) < 2e-3;
    return c2.done ? target : newPosition;
  }
};
extend(Spring, {
  duration: makeSetterGetter("_duration", recalculate),
  overshoot: makeSetterGetter("_overshoot", recalculate)
});
var PID = class extends Controller {
  constructor(p2, i, d2, windup) {
    super();
    p2 = p2 == null ? 0.1 : p2;
    i = i == null ? 0.01 : i;
    d2 = d2 == null ? 0 : d2;
    windup = windup == null ? 1e3 : windup;
    this.p(p2).i(i).d(d2).windup(windup);
  }
  step(current, target, dt, c2) {
    if (typeof current === "string") return current;
    c2.done = dt === Infinity;
    if (dt === Infinity) return target;
    if (dt === 0) return current;
    var p2 = target - current;
    var i = (c2.integral || 0) + p2 * dt;
    var d2 = (p2 - (c2.error || 0)) / dt;
    var windup = this.windup;
    if (windup !== false) {
      i = Math.max(-windup, Math.min(i, windup));
    }
    c2.error = p2;
    c2.integral = i;
    c2.done = Math.abs(p2) < 1e-3;
    return c2.done ? target : current + (this.P * p2 + this.I * i + this.D * d2);
  }
};
extend(PID, {
  windup: makeSetterGetter("windup"),
  p: makeSetterGetter("P"),
  i: makeSetterGetter("I"),
  d: makeSetterGetter("D")
});
var PathArray = subClassArray("PathArray", SVGArray);
function pathRegReplace(a2, b2, c2, d2) {
  return c2 + d2.replace(dots, " .");
}
function arrayToString(a2) {
  for (var i = 0, il = a2.length, s2 = ""; i < il; i++) {
    s2 += a2[i][0];
    if (a2[i][1] != null) {
      s2 += a2[i][1];
      if (a2[i][2] != null) {
        s2 += " ";
        s2 += a2[i][2];
        if (a2[i][3] != null) {
          s2 += " ";
          s2 += a2[i][3];
          s2 += " ";
          s2 += a2[i][4];
          if (a2[i][5] != null) {
            s2 += " ";
            s2 += a2[i][5];
            s2 += " ";
            s2 += a2[i][6];
            if (a2[i][7] != null) {
              s2 += " ";
              s2 += a2[i][7];
            }
          }
        }
      }
    }
  }
  return s2 + " ";
}
var pathHandlers = {
  M: function(c2, p2, p0) {
    p2.x = p0.x = c2[0];
    p2.y = p0.y = c2[1];
    return ["M", p2.x, p2.y];
  },
  L: function(c2, p2) {
    p2.x = c2[0];
    p2.y = c2[1];
    return ["L", c2[0], c2[1]];
  },
  H: function(c2, p2) {
    p2.x = c2[0];
    return ["H", c2[0]];
  },
  V: function(c2, p2) {
    p2.y = c2[0];
    return ["V", c2[0]];
  },
  C: function(c2, p2) {
    p2.x = c2[4];
    p2.y = c2[5];
    return ["C", c2[0], c2[1], c2[2], c2[3], c2[4], c2[5]];
  },
  S: function(c2, p2) {
    p2.x = c2[2];
    p2.y = c2[3];
    return ["S", c2[0], c2[1], c2[2], c2[3]];
  },
  Q: function(c2, p2) {
    p2.x = c2[2];
    p2.y = c2[3];
    return ["Q", c2[0], c2[1], c2[2], c2[3]];
  },
  T: function(c2, p2) {
    p2.x = c2[0];
    p2.y = c2[1];
    return ["T", c2[0], c2[1]];
  },
  Z: function(c2, p2, p0) {
    p2.x = p0.x;
    p2.y = p0.y;
    return ["Z"];
  },
  A: function(c2, p2) {
    p2.x = c2[5];
    p2.y = c2[6];
    return ["A", c2[0], c2[1], c2[2], c2[3], c2[4], c2[5], c2[6]];
  }
};
var mlhvqtcsaz = "mlhvqtcsaz".split("");
for (i = 0, il = mlhvqtcsaz.length; i < il; ++i) {
  pathHandlers[mlhvqtcsaz[i]] = /* @__PURE__ */ (function(i2) {
    return function(c2, p2, p0) {
      if (i2 === "H") c2[0] = c2[0] + p2.x;
      else if (i2 === "V") c2[0] = c2[0] + p2.y;
      else if (i2 === "A") {
        c2[5] = c2[5] + p2.x;
        c2[6] = c2[6] + p2.y;
      } else {
        for (var j2 = 0, jl = c2.length; j2 < jl; ++j2) {
          c2[j2] = c2[j2] + (j2 % 2 ? p2.y : p2.x);
        }
      }
      return pathHandlers[i2](c2, p2, p0);
    };
  })(mlhvqtcsaz[i].toUpperCase());
}
var i;
var il;
extend(PathArray, {
  // Convert array to string
  toString() {
    return arrayToString(this);
  },
  // Move path string
  move(x2, y2) {
    var box = this.bbox();
    x2 -= box.x;
    y2 -= box.y;
    if (!isNaN(x2) && !isNaN(y2)) {
      for (var l2, i = this.length - 1; i >= 0; i--) {
        l2 = this[i][0];
        if (l2 === "M" || l2 === "L" || l2 === "T") {
          this[i][1] += x2;
          this[i][2] += y2;
        } else if (l2 === "H") {
          this[i][1] += x2;
        } else if (l2 === "V") {
          this[i][1] += y2;
        } else if (l2 === "C" || l2 === "S" || l2 === "Q") {
          this[i][1] += x2;
          this[i][2] += y2;
          this[i][3] += x2;
          this[i][4] += y2;
          if (l2 === "C") {
            this[i][5] += x2;
            this[i][6] += y2;
          }
        } else if (l2 === "A") {
          this[i][6] += x2;
          this[i][7] += y2;
        }
      }
    }
    return this;
  },
  // Resize path string
  size(width2, height2) {
    var box = this.bbox();
    var i, l2;
    box.width = box.width === 0 ? 1 : box.width;
    box.height = box.height === 0 ? 1 : box.height;
    for (i = this.length - 1; i >= 0; i--) {
      l2 = this[i][0];
      if (l2 === "M" || l2 === "L" || l2 === "T") {
        this[i][1] = (this[i][1] - box.x) * width2 / box.width + box.x;
        this[i][2] = (this[i][2] - box.y) * height2 / box.height + box.y;
      } else if (l2 === "H") {
        this[i][1] = (this[i][1] - box.x) * width2 / box.width + box.x;
      } else if (l2 === "V") {
        this[i][1] = (this[i][1] - box.y) * height2 / box.height + box.y;
      } else if (l2 === "C" || l2 === "S" || l2 === "Q") {
        this[i][1] = (this[i][1] - box.x) * width2 / box.width + box.x;
        this[i][2] = (this[i][2] - box.y) * height2 / box.height + box.y;
        this[i][3] = (this[i][3] - box.x) * width2 / box.width + box.x;
        this[i][4] = (this[i][4] - box.y) * height2 / box.height + box.y;
        if (l2 === "C") {
          this[i][5] = (this[i][5] - box.x) * width2 / box.width + box.x;
          this[i][6] = (this[i][6] - box.y) * height2 / box.height + box.y;
        }
      } else if (l2 === "A") {
        this[i][1] = this[i][1] * width2 / box.width;
        this[i][2] = this[i][2] * height2 / box.height;
        this[i][6] = (this[i][6] - box.x) * width2 / box.width + box.x;
        this[i][7] = (this[i][7] - box.y) * height2 / box.height + box.y;
      }
    }
    return this;
  },
  // Test if the passed path array use the same path data commands as this path array
  equalCommands(pathArray) {
    var i, il, equalCommands;
    pathArray = new PathArray(pathArray);
    equalCommands = this.length === pathArray.length;
    for (i = 0, il = this.length; equalCommands && i < il; i++) {
      equalCommands = this[i][0] === pathArray[i][0];
    }
    return equalCommands;
  },
  // Make path array morphable
  morph(pathArray) {
    pathArray = new PathArray(pathArray);
    if (this.equalCommands(pathArray)) {
      this.destination = pathArray;
    } else {
      this.destination = null;
    }
    return this;
  },
  // Get morphed path array at given position
  at(pos) {
    if (!this.destination) return this;
    var sourceArray = this;
    var destinationArray = this.destination.value;
    var array2 = [];
    var pathArray = new PathArray();
    var i, il, j2, jl;
    for (i = 0, il = sourceArray.length; i < il; i++) {
      array2[i] = [sourceArray[i][0]];
      for (j2 = 1, jl = sourceArray[i].length; j2 < jl; j2++) {
        array2[i][j2] = sourceArray[i][j2] + (destinationArray[i][j2] - sourceArray[i][j2]) * pos;
      }
      if (array2[i][0] === "A") {
        array2[i][4] = +(array2[i][4] !== 0);
        array2[i][5] = +(array2[i][5] !== 0);
      }
    }
    pathArray.value = array2;
    return pathArray;
  },
  // Absolutize and parse path to array
  parse(array2 = [["M", 0, 0]]) {
    if (array2 instanceof PathArray) return array2;
    var s2;
    var paramCnt = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
    if (typeof array2 === "string") {
      array2 = array2.replace(numbersWithDots, pathRegReplace).replace(pathLetters, " $& ").replace(hyphen, "$1 -").trim().split(delimiter);
    } else {
      array2 = array2.reduce(function(prev2, curr) {
        return [].concat.call(prev2, curr);
      }, []);
    }
    var result = [];
    var p2 = new Point();
    var p0 = new Point();
    var index = 0;
    var len = array2.length;
    do {
      if (isPathLetter.test(array2[index])) {
        s2 = array2[index];
        ++index;
      } else if (s2 === "M") {
        s2 = "L";
      } else if (s2 === "m") {
        s2 = "l";
      }
      result.push(
        pathHandlers[s2].call(
          null,
          array2.slice(index, index = index + paramCnt[s2.toUpperCase()]).map(parseFloat),
          p2,
          p0
        )
      );
    } while (len > index);
    return result;
  },
  // Get bounding box of path
  bbox() {
    parser().path.setAttribute("d", this.toString());
    return parser.nodes.path.getBBox();
  }
});
var Morphable = class {
  constructor(stepper) {
    this._stepper = stepper || new Ease("-");
    this._from = null;
    this._to = null;
    this._type = null;
    this._context = null;
    this._morphObj = null;
  }
  from(val) {
    if (val == null) {
      return this._from;
    }
    this._from = this._set(val);
    return this;
  }
  to(val) {
    if (val == null) {
      return this._to;
    }
    this._to = this._set(val);
    return this;
  }
  type(type) {
    if (type == null) {
      return this._type;
    }
    this._type = type;
    return this;
  }
  _set(value) {
    if (!this._type) {
      var type = typeof value;
      if (type === "number") {
        this.type(SVGNumber);
      } else if (type === "string") {
        if (Color.isColor(value)) {
          this.type(Color);
        } else if (delimiter.test(value)) {
          this.type(
            pathLetters.test(value) ? PathArray : SVGArray
          );
        } else if (numberAndUnit.test(value)) {
          this.type(SVGNumber);
        } else {
          this.type(NonMorphable);
        }
      } else if (morphableTypes.indexOf(value.constructor) > -1) {
        this.type(value.constructor);
      } else if (Array.isArray(value)) {
        this.type(SVGArray);
      } else if (type === "object") {
        this.type(ObjectBag);
      } else {
        this.type(NonMorphable);
      }
    }
    var result = new this._type(value);
    if (this._type === Color) {
      result = this._to ? result[this._to[4]]() : this._from ? result[this._from[4]]() : result;
    }
    result = result.toArray();
    this._morphObj = this._morphObj || new this._type();
    this._context = this._context || Array.apply(null, Array(result.length)).map(Object).map(function(o2) {
      o2.done = true;
      return o2;
    });
    return result;
  }
  stepper(stepper) {
    if (stepper == null) return this._stepper;
    this._stepper = stepper;
    return this;
  }
  done() {
    var complete = this._context.map(this._stepper.done).reduce(function(last, curr) {
      return last && curr;
    }, true);
    return complete;
  }
  at(pos) {
    var _this = this;
    return this._morphObj.fromArray(
      this._from.map(function(i, index) {
        return _this._stepper.step(i, _this._to[index], pos, _this._context[index], _this._context);
      })
    );
  }
};
var NonMorphable = class {
  constructor(...args) {
    this.init(...args);
  }
  init(val) {
    val = Array.isArray(val) ? val[0] : val;
    this.value = val;
    return this;
  }
  valueOf() {
    return this.value;
  }
  toArray() {
    return [this.value];
  }
};
var TransformBag = class _TransformBag {
  constructor(...args) {
    this.init(...args);
  }
  init(obj) {
    if (Array.isArray(obj)) {
      obj = {
        scaleX: obj[0],
        scaleY: obj[1],
        shear: obj[2],
        rotate: obj[3],
        translateX: obj[4],
        translateY: obj[5],
        originX: obj[6],
        originY: obj[7]
      };
    }
    Object.assign(this, _TransformBag.defaults, obj);
    return this;
  }
  toArray() {
    var v2 = this;
    return [
      v2.scaleX,
      v2.scaleY,
      v2.shear,
      v2.rotate,
      v2.translateX,
      v2.translateY,
      v2.originX,
      v2.originY
    ];
  }
};
TransformBag.defaults = {
  scaleX: 1,
  scaleY: 1,
  shear: 0,
  rotate: 0,
  translateX: 0,
  translateY: 0,
  originX: 0,
  originY: 0
};
var ObjectBag = class {
  constructor(...args) {
    this.init(...args);
  }
  init(objOrArr) {
    this.values = [];
    if (Array.isArray(objOrArr)) {
      this.values = objOrArr;
      return;
    }
    objOrArr = objOrArr || {};
    var entries = [];
    for (const i in objOrArr) {
      entries.push([i, objOrArr[i]]);
    }
    entries.sort((a2, b2) => {
      return a2[0] - b2[0];
    });
    this.values = entries.reduce((last, curr) => last.concat(curr), []);
    return this;
  }
  valueOf() {
    var obj = {};
    var arr = this.values;
    for (var i = 0, len = arr.length; i < len; i += 2) {
      obj[arr[i]] = arr[i + 1];
    }
    return obj;
  }
  toArray() {
    return this.values;
  }
};
var morphableTypes = [
  NonMorphable,
  TransformBag,
  ObjectBag
];
function registerMorphableType(type = []) {
  morphableTypes.push(...[].concat(type));
}
function makeMorphable() {
  extend(morphableTypes, {
    to(val) {
      return new Morphable().type(this.constructor).from(this.valueOf()).to(val);
    },
    fromArray(arr) {
      this.init(arr);
      return this;
    }
  });
}
var Path = class extends Shape$1 {
  // Initialize node
  constructor(node) {
    super(nodeOrNew("path", node), node);
  }
  // Get array
  array() {
    return this._array || (this._array = new PathArray(this.attr("d")));
  }
  // Plot new path
  plot(d2) {
    return d2 == null ? this.array() : this.clear().attr("d", typeof d2 === "string" ? d2 : this._array = new PathArray(d2));
  }
  // Clear array cache
  clear() {
    delete this._array;
    return this;
  }
  // Move by left top corner
  move(x2, y2) {
    return this.attr("d", this.array().move(x2, y2));
  }
  // Move by left top corner over x-axis
  x(x2) {
    return x2 == null ? this.bbox().x : this.move(x2, this.bbox().y);
  }
  // Move by left top corner over y-axis
  y(y2) {
    return y2 == null ? this.bbox().y : this.move(this.bbox().x, y2);
  }
  // Set element size to given width and height
  size(width2, height2) {
    var p2 = proportionalSize(this, width2, height2);
    return this.attr("d", this.array().size(p2.width, p2.height));
  }
  // Set width of element
  width(width2) {
    return width2 == null ? this.bbox().width : this.size(width2, this.bbox().height);
  }
  // Set height of element
  height(height2) {
    return height2 == null ? this.bbox().height : this.size(this.bbox().width, height2);
  }
  targets() {
    return baseFind('svg textpath [href*="' + this.id() + '"]');
  }
};
Path.prototype.MorphArray = PathArray;
registerMethods({
  Container: {
    // Create a wrapped path element
    path: wrapWithAttrCheck(function(d2) {
      return this.put(new Path()).plot(d2 || new PathArray());
    })
  }
});
register(Path, "Path");
function array() {
  return this._array || (this._array = new PointArray(this.attr("points")));
}
function plot(p2) {
  return p2 == null ? this.array() : this.clear().attr("points", typeof p2 === "string" ? p2 : this._array = new PointArray(p2));
}
function clear() {
  delete this._array;
  return this;
}
function move(x2, y2) {
  return this.attr("points", this.array().move(x2, y2));
}
function size(width2, height2) {
  const p2 = proportionalSize(this, width2, height2);
  return this.attr("points", this.array().size(p2.width, p2.height));
}
var poly = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  array,
  plot,
  clear,
  move,
  size
});
var Polygon = class extends Shape$1 {
  // Initialize node
  constructor(node) {
    super(nodeOrNew("polygon", node), node);
  }
};
registerMethods({
  Container: {
    // Create a wrapped polygon element
    polygon: wrapWithAttrCheck(function(p2) {
      return this.put(new Polygon()).plot(p2 || new PointArray());
    })
  }
});
extend(Polygon, pointed);
extend(Polygon, poly);
register(Polygon, "Polygon");
var Polyline = class extends Shape$1 {
  // Initialize node
  constructor(node) {
    super(nodeOrNew("polyline", node), node);
  }
};
registerMethods({
  Container: {
    // Create a wrapped polygon element
    polyline: wrapWithAttrCheck(function(p2) {
      return this.put(new Polyline()).plot(p2 || new PointArray());
    })
  }
});
extend(Polyline, pointed);
extend(Polyline, poly);
register(Polyline, "Polyline");
var Rect = class extends Shape$1 {
  // Initialize node
  constructor(node) {
    super(nodeOrNew("rect", node), node);
  }
};
extend(Rect, { rx, ry });
registerMethods({
  Container: {
    // Create a rect element
    rect: wrapWithAttrCheck(function(width2, height2) {
      return this.put(new Rect()).size(width2, height2);
    })
  }
});
register(Rect, "Rect");
var Queue = class {
  constructor() {
    this._first = null;
    this._last = null;
  }
  push(value) {
    var item = value.next ? value : { value, next: null, prev: null };
    if (this._last) {
      item.prev = this._last;
      this._last.next = item;
      this._last = item;
    } else {
      this._last = item;
      this._first = item;
    }
    return item;
  }
  shift() {
    var remove = this._first;
    if (!remove) return null;
    this._first = remove.next;
    if (this._first) this._first.prev = null;
    this._last = this._first ? this._last : null;
    return remove.value;
  }
  // Shows us the first item in the list
  first() {
    return this._first && this._first.value;
  }
  // Shows us the last item in the list
  last() {
    return this._last && this._last.value;
  }
  // Removes the item that was returned from the push
  remove(item) {
    if (item.prev) item.prev.next = item.next;
    if (item.next) item.next.prev = item.prev;
    if (item === this._last) this._last = item.prev;
    if (item === this._first) this._first = item.next;
    item.prev = null;
    item.next = null;
  }
};
var Animator = {
  nextDraw: null,
  frames: new Queue(),
  timeouts: new Queue(),
  immediates: new Queue(),
  timer: () => globals.window.performance || globals.window.Date,
  transforms: [],
  frame(fn) {
    var node = Animator.frames.push({ run: fn });
    if (Animator.nextDraw === null) {
      Animator.nextDraw = globals.window.requestAnimationFrame(Animator._draw);
    }
    return node;
  },
  timeout(fn, delay) {
    delay = delay || 0;
    var time = Animator.timer().now() + delay;
    var node = Animator.timeouts.push({ run: fn, time });
    if (Animator.nextDraw === null) {
      Animator.nextDraw = globals.window.requestAnimationFrame(Animator._draw);
    }
    return node;
  },
  immediate(fn) {
    var node = Animator.immediates.push(fn);
    if (Animator.nextDraw === null) {
      Animator.nextDraw = globals.window.requestAnimationFrame(Animator._draw);
    }
    return node;
  },
  cancelFrame(node) {
    node != null && Animator.frames.remove(node);
  },
  clearTimeout(node) {
    node != null && Animator.timeouts.remove(node);
  },
  cancelImmediate(node) {
    node != null && Animator.immediates.remove(node);
  },
  _draw(now) {
    var nextTimeout = null;
    var lastTimeout = Animator.timeouts.last();
    while (nextTimeout = Animator.timeouts.shift()) {
      if (now >= nextTimeout.time) {
        nextTimeout.run();
      } else {
        Animator.timeouts.push(nextTimeout);
      }
      if (nextTimeout === lastTimeout) break;
    }
    var nextFrame = null;
    var lastFrame = Animator.frames.last();
    while (nextFrame !== lastFrame && (nextFrame = Animator.frames.shift())) {
      nextFrame.run(now);
    }
    var nextImmediate = null;
    while (nextImmediate = Animator.immediates.shift()) {
      nextImmediate();
    }
    Animator.nextDraw = Animator.timeouts.first() || Animator.frames.first() ? globals.window.requestAnimationFrame(Animator._draw) : null;
  }
};
var makeSchedule = function(runnerInfo) {
  var start = runnerInfo.start;
  var duration = runnerInfo.runner.duration();
  var end = start + duration;
  return { start, duration, end, runner: runnerInfo.runner };
};
var defaultSource = function() {
  const w2 = globals.window;
  return (w2.performance || w2.Date).now();
};
var Timeline = class extends EventTarget {
  // Construct a new timeline on the given element
  constructor(timeSource = defaultSource) {
    super();
    this._timeSource = timeSource;
    this._startTime = 0;
    this._speed = 1;
    this._persist = 0;
    this._nextFrame = null;
    this._paused = true;
    this._runners = [];
    this._runnerIds = [];
    this._lastRunnerId = -1;
    this._time = 0;
    this._lastSourceTime = 0;
    this._lastStepTime = 0;
    this._step = this._stepFn.bind(this, false);
    this._stepImmediate = this._stepFn.bind(this, true);
  }
  // schedules a runner on the timeline
  schedule(runner, delay, when) {
    if (runner == null) {
      return this._runners.map(makeSchedule);
    }
    var absoluteStartTime = 0;
    var endTime = this.getEndTime();
    delay = delay || 0;
    if (when == null || when === "last" || when === "after") {
      absoluteStartTime = endTime;
    } else if (when === "absolute" || when === "start") {
      absoluteStartTime = delay;
      delay = 0;
    } else if (when === "now") {
      absoluteStartTime = this._time;
    } else if (when === "relative") {
      const runnerInfo2 = this._runners[runner.id];
      if (runnerInfo2) {
        absoluteStartTime = runnerInfo2.start + delay;
        delay = 0;
      }
    } else {
      throw new Error('Invalid value for the "when" parameter');
    }
    runner.unschedule();
    runner.timeline(this);
    const persist = runner.persist();
    const runnerInfo = {
      persist: persist === null ? this._persist : persist,
      start: absoluteStartTime + delay,
      runner
    };
    this._lastRunnerId = runner.id;
    this._runners.push(runnerInfo);
    this._runners.sort((a2, b2) => a2.start - b2.start);
    this._runnerIds = this._runners.map((info) => info.runner.id);
    this.updateTime()._continue();
    return this;
  }
  // Remove the runner from this timeline
  unschedule(runner) {
    var index = this._runnerIds.indexOf(runner.id);
    if (index < 0) return this;
    this._runners.splice(index, 1);
    this._runnerIds.splice(index, 1);
    runner.timeline(null);
    return this;
  }
  // Calculates the end of the timeline
  getEndTime() {
    var lastRunnerInfo = this._runners[this._runnerIds.indexOf(this._lastRunnerId)];
    var lastDuration = lastRunnerInfo ? lastRunnerInfo.runner.duration() : 0;
    var lastStartTime = lastRunnerInfo ? lastRunnerInfo.start : 0;
    return lastStartTime + lastDuration;
  }
  getEndTimeOfTimeline() {
    let lastEndTime = 0;
    for (var i = 0; i < this._runners.length; i++) {
      const runnerInfo = this._runners[i];
      var duration = runnerInfo ? runnerInfo.runner.duration() : 0;
      var startTime = runnerInfo ? runnerInfo.start : 0;
      const endTime = startTime + duration;
      if (endTime > lastEndTime) {
        lastEndTime = endTime;
      }
    }
    return lastEndTime;
  }
  // Makes sure, that after pausing the time doesn't jump
  updateTime() {
    if (!this.active()) {
      this._lastSourceTime = this._timeSource();
    }
    return this;
  }
  play() {
    this._paused = false;
    return this.updateTime()._continue();
  }
  pause() {
    this._paused = true;
    return this._continue();
  }
  stop() {
    this.time(0);
    return this.pause();
  }
  finish() {
    this.time(this.getEndTimeOfTimeline() + 1);
    return this.pause();
  }
  speed(speed) {
    if (speed == null) return this._speed;
    this._speed = speed;
    return this;
  }
  reverse(yes) {
    var currentSpeed = this.speed();
    if (yes == null) return this.speed(-currentSpeed);
    var positive = Math.abs(currentSpeed);
    return this.speed(yes ? positive : -positive);
  }
  seek(dt) {
    return this.time(this._time + dt);
  }
  time(time) {
    if (time == null) return this._time;
    this._time = time;
    return this._continue(true);
  }
  persist(dtOrForever) {
    if (dtOrForever == null) return this._persist;
    this._persist = dtOrForever;
    return this;
  }
  source(fn) {
    if (fn == null) return this._timeSource;
    this._timeSource = fn;
    return this;
  }
  _stepFn(immediateStep = false) {
    var time = this._timeSource();
    var dtSource = time - this._lastSourceTime;
    if (immediateStep) dtSource = 0;
    var dtTime = this._speed * dtSource + (this._time - this._lastStepTime);
    this._lastSourceTime = time;
    if (!immediateStep) {
      this._time += dtTime;
      this._time = this._time < 0 ? 0 : this._time;
    }
    this._lastStepTime = this._time;
    this.fire("time", this._time);
    for (var k2 = this._runners.length; k2--; ) {
      const runnerInfo = this._runners[k2];
      const runner = runnerInfo.runner;
      const dtToStart = this._time - runnerInfo.start;
      if (dtToStart <= 0) {
        runner.reset();
      }
    }
    var runnersLeft = false;
    for (var i = 0, len = this._runners.length; i < len; i++) {
      const runnerInfo = this._runners[i];
      const runner = runnerInfo.runner;
      let dt = dtTime;
      const dtToStart = this._time - runnerInfo.start;
      if (dtToStart <= 0) {
        runnersLeft = true;
        continue;
      } else if (dtToStart < dt) {
        dt = dtToStart;
      }
      if (!runner.active()) continue;
      var finished = runner.step(dt).done;
      if (!finished) {
        runnersLeft = true;
      } else if (runnerInfo.persist !== true) {
        var endTime = runner.duration() - runner.time() + this._time;
        if (endTime + runnerInfo.persist < this._time) {
          runner.unschedule();
          --i;
          --len;
        }
      }
    }
    if (runnersLeft && !(this._speed < 0 && this._time === 0) || this._runnerIds.length && this._speed < 0 && this._time > 0) {
      this._continue();
    } else {
      this.pause();
      this.fire("finished");
    }
    return this;
  }
  // Checks if we are running and continues the animation
  _continue(immediateStep = false) {
    Animator.cancelFrame(this._nextFrame);
    this._nextFrame = null;
    if (immediateStep) return this._stepImmediate();
    if (this._paused) return this;
    this._nextFrame = Animator.frame(this._step);
    return this;
  }
  active() {
    return !!this._nextFrame;
  }
};
registerMethods({
  Element: {
    timeline: function(timeline2) {
      if (timeline2 == null) {
        this._timeline = this._timeline || new Timeline();
        return this._timeline;
      } else {
        this._timeline = timeline2;
        return this;
      }
    }
  }
});
var Runner = class _Runner extends EventTarget {
  constructor(options) {
    super();
    this.id = _Runner.id++;
    options = options == null ? timeline.duration : options;
    options = typeof options === "function" ? new Controller(options) : options;
    this._element = null;
    this._timeline = null;
    this.done = false;
    this._queue = [];
    this._duration = typeof options === "number" && options;
    this._isDeclarative = options instanceof Controller;
    this._stepper = this._isDeclarative ? options : new Ease();
    this._history = {};
    this.enabled = true;
    this._time = 0;
    this._lastTime = 0;
    this._reseted = true;
    this.transforms = new Matrix();
    this.transformId = 1;
    this._haveReversed = false;
    this._reverse = false;
    this._loopsDone = 0;
    this._swing = false;
    this._wait = 0;
    this._times = 1;
    this._frameId = null;
    this._persist = this._isDeclarative ? true : null;
  }
  /*
  Runner Definitions
  ==================
  These methods help us define the runtime behaviour of the Runner or they
  help us make new runners from the current runner
  */
  element(element) {
    if (element == null) return this._element;
    this._element = element;
    element._prepareRunner();
    return this;
  }
  timeline(timeline2) {
    if (typeof timeline2 === "undefined") return this._timeline;
    this._timeline = timeline2;
    return this;
  }
  animate(duration, delay, when) {
    var o2 = _Runner.sanitise(duration, delay, when);
    var runner = new _Runner(o2.duration);
    if (this._timeline) runner.timeline(this._timeline);
    if (this._element) runner.element(this._element);
    return runner.loop(o2).schedule(o2.delay, o2.when);
  }
  schedule(timeline2, delay, when) {
    if (!(timeline2 instanceof Timeline)) {
      when = delay;
      delay = timeline2;
      timeline2 = this.timeline();
    }
    if (!timeline2) {
      throw Error("Runner cannot be scheduled without timeline");
    }
    timeline2.schedule(this, delay, when);
    return this;
  }
  unschedule() {
    var timeline2 = this.timeline();
    timeline2 && timeline2.unschedule(this);
    return this;
  }
  loop(times, swing, wait) {
    if (typeof times === "object") {
      swing = times.swing;
      wait = times.wait;
      times = times.times;
    }
    this._times = times || Infinity;
    this._swing = swing || false;
    this._wait = wait || 0;
    if (this._times === true) {
      this._times = Infinity;
    }
    return this;
  }
  delay(delay) {
    return this.animate(0, delay);
  }
  /*
  Basic Functionality
  ===================
  These methods allow us to attach basic functions to the runner directly
  */
  queue(initFn, runFn, retargetFn, isTransform) {
    this._queue.push({
      initialiser: initFn || noop,
      runner: runFn || noop,
      retarget: retargetFn,
      isTransform,
      initialised: false,
      finished: false
    });
    var timeline2 = this.timeline();
    timeline2 && this.timeline()._continue();
    return this;
  }
  during(fn) {
    return this.queue(null, fn);
  }
  after(fn) {
    return this.on("finished", fn);
  }
  /*
  Runner animation methods
  ========================
  Control how the animation plays
  */
  time(time) {
    if (time == null) {
      return this._time;
    }
    const dt = time - this._time;
    this.step(dt);
    return this;
  }
  duration() {
    return this._times * (this._wait + this._duration) - this._wait;
  }
  loops(p2) {
    var loopDuration = this._duration + this._wait;
    if (p2 == null) {
      var loopsDone = Math.floor(this._time / loopDuration);
      var relativeTime = this._time - loopsDone * loopDuration;
      var position2 = relativeTime / this._duration;
      return Math.min(loopsDone + position2, this._times);
    }
    var whole = Math.floor(p2);
    var partial = p2 % 1;
    var time = loopDuration * whole + this._duration * partial;
    return this.time(time);
  }
  persist(dtOrForever) {
    if (dtOrForever == null) return this._persist;
    this._persist = dtOrForever;
    return this;
  }
  position(p2) {
    var x2 = this._time;
    var d2 = this._duration;
    var w2 = this._wait;
    var t2 = this._times;
    var s2 = this._swing;
    var r2 = this._reverse;
    var position2;
    if (p2 == null) {
      const f2 = function(x3) {
        var swinging = s2 * Math.floor(x3 % (2 * (w2 + d2)) / (w2 + d2));
        var backwards = swinging && !r2 || !swinging && r2;
        var uncliped = Math.pow(-1, backwards) * (x3 % (w2 + d2)) / d2 + backwards;
        var clipped = Math.max(Math.min(uncliped, 1), 0);
        return clipped;
      };
      var endTime = t2 * (w2 + d2) - w2;
      position2 = x2 <= 0 ? Math.round(f2(1e-5)) : x2 < endTime ? f2(x2) : Math.round(f2(endTime - 1e-5));
      return position2;
    }
    var loopsDone = Math.floor(this.loops());
    var swingForward = s2 && loopsDone % 2 === 0;
    var forwards = swingForward && !r2 || r2 && swingForward;
    position2 = loopsDone + (forwards ? p2 : 1 - p2);
    return this.loops(position2);
  }
  progress(p2) {
    if (p2 == null) {
      return Math.min(1, this._time / this.duration());
    }
    return this.time(p2 * this.duration());
  }
  step(dt) {
    if (!this.enabled) return this;
    dt = dt == null ? 16 : dt;
    this._time += dt;
    var position2 = this.position();
    var running = this._lastPosition !== position2 && this._time >= 0;
    this._lastPosition = position2;
    var duration = this.duration();
    var justStarted = this._lastTime <= 0 && this._time > 0;
    var justFinished = this._lastTime < duration && this._time >= duration;
    this._lastTime = this._time;
    if (justStarted) {
      this.fire("start", this);
    }
    var declarative = this._isDeclarative;
    this.done = !declarative && !justFinished && this._time >= duration;
    this._reseted = false;
    if (running || declarative) {
      this._initialise(running);
      this.transforms = new Matrix();
      var converged = this._run(declarative ? dt : position2);
      this.fire("step", this);
    }
    this.done = this.done || converged && declarative;
    if (justFinished) {
      this.fire("finished", this);
    }
    return this;
  }
  reset() {
    if (this._reseted) return this;
    this.time(0);
    this._reseted = true;
    return this;
  }
  finish() {
    return this.step(Infinity);
  }
  reverse(reverse) {
    this._reverse = reverse == null ? !this._reverse : reverse;
    return this;
  }
  ease(fn) {
    this._stepper = new Ease(fn);
    return this;
  }
  active(enabled) {
    if (enabled == null) return this.enabled;
    this.enabled = enabled;
    return this;
  }
  /*
  Private Methods
  ===============
  Methods that shouldn't be used externally
  */
  // Save a morpher to the morpher list so that we can retarget it later
  _rememberMorpher(method, morpher) {
    this._history[method] = {
      morpher,
      caller: this._queue[this._queue.length - 1]
    };
    if (this._isDeclarative) {
      var timeline2 = this.timeline();
      timeline2 && timeline2.play();
    }
  }
  // Try to set the target for a morpher if the morpher exists, otherwise
  // do nothing and return false
  _tryRetarget(method, target, extra) {
    if (this._history[method]) {
      if (!this._history[method].caller.initialised) {
        const index = this._queue.indexOf(this._history[method].caller);
        this._queue.splice(index, 1);
        return false;
      }
      if (this._history[method].caller.retarget) {
        this._history[method].caller.retarget(target, extra);
      } else {
        this._history[method].morpher.to(target);
      }
      this._history[method].caller.finished = false;
      var timeline2 = this.timeline();
      timeline2 && timeline2.play();
      return true;
    }
    return false;
  }
  // Run each initialise function in the runner if required
  _initialise(running) {
    if (!running && !this._isDeclarative) return;
    for (var i = 0, len = this._queue.length; i < len; ++i) {
      var current = this._queue[i];
      var needsIt = this._isDeclarative || !current.initialised && running;
      running = !current.finished;
      if (needsIt && running) {
        current.initialiser.call(this);
        current.initialised = true;
      }
    }
  }
  // Run each run function for the position or dt given
  _run(positionOrDt) {
    var allfinished = true;
    for (var i = 0, len = this._queue.length; i < len; ++i) {
      var current = this._queue[i];
      var converged = current.runner.call(this, positionOrDt);
      current.finished = current.finished || converged === true;
      allfinished = allfinished && current.finished;
    }
    return allfinished;
  }
  addTransform(transform2, index) {
    this.transforms.lmultiplyO(transform2);
    return this;
  }
  clearTransform() {
    this.transforms = new Matrix();
    return this;
  }
  // TODO: Keep track of all transformations so that deletion is faster
  clearTransformsFromQueue() {
    if (!this.done || !this._timeline || !this._timeline._runnerIds.includes(this.id)) {
      this._queue = this._queue.filter((item) => {
        return !item.isTransform;
      });
    }
  }
  static sanitise(duration, delay, when) {
    var times = 1;
    var swing = false;
    var wait = 0;
    duration = duration || timeline.duration;
    delay = delay || timeline.delay;
    when = when || "last";
    if (typeof duration === "object" && !(duration instanceof Stepper)) {
      delay = duration.delay || delay;
      when = duration.when || when;
      swing = duration.swing || swing;
      times = duration.times || times;
      wait = duration.wait || wait;
      duration = duration.duration || timeline.duration;
    }
    return {
      duration,
      delay,
      swing,
      times,
      wait,
      when
    };
  }
};
Runner.id = 0;
var FakeRunner = class {
  constructor(transforms2 = new Matrix(), id = -1, done = true) {
    this.transforms = transforms2;
    this.id = id;
    this.done = done;
  }
  clearTransformsFromQueue() {
  }
};
extend([Runner, FakeRunner], {
  mergeWith(runner) {
    return new FakeRunner(
      runner.transforms.lmultiply(this.transforms),
      runner.id
    );
  }
});
var lmultiply = (last, curr) => last.lmultiplyO(curr);
var getRunnerTransform = (runner) => runner.transforms;
function mergeTransforms() {
  const runners = this._transformationRunners.runners;
  const netTransform = runners.map(getRunnerTransform).reduce(lmultiply, new Matrix());
  this.transform(netTransform);
  this._transformationRunners.merge();
  if (this._transformationRunners.length() === 1) {
    this._frameId = null;
  }
}
var RunnerArray = class {
  constructor() {
    this.runners = [];
    this.ids = [];
  }
  add(runner) {
    if (this.runners.includes(runner)) return;
    const id = runner.id + 1;
    this.runners.push(runner);
    this.ids.push(id);
    return this;
  }
  getByID(id) {
    return this.runners[this.ids.indexOf(id + 1)];
  }
  remove(id) {
    const index = this.ids.indexOf(id + 1);
    this.ids.splice(index, 1);
    this.runners.splice(index, 1);
    return this;
  }
  merge() {
    let lastRunner = null;
    this.runners.forEach((runner, i) => {
      const condition = lastRunner && runner.done && lastRunner.done && (!runner._timeline || !runner._timeline._runnerIds.includes(runner.id)) && (!lastRunner._timeline || !lastRunner._timeline._runnerIds.includes(lastRunner.id));
      if (condition) {
        this.remove(runner.id);
        this.edit(lastRunner.id, runner.mergeWith(lastRunner));
      }
      lastRunner = runner;
    });
    return this;
  }
  edit(id, newRunner) {
    const index = this.ids.indexOf(id + 1);
    this.ids.splice(index, 1, id + 1);
    this.runners.splice(index, 1, newRunner);
    return this;
  }
  length() {
    return this.ids.length;
  }
  clearBefore(id) {
    const deleteCnt = this.ids.indexOf(id + 1) || 1;
    this.ids.splice(0, deleteCnt, 0);
    this.runners.splice(0, deleteCnt, new FakeRunner()).forEach((r2) => r2.clearTransformsFromQueue());
    return this;
  }
};
registerMethods({
  Element: {
    animate(duration, delay, when) {
      var o2 = Runner.sanitise(duration, delay, when);
      var timeline2 = this.timeline();
      return new Runner(o2.duration).loop(o2).element(this).timeline(timeline2.play()).schedule(o2.delay, o2.when);
    },
    delay(by, when) {
      return this.animate(0, by, when);
    },
    // this function searches for all runners on the element and deletes the ones
    // which run before the current one. This is because absolute transformations
    // overwfrite anything anyway so there is no need to waste time computing
    // other runners
    _clearTransformRunnersBefore(currentRunner) {
      this._transformationRunners.clearBefore(currentRunner.id);
    },
    _currentTransform(current) {
      return this._transformationRunners.runners.filter((runner) => runner.id <= current.id).map(getRunnerTransform).reduce(lmultiply, new Matrix());
    },
    _addRunner(runner) {
      this._transformationRunners.add(runner);
      Animator.cancelImmediate(this._frameId);
      this._frameId = Animator.immediate(mergeTransforms.bind(this));
    },
    _prepareRunner() {
      if (this._frameId == null) {
        this._transformationRunners = new RunnerArray().add(new FakeRunner(new Matrix(this)));
      }
    }
  }
});
extend(Runner, {
  attr(a2, v2) {
    return this.styleAttr("attr", a2, v2);
  },
  // Add animatable styles
  css(s2, v2) {
    return this.styleAttr("css", s2, v2);
  },
  styleAttr(type, name, val) {
    if (typeof name === "object") {
      for (var key in name) {
        this.styleAttr(type, key, name[key]);
      }
      return this;
    }
    var morpher = new Morphable(this._stepper).to(val);
    this.queue(function() {
      morpher = morpher.from(this.element()[type](name));
    }, function(pos) {
      this.element()[type](name, morpher.at(pos));
      return morpher.done();
    });
    return this;
  },
  zoom(level, point2) {
    if (this._tryRetarget("zoom", to, point2)) return this;
    var morpher = new Morphable(this._stepper).to(new SVGNumber(level));
    this.queue(function() {
      morpher = morpher.from(this.element().zoom());
    }, function(pos) {
      this.element().zoom(morpher.at(pos), point2);
      return morpher.done();
    }, function(newLevel, newPoint) {
      point2 = newPoint;
      morpher.to(newLevel);
    });
    this._rememberMorpher("zoom", morpher);
    return this;
  },
  /**
   ** absolute transformations
   **/
  //
  // M v -----|-----(D M v = F v)------|----->  T v
  //
  // 1. define the final state (T) and decompose it (once)
  //    t = [tx, ty, the, lam, sy, sx]
  // 2. on every frame: pull the current state of all previous transforms
  //    (M - m can change)
  //   and then write this as m = [tx0, ty0, the0, lam0, sy0, sx0]
  // 3. Find the interpolated matrix F(pos) = m + pos * (t - m)
  //   - Note F(0) = M
  //   - Note F(1) = T
  // 4. Now you get the delta matrix as a result: D = F * inv(M)
  transform(transforms2, relative, affine) {
    relative = transforms2.relative || relative;
    if (this._isDeclarative && !relative && this._tryRetarget("transform", transforms2)) {
      return this;
    }
    var isMatrix = Matrix.isMatrixLike(transforms2);
    affine = transforms2.affine != null ? transforms2.affine : affine != null ? affine : !isMatrix;
    const morpher = new Morphable(this._stepper).type(affine ? TransformBag : Matrix);
    let origin;
    let element;
    let current;
    let currentAngle;
    let startTransform;
    function setup() {
      element = element || this.element();
      origin = origin || getOrigin(transforms2, element);
      startTransform = new Matrix(relative ? void 0 : element);
      element._addRunner(this);
      if (!relative) {
        element._clearTransformRunnersBefore(this);
      }
    }
    function run(pos) {
      if (!relative) this.clearTransform();
      const { x: x2, y: y2 } = new Point(origin).transform(element._currentTransform(this));
      let target = new Matrix({ ...transforms2, origin: [x2, y2] });
      let start = this._isDeclarative && current ? current : startTransform;
      if (affine) {
        target = target.decompose(x2, y2);
        start = start.decompose(x2, y2);
        const rTarget = target.rotate;
        const rCurrent = start.rotate;
        const possibilities = [rTarget - 360, rTarget, rTarget + 360];
        const distances = possibilities.map((a2) => Math.abs(a2 - rCurrent));
        const shortest = Math.min(...distances);
        const index = distances.indexOf(shortest);
        target.rotate = possibilities[index];
      }
      if (relative) {
        if (!isMatrix) {
          target.rotate = transforms2.rotate || 0;
        }
        if (this._isDeclarative && currentAngle) {
          start.rotate = currentAngle;
        }
      }
      morpher.from(start);
      morpher.to(target);
      const affineParameters = morpher.at(pos);
      currentAngle = affineParameters.rotate;
      current = new Matrix(affineParameters);
      this.addTransform(current);
      element._addRunner(this);
      return morpher.done();
    }
    function retarget(newTransforms) {
      if ((newTransforms.origin || "center").toString() !== (transforms2.origin || "center").toString()) {
        origin = getOrigin(transforms2, element);
      }
      transforms2 = { ...newTransforms, origin };
    }
    this.queue(setup, run, retarget, true);
    this._isDeclarative && this._rememberMorpher("transform", morpher);
    return this;
  },
  // Animatable x-axis
  x(x2, relative) {
    return this._queueNumber("x", x2);
  },
  // Animatable y-axis
  y(y2) {
    return this._queueNumber("y", y2);
  },
  dx(x2 = 0) {
    return this._queueNumberDelta("x", x2);
  },
  dy(y2 = 0) {
    return this._queueNumberDelta("y", y2);
  },
  dmove(x2, y2) {
    return this.dx(x2).dy(y2);
  },
  _queueNumberDelta(method, to2) {
    to2 = new SVGNumber(to2);
    if (this._tryRetarget(method, to2)) return this;
    var morpher = new Morphable(this._stepper).to(to2);
    var from2 = null;
    this.queue(function() {
      from2 = this.element()[method]();
      morpher.from(from2);
      morpher.to(from2 + to2);
    }, function(pos) {
      this.element()[method](morpher.at(pos));
      return morpher.done();
    }, function(newTo) {
      morpher.to(from2 + new SVGNumber(newTo));
    });
    this._rememberMorpher(method, morpher);
    return this;
  },
  _queueObject(method, to2) {
    if (this._tryRetarget(method, to2)) return this;
    var morpher = new Morphable(this._stepper).to(to2);
    this.queue(function() {
      morpher.from(this.element()[method]());
    }, function(pos) {
      this.element()[method](morpher.at(pos));
      return morpher.done();
    });
    this._rememberMorpher(method, morpher);
    return this;
  },
  _queueNumber(method, value) {
    return this._queueObject(method, new SVGNumber(value));
  },
  // Animatable center x-axis
  cx(x2) {
    return this._queueNumber("cx", x2);
  },
  // Animatable center y-axis
  cy(y2) {
    return this._queueNumber("cy", y2);
  },
  // Add animatable move
  move(x2, y2) {
    return this.x(x2).y(y2);
  },
  // Add animatable center
  center(x2, y2) {
    return this.cx(x2).cy(y2);
  },
  // Add animatable size
  size(width2, height2) {
    var box;
    if (!width2 || !height2) {
      box = this._element.bbox();
    }
    if (!width2) {
      width2 = box.width / box.height * height2;
    }
    if (!height2) {
      height2 = box.height / box.width * width2;
    }
    return this.width(width2).height(height2);
  },
  // Add animatable width
  width(width2) {
    return this._queueNumber("width", width2);
  },
  // Add animatable height
  height(height2) {
    return this._queueNumber("height", height2);
  },
  // Add animatable plot
  plot(a2, b2, c2, d2) {
    if (arguments.length === 4) {
      return this.plot([a2, b2, c2, d2]);
    }
    if (this._tryRetarget("plot", a2)) return this;
    var morpher = new Morphable(this._stepper).type(this._element.MorphArray).to(a2);
    this.queue(function() {
      morpher.from(this._element.array());
    }, function(pos) {
      this._element.plot(morpher.at(pos));
      return morpher.done();
    });
    this._rememberMorpher("plot", morpher);
    return this;
  },
  // Add leading method
  leading(value) {
    return this._queueNumber("leading", value);
  },
  // Add animatable viewbox
  viewbox(x2, y2, width2, height2) {
    return this._queueObject("viewbox", new Box(x2, y2, width2, height2));
  },
  update(o2) {
    if (typeof o2 !== "object") {
      return this.update({
        offset: arguments[0],
        color: arguments[1],
        opacity: arguments[2]
      });
    }
    if (o2.opacity != null) this.attr("stop-opacity", o2.opacity);
    if (o2.color != null) this.attr("stop-color", o2.color);
    if (o2.offset != null) this.attr("offset", o2.offset);
    return this;
  }
});
extend(Runner, { rx, ry, from, to });
register(Runner, "Runner");
var Svg = class extends Container {
  constructor(node) {
    super(nodeOrNew("svg", node), node);
    this.namespace();
  }
  isRoot() {
    return !this.node.parentNode || !(this.node.parentNode instanceof globals.window.SVGElement) || this.node.parentNode.nodeName === "#document";
  }
  // Check if this is a root svg
  // If not, call docs from this element
  root() {
    if (this.isRoot()) return this;
    return super.root();
  }
  // Add namespaces
  namespace() {
    if (!this.isRoot()) return this.root().namespace();
    return this.attr({ xmlns: ns, version: "1.1" }).attr("xmlns:xlink", xlink, xmlns).attr("xmlns:svgjs", svgjs, xmlns);
  }
  // Creates and returns defs element
  defs() {
    if (!this.isRoot()) return this.root().defs();
    return adopt(this.node.querySelector("defs")) || this.put(new Defs());
  }
  // custom parent method
  parent(type) {
    if (this.isRoot()) {
      return this.node.parentNode.nodeName === "#document" ? null : adopt(this.node.parentNode);
    }
    return super.parent(type);
  }
  clear() {
    while (this.node.hasChildNodes()) {
      this.node.removeChild(this.node.lastChild);
    }
    delete this._defs;
    return this;
  }
};
registerMethods({
  Container: {
    // Create nested svg document
    nested: wrapWithAttrCheck(function() {
      return this.put(new Svg());
    })
  }
});
register(Svg, "Svg", true);
var Symbol$1 = class extends Container {
  // Initialize node
  constructor(node) {
    super(nodeOrNew("symbol", node), node);
  }
};
registerMethods({
  Container: {
    symbol: wrapWithAttrCheck(function() {
      return this.put(new Symbol$1());
    })
  }
});
register(Symbol$1, "Symbol");
function plain(text) {
  if (this._build === false) {
    this.clear();
  }
  this.node.appendChild(globals.document.createTextNode(text));
  return this;
}
function length() {
  return this.node.getComputedTextLength();
}
var textable = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  plain,
  length
});
var Text = class extends Shape$1 {
  // Initialize node
  constructor(node) {
    super(nodeOrNew("text", node), node);
    this.dom.leading = new SVGNumber(1.3);
    this._rebuild = true;
    this._build = false;
  }
  // Move over x-axis
  // Text is moved its bounding box
  // text-anchor does NOT matter
  x(x2, box = this.bbox()) {
    if (x2 == null) {
      return box.x;
    }
    return this.attr("x", this.attr("x") + x2 - box.x);
  }
  // Move over y-axis
  y(y2, box = this.bbox()) {
    if (y2 == null) {
      return box.y;
    }
    return this.attr("y", this.attr("y") + y2 - box.y);
  }
  move(x2, y2, box = this.bbox()) {
    return this.x(x2, box).y(y2, box);
  }
  // Move center over x-axis
  cx(x2, box = this.bbox()) {
    if (x2 == null) {
      return box.cx;
    }
    return this.attr("x", this.attr("x") + x2 - box.cx);
  }
  // Move center over y-axis
  cy(y2, box = this.bbox()) {
    if (y2 == null) {
      return box.cy;
    }
    return this.attr("y", this.attr("y") + y2 - box.cy);
  }
  center(x2, y2, box = this.bbox()) {
    return this.cx(x2, box).cy(y2, box);
  }
  // Set the text content
  text(text) {
    if (text === void 0) {
      var children = this.node.childNodes;
      var firstLine = 0;
      text = "";
      for (var i = 0, len = children.length; i < len; ++i) {
        if (children[i].nodeName === "textPath") {
          if (i === 0) firstLine = 1;
          continue;
        }
        if (i !== firstLine && children[i].nodeType !== 3 && adopt(children[i]).dom.newLined === true) {
          text += "\n";
        }
        text += children[i].textContent;
      }
      return text;
    }
    this.clear().build(true);
    if (typeof text === "function") {
      text.call(this, this);
    } else {
      text = text.split("\n");
      for (var j2 = 0, jl = text.length; j2 < jl; j2++) {
        this.tspan(text[j2]).newLine();
      }
    }
    return this.build(false).rebuild();
  }
  // Set / get leading
  leading(value) {
    if (value == null) {
      return this.dom.leading;
    }
    this.dom.leading = new SVGNumber(value);
    return this.rebuild();
  }
  // Rebuild appearance type
  rebuild(rebuild) {
    if (typeof rebuild === "boolean") {
      this._rebuild = rebuild;
    }
    if (this._rebuild) {
      var self = this;
      var blankLineOffset = 0;
      var leading = this.dom.leading;
      this.each(function() {
        var fontSize = globals.window.getComputedStyle(this.node).getPropertyValue("font-size");
        var dy = leading * new SVGNumber(fontSize);
        if (this.dom.newLined) {
          this.attr("x", self.attr("x"));
          if (this.text() === "\n") {
            blankLineOffset += dy;
          } else {
            this.attr("dy", dy + blankLineOffset);
            blankLineOffset = 0;
          }
        }
      });
      this.fire("rebuild");
    }
    return this;
  }
  // Enable / disable build mode
  build(build) {
    this._build = !!build;
    return this;
  }
  // overwrite method from parent to set data properly
  setData(o2) {
    this.dom = o2;
    this.dom.leading = new SVGNumber(o2.leading || 1.3);
    return this;
  }
};
extend(Text, textable);
registerMethods({
  Container: {
    // Create text element
    text: wrapWithAttrCheck(function(text) {
      return this.put(new Text()).text(text);
    }),
    // Create plain text element
    plain: wrapWithAttrCheck(function(text) {
      return this.put(new Text()).plain(text);
    })
  }
});
register(Text, "Text");
var Tspan = class extends Text {
  // Initialize node
  constructor(node) {
    super(nodeOrNew("tspan", node), node);
  }
  // Set text content
  text(text) {
    if (text == null) return this.node.textContent + (this.dom.newLined ? "\n" : "");
    typeof text === "function" ? text.call(this, this) : this.plain(text);
    return this;
  }
  // Shortcut dx
  dx(dx) {
    return this.attr("dx", dx);
  }
  // Shortcut dy
  dy(dy) {
    return this.attr("dy", dy);
  }
  x(x2) {
    return this.attr("x", x2);
  }
  y(y2) {
    return this.attr("x", y2);
  }
  move(x2, y2) {
    return this.x(x2).y(y2);
  }
  // Create new line
  newLine() {
    var t2 = this.parent(Text);
    this.dom.newLined = true;
    var fontSize = globals.window.getComputedStyle(this.node).getPropertyValue("font-size");
    var dy = t2.dom.leading * new SVGNumber(fontSize);
    return this.dy(dy).attr("x", t2.x());
  }
};
extend(Tspan, textable);
registerMethods({
  Tspan: {
    tspan: wrapWithAttrCheck(function(text) {
      var tspan = new Tspan();
      if (!this._build) {
        this.clear();
      }
      this.node.appendChild(tspan.node);
      return tspan.text(text);
    })
  }
});
register(Tspan, "Tspan");
var ClipPath = class extends Container {
  constructor(node) {
    super(nodeOrNew("clipPath", node), node);
  }
  // Unclip all clipped elements and remove itself
  remove() {
    this.targets().forEach(function(el) {
      el.unclip();
    });
    return super.remove();
  }
  targets() {
    return baseFind('svg [clip-path*="' + this.id() + '"]');
  }
};
registerMethods({
  Container: {
    // Create clipping element
    clip: wrapWithAttrCheck(function() {
      return this.defs().put(new ClipPath());
    })
  },
  Element: {
    // Distribute clipPath to svg element
    clipWith(element) {
      const clipper = element instanceof ClipPath ? element : this.parent().clip().add(element);
      return this.attr("clip-path", 'url("#' + clipper.id() + '")');
    },
    // Unclip element
    unclip() {
      return this.attr("clip-path", null);
    },
    clipper() {
      return this.reference("clip-path");
    }
  }
});
register(ClipPath, "ClipPath");
var ForeignObject = class extends Element {
  constructor(node) {
    super(nodeOrNew("foreignObject", node), node);
  }
};
registerMethods({
  Container: {
    foreignObject: wrapWithAttrCheck(function(width2, height2) {
      return this.put(new ForeignObject()).size(width2, height2);
    })
  }
});
register(ForeignObject, "ForeignObject");
var G = class extends Container {
  constructor(node) {
    super(nodeOrNew("g", node), node);
  }
  x(x2, box = this.bbox()) {
    if (x2 == null) return box.x;
    return this.move(x2, box.y, box);
  }
  y(y2, box = this.bbox()) {
    if (y2 == null) return box.y;
    return this.move(box.x, y2, box);
  }
  move(x2 = 0, y2 = 0, box = this.bbox()) {
    const dx = x2 - box.x;
    const dy = y2 - box.y;
    return this.dmove(dx, dy);
  }
  dx(dx) {
    return this.dmove(dx, 0);
  }
  dy(dy) {
    return this.dmove(0, dy);
  }
  dmove(dx, dy) {
    this.children().forEach((child, i) => {
      const bbox2 = child.bbox();
      const m2 = new Matrix(child);
      const matrix = m2.translate(dx, dy).transform(m2.inverse());
      const p2 = new Point(bbox2.x, bbox2.y).transform(matrix);
      child.move(p2.x, p2.y);
    });
    return this;
  }
  width(width2, box = this.bbox()) {
    if (width2 == null) return box.width;
    return this.size(width2, box.height, box);
  }
  height(height2, box = this.bbox()) {
    if (height2 == null) return box.height;
    return this.size(box.width, height2, box);
  }
  size(width2, height2, box = this.bbox()) {
    const p2 = proportionalSize(this, width2, height2, box);
    const scaleX = p2.width / box.width;
    const scaleY = p2.height / box.height;
    this.children().forEach((child, i) => {
      const o2 = new Point(box).transform(new Matrix(child).inverse());
      child.scale(scaleX, scaleY, o2.x, o2.y);
    });
    return this;
  }
};
registerMethods({
  Container: {
    // Create a group element
    group: wrapWithAttrCheck(function() {
      return this.put(new G());
    })
  }
});
register(G, "G");
var A = class extends Container {
  constructor(node) {
    super(nodeOrNew("a", node), node);
  }
  // Link url
  to(url) {
    return this.attr("href", url, xlink);
  }
  // Link target attribute
  target(target) {
    return this.attr("target", target);
  }
};
registerMethods({
  Container: {
    // Create a hyperlink element
    link: wrapWithAttrCheck(function(url) {
      return this.put(new A()).to(url);
    })
  },
  Element: {
    // Create a hyperlink element
    linkTo: function(url) {
      var link = new A();
      if (typeof url === "function") {
        url.call(link, link);
      } else {
        link.to(url);
      }
      return this.parent().put(link).put(this);
    }
  }
});
register(A, "A");
var Mask = class extends Container {
  // Initialize node
  constructor(node) {
    super(nodeOrNew("mask", node), node);
  }
  // Unmask all masked elements and remove itself
  remove() {
    this.targets().forEach(function(el) {
      el.unmask();
    });
    return super.remove();
  }
  targets() {
    return baseFind('svg [mask*="' + this.id() + '"]');
  }
};
registerMethods({
  Container: {
    mask: wrapWithAttrCheck(function() {
      return this.defs().put(new Mask());
    })
  },
  Element: {
    // Distribute mask to svg element
    maskWith(element) {
      var masker = element instanceof Mask ? element : this.parent().mask().add(element);
      return this.attr("mask", 'url("#' + masker.id() + '")');
    },
    // Unmask element
    unmask() {
      return this.attr("mask", null);
    },
    masker() {
      return this.reference("mask");
    }
  }
});
register(Mask, "Mask");
function cssRule(selector, rule) {
  if (!selector) return "";
  if (!rule) return selector;
  var ret = selector + "{";
  for (var i in rule) {
    ret += unCamelCase(i) + ":" + rule[i] + ";";
  }
  ret += "}";
  return ret;
}
var Style = class extends Element {
  constructor(node) {
    super(nodeOrNew("style", node), node);
  }
  addText(w2 = "") {
    this.node.textContent += w2;
    return this;
  }
  font(name, src, params = {}) {
    return this.rule("@font-face", {
      fontFamily: name,
      src,
      ...params
    });
  }
  rule(selector, obj) {
    return this.addText(cssRule(selector, obj));
  }
};
registerMethods("Dom", {
  style: wrapWithAttrCheck(function(selector, obj) {
    return this.put(new Style()).rule(selector, obj);
  }),
  fontface: wrapWithAttrCheck(function(name, src, params) {
    return this.put(new Style()).font(name, src, params);
  })
});
register(Style, "Style");
var TextPath = class extends Text {
  // Initialize node
  constructor(node) {
    super(nodeOrNew("textPath", node), node);
  }
  // return the array of the path track element
  array() {
    var track = this.track();
    return track ? track.array() : null;
  }
  // Plot path if any
  plot(d2) {
    var track = this.track();
    var pathArray = null;
    if (track) {
      pathArray = track.plot(d2);
    }
    return d2 == null ? pathArray : this;
  }
  // Get the path element
  track() {
    return this.reference("href");
  }
};
registerMethods({
  Container: {
    textPath: wrapWithAttrCheck(function(text, path) {
      if (!(text instanceof Text)) {
        text = this.text(text);
      }
      return text.path(path);
    })
  },
  Text: {
    // Create path for text to run on
    path: wrapWithAttrCheck(function(track, importNodes = true) {
      var textPath = new TextPath();
      if (!(track instanceof Path)) {
        track = this.defs().path(track);
      }
      textPath.attr("href", "#" + track, xlink);
      let node;
      if (importNodes) {
        while (node = this.node.firstChild) {
          textPath.node.appendChild(node);
        }
      }
      return this.put(textPath);
    }),
    // Get the textPath children
    textPath() {
      return this.findOne("textPath");
    }
  },
  Path: {
    // creates a textPath from this path
    text: wrapWithAttrCheck(function(text) {
      if (!(text instanceof Text)) {
        text = new Text().addTo(this.parent()).text(text);
      }
      return text.path(this);
    }),
    targets() {
      return baseFind('svg [href*="' + this.id() + '"]');
    }
  }
});
TextPath.prototype.MorphArray = PathArray;
register(TextPath, "TextPath");
var Use = class extends Shape$1 {
  constructor(node) {
    super(nodeOrNew("use", node), node);
  }
  // Use element as a reference
  element(element, file) {
    return this.attr("href", (file || "") + "#" + element, xlink);
  }
};
registerMethods({
  Container: {
    // Create a use element
    use: wrapWithAttrCheck(function(element, file) {
      return this.put(new Use()).element(element, file);
    })
  }
});
register(Use, "Use");
var SVG = makeInstance;
extend([
  Svg,
  Symbol$1,
  Image,
  Pattern,
  Marker
], getMethodsFor("viewbox"));
extend([
  Line,
  Polyline,
  Polygon,
  Path
], getMethodsFor("marker"));
extend(Text, getMethodsFor("Text"));
extend(Path, getMethodsFor("Path"));
extend(Defs, getMethodsFor("Defs"));
extend([
  Text,
  Tspan
], getMethodsFor("Tspan"));
extend([
  Rect,
  Ellipse,
  Circle,
  Gradient
], getMethodsFor("radius"));
extend(EventTarget, getMethodsFor("EventTarget"));
extend(Dom, getMethodsFor("Dom"));
extend(Element, getMethodsFor("Element"));
extend(Shape$1, getMethodsFor("Shape"));
extend(Container, getMethodsFor("Container"));
extend(Runner, getMethodsFor("Runner"));
List.extend(getMethodNames());
registerMorphableType([
  SVGNumber,
  Color,
  Box,
  Matrix,
  SVGArray,
  PointArray,
  PathArray
]);
makeMorphable();
function isNode() {
  return typeof process !== "undefined" && process.versions != null && process.versions.node != null;
}
var SvgJsRenderer = (
  /** @class */
  (function(_super) {
    __extends(SvgJsRenderer2, _super);
    function SvgJsRenderer2(container) {
      var _this = _super.call(this, container) || this;
      var width2 = constants.width;
      var height2 = 0;
      if (isNode()) {
        _this.svg = SVG(container);
      } else {
        _this.svg = SVG().addTo(container);
      }
      _this.svg.attr("preserveAspectRatio", "xMidYMid meet").viewbox(0, 0, width2, height2);
      return _this;
    }
    SvgJsRenderer2.prototype.title = function(title) {
      this.svg.add(this.svg.element("title").words(title));
    };
    SvgJsRenderer2.prototype.line = function(fromX, fromY, toX, toY, strokeWidth, color) {
      this.svg.line(fromX, fromY, toX, toY).stroke({ color, width: strokeWidth });
    };
    SvgJsRenderer2.prototype.size = function(width2, height2) {
      this.svg.viewbox(0, 0, width2, height2);
    };
    SvgJsRenderer2.prototype.clear = function() {
      this.svg.children().forEach(function(child) {
        return child.remove();
      });
    };
    SvgJsRenderer2.prototype.remove = function() {
      this.svg.remove();
    };
    SvgJsRenderer2.prototype.background = function(color) {
      this.svg.rect().size("100%", "100%").fill(color);
    };
    SvgJsRenderer2.prototype.text = function(text, x2, y2, fontSize, color, fontFamily, alignment, classes2, plain2) {
      var element;
      if (plain2) {
        element = this.svg.plain(text).attr({
          x: x2,
          y: y2
        }).font({
          family: fontFamily,
          size: fontSize,
          anchor: alignment,
          "dominant-baseline": "central"
        }).fill(color).addClass(Renderer.toClassName(classes2));
      } else {
        element = this.svg.text(text).move(x2, y2).font({
          family: fontFamily,
          size: fontSize,
          anchor: alignment
        }).fill(color).addClass(Renderer.toClassName(classes2));
      }
      return SvgJsRenderer2.boxToElement(element.bbox(), element.remove.bind(element));
    };
    SvgJsRenderer2.prototype.circle = function(x2, y2, diameter, strokeWidth, strokeColor, fill, classes2) {
      var element = this.svg.circle(diameter).move(x2, y2).fill(fill || "none").stroke({
        color: strokeColor,
        width: strokeWidth
      }).addClass(Renderer.toClassName(classes2));
      return SvgJsRenderer2.boxToElement(element.bbox(), element.remove.bind(element));
    };
    SvgJsRenderer2.prototype.rect = function(x2, y2, width2, height2, strokeWidth, strokeColor, classes2, fill, radius) {
      var element = this.svg.rect(width2, height2).move(x2, y2).fill(fill || "none").stroke({
        width: strokeWidth,
        color: strokeColor
      }).radius(radius || 0).addClass(Renderer.toClassName(classes2));
      return SvgJsRenderer2.boxToElement(element.bbox(), element.remove.bind(element));
    };
    SvgJsRenderer2.prototype.triangle = function(x2, y2, size2, strokeWidth, strokeColor, classes2, fill) {
      var element = this.svg.path(Renderer.trianglePath(x2, y2, size2)).move(x2, y2).fill(fill || "none").stroke({
        width: strokeWidth,
        color: strokeColor
      }).addClass(Renderer.toClassName(classes2));
      return SvgJsRenderer2.boxToElement(element.bbox(), element.remove.bind(element));
    };
    SvgJsRenderer2.prototype.pentagon = function(x2, y2, size2, strokeWidth, strokeColor, fill, classes2) {
      return this.ngon(x2, y2, size2, strokeWidth, strokeColor, fill, 5, classes2);
    };
    SvgJsRenderer2.prototype.ngon = function(x2, y2, size2, strokeWidth, strokeColor, fill, edges, classes2) {
      var element = this.svg.path(Renderer.ngonPath(x2, y2, size2, edges)).move(x2, y2).fill(fill || "none").stroke({
        width: strokeWidth,
        color: strokeColor
      }).addClass(Renderer.toClassName(classes2));
      return SvgJsRenderer2.boxToElement(element.bbox(), element.remove.bind(element));
    };
    SvgJsRenderer2.boxToElement = function(box, remove) {
      return {
        width: box.width,
        height: box.height,
        x: box.x,
        y: box.y,
        remove
      };
    };
    return SvgJsRenderer2;
  })(Renderer)
);
function range(length2, from2) {
  if (from2 === void 0) {
    from2 = 0;
  }
  return Array.from({ length: length2 }, function(_2, i) {
    return i + from2;
  });
}
var OPEN = 0;
var SILENT = "x";
var FretLabelPosition;
(function(FretLabelPosition2) {
  FretLabelPosition2["LEFT"] = "left";
  FretLabelPosition2["RIGHT"] = "right";
})(FretLabelPosition || (FretLabelPosition = {}));
var Shape;
(function(Shape2) {
  Shape2["CIRCLE"] = "circle";
  Shape2["SQUARE"] = "square";
  Shape2["TRIANGLE"] = "triangle";
  Shape2["PENTAGON"] = "pentagon";
})(Shape || (Shape = {}));
var ChordStyle;
(function(ChordStyle2) {
  ChordStyle2["normal"] = "normal";
  ChordStyle2["handdrawn"] = "handdrawn";
})(ChordStyle || (ChordStyle = {}));
var Orientation;
(function(Orientation2) {
  Orientation2["vertical"] = "vertical";
  Orientation2["horizontal"] = "horizontal";
})(Orientation || (Orientation = {}));
var ElementType;
(function(ElementType2) {
  ElementType2["FRET"] = "fret";
  ElementType2["STRING"] = "string";
  ElementType2["BARRE"] = "barre";
  ElementType2["BARRE_TEXT"] = "barre-text";
  ElementType2["FINGER"] = "finger";
  ElementType2["TITLE"] = "title";
  ElementType2["TUNING"] = "tuning";
  ElementType2["FRET_POSITION"] = "fret-position";
  ElementType2["FRET_MARKER"] = "fret-marker";
  ElementType2["STRING_TEXT"] = "string-text";
  ElementType2["SILENT_STRING"] = "silent-string";
  ElementType2["OPEN_STRING"] = "open-string";
  ElementType2["WATERMARK"] = "watermark";
})(ElementType || (ElementType = {}));
var defaultSettings = {
  style: ChordStyle.normal,
  strings: 6,
  frets: 5,
  position: 1,
  tuning: [],
  tuningsFontSize: 28,
  fretLabelFontSize: 38,
  fretLabelPosition: FretLabelPosition.RIGHT,
  fingerSize: 0.65,
  fingerTextColor: "#FFF",
  fingerTextSize: 24,
  fingerStrokeWidth: 0,
  barreChordStrokeWidth: 0,
  sidePadding: 0.2,
  titleFontSize: 48,
  titleBottomMargin: 0,
  color: "#000",
  emptyStringIndicatorSize: 0.6,
  strokeWidth: 2,
  nutWidth: 10,
  fretSize: 1.5,
  barreChordRadius: 0.25,
  fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
  shape: Shape.CIRCLE,
  orientation: Orientation.vertical,
  watermarkFontSize: 12,
  noPosition: false,
  fretMarkerColor: "rgba(0, 0, 0, 0.2)",
  fretMarkerSize: 0.4,
  doubleFretMarkerDistance: 0.4,
  fretMarkerShape: Shape.CIRCLE,
  showFretMarkers: true
};
var SVGuitarChord = (
  /** @class */
  (function() {
    function SVGuitarChord2(container) {
      var _this = this;
      this.container = container;
      this.settings = {};
      this.chordInternal = { fingers: [], barres: [] };
      var classConstructor = this.constructor;
      classConstructor.plugins.forEach(function(plugin) {
        Object.assign(_this, plugin(_this));
      });
    }
    SVGuitarChord2.plugin = function(plugin) {
      var _a6;
      var currentPlugins = this.plugins;
      var BaseWithPlugins = (_a6 = /** @class */
      (function(_super) {
        __extends(class_1, _super);
        function class_1() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        return class_1;
      })(this), _a6.plugins = currentPlugins.concat(plugin), _a6);
      return BaseWithPlugins;
    };
    Object.defineProperty(SVGuitarChord2.prototype, "renderer", {
      get: function() {
        var _a6;
        if (!this.rendererInternal) {
          var style = (_a6 = this.settings.style) !== null && _a6 !== void 0 ? _a6 : defaultSettings.style;
          switch (style) {
            case ChordStyle.normal:
              this.rendererInternal = new SvgJsRenderer(this.container);
              break;
            case ChordStyle.handdrawn:
              this.rendererInternal = new RoughJsRenderer(this.container);
              break;
            default:
              throw new Error("".concat(style, " is not a valid chord diagram style."));
          }
        }
        return this.rendererInternal;
      },
      enumerable: false,
      configurable: true
    });
    SVGuitarChord2.prototype.configure = function(settings) {
      SVGuitarChord2.sanityCheckSettings(settings);
      if (settings.style !== this.settings.style) {
        this.renderer.remove();
        delete this.rendererInternal;
      }
      this.settings = __assign(__assign({}, this.settings), settings);
      return this;
    };
    SVGuitarChord2.prototype.chord = function(chord) {
      this.chordInternal = chord;
      return this;
    };
    SVGuitarChord2.prototype.draw = function() {
      var _a6;
      this.clear();
      this.drawBackground();
      if (this.settings.svgTitle) {
        this.renderer.title(this.settings.svgTitle);
      }
      var y2;
      y2 = this.drawTitle((_a6 = this.settings.titleFontSize) !== null && _a6 !== void 0 ? _a6 : defaultSettings.titleFontSize);
      y2 = this.drawEmptyStringIndicators(y2);
      y2 = this.drawTopFret(y2);
      this.drawPosition(y2);
      y2 = this.drawGrid(y2);
      y2 = this.drawTunings(y2);
      y2 = this.drawWatermark(y2);
      y2 += this.fretSpacing() / 10;
      var width2 = this.width(constants.width, y2);
      var height2 = this.height(y2, constants.width);
      this.renderer.size(width2, height2);
      this.drawTopEdges(y2);
      return {
        width: constants.width,
        height: y2
      };
    };
    SVGuitarChord2.sanityCheckSettings = function(settings) {
      if (typeof settings.strings !== "undefined" && settings.strings <= 1) {
        throw new Error("Must have at least 2 strings");
      }
      if (typeof settings.frets !== "undefined" && settings.frets < 0) {
        throw new Error("Cannot have less than 0 frets");
      }
      if (typeof settings.position !== "undefined" && settings.position < 1) {
        throw new Error("Position cannot be less than 1");
      }
      if (typeof settings.fretSize !== "undefined" && settings.fretSize < 0) {
        throw new Error("Fret size cannot be smaller than 0");
      }
      if (typeof settings.fingerSize !== "undefined" && settings.fingerSize < 0) {
        throw new Error("Finger size cannot be smaller than 0");
      }
      if (typeof settings.strokeWidth !== "undefined" && settings.strokeWidth < 0) {
        throw new Error("Stroke width cannot be smaller than 0");
      }
      if (typeof settings.doubleFretMarkerDistance !== "undefined" && settings.doubleFretMarkerDistance < 0 && settings.doubleFretMarkerDistance > 1) {
        throw new Error("Double fret marker distance has to be a number between [0, 1]");
      }
    };
    SVGuitarChord2.prototype.drawTunings = function(y2) {
      var _this = this;
      var _a6, _b, _c, _d, _e;
      var padding = this.fretSpacing() / 5;
      var stringXPositions = this.stringXPos();
      var strings = this.numStrings();
      var color = (_b = (_a6 = this.settings.tuningsColor) !== null && _a6 !== void 0 ? _a6 : this.settings.color) !== null && _b !== void 0 ? _b : defaultSettings.color;
      var tuning = (_c = this.settings.tuning) !== null && _c !== void 0 ? _c : defaultSettings.tuning;
      var fontFamily = (_d = this.settings.fontFamily) !== null && _d !== void 0 ? _d : defaultSettings.fontFamily;
      var tuningsFontSize = (_e = this.settings.tuningsFontSize) !== null && _e !== void 0 ? _e : defaultSettings.tuningsFontSize;
      var text;
      tuning.forEach(function(tuning_, i) {
        if (i < strings) {
          var classNames = [ElementType.TUNING, "".concat(ElementType.TUNING, "-").concat(i)];
          var _a7 = _this.coordinates(stringXPositions[i], y2 + padding), textX = _a7.x, textY = _a7.y;
          var tuningText = _this.renderer.text(tuning_, textX, textY, tuningsFontSize, color, fontFamily, Alignment.MIDDLE, classNames, true);
          if (tuning_) {
            text = tuningText;
          }
        }
      });
      if (text) {
        return y2 + this.height(text.height, text.width);
      }
      return y2;
    };
    SVGuitarChord2.prototype.drawWatermark = function(y2) {
      var _a6, _b, _c, _d, _e, _f;
      if (!this.settings.watermark) {
        return y2;
      }
      var padding = this.fretSpacing() / 5;
      var orientation = (_a6 = this.settings.orientation) !== null && _a6 !== void 0 ? _a6 : defaultSettings.orientation;
      var stringXPositions = this.stringXPos();
      var endX = stringXPositions[stringXPositions.length - 1];
      var startX = stringXPositions[0];
      var color = (_c = (_b = this.settings.watermarkColor) !== null && _b !== void 0 ? _b : this.settings.color) !== null && _c !== void 0 ? _c : defaultSettings.color;
      var fontSize = (_d = this.settings.watermarkFontSize) !== null && _d !== void 0 ? _d : defaultSettings.watermarkFontSize;
      var fontFamily = (_f = (_e = this.settings.watermarkFontFamily) !== null && _e !== void 0 ? _e : this.settings.fontFamily) !== null && _f !== void 0 ? _f : defaultSettings.fontFamily;
      var textX;
      var textY;
      if (orientation === Orientation.vertical) {
        textX = startX + (endX - startX) / 2;
        textY = y2 + padding;
      } else {
        var lastFret = y2;
        var firstFret = y2 - this.numFrets() * this.fretSpacing();
        textX = firstFret + (lastFret - firstFret) / 2;
        textY = this.y(startX, 0) + padding;
      }
      var height2 = this.renderer.text(this.settings.watermark, textX, textY, fontSize, color, fontFamily, Alignment.MIDDLE, ElementType.WATERMARK).height;
      return y2 + height2 * 2;
    };
    SVGuitarChord2.prototype.drawPosition = function(y2) {
      var _this = this;
      var _a6, _b, _c, _d, _e, _f, _g, _h, _j;
      var position2 = (_b = (_a6 = this.chordInternal.position) !== null && _a6 !== void 0 ? _a6 : this.settings.position) !== null && _b !== void 0 ? _b : defaultSettings.position;
      var noPosition = (_c = this.settings.noPosition) !== null && _c !== void 0 ? _c : defaultSettings.noPosition;
      if (position2 <= 1 || noPosition) {
        return;
      }
      var stringXPositions = this.stringXPos();
      var endX = stringXPositions[stringXPositions.length - 1];
      var startX = stringXPositions[0];
      var text = "".concat(position2, "fr");
      var size2 = (_d = this.settings.fretLabelFontSize) !== null && _d !== void 0 ? _d : defaultSettings.fretLabelFontSize;
      var color = (_f = (_e = this.settings.fretLabelColor) !== null && _e !== void 0 ? _e : this.settings.color) !== null && _f !== void 0 ? _f : defaultSettings.color;
      var fingerSize = this.stringSpacing() * ((_g = this.settings.fingerSize) !== null && _g !== void 0 ? _g : defaultSettings.fingerSize);
      var fontFamily = (_h = this.settings.fontFamily) !== null && _h !== void 0 ? _h : defaultSettings.fontFamily;
      var fretLabelPosition = (_j = this.settings.fretLabelPosition) !== null && _j !== void 0 ? _j : defaultSettings.fretLabelPosition;
      var padding = Math.max(this.stringSpacing() / 5, fingerSize / 2 + 5);
      var className = ElementType.FRET_POSITION;
      if (this.orientation === Orientation.vertical) {
        var drawText_1 = function(sizeMultiplier) {
          if (sizeMultiplier === void 0) {
            sizeMultiplier = 1;
          }
          if (sizeMultiplier < 0.01) {
            console.warn("Not enough space to draw the starting fret");
            return;
          }
          if (fretLabelPosition === FretLabelPosition.RIGHT) {
            var svgText = _this.renderer.text(text, endX + padding, y2, size2 * sizeMultiplier, color, fontFamily, Alignment.LEFT, className);
            var width2 = svgText.width, x2 = svgText.x;
            if (x2 + width2 > constants.width) {
              svgText.remove();
              drawText_1(sizeMultiplier * 0.9);
            }
          } else {
            var svgText = _this.renderer.text(text, 1 / sizeMultiplier + startX - padding, y2, size2 * sizeMultiplier, color, fontFamily, Alignment.RIGHT, className);
            var x2 = svgText.x;
            if (x2 < 0) {
              svgText.remove();
              drawText_1(sizeMultiplier * 0.8);
            }
          }
        };
        drawText_1();
        return;
      }
      var _k = fretLabelPosition === FretLabelPosition.RIGHT ? this.coordinates(endX + padding, y2) : this.coordinates(startX - padding, y2), textX = _k.x, textY = _k.y;
      this.renderer.text(text, textX, textY, size2, color, fontFamily, Alignment.MIDDLE, className, true);
    };
    SVGuitarChord2.prototype.drawTopEdges = function(y2) {
      var _a6;
      var orientation = (_a6 = this.settings.orientation) !== null && _a6 !== void 0 ? _a6 : defaultSettings.orientation;
      var xTopRight = orientation === Orientation.vertical ? constants.width : y2;
      this.renderer.circle(0, 0, 0, 0, "transparent", "none", "top-left");
      this.renderer.circle(xTopRight, 0, 0, 0, "transparent", "none", "top-right");
    };
    SVGuitarChord2.prototype.drawBackground = function() {
      if (this.settings.backgroundColor) {
        this.renderer.background(this.settings.backgroundColor);
      }
    };
    SVGuitarChord2.prototype.drawTopFret = function(y2) {
      var _a6, _b, _c, _d, _e, _f, _g, _h;
      var stringXpositions = this.stringXPos();
      var strokeWidth = (_a6 = this.settings.strokeWidth) !== null && _a6 !== void 0 ? _a6 : defaultSettings.strokeWidth;
      var nutWidth = (_c = (_b = this.settings.topFretWidth) !== null && _b !== void 0 ? _b : this.settings.nutWidth) !== null && _c !== void 0 ? _c : defaultSettings.nutWidth;
      var startX = stringXpositions[0] - strokeWidth / 2;
      var endX = stringXpositions[stringXpositions.length - 1] + strokeWidth / 2;
      var position2 = (_e = (_d = this.chordInternal.position) !== null && _d !== void 0 ? _d : this.settings.position) !== null && _e !== void 0 ? _e : defaultSettings.position;
      var color = (_g = (_f = this.settings.fretColor) !== null && _f !== void 0 ? _f : this.settings.color) !== null && _g !== void 0 ? _g : defaultSettings.color;
      var noPositon = (_h = this.settings.noPosition) !== null && _h !== void 0 ? _h : defaultSettings.noPosition;
      var fretSize;
      if (position2 > 1 || noPositon) {
        fretSize = strokeWidth;
      } else {
        fretSize = nutWidth;
      }
      var _j = this.coordinates(startX, y2 + fretSize / 2), lineX1 = _j.x, lineY1 = _j.y;
      var _k = this.coordinates(endX, y2 + fretSize / 2), lineX2 = _k.x, lineY2 = _k.y;
      this.renderer.line(lineX1, lineY1, lineX2, lineY2, fretSize, color, ["top-fret", "fret-0"]);
      return y2 + fretSize;
    };
    SVGuitarChord2.prototype.stringXPos = function() {
      var _a6;
      var strings = this.numStrings();
      var sidePadding = (_a6 = this.settings.sidePadding) !== null && _a6 !== void 0 ? _a6 : defaultSettings.sidePadding;
      var startX = constants.width * sidePadding;
      var stringsSpacing = this.stringSpacing();
      return range(strings).map(function(i) {
        return startX + stringsSpacing * i;
      });
    };
    SVGuitarChord2.prototype.numStrings = function() {
      var _a6;
      return (_a6 = this.settings.strings) !== null && _a6 !== void 0 ? _a6 : defaultSettings.strings;
    };
    SVGuitarChord2.prototype.numFrets = function() {
      var _a6;
      return (_a6 = this.settings.frets) !== null && _a6 !== void 0 ? _a6 : defaultSettings.frets;
    };
    SVGuitarChord2.prototype.stringSpacing = function() {
      var _a6;
      var sidePadding = (_a6 = this.settings.sidePadding) !== null && _a6 !== void 0 ? _a6 : defaultSettings.sidePadding;
      var strings = this.numStrings();
      var startX = constants.width * sidePadding;
      var endX = constants.width - startX;
      var width2 = endX - startX;
      return width2 / (strings - 1);
    };
    SVGuitarChord2.prototype.fretSpacing = function() {
      var _a6;
      var stringSpacing = this.stringSpacing();
      var fretSize = (_a6 = this.settings.fretSize) !== null && _a6 !== void 0 ? _a6 : defaultSettings.fretSize;
      return stringSpacing * fretSize;
    };
    SVGuitarChord2.prototype.fretLinesYPos = function(startY) {
      var frets = this.numFrets();
      var fretSpacing = this.fretSpacing();
      return range(frets, 1).map(function(i) {
        return startY + fretSpacing * i;
      });
    };
    SVGuitarChord2.prototype.toArrayIndex = function(stringIndex) {
      var strings = this.numStrings();
      return Math.abs(stringIndex - strings);
    };
    SVGuitarChord2.prototype.drawEmptyStringIndicators = function(y2) {
      var _this = this;
      var _a6, _b, _c;
      var stringXPositions = this.stringXPos();
      var stringSpacing = this.stringSpacing();
      var emptyStringIndicatorSize = (_a6 = this.settings.emptyStringIndicatorSize) !== null && _a6 !== void 0 ? _a6 : defaultSettings.emptyStringIndicatorSize;
      var size2 = emptyStringIndicatorSize * stringSpacing;
      var padding = size2 / 3;
      var color = (_b = this.settings.color) !== null && _b !== void 0 ? _b : defaultSettings.color;
      var strokeWidth = (_c = this.settings.strokeWidth) !== null && _c !== void 0 ? _c : defaultSettings.strokeWidth;
      var hasEmpty = false;
      this.chordInternal.fingers.filter(function(_a7) {
        var _b2 = __read(_a7, 2), value = _b2[1];
        return value === SILENT || value === OPEN;
      }).map(function(_a7) {
        var _b2 = __read(_a7, 3), index = _b2[0], value = _b2[1], textOrOptions = _b2[2];
        return [
          _this.toArrayIndex(index),
          value,
          textOrOptions
        ];
      }).forEach(function(_a7) {
        var _b2, _c2, _d, _e, _f, _g;
        var _h = __read(_a7, 3), stringIndex = _h[0], value = _h[1], textOrOptions = _h[2];
        hasEmpty = true;
        var fingerOptions = SVGuitarChord2.getFingerOptions(textOrOptions);
        var effectiveStrokeWidth = (_b2 = fingerOptions.strokeWidth) !== null && _b2 !== void 0 ? _b2 : strokeWidth;
        var effectiveStrokeColor = (_c2 = fingerOptions.strokeColor) !== null && _c2 !== void 0 ? _c2 : color;
        if (fingerOptions.text) {
          var textColor = (_e = (_d = fingerOptions.textColor) !== null && _d !== void 0 ? _d : _this.settings.color) !== null && _e !== void 0 ? _e : defaultSettings.color;
          var textSize = (_f = _this.settings.fingerTextSize) !== null && _f !== void 0 ? _f : defaultSettings.fingerTextSize;
          var fontFamily = (_g = _this.settings.fontFamily) !== null && _g !== void 0 ? _g : defaultSettings.fontFamily;
          var classNames = [ElementType.STRING_TEXT, "".concat(ElementType.STRING_TEXT, "-").concat(stringIndex)];
          var _j = _this.coordinates(stringXPositions[stringIndex], y2 + padding + size2 / 2), textX = _j.x, textY = _j.y;
          _this.renderer.text(fingerOptions.text, textX, textY, textSize, textColor, fontFamily, Alignment.MIDDLE, classNames, true);
        }
        if (value === OPEN) {
          var classNames = [ElementType.OPEN_STRING, "".concat(ElementType.OPEN_STRING, "-").concat(stringIndex)];
          var _k = _this.rectCoordinates(stringXPositions[stringIndex] - size2 / 2, y2 + padding, size2, size2), lineX1 = _k.x, lineY1 = _k.y;
          _this.renderer.circle(lineX1, lineY1, size2, effectiveStrokeWidth, effectiveStrokeColor, void 0, classNames);
        } else {
          var classNames = [
            ElementType.SILENT_STRING,
            "".concat(ElementType.SILENT_STRING, "-").concat(stringIndex)
          ];
          var startX = stringXPositions[stringIndex] - size2 / 2;
          var endX = startX + size2;
          var startY = y2 + padding;
          var endY = startY + size2;
          var _l = _this.coordinates(startX, startY), line1X1 = _l.x, line1Y1 = _l.y;
          var _m = _this.coordinates(endX, endY), line1X2 = _m.x, line1Y2 = _m.y;
          _this.renderer.line(line1X1, line1Y1, line1X2, line1Y2, effectiveStrokeWidth, effectiveStrokeColor, classNames);
          var _o = _this.coordinates(startX, endY), line2X1 = _o.x, line2Y1 = _o.y;
          var _p = _this.coordinates(endX, startY), line2X2 = _p.x, line2Y2 = _p.y;
          _this.renderer.line(line2X1, line2Y1, line2X2, line2Y2, effectiveStrokeWidth, effectiveStrokeColor, classNames);
        }
      });
      return hasEmpty || this.settings.fixedDiagramPosition ? y2 + size2 + 2 * padding : y2 + padding;
    };
    SVGuitarChord2.prototype.drawGrid = function(y2) {
      var _this = this;
      var _a6, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
      var frets = this.numFrets();
      var fretSize = (_a6 = this.settings.fretSize) !== null && _a6 !== void 0 ? _a6 : defaultSettings.fretSize;
      var relativeFingerSize = (_b = this.settings.fingerSize) !== null && _b !== void 0 ? _b : defaultSettings.fingerSize;
      var stringXPositions = this.stringXPos();
      var fretYPositions = this.fretLinesYPos(y2);
      var stringSpacing = this.stringSpacing();
      var fretSpacing = stringSpacing * fretSize;
      var height2 = fretSpacing * frets;
      var startX = stringXPositions[0];
      var endX = stringXPositions[stringXPositions.length - 1];
      var fingerSize = relativeFingerSize * stringSpacing;
      var fingerColor = (_d = (_c = this.settings.fingerColor) !== null && _c !== void 0 ? _c : this.settings.color) !== null && _d !== void 0 ? _d : defaultSettings.color;
      var fretColor = (_f = (_e = this.settings.fretColor) !== null && _e !== void 0 ? _e : this.settings.color) !== null && _f !== void 0 ? _f : defaultSettings.color;
      var barreChordRadius = (_g = this.settings.barreChordRadius) !== null && _g !== void 0 ? _g : defaultSettings.barreChordRadius;
      var strokeWidth = (_h = this.settings.strokeWidth) !== null && _h !== void 0 ? _h : defaultSettings.strokeWidth;
      var fontFamily = (_j = this.settings.fontFamily) !== null && _j !== void 0 ? _j : defaultSettings.fontFamily;
      var fingerTextColor = (_k = this.settings.fingerTextColor) !== null && _k !== void 0 ? _k : defaultSettings.fingerTextColor;
      var fingerTextSize = (_l = this.settings.fingerTextSize) !== null && _l !== void 0 ? _l : defaultSettings.fingerTextSize;
      fretYPositions.forEach(function(fretY, i) {
        var classNames = [ElementType.FRET, "".concat(ElementType.FRET, "-").concat(i)];
        var _a7 = _this.coordinates(startX, fretY), lineX1 = _a7.x, lineY1 = _a7.y;
        var _b2 = _this.coordinates(endX, fretY), lineX2 = _b2.x, lineY2 = _b2.y;
        _this.renderer.line(lineX1, lineY1, lineX2, lineY2, strokeWidth, fretColor, classNames);
      });
      stringXPositions.forEach(function(stringX, i) {
        var classNames = [ElementType.STRING, "".concat(ElementType.STRING, "-").concat(i)];
        var _a7 = _this.coordinates(stringX, y2), lineX1 = _a7.x, lineY1 = _a7.y;
        var _b2 = _this.coordinates(stringX, y2 + height2 + strokeWidth / 2), lineX2 = _b2.x, lineY2 = _b2.y;
        _this.renderer.line(lineX1, lineY1, lineX2, lineY2, strokeWidth, fretColor, classNames);
      });
      this.chordInternal.barres.forEach(function(_a7) {
        var _b2, _c2, _d2, _e2;
        var fret = _a7.fret, fromString = _a7.fromString, toString = _a7.toString, text = _a7.text, color = _a7.color, textColor = _a7.textColor, strokeColor = _a7.strokeColor, className = _a7.className, individualBarreChordStrokeWidth = _a7.strokeWidth;
        var barreCenterY = fretYPositions[fret - 1] - strokeWidth / 4 - fretSpacing / 2;
        var fromStringX = stringXPositions[_this.toArrayIndex(fromString)];
        var distance = Math.abs(toString - fromString) * stringSpacing;
        var barreChordStrokeColor = (_d2 = (_c2 = (_b2 = strokeColor !== null && strokeColor !== void 0 ? strokeColor : _this.settings.barreChordStrokeColor) !== null && _b2 !== void 0 ? _b2 : _this.settings.fingerColor) !== null && _c2 !== void 0 ? _c2 : _this.settings.color) !== null && _d2 !== void 0 ? _d2 : defaultSettings.color;
        var barreChordStrokeWidth = (_e2 = individualBarreChordStrokeWidth !== null && individualBarreChordStrokeWidth !== void 0 ? individualBarreChordStrokeWidth : _this.settings.barreChordStrokeWidth) !== null && _e2 !== void 0 ? _e2 : defaultSettings.barreChordStrokeWidth;
        var classNames = __spreadArray([
          ElementType.BARRE,
          "".concat(ElementType.BARRE, "-fret-").concat(fret - 1)
        ], __read(className ? [className] : []), false);
        var barreWidth = distance + stringSpacing / 2;
        var barreHeight = fingerSize;
        var _f2 = _this.rectCoordinates(fromStringX - stringSpacing / 4, barreCenterY - fingerSize / 2, barreWidth, barreHeight), rectX = _f2.x, rectY = _f2.y, rectHeight = _f2.height, rectWidth = _f2.width;
        _this.renderer.rect(rectX, rectY, rectWidth, rectHeight, barreChordStrokeWidth, barreChordStrokeColor, classNames, color !== null && color !== void 0 ? color : fingerColor, fingerSize * barreChordRadius);
        if (text) {
          var textClassNames = [ElementType.BARRE_TEXT, "".concat(ElementType.BARRE_TEXT, "-").concat(fret)];
          var _g2 = _this.coordinates(fromStringX + distance / 2, barreCenterY), textX = _g2.x, textY = _g2.y;
          _this.renderer.text(text, textX, textY, fingerTextSize, textColor !== null && textColor !== void 0 ? textColor : fingerTextColor, fontFamily, Alignment.MIDDLE, textClassNames, true);
        }
      });
      this.chordInternal.fingers.filter(function(_a7) {
        var _b2 = __read(_a7, 2), value = _b2[1];
        return value !== SILENT && value !== OPEN;
      }).map(function(_a7) {
        var _b2 = __read(_a7, 3), stringIndex = _b2[0], fretIndex = _b2[1], text = _b2[2];
        return [
          _this.toArrayIndex(stringIndex),
          fretIndex,
          text
        ];
      }).forEach(function(_a7) {
        var _b2 = __read(_a7, 3), stringIndex = _b2[0], fretIndex = _b2[1], textOrOptions = _b2[2];
        var fingerCenterX = startX + stringIndex * stringSpacing;
        var fingerCenterY = y2 + fretIndex * fretSpacing - fretSpacing / 2;
        var fingerOptions = SVGuitarChord2.getFingerOptions(textOrOptions);
        var classNames = __spreadArray([
          ElementType.FINGER,
          "".concat(ElementType.FINGER, "-string-").concat(stringIndex),
          "".concat(ElementType.FINGER, "-fret-").concat(fretIndex - 1),
          "".concat(ElementType.FINGER, "-string-").concat(stringIndex, "-fret-").concat(fretIndex - 1)
        ], __read(fingerOptions.className ? [fingerOptions.className] : []), false);
        _this.drawFinger(fingerCenterX, fingerCenterY, fingerSize, fingerColor, fingerTextSize, fontFamily, fingerOptions, classNames);
      });
      if ((_m = this.settings.showFretMarkers) !== null && _m !== void 0 ? _m : defaultSettings.showFretMarkers) {
        (_o = this.settings.fretMarkers) === null || _o === void 0 ? void 0 : _o.forEach(function(fretMarker) {
          var _a7, _b2, _c2, _d2, _e2;
          var fretMarkerOptions = typeof fretMarker == "number" ? {
            fret: fretMarker
          } : fretMarker;
          if (fretMarkerOptions.fret >= _this.numFrets()) {
            return;
          }
          var fretMarkerIndex = fretMarkerOptions.fret;
          var fretMarkerCenterX = constants.width / 2;
          var fretMarkerCenterY = y2 + (fretMarkerIndex + 1) * fretSpacing - fretSpacing / 2;
          var fretMarkerSize = (_a7 = _this.settings.fretMarkerSize) !== null && _a7 !== void 0 ? _a7 : defaultSettings.fretMarkerSize;
          var fretMarkerColor = (_b2 = _this.settings.fretMarkerColor) !== null && _b2 !== void 0 ? _b2 : defaultSettings.fretMarkerColor;
          var classNames = __spreadArray([
            ElementType.FRET_MARKER,
            "".concat(ElementType.FRET_MARKER, "-fret-").concat(fretMarkerIndex)
          ], __read((_c2 = fretMarkerOptions.className) !== null && _c2 !== void 0 ? _c2 : []), false);
          if ("double" in fretMarkerOptions) {
            _this.stringSpacing();
            var doubleFretMarkerDistance = (_e2 = (_d2 = fretMarkerOptions.distance) !== null && _d2 !== void 0 ? _d2 : _this.settings.doubleFretMarkerDistance) !== null && _e2 !== void 0 ? _e2 : defaultSettings.doubleFretMarkerDistance;
            var neckWidth = (_this.numStrings() - 1) * _this.stringSpacing();
            var fretMarkerDistanceFromCenter = neckWidth * doubleFretMarkerDistance / 2;
            _this.drawFretMarker(fretMarkerCenterX - fretMarkerDistanceFromCenter, fretMarkerCenterY, fretMarkerSize, fretMarkerColor, fretMarker, classNames);
            _this.drawFretMarker(fretMarkerCenterX + fretMarkerDistanceFromCenter, fretMarkerCenterY, fretMarkerSize, fretMarkerColor, fretMarker, classNames);
          } else {
            _this.drawFretMarker(fretMarkerCenterX, fretMarkerCenterY, fretMarkerSize, fretMarkerColor, fretMarker, classNames);
          }
        });
      }
      return y2 + height2;
    };
    SVGuitarChord2.prototype.drawFretMarker = function(x2, y2, size2, color, fretMarketOptions, classNames) {
      var _a6, _b, _c, _d, _e, _f, _g, _h;
      var markerOptions = typeof fretMarketOptions === "number" ? { fret: fretMarketOptions } : fretMarketOptions;
      var shape = (_a6 = markerOptions.shape) !== null && _a6 !== void 0 ? _a6 : defaultSettings.fretMarkerShape;
      var fretMarkerColor = (_c = (_b = markerOptions.color) !== null && _b !== void 0 ? _b : this.settings.fretMarkerColor) !== null && _c !== void 0 ? _c : defaultSettings.fretMarkerColor;
      var fretMarkerStrokeColor = (_e = (_d = markerOptions.strokeColor) !== null && _d !== void 0 ? _d : this.settings.fretMarkerStrokeColor) !== null && _e !== void 0 ? _e : color;
      var fretMarkerStrokeWidth = (_g = (_f = markerOptions.strokeWidth) !== null && _f !== void 0 ? _f : this.settings.fretMarkerStrokeWidth) !== null && _g !== void 0 ? _g : 0;
      var fretMarkerSize = this.stringSpacing() * ((_h = markerOptions.size) !== null && _h !== void 0 ? _h : size2);
      var startX = x2 - fretMarkerSize / 2;
      var startY = y2 - fretMarkerSize / 2;
      var classNamesWithShape = __spreadArray(__spreadArray([], __read(classNames), false), ["".concat(ElementType.FRET_MARKER, "-").concat(shape)], false);
      var _j = this.rectCoordinates(startX, startY, fretMarkerSize, fretMarkerSize), x0 = _j.x, y0 = _j.y;
      this.drawShape(shape, x0, y0, fretMarkerSize, fretMarkerStrokeWidth, fretMarkerStrokeColor, fretMarkerColor !== null && fretMarkerColor !== void 0 ? fretMarkerColor : color, classNamesWithShape);
    };
    SVGuitarChord2.prototype.drawFinger = function(x2, y2, size2, color, textSize, fontFamily, fingerOptions, classNames) {
      var _a6, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
      var shape = (_a6 = fingerOptions.shape) !== null && _a6 !== void 0 ? _a6 : defaultSettings.shape;
      var fingerTextColor = (_c = (_b = fingerOptions.textColor) !== null && _b !== void 0 ? _b : this.settings.fingerTextColor) !== null && _c !== void 0 ? _c : defaultSettings.fingerTextColor;
      var fingerStrokeColor = (_g = (_f = (_e = (_d = fingerOptions.strokeColor) !== null && _d !== void 0 ? _d : this.settings.fingerStrokeColor) !== null && _e !== void 0 ? _e : this.settings.fingerColor) !== null && _f !== void 0 ? _f : this.settings.color) !== null && _g !== void 0 ? _g : defaultSettings.color;
      var fingerStrokeWidth = (_j = (_h = fingerOptions.strokeWidth) !== null && _h !== void 0 ? _h : this.settings.fingerStrokeWidth) !== null && _j !== void 0 ? _j : defaultSettings.fingerStrokeWidth;
      var startX = x2 - size2 / 2;
      var startY = y2 - size2 / 2;
      var classNamesWithShape = __spreadArray(__spreadArray([], __read(classNames), false), ["".concat(ElementType.FINGER, "-").concat(shape)], false);
      var _m = this.rectCoordinates(startX, startY, size2, size2), x0 = _m.x, y0 = _m.y;
      this.drawShape(shape, x0, y0, size2, fingerStrokeWidth, fingerStrokeColor, (_k = fingerOptions.color) !== null && _k !== void 0 ? _k : color, classNamesWithShape);
      var textClassNames = __spreadArray(__spreadArray([], __read(classNames), false), ["".concat(ElementType.FINGER, "-text")], false);
      if (fingerOptions.text) {
        var _o = this.coordinates(x2, y2), textX = _o.x, textY = _o.y;
        this.renderer.text(fingerOptions.text, textX, textY, textSize, (_l = fingerOptions.textColor) !== null && _l !== void 0 ? _l : fingerTextColor, fontFamily, Alignment.MIDDLE, textClassNames, true);
      }
    };
    SVGuitarChord2.prototype.drawShape = function(shape, x2, y2, size2, strokeWidth, strokeColor, fillColor, classNames) {
      switch (shape) {
        case Shape.CIRCLE:
          this.renderer.circle(x2, y2, size2, strokeWidth, strokeColor, fillColor, classNames);
          break;
        case Shape.SQUARE:
          this.renderer.rect(x2, y2, size2, size2, strokeWidth, strokeColor, classNames, fillColor);
          break;
        case Shape.TRIANGLE:
          this.renderer.triangle(x2, y2, size2, strokeWidth, strokeColor, classNames, fillColor);
          break;
        case Shape.PENTAGON:
          this.renderer.pentagon(x2, y2, size2, strokeWidth, strokeColor, fillColor, classNames);
          break;
        default:
          throw new Error('Invalid shape "'.concat(shape, '". Valid shapes are: ').concat(Object.values(Shape).map(function(val) {
            return '"'.concat(val, '"');
          }).join(", "), "."));
      }
    };
    SVGuitarChord2.prototype.drawTitle = function(size2) {
      var _a6, _b, _c, _d, _e;
      var color = (_a6 = this.settings.color) !== null && _a6 !== void 0 ? _a6 : defaultSettings.color;
      var titleBottomMargin = (_b = this.settings.titleBottomMargin) !== null && _b !== void 0 ? _b : defaultSettings.titleBottomMargin;
      var fontFamily = (_c = this.settings.fontFamily) !== null && _c !== void 0 ? _c : defaultSettings.fontFamily;
      var title = (_e = (_d = this.chordInternal.title) !== null && _d !== void 0 ? _d : this.settings.title) !== null && _e !== void 0 ? _e : this.settings.fixedDiagramPosition ? "X" : "";
      if (this.orientation === Orientation.vertical) {
        var _f = this.renderer.text(title, constants.width / 2, 5, size2, color, fontFamily, Alignment.MIDDLE, ElementType.TITLE), x2 = _f.x, y2 = _f.y, width_1 = _f.width, height2 = _f.height, remove_1 = _f.remove;
        if (x2 < -1e-4) {
          remove_1();
          return this.drawTitle(size2 * (constants.width / width_1) * 0.97);
        }
        if (!this.settings.title && this.settings.fixedDiagramPosition) {
          remove_1();
        }
        return y2 + height2 + titleBottomMargin;
      }
      var _g = this.renderer.text(title, 0, 0, size2, color, fontFamily, Alignment.LEFT, ElementType.TITLE), removeTempText = _g.remove, width2 = _g.width;
      removeTempText();
      var _h = this.rectCoordinates(constants.width / 2, 5, 0, 0), textX = _h.x, textY = _h.y;
      var remove = this.renderer.text(title, textX, textY, size2, color, fontFamily, Alignment.LEFT, ElementType.TITLE, true).remove;
      if (!this.settings.title && this.settings.fixedDiagramPosition) {
        remove();
      }
      return width2 + titleBottomMargin;
    };
    SVGuitarChord2.prototype.clear = function() {
      this.renderer.clear();
    };
    SVGuitarChord2.prototype.remove = function() {
      this.renderer.remove();
    };
    SVGuitarChord2.getFingerOptions = function(textOrOptions) {
      if (!textOrOptions) {
        return {};
      }
      if (typeof textOrOptions === "string") {
        return {
          text: textOrOptions
        };
      }
      return textOrOptions;
    };
    SVGuitarChord2.prototype.x = function(x2, y2) {
      return this.orientation === Orientation.vertical ? x2 : y2;
    };
    SVGuitarChord2.prototype.y = function(x2, y2) {
      return this.orientation === Orientation.vertical ? y2 : Math.abs(x2 - constants.width);
    };
    SVGuitarChord2.prototype.coordinates = function(x2, y2) {
      return {
        x: this.x(x2, y2),
        y: this.y(x2, y2)
      };
    };
    SVGuitarChord2.prototype.rectCoordinates = function(x2, y2, width2, height2) {
      if (this.orientation === Orientation.vertical) {
        return {
          x: x2,
          y: y2,
          width: width2,
          height: height2
        };
      }
      return {
        x: this.x(x2, y2),
        y: this.y(x2, y2) - width2,
        width: this.width(width2, height2),
        height: this.height(height2, width2)
      };
    };
    SVGuitarChord2.prototype.height = function(height_, width2) {
      return this.orientation === Orientation.vertical ? height_ : width2;
    };
    SVGuitarChord2.prototype.width = function(width_, height2) {
      return this.orientation === Orientation.horizontal ? height2 : width_;
    };
    Object.defineProperty(SVGuitarChord2.prototype, "orientation", {
      get: function() {
        var _a6;
        return (_a6 = this.settings.orientation) !== null && _a6 !== void 0 ? _a6 : defaultSettings.orientation;
      },
      enumerable: false,
      configurable: true
    });
    SVGuitarChord2.plugins = [];
    return SVGuitarChord2;
  })()
);

// demoEditableSVGuitar/app.js
var editor = (
  /** @type {HTMLElement} */
  document.getElementById("editor")
);
var output = (
  /** @type {HTMLElement} */
  document.getElementById("output")
);
if (!editor || !output) {
  throw new Error("Required DOM elements not found");
}
var editable = new EditableSVGuitarChord(editor, SVGuitarChord).chord({ fingers: [], barres: [] }).configure({ frets: 5, noPosition: true }).draw();
function updateJSON() {
  output.textContent = JSON.stringify(editable.getChord(), null, 2);
}
function clone(obj) {
  return typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
}
var SAMPLE = {
  C: {
    fingers: [
      [2, 1, { text: "C", color: "#d62828" }],
      [4, 2, { text: "E", color: "#047857" }],
      [5, 3, { text: "C", color: "#d62828" }]
    ],
    barres: []
  },
  G: {
    fingers: [
      [1, 3, { text: "G", color: "#8d52c0" }],
      [5, 2, { text: "B", color: "#4a52c9" }],
      [6, 3, { text: "G", color: "#8d52c0" }]
    ],
    barres: []
  }
};
function loadSample(sample) {
  editable.chord(clone(sample));
  editable.redraw();
  updateJSON();
}
var _a;
(_a = document.getElementById("sample-c")) == null ? void 0 : _a.addEventListener("click", () => loadSample(SAMPLE.C));
var _a2;
(_a2 = document.getElementById("sample-g")) == null ? void 0 : _a2.addEventListener("click", () => loadSample(SAMPLE.G));
var _a3;
(_a3 = document.getElementById("clear")) == null ? void 0 : _a3.addEventListener("click", () => {
  editable.chord({ fingers: [], barres: [] }).redraw();
  updateJSON();
});
var _a4;
(_a4 = document.getElementById("refresh-json")) == null ? void 0 : _a4.addEventListener("click", updateJSON);
var _a5;
(_a5 = document.getElementById("export-json")) == null ? void 0 : _a5.addEventListener("click", () => {
  const blob = new Blob([output.textContent], { type: "application/json" });
  const a2 = document.createElement("a");
  a2.href = URL.createObjectURL(blob);
  a2.download = "editable-chord.json";
  document.body.appendChild(a2);
  a2.click();
  document.body.removeChild(a2);
  URL.revokeObjectURL(a2.href);
});
updateJSON();
//# sourceMappingURL=bundle.js.map
