function(instance, context) {
    // Initialize the data structure to store our state
    instance.data = instance.data || {};
    
    // Add a flag to prevent event loops
    instance.data.isUpdating = false;
    
    // Track event listeners for cleanup
    instance.data.eventListeners = [];
    
    // Create a structure to track tasks with updated dates
    instance.data.updatedTasks = new Map();
    
    // Create container for the Gantt chart
    instance.data.container = document.createElement('div');
    instance.data.container.className = 'gantt-container';
    instance.data.container.style.width = '100%';
    instance.data.container.style.height = '100%';
    instance.data.container.style.overflow = 'auto';
    instance.canvas.append(instance.data.container);
    
    // Add custom styles
    const styleId = 'gantt-custom-styles';
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
        styleElement.textContent = `
            /* Custom Gantt styles */
            .gantt .bar-progress {
                fill: #ff8000;
            }
            .gantt .bar {
                fill: #b8c2cc;
            }
            .gantt .today-highlight {
                fill: rgba(25, 118, 210, 0.15);
            }
        `;
    }
    
    // Helper function to add and track event listeners
    instance.data.addEventListenerAndTrack = function(element, type, handler, options = {}) {
        element.addEventListener(type, handler, options);
        instance.data.eventListeners.push({ element, type, handler });
    };
    
    // Task tracking
    instance.data.originalTaskDates = new Map();

    /**
     * Maps Bubble.io data source to Frappe Gantt tasks format
     * @param {Object} dataSource - Bubble.io data source
     * @return {Array} - Array of tasks in Frappe Gantt format
     */
    instance.data.mapBubbleDataToTasks = function(dataSource) {
        if (!dataSource || typeof dataSource.length !== 'function' || dataSource.length() === 0) {
            return [];
        }
        
        // Get all data items
        const dataItems = dataSource.get(0, dataSource.length());
        
        // Transform each item to a gantt task
        return dataItems.map(item => {
            // Create a basic task
            const task = {
                id: item.get('_id') || item.get('id') || instance.data.generateTaskId(),
                name: item.get('name_text') || item.get('name') || 'Untitled Task'
            };
            
            // Handle start date (support multiple field names)
            const start = item.get('start_date_date') || item.get('start_date') || item.get('start');
            if (start) {
                task.start = new Date(start);
            } else {
                // Default to today if no start date
                task.start = new Date();
            }
            
            // Handle end date or duration (support multiple field names)
            const end = item.get('end_date_date') || item.get('end_date') || item.get('end');
            const duration = item.get('duration');
            
            if (end) {
                task.end = new Date(end);
            } else if (duration) {
                // If duration is provided but no end date
                task.duration = duration;
            } else {
                // Default to 1 day duration if neither is provided
                const endDate = new Date(task.start);
                endDate.setDate(endDate.getDate() + 1);
                task.end = endDate;
            }
            
            // Handle progress (normalize to 0-100 scale)
            const progress = item.get('progress_number') || item.get('progress');
            if (progress !== undefined && progress !== null) {
                // Check if progress is already on 0-100 scale or 0-1 scale
                task.progress = progress > 1 ? progress : progress * 100;
            } else {
                task.progress = 0;
            }
            
            // Handle dependencies
            const dependencies = item.get('arrowfrom_text') || item.get('dependencies');
            if (dependencies) {
                if (typeof dependencies === 'string') {
                    // Handle comma-separated string
                    task.dependencies = dependencies.split(',').map(id => id.trim()).filter(id => id !== '');
                } else if (Array.isArray(dependencies)) {
                    // Handle array
                    task.dependencies = dependencies;
                }
            }
            
            // Handle custom class
            const customClass = item.get('custom_class');
            if (customClass) {
                task.custom_class = customClass;
            }
            
            return task;
        });
    };

    /**
     * Resets the collection of updated tasks
     */
    instance.data.resetUpdatedTasks = function() {
        instance.data.updatedTasks.clear();
        instance.publishState('updated_tasks_obj', []);
        instance.publishState('has_unsaved_changes', false);
    };

    /**
     * Publishes the current collection of updated tasks as a state
     */
    instance.data.publishUpdatedTasks = function() {
        // Convert Map values to array of JSON strings with only necessary data
        const updatedTasksArray = Array.from(instance.data.updatedTasks.values()).map(task => {
            // Create simplified object with just the required fields
            const simplifiedTask = {
                task_id: task.id,
                new_start_date: task.start,
                new_end_date: task.end
            };
            
            // Convert to JSON string
            return JSON.stringify(simplifiedTask);
        });
        
        // Publish the array of updated tasks as JSON strings
        instance.publishState('updated_tasks_obj', updatedTasksArray);
        // Indicate whether there are unsaved changes
        instance.publishState('has_unsaved_changes', updatedTasksArray.length > 0);
    };

    /**
     * Sets up all event handlers for the Gantt chart
     */
    instance.data.setupEventHandlers = function() {
        if (!instance.data.ganttChart) return;
        
        // Handle task click - simplified as requested
        instance.data.ganttChart.on_click = task => {
            // Prevent event loops by checking if we're in an update
            if (instance.data.isUpdating) {
                return false;
            }
            
            // Only publish task ID
            instance.publishState('wf_task_id', task.id);
            
            // Trigger Bubble event
            instance.triggerEvent('task_clicked');
            
            // Return false to prevent default behavior
            return false;
        };
        
        // Handle date change (task moved or resized)
        instance.data.ganttChart.on_date_change = (task, start, end) => {
            // Prevent event loops by checking if we're in an update
            if (instance.data.isUpdating) {
                return;
            }
            
            // Store original dates
            const originalDates = instance.data.originalTaskDates.get(task.id);
            
            // Add or update task in the updated tasks collection
            instance.data.updatedTasks.set(task.id, {
                id: task.id,
                name: task.name,
                start: start,
                end: end,
                original_start: originalDates ? originalDates.start : null,
                original_end: originalDates ? originalDates.end : null
            });
            
            // Publish the updated collection
            instance.data.publishUpdatedTasks();
            
            // Still publish current task for backward compatibility
            instance.publishState('wf_task_id', task.id);
            instance.publishState('wf_start_date', start);
            instance.publishState('wf_end_date', end);
            
            // Optional: trigger event to support legacy behavior
            // Comment this out if you don't need individual events
            // instance.triggerEvent('wf_task_indiv_date_change');
        };
        
        // Handle progress change
        instance.data.ganttChart.on_progress_change = (task, progress) => {
            // Prevent event loops by checking if we're in an update
            if (instance.data.isUpdating) {
                return;
            }
            
            // Get existing task from updated tasks or create a new one
            let updatedTask = instance.data.updatedTasks.get(task.id);
            const originalDates = instance.data.originalTaskDates.get(task.id);
            
            if (!updatedTask) {
                updatedTask = {
                    id: task.id,
                    name: task.name,
                    start: task.start,
                    end: task.end,
                    original_start: originalDates ? originalDates.start : null,
                    original_end: originalDates ? originalDates.end : null
                };
            }
            
            // Add progress to the updated task
            updatedTask.progress = progress;
            
            // Store in updated tasks
            instance.data.updatedTasks.set(task.id, updatedTask);
            
            // Publish the updated collection
            instance.data.publishUpdatedTasks();
            
            // Still publish current progress for backward compatibility
            instance.publishState('wf_task_id', task.id);
            instance.publishState('wf_progress', progress);
            
            // Optional: trigger event to support legacy behavior
            // Comment this out if you don't need individual events
            // instance.triggerEvent('task_progress_changed');
        };
        
        // Handle view mode change
        instance.data.ganttChart.on_view_change = mode => {
            // Prevent event loops by checking if we're in an update
            if (instance.data.isUpdating) {
                return;
            }
            
            // Publish updated view mode
            instance.publishState('current_view_mode', mode);
            
            // Trigger Bubble event
            instance.triggerEvent('view_mode_changed');
        };
        
        // Add drag-to-scroll functionality
        const ganttContainer = instance.data.container.querySelector('.gantt-container');
        if (ganttContainer) {
            let isScrolling = false;
            let startX;
            let scrollLeft;
            
            // Mouse down - start scrolling
            instance.data.addEventListenerAndTrack(ganttContainer, 'mousedown', e => {
                // Only proceed if not clicking on a task bar
                if (e.target.closest('.bar-wrapper')) return;
                
                isScrolling = true;
                startX = e.pageX - ganttContainer.offsetLeft;
                scrollLeft = ganttContainer.scrollLeft;
                ganttContainer.style.cursor = 'grabbing';
            });
            
            // Mouse move - scroll if active
            instance.data.addEventListenerAndTrack(document, 'mousemove', e => {
                if (!isScrolling) return;
                
                e.preventDefault();
                const x = e.pageX - ganttContainer.offsetLeft;
                const walk = (x - startX) * 2; // Faster scrolling
                ganttContainer.scrollLeft = scrollLeft - walk;
            });
            
            // Mouse up - stop scrolling
            instance.data.addEventListenerAndTrack(document, 'mouseup', () => {
                if (!isScrolling) return;
                
                isScrolling = false;
                ganttContainer.style.cursor = '';
            });
        }
    };

    /**
     * Generates a unique task ID
     * @return {String} - Unique ID
     */
    instance.data.generateTaskId = function() {
        return 'task_' + Math.random().toString(36).substr(2, 9);
    };
}