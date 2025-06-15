
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { email, password, name, phone } = await req.json()

    console.log('Creating admin user:', { email, name })

    // Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      throw authError
    }

    console.log('Auth user created:', authData.user?.id)

    // Insert into hosts table
    const { error: hostError } = await supabaseAdmin
      .from('hosts')
      .insert({
        id: authData.user!.id,
        email,
        name,
        phone,
        is_active: true
      })

    if (hostError) {
      console.error('Host creation error:', hostError)
      // If host creation fails, we should clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user!.id)
      throw hostError
    }

    console.log('Host record created successfully')

    return new Response(
      JSON.stringify({ success: true, user: authData.user }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error creating admin:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
