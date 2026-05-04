import { useState } from 'react'

const CLIENT_ID = import.meta.env.VITE_BRANDFETCH_CLIENT_ID as string

/**
 * Extracts a usable domain from a full URL or bare domain string.
 * e.g. "https://www.adp.com/some/path" → "adp.com"
 */
export function extractDomain(url: string): string {
    try {
        const full = url.startsWith('http') ? url : `https://${url}`
        return new URL(full).hostname.replace(/^www\./, '')
    } catch {
        return url
    }
}

/**
 * Guesses a domain from a company name.
 * e.g. "ADP" → "adp.com", "Wipro Limited" → "wipro.com"
 */
function guessDomain(name: string): string {
    return name
        .toLowerCase()
        .replace(/\b(pvt|ltd|limited|inc|corp|solutions|technologies|tech|systems|services|group|global|india)\b/gi, '')
        .replace(/[^a-z0-9]/g, '')
        .trim() + '.com'
}

const sizeMap = {
    sm: 'w-8 h-8 text-[9px]',
    md: 'w-10 h-10 text-[11px]',
    lg: 'w-14 h-14 text-sm',
}

const imgSizeMap = { sm: 32, md: 40, lg: 56 }

interface CompanyLogoProps {
    /** Pass the extracted domain (e.g. "adp.com") when you have a company_url */
    domain?: string
    /** Always required — used for guessing when domain is absent, and for the initials fallback */
    companyName: string
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function CompanyLogo({ domain, companyName, size = 'md', className = '' }: CompanyLogoProps) {
    const [failed, setFailed] = useState(false)

    const resolvedDomain = domain ?? guessDomain(companyName)
    const px = imgSizeMap[size]
    const initials = companyName.trim().slice(0, 2).toUpperCase()
    const sizeClass = sizeMap[size]

    if (failed || !CLIENT_ID) {
        return (
            <div
                className={`${sizeClass} rounded-lg bg-[#0b4b8c] text-white flex items-center justify-center font-black shrink-0 ${className}`}
            >
                {initials}
            </div>
        )
    }

    return (
        <img
            src={`https://cdn.brandfetch.io/${resolvedDomain}/fallback/lettermark/type/icon?c=${CLIENT_ID}&w=${px}&h=${px}`}
            alt={companyName}
            width={px}
            height={px}
            onError={() => setFailed(true)}
            className={`${sizeClass} rounded-lg object-contain bg-white border border-slate-100 shrink-0 ${className}`}
        />
    )
}
