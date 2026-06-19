const SUPABASE_URL = 'https://pfzulktbhivfkfzuvztd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__GD7DmF9qF1_vFbHT-OMtw_oaa5dlct';

let _supabaseInstance = null;

function getSupabase() {
  if (_supabaseInstance) return _supabaseInstance;
  try {
    const g = typeof window !== 'undefined' ? window : globalThis;
    if (g.supabase && typeof g.supabase.createClient === 'function') {
      _supabaseInstance = g.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  } catch (e) {
    console.error('Erro ao conectar Supabase:', e);
  }
  return _supabaseInstance;
}
