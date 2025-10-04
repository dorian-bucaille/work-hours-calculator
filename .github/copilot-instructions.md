# AI Coding Assistant Instructions

## Project Overview
This is an eco-friendly work hours calculator web application built with vanilla JavaScript. The project intentionally avoids frameworks and dependencies to maintain a minimal, fast, and accessible experience.

## Key Architecture Principles
- **Zero Dependencies**: No external libraries, frameworks, or build tools
- **Static-First**: Pure client-side application with local storage for persistence
- **Accessibility-Focused**: Semantic HTML and ARIA attributes throughout
- **Eco-Friendly**: Minimal code footprint and resource usage

## Core Components
1. **Time Tracking UI** (`index.html`, `script.js`)
   - Form inputs for morning/afternoon work periods
   - Auto-advance between time fields (`script.js`: line ~97)
   - Suggested end time calculations (`script.js`: ~line 56)

2. **Data Management** (`script.js`)
   - Local storage wrapper functions for persistence
   - History tracking with JSON export capability
   - Balance calculation and formatting utilities

3. **Settings Panel** (`script.js`, `style.css`)
   - Slide-out panel for user preferences
   - Auto-advance toggle functionality
   - History display order configuration

## Key File Locations
- `script.js`: Core application logic
- `style.css`: All styling (no CSS frameworks)
- `index.html`: Main UI structure
- `manifest.json`: PWA configuration

## Development Workflows
1. Local Development:
   ```bash
   # No build step required
   # Simply open index.html in browser
   ```

2. Testing:
   - Manual testing in browser
   - No automated tests required
   - Test localStorage interactions in private browsing

3. Deployment:
   - Static file hosting (e.g., Netlify)
   - No build/compilation needed

## Project-Specific Conventions
1. **Time Format**:
   - Use HH:MM format consistently
   - Parse using `timeStringToMinutes()` utility
   - Format using `formatMinutesToSignedHours()`

2. **State Management**:
   - Use `getLocalStorageItem(key, fallback)` and `setLocalStorageItem(key, value)`
   - Always provide fallback values for localStorage

3. **Security**:
   - Sanitize HTML in history display using `escapeHTML()`
   - No external data sources or APIs

## Integration Points
1. **PWA Integration**:
   - `manifest.json` defines app metadata
   - Icons and theme colors configured for mobile

2. **Browser Storage**:
   - Uses localStorage for all persistence
   - Handles quota limitations gracefully

## Strict Technical Constraints
1. No external dependencies or CDNs
2. No build tools or transpilers
3. No CSS frameworks or preprocessors
4. Pure vanilla JavaScript only