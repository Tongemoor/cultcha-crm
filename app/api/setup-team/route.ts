import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const TEMP_PASSWORD = 'CultchaTeam2024!'

    const team = [
      { name: 'Matthew Swallow',  email: 'mswallow@destenica.co.uk',   role: 'admin'   },
      { name: 'Liam Hindle',      email: 'liamhindle1@gmail.com',      role: 'manager' },
      { name: 'Amnash Kumar',     email: 'amnashkumar@gmail.com',      role: 'viewer'  },
      { name: 'Dilshan Nazir',    email: 'dilshan.nazir94@gmail.com',  role: 'viewer'  },
      { name: 'Caleb Duckworth',  email: 'duckworthcaleb62@gmail.com', role: 'viewer'  },
      { name: 'Nick Cliffe',      email: 'cliffenick4@gmail.com',      role: 'viewer'  },
    ]

    const results = []

    for (const member of team) {
      // Try to create user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: member.email,
        password: TEMP_PASSWORD,
        email_confirm: true,
      })

      let userId: string | null = null

      if (authError) {
        if (authError.message.toLowerCase().includes('already') || authError.message.toLowerCase().includes('exists')) {
          // User exists — find them and update
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 100 })
          const existing = listData?.users?.find(u => u.email?.toLowerCase() === member.email.toLowerCase())
          if (existing) {
            userId = existing.id
            await supabaseAdmin.auth.admin.updateUserById(existing.id, { password: TEMP_PASSWORD })
            results.push({ name: member.name, status: 'updated', role: member.role })
          } else {
            results.push({ name: member.name, status: 'error', detail: 'Could not find existing user' })
            continue
          }
        } else {
          results.push({ name: member.name, status: 'error', detail: authError.message })
          continue
        }
      } else {
        userId = authData.user.id
        results.push({ name: member.name, status: 'created', role: member.role })
      }

      // Upsert profile with role
      if (userId) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert(
            { id: userId, email: member.email, full_name: member.name, role: member.role },
            { onConflict: 'id' }
          )
        if (profileError) {
          results[results.length - 1].detail = `Profile error: ${profileError.message}`
        }
      }
    }

    return NextResponse.json({
      success: true,
      tempPassword: TEMP_PASSWORD,
      results,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
