function(instance, context) {
    // Clean up event listeners
    if (instance.data.eventListeners) {
        instance.data.eventListeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        instance.data.eventListeners = [];
    }
    
    // Clean up the chart
    if (instance.data.ganttChart) {
        // Frappe Gantt doesn't have a destroy method, so we clear the container
        instance.data.container.innerHTML = '';
        instance.data.ganttChart = null;
    }
    
    // Remove the container
    if (instance.data.container) {
        instance.data.container.remove();
        instance.data.container = null;
    }
    
    // Clear stored data
    instance.data.originalTaskDates = new Map();
    instance.data.updatedTasks = new Map();
} 