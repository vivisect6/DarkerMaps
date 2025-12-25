# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DarkerMaps is an interactive web application for crowdsourced quest item and creature locations in the video game "Dark and Darker". Built with Jekyll and Leaflet.js, it provides zoomable maps with community-contributed location markers.

## Build & Development Commands

```bash
# Install dependencies
bundle install

# Run local development server (http://localhost:4000)
bundle exec jekyll serve

# Build for production (outputs to _site/)
bundle exec jekyll build
```

## Architecture

### Data Flow
```
YAML Location Data (_data/locations/*.yml)
    ↓ Jekyll Build
JSON files (assets/data/*.json)
    ↓ Page Load
map.js initializes Leaflet map and renders markers
```

### Key Components

- **Location Data** (`_data/locations/`): YAML files containing map_info, categories, and locations (per-map)
- **Map Frontend** (`assets/js/map.js`): IIFE-encapsulated Leaflet.js integration with filter management and async data loading
- **Location Editor** (`tools/location-editor.html`): Standalone tool for visual location editing and YAML export
- **Templates** (`_layouts/`): Jekyll layouts - `default.html` (base) and `map.html` (map pages)
- **Icons** (`assets/icons/`): Shared SVG icons used across all maps

### Maps

| Map ID | Display Name | Type | Prefix |
|--------|--------------|------|--------|
| `blue_maelstrom` | Blue Maelstrom | fixed | bm |
| `ruins` | Ruins of the Forgotten Castle | modular | ru |
| `crypts` | Crypts | modular | cr |
| `inferno` | Inferno | modular | if |
| `goblin_caves` | Goblin Caves | modular | gc |
| `ice_caves` | Ice Caves | modular | ic |
| `ice_abyss` | Ice Abyss | modular | ia |

### Map Types
- **Fixed**: Single static image (e.g., Blue Maelstrom)
- **Modular**: 5x5 tiled grids with module selector, supports combined tiles (2x1, 2x2)

### Coordinate System
Leaflet CRS.Simple (pixel-based): origin at top-left, X=horizontal, Y=vertical.

## Location Data Format

Each map has its own YAML file with categories embedded:

```yaml
map_info:
  name: "Map Name"
  type: "modular"  # or "fixed"
  image: "/assets/maps/map_id/map.png"
  dimensions: { width: 2048, height: 2048 }
  grid_size: { cols: 5, rows: 5 }  # For modular maps
  # grid_tiles: []  # Optional: define combined tiles
  season: "Season 1"

categories:  # Per-map categories
  - id: mermaid
    name: Mermaid
    icon: "/assets/icons/mermaid.svg"

locations:
  - id: "bm-mermaid-001"
    type: "mermaid"  # Must match a category id
    module: "A1"  # Required for modular maps only
    coordinates: { x: 573, y: 283 }
    description: "Description"
    screenshot: "/assets/screenshots/blue_maelstrom/bm-mermaid-001.jpg"
    contributors: ["github_username"]
```

## Combined Tiles (Modular Maps)

For tiles that span multiple grid cells, use `grid_tiles`:

```yaml
map_info:
  grid_size: { cols: 5, rows: 5 }
  grid_tiles:
    - id: A1
      position: { col: 0, row: 0 }
      span: { cols: 1, rows: 1 }
    - id: A2-B2
      position: { col: 0, row: 1 }
      span: { cols: 2, rows: 1 }
      label: "A2-B2"
```

## File Naming Conventions

- Location IDs: `{map-prefix}-{type}-{number}` (e.g., `bm-mermaid-001`)
- Map data files match map directory names (e.g., `blue_maelstrom.yml`)
- Screenshots: `/assets/screenshots/{map_id}/{location-id}.jpg`

## Adding a New Map

1. Create `_data/locations/{map_id}.yml` with map_info, categories, and empty locations array
2. Create `assets/data/{map_id}.json` Jekyll template to output JSON
3. Create `maps/{map_id}/index.html` with map frontmatter
4. Create `assets/maps/{map_id}/` directory for map images
5. Add map card to `index.html`
6. Update `tools/location-editor.html` with new map in dropdown and prefix

## Deployment

Automatic via GitHub Actions on push to `main` branch - builds Jekyll and deploys to GitHub Pages.

## Licensing

- Code (HTML, CSS, JS): MIT License
- Location Data (YAML): ODbL (requires attribution, share-alike)
