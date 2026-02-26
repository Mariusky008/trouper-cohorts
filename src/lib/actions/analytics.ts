'use server';

import { createClient } from '@/lib/supabase/server';

export async function trackEvent(eventType: string, metadata: any = {}) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.warn('Anonymous event tracking attempted:', eventType);
    return; // Or allow anonymous tracking if desired, but schema requires user_id usually or nullable
  }

  try {
    const { error } = await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: eventType,
      metadata: metadata,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error tracking event:', error);
    }
  } catch (error) {
    console.error('Unexpected error tracking event:', error);
  }
}
