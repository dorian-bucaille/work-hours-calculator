# 🕰️ Work Hours Calculator

[![Netlify Status](https://img.shields.io/badge/Netlify-live-success?logo=netlify)](https://workhourscalculator.netlify.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-ready-blue)](https://workhourscalculator.netlify.app/)
[![No Dependencies](https://img.shields.io/badge/dependencies-none-lightgrey)](https://workhourscalculator.netlify.app/)

<img width="1175" height="924" alt="image" src="https://github.com/user-attachments/assets/14e0b330-7571-4991-9372-b65b691d6a85" />

A lightweight web application for tracking daily work hours with automatic balance calculation.

## Overview

- Track daily work hours with morning/afternoon periods
- Maintain a running balance of work hours
- View and export work history
- Works offline with local storage
- No dependencies, just vanilla JavaScript

## Demo

<https://workhourscalculator.netlify.app/>

## Installation

No build step or dependencies required. Simply clone the repository and open `index.html` in your browser.

```bash
git clone https://github.com/dorian-bucaille/work-hours-calculator.git
cd work-hours-calculator
# Open index.html in your browser
```

## Tests

Run the lightweight unit tests with:

```bash
npm install
npm test
```

Run end-to-end checks with Playwright:

```bash
npx playwright install --with-deps
npm run test:e2e
```

## Features

- Daily work hours calculation
- Running hours balance tracking
- History view with JSON export
- Responsive design
- Keyboard navigation support
- Offline capable (PWA)

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## TODO

- Add Lighthouse checks (target 90+ per category, ideally 100) and automate via CI/CD.
- Optimize and slim down unused code/assets to keep the app fast and reliable.

## License

MIT
