export default class RenderEngine {
    constructor(container) {
        if (!container) {
            throw new Error('Container element must be provided for RenderEngine');
        }
        this.container = container;
        this.components = new Map();
    }

    addComponent(component, parentElement = this.container) {
        if (!component || !parentElement) {
            throw new Error('Both component and parent element must be provided');
        }

        try {
            const componentContainer = document.createElement('div');
            componentContainer.className = 'component-wrapper';
            parentElement.appendChild(componentContainer);
            component.render(componentContainer);
            this.components.set(component.component.id, component);
            return componentContainer;
        } catch (error) {
            console.error(`Failed to add component:`, error);
            throw error;
        }
    }

    removeComponent(componentId) {
        const component = this.components.get(componentId);
        if (component) {
            component.dispose();
            this.components.delete(componentId);
        }
    }

    dispose() {
        this.components.forEach(component => component.dispose());
        this.components.clear();
        this.container.innerHTML = '';
    }
}
