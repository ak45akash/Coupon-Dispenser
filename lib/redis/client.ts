import Redis from 'ioredis'

let redisClient: Redis | null = null

/**
 * Get or create Redis client instance
 * Uses singleton pattern to reuse connection
 */
export function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient
  }

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set')
  }

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
  })

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err)
  })

  return redisClient
}

/**
 * Check if jti (JWT ID) has been used (replay protection)
 * Returns true if jti is already set (replay detected), false if it's new
 */
export async function checkJtiReplay(jti: string, ttlSeconds: number): Promise<boolean> {
  const redis = getRedisClient()
  const key = `jti:${jti}`
  
  // SETNX: Set if not exists
  // Returns 1 if key was set, 0 if key already exists
  const result = await redis.set(key, '1', 'EX', ttlSeconds, 'NX')
  
  // If result is null, key already exists (replay detected)
  return result === null
}

/**
 * Close Redis connection (useful for cleanup in tests)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
  }
}

