import Slider from './Slider.js';

export default class VUMeterSlider extends Slider {
    constructor(id, options = {}) {
        super(id, options);
        this.analyser = null;
        this.dataArray = null;
        this.canvas = null;
        this.canvasCtx = null;
        this.rafId = null;
        this.smoothing = options.smoothing || 0.8;
    }

    initialize() {
        super.initialize();
        
        // Crea container per slider e VU meter
        const container = document.createElement('div');
        container.className = 'vu-meter-slider-container';
        
        // Crea canvas per VU meter
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'vu-meter';
        
        // Imposta dimensioni iniziali del canvas
        this.canvas.width = 30;  // Stessa larghezza del container
        this.canvas.height = 200; // Altezza iniziale
        
        this.canvasCtx = this.canvas.getContext('2d');
        
        // Inserisci canvas e slider nel container
        container.appendChild(this.canvas);
        container.appendChild(this.element);
        
        // Aggiorna il riferimento all'elemento principale
        this.element = container;
        
        // Forza un ridisegno iniziale
        requestAnimationFrame(() => {
            this.drawVUMeter();
        });

        
    }

    setupAnalyser(audioContext, inputNode) {
        this.analyser = audioContext.createAnalyser();
        this.analyser.fftSize = 1024;
        this.analyser.smoothingTimeConstant = this.smoothing;
        
        this.dataArray = new Float32Array(this.analyser.frequencyBinCount);
        inputNode.connect(this.analyser);
        
        this.startVUMeter();
    }

    startVUMeter() {
        const draw = () => {
            this.rafId = requestAnimationFrame(draw);
            this.drawVUMeter();
        };
        draw();
    }

    drawVUMeter() {
        if (!this.analyser || !this.canvas || !this.canvasCtx) return;
        
        const ctx = this.canvasCtx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (this.analyser) {
            // Get audio data
            this.analyser.getFloatTimeDomainData(this.dataArray);
            
            // Calculate RMS
            let rms = 0;
            for (let i = 0; i < this.dataArray.length; i++) {
                rms += this.dataArray[i] * this.dataArray[i];
            }
            rms = Math.sqrt(rms / this.dataArray.length);
            
            // Convert to dB
            const db = 20 * Math.log10(Math.max(rms, 0.0000001));
            
            // Map dB to height (-60dB to 0dB)
            const level = Math.max(0, Math.min(1, (db + 60) / 60));

            // Draw level (dal basso verso l'alto)
            const levelHeight = Math.floor(height * level);
            const gradient = ctx.createLinearGradient(0, height, 0, 0);
            gradient.addColorStop(0, '#0f0');    // Green
            gradient.addColorStop(0.6, '#ff0');   // Yellow
            gradient.addColorStop(1, '#f00');     // Red

            ctx.fillStyle = gradient;
            ctx.fillRect(0, height - levelHeight, width, levelHeight);
        }
    }

    cleanup() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        if (this.analyser) {
            this.analyser.disconnect();
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
}
