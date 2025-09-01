const isTodayBirthday = (birthday) => {
    if (!birthday) return false;
    const today = new Date();
    const todayMMDD = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    const userBirthdayMMDD = birthday.substring(5);
    return userBirthdayMMDD === todayMMDD;
};

const getPriorityCosmetics = (user) => {
    if (user && user.settings?.enableBirthdayEffect !== false && isTodayBirthday(user.birthday)) {
        return {
            profileDecoration: 'Birthday',
            cardDecoration: 'Birthday',
            cardEffect: 'Birthday',
            title: '오늘의 주인공',
        };
    }
    return {};
};

module.exports = { getPriorityCosmetics, isTodayBirthday };