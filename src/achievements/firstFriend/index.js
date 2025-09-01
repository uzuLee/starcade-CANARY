export default {
  id: 'firstFriend',
  name: '첫 친구',
  description: '첫 친구를 사귀었습니다.',
  icon: '🤝',
  rewards: [
    { type: 'title', titleId: '첫 친구' },
  ],
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'firstFriend');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }
    const isUnlocked = user.friends && user.friends.length > 0;
    return {
      isUnlocked: isUnlocked,
      progress: isUnlocked ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};