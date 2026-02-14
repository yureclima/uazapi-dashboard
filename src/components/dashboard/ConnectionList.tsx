'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Smartphone, QrCode as QrIcon, RefreshCw, LogOut, Settings, X, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import SettingsModal from '@/components/dashboard/SettingsModal'
import {
    createConnection,
    deleteConnection,
    syncExistingConnections,
    logoutConnectionAction,
    updateWebhookAction,
    getWebhookAction,
    connectInstanceAction,
    getInstanceStatusAction
} from '@/app/actions/connection-actions'
import clsx from 'clsx'

type Connection = {
    id: string
    instance_name: string
    status?: string // 'open', 'close', 'connecting'
    user_id: string
    is_registered?: boolean
    profilePicUrl?: string | null
    token?: string | null
    team_name?: string | null
    team_id?: string | null
}

function InstanceAvatar({ url, alt, status }: { url?: string | null, alt: string, status?: string }) {
    const [hasError, setHasError] = useState(false)

    if (url && !hasError) {
        return (
            <img
                src={url}
                alt={alt}
                className="h-12 w-12 rounded-full object-cover border-2 border-gray-800"
                onError={() => setHasError(true)}
            />
        )
    }

    return (
        <div className={clsx(
            "flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-800",
            status === 'open' ? 'bg-green-500/10 text-green-500' : 'bg-gray-800 text-gray-500'
        )}>
            <Smartphone className="h-6 w-6" />
        </div>
    )
}

function QrCodeModal({ isOpen, onClose, instanceName }: { isOpen: boolean, onClose: () => void, instanceName: string }) {
    const [phone, setPhone] = useState('')
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [status, setStatus] = useState<string>('selection')
    const [error, setError] = useState<string | null>(null)
    const [pairingCode, setPairingCode] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!isOpen || status === 'selection') return

        let isMounted = true
        let intervalId: NodeJS.Timeout

        const fetchStatus = async () => {
            try {
                const result = await getInstanceStatusAction(instanceName)
                if (isMounted && result.success && result.data) {
                    const data = result.data
                    setStatus(data.instance?.status || data.status || 'unknown')

                    if (data.qrcode || data.instance?.qrcode) {
                        setQrCode(data.qrcode || data.instance?.qrcode)
                    }

                    if (data.pairingCode || data.instance?.pairingCode) {
                        setPairingCode(data.pairingCode || data.instance?.pairingCode)
                    }

                    if (data.instance?.status === 'open' || data.instance?.status === 'connected') {
                        onClose()
                        window.location.reload()
                    }
                }
            } catch (err) {
                console.error('Polling error', err)
            }
        }

        intervalId = setInterval(fetchStatus, 2000)

        return () => {
            isMounted = false
            clearInterval(intervalId)
        }
    }, [isOpen, instanceName, onClose, status])

    const startConnection = async (usePhone: boolean) => {
        setLoading(true)
        setError(null)
        setStatus('connecting')

        const result = await connectInstanceAction(instanceName, usePhone ? phone : undefined)

        if (result.error) {
            setError(result.error)
            setStatus('selection')
        }
        setLoading(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl relative">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-white"
                >
                    <X className="h-5 w-5" />
                </button>

                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <QrIcon className="h-6 w-6 text-indigo-500" />
                    Conectar WhatsApp
                </h3>

                <div className="space-y-6">
                    {status === 'selection' ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Telefone</label>
                                <p className="text-xs text-gray-500">Opcional, serve para gerar código de pareamento</p>
                                <input
                                    type="text"
                                    placeholder="Ex: 5511999999999"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                    {error}
                                </p>
                            )}

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => startConnection(false)}
                                    disabled={loading}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-all disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <QrIcon className="h-5 w-5" />}
                                    Gerar QR Code
                                </button>
                                <button
                                    onClick={() => startConnection(true)}
                                    disabled={loading || !phone}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-600/30 bg-indigo-600/10 px-4 py-3 text-sm font-semibold text-indigo-400 hover:bg-indigo-600/20 transition-all disabled:opacity-50"
                                >
                                    Gerar Código de Pareamento
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center space-y-6">
                            {error ? (
                                <div className="p-4 rounded-lg bg-red-500/10 text-red-500 text-center w-full">
                                    <p className="font-medium">Erro ao conectar</p>
                                    <p className="text-sm opacity-80 mt-1">{error}</p>
                                    <button
                                        onClick={() => setStatus('selection')}
                                        className="mt-4 text-xs underline"
                                    >
                                        Tentar novamente
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {!pairingCode ? (
                                        <div className="relative flex items-center justify-center w-64 h-64 bg-white rounded-xl overflow-hidden shadow-inner">
                                            {qrCode ? (
                                                <img
                                                    src={qrCode.startsWith('data:image') ? qrCode : `data:image/png;base64,${qrCode}`}
                                                    alt="QR Code"
                                                    className="w-full h-full object-contain p-2"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center gap-3 text-gray-500">
                                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                                    <span className="text-sm font-medium">Aguardando API...</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-full space-y-4">
                                            <div className="text-center p-6 bg-gray-950 rounded-xl border border-gray-800 shadow-inner">
                                                <p className="text-xs text-gray-500 mb-3 uppercase tracking-widest font-bold">Código de Pareamento</p>
                                                <p className="text-4xl font-mono text-white tracking-[0.2em] font-bold">{pairingCode}</p>
                                            </div>
                                            <p className="text-xs text-center text-gray-400">
                                                Vá em Dispositivos Conectados {'>'} Conectar com número de telefone no seu celular.
                                            </p>
                                        </div>
                                    )}

                                    <div className="text-center space-y-3 w-full border-t border-gray-800 pt-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className={clsx(
                                                "h-2 w-2 rounded-full animate-pulse",
                                                status === 'connecting' ? "bg-yellow-500" : "bg-indigo-500"
                                            )} />
                                            <p className="text-sm text-gray-300">
                                                Status: <span className="text-indigo-400 font-mono capitalize">{status}</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setStatus('selection')}
                                            className="text-xs text-gray-500 hover:text-white transition-colors"
                                        >
                                            Voltar à seleção
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function ConnectionList({ initialConnections }: { initialConnections: Connection[] }) {
    const [connections, setConnections] = useState(initialConnections)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Settings Modal State
    const [selectedInstance, setSelectedInstance] = useState<Connection | null>(null)
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
    const [webhookConfig, setWebhookConfig] = useState<any>(null)

    // QR Code Modal State
    const [qrModalInstance, setQrModalInstance] = useState<string | null>(null)

    // Create Connection Form State
    const [newInstanceName, setNewInstanceName] = useState('')
    const [isSyncing, setIsSyncing] = useState(false)

    const handleSync = async () => {
        setIsSyncing(true)
        const toImport = connections
            .filter((c: any) => !c.is_registered)
            .map((c: any) => ({
                instance_name: c.instance_name,
                token: c.token || null
            }))

        if (toImport.length === 0) {
            alert('Todas as instâncias já estão registradas.')
            setIsSyncing(false)
            return
        }

        const result = await syncExistingConnections(toImport)
        if (result.success) {
            window.location.reload()
        } else {
            alert(result.error)
        }
        setIsSyncing(false)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData()
        formData.append('instanceName', newInstanceName)

        const result = await createConnection(formData)

        if (result.success) {
            setNewInstanceName('')
            setIsCreateModalOpen(false)
            window.location.reload()
        } else {
            alert(result.error)
        }
        setLoading(false)
    }

    const handleDelete = async (id: string, instanceName: string, token?: string | null) => {
        if (!confirm('Tem certeza que deseja excluir esta conexão? Isso removerá a instância da Uazapi e do seu banco de dados.')) return

        const result = await deleteConnection(id, instanceName, token)
        if (result.success) {
            setConnections(prev => prev.filter(c => c.id !== id))
        } else {
            alert(result.error)
        }
    }

    const handleDisconnect = async (instanceName: string) => {
        if (!confirm('Isso irá desconectar o WhatsApp Web da instância. Deseja continuar?')) return

        await logoutConnectionAction(instanceName)
        setConnections(prev => prev.map(c =>
            c.instance_name === instanceName ? { ...c, status: 'disconnected' } : c
        ))
        alert('Instância desconectada com sucesso!')
    }

    const handleOpenSettings = async (conn: Connection) => {
        setSelectedInstance(conn)
        setIsSettingsModalOpen(true)
        setWebhookConfig(null) // Reset while loading

        try {
            // Fetch current webhook config
            const result = await getWebhookAction(conn.instance_name)

            if (result.success && result.data) {
                // Check if response is array (some versions of API return list of webhooks)
                const apiData = Array.isArray(result.data) ? result.data[0] : result.data

                if (apiData) {
                    setWebhookConfig({
                        webhookUrl: apiData.url || '',
                        webhookEnabled: apiData.enabled ?? (!!apiData.url), // Se enabled não vier (como no screenshot), assume ativo se tiver URL
                        events: apiData.events || [],
                        blacklist: apiData.excludeMessages || [],
                        webhookOptions: {
                            addUrlEvents: apiData.addUrlEvents || false,
                            addUrlTypesMessages: apiData.addUrlTypesMessages || false
                        }
                    })
                } else {
                    // Empty data/array
                    setWebhookConfig({
                        webhookUrl: '',
                        webhookEnabled: false,
                        events: ['messages'],
                        blacklist: [],
                        webhookOptions: {
                            addUrlEvents: false,
                            addUrlTypesMessages: false
                        }
                    })
                }
            } else {
                console.warn('Webhook não encontrado ou erro:', result.error)
                // Default config
                setWebhookConfig({
                    webhookUrl: '',
                    webhookEnabled: false,
                    events: ['messages'],
                    blacklist: [],
                    webhookOptions: {
                        addUrlEvents: false,
                        addUrlTypesMessages: false
                    }
                })
            }
        } catch (error) {
            console.error('Erro inesperado ao abrir configurações:', error)
            setWebhookConfig({
                webhookUrl: '',
                webhookEnabled: false,
                events: ['messages'],
                blacklist: [],
                webhookOptions: {
                    addUrlEvents: false,
                    addUrlTypesMessages: false
                }
            })
        }
    }

    const handleSaveWebhook = async (instanceName: string, config: any) => {
        // Transformar configs para o formato da API
        const apiConfig = {
            url: config.webhookUrl,
            enabled: config.webhookEnabled,
            events: config.events,
            excludeMessages: config.blacklist,
            addUrlEvents: config.webhookOptions.addUrlEvents,
            addUrlTypesMessages: config.webhookOptions.addUrlTypesMessages
        }

        const result = await updateWebhookAction(instanceName, apiConfig)
        if (!result.success) {
            alert(`Erro ao salvar webhook: ${result.error}`)
            throw new Error(result.error)
        } else {
            alert('Webhook configurado com sucesso!')
            setIsSettingsModalOpen(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Suas Conexões</h2>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        title="Atualizar Página"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={clsx("h-4 w-4", isSyncing && "animate-spin")} />
                        Sincronizar Banco
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Adicionar Conexão
                    </button>
                </div>
            </div>

            {connections.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 bg-gray-900/30 p-12 text-center">
                    <Smartphone className="h-12 w-12 text-gray-600" />
                    <h3 className="mt-4 text-lg font-medium text-white">Nenhuma conexão encontrada</h3>
                    <p className="mt-2 text-sm text-gray-400">
                        Comece adicionando sua primeira instância do WhatsApp.
                    </p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-6 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                    >
                        Criar Instância
                    </button>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {connections.map((conn: any) => (
                        <div
                            key={conn.id}
                            className={clsx(
                                "group relative flex flex-col justify-between rounded-xl border p-6 backdrop-blur-sm transition-all",
                                conn.is_registered ? "border-gray-800 bg-gray-900/50 hover:border-indigo-500/50" : "border-yellow-500/30 bg-yellow-500/5 outline-dashed outline-1 outline-yellow-500/20"
                            )}
                        >
                            <div>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <InstanceAvatar
                                                url={conn.profilePicUrl}
                                                alt={conn.instance_name}
                                                status={conn.status}
                                            />

                                            <span className={clsx(
                                                "absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-gray-900",
                                                conn.status === 'open' ? "bg-green-500" : "bg-red-500"
                                            )} />
                                        </div>

                                        <div>
                                            <h3 className="font-medium text-white flex items-center gap-2">
                                                {conn.instance_name}
                                                {!conn.is_registered && (
                                                    <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/30 font-bold uppercase tracking-wider">
                                                        Importada
                                                    </span>
                                                )}
                                            </h3>

                                            {conn.team_name && (
                                                <div className="mt-1">
                                                    <span className="inline-flex items-center rounded bg-indigo-400/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400 border border-indigo-500/20">
                                                        Time: {conn.team_name}
                                                    </span>
                                                </div>
                                            )}

                                            <p className="text-xs text-gray-400 capitalize">
                                                {conn.status === 'open' ? 'Conectado' : 'Desconectado'}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleOpenSettings(conn)}
                                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                        title="Configurações"
                                    >
                                        <Settings className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setQrModalInstance(conn.instance_name)}
                                        className="flex items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                                    >
                                        <QrIcon className="h-3.5 w-3.5" />
                                        QR Code
                                    </button>
                                    <button
                                        onClick={() => handleDisconnect(conn.instance_name)}
                                        className="flex items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        Desconectar
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-center border-t border-gray-800 pt-4">
                                <button
                                    onClick={() => handleDelete(conn.id, conn.instance_name, conn.token)}
                                    className="flex items-center gap-1 text-xs font-medium text-red-500/70 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Remover do Painel
                                </button>
                            </div>
                        </div>
                    ))
                    }
                </div >
            )
            }

            {/* Create Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Criar Nova Conexão"
            >
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label htmlFor="instanceName" className="block text-sm font-medium text-gray-300">
                            Nome da Instância
                        </label>
                        <input
                            type="text"
                            id="instanceName"
                            value={newInstanceName}
                            onChange={(e) => setNewInstanceName(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Ex: Celular Vendas"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Dê um nome único para sua conexão.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                            Criar
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Settings Modal */}
            {
                selectedInstance && (
                    <SettingsModal
                        isOpen={isSettingsModalOpen}
                        onClose={() => setIsSettingsModalOpen(false)}
                        instanceName={selectedInstance.instance_name}
                        status={selectedInstance.status || 'unknown'}
                        onDisconnect={handleDisconnect}
                        onSaveWebhook={handleSaveWebhook}
                        initialWebhookConfig={webhookConfig}
                    />
                )
            }

            {/* QR Code Modal */}
            {
                qrModalInstance && (
                    <QrCodeModal
                        isOpen={!!qrModalInstance}
                        onClose={() => setQrModalInstance(null)}
                        instanceName={qrModalInstance}
                    />
                )
            }
        </div >
    )
}
