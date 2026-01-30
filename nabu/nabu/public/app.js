// API Base URL
const API_BASE = window.location.origin;

// State
let allFeedback = [];
let filteredFeedback = [];
let currentPage = 1;
const itemsPerPage = 20;
let charts = {};
let currentDays = 90; // Default time window

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('refreshBtn').addEventListener('click', loadDashboard);
    document.getElementById('sourceFilter').addEventListener('change', reloadAll);
    document.getElementById('sentimentFilter').addEventListener('change', reloadAll);
    document.getElementById('statusFilter').addEventListener('change', reloadAll);
    document.getElementById('sortFilter').addEventListener('change', reloadAll);
    document.getElementById('issueToggle').addEventListener('change', reloadAll);
    document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('prevBtn').addEventListener('click', () => changePage(-1));
    document.getElementById('nextBtn').addEventListener('click', () => changePage(1));

    // Date presets
    document.getElementById('datePresets').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn) {
            const days = btn.dataset.days;
            // Reset all buttons to inactive state
            document.querySelectorAll('#datePresets button').forEach(b => {
                b.className = 'px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 text-slate-400 hover:text-white hover:bg-slate-800';
            });
            // Set active button state
            btn.className = 'px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 bg-cloudflare-orange text-white shadow-lg shadow-cloudflare-orange/20 active';

            currentDays = days === 'all' ? 0 : parseInt(days);
            loadDashboard();
        }
    });
}

function reloadAll() {
    currentPage = 1;
    loadDashboard();
}

// Get dates for current window
function getDateRange() {
    if (currentDays === 0) return {};
    const now = new Date();
    const start = new Date(now.getTime() - currentDays * 24 * 60 * 60 * 1000);
    return {
        startDate: start.toISOString(),
        endDate: now.toISOString()
    };
}

// Load all dashboard data
async function loadDashboard() {
    try {
        const { startDate, endDate } = getDateRange();
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const source = document.getElementById('sourceFilter').value;
        const sentiment = document.getElementById('sentimentFilter').value;
        const status = document.getElementById('statusFilter').value;
        const sort = document.getElementById('sortFilter').value;
        const isIssue = document.getElementById('issueToggle').checked;

        if (source) params.append('source', source);
        if (sentiment) params.append('sentiment', sentiment);
        if (status) params.append('status', status);
        if (isIssue) params.append('is_issue', '1');
        if (sort) params.append('sort', sort);

        // Load in parallel
        const [summary, metrics, feedback, trends] = await Promise.all([
            fetch(`${API_BASE}/api/summary`).then(r => r.json()),
            fetch(`${API_BASE}/api/metrics?${params.toString()}`).then(r => r.json()),
            fetch(`${API_BASE}/api/feedback?${params.toString()}`).then(r => r.json()),
            fetch(`${API_BASE}/api/trends?${params.toString()}`).then(r => r.json())
        ]);

        renderExecutiveSummary(summary);
        renderMetrics(metrics);
        renderCharts(metrics);
        renderTrendChart(trends);

        allFeedback = feedback;
        applyFilters(false); // Don't reset to page 1 if just data refresh
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        showError('Failed to load dashboard data. Please try again.');
    }
}

// Render executive summary
function renderExecutiveSummary(data) {
    const summaryText = document.getElementById('summaryText');
    summaryText.textContent = data.summary || 'No summary available.';
}

// Render metrics cards
function renderMetrics(data) {
    document.getElementById('totalCount').textContent = data.total || 0;

    const pos = data.sentimentDistribution?.find(s => s.sentiment === 'positive');
    const neg = data.sentimentDistribution?.find(s => s.sentiment === 'negative');
    const critical = data.urgencyDistribution?.find(u => u.urgency === 'critical');

    document.getElementById('positivePercent').textContent = `${pos?.percentage || 0}%`;
    document.getElementById('negativePercent').textContent = `${neg?.percentage || 0}%`;
    document.getElementById('criticalCount').textContent = critical?.count || 0;
}

// Render charts
function renderCharts(data) {
    renderSentimentChart(data.sentimentDistribution || []);
    renderThemesChart(data.feedbackTypeDistribution || []);
}

// Trend chart rendering
function renderTrendChart(trendData) {
    const ctx = document.getElementById('trendChart');
    if (charts.trend) charts.trend.destroy();

    charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trendData.map(d => d.date),
            datasets: [
                {
                    label: 'Total Feedback',
                    data: trendData.map(d => d.total),
                    borderColor: '#F38020',
                    backgroundColor: 'rgba(243, 128, 32, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Critical Issues',
                    data: trendData.map(d => d.critical),
                    borderColor: '#ef4444',
                    borderDash: [5, 5],
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#A0AEC0' }
                }
            },
            scales: {
                x: {
                    grid: { color: '#2D3748' },
                    ticks: { color: '#A0AEC0' }
                },
                y: {
                    grid: { color: '#2D3748' },
                    ticks: { color: '#A0AEC0', stepSize: 1 },
                    beginAtZero: true
                }
            }
        }
    });
}

// Sentiment pie chart
function renderSentimentChart(sentimentData) {
    const ctx = document.getElementById('sentimentChart');
    if (charts.sentiment) charts.sentiment.destroy();

    const colors = { positive: '#10b981', neutral: '#f59e0b', negative: '#ef4444' };

    charts.sentiment = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: sentimentData.map(s => s.sentiment.charAt(0).toUpperCase() + s.sentiment.slice(1)),
            datasets: [{
                data: sentimentData.map(s => s.count),
                backgroundColor: sentimentData.map(s => colors[s.sentiment] || '#6b7280'),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#A0AEC0', padding: 15, font: { size: 12 } }
                }
            }
        }
    });
}

// Themes bar chart
function renderThemesChart(themesData) {
    const ctx = document.getElementById('themesChart');
    if (charts.themes) charts.themes.destroy();

    charts.themes = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: themesData.map(t => formatThemeName(t.feedback_type)),
            datasets: [{
                label: 'Count',
                data: themesData.map(t => t.count),
                backgroundColor: '#F38020',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: '#2D3748' }, ticks: { color: '#A0AEC0' } },
                y: { grid: { display: false }, ticks: { color: '#A0AEC0' } }
            }
        }
    });
}

// Apply filters (frontend search only, other filters are backend-driven now)
function applyFilters(resetPage = true) {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();

    filteredFeedback = allFeedback.filter(item => {
        return !searchQuery || item.content.toLowerCase().includes(searchQuery);
    });

    if (resetPage) currentPage = 1;
    renderFeedbackList();
}
// Render feedback list
function renderFeedbackList() {
    const container = document.getElementById('feedbackList');
    const countEl = document.getElementById('feedbackCount');

    countEl.textContent = `${filteredFeedback.length} items`;

    if (filteredFeedback.length === 0) {
        container.innerHTML = '<div class="flex items-center justify-center py-20 bg-[#1A1F2E] rounded-xl border border-dashed border-slate-700 text-slate-500 font-medium">No feedback items found matching your filters.</div>';
        document.getElementById('pagination').style.display = 'none';
        return;
    }

    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const pageItems = filteredFeedback.slice(startIdx, endIdx);

    container.innerHTML = pageItems.map(item => createFeedbackCard(item)).join('');
    lucide.createIcons();

    // Attach button listeners after rendering
    container.querySelectorAll('.btn-status').forEach(btn => {
        btn.onclick = (e) => toggleStatus(e.target.dataset.id, e.target.dataset.status);
    });
    container.querySelectorAll('.btn-issue').forEach(btn => {
        btn.onclick = (e) => toggleIssue(e.target.dataset.id, e.target.dataset.issue === '1');
    });

    const totalPages = Math.ceil(filteredFeedback.length / itemsPerPage);
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages;
    document.getElementById('pagination').style.display = totalPages > 1 ? 'flex' : 'none';
}

// Create feedback card HTML
function createFeedbackCard(item) {
    const sentiment = item.sentiment || 'neutral';
    const urgency = (item.urgency || 'medium').toLowerCase();
    const product = (item.product_detected || item.product || 'Unknown').trim();
    const isResolved = item.status === 'resolved';
    const isIssue = item.is_issue === 1;

    // Color Maps
    const sourceColors = {
        discord: 'bg-[#5865F2]',
        github: 'bg-[#24292e]',
        twitter: 'bg-[#1DA1F2]',
        support: 'bg-[#10b981]'
    };

    const sentimentColors = {
        positive: 'bg-emerald-500',
        neutral: 'bg-amber-500',
        negative: 'bg-rose-500'
    };

    const productColors = {
        'D1': 'bg-blue-500/10 text-blue-400 border-blue-500/50 hover:bg-blue-500/20',
        'Workers AI': 'bg-purple-500/10 text-purple-400 border-purple-500/50 hover:bg-purple-500/20',
        'KV': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/20',
        'R2': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/20',
        'Workflows': 'bg-amber-500/10 text-amber-400 border-amber-500/50 hover:bg-amber-500/20',
        'Pages': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/50 hover:bg-indigo-500/20',
        'Stream': 'bg-pink-500/10 text-pink-400 border-pink-500/50 hover:bg-pink-500/20'
    };

    const urgencyColors = {
        critical: 'bg-rose-500/20 text-rose-500 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse',
        high: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
        medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        low: 'bg-slate-500/10 text-slate-400 border-slate-700/50'
    };

    const typeColors = {
        bug: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        pricing: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        performance: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        ui_ux: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        feature_request: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
    };

    const statusClasses = isResolved
        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50'
        : 'bg-rose-500/10 text-rose-500 border-rose-500/50';

    return `
        <div class="bg-[#1A1F2E] border border-slate-700 rounded-xl p-6 transition-all duration-300 hover:border-cloudflare-orange hover:translate-x-1 cursor-pointer shadow-md ${isResolved ? 'opacity-60 grayscale-[0.2]' : ''}">
            <div class="flex justify-between items-start mb-4">
                <div class="flex flex-wrap gap-2 items-center">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${sourceColors[item.source] || 'bg-slate-500'}">${item.source}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${sentimentColors[sentiment]}">${sentiment}</span>
                    <span class="px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-wider shadow-sm ${statusClasses}">${item.status}</span>
                    ${isIssue ? '<span class="px-2 py-0.5 bg-cloudflare-orange/20 border border-cloudflare-orange/50 text-cloudflare-orange rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><i data-lucide="external-link" class="w-2.5 h-2.5"></i>Jira Issue</span>' : ''}
                </div>
                <span class="text-[11px] font-bold text-slate-500 uppercase tracking-widest">${formatTimestamp(item.timestamp)}</span>
            </div>
            <p class="text-slate-300 text-base leading-relaxed mb-6">${escapeHtml(item.content)}</p>
            <div class="flex flex-wrap gap-2 mb-6">
                <span class="px-2.5 py-1 rounded text-xs font-semibold border transition-all duration-200 flex items-center gap-1.5 ${productColors[product] || 'bg-slate-500/10 text-slate-400 border-slate-700'}">
                    <i data-lucide="package" class="w-3.5 h-3.5"></i>
                    ${product}
                </span>
                <span class="px-2.5 py-1 rounded text-xs font-semibold border transition-all duration-200 flex items-center gap-1.5 ${typeColors[item.feedback_type] || 'bg-slate-500/10 text-slate-400 border-slate-700'}">
                    <i data-lucide="tag" class="w-3.5 h-3.5"></i>
                    ${formatThemeName(item.feedback_type)}
                </span>
                <span class="px-2.5 py-1 rounded text-xs font-semibold border transition-all duration-200 flex items-center gap-1.5 ${urgencyColors[urgency] || 'bg-slate-500/10 text-slate-400 border-slate-700'}">
                    <i data-lucide="zap" class="w-3.5 h-3.5"></i>
                    ${urgency}
                </span>
                ${item.author ? `
                <span class="px-2.5 py-1 bg-slate-500/10 border border-slate-700/50 rounded text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                    <i data-lucide="user" class="w-3.5 h-3.5"></i>
                    ${escapeHtml(item.author)}
                </span>` : ''}
            </div>
            <div class="flex justify-between items-center pt-4 border-t border-slate-700/50">
                <div class="flex gap-2">
                    <button class="px-4 py-1.5 bg-[#242B3D] border border-slate-700 text-slate-400 rounded font-bold text-[11px] uppercase tracking-wider hover:text-white hover:border-cloudflare-orange transition-all duration-200 btn-status flex items-center gap-1.5" data-id="${item.id}" data-status="${item.status}">
                        <i data-lucide="${isResolved ? 'rotate-ccw' : 'check-circle'}" class="w-3.5 h-3.5"></i>
                        ${isResolved ? 'Reopen' : 'Resolve'}
                    </button>
                    <button class="px-4 py-1.5 bg-[#242B3D] border border-slate-700 text-slate-400 rounded font-bold text-[11px] uppercase tracking-wider hover:text-white hover:border-cloudflare-orange transition-all duration-200 btn-issue flex items-center gap-1.5 ${isIssue ? 'bg-cloudflare-orange/20 border-cloudflare-orange text-cloudflare-orange' : ''}" data-id="${item.id}" data-issue="${isIssue ? 1 : 0}">
                        <i data-lucide="${isIssue ? 'alert-triangle' : 'flag'}" class="w-3.5 h-3.5"></i>
                        ${isIssue ? 'Remove Issue' : 'Mark as Issue'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'resolved' ? 'unresolved' : 'resolved';
    try {
        const res = await fetch(`${API_BASE}/api/feedback/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) loadDashboard();
    } catch (e) { console.error(e); }
}

async function toggleIssue(id, currentIsIssue) {
    const newIssue = !currentIsIssue;
    try {
        const res = await fetch(`${API_BASE}/api/feedback/${id}/issue`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isIssue: newIssue })
        });
        if (res.ok) loadDashboard();
    } catch (e) { console.error(e); }
}

function changePage(delta) {
    currentPage += delta;
    renderFeedbackList();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatThemeName(theme) {
    if (!theme) return 'Unknown';
    return theme.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showError(message) {
    const summaryText = document.getElementById('summaryText');
    summaryText.innerHTML = `<span style="color: #ef4444;">⚠️ ${message}</span>`;
}
