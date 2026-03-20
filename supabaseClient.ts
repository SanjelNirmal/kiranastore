import { createClient } from '@supabase/supabase-js';

// Configuration using provided credentials
const supabaseUrl = 'https://ugjymholgkzbsioybifu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnanltaG9sZ2t6YnNpb3liaWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTA4MTEsImV4cCI6MjA4OTU2NjgxMX0.ha1gEJojGc7z3hNNjR5nD-u94ndHxBAGpLREQtKZvR4';

export const supabase = createClient(supabaseUrl, supabaseKey);