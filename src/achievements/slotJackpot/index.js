export default {
  id: 'slotJackpot',
  name: '잭팟!',
  description: '슬롯머신 게임에서 잭팟을 터뜨렸습니다.',
  icon: '💰💰💰',
  rewards: [
    { type: 'profileEffect', effectId: 'Money' },
    { type: 'title', titleId: '잭팟!' },
  ],
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'slotJackpot');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // 슬롯머신 게임에서 잭팟을 터뜨렸을 때
    const isJackpot = gameData.gameId === 'slot' && scoreData && scoreData.isJackpot;
    return {
      isUnlocked: isJackpot,
      progress: isJackpot ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};