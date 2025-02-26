function(instance, properties) {
    // Create a more realistic preview of the Gantt chart for the Bubble editor
    const previewContainer = document.createElement('div');
    previewContainer.className = 'gantt-preview-container';
    previewContainer.style.width = '100%';
    previewContainer.style.height = '100%';
    previewContainer.style.overflow = 'hidden';
    previewContainer.style.position = 'relative';
    previewContainer.style.fontFamily = 'Arial, sans-serif';
    
    // Create header with timeline
    const header = document.createElement('div');
    header.className = 'gantt-preview-header';
    header.style.display = 'flex';
    header.style.borderBottom = '1px solid #e0e0e0';
    header.style.backgroundColor = '#f5f5f5';
    header.style.height = '40px';
    
    // Add some date columns
    const dates = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const dateDisplay = document.createElement('div');
    dateDisplay.style.display = 'flex';
    dateDisplay.style.width = '100%';
    
    dates.forEach(date => {
        const dateCol = document.createElement('div');
        dateCol.textContent = date;
        dateCol.style.flex = '1';
        dateCol.style.textAlign = 'center';
        dateCol.style.padding = '10px 0';
        dateCol.style.borderRight = '1px solid #e0e0e0';
        dateCol.style.color = '#555';
        dateCol.style.fontSize = '12px';
        dateCol.style.fontWeight = 'bold';
        dateDisplay.appendChild(dateCol);
    });
    
    header.appendChild(dateDisplay);
    previewContainer.appendChild(header);
    
    // Create task grid
    const taskGrid = document.createElement('div');
    taskGrid.className = 'gantt-preview-grid';
    taskGrid.style.display = 'flex';
    taskGrid.style.flexDirection = 'column';
    taskGrid.style.height = 'calc(100% - 40px)';
    
    // Sample tasks data
    const tasks = [
        { name: 'Design Phase', progress: 80, start: 0, duration: 2 },
        { name: 'Development', progress: 50, start: 1, duration: 3 },
        { name: 'Testing', progress: 20, start: 3, duration: 2 }
    ];
    
    // Create task rows
    tasks.forEach(task => {
        const taskRow = document.createElement('div');
        taskRow.className = 'gantt-preview-task-row';
        taskRow.style.position = 'relative';
        taskRow.style.height = '40px';
        taskRow.style.borderBottom = '1px solid #e0e0e0';
        
        // Task name
        const taskName = document.createElement('div');
        taskName.className = 'gantt-preview-task-name';
        taskName.textContent = task.name;
        taskName.style.position = 'absolute';
        taskName.style.left = '5px';
        taskName.style.top = '10px';
        taskName.style.fontSize = '12px';
        taskName.style.color = '#333';
        taskRow.appendChild(taskName);
        
        // Task bar
        const taskBar = document.createElement('div');
        taskBar.className = 'gantt-preview-task-bar';
        taskBar.style.position = 'absolute';
        taskBar.style.height = '20px';
        taskBar.style.borderRadius = '3px';
        taskBar.style.backgroundColor = '#b8c2cc';
        taskBar.style.top = '10px';
        taskBar.style.left = `${(task.start / 5) * 100}%`;
        taskBar.style.width = `${(task.duration / 5) * 100}%`;
        
        // Task progress
        const taskProgress = document.createElement('div');
        taskProgress.className = 'gantt-preview-task-progress';
        taskProgress.style.position = 'absolute';
        taskProgress.style.height = '100%';
        taskProgress.style.width = `${task.progress}%`;
        taskProgress.style.backgroundColor = '#ff8000';
        taskProgress.style.borderRadius = '3px 0 0 3px';
        taskBar.appendChild(taskProgress);
        
        taskRow.appendChild(taskBar);
        taskGrid.appendChild(taskRow);
    });
    
    previewContainer.appendChild(taskGrid);
    
    // Create vertical grid lines
    for (let i = 1; i < dates.length; i++) {
        const gridLine = document.createElement('div');
        gridLine.className = 'gantt-preview-grid-line';
        gridLine.style.position = 'absolute';
        gridLine.style.top = '40px';
        gridLine.style.bottom = '0';
        gridLine.style.width = '1px';
        gridLine.style.backgroundColor = '#e0e0e0';
        gridLine.style.left = `${(i / dates.length) * 100}%`;
        previewContainer.appendChild(gridLine);
    }
    
    // Today marker
    const todayMarker = document.createElement('div');
    todayMarker.className = 'gantt-preview-today';
    todayMarker.style.position = 'absolute';
    todayMarker.style.top = '40px';
    todayMarker.style.bottom = '0';
    todayMarker.style.width = '2px';
    todayMarker.style.backgroundColor = '#19b1ff';
    todayMarker.style.left = '40%';
    previewContainer.appendChild(todayMarker);
    
    instance.canvas.append(previewContainer);
}