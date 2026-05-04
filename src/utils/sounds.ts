export function playBubbleSound() {
    try {
        const ctx = new AudioContext()

        // Bubble pop: quick pitch drop with soft envelope
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(680, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.12)
        gain.gain.setValueAtTime(0.22, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.15)
    } catch { /* silently ignore */ }
}
