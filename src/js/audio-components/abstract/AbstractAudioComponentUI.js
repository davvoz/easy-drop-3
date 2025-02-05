import EventEmitter from '../../utils/EventEmitter.js';

export default class AbstractAudioComponentUI extends EventEmitter {
    constructor(component, options = {}) {
        super();
        this.component = component;
        this.container = null;
        this.options = {
            className: 'audio-component',
            draggable: true,
            allowSequencer: true, // New option to enable/disable sequencer functionality
            ...options
        };

        this.controls = new Map();
        this.dragOffset = { x: 0, y: 0 };
        this.currentSequencerUI = null;
    }

    render(container) {
        if (!container) {
            throw new Error('Container element must be provided for rendering');
        }
        
        this.container = container;
        this.container.className = this.options.className;
        
        if (this.options.draggable) {
            this.container.style.position = 'absolute';
            this.container.style.cursor = 'move';
            this.setupDragHandlers();
        }
        
        try {
            this.buildUI();
            this.setupEventListeners();
        } catch (error) {
            console.error(`UI Build error for component ${this.component.id}:`, error);
            this.container.innerHTML = `<div class="error">Component rendering failed: ${error.message}</div>`;
        }
        
        if (this.options.allowSequencer) {
            this.addSequencerSection();
        }
        
        // Aggiungi riferimento al componente audio nell'elemento DOM
        this.container.__audioComponent = this.component;
        
        return this.container;
    }

    buildUI() {
        // Override in subclass to create UI elements
        throw new Error('buildUI() must be implemented by subclass');
    }

    setupEventListeners() {
        // Override in subclass to set up event listeners
        throw new Error('setupEventListeners() must be implemented by subclass');
    }

    setupDragHandlers() {
        const onMouseDown = (e) => {
            // Verifica se il click è avvenuto sulla toolbar o su aree non interattive
            const isToolbarClick = e.target.closest('.piano-roll-toolbar');
            const isInteractiveElement = e.target.closest('input, button, select, .note-block, .velocity-grid, .resize-handle, .piano-roll-grid');
            
            // Procedi con il drag solo se il click è sulla toolbar o su aree non interattive
            if (!isInteractiveElement || isToolbarClick) {
                this.dragOffset.x = e.clientX - this.container.offsetLeft;
                this.dragOffset.y = e.clientY - this.container.offsetTop;
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            }
        };

        const onMouseMove = (e) => {
            this.container.style.left = `${e.clientX - this.dragOffset.x}px`;
            this.container.style.top = `${e.clientY - this.dragOffset.y}px`;
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        this.container.addEventListener('mousedown', onMouseDown);
    }

    addControl(id, control) {
        this.controls.set(id, control);
        return control;
    }

    getControl(id) {
        return this.controls.get(id);
    }

    dispose() {
        this.controls.forEach(control => {
            if (control.dispose) control.dispose();
        });
        this.controls.clear();
        this.container.innerHTML = '';
    }

    addSequencerSection() {
        const sequencerSection = document.createElement('div');
        sequencerSection.className = 'sequencer-section';

        const sequencerControls = document.createElement('div');
        sequencerControls.className = 'sequencer-controls';

        const addSequencerBtn = document.createElement('button');
        addSequencerBtn.className = 'add-sequencer-btn';
        addSequencerBtn.textContent = 'Add Sequencer';
        sequencerControls.appendChild(addSequencerBtn);

        const sequencerTypeSelect = document.createElement('select');
        sequencerTypeSelect.className = 'sequencer-type-select';
        sequencerTypeSelect.innerHTML = `
            <option value="sequencer">Step Sequencer</option>
            <option value="pianoroll">Piano Roll</option>
        `;
        sequencerControls.appendChild(sequencerTypeSelect);

        const sequencerContainer = document.createElement('div');
        sequencerContainer.className = 'internal-sequencer-container';
        
        sequencerSection.appendChild(sequencerControls);
        sequencerSection.appendChild(sequencerContainer);
        
        this.container.appendChild(sequencerSection);

        // Setup sequencer event listeners
        this.setupSequencerEventListeners(addSequencerBtn, sequencerTypeSelect, sequencerContainer);
    }

    setupSequencerEventListeners(addSequencerBtn, sequencerTypeSelect, sequencerContainer) {
        addSequencerBtn.addEventListener('click', () => {
            const type = sequencerTypeSelect.value;
            this.addInternalSequencer(type, sequencerContainer);
        });

        this.component.on('sequencerChanged', (sequencer) => {
            if (!sequencer) {
                if (this.currentSequencerUI) {
                    sequencerContainer.innerHTML = '';
                    this.currentSequencerUI = null;
                }
            }
        });
    }

    async addInternalSequencer(type, container) {
        console.log('Adding internal sequencer:', type);
        if (this.component.getInternalSequencer()) {
            this.component.setInternalSequencer(null);
        }

        let sequencer, sequencerUI;
        if (type === 'sequencer') {
            const { default: Sequencer } = await import('../sequencer/Sequencer.js');
            const { default: SequencerUI } = await import('../sequencer/SequencerUI.js');
            
            sequencer = new Sequencer(`seq-${this.component.id}`, {
                rows: 4,
                columns: 16
            });
            sequencerUI = new SequencerUI(sequencer, { draggable: false });
        } else {
            const { default: PianoRoll } = await import('../piano-roll/PianoRoll.js');
            const { default: PianoRollUI } = await import('../piano-roll/PianoRollUI.js');
            
            sequencer = new PianoRoll(`piano-${this.component.id}`, {
                rows: 24,
                columns: 16,
                startNote: 48,
                pixelsPerStep: 30,
                stepsPerBeat: 4,
                beatsPerBar: 1
            });
            sequencerUI = new PianoRollUI(sequencer, { draggable: false });
        }

        await sequencer.initialize(this.component.audioContext);
        this.component.setInternalSequencer(sequencer);

        // Modifica qui per usare il riferimento corretto al transport
        const transportElement = document.querySelector('.transport-component');
        if (!transportElement) {
            console.warn('Transport element not found');
            return;
        }

        const transport = transportElement.__audioComponent;
        if (transport) {
            console.log('Found transport:', transport.id);
            transport.addSequence(sequencer);
            
            if (transport.isPlaying) {
                console.log('Transport is playing, starting sequence');
                sequencer.processTick(transport._currentTick);
            }
        } else {
            console.warn('Transport component not found in element:', transportElement);
        }

        container.innerHTML = '';
        this.currentSequencerUI = sequencerUI;
        sequencerUI.render(container);
    }
}
