function(instance, context) {
    console.log('🙂');
    // Create container element for the Gantt chart
    instance.data.container = document.createElement('div');
    instance.data.container.id = 'gantt-chart';
    instance.canvas.append(instance.data.container);
  
    // Set initial state
    instance.data.last_dragged_task_date = null;
    instance.data.initialized = true;
    instance.data.internalUpdate = false;
    
    // Add storage for original task dates
    instance.data.originalTaskDates = new Map();
    
    instance.data.dragState = {
      mouseStartX: 0,
      mouseStartY: 0,
      startTime: 0,
      isDragging: false,
      activeTaskId: null,
      dragEndTriggered: false,
      isMouseDown: false
    };
  
    // Create the initial (empty) Gantt instance
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
        // Silent
      },
      on_click: function(task) {
        return false;
      }
    });
  
    // For managing event listeners for potential cleanup later
    instance.data._ganttListeners = [];
  
    // Helper: add event listeners and store them for cleanup
    function addListener(target, type, fn, options) {
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
}