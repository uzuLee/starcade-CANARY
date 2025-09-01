export default {
  id: 'longTimeNoSee',
  name: '오랜만이야!',
  description: '오랜만에 Starcade에 접속했습니다. (7일 이상 미접속)',
  icon: '👋',
  rewards: [
    { type: 'title', titleId: '돌아온 방랑자' },
  ],
  evaluate: (user, gameData, scoreData) => {
    const hasAchievement = user.achievements.some(a => a.id === 'longTimeNoSee');
    if (hasAchievement) {
      return { isUnlocked: false, progress: 1, tier: null };
    }

    if (gameData.event !== 'login' || !scoreData.lastLoginDate) {
        return { isUnlocked: false, progress: 0, tier: null };
    }

    const lastLogin = new Date(scoreData.lastLoginDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastLogin.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isUnlocked = diffDays >= 7; // Logged in after 7 or more days of inactivity

    return {
      isUnlocked: isUnlocked,
      progress: isUnlocked ? 1 : 0,
      tier: null,
      newTierUnlocked: false,
    };
  },
};