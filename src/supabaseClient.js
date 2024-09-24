import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function createEvent(eventType, dataInput) {
  // Function to send an event to the backend and wait for a response
  // In this app, we are not using this function, but it's exported as per guidelines
  // You can implement it if needed
}