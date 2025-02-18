function(instance, context) {
    console.log('🙂');
    
    // Initialize the listeners array immediately
    if (!instance.data._ganttListeners) {
        instance.data._ganttListeners = [];
    }
    
    // Add initialization function that can be called multiple times
    instance.data.initializeGantt = function() {
        // Clean up existing event listeners
        if (Array.isArray(instance.data._ganttListeners)) {
            instance.data._ganttListeners.forEach(({ target, type, fn }) => {
                target.removeEventListener(type, fn);
            });
            instance.data._ganttListeners = [];
        } else {
            // Ensure array exists if it somehow got removed
            instance.data._ganttListeners = [];
        }

        // Clear and recreate container
        if (instance.data.container) {
            instance.data.container.innerHTML = '';
        } else {
            instance.data.container = document.createElement('div');
            instance.data.container.id = 'gantt-chart';
            instance.canvas.append(instance.data.container);
        }
    
        // Reset state
        instance.data.last_dragged_task_date = null;
        instance.data.initialized = false;
        instance.data.internalUpdate = false;
        instance.data.originalTaskDates = new Map();
        
        instance.data.dragState = {
            mouseStartX: 0,
            mouseStartY: 0,
            startTime: 0,
            isDragging: false,
            activeTaskId: null,
            dragEndTriggered: false,
            isMouseDown: false,
            lastOperation: null,
            operationHistory: []
        };
    
        // Create the Gantt instance
        instance.data.gantt = new Gantt(instance.data.container, [], {
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
                if (!task || !task.id) return;
                
                // Store the new dates
                task._start = start;
                task._end = end;
                
                // If this task has dependencies, ensure they're properly rendered
                if (task.dependencies && task.dependencies.length > 0) {
                    const allTasks = instance.data.gantt.tasks;
                    const dependentTasks = allTasks.filter(t => 
                        task.dependencies.includes(t.id) || 
                        (t.dependencies && t.dependencies.includes(task.id))
                    );
                    
                    // Ensure all dependent tasks have their bars
                    const unrenderedDependencies = dependentTasks.filter(t => !t.$bar);
                    if (unrenderedDependencies.length > 0) {
                        console.warn('Re-rendering dependencies:', unrenderedDependencies);
                        
                        // First try to force create bars for unrendered tasks
                        unrenderedDependencies.forEach(t => {
                            if (!t.$bar) {
                                instance.data.gantt.trigger_task_click(t.id);
                            }
                        });
                        
                        // Then refresh to ensure arrows are drawn
                        requestAnimationFrame(() => {
                            instance.data.gantt.refresh(allTasks);
                        });
                        return;
                    }
                }
            },
            on_click: function(task) {
                if (!task || !task.id) return false;
                return false;
            },
            on_refresh: function(tasks) {
                if (!tasks || !Array.isArray(tasks)) {
                    console.warn('Invalid tasks data structure:', tasks);
                    return;
                }
                
                // Ensure all tasks have necessary properties before rendering
                tasks.forEach((task, index) => {
                    // Validate task has required properties
                    if (!task.$bar && task.dependencies && task.dependencies.length > 0) {
                        console.log(`Initializing bar for dependent task ${task.id}`);
                        // Force bar creation if missing
                        instance.data.gantt.trigger_task_click(task.id);
                    }
                    
                    console.log(`Task ${index} validation:`, {
                        id: !!task.id,
                        name: !!task.name,
                        start: !!task.start,
                        end: !!task.end,
                        $bar: !!task.$bar,
                        dependencies: task.dependencies,
                        raw: task
                    });
                });
                
                // Additional dependency validation after refresh
                const tasksWithDependencies = tasks.filter(t => t.dependencies && t.dependencies.length > 0);
                if (tasksWithDependencies.length > 0) {
                    requestAnimationFrame(() => {
                        tasksWithDependencies.forEach(task => {
                            if (!task.$bar) {
                                console.warn(`Task ${task.id} missing $bar after refresh, attempting recovery`);
                                instance.data.gantt.trigger_task_click(task.id);
                            }
                        });
                    });
                }
            }
        });

        instance.data.initializationTime = Date.now();
        instance.data.initialized = true;
        
        // Re-attach all event listeners
        setupEventListeners();
    };

    // Separate function to setup event listeners
    function setupEventListeners() {
        // Helper: add event listeners and store them for cleanup
        function addListener(target, type, fn, options = {}) {
            // Make mousewheel and touch events passive by default
            if (['mousewheel', 'wheel', 'touchstart', 'touchmove'].includes(type)) {
                options.passive = true;
            }
            
            const wrappedFn = (...args) => fn(...args);
            target.addEventListener(type, wrappedFn, options);
            instance.data._ganttListeners.push({ target, type, fn: wrappedFn });
        }

        // Helper: traverse up the DOM to find a task element by its .bar-wrapper class
        function findTaskElement(element) {
            let taskGroup = element.closest('.bar-wrapper');
            if (!taskGroup) {
                let current = element;
                while (current && !taskGroup) {
                    if (current?.classList?.contains('bar-wrapper')) {
                        taskGroup = current;
                        break;
                    }
                    current = current.parentElement;
                }
            }
            if (!taskGroup) return null;
            const taskId = taskGroup.getAttribute('data-id');
            return taskId ? { element: taskGroup, id: taskId } : null;
        }
    
        // Helper: reset the drag state
        function resetDragState() {
            instance.data.dragState.isDragging = false;
            instance.data.dragState.activeTaskId = null;
            instance.data.dragState.startTime = 0;
            instance.data.dragState.mouseStartX = 0;
            instance.data.dragState.mouseStartY = 0;
            instance.data.dragState.dragEndTriggered = false;
            instance.data.dragState.isMouseDown = false;
        }
    
        // Helper: filter tasks whose start or end dates have changed
        function filterUnchangedTasks(tasks) {
            return tasks.filter(tk => {
                const startChanged = new Date(tk.start).getTime() !== new Date(tk._start).getTime();
                const endChanged = new Date(tk.end).getTime() !== new Date(tk._end).getTime();
                return startChanged || endChanged;
            });
        }
    
        // Called when a drag action ends with sequential processing
        function endDrag() {
            const ds = instance.data.dragState;
            if (!ds.activeTaskId || !ds.isDragging || ds.dragEndTriggered) return;
            
            ds.dragEndTriggered = true;
            
            let changedTasks = filterUnchangedTasks(instance.data.gantt.tasks);
            if (!changedTasks || changedTasks.length === 0) {
                const activeTask = instance.data.gantt.tasks.find(x => x.id === ds.activeTaskId);
                if (activeTask) {
                    changedTasks = [activeTask];
                }
            }

            // Capture task data for processing
            const taskSnapshots = changedTasks.map(task => ({
                id: task.id,
                name: task.name,
                originalDates: instance.data.originalTaskDates.get(task.id),
                dependencies: task.dependencies,
                progress: task.progress,
                start: task.start,
                end: task.end,
                _start: task._start,
                _end: task._end,
                updatedStart: task._start,
                updatedEnd: task._end
            }));
            
            instance.publishState('modified_tasks', JSON.stringify(changedTasks));
            
            const activeTask = instance.data.gantt.tasks.find(x => x.id === ds.activeTaskId);
            if (activeTask) {
                instance.data.last_dragged_task_date = activeTask._start;
            }
            
            instance.publishState('task_id', ds.activeTaskId);
            instance.triggerEvent('task_drag_ended');
            
            instance.data.internalUpdate = true;
            
            // Process tasks sequentially
            (async function processTasksSequentially() {
                for (const taskSnapshot of taskSnapshots) {
                    const indent = taskSnapshot.id === ds.activeTaskId ? '' : '  ';
                    
                    // Log task details
                    console.log(`${indent}📊 Processing Task: ${taskSnapshot.name} (${taskSnapshot.id})`);
                    
                    if (taskSnapshot.originalDates) {
                        console.log(`${indent}   Original Dates:`, {
                            start: taskSnapshot.originalDates.start,
                            end: taskSnapshot.originalDates.end
                        });
                    }
                    
                    console.log(`${indent}   Task Details:`, {
                        name: taskSnapshot.name,
                        id: taskSnapshot.id,
                        dependencies: taskSnapshot.dependencies,
                        start: taskSnapshot.start,
                        end: taskSnapshot.end,
                        _start: taskSnapshot._start,
                        _end: taskSnapshot._end
                    });
                    
                    console.log(`${indent}   Updated Dates:`, {
                        start: taskSnapshot.updatedStart,
                        end: taskSnapshot.updatedEnd
                    });
                    
                    // Process this task using the snapshot data
                    instance.publishState('wf_task_id', taskSnapshot.id);
                    instance.publishState('wf_start_date', taskSnapshot.updatedStart);
                    instance.publishState('wf_end_date', taskSnapshot.updatedEnd);
                    instance.triggerEvent('wf_task_indiv_date_change');
                    
                    // Wait for the database update
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
                
                console.log('\n✅ Task Update Process Completed ----------------');
            })();
        }
    
        // --- Attach Event Listeners ---
    
        // Handle mousedown on the container
        addListener(instance.data.container, 'mousedown', function(e) {
            const task = findTaskElement(e.target);
            if (!task) return;
            if (instance.data.dragState.isMouseDown || instance.data.dragState.activeTaskId) {
                resetDragState();
            }
            
            // Store original dates of all tasks when drag starts
            instance.data.originalTaskDates.clear();
            instance.data.gantt.tasks.forEach(t => {
                instance.data.originalTaskDates.set(t.id, {
                    start: t.start,
                    end: t.end,
                    _start: t._start,
                    _end: t._end,
                    name: t.name,
                    dependencies: t.dependencies
                });
            });
            
            instance.data.dragState.isMouseDown = true;
            instance.data.dragState.mouseStartX = e.clientX;
            instance.data.dragState.mouseStartY = e.clientY;
            instance.data.dragState.startTime = Date.now();
            instance.data.dragState.isDragging = false;
            instance.data.dragState.activeTaskId = task.id;
            instance.data.dragState.dragEndTriggered = false;
        });
    
        // Handle mousemove on document to detect dragging
        addListener(document, 'mousemove', function(e) {
            const ds = instance.data.dragState;
            if (!ds.activeTaskId || !ds.isMouseDown) return;
            const dx = e.clientX - ds.mouseStartX;
            const dy = e.clientY - ds.mouseStartY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 5 && !ds.isDragging) {
                ds.isDragging = true;
                ds.dragEndTriggered = false;
                instance.publishState('task_id', ds.activeTaskId);
            }
        }, { passive: true });
    
        // Handle mouseup on document to finish click or drag actions
        addListener(document, 'mouseup', function(e) {
            const ds = instance.data.dragState;
            if (!ds.isMouseDown) return;
            const duration = Date.now() - ds.startTime;
            if (ds.activeTaskId) {
                if (!ds.isDragging && duration < 200) {
                    instance.publishState('task_id', ds.activeTaskId);
                    instance.triggerEvent('task_clicked');
                } else if (ds.isDragging) {
                    endDrag();
                }
            }
            resetDragState();
        }, { passive: true });
    
        // Handle mouse leaving the container
        addListener(instance.data.container, 'mouseleave', function() {
            const ds = instance.data.dragState;
            if (ds.isDragging && ds.isMouseDown && ds.activeTaskId && !ds.dragEndTriggered) {
                endDrag();
                resetDragState();
            }
        });
    
        // Handle window blur (e.g., user switches tabs)
        addListener(window, 'blur', function() {
            const ds = instance.data.dragState;
            if (ds.isDragging && ds.isMouseDown && ds.activeTaskId && !ds.dragEndTriggered) {
                endDrag();
                resetDragState();
            }
        });

        // Add wheel event listener with passive option
        addListener(instance.data.container, 'wheel', function(e) {
            // Handle wheel events if needed
        }, { passive: true });
        
        // Make touch events passive
        addListener(instance.data.container, 'touchstart', function(e) {
            // Handle touch start if needed
        }, { passive: true });
        
        addListener(instance.data.container, 'touchmove', function(e) {
            // Handle touch move if needed
        }, { passive: true });
    }

    // Initial setup
    instance.data.initializeGantt();

    // Add this helper
    instance.data.checkInitialization = function() {
        const timeSinceInit = Date.now() - instance.data.initializationTime;
        console.log(`Time since initialization: ${timeSinceInit}ms`);
        console.log('Gantt instance state:', {
            hasContainer: !!instance.data.container,
            containerHasParent: !!instance.data.container.parentElement,
            ganttInitialized: !!instance.data.gantt,
            containerDimensions: {
                width: instance.data.container.offsetWidth,
                height: instance.data.container.offsetHeight
            }
        });
    };

    // Update addTasks to handle dependencies better
    instance.data.addTasks = function(tasks) {
        instance.data.checkInitialization();
        console.log('Adding tasks - Raw input:', JSON.stringify(tasks, null, 2));
        
        if (!Array.isArray(tasks)) {
            console.error('Tasks must be an array, received:', typeof tasks);
            return;
        }

        // Validate and format tasks
        const validTasks = tasks.map(task => {
            const formattedTask = {
                id: task.id || String(Date.now()),
                name: task.name || 'Untitled Task',
                start: task.start || new Date(),
                end: task.end || new Date(),
                progress: Number(task.progress) || 0,
                dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
                _start: task.start || new Date(),
                _end: task.end || new Date()
            };
            
            // Ensure dependencies exist in the task list
            if (formattedTask.dependencies.length > 0) {
                formattedTask.dependencies = formattedTask.dependencies.filter(depId => 
                    tasks.some(t => t.id === depId)
                );
            }
            
            console.log('Formatted task:', JSON.stringify(formattedTask, null, 2));
            return formattedTask;
        }).filter(task => {
            const isValid = task.id && task.start && task.end;
            if (!isValid) {
                console.warn('Invalid task filtered out:', task);
            }
            return isValid;
        });

        // Sort tasks so dependencies are added after their prerequisites
        const sortedTasks = [...validTasks].sort((a, b) => {
            if (a.dependencies.includes(b.id)) return 1;
            if (b.dependencies.includes(a.id)) return -1;
            return 0;
        });

        // Update the Gantt chart with validated tasks
        if (instance.data.gantt) {
            try {
                // First clear existing tasks to ensure clean state
                instance.data.gantt.tasks = [];
                
                // Add tasks and wait for render
                instance.data.gantt.refresh(sortedTasks);
                
                // Add a small delay to ensure DOM updates are complete
                setTimeout(() => {
                    // Validate that all tasks have been properly rendered
                    const unrenderedTasks = instance.data.gantt.tasks.filter(task => !task.$bar);
                    if (unrenderedTasks.length > 0) {
                        console.warn('Some tasks were not properly rendered:', unrenderedTasks);
                        // Try to re-render
                        instance.data.gantt.refresh(sortedTasks);
                    }
                    
                    // Additional check for dependency arrows
                    const tasksWithDependencies = instance.data.gantt.tasks.filter(task => 
                        task.dependencies && task.dependencies.length > 0
                    );
                    
                    if (tasksWithDependencies.length > 0) {
                        console.log('Validating dependency renders for tasks:', tasksWithDependencies);
                        instance.data.gantt.refresh(sortedTasks);
                    }
                }, 100);
                
            } catch (error) {
                console.error('Error refreshing Gantt chart:', error);
                console.log('Tasks that caused error:', sortedTasks);
                
                // Attempt recovery by reinitializing
                instance.data.initializeGantt();
                setTimeout(() => {
                    try {
                        instance.data.gantt.refresh(sortedTasks);
                    } catch (retryError) {
                        console.error('Recovery attempt failed:', retryError);
                    }
                }, 100);
            }
        } else {
            console.error('Gantt instance not initialized');
            instance.data.initializeGantt();
            setTimeout(() => {
                try {
                    instance.data.gantt.refresh(sortedTasks);
                } catch (error) {
                    console.error('Error initializing Gantt with tasks:', error);
                }
            }, 100);
        }
    };

    // Add this helper
    instance.data.logOperation = function(operation, details) {
        const entry = {
            timestamp: new Date().toISOString(),
            operation,
            details
        };
        instance.data.dragState.lastOperation = entry;
        instance.data.dragState.operationHistory.push(entry);
        console.log('Operation logged:', entry);
    };
}