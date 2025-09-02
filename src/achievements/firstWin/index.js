module.exports = {
  id: 'firstWin',
  name: '첫 승리!',
  description: 'Starcade에서 첫 승리를 기록했습니다.',
  icon: '🌟',
  rewards: [
    { type: 'profileEffect', effectId: 'Sparkle' },
    { type: 'title', titleId: '첫 승리자' },
  ],
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'firstWin');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }

    // isWin 변수를 scoreData를 기반으로 정의합니다.
    const isWin = scoreData && scoreData.score > 0;

    return {
      isUnlocked: isWin,
      progress: isWin ? 1 : 0,
      tier: null,
      newTierUnlocked: false, // firstWin은 티어가 없으므로 항상 false
    };
  },
};
