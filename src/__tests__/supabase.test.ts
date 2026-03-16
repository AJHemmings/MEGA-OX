import { supabase } from '../lib/supabase';

test('supabase client initialises without throwing', () => {
  expect(supabase).toBeDefined();
  expect(typeof supabase.auth.getSession).toBe('function');
});
