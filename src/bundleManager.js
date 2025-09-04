const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

// 다른 아이템 매니저들을 가져옵니다.
const { getAllEffects } = require('./effectManager');
const { getAllProfileDecorations } = require('./profileDecorationManager');
const { getAllCardEffects } = require('./cardEffectManager');
const { getAllCardDecorations } = require('./cardDecorationManager');

const BUNDLES_DIR = path.join(__dirname, 'bundles');

let allBundles = [];

// 아이템 타입에 따라 해당 아이템의 정보를 가져오는 헬퍼 함수
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
        // TODO: Add other item types like 'theme' when they are available
        default:
            return null;
    }
    return item;
}

function loadBundles() {
    try {
        const bundleFiles = fs.readdirSync(BUNDLES_DIR).filter(file => file.endsWith('.js'));

        const bundles = [];
        for (const file of bundleFiles) {
            const filePath = path.join(BUNDLES_DIR, file);
            delete require.cache[require.resolve(filePath)];
            const bundleModule = require(filePath);

            if (bundleModule && bundleModule.id) {
                // 가격 동적 계산 로직
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
                bundles.push(bundleModule);
            }
        }
        allBundles = bundles;
        console.log('Successfully loaded all bundles with dynamic pricing.');
    } catch (error) {
        console.error("Error loading bundles:", error);
        allBundles = [];
    }
}

loadBundles();

if (process.env.NODE_ENV !== 'production') {
    const watcher = chokidar.watch(path.join(BUNDLES_DIR, '**', '*.js'), {
        persistent: true,
        ignoreInitial: true,
    });

    const reload = (filePath) => {
        console.log(`Detected change in ${filePath}, reloading bundles...`);
        loadBundles();
    };

    watcher.on('add', reload).on('change', reload).on('unlink', reload);
}

const getAllBundles = () => {
    return allBundles;
};

module.exports = { getAllBundles };
