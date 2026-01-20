# Branching Navigator

Interactive decision-tree framework for educational scenarios, training, and storytelling.

**Author**: Paolo Dalprato (https://ai-know.pro)

## Stack

- **Framework**: React 18 via CDN (unpkg)
- **Styling**: Tailwind CSS + custom CSS
- **Build**: None (single HTML files)
- **Data**: JSON scenario files

## File Structure

```
branching-navigator/
├── branching-navigator.html    # Main navigator engine
├── scenario-editor.html        # Visual editor for scenarios
├── theme-editor.html           # Visual editor for themes
├── shared-styles.css           # Common CSS for editors
├── config.json                 # Configuration (scenario + theme files)
├── defaults.json               # Shared defaults (layout, fonts, theme)
├── scenario-*.json             # Scenario data files
├── theme.json                  # Theme configuration (colors, branding)
├── start-navigator.bat         # Launch navigator (port 8000)
├── start-editor.bat            # Launch scenario editor (port 8000)
├── start-theme-editor.bat      # Launch theme editor (port 8000)
├── docs/                       # Downloadable resources
└── images/                     # Screenshots for README
```

## Code Conventions

### Section Separators

Use this format in HTML files:

```javascript
// ============================================================
// SECTION NAME
// ============================================================
```

### Component Order

1. Constants and data structures
2. Helper functions
3. Child components (smallest first)
4. Main component
5. ReactDOM.render

## UI Conventions

### Button Colors

| Type | Background | Text | Use |
|------|------------|------|-----|
| Primary | `#6366f1` (indigo) | white | Main actions |
| Success | `#10b981` (green) | white | Add, Create, Confirm |
| Danger | `#ef4444` (red) | white, UPPERCASE | Delete, Remove, Cancel, Close |
| Secondary | `#374151` (gray) | light gray | Neutral actions |

**Rule**: All destructive buttons (delete, remove, cancel, close) use red background with uppercase text.

### CSS Classes

- `.btn-danger`, `.btn-close`: Red background, uppercase, font-weight 600
- `.btn-success`: Green background for add/create actions
- `.close-button` (navigator): Same red style for map close

## Magic Numbers

### Tree Map Layout

Layout constants are centralized in `defaults.json` under the `layout` key:

| Constant | Value | Description |
|----------|-------|-------------|
| `nodeWidth` | 140px | Horizontal spacing between nodes |
| `levelHeight` | 120px | Vertical spacing between levels |
| `nodeHeight` | 44px | Node box height (editor only) |
| `padding` | 60px | SVG padding around the tree |

### Text Truncation

| Context | Max chars | Display |
|---------|-----------|---------|
| Tree map node title | 15 | 12 + '...' |
| Node list title | 30 | Full or truncated |
| Node ID in tree | 14 | 12 + '..' |

## Content Format

All content uses plain strings (monolingual):

```json
{
    "meta": { "title": "Scenario Title", "description": "..." },
    "translations": { "step": "Step", "restart": "Start Over", ... },
    "nodes": { "start": { "content": "# Welcome", "choices": [...] } }
}
```

**⚠️ Required**: Every scenario JSON must have a complete `translations` section. Without it, navigation buttons will have no text. Required keys: `step`, `restart`, `endOfPath`, `resources`, `viewMap`, `mapOf`, `back`, `download`, `openLink`, `watchVideo`.

## Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `scenario` | string | required | Scenario JSON file to load |
| `theme` | string | `"theme.json"` | Theme JSON file to load |
| `showCredits` | boolean | `true` | Show author credits |

## Defaults (defaults.json)

Centralized definitions shared between all components:

```json
{
    "layout": {
        "levelHeight": 120,
        "nodeWidth": 140,
        "nodeHeight": 44,
        "padding": 60
    },
    "fontOptions": {
        "system": { "name": "System Default", "family": "...", "google": false },
        "inter": { "name": "Inter", "family": "'Inter', sans-serif", "google": true }
        // ... other Google Fonts
    },
    "defaultTheme": {
        "brand": { "name": "", "logo": "", "website": "", "position": {...} },
        "typography": { "fontFamily": "system" },
        "colors": { "background": "#ffffff", "text": "#1f2937", ... },
        "buttons": { "choiceBackground": "#6366f1", ... },
        "map": { "nodeCurrent": "#6366f1", ... }
    }
}
```

**⚠️ Required**: All HTML files load this file at startup. It must be present for the application to work.

## Theme Structure

Theme files define colors and branding. All values are optional (defaults from `defaults.json` are applied):

```json
{
    "brand": {
        "name": "Company Name",
        "logo": "https://example.com/logo.png",
        "website": "https://example.com"
    },
    "colors": {
        "background": "#ffffff",
        "text": "#1f2937",
        "accent": "#6366f1"
    },
    "buttons": {
        "choiceBackground": "#6366f1",
        "visitedBackground": "#10b981"
    },
    "map": {
        "nodeCurrent": "#6366f1",
        "nodeVisited": "#3730a3"
    }
}
```

Multiple theme files can be created (e.g., `theme-dark.json`, `theme-corporate.json`) and switched via `config.json`.

## Tree Map Features

Both navigator and editor maps share consistent visual features:

### Connection Types & Colors

| Type | Color | Style | Description |
|------|-------|-------|-------------|
| Forward (unvisited) | Theme gray | Dashed | Normal progression to next level |
| Forward (visited) | Theme accent | Solid | Already traversed path |
| Backward (loop) | `#f59e0b` amber | Solid + curve | Returns to higher level |
| Same level | `#8b5cf6` purple | Solid + curve | Horizontal connection |
| Selected/Hover | `#6366f1` indigo | Solid, 4px | User interaction highlight |

### Visual Features

- **Arrows at midpoint**: All connections display directional arrows at the center of the line
- **Curved paths**: Backward and same-level connections use quadratic bezier curves
- **Click to select**: Click any connection to highlight it (toggle)
- **Hover effect**: Connections highlight on mouse hover
- **Wide click area**: Invisible 15px path for easier selection

### Arrow Size

Arrow polygon: `points="-10,-6 10,0 -10,6"` (consistent across both maps)

## Choice Editor (Scenario Editor)

### Validation System

The ChoiceEditor uses a "Save Choice" pattern with dual validation:

| Field | Required | Validation |
|-------|----------|------------|
| Button Text | Yes | Non-empty string |
| Target Node | Yes | Must select a node |

### Visual States

| State | Border Color | Indicator |
|-------|--------------|-----------|
| Incomplete | Gray `#e5e7eb` | - |
| Unsaved changes | Amber `#f59e0b` | `● unsaved` |
| Complete & saved | Green `#10b981` | `✓` |
| Validation error | Red `#ef4444` | Error message |

### Behavior

1. Changes are tracked locally until "Save Choice" is clicked
2. Save validates both fields are filled
3. Creating a new node auto-saves if button text exists
4. Visual feedback shows save state at all times

## Review Focus

When reviewing this project, check:

- [ ] Button colors follow convention (destructive = red + uppercase)
- [ ] Tree layout constants are consistent between files
- [ ] Section separators present in both HTML files
- [ ] Credits visible in both navigator and editor
- [ ] Scenario JSON files have complete `translations` section
- [ ] Map connections use correct colors for connection types
- [ ] Arrows display at midpoint of all connections
