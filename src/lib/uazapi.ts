import 'server-only'

const UAZAPI_URL = process.env.UAZAPI_SERVER_URL
const ADMIN_TOKEN = process.env.UAZAPI_ADMIN_TOKEN

if (!UAZAPI_URL || !ADMIN_TOKEN) {
    throw new Error('Variáveis de ambiente da Uazapi não configuradas')
}

export type UazapiInstance = {
    instanceName: string
    owner?: string
    status?: string
}

export const uazapi = {
    // ADMIN ACTIONS
    async fetchInstances(): Promise<any[]> {
        try {
            const res = await fetch(`${UAZAPI_URL}/instance/all`, {
                headers: {
                    'admintoken': ADMIN_TOKEN!,
                },
                next: { revalidate: 0 } // Sem cache
            })

            if (!res.ok) {
                console.error('Erro de busca na Uazapi:', await res.text())
                return []
            }

            const data = await res.json()
            return data || []
        } catch (error) {
            console.error('Erro de busca na Uazapi:', error)
            return []
        }
    },

    async createInstance(instanceName: string) {
        const res = await fetch(`${UAZAPI_URL}/instance/init`, {
            method: 'POST',
            headers: {
                'admintoken': ADMIN_TOKEN!,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: instanceName }),
        })

        if (!res.ok) {
            const error = await res.text()
            throw new Error(error || 'Falha ao criar instância')
        }

        return res.json() // Deve retornar { token: "...", ... }
    },

    // INSTANCE ACTIONS (Require Token)
    async connectInstance(token: string) {
        const res = await fetch(`${UAZAPI_URL}/instance/connect`, {
            method: 'POST',
            headers: {
                'token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({}) // Body vazio para QR Code
        })

        if (!res.ok) { // 429 = Too Many Requests
            const error = await res.text()
            throw new Error(error || 'Falha ao conectar instância')
        }

        return res.json()
    },

    async logoutInstance(token: string) {
        const res = await fetch(`${UAZAPI_URL}/instance/disconnect`, {
            method: 'POST',
            headers: {
                'token': token,
            },
        })

        if (!res.ok) {
            console.error('Logout error:', await res.text())
        }
        return true
    },

    async deleteInstance(token: string) {
        console.log(`Deletando instancia via API...`);
        const res = await fetch(`${UAZAPI_URL}/instance`, {
            method: 'DELETE',
            headers: {
                'token': token,
                'Accept': 'application/json'
            },
        })

        if (!res.ok) {
            const error = await res.text()
            console.error('Erro ao deletar instancia na Uazapi:', error);
            throw new Error(error || 'Falha ao deletar instância na Uazapi')
        }
        return true
    },

    async getInstanceStatus(token: string) {
        const res = await fetch(`${UAZAPI_URL}/instance/status`, {
            method: 'GET',
            headers: {
                'token': token,
            },
            next: { revalidate: 0 }
        })

        if (!res.ok) return null
        return res.json()
    },

    // WEBHOOK ACTIONS (Require Token)
    async setWebhook(instanceName: string, token: string, webhookData: any) {
        // Conforme documentação: POST /webhook
        const res = await fetch(`${UAZAPI_URL}/webhook`, {
            method: 'POST',
            headers: {
                'token': token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookData), // Modo Simples: sem 'id' ou 'action'
        })

        if (!res.ok) {
            const error = await res.text()
            throw new Error(error || 'Falha ao configurar webhook')
        }

        return res.json()
    },

    async findWebhook(instanceName: string, token: string) {
        // Assumindo GET /webhook para recuperar conf atual
        const res = await fetch(`${UAZAPI_URL}/webhook`, {
            method: 'GET',
            headers: {
                'token': token,
            },
            next: { revalidate: 0 }
        })

        if (!res.ok) return null
        return res.json()
    }
}
