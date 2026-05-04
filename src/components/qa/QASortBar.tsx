import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X, ThumbsDown, Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { QASortOption } from '../../services/qaService'
import type { QACategory } from '../../config/constants'

interface QASortBarProps {
    sort: QASortOption
    onSortChange: (sort: QASortOption) => void
    isAdmin?: boolean
    categories?: QACategory[]
    selectedCategory?: QACategory
    onCategoryChange?: (category: QACategory | undefined) => void
    companies?: string[]
    selectedCompany?: string
    onCompanyChange?: (company: string | undefined) => void
    skillSets?: string[]
    selectedSkillSet?: string
    onSkillSetChange?: (skillSet: string | undefined) => void
    roles?: string[]
    selectedRole?: string
    onRoleChange?: (role: string | undefined) => void
    onNotHelpfulClick?: () => void
    search?: string
    onSearchChange?: (q: string) => void
}

const SORT_OPTIONS: { value: QASortOption; label: string }[] = [
    { value: 'most_asked',    label: '⭐ Frequently Asked' },
    { value: 'highest_score', label: '🔥 Top Score'        },
    { value: 'most_useful',   label: '👍 Top Rated'        },
]

// ── Searchable Select (mirrors AlumniJourneyPage pattern) ──────────────
function SearchableSelect({ label, value, onChange, options, fullWidth }: {
    label: string; value: string; onChange: (v: string) => void; options: { label: string; value: string }[]
    fullWidth?: boolean
}) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [openLeft, setOpenLeft] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const active = value !== ''

    const filtered = query ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase())) : options

    const handleOpen = () => {
        if (!open && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            setOpenLeft(rect.left + 224 > window.innerWidth - 16)
        }
        setOpen(o => !o)
        setTimeout(() => inputRef.current?.focus(), 0)
    }

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) { setOpen(false); setQuery('') }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div className={cn('relative', fullWidth && 'w-full')} ref={containerRef}>
            <button
                onClick={handleOpen}
                className={cn(
                    'appearance-none flex items-center gap-1.5 pl-3 pr-8 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer outline-none shadow-sm',
                    fullWidth && 'w-full',
                    active ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-slate-600 border-blue-100 hover:border-blue-300'
                )}
            >
                <Search className="w-3 h-3 shrink-0" />
                {active ? options.find(o => o.value === value)?.label ?? label : label}
            </button>
            <ChevronDown className={cn('absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none', active ? 'text-white/70' : 'text-slate-400')} />

            {open && (
                <div className={`absolute z-50 top-full mt-1 ${openLeft ? 'right-0' : 'left-0'} w-56 sm:w-64 bg-white border border-blue-100 rounded-xl shadow-lg overflow-hidden`}>
                    <div className="p-2 border-b border-slate-50">
                        <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
                            placeholder={`Search ${label.toLowerCase()}...`}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        <button onClick={() => { onChange(''); setOpen(false); setQuery('') }}
                            className={cn('w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition-colors', !active && 'font-bold text-blue-600')}>
                            All {label}s
                        </button>
                        {filtered.map(o => (
                            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); setQuery('') }}
                                className={cn('w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition-colors truncate', value === o.value && 'font-bold text-blue-600 bg-blue-50')}>
                                {o.label}
                            </button>
                        ))}
                        {filtered.length === 0 && <p className="px-3 py-2 text-xs text-slate-400">No matches</p>}
                    </div>
                </div>
            )}
        </div>
    )
}

export function QASortBar({
    sort, onSortChange,
    isAdmin = false,
    categories, selectedCategory, onCategoryChange,
    companies, selectedCompany, onCompanyChange,
    skillSets, selectedSkillSet, onSkillSetChange,
    roles, selectedRole, onRoleChange,
    onNotHelpfulClick,
    search, onSearchChange,
}: QASortBarProps) {
    const [filtersOpen, setFiltersOpen] = useState(false)

    const handleSortClick = (value: QASortOption) => {
        onSortChange(sort === value ? 'newest' : value)
    }

    const visibleOptions = isAdmin
        ? SORT_OPTIONS
        : SORT_OPTIONS.filter(opt => opt.value !== 'highest_score')

    const hasFilters = (categories && categories.length > 0 && onCategoryChange) ||
        (companies && companies.length > 0 && onCompanyChange) ||
        (skillSets && onSkillSetChange) ||
        (roles && roles.length > 0 && onRoleChange)

    const activeFilterCount = [selectedCategory, selectedCompany, selectedSkillSet, selectedRole].filter(Boolean).length

    const clearAll = () => {
        onCategoryChange?.(undefined)
        onCompanyChange?.(undefined)
        onSkillSetChange?.(undefined)
        onRoleChange?.(undefined)
    }

    return (
        <div className="flex flex-col gap-3 mb-5">

            {/* Search bar */}
            {onSearchChange && (
                <div className="relative w-full max-w-sm">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        value={search ?? ''}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder="Search e.g. 'resume tips', 'Capgemini', 'self intro'"
                        className="w-full pl-10 pr-4 py-2.5 rounded-full text-sm border border-blue-100 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                    {search && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            )}

            {/* Sort + Filter row */}
            <div className="flex flex-wrap items-center gap-2">

                {/* Filter & Search button */}
                {hasFilters && (
                    <button
                        onClick={() => setFiltersOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 transition-all shrink-0"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filter & Search
                        {activeFilterCount > 0 && (
                            <span className="bg-white text-blue-600 px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none">{activeFilterCount}</span>
                        )}
                    </button>
                )}

                {/* Divider */}
                {hasFilters && <div className="h-6 w-px bg-blue-100 shrink-0" />}

                {/* Sort pills */}
                {visibleOptions.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => handleSortClick(opt.value)}
                        className={cn(
                            'px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border',
                            sort === opt.value
                                ? 'bg-blue-900 text-white border-blue-900 shadow-lg shadow-blue-100'
                                : 'bg-white text-slate-500 border-blue-50 hover:border-blue-200'
                        )}
                    >
                        {opt.label}
                    </button>
                ))}

                {/* Active filter chips */}
                {selectedCategory && onCategoryChange && (
                    <span className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
                        {selectedCategory}
                        <button onClick={() => onCategoryChange(undefined)}><X className="w-3 h-3 text-blue-400 hover:text-blue-700" /></button>
                    </span>
                )}
                {selectedCompany && onCompanyChange && (
                    <span className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full max-w-[160px] truncate">
                        {selectedCompany}
                        <button onClick={() => onCompanyChange(undefined)} className="shrink-0"><X className="w-3 h-3 text-blue-400 hover:text-blue-700" /></button>
                    </span>
                )}
                {selectedSkillSet && onSkillSetChange && (
                    <span className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
                        {selectedSkillSet}
                        <button onClick={() => onSkillSetChange(undefined)}><X className="w-3 h-3 text-blue-400 hover:text-blue-700" /></button>
                    </span>
                )}
                {selectedRole && onRoleChange && (
                    <span className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
                        {selectedRole}
                        <button onClick={() => onRoleChange(undefined)}><X className="w-3 h-3 text-blue-400 hover:text-blue-700" /></button>
                    </span>
                )}
                {activeFilterCount > 0 && (
                    <button onClick={clearAll} className="text-xs text-red-500 font-bold hover:text-red-600 transition-colors shrink-0">Clear all</button>
                )}

                {/* Not Helpful admin button */}
                {isAdmin && onNotHelpfulClick && (
                    <button
                        onClick={onNotHelpfulClick}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border bg-white text-rose-500 border-rose-100 hover:border-rose-300 hover:bg-rose-50 transition-all whitespace-nowrap shrink-0 ml-auto"
                    >
                        <ThumbsDown className="w-3 h-3" />
                        Not Helpful
                    </button>
                )}
            </div>

            {/* Slide-out filter panel */}
            {filtersOpen && (
                <>
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40" onClick={() => setFiltersOpen(false)} />
                    <div className="fixed right-0 top-0 h-full w-72 bg-white shadow-2xl z-50 flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-600 shrink-0 bg-blue-600">
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-wide">Filter Q&A</h3>
                                <p className="text-[10px] text-blue-200 font-medium mt-0.5">
                                    {activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active` : 'Narrow down results'}
                                </p>
                            </div>
                            <button onClick={() => setFiltersOpen(false)} className="p-2 rounded-xl hover:bg-blue-700 text-blue-200 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-5">

                            {/* Category */}
                            {categories && categories.length > 0 && onCategoryChange && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Category</p>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => onCategoryChange(selectedCategory === cat ? undefined : cat)}
                                                className={cn(
                                                    'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                                                    selectedCategory === cat
                                                        ? 'bg-blue-900 text-white border-blue-900'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                                )}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Company */}
                            {companies && companies.length > 0 && onCompanyChange && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Company</p>
                                    <SearchableSelect
                                        label="All Companies"
                                        value={selectedCompany ?? ''}
                                        onChange={v => onCompanyChange(v || undefined)}
                                        options={companies.map(c => ({ label: c, value: c }))}
                                        fullWidth
                                    />
                                </div>
                            )}

                            {/* Skill Sets */}
                            {skillSets && skillSets.length > 0 && onSkillSetChange && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Skill Set</p>
                                    <SearchableSelect
                                        label="All Skill Sets"
                                        value={selectedSkillSet ?? ''}
                                        onChange={v => onSkillSetChange(v || undefined)}
                                        options={skillSets.map(s => ({ label: s, value: s }))}
                                        fullWidth
                                    />
                                </div>
                            )}

                            {/* Role */}
                            {roles && roles.length > 0 && onRoleChange && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Role</p>
                                    <SearchableSelect
                                        label="All Roles"
                                        value={selectedRole ?? ''}
                                        onChange={v => onRoleChange(v || undefined)}
                                        options={roles.map(r => ({ label: r, value: r }))}
                                        fullWidth
                                    />
                                </div>
                            )}
                        </div>

                        {activeFilterCount > 0 && (
                            <div className="px-5 py-4 border-t border-slate-100 shrink-0">
                                <button
                                    onClick={() => { clearAll(); setFiltersOpen(false) }}
                                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" /> Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
