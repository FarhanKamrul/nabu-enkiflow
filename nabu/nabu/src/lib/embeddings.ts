/**
 * Label definitions and embeddings utilities for sentiment classification
 * IMPORTANT: First word of each label MUST match database CHECK constraints exactly
 */

export interface LabelDefinition {
    category: string;
    labels: string[];
}

export interface LabelEmbedding {
    label: string;
    embedding: number[];
}

export interface CategoryEmbeddings {
    category: string;
    embeddings: LabelEmbedding[];
}

/**
 * Pre-defined label definitions for all classification categories
 * First word of each label is extracted and saved to database
 */
export const LABEL_DEFINITIONS: LabelDefinition[] = [
    {
        category: 'products',
        labels: [
            'D1 Cloudflare database SQL storage querying',
            'KV Workers key-value store caching',
            'AI Workers machine learning inference models',
            'R2 object storage buckets files',
            'Workflows orchestration stateful functions',
            'DDoS protection security mitigation',
        ],
    },
    {
        category: 'polarity',
        labels: [
            'positive satisfied excellent working well happy pleased',
            'neutral okay fine average acceptable functional',
            'negative frustrated broken failing disappointed angry',
        ],
    },
    {
        category: 'urgency',
        labels: [
            'critical urgent blocking production emergency immediate down',
            'high priority important impacting significant',
            'medium normal standard routine moderate',
            'low minor casual suggestion nice-to-have future',
        ],
    },
    {
        category: 'feedbackType',
        labels: [
            'bug error failure broken crash exception not working',
            'feature_request enhancement new capability need want',
            'documentation help guide tutorial unclear confusing',
            'performance slow latency timeout speed optimization',
            'pricing cost billing expensive tier limit quota',
        ],
    },
    {
        category: 'churnRisk',
        labels: [
            'high risk leaving switching competitor alternative canceling frustrated quitting',
            'medium risk neutral evaluating considering exploring options unsure',
            'low risk satisfied staying committed continuing happy loyal',
        ],
    },
];

/**
 * Cosine similarity calculation between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have the same length');
    }

    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Pre-compute embeddings for all label definitions using BATCH API
 * This should be called once at startup or cached
 */
export async function precomputeLabelEmbeddings(ai: Ai): Promise<CategoryEmbeddings[]> {
    const categoryEmbeddings: CategoryEmbeddings[] = [];

    for (const labelDef of LABEL_DEFINITIONS) {
        try {
            // BATCH API: send all labels for this category at once (up to 100 items)
            const result = await ai.run('@cf/baai/bge-base-en-v1.5', {
                text: labelDef.labels, // Array of strings
            });

            // Response format: { shape: [768], data: [[...768], [...768], ...] }
            // One embedding array per input string
            const embeddingData = (result as any).data;

            const embeddings: LabelEmbedding[] = labelDef.labels.map((label, index) => ({
                label,
                embedding: Array.from(embeddingData[index]),
            }));

            categoryEmbeddings.push({
                category: labelDef.category,
                embeddings,
            });
        } catch (error) {
            console.error(`Failed to generate embeddings for category: ${labelDef.category}`, error);
            throw error;
        }
    }

    return categoryEmbeddings;
}

/**
 * Simple label extraction from full label text
 * e.g., "positive satisfied excellent..." -> "positive"
 */
export function extractLabelName(fullLabel: string): string {
    return fullLabel.split(' ')[0];
}

/**
 * Map category to database column names
 */
export function getCategoryColumnName(category: string): string {
    const mapping: Record<string, string> = {
        polarity: 'sentiment',
        feedbackType: 'feedback_type',
        products: 'product_detected',
        urgency: 'urgency',
        churnRisk: 'churn_risk',
    };
    return mapping[category] || category;
}
