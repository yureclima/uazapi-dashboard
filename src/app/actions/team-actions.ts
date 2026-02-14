'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ----- TEAMS -----

export async function createTeamAction(name: string) {
    const supabase = await createClient()

    // Check Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autorizado' }

    try {
        const { error } = await supabase
            .from('teams')
            .insert({ name })

        if (error) throw error

        revalidatePath('/dashboard/teams')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getTeamsAction() {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('teams')
            .select(`
                *,
                members: team_members (
                    user_id,
                    role,
                    profile: profiles (email)
                )
            `)
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function deleteTeamAction(teamId: string) {
    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('teams')
            .delete()
            .eq('id', teamId)

        if (error) throw error

        revalidatePath('/dashboard/teams')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

// ----- MEMBERS -----

export async function addMembersAction(teamId: string, emails: string[]) {
    const supabase = await createClient()

    try {
        // 1. Find User IDs by Emails
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, email')
            .in('email', emails)

        if (profileError || !profiles || profiles.length === 0) {
            return { error: 'Nenhum usuário encontrado.' }
        }

        // 2. Prepare inserts
        const inserts = profiles.map(p => ({
            team_id: teamId,
            user_id: p.id,
            role: 'member'
        }))

        // 3. Add to Team
        const { error } = await supabase
            .from('team_members')
            .upsert(inserts, { onConflict: 'team_id, user_id' })

        if (error) throw error

        revalidatePath('/dashboard/teams')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function addMemberAction(teamId: string, email: string) {
    return addMembersAction(teamId, [email])
}

export async function removeMemberAction(teamId: string, userId: string) {
    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('team_id', teamId)
            .eq('user_id', userId)

        if (error) throw error

        revalidatePath('/dashboard/teams')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
export async function getProfilesAction() {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, email')
            .order('email')

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { error: error.message }
    }
}
