'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="relative w-full max-w-lg transform overflow-hidden rounded-xl bg-gray-900 border border-gray-800 shadow-2xl transition-all sm:my-8">
                <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white leading-6">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-md text-gray-400 hover:text-white focus:outline-none"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="px-6 py-4">
                    {children}
                </div>
            </div>
        </div>
    )
}
