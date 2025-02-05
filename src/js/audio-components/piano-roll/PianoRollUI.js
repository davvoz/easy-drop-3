import AbstractAudioComponentUI from '../abstract/AbstractAudioComponentUI.js';

export default class PianoRollUI extends AbstractAudioComponentUI {
    constructor(pianoRoll, options = {}) {
        super(pianoRoll, {
            className: 'piano-roll-component',
            ...options
        });
        
        this.state = {
            tool: 'draw',
            isDragging: false,
            dragStart: null,
            dragEnd: null,
            selection: new Set(),
            resizingNote: null,
            clipboard: [],
            velocityMode: false
        };

        this.component.on('beatsChanged', () => {
            this.buildGrid();
            this.refreshNotes();
        });
    }

    // Required method from AbstractAudioComponentUI
    setupEventListeners() {
        // Model events
        this.component.on('noteAdded', this.handleNoteAdded.bind(this));
        this.component.on('noteRemoved', this.handleNoteRemoved.bind(this));
        this.component.on('noteUpdated', this.handleNoteUpdated.bind(this));
        this.component.on('playheadMoved', this.updatePlayhead.bind(this));

        // DOM events
        const grid = this.container.querySelector('.piano-roll-grid');
        const velocityGrid = this.container.querySelector('.velocity-grid');
        if (!grid) return;

        // Cambiamo l'ordine degli event listener e aggiungiamo il mousedown sulla griglia
        this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
        velocityGrid.addEventListener('mousedown', this.handleVelocityMouseDown.bind(this));
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));
        window.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Add scroll sync
        const gridContainer = this.container.querySelector('.piano-roll-grid-container');
        const main = this.container.querySelector('.piano-roll-main');

        main.addEventListener('scroll', () => {
            // Only handle vertical scroll if needed
        });

        // Aggiungi sync per velocity grid
        gridContainer.addEventListener('scroll', () => {
            velocityGrid.style.left = `-${gridContainer.scrollLeft}px`;
        });
    }

    buildUI() {
        this.container.innerHTML = `
            <div class="piano-roll-container">
                <div class="piano-roll-toolbar"></div>
                <div class="piano-roll-content">
                    <div class="piano-roll-main">
                        <div class="piano-roll-grid-container">
                            <div class="piano-roll-grid"></div>
                            <div class="playhead"></div>
                        </div>
                        <div class="velocity-lane">
                            <div class="velocity-grid"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.buildToolbar();
        this.buildGrid();
        this.buildVelocityLane();
        this.refreshNotes();
    }

    buildToolbar() {
        const toolbar = this.container.querySelector('.piano-roll-toolbar');
        const tools = [
            { id: 'draw', icon: '✏️', label: 'Draw', tooltip: 'Draw notes (D)' },
            { id: 'select', icon: '◻️', label: 'Select', tooltip: 'Select notes (S)' },
            { id: 'erase', icon: '🗑️', label: 'Erase notes (E)' },
            { type: 'separator' },
            { id: 'velocity', icon: '📊', label: 'Velocity', tooltip: 'Velocity mode (V)', toggle: true, active: this.state.velocityMode },
            { type: 'separator' },
            { type: 'beats-control' }
        ];

        toolbar.innerHTML = '';
        tools.forEach(tool => {
            if (tool.type === 'separator') {
                const separator = document.createElement('div');
                separator.className = 'toolbar-separator';
                toolbar.appendChild(separator);
                return;
            }

            if (tool.type === 'beats-control') {
                const beatsControl = document.createElement('div');
                beatsControl.className = 'beats-control';
                beatsControl.innerHTML = `
                    <span class="beats-label">Bar:</span>
                    <select class="beats-select">
                        ${[1,2,3,4,5,6,7,8,9,10,12,16].map(num => 
                            `<option value="${num}" ${num === this.component.options.beatsPerBar ? 'selected' : ''}>
                                ${num}
                            </option>`
                        ).join('')}
                    </select>
                `;
                
                beatsControl.querySelector('select').addEventListener('change', (e) => {
                    const beats = parseInt(e.target.value);
                    this.component.setBeatsPerBar(beats);
                });
                
                toolbar.appendChild(beatsControl);
                return;
            }

            const button = document.createElement('button');
            button.className = `tool-button ${tool.id} ${
                (tool.toggle && tool.active) || (!tool.toggle && tool.id === this.state.tool) ? 'active' : ''
            }`;
            button.innerHTML = `
                <span class="tool-icon">${tool.icon}</span>
                <span class="tool-label">${tool.label}</span>
            `;
            button.title = tool.tooltip;

            button.addEventListener('click', () => {
                if (tool.toggle) {
                    this.toggleOption(tool.id);
                } else {
                    this.setTool(tool.id);
                }
            });

            toolbar.appendChild(button);
        });
    }

    toggleOption(option) {
        switch (option) {
            case 'velocity':
                this.state.velocityMode = !this.state.velocityMode;
                if (this.state.velocityMode) {
                    this.container.classList.add('velocity-mode');
                } else {
                    this.container.classList.remove('velocity-mode');
                }
                break;
        }
        this.buildToolbar(); // Refresh toolbar state
    }

    setTool(toolId) {
        this.state.tool = toolId;
        this.container.dataset.tool = toolId;
        this.buildToolbar();
    }

    buildGrid() {
        const grid = this.container.querySelector('.piano-roll-grid');
        const velocityGrid = this.container.querySelector('.velocity-grid');
        const { rows, columns, pixelsPerStep, stepsPerBeat, beatsPerBar } = this.component.options;

        // Imposta le dimensioni esatte
        const width = columns * pixelsPerStep;
        const height = rows * pixelsPerStep;
        
        grid.style.width = `${width}px`;
        grid.style.height = `${height}px`;
        velocityGrid.style.width = `${width}px`;
        
        // Pattern di sfondo per battute e beats
        const beatWidth = pixelsPerStep * stepsPerBeat;
        const barWidth = beatWidth * beatsPerBar;
        
        grid.style.backgroundImage = `
            linear-gradient(90deg, 
                rgba(255,255,255,0.1) 1px, 
                transparent 1px
            ),
            linear-gradient(90deg, 
                rgba(255,255,255,0.05) 1px, 
                transparent 1px
            ),
            linear-gradient(0deg, 
                rgba(255,255,255,0.05) 1px, 
                transparent 1px
            )
        `;
        
        grid.style.backgroundSize = `
            ${barWidth}px 100%,
            ${beatWidth}px 100%,
            ${pixelsPerStep}px ${pixelsPerStep}px
        `;
    }

    buildVelocityLane() {
        const velocityGrid = this.container.querySelector('.velocity-grid');
        const { columns } = this.component.options;
        const pixelsPerStep = this.component.options.pixelsPerStep;

        // Imposta dimensioni esatte
        const exactWidth = columns * pixelsPerStep;
        velocityGrid.style.width = `${exactWidth}px`;
        velocityGrid.style.minWidth = 'max-content';

        // Assicurati che la grid abbia uno sfondo visibile
        velocityGrid.style.background = 'var(--bg-dark)';
        
        // Aggiungi i markers della velocity se non esistono già
        if (!this.container.querySelector('.velocity-markers')) {
            const velocityLane = this.container.querySelector('.velocity-lane');
            const markers = document.createElement('div');
            markers.className = 'velocity-markers';
            markers.innerHTML = `
                <div class="velocity-marker">127</div>
                <div class="velocity-marker">96</div>
                <div class="velocity-marker">64</div>
                <div class="velocity-marker">32</div>
                <div class="velocity-marker">0</div>
            `;
            velocityLane.appendChild(markers);
        }
    }

    // Event handlers
    handleMouseDown(e) {
        if (e.target.closest('.resize-handle')) {
            this.handleResizeStart(e);
        } else if (e.target.closest('.note-block')) {
            this.handleNoteMouseDown(e);
        } else if (e.target.closest('.piano-roll-grid')) {
            this.handleGridMouseDown(e);
        }
    }

    handleMouseMove(e) {
        if (this.state.isDragging) {
            this.handleDragMove(e);
        } else if (this.state.resizingNote) {
            this.handleResizeMove(e);
        }
    }

    handleMouseUp() {
        if (this.state.isDragging) {
            this.finishDrag();
        } else if (this.state.resizingNote) {
            this.finishResize();
        }
    }

    handleNoteAdded(note) {
        this.renderNote(note);
    }

    handleNoteRemoved(note) {
        // Remove both note and its velocity bar
        const noteEl = this.container.querySelector(`#note-${note.row}-${note.col}`);
        const velocityBar = this.container.querySelector(`#velocity-${note.row}-${note.col}`);
        
        if (noteEl) noteEl.remove();
        if (velocityBar) velocityBar.remove();
    }

    handleNoteUpdated(note) {
        const noteEl = this.container.querySelector(`#note-${note.row}-${note.col}`);
        const velocityBar = this.container.querySelector(`#velocity-${note.row}-${note.col}`);

        if (noteEl && velocityBar) {
            const pixelsPerStep = this.component.options.pixelsPerStep;
            const newWidth = `${note.length * pixelsPerStep}px`; // Rimuoviamo il -2 anche qui
            
            noteEl.style.width = newWidth;
            velocityBar.style.width = newWidth;
            velocityBar.style.height = `${(note.velocity / 127) * 100}%`;
            velocityBar.querySelector('.velocity-value').textContent = note.velocity;
        }
    }

    handleGridMouseDown(e) {
        const grid = this.container.querySelector('.piano-roll-grid');
        const gridContainer = this.container.querySelector('.piano-roll-grid-container');
        const rect = gridContainer.getBoundingClientRect(); // Usiamo il rect del container invece che della grid
        
        // Calcola la posizione relativa al container scrollabile
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calcola la posizione considerando lo scroll
        const scrolledX = x + gridContainer.scrollLeft;
        const scrolledY = y + gridContainer.scrollTop;
        
        const col = Math.floor(scrolledX / this.component.options.pixelsPerStep);
        const row = this.component.options.rows - 1 - Math.floor(scrolledY / this.component.options.pixelsPerStep);

        // Validate click position
        if (row < 0 || row >= this.component.options.rows || 
            col < 0 || col >= this.component.options.columns) {
            return;
        }

        this.handleGridClick(row, col, e);
    }

    handleGridClick(row, col, e) {
        if (this.state.resizingNote) return;
        if (this.state.velocityMode) return;

        if (row < 0 || row >= this.component.options.rows || 
            col < 0 || col >= this.component.options.columns) {
            return;
        }

        // Se siamo in modalità velocity, non permettiamo di aggiungere note
        if (this.state.velocityMode) {
            return;
        }

        switch (this.state.tool) {
            case 'draw':
                if (!this.component.getNoteAt(row, col)) { // Verifica se la nota non esiste già
                    this.component.addNote(row, col);
                }
                break;
            case 'erase':
                this.component.removeNote(row, col);
                break;
            case 'select':
                this.startSelection(row, col, e.shiftKey);
                break;
        }

        this.state.isDragging = true;
        this.state.dragStart = { row, col };
    }

    handleVelocityMouseDown(e) {
        if (!this.state.velocityMode) return;

        const velocityGrid = e.currentTarget;
        const rect = velocityGrid.getBoundingClientRect();
        const gridContainer = this.container.querySelector('.piano-roll-grid-container');
        
        const updateVelocityFromEvent = (moveEvent) => {
            // Aggiusta il calcolo della x considerando lo scroll
            const x = moveEvent.clientX - rect.left + gridContainer.scrollLeft;
            const y = Math.min(Math.max(moveEvent.clientY, rect.top), rect.bottom) - rect.top;
            const col = Math.floor(x / this.component.options.pixelsPerStep);
            
            // Calcola il velocity (0-127) basato sulla posizione verticale
            const velocity = Math.round((1 - y / rect.height) * 127);
            
            // Trova la nota in questa colonna
            const notesInColumn = this.component.getAllNotes().filter(note => note.col === col);
            notesInColumn.forEach(note => {
                this.component.updateNote(note.row, note.col, { 
                    velocity: Math.max(0, Math.min(127, velocity)) 
                });
            });
        };

        // Aggiorna subito al click iniziale
        updateVelocityFromEvent(e);
        
        const handleDrag = (moveEvent) => {
            if (this.state.isDragging) {
                updateVelocityFromEvent(moveEvent);
            }
        };
        
        const cleanup = () => {
            window.removeEventListener('mousemove', handleDrag);
            window.removeEventListener('mouseup', cleanup);
            this.state.isDragging = false;
        };

        window.addEventListener('mousemove', handleDrag);
        window.addEventListener('mouseup', cleanup);
        
        this.state.isDragging = true;
        e.preventDefault(); // Previene la selezione del testo
    }

    calculateVelocityFromY(clientY) {
        const velocityGrid = this.container.querySelector('.velocity-grid');
        const rect = velocityGrid.getBoundingClientRect();
        const relativeY = clientY - rect.top;
        const velocity = Math.max(0, Math.min(127, Math.round((1 - relativeY / rect.height) * 127)));
        return velocity;
    }

    handleNoteMouseDown(e) {
        const noteEl = e.target;
        const row = parseInt(noteEl.dataset.row);
        const col = parseInt(noteEl.dataset.col);
        
        if (this.state.tool === 'erase') {
            this.component.removeNote(row, col);
            return;
        }

        if (!e.shiftKey) {
            this.state.selection.clear();
        }
        this.state.selection.add(`${row}-${col}`);
        noteEl.classList.add('selected');
        
        this.state.isDragging = true;
        this.state.dragStart = { row, col };
    }

    handleDragMove(e) {
        if (!this.state.isDragging || this.state.velocityMode) return;

        const grid = this.container.querySelector('.piano-roll-grid');
        const gridContainer = this.container.querySelector('.piano-roll-grid-container');
        const rect = gridContainer.getBoundingClientRect(); // Usiamo il rect del container
        
        // Calcola la posizione relativa al container scrollabile
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calcola la posizione considerando lo scroll
        const scrolledX = x + gridContainer.scrollLeft;
        const scrolledY = y + gridContainer.scrollTop;
        
        const col = Math.floor(scrolledX / this.component.options.pixelsPerStep);
        const row = this.component.options.rows - 1 - Math.floor(scrolledY / this.component.options.pixelsPerStep);

        if (row >= 0 && row < this.component.options.rows &&
            col >= 0 && col < this.component.options.columns) {
            
            if (this.state.tool === 'draw') {
                if (!this.component.getNoteAt(row, col)) {
                    this.component.addNote(row, col);
                }
            }
        }
    }

    finishDrag() {
        this.state.isDragging = false;
        this.state.dragStart = null;
        this.state.dragEnd = null;
    }

    handleResizeStart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const noteEl = e.target.closest('.note-block');
        if (!noteEl) return;

        const row = parseInt(noteEl.dataset.row);
        const col = parseInt(noteEl.dataset.col);
        const note = this.component.getNoteAt(row, col);
        
        if (!note) return;

        this.state.resizingNote = {
            element: noteEl,
            row: row,
            col: col,
            startX: e.clientX,
            initialLength: note.length,
            note: note
        };
    }

    handleResizeMove(e) {
        if (!this.state.resizingNote) return;

        e.preventDefault();
        e.stopPropagation();

        const { startX, initialLength, row, col } = this.state.resizingNote;
        const pixelsPerStep = this.component.options.pixelsPerStep;
        
        const deltaSteps = Math.round((e.clientX - startX) / pixelsPerStep);
        const newLength = Math.max(1, initialLength + deltaSteps);
        
        this.component.updateNote(row, col, { length: newLength });
    }

    finishResize() {
        this.state.resizingNote = null;
    }

    handleKeyDown(e) {
        if (e.target.tagName === 'INPUT') return;

        // Tool shortcuts
        switch (e.key.toLowerCase()) {
            case 'd': this.setTool('draw'); break;
            case 's': this.setTool('select'); break;
            case 'e': this.setTool('erase'); break;
            case 'v': this.toggleOption('velocity'); break;
        }

        // Existing shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'c': this.copySelection(); break;
                case 'v': this.pasteSelection(); break;
                case 'x': 
                    this.copySelection();
                    this.deleteSelection();
                    break;
                case 'a':
                    e.preventDefault();
                    this.selectAll();
                    break;
            }
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            this.deleteSelection();
        }
    }

    copySelection() {
        this.state.clipboard = Array.from(this.state.selection)
            .map(id => {
                const [row, col] = id.split('-').map(Number);
                return this.component.getNoteAt(row, col);
            })
            .filter(Boolean);
    }

    pasteSelection() {
        if (this.state.clipboard.length === 0) return;
        
        const minCol = Math.min(...this.state.clipboard.map(n => n.col));
        this.state.clipboard.forEach(note => {
            const colOffset = note.col - minCol;
            this.component.addNote(
                note.row,
                this.playhead + colOffset,
                note.length,
                note.velocity
            );
        });
    }

    deleteSelection() {
        Array.from(this.state.selection).forEach(id => {
            const [row, col] = id.split('-').map(Number);
            this.component.removeNote(row, col);
        });
        this.state.selection.clear();
    }

    selectAll() {
        this.state.selection.clear();
        this.component.getAllNotes().forEach(note => {
            this.state.selection.add(`${note.row}-${note.col}`);
            const noteEl = this.container.querySelector(
                `.note-block[data-row="${note.row}"][data-col="${note.col}"]`
            );
            if (noteEl) noteEl.classList.add('selected');
        });
    }

    // Rendering methods
    refreshNotes() {
        const grid = this.container.querySelector('.piano-roll-grid');
        const velocityGrid = this.container.querySelector('.velocity-grid');
        if (!grid || !velocityGrid) return;

        // Clear existing notes and velocity bars
        grid.querySelectorAll('.note-block').forEach(el => el.remove());
        velocityGrid.querySelectorAll('.velocity-bar').forEach(el => el.remove());

        // Add current notes
        this.component.getAllNotes().forEach(note => {
            this.renderNote(note);
        });
    }

    renderNote(note) {
        const { row, col, length, velocity } = note;
        const pixelsPerStep = this.component.options.pixelsPerStep;
        
        // Render note block
        const noteEl = this.renderNoteBlock(note);
        
        // Render velocity bar
        const velocityBar = this.renderVelocityBar(note);
        
        // Store references to both elements in their dataset
        noteEl.dataset.velocityId = `velocity-${row}-${col}`;
        velocityBar.dataset.noteId = `note-${row}-${col}`;
    }

    renderNoteBlock(note) {
        const { row, col, length } = note;
        const pixelsPerStep = this.component.options.pixelsPerStep;
        const grid = this.container.querySelector('.piano-roll-grid');
        
        const noteEl = document.createElement('div');
        noteEl.className = 'note-block';
        noteEl.dataset.row = row;
        noteEl.dataset.col = col;
        noteEl.id = `note-${row}-${col}`;
        
        const cellHeight = pixelsPerStep;
        const rows = this.component.options.rows;
        
        noteEl.style.left = `${col * pixelsPerStep}px`;
        noteEl.style.top = `${(rows - 1 - row) * cellHeight}px`;
        noteEl.style.width = `${length * pixelsPerStep - 2}px`;
        noteEl.style.height = `${cellHeight - 2}px`;

        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        noteEl.appendChild(resizeHandle);
        
        grid.appendChild(noteEl);
        return noteEl;
    }

    renderVelocityBar(note) {
        const { row, col, length, velocity } = note;
        const pixelsPerStep = this.component.options.pixelsPerStep;
        const velocityGrid = this.container.querySelector('.velocity-grid');
        
        const velocityBar = document.createElement('div');
        velocityBar.className = 'velocity-bar';
        velocityBar.dataset.row = row;
        velocityBar.dataset.col = col;
        velocityBar.id = `velocity-${row}-${col}`;
        
        velocityBar.style.left = `${col * pixelsPerStep}px`;
        velocityBar.style.width = `${length * pixelsPerStep - 2}px`; // Sottrai 2px per il bordo
        velocityBar.style.height = `${(velocity / 127) * 100}%`;
        
        // Aggiungi un div per il valore della velocity
        const velocityValue = document.createElement('div');
        velocityValue.className = 'velocity-value';
        velocityValue.textContent = velocity;
        velocityBar.appendChild(velocityValue);
        
        if (velocityGrid) {
            velocityGrid.appendChild(velocityBar);
        } else {
            console.error('Velocity grid not found');
        }
        
        return velocityBar;
    }

    updatePlayhead(position) {
        const playhead = this.container.querySelector('.playhead');
        if (playhead) {
            playhead.style.left = `${position * this.component.options.pixelsPerStep}px`;
        }
    }
}
