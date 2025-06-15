
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { hostId } = await req.json()
    
    if (!hostId) {
      return new Response(
        JSON.stringify({ error: 'Host ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create admin client with service role key
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

    console.log(`Starting deletion process for host: ${hostId}`)

    // First, check if there are any games associated with this host
    const { data: games, error: gamesCheckError } = await supabaseAdmin
      .from('games')
      .select('id, status')
      .eq('host_id', hostId)

    if (gamesCheckError) {
      console.error('Error checking games:', gamesCheckError)
      return new Response(
        JSON.stringify({ error: 'Failed to check host dependencies' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Delete all related data in the correct order
    if (games && games.length > 0) {
      console.log(`Found ${games.length} games associated with host. Deleting all related data.`)
      
      // Step 1: Delete all bookings for these games
      for (const game of games) {
        const { error: bookingsDeleteError } = await supabaseAdmin
          .from('bookings')
          .delete()
          .eq('game_id', game.id)

        if (bookingsDeleteError) {
          console.error('Error deleting bookings for game:', game.id, bookingsDeleteError)
          return new Response(
            JSON.stringify({ error: 'Failed to delete game bookings' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
      }

      // Step 2: Delete all winners for these games
      for (const game of games) {
        const { error: winnersDeleteError } = await supabaseAdmin
          .from('winners')
          .delete()
          .eq('game_id', game.id)

        if (winnersDeleteError) {
          console.error('Error deleting winners for game:', game.id, winnersDeleteError)
          return new Response(
            JSON.stringify({ error: 'Failed to delete game winners' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
      }

      // Step 3: Delete all games associated with this host
      const { error: gamesDeleteError } = await supabaseAdmin
        .from('games')
        .delete()
        .eq('host_id', hostId)

      if (gamesDeleteError) {
        console.error('Error deleting games:', gamesDeleteError)
        return new Response(
          JSON.stringify({ error: 'Failed to delete associated games' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Now delete from hosts table
    const { error: hostDeleteError } = await supabaseAdmin
      .from('hosts')
      .delete()
      .eq('id', hostId)

    if (hostDeleteError) {
      console.error('Error deleting from hosts table:', hostDeleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete host record' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Finally delete the auth user
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(hostId)

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user account' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Successfully deleted host: ${hostId}`)

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in delete-host function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
