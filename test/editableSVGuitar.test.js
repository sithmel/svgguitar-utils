// @ts-nocheck

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { EditableSVGuitarChord, DOT_COLORS } from '../lib/editableSVGuitar.js';

// Mock SVGuitarChord class for testing
class MockSVGuitarChord {
  constructor(container) {
    this.container = container;
    this.chordConfig = {};
    this.config = {};
  }
  
  chord(config) {
    this.chordConfig = config;
    return this;
  }
  
  configure(config) {
    this.config = config;
    return this;
  }
  
  draw() {
    return this;
  }
}

describe('EditableSVGuitarChord (Core Functionality)', () => {
  test('creates instance with basic properties', () => {
    // Create minimal mock DOM elements
    const mockContainer = {
      appendChild: () => {},
      querySelector: () => null
    };
    
    const editableChord = new EditableSVGuitarChord(mockContainer, MockSVGuitarChord);
    
    assert.ok(editableChord);
    assert.equal(editableChord.container, mockContainer);
    assert.equal(editableChord.SVGuitarChordClass, MockSVGuitarChord);
    assert.deepEqual(editableChord.chordConfig, { fingers: [], barres: [], title: undefined, position: undefined });
    assert.equal(editableChord.config.frets, 5);
    assert.equal(editableChord.isDialogOpen, false);
  });

  test('sets and gets chord configuration', () => {
    const mockContainer = { appendChild: () => {} };
    const editableChord = new EditableSVGuitarChord(mockContainer, MockSVGuitarChord);
    
    const testChord = {
      fingers: [[1, 0], [2, 2], [3, 2]],
      barres: []
    };
    
    editableChord.chord(testChord);
    const result = editableChord.getChord();
    
    assert.deepEqual(result.fingers, testChord.fingers);
    assert.deepEqual(result.barres, testChord.barres);
  });

  test('configures SVGuitar options', () => {
    const mockContainer = { appendChild: () => {} };
    const editableChord = new EditableSVGuitarChord(mockContainer, MockSVGuitarChord);
    
    const testConfig = { frets: 7, tuning: ['E', 'A', 'D', 'G', 'B', 'E'] };
    editableChord.configure(testConfig);
    
    assert.equal(editableChord.config.frets, 7);
    assert.deepEqual(editableChord.config.tuning, testConfig.tuning);
  });

  test('adds placeholder dots correctly', () => {
    const mockContainer = { appendChild: () => {} };
    const editableChord = new EditableSVGuitarChord(mockContainer, MockSVGuitarChord);
    
    const originalChord = {
      fingers: [[1, 2, { text: '1', color: '#000000' }]],
      barres: []
    };
    
    const chordWithPlaceholders = editableChord.addPlaceholderDots(originalChord);
    
    // Should have the original finger plus many placeholders
    assert.ok(chordWithPlaceholders.fingers.length > 1, 'Should add placeholder dots');
    
    // Should preserve the original finger
    const originalFinger = chordWithPlaceholders.fingers.find(([s, f, options]) => 
      s === 1 && f === 2 && options && options.color === '#000000'
    );
    assert.ok(originalFinger, 'Should preserve original finger');
    
    // Should have transparent placeholders
    const placeholders = chordWithPlaceholders.fingers.filter(([, , options]) => 
      options && options.color === 'transparent'
    );
    assert.ok(placeholders.length > 0, 'Should add transparent placeholders');
    
    // Check placeholder structure
    const firstPlaceholder = placeholders[0];
    assert.equal(firstPlaceholder.length, 3, 'Placeholder should have 3 elements');
    assert.equal(typeof firstPlaceholder[0], 'number', 'String should be number');
    assert.equal(typeof firstPlaceholder[1], 'number', 'Fret should be number');
    assert.equal(firstPlaceholder[2].color, 'transparent', 'Should be transparent');
    assert.equal(firstPlaceholder[2].className, 'placeholder-dot', 'Should have placeholder class');
  });

  test('adds new dot correctly', () => {
    const mockContainer = { appendChild: () => {} };
    const editableChord = new EditableSVGuitarChord(mockContainer, MockSVGuitarChord);
    
    editableChord.chord({ fingers: [], barres: [] });
    
    const originalFingerCount = editableChord.chordConfig.fingers.length;
    
    // Add a new dot
    editableChord.addDot(1, 3);
    
    assert.equal(editableChord.chordConfig.fingers.length, originalFingerCount + 1);
    
    const newFinger = editableChord.chordConfig.fingers.find(([s, f]) => s === 1 && f === 3);
    assert.ok(newFinger, 'Should add new finger');
    assert.equal(newFinger[2].text, '');
    assert.equal(newFinger[2].color, '#000000');
  });

  test('placeholder dots cover all string/fret combinations', () => {
    const mockContainer = { appendChild: () => {} };
    const editableChord = new EditableSVGuitarChord(mockContainer, MockSVGuitarChord);
    
    // Set frets to 3 for easier testing
    editableChord.configure({ frets: 3 });
    
    const emptyChord = { fingers: [], barres: [] };
    const chordWithPlaceholders = editableChord.addPlaceholderDots(emptyChord);
    
    // Should have placeholders for all 6 strings x 3 frets (1-3) + 6 fret 0 placeholders = 24 positions
    assert.equal(chordWithPlaceholders.fingers.length, 24);
    
    // Check we have all combinations for frets 1-3
    for (let string = 1; string <= 6; string++) {
      for (let fret = 1; fret <= 3; fret++) {
        const placeholder = chordWithPlaceholders.fingers.find(([s, f]) => s === string && f === fret);
        assert.ok(placeholder, `Should have placeholder for string ${string}, fret ${fret}`);
        assert.equal(placeholder[2].color, 'transparent');
      }
    }
    
    // Check we have fret 0 placeholders for all strings
    for (let string = 1; string <= 6; string++) {
      const placeholder = chordWithPlaceholders.fingers.find(([s, f]) => s === string && f === 0);
      assert.ok(placeholder, `Should have placeholder for string ${string}, fret 0`);
    }
  });

  test('excludes existing fingers from placeholders', () => {
    const mockContainer = { appendChild: () => {} };
    const editableChord = new EditableSVGuitarChord(mockContainer, MockSVGuitarChord);
    
    editableChord.configure({ frets: 2 });
    
    const chordWithFingers = {
      fingers: [[1, 1, { text: '1' }], [2, 2, { text: '2' }]],
      barres: []
    };
    
    const chordWithPlaceholders = editableChord.addPlaceholderDots(chordWithFingers);
    
    // Should have 2 original fingers + (6 strings * 2 frets - 2 existing) placeholders + 6 fret 0 placeholders
    const expectedPlaceholders = (6 * 2) - 2 + 6;
    const expectedTotal = 2 + expectedPlaceholders;
    assert.equal(chordWithPlaceholders.fingers.length, expectedTotal);
    
    // Original fingers should not be placeholders
    const originalFingers = chordWithPlaceholders.fingers.filter(([, , options]) => 
      options && options.color !== 'transparent'
    );
    assert.equal(originalFingers.length, 2);
    
    // Should not have placeholders at the existing positions
    const placeholderAt1_1 = chordWithPlaceholders.fingers.find(([s, f, options]) => 
      s === 1 && f === 1 && options && options.color === 'transparent'
    );
    const placeholderAt2_2 = chordWithPlaceholders.fingers.find(([s, f, options]) => 
      s === 2 && f === 2 && options && options.color === 'transparent'  
    );
    
    assert.equal(placeholderAt1_1, undefined, 'Should not have placeholder where finger exists');
    assert.equal(placeholderAt2_2, undefined, 'Should not have placeholder where finger exists');
  });
});

describe('DOT_COLORS', () => {
  test('exports DOT_COLORS object with red and black', () => {
    assert.ok(typeof DOT_COLORS === 'object', 'DOT_COLORS should be an object');
    assert.ok(DOT_COLORS.RED, 'DOT_COLORS should have RED property');
    assert.ok(DOT_COLORS.BLACK, 'DOT_COLORS should have BLACK property');
  });

  test('DOT_COLORS contains valid hex colors', () => {
    Object.values(DOT_COLORS).forEach(color => {
      assert.ok(typeof color === 'string', 'Color should be a string');
      assert.ok(/^#[0-9a-fA-F]{6}$/.test(color), `Color ${color} should be valid hex format`);
    });
  });

  test('DOT_COLORS has expected red and black values', () => {
    assert.equal(DOT_COLORS.RED, '#e74c3c', 'RED should be correct hex value');
    assert.equal(DOT_COLORS.BLACK, '#000000', 'BLACK should be correct hex value');
  });
});
describe('EditableSVGuitarChord (Title and Position)', () => {
  test('sets title and position via chord() method', () => {
    const mockContainer = { appendChild: () => {} };
    const editableChord = new EditableSVGuitarChord(mockContainer, MockSVGuitarChord);
    
    const testChord = {
      fingers: [[1, 0], [2, 2]],
      barres: [],
      title: 'A minor',
      position: 5
    };
    
    editableChord.chord(testChord);
    const result = editableChord.getChord();
    
    assert.equal(result.title, 'A minor');
    assert.equal(result.position, 5);
    assert.deepEqual(result.fingers, testChord.fingers);
    assert.deepEqual(result.barres, testChord.barres);
  });

  test('getChord() returns title and position', () => {
    const mockContainer = { appendChild: () => {} };
    const editableChord = new EditableSVGuitarChord(mockContainer, MockSVGuitarChord);
    
    editableChord.chord({
      fingers: [[3, 2]],
      barres: [],
      title: 'G7',
      position: 3
    });
    
    const result = editableChord.getChord();
    
    assert.equal(result.title, 'G7');
    assert.equal(result.position, 3);
  });

  test('handles empty title and undefined position', () => {
    const mockContainer = { appendChild: () => {} };
    const editableChord = new EditableSVGuitarChord(mockContainer, MockSVGuitarChord);
    
    editableChord.chord({
      fingers: [[1, 1]],
      barres: []
    });
    
    const result = editableChord.getChord();
    
    assert.equal(result.title, '');
    assert.equal(result.position, undefined);
  });

  test('omits empty title from SVGuitar config', () => {
    const mockContainer = { appendChild: () => {} };
    const editableChord = new EditableSVGuitarChord(mockContainer, MockSVGuitarChord);
    
    editableChord.chord({
      fingers: [[1, 1]],
      barres: [],
      title: '',
      position: undefined
    });
    
    const chordWithPlaceholders = editableChord.addPlaceholderDots(editableChord.chordConfig);
    
    assert.ok(!('title' in chordWithPlaceholders) || chordWithPlaceholders.title === undefined);
    assert.ok(!('position' in chordWithPlaceholders) || chordWithPlaceholders.position === undefined);
  });

  test('includes title and position in SVGuitar config when set', () => {
    const mockContainer = { appendChild: () => {} };
    const editableChord = new EditableSVGuitarChord(mockContainer, MockSVGuitarChord);
    
    editableChord.chord({
      fingers: [[1, 1]],
      barres: [],
      title: 'C Major',
      position: 8
    });
    
    const chordWithPlaceholders = editableChord.addPlaceholderDots(editableChord.chordConfig);
    
    assert.equal(chordWithPlaceholders.title, 'C Major');
    assert.equal(chordWithPlaceholders.position, 8);
  });

  test('position = 0 is valid and included', () => {
    const mockContainer = { appendChild: () => {} };
    const editableChord = new EditableSVGuitarChord(mockContainer, MockSVGuitarChord);
    
    editableChord.chord({
      fingers: [[1, 1]],
      barres: [],
      title: 'Open E',
      position: 0
    });
    
    const result = editableChord.getChord();
    const chordWithPlaceholders = editableChord.addPlaceholderDots(editableChord.chordConfig);
    
    assert.equal(result.position, 0);
    assert.equal(chordWithPlaceholders.position, 0);
  });

  test('noPosition config toggles when position is set', () => {
    const mockContainer = { appendChild: () => {} };
    const editableChord = new EditableSVGuitarChord(mockContainer, MockSVGuitarChord);
    
    // Initially noPosition should be true
    assert.equal(editableChord.config.noPosition, true);
    
    // Set position via chord()
    editableChord.chord({
      fingers: [],
      barres: [],
      position: 5
    });
    
    // noPosition should now be false
    assert.equal(editableChord.config.noPosition, false);
  });

  test('noPosition config remains true when position is undefined', () => {
    const mockContainer = { appendChild: () => {} };
    const editableChord = new EditableSVGuitarChord(mockContainer, MockSVGuitarChord);
    
    editableChord.chord({
      fingers: [],
      barres: [],
      position: undefined
    });
    
    assert.equal(editableChord.config.noPosition, true);
  });

  test('saveSettings updates title and position', () => {
    const mockContainer = { appendChild: () => {} };
    const editableChord = new EditableSVGuitarChord(mockContainer, MockSVGuitarChord);
    
    // Mock the dialog inputs
    editableChord.titleInput = { value: '  D Major  ' };
    editableChord.positionInput = { value: '7' };
    
    editableChord.chord({ fingers: [], barres: [] });
    editableChord.saveSettings();
    
    const result = editableChord.getChord();
    
    assert.equal(result.title, 'D Major');
    assert.equal(result.position, 7);
    assert.equal(editableChord.config.noPosition, false);
  });

  test('saveSettings handles empty values', () => {
    const mockContainer = { appendChild: () => {} };
    const editableChord = new EditableSVGuitarChord(mockContainer, MockSVGuitarChord);
    
    editableChord.titleInput = { value: '' };
    editableChord.positionInput = { value: '' };
    
    editableChord.chord({ fingers: [], barres: [], title: 'Old', position: 5 });
    editableChord.saveSettings();
    
    const result = editableChord.getChord();
    
    assert.equal(result.title, '');
    assert.equal(result.position, undefined);
    assert.equal(editableChord.config.noPosition, true);
  });

  test('saveSettings validates position range (too low)', () => {
    const mockContainer = { appendChild: () => {} };
    const editableChord = new EditableSVGuitarChord(mockContainer, MockSVGuitarChord);
    
    // Mock alert
    let alertCalled = false;
    global.alert = () => { alertCalled = true; };
    
    editableChord.titleInput = { value: 'Test' };
    editableChord.positionInput = { value: '-1' };
    
    editableChord.chord({ fingers: [], barres: [] });
    editableChord.saveSettings();
    
    assert.ok(alertCalled, 'Should show alert for invalid position');
    
    // Clean up
    delete global.alert;
  });

  test('saveSettings validates position range (too high)', () => {
    const mockContainer = { appendChild: () => {} };
    const editableChord = new EditableSVGuitarChord(mockContainer, MockSVGuitarChord);
    
    let alertCalled = false;
    global.alert = () => { alertCalled = true; };
    
    editableChord.titleInput = { value: 'Test' };
    editableChord.positionInput = { value: '31' };
    
    editableChord.chord({ fingers: [], barres: [] });
    editableChord.saveSettings();
    
    assert.ok(alertCalled, 'Should show alert for position > 30');
    
    delete global.alert;
  });

  test('onChange callback receives updated fingers after title/position change', () => {
    const mockContainer = { appendChild: () => {} };
    const editableChord = new EditableSVGuitarChord(mockContainer, MockSVGuitarChord);
    
    let callbackFired = false;
    let receivedFingers = null;
    
    editableChord.onChange((chord) => {
      callbackFired = true;
      receivedFingers = chord.chordConfig.fingers;
    });
    
    editableChord.titleInput = { value: 'Test' };
    editableChord.positionInput = { value: '5' };
    
    editableChord.chord({ fingers: [[1, 2]], barres: [] });
    editableChord.saveSettings();
    
    assert.ok(callbackFired, 'onChange callback should be called');
    assert.deepEqual(receivedFingers, [[1, 2]], 'Should pass fingers array to callback');
  });
});
