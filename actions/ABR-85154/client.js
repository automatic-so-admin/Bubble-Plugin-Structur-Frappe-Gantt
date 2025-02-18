function (properties, context) {
    // Get the Gantt element instance
    const element = properties.gantt_element;
    
    if (!element || !element.data || typeof element.data.initializeGantt !== 'function') {
        console.warn('Gantt element not found or invalid');
        return false;
    }

    try {
        element.data.initializeGantt();
        console.log('Gantt element successfully reset');
        return true;
    } catch (error) {
        console.error('Error resetting Gantt element:', error);
        return false;
    }
}