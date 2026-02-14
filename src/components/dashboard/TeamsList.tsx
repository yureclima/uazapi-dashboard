'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { createTeamAction, deleteTeamAction, addMembersAction, removeMemberAction } from '@/app/actions/team-actions'
import { Trash2, UserPlus, Users, X, Check } from 'lucide-react'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'

type Team = {
    id: string
    name: string
    members: { user_id: string, role: string, profile: { email: string } }[]
}

type Profile = { id: string, email: string }

export default function TeamsList({
    teams,
    availableProfiles
}: {
    teams: Team[],
    availableProfiles: Profile[]
}) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Forms
    const [newTeamName, setNewTeamName] = useState('')
    const [selectedEmails, setSelectedEmails] = useState<string[]>([])

    const router = useRouter()

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const result = await createTeamAction(newTeamName)
        setLoading(false)
        if (result.success) {
            setIsCreateOpen(false)
            setNewTeamName('')
            router.refresh()
        } else {
            alert(result.error)
        }
    }

    const handleDeleteTeam = async (id: string) => {
        if (!confirm('Tem certeza? Isso removerá o time e todas associações.')) return
        await deleteTeamAction(id)
        router.refresh()
    }

    const openAddMember = (teamId: string) => {
        setSelectedTeamId(teamId)
        setIsAddMemberOpen(true)
    }

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedTeamId || selectedEmails.length === 0) return
        setLoading(true)
        const result = await addMembersAction(selectedTeamId, selectedEmails)
        setLoading(false)
        if (result.success) {
            setIsAddMemberOpen(false)
            setSelectedEmails([])
            router.refresh()
        } else {
            alert(result.error)
        }
    }

    const toggleEmailSelection = (email: string) => {
        setSelectedEmails(prev =>
            prev.includes(email)
                ? prev.filter(e => e !== email)
                : [...prev, email]
        )
    }

    const handleRemoveMember = async (teamId: string, userId: string) => {
        if (!confirm('Remover membro do time?')) return
        await removeMemberAction(teamId, userId)
        router.refresh()
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                    <Users className="h-4 w-4" />
                    Criar Novo Time
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {teams.map(team => (
                    <div key={team.id} className="relative group overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 p-5 backdrop-blur-sm transition-all hover:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white">{team.name}</h3>
                                <p className="text-xs text-gray-500">{team.members.length} membros</p>
                            </div>
                            <button
                                onClick={() => handleDeleteTeam(team.id)}
                                className="text-gray-600 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-2 mb-4">
                            {team.members.length === 0 ? (
                                <p className="text-xs text-gray-600 italic">Nenhum membro adicionado.</p>
                            ) : (
                                <ul className="space-y-1">
                                    {team.members.map(m => (
                                        <li key={m.user_id} className="flex justify-between items-center text-sm bg-gray-800/50 p-2 rounded">
                                            <span className="text-gray-300 truncate max-w-[150px]">{m.profile?.email || 'Unknown'}</span>
                                            <button
                                                onClick={() => handleRemoveMember(team.id, m.user_id)}
                                                className="text-gray-500 hover:text-red-400"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <button
                            onClick={() => openAddMember(team.id)}
                            className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-700 py-2 text-xs font-medium text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
                        >
                            <UserPlus className="h-3 w-3" />
                            Adicionar Membro
                        </button>
                    </div>
                ))}
            </div>

            {/* Modal Create Team */}
            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Criar Novo Time">
                <form onSubmit={handleCreateTeam} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Nome do Time</label>
                        <input
                            value={newTeamName}
                            onChange={e => setNewTeamName(e.target.value)}
                            className="w-full rounded-lg bg-gray-950 border border-gray-700 px-3 py-2 text-white focus:ring-indigo-500"
                            placeholder="Ex: Comercial, Suporte, Marketing"
                            required
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Criando...' : 'Criar Time'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Add Member */}
            <Modal isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} title="Adicionar Membros ao Time">
                <form onSubmit={handleAddMember} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Selecionar Usuários</label>
                        <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-800 bg-gray-950 p-2 space-y-1 custom-scrollbar">
                            {availableProfiles.length === 0 ? (
                                <p className="text-sm text-gray-500 p-2 text-center py-8">Nenhum usuário cadastrado disponível.</p>
                            ) : (
                                availableProfiles.map(p => (
                                    <label
                                        key={p.id}
                                        className={clsx(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors group",
                                            selectedEmails.includes(p.email)
                                                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                                : "hover:bg-gray-900 text-gray-400 border border-transparent"
                                        )}
                                    >
                                        <div className={clsx(
                                            "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                                            selectedEmails.includes(p.email)
                                                ? "bg-indigo-600 border-indigo-600"
                                                : "border-gray-700 bg-gray-800 group-hover:border-gray-600"
                                        )}>
                                            {selectedEmails.includes(p.email) && <Check className="h-2.5 w-2.5 text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={selectedEmails.includes(p.email)}
                                            onChange={() => toggleEmailSelection(p.email)}
                                            className="sr-only"
                                        />
                                        <span className="text-sm truncate font-medium">{p.email}</span>
                                    </label>
                                ))
                            )}
                        </div>
                        <p className="mt-2 text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                            {selectedEmails.length} selecionado(s)
                        </p>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={loading || selectedEmails.length === 0}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                        >
                            {loading ? 'Adicionando...' : 'Adicionar Selecionados'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
