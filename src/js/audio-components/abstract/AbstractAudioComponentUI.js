import EventEmitter from '../../utils/EventEmitter.js';

export default class AbstractAudioComponentUI extends EventEmitter {
    constructor(component, options = {}) {
        super();
        this.component = component;
        this.container = null;
        this.options = {
            className: 'audio-component',
            draggable: true,
            ...options
        };

        this.controls = new Map();
        this.dragOffset = { x: 0, y: 0 };
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
}
