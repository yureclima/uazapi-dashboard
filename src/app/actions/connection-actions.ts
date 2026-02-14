'use server'

import { createClient } from '@/lib/supabase/server'
import { uazapi } from '@/lib/uazapi'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createConnection(formData: FormData) {
    const instanceName = formData.get('instanceName') as string

    if (!instanceName) {
        return { error: 'O nome da instância é obrigatório' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    try {
        // 1. Create in Uazapi (Init)
        const response = await uazapi.createInstance(instanceName)

        // Extract token. Adjust property name based on actual API response.
        // Usually it's 'token' or 'hash' or inside 'instance'.
        // Assuming response structure like { token: "..." } or { instance: { token: "..." } }
        const token = response.token || response.hash || response.instance?.token || (typeof response === 'string' ? response : null)

        if (!token) {
            console.error('API Response missing token:', response)
            throw new Error('API não retornou o token da instância. Verifique os logs.')
        }

        // 2. Link in Supabase with TOKEN
        const { error } = await supabase.from('connections').insert({
            user_id: user.id,
            instance_name: instanceName,
            token: token // Saving the token
        })

        if (error) throw error

        revalidatePath('/dashboard/connections')
        return { success: true }
    } catch (error: any) {
        console.error('Erro ao criar conexão:', error)
        return { error: error.message || 'Falha ao criar conexão' }
    }
}

export async function syncExistingConnections(instances: { instance_name: string, token: string | null }[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Não autorizado' }

    try {
        const { data: existing } = await supabase.from('connections').select('instance_name')
        const existingNames = new Set(existing?.map(e => e.instance_name) || [])

        const toInsert = instances
            .filter(inst => !existingNames.has(inst.instance_name))
            .map(inst => ({
                user_id: user.id,
                instance_name: inst.instance_name,
                token: inst.token // Now we have the token!
            }))

        if (toInsert.length > 0) {
            const { error } = await supabase.from('connections').insert(toInsert)
            if (error) throw error
        }

        revalidatePath('/dashboard/connections')
        return { success: true, count: toInsert.length }
    } catch (error: any) {
        return { error: error.message }
    }
}

async function getToken(instanceName: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('connections')
        .select('token')
        .eq('instance_name', instanceName)
        .single()

    if (error || !data?.token) {
        throw new Error(`Token não encontrado para instância ${instanceName}. Tente recriar a conexão.`)
    }
    return data.token
}

export async function deleteConnection(id: string, instanceName: string) {
    const supabase = await createClient()

    try {
        // 1. Get Token
        const token = await getToken(instanceName).catch(() => null) // Ignore error if token missing, just delete from DB

        // 2. Delete from Uazapi if token exists
        if (token) {
            await uazapi.deleteInstance(token)
        }

        // 3. Delete from Supabase
        const { error } = await supabase
            .from('connections')
            .delete()
            .eq('id', id)

        if (error) throw error

        revalidatePath('/dashboard/connections')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function logoutConnectionAction(instanceName: string) {
    try {
        const token = await getToken(instanceName)
        await uazapi.logoutInstance(token) // Uses /instance/disconnect
        revalidatePath('/dashboard/connections')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function updateWebhookAction(instanceName: string, config: any) {
    try {
        const token = await getToken(instanceName)
        await uazapi.setWebhook(instanceName, token, config)
        revalidatePath('/dashboard/connections')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getWebhookAction(instanceName: string) {
    try {
        const token = await getToken(instanceName)
        const webhook = await uazapi.findWebhook(instanceName, token)
        return { success: true, data: webhook }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function updateConnectionTeamAction(instanceName: string, teamId: string | null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Não autorizado' }

    // Check Admin (only admin can assign teams?)
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Apenas administradores podem gerenciar times.' }
    }

    try {
        const { data, error, count } = await supabase
            .from('connections')
            .update({ team_id: teamId })
            .eq('instance_name', instanceName)
            .select()

        if (error) throw error

        if (!data || data.length === 0) {
            return { error: 'Instância não encontrada no banco de dados. Tente atualizar a página.' }
        }

        revalidatePath('/dashboard/connections')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function connectInstanceAction(instanceName: string) {
    try {
        const token = await getToken(instanceName)
        const result = await uazapi.connectInstance(token)
        revalidatePath('/dashboard/connections')
        return { success: true, data: result }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getInstanceStatusAction(instanceName: string) {
    try {
        const token = await getToken(instanceName)
        const status = await uazapi.getInstanceStatus(token)
        return { success: true, data: status }
    } catch (error: any) {
        return { error: error.message }
    }
}
