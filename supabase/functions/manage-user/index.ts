import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify caller is authenticated + is Admin
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) throw new Error('Not authenticated')
    const { data: { user } } = await admin.auth.getUser(token)
    if (!user) throw new Error('Not authenticated')
    const { data: caller } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (caller?.role !== 'Admin') throw new Error('Admin access required')

    const body = await req.json()
    const { action } = body

    // ── CREATE ──────────────────────────────────────────────────────────
    if (action === 'create') {
      const { username, password, name, role, designation, sections } = body
      const email = `${username.trim().toLowerCase()}@tic-hr.local`
      const { data, error } = await admin.auth.admin.createUser({
        email, password,
        email_confirm: true,
        user_metadata: { name, username: username.trim().toLowerCase(), role, designation, sections: sections ?? [] },
      })
      if (error) throw error
      return new Response(JSON.stringify({ success: true, user: data.user }), { headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    // ── UPDATE ──────────────────────────────────────────────────────────
    if (action === 'update') {
      const { userId, name, role, designation, sections, password } = body
      const authUpdate: Record<string, unknown> = {}
      if (password) authUpdate.password = password
      if (name || role || designation || sections) {
        authUpdate.user_metadata = { name, role, designation, sections: sections ?? [] }
      }
      if (Object.keys(authUpdate).length > 0) {
        const { error } = await admin.auth.admin.updateUserById(userId, authUpdate)
        if (error) throw error
      }
      if (name || role || designation || sections !== undefined) {
        const { error } = await admin.from('profiles')
          .update({ name, role, designation, sections: sections ?? [] })
          .eq('id', userId)
        if (error) throw error
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    // ── DELETE ──────────────────────────────────────────────────────────
    if (action === 'delete') {
      const { userId } = body
      const { error } = await admin.auth.admin.deleteUser(userId)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    throw new Error('Unknown action: ' + action)

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
