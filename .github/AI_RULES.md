# AI_RULES.md

## Tech Stack Overview

- **Frontend:** Vanilla JavaScript (ES6+), HTML5, and CSS3
- **No Frameworks:** No React, Vue, Angular, or similar frameworks
- **Styling:** Pure CSS, no CSS-in-JS or utility frameworks (e.g., Tailwind, Bootstrap)
- **State Management:** Local state only (DOM, localStorage); no Redux, MobX, or similar
- **Persistence:** Uses `localStorage` for saving user data and settings
- **Accessibility:** Follows basic accessibility best practices (labels, ARIA, keyboard navigation)
- **Build Tools:** None required; app runs directly in the browser
- **Dependencies:** Zero external JS/CSS libraries; all logic is custom and self-contained
- **Deployment:** Static hosting (e.g., Netlify, GitHub Pages)
- **Internationalization:** Manual, if needed (no i18n libraries)

## Library & Tooling Rules

- **UI Components:**  
  - All UI elements must be built with native HTML and CSS.
  - Do not use component libraries (e.g., Material UI, Ant Design, shadcn/ui).

- **Styling:**  
  - Use only the `style.css` file for all custom styles.
  - Do not use Tailwind, Bootstrap, or any CSS frameworks.

- **JavaScript:**  
  - Write all logic in plain JavaScript (ES6+).
  - Do not use TypeScript, Babel, or transpilers.

- **State & Data:**  
  - Use `localStorage` for persistence.
  - Do not use any state management libraries.

- **Icons & Images:**  
  - Use inline SVG or static image files.
  - Do not use icon libraries (e.g., FontAwesome, Lucide).

- **Accessibility:**  
  - Use semantic HTML and ARIA attributes as needed.
  - Ensure keyboard navigation and screen reader compatibility.

- **Build & Tooling:**  
  - No build step; all files must be directly usable in the browser.
  - Do not introduce package managers or bundlers.

- **External APIs:**  
  - Do not use any external APIs or cloud services.

**Summary:**  
This app is intentionally minimal, eco-friendly, and dependency-free. All features must be implemented using only native browser technologies.