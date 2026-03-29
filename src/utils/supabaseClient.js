import { createClient } from "@supabase/supabase-js";

// Supabase URL iyo anon key kaaga ka hel Supabase dashboard → Project Settings → API
const SUPABASE_URL = "https://ycivyrjendegqczshgpx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaXZ5cmplbmRlZ3FjenNoZ3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Nzc4OTEsImV4cCI6MjA5MDM1Mzg5MX0.8PM8MAlYEfQBLF11t9v-bf_-O72p0hS51T6wsOOp7yE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);