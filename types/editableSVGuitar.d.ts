export namespace DOT_COLORS {
    let RED: string;
    let BLACK: string;
}
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
    constructor(container: HTMLElement, SVGuitarChordClass?: any);
    container: HTMLElement;
    SVGuitarChordClass: any;
    /** @type {import("svguitar").Chord} */
    chordConfig: import("svguitar").Chord;
    /** @type {any} */
    config: any;
    svgChord: any;
    isDialogOpen: boolean;
    controlsCreated: boolean;
    currentEditElement: Element;
    /** @type {Function|null} */
    changeCallback: Function | null;
    /**
     * Create controls and containers
     */
    createControls(): void;
    wrapper: HTMLDivElement;
    settingsButton: HTMLButtonElement;
    svgContainer: HTMLDivElement;
    /**
     * Create the settings dialog for title and position
     */
    createSettingsDialog(): void;
    settingsDialog: HTMLDivElement;
    titleInput: HTMLInputElement;
    positionInput: HTMLInputElement;
    settingsBackdrop: HTMLDivElement;
    /**
     * Create the edit dialog
     */
    createDialog(): void;
    dialog: HTMLDivElement;
    redRadio: HTMLInputElement;
    blackRadio: HTMLInputElement;
    textSection: HTMLDivElement;
    textInput: HTMLInputElement;
    backdrop: HTMLDivElement;
    /**
     * Set chord configuration
     * @param {import("svguitar").Chord} config
     * @returns {EditableSVGuitarChord}
     */
    chord(config: import("svguitar").Chord): EditableSVGuitarChord;
    /**
     * Configure SVGuitar options
     * @param {any} config
     * @returns {EditableSVGuitarChord}
     */
    configure(config: any): EditableSVGuitarChord;
    /**
     * Calculate dynamic fret count based on chord content
     * @returns {number} - Number of frets needed (minimum 3, max dot position + 1)
     */
    calculateDynamicFrets(): number;
    /**
     * Draw the chord with interactive capabilities
     * @param {number | undefined} [frets] - Force redraw even if already drawn
     * @returns {EditableSVGuitarChord}
     */
    draw(frets?: number | undefined): EditableSVGuitarChord;
    /**
     * Redraw the chord
     * @param {number | undefined} [frets] - Force redraw even if already drawn
     */
    redraw(frets?: number | undefined): void;
    /**
     * Add transparent placeholder dots for empty positions
     * @param {import("svguitar").Chord} config
     * @returns {import("svguitar").Chord}
     */
    addPlaceholderDots(config: import("svguitar").Chord): import("svguitar").Chord;
    /**
     * Add event listeners to SVG elements
     */
    addEventListeners(): void;
    /**
     * Handle click on a dot (finger circle)
     * @param {Element} circleElement
     */
    handleDotClick(circleElement: Element): void;
    /**
     * Handle click on an open string element
     * @param {Element} openStringElement
     */
    handleOpenStringClick(openStringElement: Element): void;
    /**
     * Add a new dot at the specified position
     * @param {number} string
     * @param {number} fret
     */
    addDot(string: number, fret: number): void;
    /**
     * Edit an existing dot
     * @param {number} string
     * @param {number} fret
     */
    editDot(string: number, fret: number): void;
    currentEditFinger: import("svguitar").Finger;
    currentEditString: number;
    currentEditFret: number;
    /**
     * Open the edit dialog
     */
    openDialog(): void;
    /**
     * Position dialog relative to the clicked element
     */
    positionDialog(): void;
    /**
     * Add CSS arrow using ::after pseudo-element
     * @param {string} side - 'left' or 'right' indicating arrow direction
     * @param {number} dotY - Y position of the clicked dot
     * @param {number} dialogY - Y position of the dialog
     * @param {number} dialogHeight - Height of the dialog
     */
    addArrowCSS(side: string, dotY: number, dialogY: number, dialogHeight: number): void;
    /**
     * Ensure arrow CSS rules are added to the document
     */
    addCustomCSS(): void;
    /**
     * Close the edit dialog
     */
    closeDialog(): void;
    /**
     * Update text section visibility based on color selection
     */
    updateTextSectionVisibility(): void;
    /**
     * Update dot text in real-time
     */
    updateDotText(): void;
    /**
     * Update dot color in real-time
     */
    updateDotColor(): void;
    /**
     * Save changes to the current dot
     */
    saveDot(): void;
    /**
     * Remove the current dot
     */
    removeDot(): void;
    /**
     * Open the settings dialog
     */
    openSettingsDialog(): void;
    /**
     * Position settings dialog near the settings button
     */
    positionSettingsDialog(): void;
    /**
     * Close the settings dialog
     */
    closeSettingsDialog(): void;
    /**
     * Save settings from the dialog
     */
    saveSettings(): void;
    /**
     * Get current chord configuration
     * @returns {import("svguitar").Chord}
     */
    getChord(): import("svguitar").Chord;
    /**
     * Get string representation of the chord
     * @param {object} [options]
     * @param {boolean} [options.useUnicode=false] - Whether to use Unicode characters for string/fret markers
     * @returns {string}
     */
    toString(options?: {
        useUnicode?: boolean;
    }): string;
    /**
     * Register a callback for when the chord changes
     * @param {(this: EditableSVGuitarChord) => void} callback - Called with updated fingers array
     * @returns {EditableSVGuitarChord}
     */
    onChange(callback: (this: EditableSVGuitarChord) => void): EditableSVGuitarChord;
    /**
     * Trigger the change callback if registered
     */
    triggerChange(): void;
    /**
     * Clean up resources
     */
    destroy(): void;
}
