const TIERS = [
  { threshold: 1, name: '첫 생일', icon: '🎂' },
  { threshold: 3, name: '생일 단골', icon: '🥳' },
  { threshold: 5, name: '생일 마스터', icon: '🎉' },
];

module.exports = {
  id: 'happyBirthday',
  name: 'Happy Birthday!',
  description: '생일에 Starcade에 접속한 횟수에 따라 티어가 부여됩니다.',
  icon: '🎂',
  tiers: TIERS,
      rewards: [
    { type: 'title', titleId: '생일의 기적' },
  ],
  evaluate: (user, gameData, scoreData) => {
    if (gameData.event !== 'birthdayLogin' || !scoreData.isBirthday) {
        const existingAchievement = user.achievements.find(a => a.id === 'happyBirthday');
        return { 
            isUnlocked: !!existingAchievement, 
            progress: existingAchievement ? existingAchievement.progress : 0,
            tier: existingAchievement ? existingAchievement.tier : null,
            newTierUnlocked: false 
        };
    }

    const existingAchievement = user.achievements.find(a => a.id === 'happyBirthday');
    const lastGrantedYear = existingAchievement ? existingAchievement.progress : 0;
    const currentYear = scoreData.year;

    if (lastGrantedYear === currentYear) {
        return { isUnlocked: false };
    }

    const newProgress = currentYear;
    const wins = (existingAchievement?.wins || 0) + 1;


    let currentTier = null;
    let newTierUnlocked = false;

    for (let i = TIERS.length - 1; i >= 0; i--) {
      if (wins >= TIERS[i].threshold) {
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
      isUnlocked: true,
      progress: newProgress,
      wins: wins,
      tier: currentTier,
      newTierUnlocked: newTierUnlocked,
    };
  },
};