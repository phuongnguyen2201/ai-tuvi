
CREATE TABLE chart_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  payment_id UUID REFERENCES payments(id),
  chart_hash VARCHAR(100) NOT NULL,
  birth_data JSONB NOT NULL,
  chart_data JSONB NOT NULL,
  analysis_result TEXT,
  analysis_type VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, chart_hash, analysis_type)
);

ALTER TABLE chart_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User xem analyses của mình"
  ON chart_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "User tạo analyses"
  ON chart_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);
