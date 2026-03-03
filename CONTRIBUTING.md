# Contributing to DarkerMaps

This guide explains how to submit new quest item and creature locations via pull requests.

## Quick Start

1. Fork this repository
2. Use the **Location Editor** to add your locations and export the YAML
3. Add screenshots to `assets/screenshots/{map_id}/`
4. Submit a pull request

## Seasons

When a new season begins, the map data may need to be updated as quest locations can change. The current season is displayed on each map page.

## Using the Location Editor

The Location Editor is the recommended way to add locations. It handles ID generation, coordinates, and screenshot paths automatically.

### Running the Editor

**Option 1: Use the live site**
- Go to [Darker Maps Location Editor](https://vivisect6.github.io/DarkerMaps/tools/location-editor.html)

**Option 2: Run locally**
1. Clone your fork of the repository
2. Run `bundle exec jekyll serve`
3. Open `http://localhost:4000/tools/location-editor`

### Adding a Location

1. **Select a Type** from the dropdown (e.g., Mermaid, Giant Clam)
   - This filters the map to show only that type
2. **Click on the map** to place a marker at the location
   - The ID and screenshot path are generated automatically
3. **Add a description** explaining where to find it
4. Click **Save Location** to add it to the working list
5. Repeat for additional locations
6. Click **Save Changes** to export the YAML file
7. Replace the file in `_data/locations/` with your exported version

### Editing Existing Locations

- Click any marker on the map to select it
- Modify the description or click **Move** then click the map to reposition
- Click **Save Location** to apply changes
- Click **Save Changes** to export

## Taking Screenshots

Screenshots help document locations and are encouraged!

### In-Game Tips

- Press `Shift + \` to hide the HUD
- Press `X` to holster your weapons
- Keep the location item/creature clearly in frame

### File Requirements

- **Format**: JPG (preferred) or PNG
- **Name**: Match the location ID (e.g., `bm-mermaid-001.jpg`)
  - The Location Editor shows the expected filename
- **Location**: Save to `assets/screenshots/{map_id}/`
- **Size**: Crop to the relevant area, keep under 500KB

**Note**: Screenshots are proprietary game content used under Fair Use. By submitting a screenshot, you acknowledge this.

## Pull Request Process

1. **Fork** the repository
2. **Create a branch** for your changes: `git checkout -b add-mermaid-locations`
3. **Use the Location Editor** to add your locations and export the YAML
4. **Replace** the YAML file in `_data/locations/`
5. **Add screenshots** to `assets/screenshots/{map_id}/`
6. **Commit** with a clear message: `Add mermaid locations in Blue Maelstrom`
7. **Push** to your fork and **open a Pull Request**

### PR Checklist

- [ ] Used the Location Editor to add locations
- [ ] Coordinates are accurate (verified in-game)
- [ ] Description is clear and helpful
- [ ] Screenshots follow the naming convention
- [ ] Screenshots have HUD disabled and weapons holstered

## Code of Conduct

- Be respectful and constructive
- Submit accurate information only
- No spam or self-promotion

## Questions?

Open an issue on GitHub if you need help or have questions about contributing.

---

## Licensing

By contributing to this project, you agree that:

- **Code contributions** (HTML, CSS, JS, etc.) are licensed under the [MIT License](LICENSE)
- **Location data** (YAML files) is licensed under the [Open Database License (ODbL)](LICENSE-DATA)
- **Screenshots** are proprietary game content used under Fair Use
