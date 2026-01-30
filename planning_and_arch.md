### User Stories

#### [USER STORY 1] As a PM, I want to view all feedback aggregated from multiple sources in one dashboard, so that I can quickly assess the overall volume and distribution of customer input.
Scenario-oriented (Given/When/Then):
1. Given I have feedback from at least 3 different sources (Discord, GitHub, Twitter, support tickets), When I access the dashboard, Then all feedback items should be displayed in a unified view regardless of their original source.
2. Given feedback items exist in the system, When the dashboard loads, Then I should see the total count of feedback items prominently displayed.
3. Given feedback is aggregated from multiple sources, When I view the dashboard, Then I should see a breakdown showing the count or percentage of feedback per source (e.g., Discord: 25, GitHub: 15, Twitter: 10).
4. Given the dashboard displays aggregated feedback, When I view the distribution visualization, Then feedback should be organized in a clear format (table, chart, or list) that allows me to compare volumes across sources at a glance.
5. Given there are more than 20 feedback items, When I scroll or navigate the dashboard, Then pagination or infinite scroll should allow me to access all feedback without performance degradation.

Rule-oriented (Checklist):
- [ ] Dashboard displays feedback from all configured sources (Discord, GitHub, Twitter, support tickets, email)
- [ ] Total feedback count is visible and accurate
- [ ] Source distribution is shown visually (chart, table, or summary cards)
- [ ] Each feedback item displays its source clearly (icon, label, or color coding)
- [ ] Dashboard loads within 3 seconds with mock dataset of 50-100 items
- [ ] No feedback items are missing or duplicated in the aggregated view

#### [USER STORY 2] As a PM, I want to see sentiment analysis (positive/neutral/negative) for each feedback item, so that I can identify critical issues requiring immediate attention.
Scenario-oriented (Given/When/Then):
1. Given a feedback item exists in the system, When I view it on the dashboard, Then it should display a sentiment label (positive, neutral, or negative) clearly associated with that item.
2. Given I access the dashboard, When sentiment analysis has been performed, Then each feedback item should show its sentiment classification without requiring additional clicks or actions.
3. Given feedback items have sentiment labels, When I view the aggregated dashboard, Then I should see a summary showing the total count or percentage of positive, neutral, and negative feedback.
4. Given negative sentiment feedback exists, When I view the dashboard, Then negative items should be visually distinguishable (through color coding, icons, or priority indicators) to quickly identify critical issues.
5. Given Workers AI performs sentiment analysis, When a feedback item is analyzed, Then the sentiment result should match the general tone of the feedback content with reasonable accuracy.
6. Given Database has sentiments and summary statistics, When the user loads the home screen, Then the top widget should give a two liner summary of important things to consider.

Rule-oriented (Checklist):
- [ ] Every feedback item displays one of three sentiment labels: positive, neutral, or negative
- [ ] Sentiment labels are visually distinct (e.g., green for positive, yellow for neutral, red for negative)
- [ ] Dashboard shows sentiment distribution summary (count or percentage for each category)
- [ ] Negative sentiment items are easily identifiable for prioritization
- [ ] Sentiment analysis uses Cloudflare Workers AI (Llama 3.2 1B)
- [ ] Sentiment classification completes within 2 seconds per feedback item


#### [USER STORY 3] As a PM, I want to filter feedback by source (Discord, GitHub, Twitter, support tickets), so that I can understand which channels generate the most valuable insights.
Acceptance Criteria:
Scenario-oriented (Given/When/Then):
1. Given feedback from multiple sources exists, When I select a source filter (e.g., "Discord"), Then only feedback items from that source should be displayed on the dashboard.
2. Given I have applied a source filter, When I view the filtered results, Then the feedback count and sentiment distribution should update to reflect only the selected source.
3. Given no source filter is applied, When I view the dashboard, Then all feedback from all sources should be displayed by default.
4. Given I have applied a source filter, When I click "Clear filter" or select "All sources", Then the dashboard should return to showing feedback from all sources.
5. Given I select multiple sources (if multi-select is supported), When the filter is applied, Then feedback from all selected sources should be displayed together.

Rule-oriented (Checklist):
- [ ] Filter controls are visible and accessible on the dashboard (dropdown, buttons, or checkboxes)
- [ ] All available sources are listed as filter options (Discord, GitHub, Twitter, support tickets, email)
- [ ] Applying a filter updates the dashboard view within 1 second
- [ ] Filtered view shows accurate count of feedback items for the selected source
- [ ] Sentiment distribution and other metrics recalculate based on filtered results
- [ ] Filter state persists during the session (optional: survives page refresh via URL parameters)
- [ ] Visual indicator shows which filter is currently active


#### [USER STORY 4] As a PM, I want to view aggregated metrics showing feedback themes and urgency scores, so that I can prioritize product roadmap decisions based on customer pain points.
Scenario-oriented (Given/When/Then):
1. Given feedback items have been analyzed, When I access the metrics dashboard, Then I should see aggregated themes or categories (e.g., "Documentation Issues," "Performance," "Feature Requests") with counts showing how many feedback items belong to each theme.
2. Given feedback items have urgency scores assigned, When I view the aggregated metrics, Then I should see the average or distribution of urgency scores (e.g., "High: 15 items, Medium: 30 items, Low: 10 items").
3. Given multiple themes exist, When I view the metrics dashboard, Then themes should be ranked or sorted by frequency or urgency to highlight the most critical pain points.
4. Given I want to prioritize roadmap decisions, When I view urgency metrics, Then I should see which themes have the highest average urgency scores to identify critical areas requiring immediate attention.
5. Given aggregated metrics are displayed, When I click on a theme or urgency level, Then the dashboard should filter or drill down to show the individual feedback items within that category.

Rule-oriented (Checklist):
- [ ] Dashboard displays at least 3-5 identified feedback themes with item counts
- [ ] Each feedback item has an urgency score (numeric scale, e.g., 1-10 or Low/Medium/High)
- [ ] Average urgency score is calculated and displayed for the overall dataset
- [ ] Urgency distribution is shown (count or percentage of high/medium/low urgency items)
- [ ] Themes are extracted using AI analysis or keyword matching from feedback content
- [ ] Metrics visualizations (charts, tables, or summary cards) are clear and scannable
- [ ] Top 3 themes by volume or urgency are highlighted or ranked
- [ ] Metrics update dynamically when filters (source, date, sentiment) are applied



#### [USER STORY 5] As a PM, I want to search feedback by keywords or semantic similarity, so that I can find related complaints and identify recurring patterns across different sources.
Scenario-oriented (Given/When/Then):
1. Given a feedback item exists in the system, When I view it on the dashboard, Then it should display a timestamp or date showing when the feedback was received or created.
2. Given feedback items have timestamps, When I view the dashboard, Then items should be sortable by date (newest first or oldest first) to identify recent feedback quickly.
3. Given feedback spans multiple days or weeks, When I view aggregated metrics, Then I should see a trend visualization (line chart, bar chart, or timeline) showing feedback volume over time.
4. Given I want to track issue escalation, When I filter by a specific theme or sentiment, Then the date-based trend should show whether that issue is increasing, decreasing, or stable over time.
5. Given feedback has timestamps, When I apply a date range filter (e.g., "Last 7 days," "Last 30 days"), Then only feedback within that time period should be displayed.

Rule-oriented (Checklist):
- [ ] Every feedback item displays a human-readable timestamp (e.g., "Jan 28, 2026" or "2 days ago")
- [ ] Feedback list is sortable by date (ascending/descending)
- [ ] Dashboard includes a time-based trend visualization showing feedback volume by day or week
- [ ] Date range filter is available (e.g., dropdown with "Last 7 days," "Last 30 days," "All time")
- [ ] Trend chart updates when filters (source, sentiment) are applied to show temporal patterns for specific categories
- [ ] Most recent feedback is highlighted or appears at the top by default
- [ ] Timestamps are stored in ISO 8601 format in the database for consistent querying

#### [USER STORY 6] As a PM, I want to see timestamp/date information for each feedback item, so that I can identify recent trends and track whether issues are escalating or resolving over time.
Scenario-oriented (Given/When/Then):
1. Given feedback items exist in the system, When I enter a keyword in the search box and submit, Then the dashboard should display only feedback items containing that keyword in their content.
2. Given I perform a keyword search, When results are displayed, Then the matching keyword should be highlighted within the feedback text for easy identification.
3. Given semantic search is enabled, When I search for a phrase (e.g., "slow performance"), Then the system should return feedback items with similar meaning (e.g., "takes too long to load," "laggy interface") even if exact keywords don't match.
4. Given search results are displayed, When I view the results, Then they should show the source, sentiment, urgency score, and timestamp for each matching feedback item.
5. Given no feedback matches my search query, When the search completes, Then the dashboard should display a clear "No results found" message with a suggestion to try different keywords.

Rule-oriented (Checklist):
- [ ] Search box is prominently placed and accessible on the dashboard
- [ ] Keyword search returns results within 2 seconds for datasets up to 100 items
- [ ] Search is case-insensitive and supports partial matching (at least 3 characters)
- [ ] Semantic search uses Cloudflare Workers AI embeddings or AI Search/Vectorize for similarity matching
- [ ] Search results can be further filtered by source, sentiment, or date
- [ ] Search query persists in the search box after results are displayed
- [ ] "Clear search" or "View all" option returns to unfiltered dashboard
- [ ] Related feedback items are grouped or ranked by relevance score in semantic search results


#### Rankings

1. USER STORY 1 - View all feedback aggregated from multiple sources
Foundation of the entire product; without unified feedback display, no other features have value.
2. USER STORY 2 - See sentiment analysis for each feedback item
Core value proposition; sentiment classification is what makes aggregated feedback actionable for PMs to identify critical issues.
3. USER STORY 4 - View aggregated metrics showing feedback themes and urgency scores
Transforms raw data into strategic insights; directly supports the "prioritize roadmap decisions" use case central to PM workflows.
4. USER STORY 3 - Filter feedback by source
Essential for analysis and troubleshooting; allows PMs to understand channel-specific patterns and validate findings within specific communities.
5. USER STORY 6 - See timestamp/date information for each feedback item
Enables trend analysis and temporal understanding; critical for tracking whether issues are escalating but less urgent than core aggregation/sentiment features.
6. USER STORY 5 - Search feedback by keywords or semantic similarity
Nice-to-have enhancement for deep investigation; valuable but not essential for initial prototype since filtering and browsing cover basic discovery needs.


All the first five ranked features are core to the given assignment. Semantic similarity + keyword search is a secondary task.


### Sentiment Analysis & Classification Architecture


#### Overview
The feedback aggregation system employs a hybrid semantic matching approach for multi-dimensional classification of customer feedback. Rather than relying solely on large language models (LLMs), we leverage efficient text embedding models to match feedback against predefined category labels, with selective LLM refinement for edge cases. This is something done within Cloudflare’s offerings.

#### Classification Dimensions
Each feedback item is classified across five key dimensions:
1. Product/Service: Identifies which Cloudflare product the feedback references (D1, Workers AI, KV, R2, Workflows, etc.)
2. Sentiment Polarity: Determines overall sentiment (positive, neutral, negative)
3. Urgency Level: Assesses time-sensitivity and business impact (critical, high, medium, low)
4. Feedback Type: Categorizes the nature of feedback (bug report, feature request, documentation issue, performance concern, pricing question)
5. Churn Risk (optional): Evaluates customer retention indicators (at-risk, satisfied, neutral)

#### Technical Implementation

##### Stage 1: Semantic Matching via Embeddings (Primary Classification)
Model Selection: Cloudflare Workers AI `@cf/baai/bge-base-en-v1.5` text embedding model
- Performance: Processed in chunks of 100 feedback items per AI call to optimize throughput.
- Output: 768-dimensional vector representation per text input.

##### Pre-compute Label Embeddings:
Label definitions are pre-computed using the same embedding model to create "anchor points" for each category (Sentiment, Urgency, Product, Feedback Type).

##### Runtime Classification:
1. Feedback items are converted to 768-dimension vectors.
2. Cosine similarity is calculated against all anchor labels for each category.
3. The highest scoring label is assigned as the raw prediction.

##### Dynamic Urgency Thresholding:
To ensure high-precision for critical items, a dynamic threshold (0.50) is applied in the retrieval layer.
- **Critical**: Assigned only if raw label is 'critical' AND confidence > 0.50.
- **High Fallback**: If raw label is 'critical' but confidence <= 0.50, it is downgraded to 'High' to prevent false alarms.
```typescript
async function refineCriticalFeedback(feedback: FeedbackItem, classifications: any, env: Env) {
  const prompt = `Analyze this customer feedback and validate the automated classification:

Feedback: "${feedback.content}"

Automated Classification:
- Product: ${classifications.products.label} (confidence: ${classifications.products.confidence})
- Sentiment: ${classifications.polarity.label} (confidence: ${classifications.polarity.confidence})
- Urgency: ${classifications.urgency.label} (confidence: ${classifications.urgency.confidence})

Provide:
1. Validation: Are these classifications accurate? (Yes/No + explanation)
2. Corrected classifications if wrong
3. Churn risk assessment (High/Medium/Low) with reasoning

Keep response under 150 words.`;

  const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200
  });
  
  return response;
}
```

##### Cost & Performance Optimization:
- Stage 1 processes 100% of feedback (~$0.01 per 10,000 items)
- Stage 2 invoked for ~5-10% of feedback (low-confidence or high-risk cases)
- Combined approach stays within Cloudflare Workers AI free tier limits (10,000 tokens/day for text generation)

##### Stage 3: Overall Sentiment Guidance Panel
Purpose: Generate executive summary for product managers highlighting key trends and priority areas.
Implementation:
```typescript
async function generateSentimentGuidance(aggregatedMetrics: AggregatedMetrics, env: Env) {
  const summaryPrompt = `You are a product analyst. Based on aggregated customer feedback data, write a concise 2-3 sentence executive summary for a product manager.

Data:
- Total feedback items: ${aggregatedMetrics.totalCount}
- Sentiment distribution: ${aggregatedMetrics.positivePercent}% positive, ${aggregatedMetrics.neutralPercent}% neutral, ${aggregatedMetrics.negativePercent}% negative
- Top 3 themes: ${aggregatedMetrics.topThemes.map(t => `${t.theme} (${t.count})`).join(', ')}
- Critical urgency items: ${aggregatedMetrics.criticalCount}
- Top affected products: ${aggregatedMetrics.topProducts.join(', ')}

Provide actionable insights focusing on:
1. Overall sentiment trend
2. Most critical issue requiring immediate attention
3. One positive highlight if applicable

Write in clear, professional language. Maximum 3 sentences.`;

  const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [{ role: 'user', content: summaryPrompt }],
    max_tokens: 150
  });
  
  return response.response;
}
```

##### Example Output:
"Customer sentiment is mixed (45% positive, 32% negative) with growing concerns about D1 database performance impacting 23 production deployments. Documentation feedback remains consistently positive (89%), indicating strong onboarding materials. Immediate attention required: D1 query timeout issues flagged as critical by 15 enterprise customers."
Dashboard Placement: Displayed in a prominent card at the top of the dashboard, above detailed metrics, providing immediate context before PMs drill into specifics.

##### Advantages of Hybrid Approach
1. Cost Efficiency: 95% of classifications use embeddings ($0.001/M tokens) vs. LLM generation ($0.10/M tokens)
2. Speed: Embedding-based classification completes in ~100-200ms vs. 1-2 seconds for LLM generation
3. Determinism: Identical feedback always produces identical similarity scores, enabling consistent categorization
4. Scalability: Can process 10,000+ feedback items daily within free tier limits
5. Accuracy: LLM refinement for edge cases ensures high-confidence results on complex inputs
Known Limitations
1. Sarcasm/Negation Handling: Embeddings may struggle with "not bad actually" (negated negative)
   - **Mitigation**: LLM refinement triggered for low-confidence sentiment scores
2. Multi-Product Feedback: Single feedback mentioning multiple products requires threshold tuning
   - **Mitigation**: Return top 2 products if second-highest similarity > 0.60
3. Label Quality Dependency: Classification accuracy directly correlates with label phrasing richness
   - **Mitigation**: Labels include synonyms, related terms, and contextual keywords
4. Complex Context Loss: Pure semantic matching lacks reasoning about relationships
   - **Example**: "I love Workers AI but the pricing makes it unusable for us" (positive product, negative pricing)
   - **Mitigation**: Multi-dimensional classification separates product, sentiment, and feedback type

##### Future Enhancements
1. Fine-tuned Embeddings: Train custom embedding model on domain-specific feedback corpus.
2. Dynamic Label Learning: Automatically discover new themes from high-frequency n-grams in unclassified feedback
3. Sentiment Trend Forecasting: Time-series analysis of sentiment trajectories to predict escalating issues before they become critical
4. Multi-lingual Support: Leverage Cloudflare's m2m100 translation model to analyze feedback in non-English languages


