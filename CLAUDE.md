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
├── config.json                 # Configuration (scenario file)
├── scenario-*.json             # Scenario data files
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

| Constant | Value | Used in |
|----------|-------|---------|
| `nodeWidth` | 140px | Both files |
| `levelHeight` | 120px | Tree vertical spacing |
| `nodeHeight` | 44px | Editor only |
| `padding` | 60px | Both files |

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
| `scenario` | string | required | JSON file to load |
| `showCredits` | boolean | `true` | Show author credits |

## Review Focus

When reviewing this project, check:

- [ ] Button colors follow convention (destructive = red + uppercase)
- [ ] Tree layout constants are consistent between files
- [ ] Section separators present in both HTML files
- [ ] Credits visible in both navigator and editor
- [ ] Scenario JSON files have complete `translations` section
