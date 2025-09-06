/**
 * @file Redis 클라이언트 연결 및 관리를 담당합니다.
 * 기본 클라이언트, 게시(Pub)용 클라이언트, 구독(Sub)용 클라이언트를 생성하고 초기화합니다.
 */
const { createClient } = require('redis');
const config = require('./config');

const redisOptions = {
    url: `redis://127.0.0.1:6379/${config.redisDb}`
};

// 기본 Redis 클라이언트입니다. 일반적인 데이터 조작에 사용됩니다.
const client = createClient(redisOptions);
client.on('error', (err) => console.error('Redis Client Error', err));

// Socket.IO 어댑터와 메시지 브로드캐스팅을 위한 게시(Publish)용 클라이언트입니다.
const pubClient = client.duplicate();
// Socket.IO 어댑터와 메시지 브로드캐스팅을 위한 구독(Subscribe)용 클라이언트입니다.
const subClient = client.duplicate();

/**
 * 모든 Redis 클라이언트를 비동기적으로 연결합니다.
 */
async function initRedis() {
    await Promise.all([
        client.connect(),
        pubClient.connect(),
        subClient.connect(),
    ]);
}

module.exports = {
    client,
    pubClient,
    subClient,
    initRedis,
};
