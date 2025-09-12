const allBundles = require('./bundles');
const { getAllEffects } = require('./effectManager');
const { getAllProfileDecorations } = require('./profileDecorationManager');
const { getAllCardEffects } = require('./cardEffectManager');
const { getAllCardDecorations } = require('./cardDecorationManager');

function getCosmeticItem(type, id) {
    let item;
    switch (type) {
        case 'profileEffect':
            item = getAllEffects().find(e => e.id === id);
            break;
        case 'profileDecoration':
            item = getAllProfileDecorations().find(d => d.id === id);
            break;
        case 'cardEffect':
            item = getAllCardEffects().find(e => e.id === id);
            break;
        case 'cardDecoration':
            item = getAllCardDecorations().find(d => d.id === id);
            break;
        default:
            return null;
    }
    return item;
}

// Process bundles for dynamic pricing
allBundles.forEach(bundleModule => {
    if (bundleModule && bundleModule.id) {
        if (bundleModule.price === undefined && bundleModule.discount) {
            let calculatedPrice = 0;
            for (const item of bundleModule.items) {
                const cosmeticItem = getCosmeticItem(item.type, item.id);
                if (cosmeticItem && cosmeticItem.price) {
                    calculatedPrice += cosmeticItem.price;
                }
            }
            bundleModule.price = Math.round(calculatedPrice * (1 - bundleModule.discount / 100));
        }
    }
});

const getAllBundles = () => {
    return allBundles;
};

module.exports = { getAllBundles };