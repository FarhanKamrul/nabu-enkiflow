/**
 * Main Worker entry point with API routes
 */

import { EXPANDED_FEEDBACK, type FeedbackItem } from './lib/mockData';
import { generateExecutiveSummary, prepareMetricsForSummary, getTrendDataForSummary, getLatestCriticalFeedback } from './lib/summary';
import { batchClassifyFeedback } from './lib/batchClassifier';

interface Env {
	DB: D1Database;
	AI: Ai;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// CORS headers for all responses
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		// Handle OPTIONS for CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			// Static assets are automatically served by wrangler's ASSETS binding
			// Route: Seed database with mock data
			if (path === '/api/seed' && request.method === 'POST') {
				return await seedDatabase(env, corsHeaders);
			}

			// Route: Get all feedback
			if (path === '/api/feedback' && request.method === 'GET') {
				return await getFeedback(env, url, corsHeaders);
			}

			// Route: Get single feedback item
			if (path.startsWith('/api/feedback/') && request.method === 'GET') {
				const id = path.split('/')[3];
				return await getFeedbackById(env, id, corsHeaders);
			}

			// Route: Get aggregated metrics
			if (path === '/api/metrics' && request.method === 'GET') {
				return await getMetrics(env, corsHeaders, url);
			}

			// Route: Classify all feedback
			if (path === '/api/classify' && request.method === 'POST') {
				return await classifyAllFeedback(env, corsHeaders);
			}

			// Route: Get executive summary
			if (path === '/api/summary' && request.method === 'GET') {
				return await getExecutiveSummary(env, corsHeaders);
			}

			// Route: Get trend data
			if (path === '/api/trends' && request.method === 'GET') {
				return await getTrends(env, url, corsHeaders);
			}

			// Route: Update feedback status (PATCH /api/feedback/:id/status)
			if (path.startsWith('/api/feedback/') && path.endsWith('/status') && request.method === 'PATCH') {
				const id = path.split('/')[3];
				return await updateFeedbackStatus(env, id, request, corsHeaders);
			}

			// Route: Update feedback issue flag (PATCH /api/feedback/:id/issue)
			if (path.startsWith('/api/feedback/') && path.endsWith('/issue') && request.method === 'PATCH') {
				const id = path.split('/')[3];
				return await updateFeedbackIssue(env, id, request, corsHeaders);
			}

			// Default: Hello message
			return new Response(
				JSON.stringify({
					message: 'Feedback Aggregation API',
					endpoints: [
						'POST /api/seed - Load mock data into database',
						'POST /api/classify - Classify all feedback using AI',
						'GET /api/feedback - Get all feedback (supports ?source=, ?sentiment=, ?status=, ?is_issue=, ?startDate=, ?endDate=, ?limit=, ?offset=)',
						'GET /api/feedback/:id - Get single feedback item',
						'PATCH /api/feedback/:id/status - Toggle status (resolved/unresolved)',
						'PATCH /api/feedback/:id/issue - Toggle issue flag (0/1)',
						'GET /api/metrics - Get aggregated metrics (supports ?startDate=, ?endDate=)',
						'GET /api/trends - Get trend data (supports ?startDate=, ?endDate=)',
						'GET /api/summary - Get executive summary (prioritizes recent data)',
					],
				}),
				{
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json',
					},
				}
			);
		} catch (error) {
			console.error('Error:', error);
			return new Response(
				JSON.stringify({
					error: 'Internal server error',
					message: error instanceof Error ? error.message : 'Unknown error',
				}),
				{
					status: 500,
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json',
					},
				}
			);
		}
	},
} satisfies ExportedHandler<Env>;

/**
 * Seed database with mock feedback data
 */
async function seedDatabase(env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	try {
		// Clear existing data
		await env.DB.prepare('DELETE FROM classifications').run();
		await env.DB.prepare('DELETE FROM feedback').run();

		// Insert all mock feedback items in batches of 50 to avoid API limits
		let insertedCount = 0;
		const chunkSize = 50;
		for (let i = 0; i < EXPANDED_FEEDBACK.length; i += chunkSize) {
			const chunk = EXPANDED_FEEDBACK.slice(i, i + chunkSize);
			const batch = chunk.map(item =>
				env.DB.prepare(`INSERT INTO feedback (source, content, author, product, timestamp) VALUES (?, ?, ?, ?, ?)`)
					.bind(item.source, item.content, item.author, item.product || null, item.timestamp)
			);

			const results = await env.DB.batch(batch);
			insertedCount += results.length;
		}

		// Get count to verify
		const count = await env.DB.prepare('SELECT COUNT(*) as count FROM feedback').first<{ count: number }>();

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Database seeded successfully',
				inserted: insertedCount,
				total: count?.count || 0,
			}),
			{
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json',
				},
			}
		);
	} catch (error) {
		console.error('Seed error:', error);
		return new Response(
			JSON.stringify({
				success: false,
				error: 'Failed to seed database',
				message: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json',
				},
			}
		);
	}
}

/**
 * Get all feedback with optional filtering
 */
async function getFeedback(env: Env, url: URL, corsHeaders: Record<string, string>): Promise<Response> {
	try {
		const source = url.searchParams.get('source');
		const sentiment = url.searchParams.get('sentiment');
		const status = url.searchParams.get('status');
		const isIssue = url.searchParams.get('is_issue');
		const startDate = url.searchParams.get('startDate');
		const endDate = url.searchParams.get('endDate');
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = parseInt(url.searchParams.get('offset') || '0');
		const sort = url.searchParams.get('sort');

		let query = `
      SELECT 
        f.id, f.source, f.content, f.author, f.product, f.timestamp, f.status, f.is_issue,
        c.sentiment, 
        CASE WHEN c.urgency = 'critical' AND c.urgency_confidence > 0.5 THEN 'critical' 
             WHEN c.urgency = 'critical' THEN 'high' 
             ELSE c.urgency END as urgency,
        c.product_detected, c.feedback_type
      FROM feedback f
      LEFT JOIN classifications c ON f.id = c.feedback_id
      WHERE 1=1
    `;
		const params: any[] = [];

		if (source) {
			query += ' AND f.source = ?';
			params.push(source);
		}

		if (sentiment) {
			query += ' AND c.sentiment = ?';
			params.push(sentiment);
		}

		if (status) {
			query += ' AND f.status = ?';
			params.push(status);
		}

		if (isIssue !== null && isIssue !== undefined) {
			query += ' AND f.is_issue = ?';
			params.push(isIssue === 'true' || isIssue === '1' ? 1 : 0);
		}

		if (startDate) {
			query += ' AND f.timestamp >= ?';
			params.push(startDate);
		}

		if (endDate) {
			query += ' AND f.timestamp <= ?';
			params.push(endDate);
		}

		if (sort === 'importance') {
			query += ` ORDER BY 
				CASE 
					WHEN c.urgency = 'critical' AND c.urgency_confidence > 0.5 THEN 3
					WHEN c.urgency = 'high' OR (c.urgency = 'critical' AND c.urgency_confidence <= 0.5) THEN 2
					ELSE 1 
				END DESC, 
				f.timestamp DESC 
			LIMIT ? OFFSET ?`;
		} else {
			query += ' ORDER BY f.timestamp DESC LIMIT ? OFFSET ?';
		}
		params.push(limit, offset);

		const stmt = env.DB.prepare(query).bind(...params);
		const result = await stmt.all();

		return new Response(JSON.stringify(result.results || []), {
			headers: {
				...corsHeaders,
				'Content-Type': 'application/json',
			},
		});
	} catch (error) {
		console.error('Get feedback error:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to fetch feedback',
				message: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json',
				},
			}
		);
	}
}

/**
 * Get single feedback item by ID
 */
async function getFeedbackById(env: Env, id: string, corsHeaders: Record<string, string>): Promise<Response> {
	try {
		const result = await env.DB.prepare(
			`
      SELECT 
        f.id, f.source, f.content, f.author, f.product, f.timestamp, f.status, f.is_issue,
        c.sentiment, c.sentiment_confidence, 
        CASE WHEN c.urgency = 'critical' AND c.urgency_confidence > 0.5 THEN 'critical' 
             WHEN c.urgency = 'critical' THEN 'high' 
             ELSE c.urgency END as urgency,
        c.urgency_confidence,
        c.product_detected, c.product_confidence, c.feedback_type, c.feedback_type_confidence
      FROM feedback f
      LEFT JOIN classifications c ON f.id = c.feedback_id
      WHERE f.id = ?
    `
		)
			.bind(id)
			.first();

		if (!result) {
			return new Response(JSON.stringify({ error: 'Feedback not found' }), {
				status: 404,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json',
				},
			});
		}

		return new Response(JSON.stringify(result), {
			headers: {
				...corsHeaders,
				'Content-Type': 'application/json',
			},
		});
	} catch (error) {
		console.error('Get feedback by ID error:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to fetch feedback',
				message: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json',
				},
			}
		);
	}
}

/**
 * Get aggregated metrics
 */
async function getMetrics(env: Env, corsHeaders: Record<string, string>, url: URL): Promise<Response> {
	try {
		const startDate = url.searchParams.get('startDate');
		const endDate = url.searchParams.get('endDate');

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

		// Use batch() to parallelize queries and reduce latency
		const results = await env.DB.batch([
			env.DB.prepare('SELECT COUNT(*) as count FROM feedback f' + filter).bind(...params),
			env.DB.prepare('SELECT source, COUNT(*) as count FROM feedback f' + filter + ' GROUP BY source ORDER BY count DESC').bind(...params),
			env.DB.prepare('SELECT sentiment, COUNT(*) as count FROM classifications c JOIN feedback f ON c.feedback_id = f.id' + filter + ' GROUP BY sentiment').bind(...params),
			env.DB.prepare(`
				SELECT 
					CASE WHEN urgency = 'critical' AND urgency_confidence > 0.5 THEN 'critical' 
						 WHEN urgency = 'critical' THEN 'high' 
						 ELSE urgency END as urgency, 
					COUNT(*) as count 
				FROM classifications c 
				JOIN feedback f ON c.feedback_id = f.id 
				${filter} 
				GROUP BY urgency
			`).bind(...params),
			env.DB.prepare(`
				SELECT product, SUM(count) as count
				FROM (
					SELECT product, COUNT(*) as count FROM feedback f ${filter} GROUP BY product
					UNION ALL
					SELECT product_detected as product, COUNT(*) as count FROM classifications c JOIN feedback f ON c.feedback_id = f.id ${filter} GROUP BY product_detected
				)
				GROUP BY product
				ORDER BY count DESC
				LIMIT 10
			`).bind(...params, ...params),
			env.DB.prepare('SELECT feedback_type, COUNT(*) as count FROM classifications c JOIN feedback f ON c.feedback_id = f.id' + filter + ' GROUP BY feedback_type').bind(...params),
			env.DB.prepare('SELECT status, COUNT(*) as count FROM feedback f' + filter + ' GROUP BY status').bind(...params),
			env.DB.prepare('SELECT is_issue, COUNT(*) as count FROM feedback f' + filter + ' GROUP BY is_issue').bind(...params)
		]);

		const total = (results[0].results[0] as any).count || 0;
		const sourceDistribution = results[1].results;
		const sentimentResults = results[2].results as Array<{ sentiment: string; count: number }>;
		const urgencyDistribution = results[3].results;
		const productDistribution = results[4].results;
		const feedbackTypeDistribution = results[5].results;
		const statusDistribution = results[6].results;
		const issueDistribution = results[7].results;

		// Calculate sentiment percentages for the frontend
		const totalClassified = sentimentResults.reduce((sum, r) => sum + r.count, 0);
		const sentimentDistribution = sentimentResults.map(r => ({
			...r,
			percentage: totalClassified > 0 ? Math.round((r.count / totalClassified) * 100) : 0
		}));

		return new Response(
			JSON.stringify({
				total,
				sourceDistribution,
				sentimentDistribution,
				urgencyDistribution,
				productDistribution,
				feedbackTypeDistribution,
				statusDistribution,
				issueDistribution
			}),
			{
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json',
				},
			}
		);
	} catch (error) {
		console.error('Get metrics error:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to fetch metrics',
				message: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json',
				},
			}
		);
	}
}

/**
 * Classify all feedback items using AI
 */
async function classifyAllFeedback(env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	try {
		console.log('Starting batch classification process...');

		// Get all feedback items
		const feedbackResult = await env.DB.prepare('SELECT id, content FROM feedback').all<{
			id: number;
			content: string;
		}>();

		const feedbackItems = feedbackResult.results || [];
		console.log(`Found ${feedbackItems.length} feedback items to classify`);

		// Batch classify all items (only 6 AI calls total!)
		const result = await batchClassifyFeedback(feedbackItems, env.DB, env.AI);

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Classification complete',
				classified: result.classified,
				failed: result.failed,
				total: feedbackItems.length,
			}),
			{
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json',
				},
			}
		);
	} catch (error) {
		console.error('Classification error:', error);
		return new Response(
			JSON.stringify({
				success: false,
				error: 'Failed to classify feedback',
				message: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json',
				},
			}
		);
	}
}

/**
 * Get executive summary for PM dashboard
 */
async function getExecutiveSummary(env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	try {
		// Fetch prioritized metrics (last 7 days, last 30 days)
		const now = new Date();
		const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
		const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

		// Use prepareMetricsForSummary to fetch data for different windows
		const [metrics7d, metrics30d, allMetrics, latestCriticalItems] = await Promise.all([
			prepareMetricsForSummary(env.DB, sevenDaysAgo),
			prepareMetricsForSummary(env.DB, thirtyDaysAgo),
			prepareMetricsForSummary(env.DB),
			getLatestCriticalFeedback(env.DB)
		]);

		// Generate summary prioritizing recent data
		const summary = await generateExecutiveSummary({
			recent7d: metrics7d,
			recent30d: metrics30d,
			allTime: allMetrics,
			latestCriticalItems: latestCriticalItems
		}, env.AI);

		return new Response(
			JSON.stringify({
				summary,
				metrics: allMetrics,
				recentMetrics: {
					'7d': metrics7d,
					'30d': metrics30d
				}
			}),
			{
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json',
				},
			}
		);
	} catch (error) {
		console.error('Executive summary error:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to generate executive summary',
				message: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json',
				},
			}
		);
	}
}

/**
 * Get trend data for dashboard charts
 */
async function getTrends(env: Env, url: URL, corsHeaders: Record<string, string>): Promise<Response> {
	try {
		const startDate = url.searchParams.get('startDate') || undefined;
		const endDate = url.searchParams.get('endDate') || undefined;

		const trendData = await getTrendDataForSummary(env.DB, startDate, endDate);

		return new Response(JSON.stringify(trendData), {
			headers: {
				...corsHeaders,
				'Content-Type': 'application/json',
			},
		});
	} catch (error) {
		console.error('Trend data error:', error);
		return new Response(
			JSON.stringify({ error: 'Failed to fetch trend data' }),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	}
}

/**
 * Update feedback status (resolved/unresolved)
 */
async function updateFeedbackStatus(env: Env, id: string, request: Request, corsHeaders: Record<string, string>): Promise<Response> {
	try {
		const { status } = await request.json() as { status: string };

		if (!['resolved', 'unresolved'].includes(status)) {
			return new Response(JSON.stringify({ error: 'Invalid status' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		await env.DB.prepare('UPDATE feedback SET status = ? WHERE id = ?')
			.bind(status, id)
			.run();

		return new Response(JSON.stringify({ success: true, status }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Update failed' }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
}

/**
 * Update feedback issue flag (formal issue or not)
 */
async function updateFeedbackIssue(env: Env, id: string, request: Request, corsHeaders: Record<string, string>): Promise<Response> {
	try {
		const { isIssue } = await request.json() as { isIssue: boolean };

		await env.DB.prepare('UPDATE feedback SET is_issue = ? WHERE id = ?')
			.bind(isIssue ? 1 : 0, id)
			.run();

		return new Response(JSON.stringify({ success: true, isIssue }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Update failed' }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
}
