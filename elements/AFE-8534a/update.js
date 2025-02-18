function(instance, properties, context) {
  // State tracking
  let mouseStartX = 0;
  let mouseStartY = 0;
  let startTime = 0;d
  let isDragging = false;
  let activeTaskId = null;
  let dragEndTriggered = false;
  let isMouseDown = false;

    
  // const filterUnchangedTasks = (t) => (t.filter(tk => tk.start !== tk._start || tk.end !== tk._end));
  const filterUnchangedTasks = (t) => {
    return t.filter(tk => {
        const startChanged = new Date(tk.start).getTime() !== new Date(tk._start).getTime();
        const endChanged = new Date(tk.end).getTime() !== new Date(tk._end).getTime();
        return startChanged || endChanged;
    });
  };

    
  // Initialize instance data

  const taskLen = properties.data_source.length();
  const taskList = properties.data_source.get(0, taskLen);

  function mapTasks(data) {
    return data.map(task => ({
      id: task.get("_id"),
      name: task.get("name_text"),
      start: task.get("start_date_date"),
      end: task.get("end_date_date"),
      progress: task.get("progress_number") ? task.get("progress_number") * 100 : 0,
      dependencies: task.get("arrowfrom_text")?.split(",") || [],
    }));
  }

  const tasks = mapTasks(taskList);
  const container = document.getElementById("gantt-chart");
  if (!container) return;
  container.innerHTML = "";
  instance.canvas.append(container);
  // Remove any existing event listeners if they exist
  const oldListeners = container._ganttListeners;
  if (oldListeners) {
    for (const {type, fn} of oldListeners) {
      container.removeEventListener(type, fn);
    }
  }

  // Store new listeners for cleanup
  container._ganttListeners = [];

  const gantt = new Gantt("#gantt-chart", tasks, {
    auto_move_label: false,
    move_dependencies: true,
    readonly_progress: true,
    view_mode_select: true,
    popup: false,
    scroll_to: instance.data.last_dragged_task_date || "today",
    readonly: properties.read_only,
    holidays: {
      '#bfdbfe': []
    },
    on_date_change: (task, start, end) => {
        // console.log(task);
    },
    on_click: (task) => false
  });

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

  function endDrag() {
    if (!activeTaskId || !isDragging || dragEndTriggered) return;
    dragEndTriggered = true;
    
    // ==========================================
    // PUT YOUR DRAG END CODE HERE
    // Available data:
    // - activeTaskId: ID of the task being dragged
    // - gantt.tasks: Array of all tasks
    // - You can use gantt.get_task(activeTaskId) to get task data
    // ==========================================
    const changedTasks = filterUnchangedTasks(gantt.tasks);
	console.log(changedTasks);
    instance.publishState('updated_task_list', changedTasks.map(x => JSON.stringify(x)));
    instance.data.last_dragged_task_date = gantt.tasks.find(x => x.id === activeTaskId)._start;
    
    instance.publishState('task_id', activeTaskId);
    // instance.triggerEvent('task_drag_ended');
            
    // New sequential processing functionality
    /*
    async function processTasksSequentially() {
        instance.publishState('is_loading', true);
        for (const task of changedTasks) {
            // Publish states for current task
            instance.publishState('wf_task_id', task.id);
            instance.publishState('wf_start_date', task._start);
            instance.publishState('wf_end_date', task._end);
            
            // Trigger the workflow event
            instance.triggerEvent('wf_task_indiv_date_change');
            
            // Wait for a short delay to ensure workflow completion
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        instance.triggerEvent('loading_complete');
    }
    */
    // Start the sequential processing
    // processTasksSequentially();
            
  }

  function resetState() {
    isDragging = false;
    activeTaskId = null;
    startTime = 0;
    mouseStartX = 0;
    mouseStartY = 0;
    dragEndTriggered = false;
    isMouseDown = false;
  }

/*  function addListener(type, fn) {
    const wrappedFn = (...args) => fn(...args);
    container.addEventListener(type, wrappedFn);
    container._ganttListeners.push({ type, fn: wrappedFn });
  } 
*/
  function addListener(type, fn) {
      const wrappedFn = (...args) => fn(...args);
      // Add passive option for specific events that can block scrolling
      const options = ['mousewheel', 'touchstart', 'touchmove', 'wheel'].includes(type) 
        ? { passive: true }
        : false;
      
      container.addEventListener(type, wrappedFn, options);
      container._ganttListeners.push({ type, fn: wrappedFn });
    }

  // Mouse event handlers
  addListener('mousedown', (e) => {
    const task = findTaskElement(e.target);
    if (!task) return;

    // Reset any existing state first
    if (isMouseDown || activeTaskId) {
      resetState();
    }

    isMouseDown = true;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
    startTime = Date.now();
    isDragging = false;
    activeTaskId = task.id;
    dragEndTriggered = false;
  });

  document.addEventListener('mousemove', (e) => {
    if (!activeTaskId || !isMouseDown) return;

    const dx = e.clientX - mouseStartX;
    const dy = e.clientY - mouseStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5 && !isDragging) {
      isDragging = true;
      dragEndTriggered = false;
      
      // ==========================================
      // PUT YOUR DRAG START CODE HERE
      // Available data:
      // - activeTaskId: ID of the task being dragged
      // - dx, dy: Distance moved from start position
      // - gantt.tasks: Array of all tasks
      // - You can use gantt.get_task(activeTaskId) to get task data
      // ==========================================
      
      instance.publishState('task_id', activeTaskId);
    }
  });

  document.addEventListener('mouseup', (e) => {
    if (!isMouseDown) return;

    const duration = Date.now() - startTime;

    if (activeTaskId) {
      if (!isDragging && duration < 200) {
        // ==========================================
        // PUT YOUR CLICK CODE HERE
        // Available data:
        // - activeTaskId: ID of the clicked task
        // - gantt.tasks: Array of all tasks
        // - You can use gantt.get_task(activeTaskId) to get task data
        // ==========================================
        
        instance.publishState('task_id', activeTaskId);
        instance.triggerEvent('task_clicked');
      } else if (isDragging) {
        endDrag();
      }
    }

    resetState();
  });

  // Handle edge cases
  addListener('mouseleave', () => {
    if (isDragging && isMouseDown && activeTaskId) {
      endDrag();
      resetState();
    }
  });

  window.addEventListener('blur', () => {
    if (isDragging && isMouseDown && activeTaskId) {
      endDrag();
      resetState();
    }
  });

  
} 