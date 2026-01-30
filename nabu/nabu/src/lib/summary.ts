/**
 * Executive summary generation using LLM
 * Stage 3: Generate PM-focused dashboard summary
 */

export interface AggregatedMetrics {
    totalCount: number;
    positivePercent: number;
    neutralPercent: number;
    negativePercent: number;
    topThemes: Array<{ theme: string; count: number }>;
    criticalCount: number;
    highCount: number; // Added for logic
    topProducts: string[];
}

export interface PrioritizedMetrics {
    recent7d: AggregatedMetrics;
    recent30d: AggregatedMetrics;
    allTime: AggregatedMetrics;
    latestCriticalItems: Array<{ content: string; source: string; timestamp: string }>;
}

/**
 * Generate executive summary for PM dashboard
 * Prioritizes recent data and uses conditional logic for issue reporting
 */
export async function generateExecutiveSummary(metrics: PrioritizedMetrics, ai: Ai): Promise<string> {
    const hasUrgent7d = metrics.recent7d.criticalCount > 0;
    const hasImportan7d = metrics.recent7d.highCount >= 5;
    const hasCritical30d = metrics.recent30d.criticalCount >= 5;

    let windowContext = "";
    if (hasUrgent7d) {
        windowContext = `FOCUS: Urgent issues from the last 7 days (${metrics.recent7d.criticalCount} critical items).`;
    } else if (!hasImportan7d) {
        // Condition: 30 day issues if at least 5 important 7 day issues are NOT present
        windowContext = `FOCUS: Issues from the last 30 days (fallback due to low 7-day volume).`;
    } else if (!hasCritical30d) {
        // Condition: year long issues if at least 5 critical issues are NOT present in 30 day window
        windowContext = `FOCUS: Long-term trends and issues from the past year (fallback due to low 30-day volume).`;
    } else {
        windowContext = `FOCUS: Recent 30-day performance trends.`;
    }

    const criticalItemsList = metrics.latestCriticalItems
        .map(item => `- [${item.source}] ${item.content.substring(0, 100)}... (${item.timestamp})`)
        .join('\n');

    const summaryPrompt = `You are a product analyst. Based on aggregated customer feedback, write a concise 2-3 sentence executive summary for a product manager.
    
${windowContext}

LATEST CRITICAL FEEDBACK (Last 5 items):
${criticalItemsList}

7-DAY METRICS:
- Total: ${metrics.recent7d.totalCount}
- Sentiment: ${metrics.recent7d.positivePercent}% positive, ${metrics.recent7d.negativePercent}% negative
- Critical Items: ${metrics.recent7d.criticalCount}
- Top Themes: ${metrics.recent7d.topThemes.map((t) => `${t.theme} (${t.count})`).join(', ')}

30-DAY METRICS:
- Total: ${metrics.recent30d.totalCount}
- Sentiment: ${metrics.recent30d.positivePercent}% positive, ${metrics.recent30d.negativePercent}% negative
- Critical Items: ${metrics.recent30d.criticalCount}

ALL-TIME PRODUCTS: ${metrics.allTime.topProducts.join(', ')}

Provide actionable insights focusing on the specified FOCUS area and the LATEST CRITICAL FEEDBACK provided above.
Maximum 3 sentences. Plaintext only.`;

    try {
        const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [{ role: 'user', content: summaryPrompt }],
            max_tokens: 200,
        });

        return (response as any).response || 'Summary generation in progress...';
    } catch (error) {
        console.error('Executive summary generation failed:', error);
        return `Unable to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}

/**
 * Prepare metrics for summary generation with optional date filter
 */
export async function prepareMetricsForSummary(db: D1Database, startDate?: string): Promise<AggregatedMetrics> {
    const whereClause = startDate ? ' WHERE f.timestamp >= ?' : '';
    const params = startDate ? [startDate] : [];

    // Use batch() to parallelize queries and reduce latency
    const results = await db.batch([
        db.prepare('SELECT COUNT(*) as count FROM feedback f' + whereClause).bind(...params),
        db.prepare(
            'SELECT sentiment, COUNT(*) as count FROM classifications c JOIN feedback f ON c.feedback_id = f.id' + whereClause + ' GROUP BY sentiment'
        ).bind(...params),
        db.prepare(
            'SELECT feedback_type as theme, COUNT(*) as count FROM classifications c JOIN feedback f ON c.feedback_id = f.id' + whereClause + ' GROUP BY feedback_type ORDER BY count DESC LIMIT 3'
        ).bind(...params),
        db.prepare("SELECT COUNT(*) as count FROM classifications c JOIN feedback f ON c.feedback_id = f.id" + (startDate ? whereClause + " AND " : " WHERE ") + "urgency = 'critical' AND urgency_confidence > 0.5").bind(...params),
        db.prepare(`
			SELECT product, SUM(count) as total_count
			FROM (
				SELECT product, COUNT(*) as count FROM feedback f ${whereClause} GROUP BY product
				UNION ALL
				SELECT product_detected as product, COUNT(*) as count FROM classifications c JOIN feedback f ON c.feedback_id = f.id ${whereClause} GROUP BY product_detected
			)
			GROUP BY product
			ORDER BY total_count DESC
			LIMIT 3
		`).bind(...params, ...params),
        db.prepare("SELECT COUNT(*) as count FROM classifications c JOIN feedback f ON c.feedback_id = f.id" + (startDate ? whereClause + " AND " : " WHERE ") + "(urgency = 'high' OR (urgency = 'critical' AND urgency_confidence <= 0.5))").bind(...params),
    ]);

    const totalCount = (results[0].results[0] as any).count || 0;
    const sentimentResult = results[1].results as Array<{ sentiment: string; count: number }>;
    const topThemes = results[2].results as Array<{ theme: string; count: number }>;
    const criticalCount = (results[3].results[0] as any).count || 0;
    const topProducts = (results[4].results as Array<{ product: string; total_count: number }>).map(
        (r) => r.product
    );
    const highCount = (results[5].results[0] as any).count || 0;

    const sentimentCounts = {
        positive: 0,
        neutral: 0,
        negative: 0,
    };

    for (const row of sentimentResult) {
        if (row.sentiment in sentimentCounts) {
            sentimentCounts[row.sentiment as keyof typeof sentimentCounts] = row.count;
        }
    }

    const classifiedCount =
        sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;
    const positivePercent =
        classifiedCount > 0 ? Math.round((sentimentCounts.positive / classifiedCount) * 100) : 0;
    const neutralPercent =
        classifiedCount > 0 ? Math.round((sentimentCounts.neutral / classifiedCount) * 100) : 0;
    const negativePercent =
        classifiedCount > 0 ? Math.round((sentimentCounts.negative / classifiedCount) * 100) : 0;

    return {
        totalCount,
        positivePercent,
        neutralPercent,
        negativePercent,
        topThemes,
        criticalCount,
        highCount,
        topProducts,
    };
}

/**
 * Fetch latest 5 critical feedback items for the prompt
 */
export async function getLatestCriticalFeedback(db: D1Database): Promise<Array<{ content: string; source: string; timestamp: string }>> {
    const query = `
        SELECT f.content, f.source, f.timestamp
        FROM feedback f
        JOIN classifications c ON f.id = c.feedback_id
        WHERE c.urgency = 'critical' AND c.urgency_confidence > 0.5
        ORDER BY f.timestamp DESC
        LIMIT 5
    `;
    const result = await db.prepare(query).all();
    return result.results as any;
}

/**
 * Get daily trend data
 */
export async function getTrendDataForSummary(db: D1Database, startDate?: string, endDate?: string) {
    const whereClause = [];
    const params = [];

    if (startDate) {
        whereClause.push('f.timestamp >= ?');
        params.push(startDate);
    }
    if (endDate) {
        whereClause.push('f.timestamp <= ?');
        params.push(endDate);
    }

    const filter = whereClause.length > 0 ? ' WHERE ' + whereClause.join(' AND ') : '';

    const query = `
		SELECT 
			DATE(f.timestamp) as date,
			COUNT(*) as total,
			SUM(CASE WHEN c.urgency = 'critical' AND c.urgency_confidence > 0.5 THEN 1 ELSE 0 END) as critical,
			SUM(CASE WHEN c.sentiment = 'negative' THEN 1 ELSE 0 END) as negative,
			SUM(CASE WHEN c.sentiment = 'positive' THEN 1 ELSE 0 END) as positive
		FROM feedback f
		LEFT JOIN classifications c ON f.id = c.feedback_id
		${filter}
		GROUP BY date
		ORDER BY date ASC
	`;

    const result = await db.prepare(query).bind(...params).all();
    return result.results;
}
