'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { RefreshCw, Power } from 'lucide-react'
import clsx from 'clsx'
import { getTeamsAction } from '@/app/actions/team-actions'
import { updateConnectionTeamAction } from '@/app/actions/connection-actions'

type WebhookConfig = {
    webhookUrl: string
    webhookEnabled: boolean
    events: string[]
    blacklist: string[]
    webhookOptions: {
        addUrlEvents: boolean
        addUrlTypesMessages: boolean
    }
}

const AVAILABLE_EVENTS = [
    'messages',
    'messages.upsert',
    'messages.update',
    'messages.delete',
    'send.message',
    'contacts.update',
    'presence.update',
    'chats.update',
    'chats.delete',
    'groups.update',
    'group-participants.update',
    'connection.update',
    'call'
]

const BLACKLIST_OPTIONS = [
    'wasSentByApi',
    'wasNotSentByApi',
    'fromMeYes',
    'fromMeNo',
    'isGroupYes',
    'isGroupNo'
]

type Props = {
    isOpen: boolean
    onClose: () => void
    instanceName: string
    status: string
    onDisconnect: (name: string) => Promise<void>
    onSaveWebhook: (name: string, config: any) => Promise<void>
    initialWebhookConfig?: WebhookConfig
    currentTeamId?: string | null
}

export default function SettingsModal({
    isOpen,
    onClose,
    instanceName,
    status,
    onDisconnect,
    onSaveWebhook,
    initialWebhookConfig,
    currentTeamId
}: Props) {
    const [activeTab, setActiveTab] = useState<'info' | 'webhook'>('info')
    const [loading, setLoading] = useState(false)
    const [config, setConfig] = useState<WebhookConfig>(initialWebhookConfig || {
        webhookUrl: '',
        webhookEnabled: false,
        events: ['messages'],
        blacklist: [],
        webhookOptions: {
            addUrlEvents: false,
            addUrlTypesMessages: false
        }
    })

    // Team State
    const [teams, setTeams] = useState<any[]>([])
    const [selectedTeam, setSelectedTeam] = useState<string>('')
    const [updatingTeam, setUpdatingTeam] = useState(false)

    useEffect(() => {
        if (initialWebhookConfig) {
            setConfig(initialWebhookConfig)
        }
    }, [initialWebhookConfig, instanceName])

    useEffect(() => {
        if (activeTab === 'info' && isOpen) {
            getTeamsAction().then(res => {
                if (res.success && res.data) {
                    setTeams(res.data)
                }
            })
        }
    }, [activeTab, isOpen])

    useEffect(() => {
        setSelectedTeam(currentTeamId || '')
    }, [currentTeamId, isOpen])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        await onSaveWebhook(instanceName, config)
        setLoading(false)
    }

    const handleUpdateTeam = async () => {
        setUpdatingTeam(true)
        const teamId = selectedTeam === '' ? null : selectedTeam
        const result = await updateConnectionTeamAction(instanceName, teamId)
        setUpdatingTeam(false)
        if (result.success) {
            alert('Time atualizado com sucesso!')
            window.location.reload() // Refresh to update list
        } else {
            alert(`Erro: ${result.error}`)
        }
    }

    const toggleEvent = (event: string) => {
        setConfig(prev => {
            const events = prev.events.includes(event)
                ? prev.events.filter(e => e !== event)
                : [...prev.events, event]
            return { ...prev, events }
        })
    }

    const toggleBlacklist = (item: string) => {
        setConfig(prev => {
            const blacklist = prev.blacklist.includes(item)
                ? prev.blacklist.filter(e => e !== item)
                : [...prev.blacklist, item]
            return { ...prev, blacklist }
        })
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Gerenciar: ${instanceName}`}>
            <div className="flex border-b border-gray-800 mb-4">
                <button
                    onClick={() => setActiveTab('info')}
                    className={clsx(
                        "px-4 py-2 text-sm font-medium transition-colors border-b-2",
                        activeTab === 'info'
                            ? "border-indigo-500 text-indigo-400"
                            : "border-transparent text-gray-400 hover:text-gray-300"
                    )}
                >
                    Informações
                </button>
                <button
                    onClick={() => setActiveTab('webhook')}
                    className={clsx(
                        "px-4 py-2 text-sm font-medium transition-colors border-b-2",
                        activeTab === 'webhook'
                            ? "border-indigo-500 text-indigo-400"
                            : "border-transparent text-gray-400 hover:text-gray-300"
                    )}
                >
                    Webhook
                </button>
            </div>

            {activeTab === 'info' && (
                <div className="space-y-6">
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Status Atual:</span>
                            <span className={clsx(
                                "px-2 py-1 rounded text-xs font-bold uppercase",
                                status === 'open' || status === 'connected' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                            )}>
                                {status === 'open' || status === 'connected' ? 'CONECTADO' : 'DESCONECTADO'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Instância:</span>
                            <span className="text-white text-sm font-mono">{instanceName}</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-800">
                        <h4 className="text-sm font-medium text-white mb-3">Gerenciar Time</h4>
                        <div className="flex gap-2">
                            <select
                                value={selectedTeam}
                                onChange={(e) => setSelectedTeam(e.target.value)}
                                className="flex-1 rounded-lg bg-gray-900 border border-gray-700 text-sm text-white px-3 py-2 disabled:opacity-50 focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={updatingTeam}
                            >
                                <option value="">Sem Time (Pessoal)</option>
                                {teams.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleUpdateTeam}
                                disabled={updatingTeam || selectedTeam === (currentTeamId || '')}
                                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
                            >
                                {updatingTeam ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Salvar'}
                            </button>
                        </div>
                        {teams.length === 0 && <p className="mt-2 text-xs text-gray-500">Apenas administradores podem visualizar e atribuir times.</p>}
                    </div>

                    <div className="pt-4 border-t border-gray-800">
                        <h4 className="text-sm font-medium text-white mb-3">Ações de Sessão</h4>
                        <button
                            onClick={() => onDisconnect(instanceName)}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-all"
                        >
                            <Power className="h-4 w-4" />
                            Desconectar Sessão
                        </button>
                        <p className="mt-2 text-xs text-gray-500 text-center">
                            Isso irá deslogar o WhatsApp Web, mas manterá a instância no painel.
                        </p>
                    </div>
                </div>
            )}

            {activeTab === 'webhook' && (
                !initialWebhookConfig ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-3">
                        <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
                        <span className="text-sm">Carregando configurações...</span>
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="space-y-5">
                        <div className="flex items-center justify-between bg-gray-900/30 p-3 rounded-lg border border-gray-800">
                            <span className="text-sm font-medium text-gray-300">Habilitar Webhook</span>
                            <button
                                type="button"
                                onClick={() => setConfig({ ...config, webhookEnabled: !config.webhookEnabled })}
                                className={clsx(
                                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                    config.webhookEnabled ? "bg-indigo-600" : "bg-gray-700"
                                )}
                            >
                                <span
                                    className={clsx(
                                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                        config.webhookEnabled ? "translate-x-5" : "translate-x-0"
                                    )}
                                />
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">URL do Webhook</label>
                            <input
                                type="url"
                                value={config.webhookUrl}
                                onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                                className="block w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white placeholder-gray-600 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="https://seu-sistema.com/webhook"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.webhookOptions.addUrlEvents}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        webhookOptions: { ...config.webhookOptions, addUrlEvents: e.target.checked }
                                    })}
                                    className="rounded border-gray-700 bg-gray-900 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-xs text-gray-300">Enviar URL nos Eventos</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.webhookOptions.addUrlTypesMessages}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        webhookOptions: { ...config.webhookOptions, addUrlTypesMessages: e.target.checked }
                                    })}
                                    className="rounded border-gray-700 bg-gray-900 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-xs text-gray-300">Enviar URL nas Msgs</span>
                            </label>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">Eventos a Escutar</label>
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_EVENTS.map(event => (
                                    <button
                                        key={event}
                                        type="button"
                                        onClick={() => toggleEvent(event)}
                                        className={clsx(
                                            "px-2 py-1 rounded text-xs border transition-colors",
                                            config.events.includes(event)
                                                ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                                                : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                                        )}
                                    >
                                        {event}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">Excluir dos eventos escutados</label>
                            <div className="flex flex-wrap gap-2">
                                {BLACKLIST_OPTIONS.map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => toggleBlacklist(opt)}
                                        className={clsx(
                                            "px-2 py-1 rounded text-xs border transition-colors",
                                            config.blacklist.includes(opt)
                                                ? "bg-green-500/20 border-green-500/50 text-green-300"
                                                : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                                        )}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-800 text-xs text-gray-400 space-y-2">
                                <p><span className="text-gray-300 font-bold">wasSentByApi:</span> Evita que a automação entre em loop infinito ao processar suas próprias mensagens.</p>
                                <p><span className="text-gray-300 font-bold">isGroupYes:</span> Ignora todas as mensagens vindas de grupos.</p>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                                Salvar Configurações
                            </button>
                        </div>
                    </form>
                )
            )}
        </Modal>
    )
}
