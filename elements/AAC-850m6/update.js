function(instance, properties, context) {
    
    instance.data.reset = true;
    const data = properties.data_source.get(0, properties.data_source.length());
    const ganttPopup = document.getElementById('gantt-popup');

    if(ganttPopup){
        ganttPopup.remove(); 
    }

    const parentToChildMap = {};
/*
    tasks.forEach(parentTask => {
        const children = parentTask.get(properties.child_item_ids);
        const childGanttType = children ? children.replace(', ',',') : parentTask.get(properties.child_item_ids);
        if (childGanttType) {
            const childArray = childGanttType.split(","); 
            childArray.forEach(childId => {
                if (!childToParentMap[childId]) {
                    childToParentMap[childId] = [];
                }
                childToParentMap[childId].push(parentTask.get(properties.id));
                
            });
        }	
    });
    */
    tasks.forEach(parentTask => {
        const children = parentTask.get(properties.child_item_ids);
        const parentId = parentTask.get(properties.id);
        const childGanttType = children ? children.replace(', ',',') : parentTask.get(properties.child_item_ids);
        if (childGanttType) {
            const childArray = childGanttType.split(","); 
            childArray.forEach(childId => {
                if (!parentToChildMap[parentId]) {
                    parentToChildMap[parentId] = [];
                }
                parentToChildMap[parentId].push(childId);
                
            });
        }
    });
    
    
    const mappedData = tasks.map(currentTask => {
        const idGanttType = currentTask.get(properties.id);
        const nameGanttType = currentTask.get(properties.name);
        const startGanttType = currentTask.get(properties.start_date);
        const endGanttType = currentTask.get(properties.end_date);
        const descriptionGanttType = properties.description ? currentTask.get(properties.description) : "No Description";
        const progressGanttType = currentTask.get(properties.progress);

        const dependencies = parentToChildMap[idGanttType] || [];

        const mappedTask = {
            id: idGanttType,
            name: nameGanttType,
            description: descriptionGanttType,
            start: startGanttType,
            end: endGanttType,
            progress: progressGanttType * 100,
            dependencies: dependencies.join(),
        };
        return mappedTask;
    });


    function createTaskTable() {
        if (document.getElementById('table-container')) {
            document.getElementById('table-container').remove();
        }

        const container = instance.canvas[0];
        const tableHeight = document.querySelector('.gantt-container').offsetHeight;

        const tableContainer = document.createElement('div');
        tableContainer.id = 'table-container';
        tableContainer.classList.add('table-container');
        tableContainer.style.overflow = 'hidden';  
        tableContainer.style.background = '#fff';
        tableContainer.style.width = '90%';
        tableContainer.style.borderRight = '2px solid #ddd';
        tableContainer.style.height = `${tableHeight}px`;

        container.insertBefore(tableContainer, container.firstChild);

        const headerHeight = document.querySelector('.grid-header').offsetHeight;

        const table = document.createElement('table');
        table.id = 'task-table';
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.tableLayout = 'fixed';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

    
        const headers = ['Task Name', 'Start Date', 'End Date', 'Duration'];
        headers.forEach((headerText, index) => {
            const th = document.createElement('th');
            th.textContent = headerText;
            th.style.height = '75px';
            th.style.backgroundColor = `${properties.table_header_color}`; 
            th.style.position = 'sticky';
            th.style.top = '0';
            th.style.color = `${properties.table_header_font_color}`;
            th.style.zIndex = '9999';
            th.style.borderBottom = '2px solid #ddd'; 
            th.style.padding = '10px';
            th.style.fontWeight = 'bold';
            th.style.textAlign = 'center'; // Center-align headers
            th.style.verticalAlign = 'middle';
            th.style.boxShadow = '0px 2px 5px rgba(0, 0, 0, 0.1)'; 
			th.style.whiteSpace = 'nowrap';   
            th.style.textOverflow = 'ellipsis';
            th.style.overflow = 'hidden';

            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        
    
    }

    function syncScroll(){
        const tableContainer = document.getElementById('table-container');
        const ganttContainer = document.querySelector(
            '.gantt-container',
        );

        tableContainer.addEventListener('scroll', function () {
            ganttContainer.scrollTop = tableContainer.scrollTop;
        });

        ganttContainer.addEventListener('scroll', function () {
            tableContainer.scrollTop = ganttContainer.scrollTop;
        });

    }
    
    function updateTableCellWidths() {
        const tableContainer = document.getElementById('table-container');
        const table = document.getElementById('task-table');
        const headerCells = table.querySelectorAll('th');
        const tableWidth = tableContainer.offsetWidth;

        let totalColumnWidth = 0;
        headerCells.forEach((cell) => {
            totalColumnWidth += cell.offsetWidth;
        });

        const newColumnWidths = [];
        headerCells.forEach((cell) => {
            const newColumnWidth = (cell.offsetWidth / totalColumnWidth) * tableWidth;
            newColumnWidths.push(newColumnWidth);
        });

        headerCells.forEach((cell, index) => {
            cell.style.width = `${newColumnWidths[index]}px`;
        });
    }

    function updateColumnDividersPosition() {
        const headerCells = document.querySelectorAll('#task-table th');
        const tableContainer = document.getElementById('table-container');
        const dividers = document.querySelectorAll('.col-divider');

        headerCells.forEach((cell, index) => {
            const rect = cell.getBoundingClientRect();
            const divider = dividers[index];
            if (divider) {
                divider.style.left = `${rect.right - tableContainer.getBoundingClientRect().left}px`;
            }
        });
    }

    function initializeDivider() {
        const existingDivider = document.getElementById('divider');
        if(existingDivider){
            existingDivider.remove();
        }
        const containerRect = instance.canvas[0].getBoundingClientRect();
        const initialTableWidth = containerRect.width * 0.4; 
        const ganttWidth = containerRect.width - initialTableWidth - 10;

        document.getElementById('table-container').style.width = `${initialTableWidth}px`;
        document.querySelector('.gantt-container').style.width = `${ganttWidth}px`;

        const divider = document.createElement('div');
        divider.id = 'divider';
        divider.style.cursor = 'ew-resize';
        divider.style.backgroundColor = '#ddd';
        divider.style.width = '10px';
        divider.style.height = `${document.querySelector('.gantt-container').offsetHeight}px`;
        divider.style.position = 'absolute';
        divider.style.top = '0';
        divider.style.left = `${initialTableWidth}px`;
        divider.style.zIndex = '10';


        instance.canvas.append(divider);

        let isResizing = false;

        divider.addEventListener('mousedown', () => {
            isResizing = true;
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (isResizing) {
                const scrollbarWidth = 15;
                const rightLimit = containerRect.width - scrollbarWidth;

                const newTableWidth = Math.max(
                    Math.min(e.clientX - containerRect.left, rightLimit),
                    0
                );
                const newGanttWidth = containerRect.width - newTableWidth - divider.offsetWidth;



                document.getElementById('table-container').style.width = `${newTableWidth}px`;
                document.querySelector('.gantt-container').style.width = `${newGanttWidth}px`;
                divider.style.left = `${newTableWidth}px`;
                updateTableCellWidths();
                updateColumnDividersPosition();
            }
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.body.style.cursor = 'default';
        });
    }


    function populateTable() {
        const resetTable = document.querySelector("#task-table tbody");
        resetTable.innerHTML = "";
        const tbody = document
        .getElementById('task-table')
        .getElementsByTagName('tbody')[0];

        const cellHeight = document.querySelector('.grid > g > rect').height.baseVal.value;

        mappedData.forEach((task, index) => {
            const row = tbody.insertRow();
            const cellName = row.insertCell(0);
            const cellStart = row.insertCell(1);
            const cellEnd = row.insertCell(2);
            const cellduration = row.insertCell(3);

            cellName.textContent = task.name;
            cellStart.textContent = new Date(task.start).toISOString().slice(0, 10) || 'N/A';
            cellEnd.textContent =
                new Date(task.end).toISOString().slice(0, 10) || 'N/A';
            cellduration.textContent = Math.ceil((new Date(task.end) - new Date(task.start)) / (1000 * 60 * 60 * 24));

            [cellName, cellStart, cellEnd, cellduration].forEach((cell) => {
                cell.style.height = `${cellHeight}px`;
                cell.style.borderBottom = '1px solid #ddd';
                cell.style.textAlign = 'center';
                cell.style.padding = '6px';
                cell.style.fontSize = '14px';
                cell.style.color = `${properties.table_row_font_color}`;
                cell.style.whiteSpace = 'nowrap';   
                cell.style.textOverflow = 'ellipsis';
                cell.style.overflow = 'hidden';
            });


            if (index % 2 === 0) {
                row.style.backgroundColor = '#f9f9f9'; 
            } else {
                row.style.backgroundColor = '#ffffff';
            }

            row.addEventListener('mouseenter', () => {
                row.style.backgroundColor = '#e0f7fa'; 
            });
            row.addEventListener('mouseleave', () => {
                row.style.backgroundColor = index % 2 === 0 ? '#f9f9f9' : '#ffffff';
            });
        });
    }

    const columnIndices = {
        name: 0,
        start: 1,
        end: 2,
        duration: 3
    };

    // Hide columns only when the respective property is `false`
    const hideColumns = [
        false && columnIndices.name,
        false && columnIndices.start,
        false && columnIndices.end,
        false && columnIndices.duration
    ].filter(index => index !== false);
    
    // if(hideColumns.length === Object.keys(columnIndices).length) {
    //     instance.triggerEvent("empty_columns");

    // }

    function hideColumnsByIndices(columnIndices) {
        var table = document.getElementById("task-table");
        var rows = table.rows;

        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < rows[i].cells.length; j++) {
                rows[i].cells[j].style.display = ''; // Reset visibility
            }
        }

        for (var i = 0; i < rows.length; i++) {
            columnIndices.forEach(index => {
                if (rows[i].cells[index]) {
                    rows[i].cells[index].style.display = 'none'; 
                }
            });
        }
        updateColumnDividersPosition();
    }

    function observeTableRowsForColumns(columnIndices) {
        var table = document.getElementById("task-table");

        if (table && table.rows.length > 0) {
            hideColumnsByIndices(columnIndices); 
            return; 
        }

        var observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList' && table.rows.length > 0) {
                    hideColumnsByIndices(columnIndices); 
                    observer.disconnect();
                    break;
                }
            }
        });

        observer.observe(table, { childList: true, subtree: true });
    }
    
    function addDragFunctionality(divider, columnIndex, dividers) {
        const table = document.querySelector('#task-table');
        const headerCells = table.querySelectorAll('th');
        const minWidth = 50;
        let isDragging = false;

        divider.addEventListener('mousedown', (event) => {
            isDragging = true;
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
            event.preventDefault();
        });

        document.addEventListener('mousemove', (event) => {
            if (isDragging) {
                const currentCell = headerCells[columnIndex];
                const nextCell = headerCells[columnIndex + 1];
                const dividerRect = divider.getBoundingClientRect();
                const tableRect = table.getBoundingClientRect();

                const deltaX = event.clientX - dividerRect.left;
                const newCurrentWidth = currentCell.offsetWidth + deltaX;
                const newNextWidth = nextCell.offsetWidth - deltaX;

                // Check boundaries to ensure columns don't shrink below the minimum width
                if (newCurrentWidth > minWidth && newNextWidth > minWidth) {
                    currentCell.style.width = `${newCurrentWidth}px`;
                    nextCell.style.width = `${newNextWidth}px`;

                  
                    divider.style.left = `${currentCell.offsetLeft + currentCell.offsetWidth}px`;
                }
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
            }
        });
    }

    function createColumnDivider () {
        const table = document.querySelector('#task-table');
        const headerCells = table.querySelectorAll('th');
        const tableContainer = document.getElementById('table-container');
        let dividers = [];
        
        tableContainer.addEventListener('mouseenter', () => {
            dividers.forEach(divider => {
                divider.style.opacity = '1';
            });
        });

        tableContainer.addEventListener('mouseleave', () => {
            dividers.forEach(divider => {
                divider.style.opacity = '0';
            });
        });

        for (let i = 0; i < headerCells.length - 1; i++) {
            
            const divider = document.createElement("div");
            divider.classList.add("col-divider");
            divider.style.position = 'absolute';
            divider.style.width = '1px';
            divider.style.cursor = 'ew-resize';
            divider.style.backgroundColor = 'gray';
            divider.style.height = `${table.offsetHeight}px`;
            divider.style.opacity = '0'; 
            divider.style.transition = 'opacity 0.3s'; 
            //divider.style.zIndex = '2';
            tableContainer.appendChild(divider);


            const rect = headerCells[i].getBoundingClientRect();

            
            divider.style.top = `${table.offsetTop}px`;
            divider.style.left = `${rect.right - table.getBoundingClientRect().left }px`;

            // Add drag functionality
            dividers.push(divider);

        }
        dividers.forEach((divider, i) => {
            addDragFunctionality(divider, i, dividers);
        });
    }
    
    
    function toggleMarkersVisibility(show_markers) {
  
/*        
        markers.forEach(marker => {
            marker.style.display = show_markers ? "block" : "none";
        });
*/        
    }

    function setLabelOption (enableLabelMoving) {
        const oldOption = instance.data.gantt.options;
        const newOption = {...oldOption, auto_move_label: enableLabelMoving };
        instance.data.gantt.options = newOption;
    }
    
    
    function generatePopup(task, field, color) {      
        const options = { month: 'short', day: 'numeric', ...(field && { year: 'numeric' })};
        const startDate = new Date(task.start).toLocaleDateString('en-US', options);
        const endDate = new Date(task.end).toLocaleDateString('en-US', options);
        
        if(!field) {
        	return `<div id="task-detail" style="font-family: 'Segoe UI', sans-serif; background-color: ${color}; font-size: 14px; line-height: 1.1; text-align: center; 				padding: 0; margin: 0;">
                <p style="margin: 0 0 8px; padding: 0;"><strong>${task.name}</strong></p>
                <p style="margin: 0;">${startDate}</strong> - ${endDate}</p>
                <p style="margin: 0;">Duration: ${parseInt((new Date(task.start) - new Date(task.end)) / (1000 * 60 * 60 * 24))} days</p>
                <p style="margin: 0;">Progress: ${Math.floor(task.progress)}%</p>
            </div>`
        }
        
        const progress = `${task.progress}%`;

        const matchingTaskFromDb = tasks.find(dbTask => dbTask.get(properties.id).toString() === task.id);

        let parentTaskNames = "empty";

        if (matchingTaskFromDb) {
            const parentGanttTypeList = matchingTaskFromDb.get("parent_task_s__list_custom_gantt_task");

            if (parentGanttTypeList) {
                parentTaskNames = parentGanttTypeList
                    .get(0, parentGanttTypeList.length())
                    .map(parent => parent.get("name_text"));
            }
        }

        const keyMap = {
            [properties.id]: "Id",
            [properties.name]: "Name",
            "parent_task_id_text": "Parent Ids",
            [properties.description]: "Description",
            [properties.progress]: "Progress",
            [properties.start_date]: "Start Date",
            [properties.end_date]: "End Date",
            "parent_task_s__list_custom_gantt_task": "Parent Tasks"
        };

        const valueMap = {
            [properties.id]: task.id,
            [properties.name]: task.name,
            ...(task.dependencies.length !== 0 ? { "parent_task_id_text": task.dependencies } : {"parent_task_id_text": "empty"}),
            [properties.description]: task.description,
            [properties.progress]: progress,
            [properties.start_date]: startDate,
            [properties.end_date]: endDate,
            "parent_task_s__list_custom_gantt_task": parentTaskNames
        };

        const value = valueMap[field];
        const key = keyMap[field];   

        const taskDetails = `
            <div style="
                font-family: 'Segoe UI', sans-serif; 
                background-color: ${color ? color : 'white'}; 
                font-size: 14px; 
                line-height: 1.1; 
                text-align: center; 
                padding: 0; 
                margin: 0;
			">
                <p style="margin: 0 0 8px; padding: 0;"><strong>${key}: </strong>${value}</p>
            </div>
		`;	

        return taskDetails;
    }
    
    function setPopupOption(disableToolTip, field, bgColor) {
        const popupWrapper = document.querySelector('.popup-wrapper');
        popupWrapper.style.backgroundColor = bgColor ? bgColor : 'white';
        popupWrapper.style.border = '2px solid #ccc';
        popupWrapper.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        
/*
        if (!field) {
            const defaultHtml = popupWrapper.innerHTML;

            const newHtml = defaultHtml.replace('background-color: white', `background-color: ${bgColor}`);
            popupWrapper.innerHTML = newHtml;
            return;
        }
*/
        const oldOption = instance.data.gantt.options;
        const popup = disableToolTip ? false : (task) => generatePopup(task, field, bgColor);
        
        

        let newOption = {
            ...oldOption,
            popup
        };

        instance.data.gantt.options = newOption;
    }
    
    function setHandleBarVisiblity() {
        //if(!properties.enable_task_dragging) return '';
        // let handleBarHTML = !properties.hover_handle_bar ? `.handle {
        //     display: block !important;
        //     visibility: visible !important;
        //     opacity: 1 !important;
		// 	fill: ${properties.handle_bar_color} !important
        // }` : 
        // ` .handle {
        //     display: none;
        //     visibility: hidden;
        //     opacity: 0;
        //     transition: opacity 0.2s;
		// 	fill: ${properties.handle_bar_color} !important
        // }
        
        // .bar-wrapper:hover .handle,
        // .handle:hover,
        // .bar-wrapper.dragging .handle {
        //     display: block !important;
        //     visibility: visible !important;
        //     opacity: 1 !important;
		// 	fill: ${properties.handle_bar_color} !important
        // }`
        const handleBarHTML = `
            .handle-group rect {
                fill: ${properties.handle_bar_color} !important
            }
        `
        return handleBarHTML;
    }
    
    function applyHandleVisibility(enableDraggingProgress, innerHTML, disableDraggingProgressControls) {
        const styleRule = enableDraggingProgress && !disableDraggingProgressControls
        ? `.handle.progress { display: block !important; }` // Show
        : `.handle.progress { display: none !important; }`; // Hide

        if(disableDraggingProgressControls){
            instance.triggerEvent('progress_dragging_control_disabled');
        }

        return `
            ${innerHTML}	
            ${styleRule}
            ${setHandleBarVisiblity()}
        `;
    }
    
    /*
    function toggleTaskDragging(toggleValue) {
        const oldOption = instance.data.gantt.options;
        const newOption = {...oldOption, readonly_dates: !toggleValue};
        instance.data.gantt.options = newOption;
		instance.data.gantt.update_options({readonly_dates: !toggleValue});        
    }*/
    function moveChildParent(moveValue) {
        const oldOption = instance.data.gantt.options;
        const newOption = {...oldOption, move_dependencies: moveValue};
        instance.data.gantt.options = newOption;     
    }
    
    function handleBarWrappers() {
//        const barWrappers = document.querySelectorAll('.bar-wrapper');
        const barGroups = document.querySelectorAll(".bar-group");

        const svg = document.querySelector("svg");
        const svgRect = svg.getBoundingClientRect();
        let handlesInnerHTML = '';

        barGroups.forEach((barGroup) => {
            //console.log('bar-id:', barWrapper.getAttribute('data-id'));  // Access the data-id of each bar-wrapper

            const bar = barGroup.querySelector('.bar');
            /*
            const barRect = barElement ? barElement.getBoundingClientRect() : { left: 0, width: 0, top: 0, height: 0 };

            const leftHandleX = barRect.left - svgRect.left;  // Place the left handle at the start of the bar
            const rightHandleX = barRect.right - svgRect.left - 5;
			*/
            
            const barRect = bar.getBoundingClientRect();
            const startX = barRect.left - svgRect.left;
            const endX = barRect.right - svgRect.left;

            // Add dynamic styles for each bar-wrapper
            barGroup.style.setProperty('--left-handle-x', `${startX}px`);
            barGroup.style.setProperty('--right-handle-x', `${endX}px`);
        });
    }

    function startBarWrapperObserver(callback) {
        
        // Create a MutationObserver to monitor changes in the DOM
        const observer = new MutationObserver((mutationsList, observer) => {

            for (let mutation of mutationsList) {
                // Check if nodes were added
                if (mutation.type === 'childList') {
                    callback();
                    observer.disconnect();
                    break;
                }
            }
        });

        // Start observing the document (or a specific parent node)
        observer.observe(document.body, {
            childList: true,  // Look for added/removed child elements
            subtree: true     // Also monitor changes inside descendants (deep observation)
        });
        return observer;
    };
    
    let taskDragging = false;
    let lastTask = null;
    let lastStart = null;
    let lastEnd = null;
   
    function addOnDateChangeOption () {
    
        const oldOption = instance.data.gantt.options;
        const onDateChange = function(task, start, end) {
            console.log(taskDragging);
            lastTask = task;
            lastStart = start;
            lastEnd = end;
            //instance.data.reset = false;
            //instance.data.changeDateParams = [task, start, end];
            //console.log(start,end);
            //save in array
            //always check last array data is not equal to current data then save - now if last array data is equal to current data then change
            // - last array data === current data condition will never be executed because dragging item will always change its data
            //if array is not empty on mouse down event then process date change if empty dont do anything
            //setupPolyMarker();
            if (!taskDragging) {
                taskDragging = true;

                const ganttElement = document.getElementById('gantt');
                const existingListener = ganttElement.getAttribute('data-mouseup-listener');

                if (!existingListener){
                    ganttElement.addEventListener('mouseup', async () => {
                        console.log('triggering...');
                        taskDragging = false;

                        instance.publishState('task_id', lastTask.id);
                        instance.publishState('task_name', lastTask.name);
                        instance.publishState('changed_task_start_date', lastStart);
                        instance.publishState('changed_task_end_date', lastEnd);
                        instance.data.reset = false;

                        await instance.triggerEvent("date_changed");
                    }, { once: true });
                    
                     ganttElement.setAttribute('data-mouseup-listener', 'true');
                }

            } 
        };
        const newOption = {...oldOption, 'on_date_change': onDateChange}
        instance.data.gantt.options = newOption;
    }
                        


    
    function init() {
        const ganttElement = document.getElementById('gantt');
        const existingListener = ganttElement.removeAttribute('data-mouseup-listener');
        instance.data.gantt.clear();


        if (properties.show_table && true){
            createTaskTable();
            syncScroll();
            populateTable();
            initializeDivider();
            createColumnDivider();
            observeTableRowsForColumns(hideColumns);
        }

        else {
            if (document.getElementById('table-container')) {
                document.getElementById('table-container').remove();
                document.getElementById('divider').remove();
            }
            
            if(properties.disable_table_controls) {
                instance.triggerEvent('table_control_disabled');
            }
            
            const bubbleElement = instance.canvas[0];
            const ganttContainer = document.querySelector('.gantt-container');
            ganttContainer.style.width = `${bubbleElement.offsetWidth}px`;
        }
        const style = document.createElement('style');
        let innerHTML = "";
        
        
        innerHTML =  `
            .gantt .bar-progress {
            	${properties.progress_color ? `fill: ${properties.progress_color} !important` : ""};
            }
            .bar-label {
            	fill: ${properties.text_color} !important; /* Change font color to red */
            }
            .handle-group circle {
            	display: block
            }
            .upper-text {
            	color: ${properties.header_month_font_color} !important;
            	${properties.header_month_font_size ? `font-size: ${properties.header_month_font_size}px !important;` : ""}
            }
			.lower-text {
				${properties.header_date_font_size ? `font-size: ${properties.header_date_font_size}px !important;` : ""}
			}
			.lower-text:not(.current-date-highlight) {
                color: ${properties.header_date_font_color} !important;
            }
		
		`;

        
//        innerHTML = applyHandleVisibility(properties.toggle_progress_dragging, innerHTML, properties.disable_progress_dragging_controls);
        innerHTML = applyHandleVisibility(properties.toggle_progress_dragging, innerHTML, false);
        
        style.innerHTML = innerHTML;
        document.head.appendChild(style);

        addOnDateChangeOption();
        toggleMarkersVisibility(properties.show_markers);
        setLabelOption(properties.enable_label_movement);
        moveChildParent(properties.move_child_with_parent);
        setPopupOption(properties.disable_tooltip, properties.display_task_detail_on_hover, properties.tooltip_popup_background);
      //  toggleTaskDragging(properties.enable_task_dragging);
        //setPopupBackgroundColor(properties.hover_details_background_color);
        startBarWrapperObserver(() => {
            handleBarWrappers();  // Get the updated handle styles
        });
    }
    

    
    init();
    instance.data.gantt.refresh(mappedData);
    instance.data.tasks = mappedData;
    
    //instance.data.gantt.refresh(mappedData.sort((a, b) => new Date(a.start) - new Date(b.start)));
    //instance.data.tasks = mappedData.sort((a, b) => new Date(a.start) - new Date(b.start));
    //instance.data.polyline_state = properties.show_markers && !properties.disable_polyline_controls;
   instance.data.polyline_state = properties.show_markers && true;

    instance.data.markerParams = {markerColor: properties.marker_color, lineColor: properties.polyline_color};
    
    instance.data.gantt.change_view_mode(properties.view_mode || 'Day'); 
    
    if (instance.data.polyline_state) { 
        instance.data.updateMarker(instance.data.markerParams.markerColor,instance.data.markerParams.lineColor); 
    }
    /*
    else {
        if(properties.disable_polyline_controls) {
            instance.triggerEvent('polyline_control_disabled');
        }
    }
    if(properties.disable_task_dragging_controls){
        instance.triggerEvent('task_dragging_control_disabled');
    }
    */

}