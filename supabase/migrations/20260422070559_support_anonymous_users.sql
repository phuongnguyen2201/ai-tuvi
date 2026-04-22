-- Cho phép profiles có nullable email (anonymous users và Google users không có email chưa confirm)
ALTER TABLE profiles
  ALTER COLUMN email DROP NOT NULL;

-- Thêm columns tracking login method và guest status
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS login_method TEXT DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;

-- Update trigger auto-create profile để handle anonymous + OAuth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, login_method, is_guest)
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
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index cho query nhanh khi cần lọc guests
CREATE INDEX IF NOT EXISTS idx_profiles_is_guest ON profiles(is_guest) WHERE is_guest = true;
