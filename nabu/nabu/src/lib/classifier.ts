/**
 * Hybrid sentiment classification system
 * Stage 1: Embedding-based classification
 * Stage 2: LLM refinement for low-confidence items
 */

import {
    type CategoryEmbeddings,
    cosineSimilarity,
    extractLabelName,
    getCategoryColumnName,
} from './embeddings';

export interface ClassificationResult {
    category: string;
    label: string;
    confidence: number;
}

export interface FeedbackClassifications {
    feedbackId: number;
    classifications: Record<string, ClassificationResult>;
    needsRefinement: boolean;
    refinementReason?: string;
}

/**
 * Stage 1: Classify feedback using embedding similarity
 */
export async function classifyFeedback(
    feedbackText: string,
    feedbackId: number,
    labelEmbeddings: CategoryEmbeddings[],
    ai: Ai
): Promise<FeedbackClassifications> {
    // Generate embedding for the feedback text
    const feedbackEmbeddingResult = await ai.run('@cf/baai/bge-base-en-v1.5', {
        text: feedbackText,
    });

    // Response format: { shape: [768], data: [[...768 numbers]] }
    const embeddingData = (feedbackEmbeddingResult as any).data;
    const feedbackEmbedding = Array.isArray(embeddingData[0]) ? embeddingData[0] : embeddingData;

    const classifications: Record<string, ClassificationResult> = {};
    let lowestConfidence = 1.0;
    let hasCriticalUrgency = false;
    let hasMixedSentiment = false;

    // Compute similarity for each category
    for (const categoryData of labelEmbeddings) {
        const similarities = categoryData.embeddings.map((labelEmbed) => ({
            label: labelEmbed.label,
            score: cosineSimilarity(feedbackEmbedding, labelEmbed.embedding),
        }));

        // Find best match
        const bestMatch = similarities.reduce((max, curr) => (curr.score > max.score ? curr : max));

        classifications[categoryData.category] = {
            category: categoryData.category,
            label: extractLabelName(bestMatch.label),
            confidence: bestMatch.score,
        };

        // Track metrics for refinement decision
        if (bestMatch.score < lowestConfidence) {
            lowestConfidence = bestMatch.score;
        }

        if (categoryData.category === 'urgency' && bestMatch.label.startsWith('critical')) {
            hasCriticalUrgency = true;
        }

        // Check for mixed sentiment (high similarity to multiple sentiment labels)
        if (categoryData.category === 'polarity') {
            const topTwo = similarities.sort((a, b) => b.score - a.score).slice(0, 2);
            if (topTwo.length === 2 && Math.abs(topTwo[0].score - topTwo[1].score) < 0.15) {
                hasMixedSentiment = true;
            }
        }
    }

    // Determine if LLM refinement is needed
    const needsRefinement = lowestConfidence < 0.65 || hasCriticalUrgency || hasMixedSentiment;

    let refinementReason: string | undefined;
    if (needsRefinement) {
        if (lowestConfidence < 0.65) refinementReason = 'low_confidence';
        else if (hasCriticalUrgency) refinementReason = 'critical_urgency';
        else if (hasMixedSentiment) refinementReason = 'mixed_sentiment';
    }

    return {
        feedbackId,
        classifications,
        needsRefinement,
        refinementReason,
    };
}

/**
 * Stage 2: Refine classification using LLM for low-confidence items
 */
export async function refineCriticalFeedback(
    feedbackContent: string,
    classifications: Record<string, ClassificationResult>,
    ai: Ai
): Promise<string> {
    const prompt = `Analyze this customer feedback and validate the automated classification:

Feedback: "${feedbackContent}"

Automated Classification:
- Product: ${classifications.products?.label || 'unknown'} (confidence: ${classifications.products?.confidence.toFixed(2) || 'N/A'})
- Sentiment: ${classifications.polarity?.label || 'unknown'} (confidence: ${classifications.polarity?.confidence.toFixed(2) || 'N/A'})
- Urgency: ${classifications.urgency?.label || 'unknown'} (confidence: ${classifications.urgency?.confidence.toFixed(2) || 'N/A'})
- Type: ${classifications.feedbackType?.label || 'unknown'} (confidence: ${classifications.feedbackType?.confidence.toFixed(2) || 'N/A'})

Provide:
1. Validation: Are these classifications accurate? (Yes/No + brief explanation)
2. Corrected classifications if wrong (specify which ones)
3. Churn risk assessment (High/Medium/Low) with reasoning

Keep response under 150 words.`;

    try {
        const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200,
        });

        return (response as any).response || JSON.stringify(response);
    } catch (error) {
        console.error('LLM refinement failed:', error);
        return `Refinement failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}

/**
 * Save classifications to database
 */
export async function saveClassifications(
    db: D1Database,
    feedbackId: number,
    classifications: Record<string, ClassificationResult>,
    refinementNotes?: string
): Promise<void> {
    const sentiment = classifications.polarity?.label || null;
    const sentimentConfidence = classifications.polarity?.confidence || null;
    const urgency = classifications.urgency?.label || null;
    const urgencyConfidence = classifications.urgency?.confidence || null;
    const productDetected = classifications.products?.label || null;
    const productConfidence = classifications.products?.confidence || null;
    const feedbackType = classifications.feedbackType?.label || null;
    const feedbackTypeConfidence = classifications.feedbackType?.confidence || null;
    const churnRisk = classifications.churnRisk?.label || null;

    await db
        .prepare(
            `INSERT INTO classifications 
      (feedback_id, sentiment, sentiment_confidence, urgency, urgency_confidence, 
       product_detected, product_confidence, feedback_type, feedback_type_confidence, churn_risk)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
            feedbackId,
            sentiment,
            sentimentConfidence,
            urgency,
            urgencyConfidence,
            productDetected,
            productConfidence,
            feedbackType,
            feedbackTypeConfidence,
            churnRisk
        )
        .run();
}
