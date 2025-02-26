function(instance, properties, context) {
    // Skip update if no container or properties
    if (!instance.data.container || !properties || properties.bubble?.width <= 0 || properties.bubble?.height <= 0) {
        return;
    }
    
    // Set updating flag to prevent event loops
    instance.data.isUpdating = true;
    
    // Initialize or reset updated tasks state if needed
    if (properties.reset_changes === true || properties.clear_updates === true) {
        instance.data.resetUpdatedTasks();
    }

    // Update container dimensions
    if (properties.bubble) {
        instance.data.container.style.width = properties.bubble.width + 'px';
        instance.data.container.style.height = properties.bubble.height + 'px';
    }
    
    // Get options from properties with sensible defaults
    const ganttOptions = {
        // Core display options
        view_mode: properties.view_mode || 'Day',
        date_format: properties.date_format || 'YYYY-MM-DD',
        language: 'en',
        
        // Layout and dimensions
        bar_height: properties.bar_height || 30,
        bar_corner_radius: properties.bar_corner_radius || 3,
        arrow_curve: properties.arrow_curve || 5,
        padding: properties.padding || 18,
        column_width: properties.column_width || 30,
        
        // Styling and visual options
        popup_trigger: properties.popup_trigger || 'click',
        
        // Interaction settings
        readonly: properties.read_only || false,
        readonly_dates: properties.readonly_dates || false, 
        readonly_progress: properties.readonly_progress || true,
        move_dependencies: properties.move_dependencies !== false, // Default true
        snap_at: properties.snap_at || '1d',
        
        // Navigation
        scroll_to: properties.scroll_to || "today",
    };
    
    // Process data source if available
    if (properties.data_source) {
        // Get tasks from data source
        const tasks = instance.data.mapBubbleDataToTasks(properties.data_source);
        
        // Reset updated tasks when data source changes completely
        if (properties.reset_on_data_change === true) {
            instance.data.resetUpdatedTasks();
        }
        
        // Store original task dates for reference
        tasks.forEach(task => {
            if (task.id) {
                instance.data.originalTaskDates.set(task.id, {
                    start: new Date(task.start),
                    end: new Date(task.end)
                });
            }
        });
        
        // Check if we need to create or update the chart
        if (!instance.data.ganttChart) {
            // First time - create the chart
            instance.data.ganttChart = new Gantt(instance.data.container, tasks, ganttOptions);
            
            // Set up event handlers after chart is created
            instance.data.setupEventHandlers();
            
            // Initialize updated tasks state
            instance.publishState('updated_tasks_obj', []);
            instance.publishState('has_unsaved_changes', false);
        } else {
            // Update existing chart
            instance.data.ganttChart.update_options(ganttOptions);
            instance.data.ganttChart.refresh(tasks);
        }
    }
    
    // Reset updating flag after a short delay to ensure all events are complete
    setTimeout(() => {
        instance.data.isUpdating = false;
    }, 500);
}