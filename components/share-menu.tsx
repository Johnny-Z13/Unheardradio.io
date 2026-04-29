'use client'

import { useEffect, useRef, useState } from 'react'
import { Share2, Link as LinkIcon, Check, MessageCircle, Send, Mail, X } from 'lucide-react'
import { RadioStation } from '@/types/radio'
import { useToast } from '@/hooks/use-toast'

interface ShareMenuProps {
  station: RadioStation
  className?: string
  iconClassName?: string
  trigger?: React.ReactNode
}

function buildShareData(station: RadioStation) {
  const url = `${window.location.origin}/?station=${station.stationuuid}`
  const title = `${station.name} — Unheard Radio`
  const text = `Found with UnheardRadio.io: ${station.name}${station.country ? ` from ${station.country}` : ''}`
  return { url, title, text, full: `${text} — ${url}` }
}

export function ShareMenu({ station, className, iconClassName, trigger }: ShareMenuProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const data = buildShareData(station)

    // Mobile: try native share sheet first (gives WhatsApp/Telegram/etc natively)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: data.title, text: data.text, url: data.url })
        return
      } catch (err) {
        // User cancelled or share failed — fall through to menu
        if ((err as Error)?.name === 'AbortError') return
      }
    }

    // Desktop or native share unavailable: open menu
    setOpen(v => !v)
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const { full } = buildShareData(station)
    try {
      await navigator.clipboard.writeText(full)
      setCopied(true)
      toast({ title: 'Link copied', description: 'Share text copied to clipboard' })
      setTimeout(() => setCopied(false), 1500)
      setTimeout(() => setOpen(false), 600)
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Could not access clipboard',
        variant: 'destructive',
      })
    }
  }

  const stop = (e: React.MouseEvent) => e.stopPropagation()

  const { url, text, full } = open ? buildShareData(station) : { url: '', text: '', full: '' }

  return (
    <div ref={containerRef} className={`relative inline-block ${className ?? ''}`}>
      <button
        onClick={handleClick}
        title="Share"
        className={iconClassName ?? 'w-7 h-7 rounded-full border border-vdu-green-dim text-vdu-green-dim hover:border-vdu-green hover:text-vdu-green transition-all flex items-center justify-center'}
      >
        {trigger ?? <Share2 className="w-3 h-3" />}
      </button>

      {open && (
        <div
          onClick={stop}
          role="menu"
          className="absolute right-0 top-full mt-2 z-[60] w-56 rounded-lg border border-vdu-green-dim bg-black/95 backdrop-blur p-1 shadow-xl"
        >
          <div className="flex items-center justify-between px-2 py-1.5 text-xs text-vdu-green-dim">
            <span>Share station</span>
            <button
              onClick={() => setOpen(false)}
              className="text-vdu-green-dim hover:text-vdu-green"
              aria-label="Close share menu"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2 px-2 py-2 text-sm text-vdu-green hover:bg-vdu-green/10 rounded font-mono"
          >
            {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy link'}</span>
          </button>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(full)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-2 px-2 py-2 text-sm text-vdu-green hover:bg-vdu-green/10 rounded font-mono"
            onClick={() => setOpen(false)}
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>

          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-2 px-2 py-2 text-sm text-vdu-green hover:bg-vdu-green/10 rounded font-mono"
            onClick={() => setOpen(false)}
          >
            <Send className="w-4 h-4" />
            <span>Telegram</span>
          </a>

          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-2 px-2 py-2 text-sm text-vdu-green hover:bg-vdu-green/10 rounded font-mono"
            onClick={() => setOpen(false)}
          >
            <X className="w-4 h-4" />
            <span>X / Twitter</span>
          </a>

          <a
            href={`mailto:?subject=${encodeURIComponent(`${station.name} — Unheard Radio`)}&body=${encodeURIComponent(full)}`}
            className="w-full flex items-center gap-2 px-2 py-2 text-sm text-vdu-green hover:bg-vdu-green/10 rounded font-mono"
            onClick={() => setOpen(false)}
          >
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </a>
        </div>
      )}
    </div>
  )
}
