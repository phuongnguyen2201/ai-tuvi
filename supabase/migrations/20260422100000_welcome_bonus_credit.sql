-- =============================================
-- Welcome bonus: cấp 1 credit cho user mới đăng ký (không phải guest)
--
-- Thay thế handle_new_user để:
--   1. Khớp với schema thật (profiles.display_name — không phải full_name)
--   2. Sau khi tạo profile, cấp 1 credit vào user_credits + ghi
--      credit_transactions với source='welcome_bonus'.
--   3. Idempotent: nếu user đã có transaction welcome_bonus trước đó
--      thì không cấp lại.
--   4. Chỉ áp dụng cho user NOT anonymous (NEW.is_anonymous = false).
--
-- Dùng RPC add_credits(p_user_id, p_amount, p_source, p_metadata) có sẵn
-- để đảm bảo user_credits + credit_transactions được cập nhật đồng bộ.
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert profile
  INSERT INTO public.profiles (id, email, display_name, login_method, is_guest)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      CASE WHEN NEW.is_anonymous THEN 'Khách' ELSE NEW.email END
    ),
    COALESCE(
      NEW.raw_app_meta_data->>'provider',
      CASE WHEN NEW.is_anonymous THEN 'anonymous' ELSE 'email' END
    ),
    COALESCE(NEW.is_anonymous, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    login_method = EXCLUDED.login_method,
    is_guest = EXCLUDED.is_guest,
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name);

  -- Welcome bonus: chỉ user thật (không phải anonymous), chỉ cấp 1 lần
  IF NOT COALESCE(NEW.is_anonymous, false)
     AND NOT EXISTS (
       SELECT 1 FROM public.credit_transactions
       WHERE user_id = NEW.id AND source = 'welcome_bonus'
     )
  THEN
    PERFORM public.add_credits(
      NEW.id,
      1,
      'welcome_bonus',
      jsonb_build_object('reason', 'signup_welcome_bonus')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
