function(instance, properties, context) {
    // Only proceed if initialization is complete
    if (!instance.data.initialized) {
        return;
    }

    // Update progress bar color if changed
    if (properties.progress_bar_color !== instance.data.progressBarColor) {
        instance.data.progressBarColor = properties.progress_bar_color || '#FF7F00';
        const styleElement = document.getElementById('gantt-custom-styles');
        if (styleElement) {
            styleElement.textContent = `
                /* Progress bar styles */
                .bar-wrapper .bar-progress {
                    fill: ${instance.data.progressBarColor} !important;
                }
                
                /* Add grab cursor for draggable areas */
                .gantt-container {
                    cursor: grab !important;
                }
                .gantt-container.is-dragging {
                    cursor: grabbing !important;
                }
                /* Reset cursor for interactive elements */
                .gantt-container .bar-wrapper,
                .gantt-container .handle-group {
                    cursor: default;
                }

              /* Make header sticky */
              .gantt-container .grid-header {
                  position: sticky !important;
                  top: 0 !important;
                  z-index: 100 !important;
                  background: white !important;
              }
            `;
        }
    }

    // Apply Gantt chart configuration based on properties
    const ganttConfig = {
        // Core display options
        view_mode: properties.view_mode || 'Day',
        view_mode_select: properties.show_view_mode_selector || false,
        date_format: properties.date_format || 'MM-DD-YYYY',
        popup_on: properties.popup_trigger || 'hover',
        language: 'en',
        
        // Layout and dimensions
        bar_height: properties.bar_height || 32,
        bar_corner_radius: properties.bar_corner_radius || 3,
        arrow_curve: properties.arrow_curve || 10,
        padding: properties.padding || 16,
        column_width: properties.column_width || 45,
        container_height: 'auto',
        upper_header_height: properties.upper_header_height || 70,
        lower_header_height: properties.lower_header_height || 40,
        
        // Styling and visual options
        lines: properties.grid_lines || 'both',
        auto_move_label: false,
        show_expected_progress: properties.show_expected_progress || false,
        infinite_padding: false,
        
        // Interaction settings
        readonly: properties.read_only || false,
        readonly_dates: properties.read_only || false,
        readonly_progress: properties.read_only || true,
        move_dependencies: true,  // Force this to be true regardless of property
        snap_at: properties.snap_at || '1d',
        
        // Navigation
        // scroll_to: properties.scroll_to_date || instance.data.last_dragged_task_date || "today",
        scroll_to: "today",
        today_button: typeof properties.today_button !== 'undefined' ? properties.today_button : true,
        
        // Holiday handling
        holidays: {
            'var(--g-weekend-highlight-color)': 'weekend',
            '#bfdbfe': []
        },
        ignore: [],
        
        // Popup configuration
        popup: function(taskData) {
            const task = taskData.task;
            if (!task) {
                console.warn('No task data provided to popup');
                return '';
            }
            return `
                <div style="padding: 4px 4px; font-family: Inter, sans-serif; font-size: 12px; color: #333; max-width: 220px; text-align: center;">
                    <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weighzd;"><strong>${task.name}</strong></h4>
                    <div>
                        <div style="margin-bottom: 2px;">${task.start.toLocaleDateString()} <strong>-</strong> ${task.end.toLocaleDateString()}</div>
                    </div>
                </div>
                `;
        },
        
        // Event handlers
      on_date_change: function(task, start, end) {
          if (!task || !task.id) return;
          
          // Track changed tasks in this drag session
          if (!instance.data.changedTasksInCurrentDrag) {
              instance.data.changedTasksInCurrentDrag = new Map();
          }
          instance.data.changedTasksInCurrentDrag.set(task.id, {
              task: task,
              oldStart: task.start,
              oldEnd: task.end,
              newStart: start,
              newEnd: end
          });

          // Let Frappe handle dependency updates
          return true;
      },
        on_click: function(task) {
            if (!task || !task.id) return false;
            return false;
        }
    };

    // Apply the configuration to the existing Gantt instance
    if (instance.data.gantt && instance.data.gantt.update_options) {
        instance.data.gantt.update_options(ganttConfig);
    }
  
    // Map tasks from the Bubble data_source
    const taskLen = properties.data_source.length();
    const taskList = properties.data_source.get(0, taskLen);
    
    function mapTasks(data) {
        return data.map(task => {
            const dependencies = task.get("arrowfrom_text") ? 
                task.get("arrowfrom_text").split(',').map(id => id.trim()).filter(id => id !== '') : 
                [];
            
            return {
                id: task.get("_id"),
                name: task.get("name_text"),
                start: task.get("start_date_date"),
                end: task.get("end_date_date"),
                progress: task.get("progress_number") ? task.get("progress_number") * 100 : 0,
                dependencies: dependencies
            };
        });
    }
    
    const tasks = mapTasks(taskList);
    
    // If there are no tasks, do nothing
    if (!tasks || tasks.length === 0) {
        return;
    }
    
    // Update tasks
    if (instance.data.gantt && instance.data.gantt.tasks && instance.data.gantt.tasks.length > 0) {
        // Update existing tasks
        tasks.forEach(task => {
            instance.data.gantt.update_task(task.id, task);
        });
    } else {
        // First time loading tasks
        instance.data.gantt.refresh(tasks);
    }
}