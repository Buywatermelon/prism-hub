import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

// 使用环境变量或默认密钥（生产环境必须设置环境变量）
const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET || 'default-dev-key-32-chars-exactly!'

// 生成密钥派生
function getKey(): Buffer {
  return scryptSync(ENCRYPTION_KEY, 'salt', 32)
}

/**
 * 加密 API 密钥
 */
export function encryptApiKey(apiKey: string): string {
  const iv = randomBytes(16)
  const key = getKey()
  const cipher = createCipheriv('aes-256-cbc', key, iv)
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  // 返回 iv:encrypted 格式
  return iv.toString('hex') + ':' + encrypted
}

/**
 * 解密 API 密钥
 */
export function decryptApiKey(encryptedData: string): string {
  try {
    const [ivHex, encrypted] = encryptedData.split(':')
    if (!ivHex || !encrypted) {
      console.error('Invalid encrypted data format')
      return ''
    }
    
    const iv = Buffer.from(ivHex, 'hex')
    const key = getKey()
    const decipher = createDecipheriv('aes-256-cbc', key, iv)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Failed to decrypt API key:', error)
    return ''
  }
}