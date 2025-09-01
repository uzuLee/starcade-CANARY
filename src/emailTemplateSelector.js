const fs = require('fs').promises;
const path = require('path');

const TEMPLATE_CONFIG_PATH = path.join(__dirname, '..', 'config', 'email_templates.json');
let emailTemplatesConfig = {};

async function loadEmailTemplatesConfig() {
    try {
        const data = await fs.readFile(TEMPLATE_CONFIG_PATH, 'utf8');
        emailTemplatesConfig = JSON.parse(data);
        console.log('Email templates configuration loaded successfully.');
    } catch (error) {
        console.error('Failed to load email templates configuration:', error);
        // Fallback to a default empty config if loading fails
        emailTemplatesConfig = {};
    }
}

function selectTemplate(templateType) {
    const templates = emailTemplatesConfig[templateType];
    if (!templates || templates.length === 0) {
        console.warn(`No templates found for type: ${templateType}. Using default.`);
        // Fallback to a default if no specific templates are defined
        return {
            text_template: `${templateType}.txt`,
            html_template: `${templateType}.html`
        };
    }

    let totalWeight = 0;
    for (const template of templates) {
        totalWeight += template.weight || 0;
    }

    let random = Math.random() * totalWeight;
    for (const template of templates) {
        if (random < (template.weight || 0)) {
            return template;
        }
        random -= (template.weight || 0);
    }

    // Fallback in case of calculation error or all weights are zero
    return templates[0];
}

module.exports = {
    loadEmailTemplatesConfig,
    selectTemplate
};

// Load config on module initialization
loadEmailTemplatesConfig();