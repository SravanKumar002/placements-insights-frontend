import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { playBubbleSound } from '../../../utils/sounds'

export function PosterPreview() {
    const [clicked, setClicked] = useState(false)
    const navigate = useNavigate()

    const handleClick = () => {
        playBubbleSound()
        setClicked(true)
        setTimeout(() => navigate('/posters'), 280)
    }

    return (
        <div
            onClick={handleClick}
            className={`group relative rounded-2xl overflow-hidden cursor-pointer flex flex-col sm:flex-row h-full
                       shadow-xl shadow-brand-100/60 hover:shadow-2xl hover:shadow-brand-300/40 hover:-translate-y-1
                       border border-brand-200 hover:border-brand-400
                       transition-all duration-300 ease-out select-none bg-white
                       ${clicked ? 'scale-[1.02] shadow-2xl' : 'scale-100'}`}
        >
            {/* Image */}
            <div className="w-full h-48 sm:w-1/4 sm:h-auto shrink-0 overflow-hidden">
                <img
                    src="/Image-17.jpg"
                    alt="Academy Hiring Pulse"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                />
            </div>

            {/* Info panel */}
            <div className="flex-1 p-5 pl-7 border-t border-brand-100 sm:border-t-0 sm:border-l flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl transition-transform duration-300 group-hover:-translate-y-1 inline-block">📈</span>
                    <p className="font-extrabold text-surface-900 text-2xl leading-tight">Academy Hiring Pulse</p>
                </div>
                <p className="text-lg font-medium text-surface-700">See what's happening in placements.</p>
                <ul className="flex flex-col gap-1 mt-1">
                    {['Students Hired recently', 'Skills companies are asking', 'New opportunities shared'].map(item => (
                        <li key={item} className="flex items-center gap-1.5 text-lg text-surface-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" /> {item}
                        </li>
                    ))}
                </ul>
                <div className="mt-1">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-50 border border-brand-200 text-brand-600 text-sm font-semibold group-hover:bg-brand-100 group-hover:border-brand-400 transition-all duration-300">
                        Click to Explore <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                </div>
            </div>
        </div>
    )
}
