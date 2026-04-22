import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { SocialLogin } from '@capgo/capacitor-social-login';

const GOOGLE_WEB_CLIENT_ID = '529338826106-ojnpj2gtitnoct8np861v54et59saeb3.apps.googleusercontent.com';

let socialLoginInitialized = false;

/**
 * Initialize native social login plugin (gọi 1 lần khi app start)
 * Chỉ chạy trên native platforms
 */
export async function initSocialLogin(): Promise<void> {
  if (socialLoginInitialized || !Capacitor.isNativePlatform()) return;

  try {
    await SocialLogin.initialize({
      google: {
        webClientId: GOOGLE_WEB_CLIENT_ID,
        mode: 'online',
      },
    });
    socialLoginInitialized = true;
  } catch (err) {
    console.error('SocialLogin init error:', err);
  }
}

/**
 * Đăng nhập ẩn danh (Guest Mode)
 * User có thể dùng app ngay, sau này có thể convert thành full account
 */
export async function signInAsGuest() {
  const { data, error } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        is_guest: true,
        created_via: 'guest_mode',
      },
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Native Google Sign-In (Android + iOS sau này)
 * Trả về ID token từ Google → Supabase verify và tạo session
 */
async function signInWithGoogleNative() {
  await initSocialLogin();

  const result = await SocialLogin.login({
    provider: 'google',
    options: {},
  });

  if (result.provider !== 'google') {
    throw new Error('Unexpected provider response');
  }

  const idToken = (result.result as { idToken?: string }).idToken;
  if (!idToken) {
    throw new Error('No ID token returned from Google');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) throw error;
  return data;
}

/**
 * Web OAuth Google Sign-In (browser redirect flow)
 */
async function signInWithGoogleWeb() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Unified Google sign-in: native trên mobile, web trên browser
 */
export async function signInWithGoogle() {
  if (Capacitor.isNativePlatform()) {
    return signInWithGoogleNative();
  }
  return signInWithGoogleWeb();
}

/**
 * Logout cho cả Supabase session và native social providers
 */
export async function signOutAll() {
  if (Capacitor.isNativePlatform() && socialLoginInitialized) {
    try {
      await SocialLogin.logout({ provider: 'google' });
    } catch (err) {
      console.warn('Social logout warning (non-fatal):', err);
    }
  }
  await supabase.auth.signOut();
}

/**
 * Setup deep link listener (chỉ cần cho các flow future như Apple/Zalo)
 * Hiện tại Google native không cần deep link (plugin tự handle)
 */
export function setupOAuthDeepLinkListener() {
  if (!Capacitor.isNativePlatform()) return;

  App.addListener('appUrlOpen', async (event) => {
    const url = event.url;
    if (!url.includes('auth-callback')) return;

    try {
      const hashIndex = url.indexOf('#');
      if (hashIndex === -1) return;

      const hashParams = new URLSearchParams(url.substring(hashIndex + 1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
    } catch (err) {
      console.error('Deep link auth error:', err);
    }
  });
}

/**
 * Check xem user hiện tại có phải guest không
 */
export function isGuestUser(user: User | null | undefined): boolean {
  if (!user) return false;
  const anon = (user as User & { is_anonymous?: boolean }).is_anonymous;
  return anon === true || user.user_metadata?.is_guest === true;
}
