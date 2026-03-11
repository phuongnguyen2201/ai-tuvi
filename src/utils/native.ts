import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Share } from '@capacitor/share';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import type { NavigateFunction } from 'react-router-dom';

export const openExternalLink = async (url: string) => {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

export const shareResult = async (title: string, text: string, url?: string) => {
  if (Capacitor.isNativePlatform()) {
    await Share.share({ title, text, url, dialogTitle: title });
  } else if (navigator.share) {
    await navigator.share({ title, text, url });
  } else {
    const content = url ? `${text}\n${url}` : text;
    await navigator.clipboard.writeText(content);
  }
};

export const setupBackButton = (navigate: NavigateFunction) => {
  if (!Capacitor.isNativePlatform()) return () => {};

  const listener = App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      navigate(-1);
    } else {
      App.exitApp();
    }
  });

  return () => {
    listener.then((handle) => handle.remove());
  };
};

export const hapticImpact = async () => {
  if (Capacitor.isNativePlatform()) {
    await Haptics.impact({ style: ImpactStyle.Medium });
  }
};

export const hapticSuccess = async () => {
  if (Capacitor.isNativePlatform()) {
    await Haptics.notification({ type: NotificationType.Success });
  }
};
