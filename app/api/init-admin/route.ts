import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      '893ba1a9-e08e-484b-88ea-636eef9ecce8',
      { password: 'CultchaVultcha2024!' }
    )

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    // Also set super_admin role
    await supabaseAdmin
      .from('profiles')
      .update({ role: 'super_admin' })
      .eq('email', 'c.peacock1@icloud.com')

    return NextResponse.json({
      success: true,
      message: 'Password set. You can now log in at /login with password: CultchaVultcha2024!'
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
