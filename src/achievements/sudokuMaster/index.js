const TIERS = [
  { threshold: 1, name: '브론즈', icon: '🥉' },
  { threshold: 5, name: '실버', icon: '🥈' },
  { threshold: 10, name: '골드', icon: '🥇' },
];

module.exports = {
  id: 'sudokuMaster',
  name: '스도쿠 마스터',
  description: '스도쿠를 클리어한 횟수에 따라 티어가 부여됩니다.',
  icon: '🔢',
  tiers: TIERS,
  rewards: [{ type: 'profileEffect', effectId: 'Fireworks' }],
  evaluate: (user, gameData, scoreData) => {
    // 이 도전과제는 스도쿠 게임에만 해당됩니다.
    if (gameData.gameId !== 'sudoku') {
      const existingAchievement = user.achievements.find(a => a.id === 'sudokuMaster');
      return { 
        isUnlocked: !!existingAchievement, 
        progress: existingAchievement ? existingAchievement.progress : 0,
        tier: existingAchievement ? existingAchievement.tier : null,
        newTierUnlocked: false 
      };
    }

    // 승리했을 때만 진행도를 올립니다.
    const isWin = scoreData && scoreData.score > 0;
    if (!isWin) {
        const existingAchievement = user.achievements.find(a => a.id === 'sudokuMaster');
        return { 
            isUnlocked: !!existingAchievement, 
            progress: existingAchievement ? existingAchievement.progress : 0,
            tier: existingAchievement ? existingAchievement.tier : null,
            newTierUnlocked: false 
        };
    }

    const existingAchievement = user.achievements.find(a => a.id === 'sudokuMaster');
    const previousProgress = existingAchievement ? existingAchievement.progress : 0;
    const newProgress = previousProgress + 1;

    let currentTier = null;
    let newTierUnlocked = false;

    // 새로운 진행도에 맞는 티어를 찾습니다.
    for (let i = TIERS.length - 1; i >= 0; i--) {
      if (newProgress >= TIERS[i].threshold) {
        currentTier = TIERS[i];
        break;
      }
    }

    const previousTierName = existingAchievement?.tier?.name;
    const currentTierName = currentTier?.name;

    // 이전 티어와 현재 티어가 다를 경우, 새로운 티어를 달성한 것입니다.
    if (currentTierName && currentTierName !== previousTierName) {
      newTierUnlocked = true;
    }

    return {
      isUnlocked: newProgress > 0,
      progress: newProgress,
      tier: currentTier,
      newTierUnlocked: newTierUnlocked,
    };
  },
};