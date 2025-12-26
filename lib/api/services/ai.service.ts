/**
 * AI Service for OpenAI API calls
 */

const AI_API_URL = 'https://api.openai.com/v1/responses'

interface AIKeywordResponse {
  id: string
  object: string
  status: string
  output: Array<{
    id: string
    type: string
    status: string
    content: Array<{
      type: string
      text: string
    }>
    role: string
  }>
}

/**
 * Generate keywords from brand name using OpenAI
 * @param brandName - The brand name to generate keywords for
 * @returns Array of generated keywords
 */
export async function generateKeywords(brandName: string): Promise<string[]> {
  const apiKey = process.env.NEXT_PUBLIC_AI_KEY
  
  if (!apiKey) {
    throw new Error('AI_KEY is not configured')
  }

  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: `Bạn là chuyên gia SEO và Social Listening. Nhiệm vụ: Tạo từ khóa để theo dõi thương hiệu trên mạng xã hội (TikTok, YouTube, Facebook).

NGUYÊN TẮC TẠO KEYWORD:
1. Tên thương hiệu gốc (viết liền, không dấu): tên chính xác của brand
2. Tên viết tắt/nickname phổ biến: cách người dùng thường gọi tắt
3. Tên + sản phẩm/dịch vụ chính: kết hợp với ngành hàng
4. Hashtag phổ biến: các hashtag thường dùng khi nhắc đến brand
5. Tên sai chính tả phổ biến: cách viết sai mà người dùng hay mắc

QUY TẮC FORMAT:
- Viết liền, không dấu, không cách, chỉ chữ thường và số
- Phân cách bằng dấu phẩy
- Tối đa 8 keyword, tối thiểu 4 keyword
- Ưu tiên keyword có search volume cao

VÍ DỤ:
Input: Highlands Coffee
Output: highlands,highlandscoffee,highlandcoffee,phinhighlands,cahighlands,highlandsvietnam

Input: Phong Vũ Computer  
Output: phongvu,phongvucomputer,phongvupc,phuongvu,phongvulaptop,maytinhphongvu

CHỈ TRẢ VỀ DANH SÁCH KEYWORD, KHÔNG GIẢI THÍCH.`
        },
        {
          role: 'user',
          content: brandName
        }
      ]
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `API error: ${response.status}`)
  }

  const data: AIKeywordResponse = await response.json()
  
  // Extract keywords from response
  const outputText = data.output?.[0]?.content?.[0]?.text || ''
  
  // Split by comma and clean up
  const keywords = outputText
    .split(',')
    .map(k => k.trim().toLowerCase())
    .filter(k => k && /^[a-z0-9]+$/.test(k))
  
  return keywords
}

export const aiService = {
  generateKeywords
}
