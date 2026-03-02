CREATE POLICY "Users delete own van_han_analyses"
ON public.van_han_analyses
FOR DELETE
USING (auth.uid() = user_id);