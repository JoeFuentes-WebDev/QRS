import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export type ImageAnalysis = {
  name: string
  category: string
  pieceCount: number
  description: string
  tags: string[]
  aiColor: string
  aiTexture: string
  aiMaterial: string
  suggestedPrice: number
}

function parseTags(tags: string[]) {
  return {
    aiColor: tags[0] ?? '',
    aiTexture: tags[1] ?? '',
    aiMaterial: tags[2] ?? '',
  }
}

export async function analyzeProductImage(imageBase64: string, mediaType: string): Promise<ImageAnalysis> {
  const response = await client.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `You are analyzing a photo of a product for an online shop.

Respond ONLY with a JSON object (no markdown, no backticks) with these fields:
{
  "name": "short descriptive product name",
  "category": "one lowercase category word (e.g. mug, bowl, vase, jewelry, apparel, other)",
  "pieceCount": number of individual items visible in the image,
  "description": "1-2 sentence description of the item",
  "tags": [
    "dominant color",
    "texture (smooth, rough, matte, glossy, etc.)",
    "material",
    "any other relevant descriptive tags"
  ],
  "suggestedPrice": suggested USD price as a number
}`,
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const parsed = JSON.parse(text) as Omit<ImageAnalysis, 'aiColor' | 'aiTexture' | 'aiMaterial'>
    const tagFields = parseTags(parsed.tags ?? [])
    return {
      ...parsed,
      ...tagFields,
      suggestedPrice: parsed.suggestedPrice ?? suggestedPriceFromCount(parsed.pieceCount ?? 1),
    }
  } catch {
    return {
      name: 'Product',
      category: 'other',
      pieceCount: 1,
      description: 'A product listing.',
      tags: ['handmade'],
      aiColor: 'natural',
      aiTexture: 'smooth',
      aiMaterial: 'mixed',
      suggestedPrice: 50,
    }
  }
}

function suggestedPriceFromCount(pieceCount: number): number {
  if (pieceCount <= 1) return 50
  if (pieceCount === 2) return 80
  if (pieceCount === 3) return 100
  return 150
}
