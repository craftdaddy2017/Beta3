
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration for user to fill in
const SUPABASE_URL = (window as any).SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (window as any).SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const StorageService = {
  isCloudEnabled: () => !!supabase,

  async save(key: string, data: any) {
    // 1. Always save to local for offline resilience
    localStorage.setItem(key, JSON.stringify(data));

    // 2. If cloud is enabled, sync to Supabase
    if (supabase) {
      try {
        const { error } = await supabase
          .from('user_data')
          .upsert({ key_id: key, content: data, updated_at: new Date() });
        if (error) throw error;
      } catch (e) {
        console.error("Cloud Sync Error:", e);
      }
    }
  },

  async load(key: string, defaultValue: any) {
    // 1. Try Cloud first if available
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('user_data')
          .select('content')
          .eq('key_id', key)
          .single();
        if (!error && data) return data.content;
      } catch (e) {
        console.warn("Cloud load failed, falling back to local:", e);
      }
    }

    // 2. Fallback to LocalStorage
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  }
};
