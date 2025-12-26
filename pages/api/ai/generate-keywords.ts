import type { NextApiRequest, NextApiResponse } from 'next'

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { brandName } = req.body

  if (!brandName || typeof brandName !== 'string') {
    return res.status(400).json({ error: 'Brand name is required' })
  }

  const apiKey = process.env.AI_KEY

  if (!apiKey) {
    return res.status(500).json({ error: 'AI_KEY is not configured' })
  }

  try {
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
      return res.status(response.status).json({ 
        error: errorData.error?.message || `API error: ${response.status}` 
      })
    }

    const data: AIKeywordResponse = await response.json()
    
    // Extract keywords from response
    const outputText = data.output?.[0]?.content?.[0]?.text || ''
    
    // Split by comma and clean up
    const keywords = outputText
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k && /^[a-z0-9]+$/.test(k))

    return res.status(200).json({ keywords })
  } catch (error: any) {
    console.error('AI API error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
