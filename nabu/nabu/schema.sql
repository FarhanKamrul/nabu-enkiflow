-- Feedback table: stores raw feedback from all sources
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL CHECK(source IN ('discord', 'github', 'twitter', 'support')),
  content TEXT NOT NULL,
  author TEXT,
  product TEXT, -- Only filled for support tickets, empty for unstructured sources
  timestamp TEXT NOT NULL, -- ISO 8601 format
  status TEXT DEFAULT 'unresolved' CHECK(status IN ('unresolved', 'resolved')),
  is_issue INTEGER DEFAULT 0 CHECK(is_issue IN (0, 1)),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Classifications table: stores AI-generated classifications
CREATE TABLE IF NOT EXISTS classifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feedback_id INTEGER NOT NULL,
  sentiment TEXT CHECK(sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_confidence REAL,
  urgency TEXT CHECK(urgency IN ('critical', 'high', 'medium', 'low')),
  urgency_confidence REAL,
  product_detected TEXT, -- AI-detected product for non-support sources
  product_confidence REAL,
  feedback_type TEXT CHECK(feedback_type IN ('bug', 'feature_request', 'documentation', 'performance', 'pricing')),
  feedback_type_confidence REAL,
  churn_risk TEXT CHECK(churn_risk IN ('high', 'medium', 'low')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
);

-- Indexes for fast filtering and querying
CREATE INDEX IF NOT EXISTS idx_feedback_source ON feedback(source);
CREATE INDEX IF NOT EXISTS idx_feedback_timestamp ON feedback(timestamp);
CREATE INDEX IF NOT EXISTS idx_feedback_product ON feedback(product);
CREATE INDEX IF NOT EXISTS idx_classifications_sentiment ON classifications(sentiment);
CREATE INDEX IF NOT EXISTS idx_classifications_urgency ON classifications(urgency);
CREATE INDEX IF NOT EXISTS idx_classifications_feedback_type ON classifications(feedback_type);
CREATE INDEX IF NOT EXISTS idx_classifications_churn_risk ON classifications(churn_risk);
CREATE INDEX IF NOT EXISTS idx_classifications_feedback_id ON classifications(feedback_id);
