/**
 * Mock data generator for feedback aggregation system
 * Generates 100 hardcoded feedback items with normally distributed timestamps
 */

export interface FeedbackItem {
  source: 'discord' | 'github' | 'twitter' | 'support';
  content: string;
  author: string;
  product?: string; // Only for support tickets
  timestamp: string; // ISO 8601 format
}

/**
 * Generates a timestamp using normal distribution throughout the year
 * Uses Box-Muller transform for Gaussian distribution
 * @param mean - Center point (0.5 = mid-year)
 * @param stdDev - Standard deviation (0.15 = ~2 months spread)
 */
export function generateNormalTimestamp(mean: number = 0.5, stdDev: number = 0.15): string {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  // Convert to 0-1 range and clamp
  let normalized = mean + z0 * stdDev;
  normalized = Math.max(0, Math.min(1, normalized));

  // Convert to date in 2025
  const startOfYear = new Date('2025-01-01T00:00:00Z').getTime();
  const endOfYear = new Date('2025-12-31T23:59:59Z').getTime();
  const timestamp = startOfYear + normalized * (endOfYear - startOfYear);

  return new Date(timestamp).toISOString();
}

/**
 * 100 hardcoded feedback items across all sources
 */
export const MOCK_FEEDBACK: FeedbackItem[] = [
  // Discord feedback (25 items)
  {
    source: 'discord',
    content: 'D1 queries are timing out in production, need urgent fix!',
    author: 'dev_mike#1234',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'Workers AI is amazing! Just built a sentiment analyzer in 30 minutes.',
    author: 'sarah_codes#5678',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'KV storage is super fast but the pricing seems high for our use case',
    author: 'startup_founder#9012',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'R2 documentation is confusing, especially the migration guide from S3',
    author: 'cloud_eng#3456',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'Workflows are game-changing for our async processing needs',
    author: 'backend_dev#7890',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'Getting random 500 errors with Workers AI embeddings endpoint',
    author: 'ml_engineer#2345',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'Love the new Hyperdrive feature, connection pooling works great',
    author: 'db_admin#6789',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'D1 needs better support for complex joins and subqueries',
    author: 'fullstack_dev#0123',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'Workers deployment is so much faster than our old setup',
    author: 'devops_lead#4567',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'Can we get more AI models? Need GPT-4 level performance',
    author: 'ai_researcher#8901',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'KV consistency issues causing bugs in our session management',
    author: 'security_eng#2346',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'R2 upload speeds are incredible, way better than S3',
    author: 'media_dev#6780',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'Workflows timeout handling needs improvement',
    author: 'system_arch#0124',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'Workers AI pricing is very competitive, great value',
    author: 'cto_startup#4568',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'D1 migrations are painful, need better tooling',
    author: 'backend_lead#8902',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'Vectorize search quality is excellent for our RAG application',
    author: 'ml_ops#2347',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'Workers cold start times are negligible, impressive',
    author: 'performance_eng#6781',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'Need better error messages from D1, debugging is hard',
    author: 'junior_dev#0125',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'KV global replication is perfect for our multi-region app',
    author: 'distributed_sys#4569',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'R2 bucket policies are confusing compared to AWS',
    author: 'cloud_migration#8903',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'Workers AI Llama model quality is surprisingly good',
    author: 'nlp_engineer#2348',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'Workflows dashboard needs better visualization of step progress',
    author: 'product_eng#6782',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'D1 backup and restore process is too manual',
    author: 'data_eng#0126',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'Workers platform is the future of serverless, no doubt',
    author: 'tech_evangelist#4570',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'discord',
    content: 'KV write performance degraded after scaling to 1M keys',
    author: 'scale_eng#8904',
    timestamp: generateNormalTimestamp()
  },

  // GitHub issues (25 items)
  {
    source: 'github',
    content: 'Bug: D1 prepared statements leak memory over time',
    author: 'github_user_42',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'Feature request: Add TypeScript types for Workers AI responses',
    author: 'typescript_fan',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'KV list operation returns inconsistent results with pagination',
    author: 'bug_hunter_99',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'R2 multipart upload fails silently for files > 5GB',
    author: 'storage_dev',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'Workflows: Add support for parallel step execution',
    author: 'async_lover',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'Workers AI embeddings return different dimensions randomly',
    author: 'ml_debugger',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'D1 transaction rollback doesn\'t work as expected',
    author: 'db_expert',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'Feature: Add batch operations support to KV',
    author: 'performance_nerd',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'R2 CORS configuration is not applying correctly',
    author: 'frontend_dev_23',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'Workflows retry logic needs exponential backoff option',
    author: 'reliability_eng',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'Workers AI rate limiting is too aggressive on free tier',
    author: 'indie_hacker',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'D1 query planner chooses wrong index for complex queries',
    author: 'sql_optimizer',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'KV metadata size limit is too restrictive',
    author: 'data_architect',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'R2 lifecycle policies documentation is outdated',
    author: 'docs_contributor',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'Workflows: Support for conditional branching in steps',
    author: 'orchestration_dev',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'Workers AI streaming responses cut off prematurely',
    author: 'streaming_expert',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'D1 foreign key constraints not enforced properly',
    author: 'integrity_checker',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'Feature: Add KV namespace cloning for staging environments',
    author: 'devops_automation',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'R2 presigned URLs expire earlier than configured',
    author: 'security_researcher',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'Workflows state persistence fails under high concurrency',
    author: 'stress_tester',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'Workers AI model versioning is unclear in documentation',
    author: 'version_control_fan',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'D1 EXPLAIN QUERY PLAN output is not detailed enough',
    author: 'performance_analyst',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'KV bulk delete operation would be very useful',
    author: 'cleanup_automation',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'R2 bucket replication between regions needed',
    author: 'geo_distributed',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'github',
    content: 'Workflows monitoring and alerting integration missing',
    author: 'observability_eng',
    timestamp: generateNormalTimestamp()
  },

  // Twitter mentions (25 items)
  {
    source: 'twitter',
    content: '@cloudflare D1 is a game changer for edge databases! 🚀',
    author: '@tech_influencer',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: 'Just tried Workers AI and I\'m blown away by the speed',
    author: '@ai_enthusiast',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: 'Why is @cloudflare KV so expensive? Considering alternatives',
    author: '@cost_conscious_dev',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: 'R2 storage pricing beats AWS S3 hands down 💰',
    author: '@cloud_economist',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: 'Workflows make complex orchestration so simple #cloudflare',
    author: '@serverless_advocate',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: '@cloudflare Workers AI keeps timing out on my requests 😤',
    author: '@frustrated_builder',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: 'D1 SQL compatibility is impressive, migration was smooth',
    author: '@database_migrator',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: 'KV global distribution is perfect for our CDN use case',
    author: '@edge_computing_pro',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: 'R2 API is so similar to S3, made switching easy',
    author: '@pragmatic_dev',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: 'Workflows pricing model is confusing, need clarification',
    author: '@billing_confused',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: '@cloudflare Workers AI embeddings quality is top-notch',
    author: '@ml_practitioner',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: 'D1 needs better monitoring and observability tools',
    author: '@sre_engineer',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: 'KV is blazing fast but docs could be more beginner-friendly',
    author: '@learning_to_code',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: 'R2 just saved us $10k/month in storage costs! 🎉',
    author: '@startup_cfo',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: 'Workflows dashboard UX needs improvement @cloudflare',
    author: '@ux_designer',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: 'Workers AI Llama 3.1 responses are surprisingly coherent',
    author: '@llm_tester',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: 'D1 replication lag is causing issues in our app',
    author: '@realtime_dev',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: 'KV TTL feature is exactly what we needed for caching',
    author: '@cache_optimizer',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: '@cloudflare R2 upload speeds are insane compared to competitors',
    author: '@speed_demon',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: 'Workflows error handling could be more granular',
    author: '@error_handler',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: 'Workers AI free tier is generous, great for prototyping',
    author: '@prototype_builder',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: 'D1 import/export tools are lacking, need CSV support',
    author: '@data_importer',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: 'KV consistency guarantees are perfect for our use case',
    author: '@distributed_systems',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: 'R2 CDN integration is seamless #cloudflare',
    author: '@cdn_specialist',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'twitter',
    content: '@cloudflare Workflows + D1 = perfect combo for our workflow',
    author: '@full_stack_builder',
    timestamp: generateNormalTimestamp()
  },

  // Support tickets (25 items) - these have product field filled
  {
    source: 'support',
    content: 'Production D1 database is completely down, all queries failing with 503 errors',
    author: 'enterprise_customer_1',
    product: 'D1',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'Workers AI inference is returning malformed JSON responses',
    author: 'customer_support_42',
    product: 'Workers AI',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'KV namespace accidentally deleted, need help with recovery',
    author: 'panicked_admin',
    product: 'KV',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'R2 bucket shows incorrect storage usage in dashboard',
    author: 'billing_department',
    product: 'R2',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'Workflows execution stuck in pending state for 2 hours',
    author: 'operations_team',
    product: 'Workflows',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'D1 query performance degraded significantly after schema change',
    author: 'performance_team',
    product: 'D1',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'Workers AI rate limits not matching our paid plan tier',
    author: 'account_manager_5',
    product: 'Workers AI',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'KV write operations failing intermittently in eu-west region',
    author: 'regional_ops',
    product: 'KV',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'R2 CORS headers not being applied despite correct configuration',
    author: 'web_team_lead',
    product: 'R2',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'Workflows billing showing unexpected charges for failed executions',
    author: 'finance_controller',
    product: 'Workflows',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'D1 connection pool exhausted, need to increase limits',
    author: 'scaling_team',
    product: 'D1',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'Workers AI model outputs are inconsistent between requests',
    author: 'qa_engineer_7',
    product: 'Workers AI',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'KV list operation timing out with large namespaces',
    author: 'backend_ops',
    product: 'KV',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'R2 presigned URL generation failing with cryptic error',
    author: 'integration_dev',
    product: 'R2',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'Workflows step retry count not respecting configured maximum',
    author: 'reliability_team',
    product: 'Workflows',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'D1 backup restoration failed, need immediate assistance',
    author: 'disaster_recovery',
    product: 'D1',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'Workers AI embeddings dimension mismatch breaking our pipeline',
    author: 'ml_pipeline_team',
    product: 'Workers AI',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'KV metadata update not propagating to all edge locations',
    author: 'global_ops',
    product: 'KV',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'R2 bucket policy changes taking too long to apply',
    author: 'security_ops',
    product: 'R2',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'Workflows state size limit exceeded, need guidance on optimization',
    author: 'architecture_team',
    product: 'Workflows',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'D1 migration script failing on large tables',
    author: 'migration_specialist',
    product: 'D1',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'Workers AI request latency spiking during peak hours',
    author: 'monitoring_team',
    product: 'Workers AI',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'KV expiration not working as documented',
    author: 'cache_team',
    product: 'KV',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'R2 multipart upload parts limit too restrictive',
    author: 'media_processing',
    product: 'R2',
    timestamp: generateNormalTimestamp()
  },
  {
    source: 'support',
    content: 'Workflows dashboard not showing recent executions',
    author: 'ops_dashboard_user',
    product: 'Workflows',
    timestamp: generateNormalTimestamp()
  },
];

/**
 * Generates an expanded dataset of 1100+ items
 */
export function generateExpandedFeedback(baseItems: FeedbackItem[], targetCount: number = 1100): FeedbackItem[] {
  const expanded: FeedbackItem[] = [...baseItems];
  const authors = ['dev_pro', 'cloud_master', 'beta_tester', 'heavy_user', 'newbie_dev', 'stack_overflow_surfer', 'github_wizard'];

  while (expanded.length < targetCount) {
    const base = baseItems[Math.floor(Math.random() * baseItems.length)];
    // Add some variation to author and timestamp distribution
    const mean = Math.random() < 0.3 ? 0.8 : (Math.random() < 0.6 ? 0.5 : 0.2); // Clusters around recent, mid, and early

    expanded.push({
      ...base,
      author: `${authors[Math.floor(Math.random() * authors.length)]}_${Math.floor(Math.random() * 10000)}`,
      timestamp: generateNormalTimestamp(mean, 0.2)
    });
  }

  return expanded;
}

export const EXPANDED_FEEDBACK = generateExpandedFeedback(MOCK_FEEDBACK, 1100);
