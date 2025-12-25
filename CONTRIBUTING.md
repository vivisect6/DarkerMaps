# Contributing to DarkerMaps

Thank you for helping make DarkerMaps better! This guide explains how to submit new quest item and creature locations via pull requests.

## Quick Start

1. Fork this repository
2. Add your location to the appropriate YAML file in `_data/locations/`
3. (Optional) Add a screenshot to `assets/screenshots/`
4. Submit a pull request

## Seasons

Location data is organized by game seasons/wipes. When a new season begins, the map data may need to be updated as quest locations can change. The current season is displayed on each map page.

## Location Data Format

Locations are stored in YAML files, one per map:

```
_data/locations/
├── blue_maelstrom.yml
├── goblin_caves.yml
└── ...
```

### Adding a Location

Add your location entry to the appropriate YAML file. Here's the format:

```yaml
locations:
  - id: "bm-001"                        # Unique ID: map-number
    name: "Treasure Hoard Location"      # Display name
    type: "quest_item"                   # Either "quest_item" or "creature"
    coordinates:
      x: 512                             # X coordinate on the map (pixels)
      y: 384                             # Y coordinate on the map (pixels)
    description: "Found in the chest near the merchant spawn point."
    screenshot: "/assets/screenshots/bm-001.jpg"  # Optional
    contributors:
      - "your_github_username"
```

### ID Format

Use this naming convention for IDs:
- `bm` = Blue Maelstrom
- `gc` = Goblin Caves
- `cr` = Crypts
- `if` = Inferno

Followed by a sequential number.

Examples:
- `bm-001` - Blue Maelstrom, location 1
- `gc-015` - Goblin Caves, location 15

### Location Types

| Type | Description |
|------|-------------|
| `quest_item` | Quest item spawn locations |
| `creature` | Creature/monster spawn points |

### Finding Coordinates

To find the X/Y coordinates for a location, you can use the **Location Editor** tool included in this repository:

1. Open `tools/location-editor.html` in your browser
2. Load the map image
3. Click on the map to place locations
4. Export the YAML when done

Alternatively, open the map image in an image editor and note the pixel coordinates (origin is top-left).

## Adding Screenshots

Screenshots help document locations and are encouraged!

### Screenshot Guidelines

1. **File format**: JPG or PNG
2. **File name**: Match the location ID (e.g., `bm-001.jpg`)
3. **Location**: Save to `assets/screenshots/`
4. **Content**: Show the item/creature location clearly
5. **Size**: Crop to relevant area, keep under 500KB

**Note**: Screenshots are proprietary game content used under Fair Use. By submitting a screenshot, you acknowledge this.

## Pull Request Process

1. **Fork** the repository
2. **Create a branch** for your changes: `git checkout -b add-location-bm-015`
3. **Add your changes**:
   - Edit the YAML file to add your location
   - (Optional) Add a screenshot
4. **Commit** with a clear message: `Add quest item location in Blue Maelstrom`
5. **Push** to your fork
6. **Open a Pull Request** against the `main` branch

### PR Checklist

- [ ] Location ID is unique and follows naming convention
- [ ] Coordinates are accurate (tested in-game if possible)
- [ ] Description is clear and helpful
- [ ] Your GitHub username is in `contributors`
- [ ] Screenshot (if included) is appropriately sized

## For Modular Maps

Modular maps (like Goblin Caves) have an additional `module` field:

```yaml
- id: "gc-001"
  name: "Quest Item"
  type: "quest_item"
  module: "A1"           # Which tile this appears on
  coordinates:
    x: 256               # Position within the tile
    y: 128
  description: "..."
  contributors:
    - "your_github_username"
```

Module IDs use a grid system: columns are letters (A-D), rows are numbers (1-4).
Example: `A1` is top-left, `D4` is bottom-right.

## Code of Conduct

- Be respectful and constructive
- Submit accurate information only
- Credit others' discoveries appropriately
- No spam or self-promotion

## Questions?

Open an issue on GitHub if you need help or have questions about contributing.

---

## Licensing

By contributing to this project, you agree that:

- **Code contributions** (HTML, CSS, JS, etc.) are licensed under the [MIT License](LICENSE)
- **Location data** (YAML files) is licensed under the [Open Database License (ODbL)](LICENSE-DATA)
- **Screenshots** are proprietary game content used under Fair Use
