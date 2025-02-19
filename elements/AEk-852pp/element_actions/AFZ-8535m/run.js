function(instance, properties, context) {
    // Early exit if the instance is not properly initialized
    if (!instance.data.initialized || !instance.data.gantt) {
        console.warn('Gantt chart not properly initialized');
        return;
    }

    try {
        // Verify we have data source
        if (!properties || !properties.data_source) {
            console.warn('No data source available in properties');
            return;
        }

        // Map tasks from the Bubble data_source
        const taskLen = properties.data_source.length();
        const taskList = properties.data_source.get(0, taskLen);
        
        // Map the tasks using the same logic as update function
        const tasks = taskList.map(task => ({
            id: task.get("_id"),
            name: task.get("name_text"),
            start: task.get("start_date_date"),
            end: task.get("end_date_date"),
            progress: task.get("progress_number") ? task.get("progress_number") * 100 : 0,
            dependencies: task.get("arrowfrom_text") ? 
                task.get("arrowfrom_text").split(',').map(id => id.trim()).filter(id => id !== '') : 
                []
        }));

        // Store current view state
        const currentScroll = instance.data.gantt.getScrollPosition();
        const currentViewMode = instance.data.gantt.options.view_mode;

        // Clear existing tasks and set new ones
        instance.data.gantt.tasks = tasks;
        
        // Refresh the chart with new data
        instance.data.gantt.refresh(tasks);

        // Restore view state after a short delay to ensure rendering is complete
        setTimeout(() => {
            if (currentViewMode) {
                instance.data.gantt.change_view_mode(currentViewMode);
            }
            if (currentScroll) {
                instance.data.gantt.scroll_to_position(currentScroll);
            }
        }, 50);

        console.log('Successfully refreshed Gantt chart with', tasks.length, 'tasks');
    } catch (error) {
        console.error('Error refreshing Gantt chart:', error);
    }
}