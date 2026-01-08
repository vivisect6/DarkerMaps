# DarkerMaps

Interactive maps with crowdsourced quest item and creature locations for **Dark and Darker**.

## Available Maps

| Map | Type | Status |
|-----|------|--------|
| Blue Maelstrom | Fixed | Available |

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to submit new locations.

### Quick Start

1. Fork this repository
2. Follow steps to setup local dev and use the location editor `tools/location-editor.html` to add locations. 
3. "Save Changes" to `_data/locations/[map].yml`
4. (Optional) Add a screenshot to `assets/screenshots/[map]/`
5. Submit a pull request

## Licensing

This project uses a split licensing model:

| Content | License |
|---------|---------|
| Source code (HTML, CSS, JS, Jekyll config) | [MIT License](LICENSE) |
| Location data (YAML files in `_data/`) | [Open Database License (ODbL)](LICENSE-DATA) |
| Map images and screenshots | Proprietary (Fair Use) |

### Attribution

When using the location data, please attribute as:

> Location data from [DarkerMaps](https://github.com/vivisect6/DarkerMaps), available under the Open Database License (ODbL).

## Development

### Prerequisites

- Ruby (for Jekyll) with Devkit
- Bundler

### Local Development

```bash
# Install dependencies
bundle install

# Run local server
bundle exec jekyll serve

# View at http://localhost:4000
# location editoor tool at http://localhost:4000/tools/location-editor.html
```

### Project Structure

```
DarkerMaps/
├── _config.yml           # Jekyll configuration
├── _data/
│   └── locations/        # YAML location data (ODbL)
├── _includes/            # Jekyll includes
├── _layouts/             # Page layouts
├── assets/
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript
│   ├── maps/             # Map images (proprietary)
│   └── screenshots/      # Location screenshots (proprietary)
├── maps/                 # Map pages
├── CONTRIBUTING.md       # Contribution guide
├── LICENSE               # MIT License (code)
└── LICENSE-DATA          # ODbL License (data)
```

## Deployment

The site is automatically deployed to GitHub Pages via GitHub Actions when changes are pushed to the `main` branch.

## Disclaimer

Dark and Darker is a trademark of IRONMACE. This project is not affiliated with or endorsed by IRONMACE. Map images and game screenshots are used under Fair Use for the purpose of community education and assistance.

## Support

- [Open an issue](https://github.com/vivisect6/DarkerMaps/issues) for bugs or feature requests
- Submit a pull request to contribute locations
