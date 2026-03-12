export class PianoAudio {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.5;
        this.isMuted = false;
    }

    async playNote(note, isHover = false) {
        if (this.isMuted) return;

        if (this.ctx.state === 'suspended') {
            if (isHover) {
                // If it's a hover and context is suspended, don't schedule notes. 
                // This prevents the "explosion" bug when they interact later.
                this.ctx.resume();
                return;
            } else {
                // If it's a click/touch, wait for full resume before playing.
                await this.ctx.resume();
            }
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.value = this.getFreq(note);
        osc.type = 'triangle';

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1);

        osc.start();
        osc.stop(this.ctx.currentTime + 1);
    }

    async playChord(isHover = false) {
        if (this.isMuted) return;
        
        if (this.ctx.state === 'suspended') {
            if (isHover) {
                this.ctx.resume();
                return;
            } else {
                await this.ctx.resume();
            }
        }

        ['C4', 'E4', 'G4', 'C5'].forEach((note, i) => {
            setTimeout(() => this.playNote(note, isHover), i * 100);
        });
    }

    getFreq(note) {
        const freqs = {
            'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
            'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
            'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
            'C5': 523.25
        };
        return freqs[note] || 440;
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.masterGain.gain.value = this.isMuted ? 0 : 0.5;
        return this.isMuted;
    }
}
