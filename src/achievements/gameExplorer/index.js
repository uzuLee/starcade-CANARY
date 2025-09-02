const TIERS = [
  { threshold: 1, name: '초보 탐험가', icon: '🌱' },
  { threshold: 3, name: '숙련 탐험가', icon: '🌳' },
  { threshold: 5, name: '게임 마스터', icon: '🌲' },
];

module.exports = {
  id: 'gameExplorer',
  name: '게임 탐험가',
  description: '다양한 게임을 플레이하여 새로운 세계를 탐험하세요.',
  icon: '🗺️',
  tiers: TIERS,
  rewards: [{ type: 'title', titleId: '게임 탐험가' }],
  evaluate: (user, gameData, scoreData) => {
    if (!gameData || !gameData.gameId) {
      const existingAchievement = user.achievements.find(a => a.id === 'gameExplorer');
      return { 
        isUnlocked: !!existingAchievement, 
        progress: existingAchievement ? existingAchievement.progress : 0,
        tier: existingAchievement ? existingAchievement.tier : null,
        newTierUnlocked: false 
      };
    }

    const existingAchievement = user.achievements.find(a => a.id === 'gameExplorer');
    let playedGames;
    if (existingAchievement && typeof existingAchievement.progress === 'string') {
        try {
            const parsed = JSON.parse(existingAchievement.progress);
            if (Array.isArray(parsed)) {
                playedGames = new Set(parsed);
            } else {
                playedGames = new Set();
            }
        } catch (e) {
            playedGames = new Set();
        }
    } else {
        playedGames = new Set();
    }
    playedGames.add(gameData.gameId);
    const newProgress = playedGames.size;

    let currentTier = null;
    let newTierUnlocked = false;

    for (let i = TIERS.length - 1; i >= 0; i--) {
      if (newProgress >= TIERS[i].threshold) {
        currentTier = TIERS[i];
        break;
      }
    }

    const previousTierName = existingAchievement?.tier?.name;
    const currentTierName = currentTier?.name;

    if (currentTierName && currentTierName !== previousTierName) {
      newTierUnlocked = true;
    }

    return {
      isUnlocked: newProgress > 0,
      progress: JSON.stringify(Array.from(playedGames)), // Store as JSON string
      tier: currentTier,
      newTierUnlocked: newTierUnlocked,
    };
  },
};
