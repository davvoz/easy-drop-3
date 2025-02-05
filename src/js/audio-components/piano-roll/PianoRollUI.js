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
            clipboard: []
        };
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
        if (!grid) return;

        grid.addEventListener('mousedown', this.handleMouseDown.bind(this));
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Keyboard shortcuts
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    buildUI() {
        this.container.innerHTML = `
            <div class="piano-roll-container">
                <div class="piano-roll-toolbar"></div>
                <div class="piano-roll-content">
                    <div class="piano-roll-timeline"></div>
                    <div class="piano-roll-grid-container">
                        <div class="piano-roll-grid"></div>
                        <div class="playhead"></div>
                    </div>
                </div>
            </div>
        `;

        this.buildToolbar();
        this.buildTimeline();
        this.buildGrid();
        this.refreshNotes();
    }

    buildToolbar() {
        const toolbar = this.container.querySelector('.piano-roll-toolbar');
        const tools = [
            { id: 'draw', icon: '✏️', label: 'Draw' },
            { id: 'erase', icon: '🗑️', label: 'Erase' },
            { id: 'select', icon: '◻️', label: 'Select' }
        ];

        tools.forEach(tool => {
            const button = document.createElement('button');
            button.className = `tool-button ${tool.id === this.state.tool ? 'active' : ''}`;
            button.innerHTML = `${tool.icon} ${tool.label}`;
            button.addEventListener('click', () => this.setTool(tool.id));
            toolbar.appendChild(button);
        });
    }

    buildTimeline() {
        const timeline = this.container.querySelector('.piano-roll-timeline');
        const { columns, stepsPerBeat, beatsPerBar } = this.component.options;
        
        timeline.innerHTML = '';
        for (let i = 0; i < columns; i++) {
            const marker = document.createElement('div');
            marker.className = 'timeline-marker';
            if (i % (stepsPerBeat * beatsPerBar) === 0) {
                marker.classList.add('bar');
                marker.textContent = Math.floor(i / (stepsPerBeat * beatsPerBar)) + 1;
            } else if (i % stepsPerBeat === 0) {
                marker.classList.add('beat');
            }
            timeline.appendChild(marker);
        }
    }

    buildGrid() {
        const grid = this.container.querySelector('.piano-roll-grid');
        const { rows, columns } = this.component.options;
        const pixelsPerStep = this.component.options.pixelsPerStep;

        // Impostare le dimensioni della griglia usando CSS custom properties
        grid.style.setProperty('--cell-height', `${pixelsPerStep}px`);
        grid.style.setProperty('--rows', rows);
        grid.style.setProperty('--columns', columns);

        // Calcolare le dimensioni totali
        const totalWidth = columns * pixelsPerStep;
        const totalHeight = rows * pixelsPerStep;

        grid.style.width = `${totalWidth}px`;
        grid.style.height = `${totalHeight}px`;

        grid.innerHTML = '';
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = (rows - 1 - row);
                cell.dataset.col = col;
                
                if (col % 16 === 0) cell.classList.add('bar-start');
                else if (col % 4 === 0) cell.classList.add('beat-start');
                
                grid.appendChild(cell);
            }
        }
    }

    // Event handlers
    handleMouseDown(e) {
        if (e.target.matches('.note-block')) {
            this.handleNoteMouseDown(e);
        } else if (e.target.matches('.resize-handle')) {
            this.handleResizeStart(e);
        } else if (e.target.matches('.grid-cell')) {
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
        const noteEl = this.container.querySelector(
            `.note-block[data-row="${note.row}"][data-col="${note.col}"]`
        );
        if (noteEl) noteEl.remove();
    }

    handleNoteUpdated(note) {
        const noteEl = this.container.querySelector(
            `.note-block[data-row="${note.row}"][data-col="${note.col}"]`
        );
        if (noteEl) {
            const pixelsPerStep = this.component.options.pixelsPerStep;
            noteEl.style.width = `${note.length * pixelsPerStep - 2}px`;
            noteEl.style.opacity = note.velocity / 127;
        }
    }

    handleGridMouseDown(e) {
        const cell = e.target;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (this.state.tool === 'draw') {
            this.component.addNote(row, col);
        } else if (this.state.tool === 'erase') {
            this.component.removeNote(row, col);
        } else if (this.state.tool === 'select') {
            this.startSelection(row, col, e.shiftKey);
        }

        this.state.isDragging = true;
        this.state.dragStart = { row, col };
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
        const cell = e.target.closest('.grid-cell');
        if (!cell) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        this.state.dragEnd = { row, col };

        if (this.state.tool === 'draw') {
            this.component.addNote(row, col);
        }
    }

    finishDrag() {
        this.state.isDragging = false;
        this.state.dragStart = null;
        this.state.dragEnd = null;
    }

    handleResizeStart(e) {
        e.stopPropagation();
        const noteEl = e.target.closest('.note-block');
        if (!noteEl) return;

        this.state.resizingNote = {
            element: noteEl,
            row: parseInt(noteEl.dataset.row),
            col: parseInt(noteEl.dataset.col),
            startX: e.clientX,
            initialWidth: noteEl.offsetWidth,
            note: this.component.getNoteAt(
                parseInt(noteEl.dataset.row),
                parseInt(noteEl.dataset.col)
            )
        };
    }

    handleResizeMove(e) {
        if (!this.state.resizingNote) return;

        const deltaX = e.clientX - this.state.resizingNote.startX;
        const pixelsPerStep = this.component.options.pixelsPerStep;
        const newLength = Math.max(1, Math.round((this.state.resizingNote.initialWidth + deltaX) / pixelsPerStep));
        
        // Update visual length
        this.state.resizingNote.element.style.width = `${newLength * pixelsPerStep - 2}px`;
        
        // Update model
        if (this.state.resizingNote.note) {
            this.component.updateNote(
                this.state.resizingNote.row,
                this.state.resizingNote.col,
                { length: newLength }
            );
        }
    }

    finishResize() {
        this.state.resizingNote = null;
    }

    handleKeyDown(e) {
        if (e.target.tagName === 'INPUT') return;

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
        if (!grid) return;

        // Clear existing notes
        grid.querySelectorAll('.note-block').forEach(el => el.remove());

        // Add current notes
        this.component.getAllNotes().forEach(note => {
            this.renderNote(note);
        });
    }

    renderNote(note) {
        const { row, col, length, velocity } = note;
        const pixelsPerStep = this.component.options.pixelsPerStep;
        const grid = this.container.querySelector('.piano-roll-grid');
        
        const noteEl = document.createElement('div');
        noteEl.className = 'note-block';
        noteEl.dataset.row = row;
        noteEl.dataset.col = col;
        
        const cellHeight = pixelsPerStep;
        const rows = this.component.options.rows;
        
        noteEl.style.left = `${col * pixelsPerStep}px`;
        noteEl.style.top = `${(rows - 1 - row) * cellHeight}px`;
        noteEl.style.width = `${length * pixelsPerStep - 2}px`;
        noteEl.style.height = `${cellHeight - 2}px`;
        noteEl.style.opacity = velocity / 127;

        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        noteEl.appendChild(resizeHandle);

        grid.appendChild(noteEl);
    }

    updatePlayhead(position) {
        const playhead = this.container.querySelector('.playhead');
        if (playhead) {
            playhead.style.left = `${position * this.component.options.pixelsPerStep}px`;
        }
    }
}
