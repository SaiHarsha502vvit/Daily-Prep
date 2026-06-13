-- CAP_C3 Test Analytics Dashboard Schema

CREATE TABLE IF NOT EXISTS runs (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    branch TEXT,
    commit_sha TEXT,
    workflow_name TEXT,
    run_number INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tests (
    id SERIAL PRIMARY KEY,
    run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    file_path TEXT,
    status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'skipped', 'timedOut', 'interrupted')),
    duration_ms INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    error_stack TEXT,
    owner TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tests_run_id ON tests(run_id);
CREATE INDEX IF NOT EXISTS idx_tests_name ON tests(test_name);
CREATE INDEX IF NOT EXISTS idx_tests_owner ON tests(owner);
CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);
CREATE INDEX IF NOT EXISTS idx_runs_timestamp ON runs(timestamp);
CREATE INDEX IF NOT EXISTS idx_runs_branch ON runs(branch);