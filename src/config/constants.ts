// =============================================
// Q&A Categories
// =============================================
export const QA_CATEGORIES = {
    NON_IT_TRANSITION: 'Non-IT to IT Transition',
    MINDSET: 'Mindset',
    LEARNING: 'Learning',
    TECHNICAL_INTERVIEWS: 'Technical Interviews',
    RESUME: 'Resume',
    PROJECTS: 'Projects',
    HR_ROUND: 'HR Round',
    JOB_SEARCH: 'Job Search',
    AI_ROLES: 'AI Roles',
    ACADEMICS: 'Academics',
    NXTWAVE_SUPPORT: 'NxtWave Support',
} as const

export type QACategory = (typeof QA_CATEGORIES)[keyof typeof QA_CATEGORIES]

export const CATEGORY_KEYS = Object.keys(QA_CATEGORIES) as Array<keyof typeof QA_CATEGORIES>

export const ALL_CATEGORIES: QACategory[] = Object.values(QA_CATEGORIES)

// =============================================
// Processing statuses
// =============================================
export const PROCESSING_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    DONE: 'done',
    ERROR: 'error',
} as const

export type ProcessingStatus = (typeof PROCESSING_STATUS)[keyof typeof PROCESSING_STATUS]

// =============================================
// Category display metadata
// =============================================
export interface CategoryMeta {
    color: string
    bgColor: string
    borderColor: string
    emoji: string
    short: string
    // Themed card colors for Q&A cards
    cardEven: string
    cardOdd: string
    cardBorder: string
    cardHover: string
    answerEven: string
    answerOdd: string
    glowColor: string
    accentGradient: string
}

export const CATEGORY_META: Record<QACategory, CategoryMeta> = {
    // ── New pipeline categories ─────────────────────────────────
    'Mindset': {
        color: 'text-sky-600',
        bgColor: 'bg-sky-50',
        borderColor: 'border-sky-200',
        emoji: '🧠',
        short: 'Mindset',
        cardEven: 'bg-sky-50/60',
        cardOdd: 'bg-sky-50/90',
        cardBorder: 'border-sky-200',
        cardHover: 'hover:border-sky-400 hover:shadow-sky-100 hover:shadow-lg',
        answerEven: 'bg-sky-50/40',
        answerOdd: 'bg-sky-50/70',
        glowColor: 'shadow-sky-100',
        accentGradient: 'from-sky-100 to-transparent',
    },
    'Learning': {
        color: 'text-violet-600',
        bgColor: 'bg-violet-50',
        borderColor: 'border-violet-200',
        emoji: '📚',
        short: 'Learning',
        cardEven: 'bg-violet-50/60',
        cardOdd: 'bg-violet-50/90',
        cardBorder: 'border-violet-200',
        cardHover: 'hover:border-violet-400 hover:shadow-violet-100 hover:shadow-lg',
        answerEven: 'bg-violet-50/40',
        answerOdd: 'bg-violet-50/70',
        glowColor: 'shadow-violet-100',
        accentGradient: 'from-violet-100 to-transparent',
    },
    'Technical Interviews': {
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        borderColor: 'border-cyan-200',
        emoji: '💻',
        short: 'Tech Interview',
        cardEven: 'bg-cyan-50/60',
        cardOdd: 'bg-cyan-50/90',
        cardBorder: 'border-cyan-200',
        cardHover: 'hover:border-cyan-400 hover:shadow-cyan-100 hover:shadow-lg',
        answerEven: 'bg-cyan-50/40',
        answerOdd: 'bg-cyan-50/70',
        glowColor: 'shadow-cyan-100',
        accentGradient: 'from-cyan-100 to-transparent',
    },
    'Resume': {
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        emoji: '📄',
        short: 'Resume',
        cardEven: 'bg-amber-50/60',
        cardOdd: 'bg-amber-50/90',
        cardBorder: 'border-amber-200',
        cardHover: 'hover:border-amber-400 hover:shadow-amber-100 hover:shadow-lg',
        answerEven: 'bg-amber-50/40',
        answerOdd: 'bg-amber-50/70',
        glowColor: 'shadow-amber-100',
        accentGradient: 'from-amber-100 to-transparent',
    },
    'Projects': {
        color: 'text-fuchsia-600',
        bgColor: 'bg-fuchsia-50',
        borderColor: 'border-fuchsia-200',
        emoji: '🛠️',
        short: 'Projects',
        cardEven: 'bg-fuchsia-50/60',
        cardOdd: 'bg-fuchsia-50/90',
        cardBorder: 'border-fuchsia-200',
        cardHover: 'hover:border-fuchsia-400 hover:shadow-fuchsia-100 hover:shadow-lg',
        answerEven: 'bg-fuchsia-50/40',
        answerOdd: 'bg-fuchsia-50/70',
        glowColor: 'shadow-fuchsia-100',
        accentGradient: 'from-fuchsia-100 to-transparent',
    },
    'HR Round': {
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        borderColor: 'border-pink-200',
        emoji: '🗣️',
        short: 'HR Round',
        cardEven: 'bg-pink-50/60',
        cardOdd: 'bg-pink-50/90',
        cardBorder: 'border-pink-200',
        cardHover: 'hover:border-pink-400 hover:shadow-pink-100 hover:shadow-lg',
        answerEven: 'bg-pink-50/40',
        answerOdd: 'bg-pink-50/70',
        glowColor: 'shadow-pink-100',
        accentGradient: 'from-pink-100 to-transparent',
    },
    'Job Search': {
        color: 'text-teal-600',
        bgColor: 'bg-teal-50',
        borderColor: 'border-teal-200',
        emoji: '🔍',
        short: 'Job Search',
        cardEven: 'bg-teal-50/60',
        cardOdd: 'bg-teal-50/90',
        cardBorder: 'border-teal-200',
        cardHover: 'hover:border-teal-400 hover:shadow-teal-100 hover:shadow-lg',
        answerEven: 'bg-teal-50/40',
        answerOdd: 'bg-teal-50/70',
        glowColor: 'shadow-teal-100',
        accentGradient: 'from-teal-100 to-transparent',
    },
    'AI Roles': {
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
        borderColor: 'border-rose-200',
        emoji: '🤖',
        short: 'AI Roles',
        cardEven: 'bg-rose-50/60',
        cardOdd: 'bg-rose-50/90',
        cardBorder: 'border-rose-200',
        cardHover: 'hover:border-rose-400 hover:shadow-rose-100 hover:shadow-lg',
        answerEven: 'bg-rose-50/40',
        answerOdd: 'bg-rose-50/70',
        glowColor: 'shadow-rose-100',
        accentGradient: 'from-rose-100 to-transparent',
    },
    'Academics': {
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        emoji: '🎓',
        short: 'Academics',
        cardEven: 'bg-emerald-50/60',
        cardOdd: 'bg-emerald-50/90',
        cardBorder: 'border-emerald-200',
        cardHover: 'hover:border-emerald-400 hover:shadow-emerald-100 hover:shadow-lg',
        answerEven: 'bg-emerald-50/40',
        answerOdd: 'bg-emerald-50/70',
        glowColor: 'shadow-emerald-100',
        accentGradient: 'from-emerald-100 to-transparent',
    },
    'NxtWave Support': {
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        emoji: '🌊',
        short: 'Nxtwave Support',
        cardEven: 'bg-blue-50/60',
        cardOdd: 'bg-blue-50/90',
        cardBorder: 'border-blue-200',
        cardHover: 'hover:border-blue-400 hover:shadow-blue-100 hover:shadow-lg',
        answerEven: 'bg-blue-50/40',
        answerOdd: 'bg-blue-50/70',
        glowColor: 'shadow-blue-100',
        accentGradient: 'from-blue-100 to-transparent',
    },
    'Non-IT to IT Transition': {
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        emoji: '🔄',
        short: 'Non-IT Switch',
        cardEven: 'bg-purple-50/60',
        cardOdd: 'bg-purple-50/90',
        cardBorder: 'border-purple-200',
        cardHover: 'hover:border-purple-400 hover:shadow-purple-100 hover:shadow-lg',
        answerEven: 'bg-purple-50/40',
        answerOdd: 'bg-purple-50/70',
        glowColor: 'shadow-purple-100',
        accentGradient: 'from-purple-100 to-transparent',
    },
}

// =============================================
// App constants
// =============================================
export const APP_NAME = 'PlacementIQ'
export const APP_TAGLINE = 'Alumni knowledge, instantly accessible'

/** Student sidebar "Placements Overview" + admin home; `DashboardPage` shows `StudentHomepage` for students here */
export const PLACEMENTS_OVERVIEW_PATH = '/'

/** Magic-link / exchange token handling (`AuthCallbackPage`) — must match route path */
export const AUTH_CALLBACK_PATH = '/auth/callback'

/** Admin login screen; operational hub lives under `/admin/...` */
export const ADMIN_BASE_PATH = '/admin'
export const ADMIN_DASHBOARD_PATH = '/admin/dashboard'
export const ADMIN_MASTER_QUESTIONS_PATH = '/admin/master-questions'
export const ADMIN_TRANSCRIPTS_PATH = '/admin/transcripts'
export const ADMIN_ALUMNI_PATH = '/admin/alumni'
export const ADMIN_SUBMISSIONS_PATH = '/admin/submissions'
export const DEFAULT_AVATAR_URL = 'https://ui-avatars.com/api/?background=0b69ff&color=fff&size=64'
