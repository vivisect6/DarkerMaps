/**
 * DarkerMaps - Interactive Map Viewer
 * Handles map rendering, location markers, filtering, and popups
 */

(function() {
    'use strict';

    // Global state
    let map = null;
    let markersLayer = null;
    let locationData = null;
    let locationContributors = {}; // Map of location ID -> contributor username
    let categories = [];
    let activeFilters = {};
    let activeModules = new Set(); // For modular maps

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        const mapElement = document.getElementById('map');
        if (!mapElement) return;

        const mapId = mapElement.dataset.mapId;
        const mapType = mapElement.dataset.mapType;
        const mapImage = mapElement.dataset.mapImage;
        const mapWidth = parseInt(mapElement.dataset.mapWidth, 10) || 2048;
        const mapHeight = parseInt(mapElement.dataset.mapHeight, 10) || 2048;

        // Load map data (includes categories and locations)
        await loadMapData(mapId);

        // Load location contributors data
        await loadLocationContributors();

        initMap(mapElement, mapType, mapImage, mapWidth, mapHeight);
        setupFilters();
        setupBestFit(mapWidth, mapHeight);
        setupScreenshotModal();

        // For modular maps, init module selector from loaded data
        if (locationData && locationData.map_info && locationData.map_info.type === 'modular') {
            initModuleSelector(locationData.map_info);
        }

        renderMarkers();
    }

    /**
     * Load map data including categories and locations
     */
    async function loadMapData(mapId) {
        const dataPath = `/assets/data/${mapId}.json`;

        try {
            const response = await fetch(dataPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            locationData = await response.json();

            // Extract categories from map data
            categories = locationData.categories || [];

            // Fallback to default if no categories defined
            if (categories.length === 0) {
                console.warn('No categories found in map data, using defaults');
                categories = [
                    { id: 'placeholder', name: 'Placeholder', icon: '/assets/icons/placeholder.svg' }
                ];
            }

            // Initialize activeFilters based on loaded categories (default: none selected)
            categories.forEach(cat => {
                activeFilters[cat.id] = false;
            });

        } catch (error) {
            console.error('Error loading map data:', error);
            // Fallback defaults
            categories = [
                { id: 'placeholder', name: 'Placeholder', icon: '/assets/icons/placeholder.svg' }
            ];
            categories.forEach(cat => {
                activeFilters[cat.id] = false;
            });
        }
    }

    /**
     * Load location contributors data
     */
    async function loadLocationContributors() {
        try {
            const response = await fetch('/assets/data/location_contributors.json');
            if (response.ok) {
                const data = await response.json();
                locationContributors = data || {}; // Handle null/undefined JSON
            }
        } catch (error) {
            // Silently fail - contributors are optional
            locationContributors = {};
        }
    }

    /**
     * Get category by ID
     */
    function getCategory(id) {
        return categories.find(cat => cat.id === id) || categories[0];
    }

    /**
     * Initialize Leaflet map with image overlay
     */
    function initMap(element, mapType, mapImage, width, height) {
        // Calculate bounds based on image dimensions
        const bounds = [[0, 0], [height, width]];

        // Create map with CRS.Simple for pixel coordinates
        // Note: maxBounds disabled to allow popup autopan to work correctly
        map = L.map(element, {
            crs: L.CRS.Simple,
            minZoom: -2,
            maxZoom: 2,
            zoomSnap: 0.25,
            zoomDelta: 0.5
        });

        // Add the map image as an overlay
        if (mapImage) {
            L.imageOverlay(mapImage, bounds).addTo(map);
        }

        // Fit the map to the image bounds (not the expanded maxBounds)
        map.fitBounds(bounds);

        // Create markers layer group
        markersLayer = L.layerGroup().addTo(map);

        // Setup zoom-dependent marker scaling
        updateMarkerScale();
        map.on('zoomend', updateMarkerScale);
    }

    /**
     * Update marker scale based on current zoom level
     */
    function updateMarkerScale() {
        // Scale range: 0.4 at minZoom (-2), 0.75 at zoom 0+
        const zoom = map.getZoom();
        const scale = Math.min(0.75, Math.max(0.4, (zoom + 2) / 2 * 0.35 + 0.4));
        document.documentElement.style.setProperty('--marker-scale', scale);
    }

    /**
     * Initialize module selector grid for modular maps
     * Supports both regular grids and combined tiles (2x1, 2x2, etc.)
     */
    function initModuleSelector(mapInfo) {
        const grid = document.getElementById('module-grid');
        if (!grid) return;

        grid.innerHTML = '';
        const gridSize = mapInfo.grid_size || { cols: 5, rows: 5 };
        const { cols, rows } = gridSize;
        const gridTiles = mapInfo.grid_tiles || null;

        // Set CSS grid dimensions
        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

        if (gridTiles && gridTiles.length > 0) {
            // Use custom tile configuration for combined tiles
            gridTiles.forEach(tile => {
                const cell = document.createElement('div');
                cell.className = 'module-cell';
                cell.textContent = tile.label || tile.id;
                cell.dataset.module = tile.id;

                // Apply grid span for combined tiles
                const pos = tile.position || { col: 0, row: 0 };
                const span = tile.span || { cols: 1, rows: 1 };
                cell.style.gridColumn = `${pos.col + 1} / span ${span.cols}`;
                cell.style.gridRow = `${pos.row + 1} / span ${span.rows}`;

                cell.addEventListener('click', () => toggleModule(tile.id, cell));
                grid.appendChild(cell);
            });
        } else {
            // Default: generate regular grid (A1, B1, C1, etc.)
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const moduleId = String.fromCharCode(65 + col) + (row + 1);
                    const cell = document.createElement('div');
                    cell.className = 'module-cell';
                    cell.textContent = moduleId;
                    cell.dataset.module = moduleId;
                    cell.addEventListener('click', () => toggleModule(moduleId, cell));
                    grid.appendChild(cell);
                }
            }
        }
    }

    /**
     * Toggle a module on/off for modular maps
     */
    function toggleModule(moduleId, cell) {
        if (activeModules.has(moduleId)) {
            activeModules.delete(moduleId);
            cell.classList.remove('active');
        } else {
            activeModules.add(moduleId);
            cell.classList.add('active');
        }
        renderMarkers();
    }

    /**
     * Render location markers on the map
     */
    function renderMarkers() {
        if (!locationData || !locationData.locations) return;

        // Clear existing markers
        markersLayer.clearLayers();

        const locations = locationData.locations.filter(loc => shouldShowLocation(loc));

        locations.forEach(location => {
            const marker = createMarker(location);
            if (marker) {
                markersLayer.addLayer(marker);
            }
        });
    }

    /**
     * Check if a location should be shown based on filters
     */
    function shouldShowLocation(location) {
        // Type filter
        if (!activeFilters[location.type]) {
            return false;
        }

        // Module filter (for modular maps)
        if (locationData.map_info && locationData.map_info.type === 'modular') {
            if (activeModules.size > 0 && !activeModules.has(location.module)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Create a Leaflet marker for a location
     */
    function createMarker(location) {
        if (!location.coordinates) return null;

        const { x, y } = location.coordinates;
        const category = getCategory(location.type);

        // Create custom icon using SVG
        const iconHtml = `<div class="location-marker">
            <img src="${category.icon}" alt="${category.name}" class="marker-icon">
        </div>`;

        const icon = L.divIcon({
            html: iconHtml,
            className: 'custom-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        // Create marker at [y, x] because Leaflet uses [lat, lng] which maps to [y, x] in our coordinate system
        const marker = L.marker([y, x], { icon: icon });

        // Add popup with generous top padding so it's always visible
        marker.bindPopup(() => createPopupContent(location), {
            maxWidth: 350,
            minWidth: 250,
            autoPan: true,
            autoPanPaddingTopLeft: L.point(50, 250),
            autoPanPaddingBottomRight: L.point(50, 50)
        });

        return marker;
    }

    /**
     * Create popup HTML content for a location
     */
    function createPopupContent(location) {
        const category = getCategory(location.type);

        // Get contributor from automated git history data
        const contributor = locationContributors[location.id];
        const contributorHtml = contributor
            ? `<div class="contributors">Added by: <a href="https://github.com/${contributor}" target="_blank" rel="noopener">${contributor}</a></div>`
            : '';

        const screenshot = location.screenshot
            ? `<img src="${location.screenshot}" alt="${category.name}" class="location-screenshot" onclick="window.DarkerMaps.showScreenshot('${location.screenshot}', '${category.name}')" loading="lazy">`
            : '';

        const editUrl = `https://github.com/vivisect6/DarkerMaps/edit/main/_data/locations/`;

        const typeIcon = category.icon
            ? `<img src="${category.icon}" alt="${category.name}" class="popup-type-icon">`
            : '';

        return `
            <div class="location-popup">
                <div class="location-type">${typeIcon}<span>${category.name}</span></div>
                <p class="location-description">${escapeHtml(location.description || 'No description available.')}</p>
                ${screenshot}
                <div class="location-meta">
                    ${contributorHtml}
                    <a href="${editUrl}" target="_blank" class="edit-link">Edit this location via Pull Request</a>
                </div>
            </div>
        `;
    }

    /**
     * Setup filter checkboxes - dynamically generated from categories
     */
    function setupFilters() {
        const filterGroup = document.getElementById('filter-group');

        // Sort categories alphabetically by name
        const sortedCategories = [...categories].sort((a, b) =>
            a.name.localeCompare(b.name)
        );

        // Generate filter checkboxes from categories
        if (filterGroup) {
            filterGroup.innerHTML = sortedCategories.map(cat => `
                <label class="filter-checkbox">
                    <input type="checkbox" id="filter-${cat.id}">
                    <span class="filter-label"><img src="${cat.icon}" alt="${cat.name}" class="filter-icon">${cat.name}</span>
                </label>
            `).join('');

            // Add event listeners to each filter
            sortedCategories.forEach(cat => {
                const checkbox = document.getElementById(`filter-${cat.id}`);
                if (checkbox) {
                    checkbox.addEventListener('change', (e) => {
                        activeFilters[cat.id] = e.target.checked;
                        renderMarkers();
                    });
                }
            });
        }

        // Select All / Deselect All buttons
        const selectAllBtn = document.getElementById('select-all-filters');
        const deselectAllBtn = document.getElementById('deselect-all-filters');

        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                categories.forEach(cat => {
                    const checkbox = document.getElementById(`filter-${cat.id}`);
                    if (checkbox) checkbox.checked = true;
                    activeFilters[cat.id] = true;
                });
                renderMarkers();
            });
        }

        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => {
                categories.forEach(cat => {
                    const checkbox = document.getElementById(`filter-${cat.id}`);
                    if (checkbox) checkbox.checked = false;
                    activeFilters[cat.id] = false;
                });
                renderMarkers();
            });
        }
    }

    /**
     * Setup Best Fit control on map
     */
    function setupBestFit(mapWidth, mapHeight) {
        const fullBounds = [[0, 0], [mapHeight, mapWidth]];

        // Create custom Leaflet control
        const BestFitControl = L.Control.extend({
            options: {
                position: 'topleft'
            },
            onAdd: function() {
                const container = L.DomUtil.create('div', 'leaflet-control-bestfit leaflet-bar');
                const link = L.DomUtil.create('a', '', container);
                link.href = '#';
                link.title = 'Best Fit';
                link.innerHTML = '⊡';
                link.setAttribute('role', 'button');
                link.setAttribute('aria-label', 'Best Fit');

                L.DomEvent.disableClickPropagation(container);
                L.DomEvent.on(link, 'click', function(e) {
                    L.DomEvent.preventDefault(e);
                    map.fitBounds(fullBounds);
                });

                return container;
            }
        });

        map.addControl(new BestFitControl());
    }

    /**
     * Setup screenshot modal
     */
    function setupScreenshotModal() {
        // Create modal element
        const modal = document.createElement('div');
        modal.className = 'screenshot-modal';
        modal.innerHTML = `
            <span class="close-btn">&times;</span>
            <img src="" alt="">
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        // Expose function to show screenshot
        window.DarkerMaps = window.DarkerMaps || {};
        window.DarkerMaps.showScreenshot = function(src, alt) {
            const img = modal.querySelector('img');
            img.src = src;
            img.alt = alt;
            modal.classList.add('active');
        };
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Expose functions for external use
    window.DarkerMaps = window.DarkerMaps || {};
    window.DarkerMaps.loadMapData = loadMapData;
    window.DarkerMaps.renderMarkers = renderMarkers;

})();
