const TIERS = [
  { threshold: 600, name: '스피드러너', icon: '👟' }, // 10분
  { threshold: 300, name: '광속 해결사', icon: '⚡' }, // 5분
  { threshold: 180, name: '타임 어태커', icon: '⏱️' }, // 3분
];

export default {
  id: 'sudokuSpeedDemon',
  name: '스피드 데몬',
  description: '스도쿠를 빠르게 클리어한 시간에 따라 티어가 부여됩니다. (보통 난이도 이상)',
  icon: '💨',
  tiers: TIERS,
  evaluate: (user, gameData, scoreData) => {
    if (gameData.gameId !== 'sudoku' || !scoreData || scoreData.score <= 0 || (gameData.difficulty !== 'medium' && gameData.difficulty !== 'hard')) {
      const existingAchievement = user.achievements.find(a => a.id === 'sudokuSpeedDemon');
      return { 
        isUnlocked: !!existingAchievement, 
        progress: existingAchievement ? existingAchievement.progress : 0,
        tier: existingAchievement ? existingAchievement.tier : null,
        newTierUnlocked: false 
      };
    }

    const existingAchievement = user.achievements.find(a => a.id === 'sudokuSpeedDemon');
    // Progress is the best (lowest) time. 0 means no record yet.
    const previousBestTime = existingAchievement ? existingAchievement.progress : Infinity;
    const newBestTime = Math.min(previousBestTime, scoreData.playTime);

    let currentTier = null;
    let newTierUnlocked = false;

    for (let i = TIERS.length - 1; i >= 0; i--) {
      if (newBestTime <= TIERS[i].threshold) {
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
      isUnlocked: newBestTime !== Infinity,
      progress: newBestTime,
      tier: currentTier,
      newTierUnlocked: newTierUnlocked,
    };
  },
};