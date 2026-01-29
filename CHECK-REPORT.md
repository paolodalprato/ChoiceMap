# Check Report

**Project**: D:/GITHUB/choicemap
**Date**: 2026-01-28
**Checks**: structure, code-review

---

## Summary

| Check | Status | Issues |
|-------|--------|--------|
| Structure | ⚠️ Limited | N/A (no modular JS/TS) |
| Code Review | 🟡 Moderate | 12 findings |

---

## Structure Analysis

### Overview

Lo structure-agent non ha rilevato moduli JS/TS perché il progetto utilizza un'architettura monolitica basata su file HTML con JavaScript inline (React via CDN + Babel transpilation at runtime).

### Metrics

| Metric | Value |
|--------|-------|
| Total HTML files | 3 |
| Total lines (HTML) | ~2,311 |
| Largest file | `scenario-editor.html` (1,311 lines) |
| Shared CSS | 1 file (276 lines) |
| JSON configs | 5 files |

### File Size Analysis

| File | Lines | Status |
|------|-------|--------|
| `scenario-editor.html` | 1,311 | 🔴 Monolith (>300) |
| `navigator.html` | 516 | 🟡 Large (>200) |
| `theme-editor.html` | 484 | 🟡 Large (>200) |
| `shared-styles.css` | 276 | ✅ OK |

### Architecture Notes

- **Pattern**: Single-file applications (SFAs) con React inline
- **Build process**: Nessuno (runtime Babel transpilation)
- **Dependencies**: CDN-based (React, ReactDOM, Babel, Tailwind)
- **Data format**: JSON scenarios e temi
- **Code sharing**: Solo CSS condiviso (`shared-styles.css`)

---

## Code Review

### 🔴 Critical Issues (2)

#### 1. Monolithic `scenario-editor.html` (1,311 lines)
**File**: `scenario-editor.html`
**Problem**: Contiene 10+ componenti React, helper functions, e logica di stato in un unico file.
**Impact**: Difficoltà di manutenzione, testing impossibile, rischio elevato di regressioni.
**Suggestion**: Estrarre componenti in file separati o adottare un build system minimo (Vite, Parcel).

#### 2. Duplicazione logica tra editor e navigator
**Files**: `scenario-editor.html:93-168`, `navigator.html:135-164`
**Problem**: Le funzioni `calculateNodeLevels()`, `calculateAutoPositions()`, e `getEffectiveLevel()` sono duplicate quasi identiche.
**Impact**: Bug fix devono essere applicati in più punti, rischio di divergenza.
**Suggestion**: Creare un file `shared-utils.js` condiviso tra le applicazioni.

---

### 🟡 Important Issues (5)

#### 3. Nessuna validazione input utente
**Files**: Tutti gli HTML
**Problem**: Gli input utente (node IDs, URLs, contenuti) non vengono sanitizzati.
**Impact**: Potenziale XSS se i dati vengono usati con `dangerouslySetInnerHTML`.
**Suggestion**: Aggiungere sanitizzazione per input critici (URL validation, HTML escaping).

#### 4. Runtime Babel transpilation
**Files**: Tutti gli HTML
**Problem**: Babel trasforma JSX a runtime nel browser.
**Impact**: Performance degradata (specialmente su mobile), bundle size elevato per CDN.
**Suggestion**: Per uso in produzione, considerare pre-compilazione del codice.

#### 5. Hardcoded layout configuration
**File**: `scenario-editor.html:70-75`, `navigator.html:79`
**Problem**: Layout config definito inline e poi sovrascritto da fetch.
**Impact**: Possibile flash di layout iniziale non corretto.
**Suggestion**: Attendere il caricamento di `defaults.json` prima del render.

#### 6. Nessun error boundary React
**Files**: Tutti gli HTML
**Problem**: Errori nei componenti crashano l'intera applicazione.
**Impact**: UX degradata, utente vede pagina bianca.
**Suggestion**: Implementare Error Boundaries per gestire errori gracefully.

#### 7. Gestione stato complessa senza struttura
**File**: `scenario-editor.html:1127-1246`
**Problem**: `ScenarioEditor` component gestisce troppo stato locale (12+ useState).
**Impact**: Difficile da debuggare, rischio di stato inconsistente.
**Suggestion**: Considerare useReducer o un pattern più strutturato.

---

### 🟢 Suggestions (5)

#### 8. CSS duplicato tra file
**Files**: `scenario-editor.html`, `theme-editor.html`, `navigator.html`
**Problem**: Ogni file ha `<style>` blocks significativi oltre a shared-styles.css.
**Suggestion**: Consolidare più stili in `shared-styles.css` o creare file CSS specifici per editor.

#### 9. Magic strings per tipi risorse
**File**: `scenario-editor.html:827`, `navigator.html:453`
**Problem**: Tipi risorse (`'link'`, `'download'`, `'video'`) come stringhe sparse.
**Suggestion**: Definire costanti `RESOURCE_TYPES = { LINK: 'link', ... }`.

#### 10. Commenti sezione non consistenti
**Files**: Tutti gli HTML
**Problem**: Alcune sezioni hanno commenti "===" separator, altre no.
**Suggestion**: Standardizzare formato commenti per navigazione codice.

#### 11. Inconsistenza naming convention
**Files**: Tutti i file
**Problem**: Mix di camelCase e kebab-case per CSS classes.
**Suggestion**: Adottare convenzione unica (preferibilmente BEM o utility-first).

#### 12. Nessun test automatizzato
**Project-wide**
**Problem**: Zero test coverage per un progetto con logica UI complessa.
**Suggestion**: Aggiungere almeno test unitari per le funzioni pure (`calculateNodeLevels`, etc.).

---

## Dependency Graph (Logical)

```
config.json
    ├── scenario-*.json (data)
    └── theme.json (styling)

defaults.json
    └── (shared by all HTML files)

navigator.html
    ├── config.json → scenario + theme
    ├── defaults.json → fonts, layout
    └── shared-styles.css (unused - has own styles)

scenario-editor.html
    ├── defaults.json → layout
    └── shared-styles.css

theme-editor.html
    ├── defaults.json → fonts, theme defaults
    └── shared-styles.css
```

---

## Positive Aspects ✅

1. **Zero build process**: Accessibilità massima per utenti non tecnici
2. **JSON-based content**: Separazione chiara tra dati e presentazione
3. **Documentazione eccellente**: README completo con esempi
4. **UI/UX curata**: Feedback visivo, validazione inline, status indicators
5. **Feature ricche**: Map view, drag-drop, loop detection, resource management
6. **Responsive design**: Funziona su mobile e desktop

---

## Next Steps

### Short Term (Quick Wins)
- [ ] Aggiungere sanitizzazione URL per input risorse
- [ ] Implementare Error Boundary base
- [ ] Estrarre costanti (`RESOURCE_TYPES`, `NODE_STATES`)

### Medium Term (Refactoring)
- [ ] Creare `shared-utils.js` per funzioni duplicate
- [ ] Consolidare CSS in file dedicati
- [ ] Aggiungere almeno 5-10 test per funzioni pure

### Long Term (Architecture)
- [ ] Valutare migrazione a build system leggero (Vite)
- [ ] Considerare TypeScript per type safety
- [ ] Modularizzare `scenario-editor.html` in componenti

---

*Report generato da /check-orchestrator*
