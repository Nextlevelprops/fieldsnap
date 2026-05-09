import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export async function subscribeToPush(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push not supported');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const { endpoint, keys: { p256dh, auth } } = sub.toJSON();

  // Delete any existing subscription for this endpoint (handles account switching)
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  
  // Insert fresh subscription for current user
  await supabase.from('push_subscriptions').insert({
    user_id: userId,
    endpoint,
    p256dh,
    auth,
  });
}

export async function sendPushNotification(userId, title, body, url = '/') {
  const { data: { session } } = await supabase.auth.getSession();
  await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ user_id: userId, title, body, url }),
  });
}
