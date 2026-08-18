import { supabase } from '../../../lib/supabase/client'
import type { LoginFormData, SignUpFormData } from '../types'

export async function signInWithPassword(data: LoginFormData) {
  const { data: result, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) throw error
  return result
}

export async function signUp(data: SignUpFormData) {
  const { data: result, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.full_name,
      },
    },
  })

  if (error) throw error
  return result
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}
