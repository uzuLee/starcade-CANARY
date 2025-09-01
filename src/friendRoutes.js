const createAuthMiddleware = require('./middleware/auth.js');

module.exports = (app, io, { userRepository, socketRepository, redisManager }, jwtSecret) => {
    const authMiddleware = createAuthMiddleware(jwtSecret);

    app.post('/api/friend-request', authMiddleware, async (req, res) => {
        const { toIdentifier } = req.body;
        const fromUser = req.user; // 미들웨어에서 검증된 사용자 정보
        const toUser = await userRepository.getUser(toIdentifier);

        if (!toUser) {
            return res.status(404).json({ success: false, message: '요청하려는 사용자를 찾을 수 없습니다.' });
        }
        if (fromUser.id === toUser.id) {
            return res.status(400).json({ success: false, message: '자신에게 친구 요청을 보낼 수 없습니다.' });
        }
        if (fromUser.friends.some(f => f.id === toUser.id)) {
            return res.status(400).json({ success: false, message: '이미 친구입니다.' });
        }
        if (fromUser.pendingRequests.some(r => r.toId === toUser.id)) {
            return res.status(400).json({ success: false, message: '이미 친구 요청을 보냈습니다.' });
        }
        if (toUser.friendRequests.some(r => r.fromId === fromUser.id)) {
            return res.status(400).json({ success: false, message: '상대방이 이미 친구 요청을 보냈습니다.' });
        }

        const request = { fromId: fromUser.id, fromName: fromUser.name, fromAvatar: fromUser.avatar, timestamp: new Date().toISOString() };
        toUser.friendRequests.push(request);

        const pending = { toId: toUser.id, toName: toUser.name, toAvatar: toUser.avatar, timestamp: new Date().toISOString() };
        fromUser.pendingRequests.push(pending);

        await userRepository.saveUser(fromUser);
        await userRepository.saveUser(toUser);
        await redisManager.persistUser(fromUser.id);
        await redisManager.persistUser(toUser.id);
        
        // Notify recipient if online
        io.to(toUser.id).emit('friendRequestReceived', request);
        res.json({ success: true, message: '친구 요청을 보냈습니다.' });
    });

    app.post('/api/friend-request/accept', authMiddleware, async (req, res) => {
        try {
            const { requestorId } = req.body;
            const user = req.user; // 미들웨어에서 검증된 사용자 정보
            const requestor = await userRepository.getUser(requestorId);

            if (!requestor) {
                return res.status(404).json({ success: false, message: '요청한 사용자를 찾을 수 없습니다.' });
            }

            user.friendRequests = user.friendRequests.filter(req => req.fromId !== requestorId);
            requestor.pendingRequests = requestor.pendingRequests.filter(req => req.toId !== user.id);

            await userRepository.saveUser(user);
            await userRepository.saveUser(requestor);
            await userRepository.addFriend(user.id, requestor.id);
            await redisManager.persistUser(user.id);
            await redisManager.persistUser(requestor.id);

            // Notify both users of status change
            const requestorDisplayStatus = await socketRepository.getDisplayStatus(requestor.id, requestor.onlineStatus);
            const userDisplayStatus = await socketRepository.getDisplayStatus(user.id, user.onlineStatus);
            io.to(user.id).emit('friendAccepted', { id: requestor.id, name: requestor.name, avatar: requestor.avatar, onlineStatus: requestorDisplayStatus });
            io.to(requestor.id).emit('friendAccepted', { id: user.id, name: user.name, avatar: user.avatar, onlineStatus: userDisplayStatus });
            res.json({ success: true, message: '친구 요청을 수락했습니다.' });
        } catch (error) {
            console.error('Error accepting friend request:', error);
            res.status(500).json({ success: false, message: '친구 요청 수락 중 서버 오류가 발생했습니다.' });
        }
    });

    app.post('/api/friend-request/decline', authMiddleware, async (req, res) => {
        const { requestorId } = req.body;
        const user = req.user; // 미들웨어에서 검증된 사용자 정보
        const requestor = await userRepository.getUser(requestorId);

        if (!requestor) {
            return res.status(404).json({ success: false, message: '요청한 사용자를 찾을 수 없습니다.' });
        }

        user.friendRequests = user.friendRequests.filter(req => req.fromId !== requestorId);
        requestor.pendingRequests = requestor.pendingRequests.filter(req => req.toId !== user.id);

        await userRepository.saveUser(user);
        await userRepository.saveUser(requestor);
        await redisManager.persistUser(user.id);
        await redisManager.persistUser(requestor.id);

        // Notify requestor of decline
        io.to(requestor.id).emit('friendRequestDeclined', { id: user.id, name: user.name });
        res.json({ success: true, message: '친구 요청을 거절했습니다.' });
    });

    app.post('/api/friends/remove', authMiddleware, async (req, res) => {
        try {
            const { friendId } = req.body;
            const user = req.user; // 미들웨어에서 검증된 사용자 정보
            const friendToRemove = await userRepository.getUser(friendId);

            if (!friendToRemove) {
                return res.status(404).json({ success: false, message: '삭제할 친구를 찾을 수 없습니다.' });
            }

            await userRepository.removeFriend(user.id, friendId);
            await redisManager.persistUser(user.id);
            await redisManager.persistUser(friendToRemove.id);

            // Notify friend of removal
            io.to(friendToRemove.id).emit('friendRemoved', { id: user.id, name: user.name });
            res.json({ success: true, message: '친구를 삭제했습니다.' });
        } catch (error) {
            console.error('Error removing friend:', error);
            res.status(500).json({ success: false, message: '친구 삭제 중 서버 오류가 발생했습니다.' });
        }
    });

    app.post('/api/friend-request/cancel', authMiddleware, async (req, res) => {
        try {
            const { recipientId } = req.body;
            const user = req.user; // 미들웨어에서 검증된 사용자 정보
            const recipient = await userRepository.getUser(recipientId);

            if (!recipient) {
                return res.status(404).json({ success: false, message: '요청을 보낸 사용자를 찾을 수 없습니다.' });
            }

            // 발신자의 pendingRequests에서 요청 제거
            user.pendingRequests = user.pendingRequests.filter(req => req.toId !== recipientId);
            // 수신자의 friendRequests에서 요청 제거
            recipient.friendRequests = recipient.friendRequests.filter(req => req.fromId !== user.id);

            await userRepository.saveUser(user);
            await userRepository.saveUser(recipient);
            await redisManager.persistUser(user.id);
            await redisManager.persistUser(recipient.id);

            // 양측에 변경 사항 알림 (선택 사항이지만 일관성을 위해)
            io.to(user.id).emit('friendRequestCanceled', { id: recipient.id, name: recipient.name });
            io.to(recipient.id).emit('friendRequestCanceled', { id: user.id, name: user.name });

            res.json({ success: true, message: '친구 요청을 취소했습니다.' });
        } catch (error) {
            console.error('Error canceling friend request:', error);
            res.status(500).json({ success: false, message: '친구 요청 취소 중 서버 오류가 발생했습니다.' });
        }
    });
};