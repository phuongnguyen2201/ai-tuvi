
CREATE TABLE public.user_features (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  feature text NOT NULL,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  payment_ref text,
  UNIQUE(user_id, feature)
);

ALTER TABLE public.user_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own features"
  ON public.user_features FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own features"
  ON public.user_features FOR INSERT
  WITH CHECK (auth.uid() = user_id);
