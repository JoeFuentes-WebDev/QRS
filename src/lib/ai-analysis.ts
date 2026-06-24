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

const PRODUCT_IMAGE_PROMPT = `You are analyzing a photo of a product for an online shop.

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
}`

async function analyzeProductImageCore(
  imageBase64: string,
  mediaType: string
): Promise<ImageAnalysis | null> {
  const response = await client.messages.create({
    model: 'claude-opus-4-6',
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
            text: PRODUCT_IMAGE_PROMPT,
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
    return null
  }
}

export async function analyzeProductImage(imageBase64: string, mediaType: string): Promise<ImageAnalysis> {
  const result = await analyzeProductImageCore(imageBase64, mediaType)
  if (result) return result

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

export type ProductImageAnalysis = {
  name: string
  description: string
  tags: string[]
  category: string
}

export async function analyzeProductFromImageUrl(
  imageUrl: string
): Promise<ProductImageAnalysis | null> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    console.warn('[ai-analysis] ANTHROPIC_API_KEY not set — skipping auto analysis')
    return null
  }

  const trimmedUrl = imageUrl.trim()
  if (!trimmedUrl) return null

  try {
    const imageRes = await fetch(trimmedUrl)
    if (!imageRes.ok) {
      throw new Error(`Failed to fetch image: ${imageRes.status}`)
    }

    const buffer = Buffer.from(await imageRes.arrayBuffer())
    const base64 = buffer.toString('base64')
    const mediaType = imageRes.headers.get('content-type') || 'image/jpeg'
    const analysis = await analyzeProductImageCore(base64, mediaType)

    if (!analysis) return null

    const name = analysis.name.trim()
    const description = analysis.description.trim()
    const category = analysis.category.trim()
    const tags = (analysis.tags ?? [])
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)

    if (!name || !description || !category) return null

    return {
      name,
      description,
      category,
      tags,
    }
  } catch (error) {
    console.warn('[ai-analysis] analyzeProductFromImageUrl failed:', error)
    return null
  }
}

function suggestedPriceFromCount(pieceCount: number): number {
  if (pieceCount <= 1) return 50
  if (pieceCount === 2) return 80
  if (pieceCount === 3) return 100
  return 150
}

const AI_TAG_STUB = {
  tags: ['handmade', 'artisan'],
  category: 'General',
} as const

export type ProductTagResult = {
  tags: string[]
  category: string
}

export async function generateProductTags(input: {
  name: string
  description: string
  imageUrls: string[]
}): Promise<ProductTagResult> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    console.warn('[ai-analysis] ANTHROPIC_API_KEY not set — returning stub tags')
    return { tags: [...AI_TAG_STUB.tags], category: AI_TAG_STUB.category }
  }

  const imageUrl = input.imageUrls[0]?.trim()
  if (!imageUrl) {
    return { tags: ['handmade'], category: 'General' }
  }

  try {
    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) {
      throw new Error(`Failed to fetch image: ${imageRes.status}`)
    }

    const buffer = Buffer.from(await imageRes.arrayBuffer())
    const base64 = buffer.toString('base64')
    const mediaType = imageRes.headers.get('content-type') || 'image/jpeg'

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
                data: base64,
              },
            },
            {
              type: 'text',
              text: `You are tagging a product for an online craft shop.

Product name: ${input.name}
Product description: ${input.description}

Respond ONLY with a JSON object (no markdown, no backticks):
{
  "category": "short category label (e.g. Pottery, Jewelry, Apparel)",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}

Use 3–6 lowercase descriptive tags.`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const parsed = JSON.parse(text) as { category?: string; tags?: string[] }
    const tags = (parsed.tags ?? [])
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 8)

    return {
      category: parsed.category?.trim() || 'General',
      tags: tags.length > 0 ? tags : [...AI_TAG_STUB.tags],
    }
  } catch (error) {
    console.warn('[ai-analysis] generateProductTags failed:', error)
    return { tags: [...AI_TAG_STUB.tags], category: AI_TAG_STUB.category }
  }
}
