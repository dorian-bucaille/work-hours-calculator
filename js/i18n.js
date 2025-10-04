class I18nManager {
    constructor(options = {}) {
        this.translations = {};
        this.currentLang = null;
        this.defaultLang = options.defaultLang || 'en';
        this.supportedLangs = options.supportedLangs || ['en', 'fr'];
        this.langPath = options.langPath || '/lang/';
        this.init();
    }

    async init() {
        // Try to get language from localStorage
        let savedLang = localStorage.getItem('preferredLanguage');
        
        // If no saved language, try to use browser language
        if (!savedLang) {
            const browserLang = navigator.language.split('-')[0];
            savedLang = this.supportedLangs.includes(browserLang) ? browserLang : this.defaultLang;
        }

        try {
            await this.setLanguage(savedLang);
        } catch (error) {
            console.error('Failed to initialize language:', error);
            // If the saved/detected language fails, fall back to default
            if (savedLang !== this.defaultLang) {
                await this.setLanguage(this.defaultLang);
            }
        }

        // Set up the language switcher if it exists
        const langSwitcher = document.getElementById('lang-switcher');
        if (langSwitcher) {
            langSwitcher.value = this.currentLang;
            langSwitcher.addEventListener('change', (e) => {
                this.setLanguage(e.target.value);
            });
        }
    }

    async loadTranslations(lang) {
        try {
            const response = await fetch(`${this.langPath}${lang}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const translations = await response.json();
            this.translations[lang] = translations;
        } catch (error) {
            console.error(`Failed to load translations for ${lang}:`, error);
            throw error;
        }
    }

    async setLanguage(lang) {
        if (!this.supportedLangs.includes(lang)) {
            console.error(`Language ${lang} is not supported`);
            return false;
        }

        // Load translations if not already loaded
        if (!this.translations[lang]) {
            try {
                await this.loadTranslations(lang);
            } catch (error) {
                throw error;
            }
        }

        this.currentLang = lang;
        localStorage.setItem('preferredLanguage', lang);
        this.updateTranslations();
        
        // Update the language switcher if it exists
        const langSwitcher = document.getElementById('lang-switcher');
        if (langSwitcher) {
            langSwitcher.value = lang;
        }

        return true;
    }

    updateTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.translations[this.currentLang]?.[key];
            
            if (translation) {
                if (element.tagName === 'INPUT' && element.type === 'submit') {
                    element.value = translation;
                } else {
                    element.textContent = translation;
                }
            } else {
                console.warn(`Translation missing for key: ${key}`);
                // Leave the existing text as a fallback
            }
        });
    }

    translate(key) {
        return this.translations[this.currentLang]?.[key] || key;
    }
}

// Initialize the i18n manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new I18nManager({
        defaultLang: 'en',
        supportedLangs: ['en', 'fr'],
        langPath: '/lang/'
    });
});