/**
 * Batch classify all feedback items efficiently
 * Uses single batch embedding call for all 100 items
 */

import { precomputeLabelEmbeddings, cosineSimilarity, extractLabelName } from './embeddings';
import { saveClassifications, type ClassificationResult } from './classifier';

export async function batchClassifyFeedback(
    feedbackItems: Array<{ id: number; content: string }>,
    db: D1Database,
    ai: Ai
): Promise<{ classified: number; failed: number }> {
    // Step 1: Pre-compute label embeddings (5 API calls total)
    console.log('Pre-computing label embeddings...');
    const labelEmbeddings = await precomputeLabelEmbeddings(ai);
    console.log(`Generated embeddings for ${labelEmbeddings.length} categories`);

    // Step 2: Batch generate embeddings for ALL feedback items (Chunked into 100s)
    console.log(`Generating embeddings for ${feedbackItems.length} feedback items in chunks...`);
    const allEmbeddings: any[] = [];
    const chunkSize = 100;

    for (let i = 0; i < feedbackItems.length; i += chunkSize) {
        const chunk = feedbackItems.slice(i, i + chunkSize);
        const chunkTexts = chunk.map((item) => item.content);

        console.log(`Processing chunk ${i / chunkSize + 1}/${Math.ceil(feedbackItems.length / chunkSize)}...`);
        const result = await ai.run('@cf/baai/bge-base-en-v1.5', {
            text: chunkTexts,
        });

        const chunkEmbeddings = (result as any).data;
        allEmbeddings.push(...chunkEmbeddings);
    }

    // Response: { data: [[...768], [...768], ...] }
    const feedbackEmbeddings = allEmbeddings;
    console.log(`Generated ${feedbackEmbeddings.length} feedback embeddings total`);

    // Step 3: Classify each feedback using pre-computed embeddings and batch save
    let classified = 0;
    let failed = 0;
    const saveChunkSize = 50;
    const batchResults: Array<{ id: number, classifications: Record<string, ClassificationResult> }> = [];

    for (let i = 0; i < feedbackItems.length; i++) {
        const item = feedbackItems[i];
        const feedbackEmbedding = feedbackEmbeddings[i];

        if (!feedbackEmbedding) {
            failed++;
            continue;
        }

        try {
            const classifications: Record<string, ClassificationResult> = {};

            // Compute similarity for each category
            for (const categoryData of labelEmbeddings) {
                const similarities = categoryData.embeddings.map((labelEmbed) => ({
                    label: labelEmbed.label,
                    score: cosineSimilarity(feedbackEmbedding, labelEmbed.embedding),
                }));

                // Find best match
                const bestMatch = similarities.reduce((max, curr) => (curr.score > max.score ? curr : max));

                let label = extractLabelName(bestMatch.label);
                let confidence = bestMatch.score;

                // Save raw label and confidence for later dynamic thresholding
                classifications[categoryData.category] = {
                    category: categoryData.category,
                    label: label,
                    confidence: confidence,
                };
            }

            batchResults.push({ id: item.id, classifications });
            classified++;
        } catch (error) {
            console.error(`Failed to classify feedback ${item.id}:`, error);
            failed++;
        }
    }

    // Batch save to database in chunks of 50
    console.log(`Saving ${batchResults.length} classifications in batches...`);
    for (let i = 0; i < batchResults.length; i += saveChunkSize) {
        const chunk = batchResults.slice(i, i + saveChunkSize);
        const batch = chunk.map(res => {
            const sentiment = res.classifications.polarity?.label || null;
            const sentimentConfidence = res.classifications.polarity?.confidence || null;
            const urgency = res.classifications.urgency?.label || null;
            const urgencyConfidence = res.classifications.urgency?.confidence || null;
            const productDetected = res.classifications.products?.label || null;
            const productConfidence = res.classifications.products?.confidence || null;
            const feedbackType = res.classifications.feedbackType?.label || null;
            const feedbackTypeConfidence = res.classifications.feedbackType?.confidence || null;
            const churnRisk = res.classifications.churnRisk?.label || null;

            return db.prepare(
                `INSERT INTO classifications 
                (feedback_id, sentiment, sentiment_confidence, urgency, urgency_confidence, 
                product_detected, product_confidence, feedback_type, feedback_type_confidence, churn_risk)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
                res.id, sentiment, sentimentConfidence, urgency, urgencyConfidence,
                productDetected, productConfidence, feedbackType, feedbackTypeConfidence, churnRisk
            );
        });

        await db.batch(batch);
        console.log(`Saved batch ${i / saveChunkSize + 1}/${Math.ceil(batchResults.length / saveChunkSize)}`);
    }

    return { classified, failed };
}
