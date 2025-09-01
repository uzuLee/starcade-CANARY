export default {
  id: 'firstGame',
  name: '첫 발자국',
  description: 'Starcade에서 첫 게임을 플레이했습니다.',
  icon: '🐾',
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'firstGame');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    // Check if any game has been played (gameData exists)
    const isPlayed = !!gameData.gameId;
    return {
      isUnlocked: isPlayed,
      progress: isPlayed ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};