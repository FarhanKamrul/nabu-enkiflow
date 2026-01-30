# Cloudflare Product Friction Log

This log documents the developer experience (DX) and technical hurdles encountered while building the "Nabu" feedback aggregation system on the Cloudflare Developer Platform.

---

● **Title**: Inconsistent Model Documentation in llms.txt  
● **Problem**: The `llms.txt` documentation provided in Cloudflare repositories and guides did not list the "Meta Llama 3.1 8B Instruct" model, which was only discovered via the public Models Explorer. This slowed down planning as I initially targeted older, less capable models.  
● **Suggestion**: Auto-generate the `llms.txt` file from the production model registry to ensure LLM-assisted coding tools and developers always have the most up-to-date information on available models. Or more useful would be to have it embedded in as a ```llms.md``` file in the repository.

---

● **Title**: Opaque Usage Limits for LLMs  
● **Problem**: Tracking token usage and context window limits per request is difficult during development. Attempting to process large batches of feedback items (e.g., 100 at once) caused silent failures or timeouts without clear metrics on how close we were to the limits.  
● **Suggestion**: Provide real-time "Token Usage" or "Percent of Context Window" status in the Wrangler console or Workers dashboard logs to help developers tune their batch sizes and prompt complexity.

---

● **Title**: Slow "Deploy & Verify" Cycle for Assets  
● **Problem**: Running a full `wrangler deploy` for every small change in frontend assets or API logic is time-consuming. This increases the friction of the feedback loop when troubleshooting UI presentation or API response data.  
● **Suggestion**: Enhance `wrangler dev --remote` with automatic static asset hot-reloading (similar to Vite's HMR), allowing developers to see UI changes instantly on the remote worker without a full deployment.

---

● **Title**: Blocking CLI Prompts in Automation  
● **Problem**: `wrangler d1 execute` forces an interactive `Ok to proceed? (Y/n)` prompt for schema updates. This slows down developers and can break headless agentic flows or CI/CD pipelines if the `--yes` flag isn't immediately obvious.  
● **Suggestion**: Implement a more obvious "auto-approve" flag and perhaps a non-interactive mode as a standard across all Wrangler CLI commands to support automated environments better.

---

● **Title**: Non-Obvious Query Batching in D1  
● **Problem**: Sequential `await db.prepare().all()` calls result in multiple network round-trips, which degrades dashboard performance. It is not immediately clear from the basic documentation that `db.batch()` is the required pattern for performance-critical analytics.  
● **Suggestion**: Add a "Performance Tip" in the Wrangler console if it detects multiple non-batched SQL statements being sent to the same D1 instance in a short window, prompting the developer to use the batching API.
