function(instance, properties, context) {
    // Only proceed if initialization is complete
    if (!instance.data.initialized) {
        return;
    }
  
    // Map tasks from the Bubble data_source
    const taskLen = properties.data_source.length();
    const taskList = properties.data_source.get(0, taskLen);
    
    function mapTasks(data) {
        return data.map(task => ({
            id: task.get("_id"),
            name: task.get("name_text"),
            start: task.get("start_date_date"),
            end: task.get("end_date_date"),
            progress: task.get("progress_number") ? task.get("progress_number") * 100 : 0,
            dependencies: task.get("arrowfrom_text") ? task.get("arrowfrom_text").split(",") : []
        }));
    }
    
    const tasks = mapTasks(taskList);
    
    // If there are no tasks, do nothing
    if (!tasks || tasks.length === 0) {
        return;
    }
    
    // If the Gantt chart hasn't been populated with tasks yet,
    // clear the container and reinitialize the chart with these tasks
    if (!instance.data.gantt || !instance.data.gantt.tasks || instance.data.gantt.tasks.length === 0) {
        // Clear out any previous content
        instance.data.container.innerHTML = "";
        
        // Reinitialize the Gantt chart with the tasks
        instance.data.gantt = new Gantt(instance.data.container, tasks, {
            auto_move_label: false,
            move_dependencies: true,
            readonly_progress: true,
            view_mode_select: true,
            popup: false,
            scroll_to: instance.data.last_dragged_task_date || "today",
            readonly: false,
            holidays: {
                '#bfdbfe': []
            },
            on_date_change: function(task, start, end) {
                // Silent
            },
            on_click: function(task) {
                return false;
            }
        });
    } else {
        // Otherwise, if the chart exists and already has tasks,
        // update each task individually using the update_task method
        if (typeof instance.data.gantt.update_task === "function") {
            tasks.forEach(task => {
                instance.data.gantt.update_task(task.id, task);
            });
        } else {
            // Fallback: update the internal tasks array
            instance.data.gantt.tasks = tasks;
        }
    }
}