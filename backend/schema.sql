CREATE TABLE IF NOT EXISTS portfolio_visits (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total INTEGER NOT NULL CHECK (total >= 0)
);

INSERT OR IGNORE INTO portfolio_visits (id, total) VALUES (1, 0);

CREATE TABLE IF NOT EXISTS contact_budget (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  hour INTEGER NOT NULL,
  requests INTEGER NOT NULL
);

INSERT OR IGNORE INTO contact_budget (id, hour, requests) VALUES (1, 0, 0);
