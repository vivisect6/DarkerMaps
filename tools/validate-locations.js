#!/usr/bin/env node

/**
 * Validates all YAML location files against schema rules.
 * Run with: npm run validate
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Map ID to prefix mapping
const MAP_PREFIXES = {
  blue_maelstrom: 'bm',
  ruins: 'ru',
  crypts: 'cr',
  inferno: 'if',
  goblin_caves: 'gc',
  ice_caves: 'ic',
  ice_abyss: 'ia'
};

// Valid module IDs for modular maps (5x5 grid)
const VALID_MODULES = [];
for (const row of ['A', 'B', 'C', 'D', 'E']) {
  for (const col of [1, 2, 3, 4, 5]) {
    VALID_MODULES.push(`${row}${col}`);
  }
}

let errors = [];
let warnings = [];

function addError(file, message, locationId = null) {
  const prefix = locationId ? `Location ${locationId}: ` : '';
  errors.push({ file, message: `${prefix}${message}` });
}

function addWarning(file, message, locationId = null) {
  const prefix = locationId ? `Location ${locationId}: ` : '';
  warnings.push({ file, message: `${prefix}${message}` });
}

function validateMapInfo(mapInfo, mapId, file) {
  // Required fields
  const required = ['name', 'type', 'image', 'dimensions'];
  for (const field of required) {
    if (!mapInfo[field]) {
      addError(file, `map_info missing required field: ${field}`);
    }
  }

  // Type must be fixed or modular
  if (mapInfo.type && !['fixed', 'modular'].includes(mapInfo.type)) {
    addError(file, `map_info.type must be "fixed" or "modular", got "${mapInfo.type}"`);
  }

  // Dimensions must have numeric width and height
  if (mapInfo.dimensions) {
    if (typeof mapInfo.dimensions.width !== 'number') {
      addError(file, 'map_info.dimensions.width must be a number');
    }
    if (typeof mapInfo.dimensions.height !== 'number') {
      addError(file, 'map_info.dimensions.height must be a number');
    }
  }

  // Modular maps must have grid_size
  if (mapInfo.type === 'modular') {
    if (!mapInfo.grid_size) {
      addError(file, 'modular maps must have map_info.grid_size');
    } else {
      if (typeof mapInfo.grid_size.cols !== 'number') {
        addError(file, 'map_info.grid_size.cols must be a number');
      }
      if (typeof mapInfo.grid_size.rows !== 'number') {
        addError(file, 'map_info.grid_size.rows must be a number');
      }
    }
  }
}

function validateCategories(categories, file) {
  if (!Array.isArray(categories)) {
    addError(file, 'categories must be an array');
    return [];
  }

  const categoryIds = new Set();
  const required = ['id', 'name', 'icon'];

  for (const category of categories) {
    // Required fields
    for (const field of required) {
      if (!category[field]) {
        addError(file, `category missing required field: ${field}`);
      }
    }

    // Unique IDs
    if (category.id) {
      if (categoryIds.has(category.id)) {
        addError(file, `duplicate category ID: ${category.id}`);
      }
      categoryIds.add(category.id);
    }
  }

  return Array.from(categoryIds);
}

function validateLocations(locations, mapInfo, categoryIds, mapId, file) {
  if (!Array.isArray(locations)) {
    addError(file, 'locations must be an array');
    return;
  }

  const locationIds = new Set();
  const expectedPrefix = MAP_PREFIXES[mapId];
  const isModular = mapInfo.type === 'modular';
  const maxX = mapInfo.dimensions?.width || Infinity;
  const maxY = mapInfo.dimensions?.height || Infinity;

  for (const location of locations) {
    const locId = location.id || '(no id)';

    // Required fields
    if (!location.id) {
      addError(file, 'location missing required field: id', locId);
    }
    if (!location.type) {
      addError(file, 'location missing required field: type', locId);
    }
    if (!location.coordinates) {
      addError(file, 'location missing required field: coordinates', locId);
    }

    // Unique location IDs
    if (location.id) {
      if (locationIds.has(location.id)) {
        addError(file, `duplicate location ID: ${location.id}`, locId);
      }
      locationIds.add(location.id);
    }

    // ID format: {prefix}-{type}-{number}
    if (location.id && expectedPrefix) {
      const idPattern = new RegExp(`^${expectedPrefix}-[a-z_]+-\\d{3}$`);
      if (!idPattern.test(location.id)) {
        addWarning(file, `ID format should be "${expectedPrefix}-{type}-{number}" (e.g., "${expectedPrefix}-${location.type || 'type'}-001")`, locId);
      }
    }

    // Type must reference valid category
    if (location.type && categoryIds.length > 0) {
      if (!categoryIds.includes(location.type)) {
        addError(file, `type "${location.type}" does not match any category ID (valid: ${categoryIds.join(', ')})`, locId);
      }
    }

    // Coordinates must be numeric and within bounds
    if (location.coordinates) {
      const x = location.coordinates.x;
      const y = location.coordinates.y;

      if (typeof x !== 'number') {
        addWarning(file, `coordinates.x should be a number, got ${typeof x}`, locId);
      }
      if (typeof y !== 'number') {
        addWarning(file, `coordinates.y should be a number, got ${typeof y}`, locId);
      }

      if (typeof x === 'number' && (x < 0 || x > maxX)) {
        addError(file, `coordinates.x (${x}) is out of bounds (0-${maxX})`, locId);
      }
      if (typeof y === 'number' && (y < 0 || y > maxY)) {
        addError(file, `coordinates.y (${y}) is out of bounds (0-${maxY})`, locId);
      }
    }

    // Modular maps: must have valid module
    if (isModular) {
      if (!location.module) {
        addError(file, 'modular map locations must have a module field', locId);
      } else if (!VALID_MODULES.includes(location.module)) {
        addError(file, `invalid module "${location.module}" (valid: A1-E5)`, locId);
      }
    }
  }
}

function validateFile(filePath) {
  const fileName = path.basename(filePath);
  const mapId = path.basename(filePath, '.yml');

  console.log(`Validating ${fileName}...`);

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    addError(fileName, `Failed to read file: ${err.message}`);
    return;
  }

  let data;
  try {
    data = yaml.load(content);
  } catch (err) {
    addError(fileName, `Invalid YAML syntax: ${err.message}`);
    return;
  }

  if (!data) {
    addError(fileName, 'File is empty or invalid');
    return;
  }

  // Validate map_info
  if (!data.map_info) {
    addError(fileName, 'Missing map_info section');
  } else {
    validateMapInfo(data.map_info, mapId, fileName);
  }

  // Validate categories
  let categoryIds = [];
  if (!data.categories) {
    addError(fileName, 'Missing categories section');
  } else {
    categoryIds = validateCategories(data.categories, fileName);
  }

  // Validate locations
  if (data.locations === undefined) {
    addError(fileName, 'Missing locations section');
  } else {
    validateLocations(data.locations, data.map_info || {}, categoryIds, mapId, fileName);
    const count = Array.isArray(data.locations) ? data.locations.length : 0;
    console.log(`  ${count} location(s) checked`);
  }
}

function main() {
  const locationsDir = path.join(__dirname, '..', '_data', 'locations');

  if (!fs.existsSync(locationsDir)) {
    console.error(`Error: Directory not found: ${locationsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(locationsDir)
    .filter(f => f.endsWith('.yml'))
    .map(f => path.join(locationsDir, f));

  if (files.length === 0) {
    console.error('Error: No YAML files found in _data/locations/');
    process.exit(1);
  }

  console.log(`Found ${files.length} location file(s)\n`);

  for (const file of files) {
    validateFile(file);
  }

  console.log('');

  // Print warnings
  if (warnings.length > 0) {
    console.log('Warnings:');
    for (const w of warnings) {
      console.log(`  ${w.file}: ${w.message}`);
    }
    console.log('');
  }

  // Print errors
  if (errors.length > 0) {
    console.log('Errors:');
    for (const e of errors) {
      console.log(`  ${e.file}: ${e.message}`);
    }
    console.log('');
  }

  // Summary
  console.log(`Validation complete: ${warnings.length} warning(s), ${errors.length} error(s)`);

  if (errors.length > 0) {
    process.exit(1);
  }
}

main();
