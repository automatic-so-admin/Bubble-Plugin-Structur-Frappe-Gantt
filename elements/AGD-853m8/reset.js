function(instance, context) {
    // Re-initialize the Gantt chart
    if (instance.data.initializeGantt) {
        instance.data.initializeGantt();
        
        // Only proceed if initialization is complete and we have valid properties and data source
        if (instance.data.initialized && 
            context && 
            context.properties && 
            context.properties.data_source) {
            
            try {
                // Map tasks from the Bubble data_source
                const taskLen = context.properties.data_source.length();
                const taskList = context.properties.data_source.get(0, taskLen);
                
                // Reuse the same task mapping logic from update.js
                const tasks = taskList.map(task => ({
                    id: task.get("_id"),
                    name: task.get("name_text"),
                    start: task.get("start_date_date"),
                    end: task.get("end_date_date"),
                    progress: task.get("progress_number") ? task.get("progress_number") * 100 : 0,
                    dependencies: task.get("arrowfrom_text") ? task.get("arrowfrom_text").split(",") : []
                }));
                
                // Update the Gantt chart with the fresh data
                if (tasks && tasks.length > 0) {
                    instance.data.addTasks(tasks);
                }
            } catch (error) {
                console.warn('Error resetting Gantt chart:', error);
            }
        } else {
            console.log('Gantt reset: Waiting for initialization or data source');
        }
    } else {
        console.error('Initialize function not found. Element may not be properly initialized.');
    }
}