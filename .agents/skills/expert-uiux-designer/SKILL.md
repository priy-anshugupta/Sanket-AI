---
name: expert-uiux-designer
description: >-
  World-class UI/UX Design System, Industrial Dashboard Aesthetics, Human-Computer Interaction
  (HCI) principles, micro-interactions, dark/light mode color science, typography hierarchies,
  and defense-grade mission-critical design standards.
---

# Expert UI/UX Design System & Standards (SANKET · AI & Industrial Web Apps)

This skill equips the agent with expert-level UI/UX design capabilities, aesthetics heuristics, design tokens, and frontend engineering patterns.

---

## 🎨 1. Core Visual Design Principles (The "WOW" Factor)

### 1.1 Curated Industrial Color Palette
Never use raw or generic colors (e.g. basic `#FF0000` or `#00FF00`). Always use harmonized HSL / Hex palettes:

* **Backgrounds & Surfaces**:
  * Deep Space / Obsidian: `#0B0F17` (Deep root background)
  * Dark Slate Surface: `#111827` (Card / Panel surface)
  * Elevated Glass Surface: `#1F2937` with `backdrop-filter: blur(12px)`
  * Surface Borders: `#374151` or `rgba(255, 255, 255, 0.08)`
* **Status & Risk Accents**:
  * **Critical / SIF Hazard**: `#EF4444` (Vibrant Crimson) / Glowing badge `#7F1D1D20` with `#EF4444` border
  * **High Warning / Energy**: `#F59E0B` (Industrial Amber) / Glowing badge `#78350F20` with `#F59E0B` border
  * **Medium Advisory**: `#3B82F6` (Electric Blue / Telemetry) / Badge `#1E3A8A20` with `#3B82F6` border
  * **Low / Normal / Air-Gap Safe**: `#10B981` (Emerald / Sovereign Green)
  * **System Telemetry / AI**: `#8B5CF6` (Cyber Violet) or `#06B6D4` (Cyan)

### 1.2 Typography Hierarchy
Use curated, crisp fonts instead of default browser fonts:
* **Display / Brand**: `Outfit`, `Space Grotesk`, `Inter Display` (Font-weight 700-900)
* **Body / Content**: `Inter`, `Plus Jakarta Sans`, `Geist` (Font-weight 400-600)
* **Telemetry / Metrics / Timestamps / Code**: `JetBrains Mono`, `Fira Code`, `Geist Mono` (`font-variant-numeric: tabular-nums`)

---

## ⚡ 2. Motion Design & Micro-Interactions

An interface should feel tactile, responsive, and alive:

1. **Button States**:
   * Hover: Subtle elevation scale (`transform: translateY(-1px)` or `scale(1.01)`), brightness boost, glowing border.
   * Active: Gentle press (`transform: translateY(1px)` or `scale(0.99)`).
   * Disabled: Muted opacity (`opacity: 0.5`), cursor not-allowed, stripped hover effects.
2. **Real-Time Indicators**:
   * Pulsing beacon animations (`@keyframes pulse-beacon { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.2); } }`).
   * Live streaming radar sweeps, glowing borders on emergency items.
3. **Smooth Transitions**:
   * Global transition standard: `transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1)`.

---

## 🎛️ 3. Information Architecture & Density

### 3.1 3-Second Rule for Industrial Dashboards
A user (or field engineer / control room operator) must comprehend the system state in under 3 seconds:
* **Top Level**: High-level telemetry badges (System health, SIF alerts, Air-gap status, Active counts).
* **Mid Level**: Real-time event feed / Interactive visualization / Triage table with high-contrast priority tags.
* **Detail Level**: Action playbook, root cause breakdown, entity tags, audit trail logs.

### 3.2 High-Density Layout Patterns
* **Grid Hierarchy**: Use 12-column CSS Grid or responsive flexbox with consistent `gap: 16px` or `gap: 20px`.
* **Zero Visual Clutter**: Use subtle dividers (`border: 1px solid rgba(255,255,255,0.08)`), consistent padding (`p-4` to `p-6`), and rounded corners (`rounded-xl` / `rounded-2xl`).

---

## 🛡️ 4. Accessibility (a11y) & Industrial Ergonomics

* **Contrast**: Ensure minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text (WCAG AA/AAA).
* **Color Blindness Safety**: Never rely solely on color to convey risk; always pair colors with icons (🚨, ⚠️, ℹ️, 🟢), clear labels (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), and numerical scores (`0.94`).
* **Keyboard Shortcuts**: Include visible hotkey hints (e.g. `[F5] Control Room`, `[F7] Emergency`, `[F9] Triage`).

---

## 🚀 5. Component Checklist for Every Screen

When designing or revising any page, verify:
- [ ] **Header**: Clear title, breadcrumb/tagline, real-time status pill, and quick action buttons.
- [ ] **KPI / Stat Cards**: Big bold numerical values, unit labels, sparkline or delta pill (+12%).
- [ ] **Data Tables**: Search bar, filter pills, zebra/hover rows, right-aligned numbers, pinned action buttons.
- [ ] **Emergency / Warning Modals**: High-contrast backdrop blur, audible chime option, clear 1-click confirmation buttons.
- [ ] **Mobile & Responsive**: Fluid grid collapse from desktop 3-column to tablet 2-column to mobile 1-column.
