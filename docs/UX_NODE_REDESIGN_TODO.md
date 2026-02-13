# Node Redesign TODO

## Phase 1 - Foundation

- [x] Create centralized node blueprint catalog with categories.
- [x] Add blueprint metadata (`blueprintId`, `archetype`, `surface`, `todoSeed`).
- [x] Add document vault structure in node data.
- [x] Wire blueprint defaults into node creation flow.
- [x] Set adaptive sizing helper for node cards.
- [x] Split visual logic into dedicated node appearance module.

## Phase 2 - Visual Overhaul

- [x] Replace generic node card with adaptive layout.
- [x] Add type + blueprint badges in node header.
- [x] Improve text rendering with no title truncation.
- [x] Improve description readability with scrollable long text.
- [x] Add richer metric row and progress ring.
- [x] Add checklist section with completion feedback.
- [x] Add data preview chart section.
- [x] Add todo seed preview for AI planning.
- [x] Add document vault preview section.
- [x] Rebuild hover action toolbar (child, AI, duplicate, pin, lock, delete).

## Phase 3 - Creation Experience

- [x] Replace bottom toolbar with lateral Node Studio dock.
- [x] Add category filters for templates.
- [x] Add template search.
- [x] Add quick type creation strip.
- [x] Add mobile fallback for template insertion.
- [x] Add AI shortcut directly in creation dock.

## Phase 4 - Document Workflow

- [x] Add dedicated Document Vault tab in node detail panel.
- [x] Add manual document entry in vault (title/url).
- [x] Add archive/unarchive toggle for vault documents.
- [x] Add per-document summary editing for AI context.
- [x] Sync file uploads to both attachments and document vault.

## Phase 5 - AI Integration

- [x] Include blueprint/archetype/todo/document counts in AI map context.
- [x] Include AI prompt hint in AI context serialization.
- [x] Extend AI tool schema for blueprint-aware node creation/update.
- [x] Extend action executor to persist new smart node fields.
- [x] Update system prompt context with smart-node layer notes.

## Phase 6 - Design Language

- [x] Replace default typography with Space Grotesk + IBM Plex Mono.
- [x] Add richer non-flat application background.
- [x] Keep desktop/mobile behavior aligned in redesigned dock.

## Cleanup and Organization

- [x] Remove legacy node components not used by current editor.
- [x] Remove obsolete node helper exports after verification.
- [ ] Normalize text encoding issues in legacy files.
- [ ] Run full lint pass and resolve low-priority warnings.
- [ ] Add visual regression snapshots for node variants.
