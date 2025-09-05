const { Router } = require('express');
const { client } = require('./redisClient'); // Import client
const createAuthMiddleware = require('./middleware/auth.js');
const userRepository = require('./repositories/userRepository');

module.exports = (jwtSecret) => {
    const router = Router();
    const authMiddleware = createAuthMiddleware(jwtSecret, false);

    const masterOnly = (req, res, next) => {
        if (!req.user || !req.user.isMaster) {
            return res.status(403).json({ success: false, message: '권한이 없습니다.' });
        }
        next();
    };

    router.post('/calendar/events', authMiddleware, masterOnly, async (req, res) => {
        const { name, description, date, recurring, icon } = req.body;
        if (!name || !date) {
            return res.status(400).json({ success: false, message: '이름과 날짜는 필수입니다.' });
        }
        try {
            const eventId = `event:${Date.now()}`;
            const event = {
                id: eventId,
                name,
                description: description || '',
                date, 
                recurring: recurring || null, 
                icon: icon || '🎉',
                createdBy: req.user.id,
            };
            await client.hSet('starcade:events', eventId, JSON.stringify(event));
            res.status(201).json({ success: true, message: '이벤트가 성공적으로 추가되었습니다.', event });
        } catch (error) {
            console.error('Error adding calendar event:', error);
            res.status(500).json({ success: false, message: '이벤트 추가 중 오류가 발생했습니다.' });
        }
    });

    router.delete('/calendar/events/:eventId', authMiddleware, masterOnly, async (req, res) => {
        const { eventId } = req.params;
        try {
            const result = await client.hDel('starcade:events', eventId);
            if (result > 0) {
                res.json({ success: true, message: '이벤트가 성공적으로 삭제되었습니다.' });
            } else {
                res.status(404).json({ success: false, message: '해당 이벤트를 찾을 수 없습니다.' });
            }
        } catch (error) {
            console.error('Error deleting calendar event:', error);
            res.status(500).json({ success: false, message: '이벤트 삭제 중 오류가 발생했습니다.' });
        }
    });

    router.get('/', authMiddleware, async (req, res) => {
        const { year, month } = req.query;
        const userId = req.user.id;
        if (!year || !month) {
            return res.status(400).json({ success: false, message: '년도와 월은 필수입니다.' });
        }

        const numYear = parseInt(year, 10);
        const numMonth = parseInt(month, 10);
        const startDate = new Date(Date.UTC(numYear, numMonth - 1, 1));
        const endDate = new Date(Date.UTC(numYear, numMonth, 0, 23, 59, 59, 999));
        const eventsByDate = {};

        const addEvent = (date, event) => {
            const dateStr = date.toISOString().split('T')[0];
            if (!eventsByDate[dateStr]) eventsByDate[dateStr] = [];
            // Ensure every event has a unique ID, especially for dynamically generated ones
            const uniqueId = event.id || `dynamic-${dateStr}-${event.name}-${Math.random().toString(36).substring(2)}`;
            eventsByDate[dateStr].push({ ...event, id: uniqueId });
        };

        try {
            // 1. Fetch Global Events
            const globalEvents = await client.hGetAll('starcade:events');
            for (const eventId in globalEvents) {
                const event = JSON.parse(globalEvents[eventId]);
                const eventStartDate = new Date(event.date);

                if (event.recurring) {
                    switch (event.recurring.unit) {
                        case 'year':
                            if (eventStartDate.getUTCMonth() === startDate.getUTCMonth()) {
                                const newDate = new Date(Date.UTC(numYear, numMonth - 1, eventStartDate.getUTCDate()));
                                addEvent(newDate, { ...event, type: 'anniversary' });
                            }
                            break;
                        case 'month':
                            const newDate = new Date(Date.UTC(numYear, numMonth - 1, eventStartDate.getUTCDate()));
                            if (newDate.getUTCMonth() === numMonth -1) { // Ensure it doesn't spill over (e.g. 31st on a 30-day month)
                                addEvent(newDate, { ...event, type: 'anniversary' });
                            }
                            break;
                        case 'day':
                            let currentDate = new Date(eventStartDate);
                            while (currentDate <= endDate) {
                                if (currentDate >= startDate) {
                                    addEvent(currentDate, { ...event, type: 'anniversary' });
                                }
                                currentDate.setUTCDate(currentDate.getUTCDate() + event.recurring.value);
                            }
                            break;
                    }
                } else {
                    if (eventStartDate >= startDate && eventStartDate <= endDate) {
                        addEvent(eventStartDate, { ...event, type: 'anniversary' });
                    }
                }
            }

            // 2. Fetch User-specific events
            const user = await userRepository.getUser(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
            }

            if (user.achievements) {
                for (const ach of user.achievements) {
                    const achDate = new Date(ach.unlockedAt);
                    if (achDate >= startDate && achDate <= endDate) {
                        addEvent(achDate, { type: 'achievement', name: ach.name, icon: '🏆' });
                    }
                }
            }

            if (user.birthday) {
                const [bMonth, bDay] = user.birthday.split('-').map(Number);
                if (bMonth === numMonth) {
                    addEvent(new Date(Date.UTC(numYear, numMonth - 1, bDay)), { type: 'birthday', name: `${user.name}님의 생일`, icon: '🎂' });
                }
            }

            if (user.friends) {
                for (const friend of user.friends) {
                     if (friend.birthday) {
                        const [fMonth, fDay] = friend.birthday.split('-').map(Number);
                        if (fMonth === numMonth) {
                            addEvent(new Date(Date.UTC(numYear, numMonth - 1, fDay)), { type: 'birthday', name: `${friend.name}님의 생일`, icon: '🎂' });
                        }
                    }
                }
            }

            res.json({ success: true, events: eventsByDate });

        } catch (error) {
            console.error('Error fetching calendar events:', error);
            res.status(500).json({ success: false, message: '캘린더 이벤트 조회 중 오류가 발생했습니다.' });
        }
    });

    return router;
};