function(instance, context) {

    let polyline = null;
    let isDragging = false;
    let parentTaskId = null;
    let isClicked = false;

    const bubbleElement = instance.canvas[0];
    bubbleElement.style.display = 'flex';
    
	console.log('master');

    const container = document.createElement('div');
    container.id = 'gantt';
    container.style.overflow = 'hidden';
    container.style.background = 'white';
    container.style.flexGrow = '1';

    instance.canvas.append(container);

    const initialData = [{
        id: "", 
        name: "", 
        start: new Date(), 
        end: new Date(), 
        progress: 0
    }];
    
    const today = new Date();
    const twelveDaysAgo = new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000);
    
    let taskDragging = false;
    let lastTask = null;
    let lastStart = null;
    let lastEnd = null;
    instance.data.changedDate = [];
    
    const options = {
        popup: false,
        scroll_to: twelveDaysAgo,
        popup_on: 'hover',       
        custom_popup_html: null,
        handle_display: 'hover',
        popup_trigger: 'hover',
        move_dependencies: false,

        popup: function(task) {
            
 			const taskDetails = `<div id="task-detail" style="font-family: 'Segoe UI', sans-serif; background-color: white; font-size: 14px; line-height: 1.1; text-align: center; padding: 0; margin: 0;">
                <p style="margin: 0 0 8px; padding: 0;"><strong>${task.name}</strong></p>
                <p style="margin: 0;">${formatDate(task.start)}</strong> - ${formatDate(task.end)}</p>
                <p style="margin: 0;">Duration: ${calculateDuration(task.start, task.end)} days</p>
                <p style="margin: 0;">Progress: ${Math.floor(task.progress)}%</p>
            </div>`;
            return taskDetails
        },
/*
        on_date_change: async function(task, start, end) {
            instance.data.reset = false;
            instance.data.changedDate.push({task: })

            console.log(taskDragging)
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
                //const ganttElement = document.getElementById('gantt');
                //const existingListener = ganttElement.getAttribute('data-mouseup-listener');
                
                //if(!existingListener){
                document.querySelector('.gantt').addEventListener('mouseup', () => {
                    taskDragging = false;
                    instance.publishState('task_id', lastTask.id);
                    instance.publishState('task_name', lastTask.name);
                    instance.publishState('changed_task_start_date', lastStart);
                    instance.publishState('changed_task_end_date', lastEnd);


                    instance.triggerEvent("date_changed");

                }, {once: true});

            }
  
            //}
            
			

            /*
            const draggingItem = (task.start.getTime() !== start.getTime() && task.end.getTime() !== end.getTime());
           console.log('isTaskDragging?: ', draggingTask)

            if (!draggingItem && (task.start > end || task.end < start)){
            	instance.triggerEvent('date_exceeded');
            }
            else{
            	instance.data.dateChangedTasks.push({task, start, end});
                if(task.dependencies.length === 0) 
                instance.triggerEvent('process_date_change');

                instance.publishState('task_id', task.id);
                instance.publishState('task_name', task.name);
                instance.publishState('changed_task_start_date', start);
                instance.publishState('changed_task_end_date', end);
                instance.data.reset = false;

                instance.triggerEvent("date_changed");
            }
            */

        //},
        on_progress_change: async function(task, progress) {
            instance.publishState('task_id', task.id);
            instance.publishState('task_name', task.name);
            instance.publishState('changed_task_progress', progress/100);
            instance.data.reset = false;



            instance.triggerEvent("progress_changed");
        },

        on_click: async function(task) {

            //createPopup(task);
            if (instance.data.reset) {
                instance.publishState('task_id', task.id);
                instance.publishState('task_name', task.name);
                instance.publishState('progress', task.progress);
                instance.publishState('start_date', task.start);            
                instance.publishState('end_date', task.end);
                //instance.publishState('parents', task.dependencies);

                instance.triggerEvent('task_clicked');
            }
            /*
            else {
            	if (instance.data.changeDateParams && instance.data.changeDateParams.length > 0) {
                   const [task, start, end] = instance.data.changeDateParams;
                    
  
                }
            }*/

        },    
/*
        on_render: function() {
            console.log('on_render called');
            
            const bars = document.querySelectorAll('.bar-wrapper');
            console.log('Found bars:', bars.length);
            
            bars.forEach(bar => {
                const showHandles = () => {
                    console.log('Showing handles for bar:', bar.getAttribute('data-id'));
                    const handles = bar.querySelectorAll('.handle');
                    console.log('Found handles:', handles.length);
                    handles.forEach(handle => {
                        console.log('Handle type:', handle.classList);
                        handle.style.display = 'block';
                        handle.style.visibility = 'visible';
                        handle.style.opacity = '1';
                    });
                };

                const hideHandles = (e) => {
                    console.log('Hide handles called');
                    console.log('Dragging state:', bar.classList.contains('dragging'));
                    console.log('Related target:', e.relatedTarget);
                    if (bar.classList.contains('dragging')) {
                        console.log('Prevented hide due to dragging');
                        return;
                    }
                    
                    if (e.relatedTarget && (
                        e.relatedTarget.classList.contains('handle') ||
                        e.relatedTarget.closest('.handle') ||
                        e.relatedTarget.closest('.bar-wrapper') === bar
                    )) {
                        console.log('Prevented hide due to related target');
                        return;
                    }
                    
                    const handles = bar.querySelectorAll('.handle');
                    handles.forEach(handle => {
                        handle.style.display = 'none';
                        handle.style.visibility = 'hidden';
                        handle.style.opacity = '0';
                    });
                };

                // Add mousedown handler to handles
                const handles = bar.querySelectorAll('.handle');
                handles.forEach(handle => {
                    handle.addEventListener('mousedown', () => {
                        console.log('Handle mousedown, adding dragging class');
                        bar.classList.add('dragging');
                    });
                });

                document.addEventListener('mouseup', () => {
                    console.log('Document mouseup');
                    console.log('Bar hover state:', bar.matches(':hover'));
                    bar.classList.remove('dragging');
                    if (!bar.matches(':hover')) {
                        hideHandles({ relatedTarget: null });
                    }
                });

                bar.addEventListener('mouseenter', showHandles);
                bar.addEventListener('mouseleave', hideHandles);

                handles.forEach(handle => {
                    handle.addEventListener('mouseenter', () => {
                        console.log('Handle mouseenter');
                        showHandles();
                    });
                    handle.addEventListener('mouseleave', (e) => {
                        console.log('Handle mouseleave');
                        console.log('Leaving to:', e.relatedTarget);
                        hideHandles(e);
                    });
                });
            });
        }*/
    }

    instance.data.gantt = new Gantt("#gantt", initialData, options);
    
 

    function createMarker(svg, taskId, type, x, y, markerColor, polylineColor) {
        const marker = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        );
        const offsetX = - 8; // Adjust this value for finer alignment if necessary
        const adjustedX = type === "start" ? x + offsetX : x - offsetX + 2;

        marker.setAttribute("cx", adjustedX);
        marker.setAttribute("cy", y);
        marker.setAttribute("r", 5);
        marker.setAttribute("fill", markerColor);
        marker.setAttribute("stroke-width", 1);
        marker.setAttribute("class", "marker");
        marker.setAttribute("data-task-id", taskId);
        marker.setAttribute("data-marker-type", type);

        //marker.style.display = "none";

        marker.addEventListener("click", (e) => {
            if (!isDragging) {
                startPolyline(e, marker, polylineColor);
            }
        });

        svg.appendChild(marker);
    }

    function updateMarkers(markerColor, polylineColor) {
        const svg = document.querySelector("svg");
        const barGroups = document.querySelectorAll(".bar-group");
        const svgRect = svg.getBoundingClientRect();

        svg.querySelectorAll(".marker").forEach((el) => el.remove());

        barGroups.forEach((barGroup, index) => {
            const parentElement = barGroup.parentElement;
            const taskId = parentElement.getAttribute("data-id"); 
            
            const bar = barGroup.querySelector(".bar");

            const barRect = bar.getBoundingClientRect();
            const startX = barRect.left - svgRect.left;
            const endX = barRect.right - svgRect.left;

            createMarker(
                svg,
                taskId,
                "start",
                startX,
                barRect.top - svgRect.top + barRect.height / 2,
                markerColor,
                polylineColor
            );

            createMarker(
                svg,
                taskId,
                "end",
                endX,
                barRect.top - svgRect.top + barRect.height / 2,
                markerColor,
                polylineColor
            );
        });
    }


    function startPolyline(event, marker, polylineColor) {
        const markers = document.querySelectorAll(".marker");

        parentTaskId = marker.getAttribute("data-task-id");
        const svg = document.querySelector("svg");
        const cx = parseFloat(marker.getAttribute("cx"));
        const cy = parseFloat(marker.getAttribute("cy"));

        polyline = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "polyline"
        );
        polyline.setAttribute("points", `${cx},${cy} ${cx},${cy}`);
        polyline.setAttribute("fill", "none");
        polyline.setAttribute("stroke", polylineColor);
        polyline.setAttribute("stroke-width", 2);
        polyline.setAttribute("class", "polyline");

        svg.appendChild(polyline);
        isDragging = true;

        bubbleElement.addEventListener("mousemove", dragPolyline);
        bubbleElement.addEventListener("mouseup", stopPolyline);
        markers.forEach(updateMarkerClass => updateMarkerClass.classList.toggle('dragging'));
    }


    function dragPolyline(event) {
        if (!isDragging || !polyline) return;

        const svgRect = document.querySelector("svg").getBoundingClientRect();
        const x = event.clientX - svgRect.left;
        const y = event.clientY - svgRect.top;

        const points = polyline.getAttribute("points").split(" ");
        points[1] = `${x},${y}`;
        polyline.setAttribute("points", points.join(" "));
    }


    function stopPolyline(event) {
        if (!isDragging) return;

        isDragging = false;
        const svgRect = document.querySelector("svg").getBoundingClientRect();
        const x = event.clientX - svgRect.left;
        const y = event.clientY - svgRect.top;

        const markers = document.querySelectorAll(".marker");

        let isNearMarker = false;
        let childTaskMarker = null;

        markers.forEach((marker) => {
            marker.classList.toggle('dragging');
            const cx = parseFloat(marker.getAttribute("cx"));
            const cy = parseFloat(marker.getAttribute("cy"));
            const distance = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            if (distance <= 10) {
                isNearMarker = true;
                polyline.setAttribute(
                    "points",
                    `${polyline.getAttribute("points")} ${cx},${cy}`
                );
                childTaskMarker = marker;
                childTaskMarker.remove();
            }
        });

        if (childTaskMarker) {
            const childTaskId = childTaskMarker.getAttribute("data-task-id");
            polyline.remove();
            polyline = null;

            if(parentTaskId === childTaskId) {
                instance.data.updateMarker();
                return;
            }

            instance.publishState('new_parent', parentTaskId);
            instance.publishState('child_task_id', childTaskId);
            instance.triggerEvent('parent_updated');
            instance.data.updateMarker();


        } else {
            polyline.remove();
            polyline = null;
        }

        const svg = document.querySelector(".gantt");

        svg.removeEventListener("mousemove", dragPolyline);
        svg.removeEventListener("mouseup", stopPolyline);
    }

    function createPopup(task){
		const existingPopup = document.getElementById('gantt-popup');
		if(existingPopup) { existingPopup.remove(); }

        const taskDetails = `<div style="padding: 8px; font-family: 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.1; text-align: left;">
            <p style =" padding-bottom: 8px "><strong>${task.name}</strong> </p>
            <p>${formatDate(task.start)} - ${formatDate(task.end)} </p>
            <p>Duration: ${calculateDuration(task.start, task.end)} days</p>
            <p>Progress: ${Math.floor(task.progress)}%</p>
            </div>`;

        const popup = document.createElement('div');
        popup.id = 'gantt-popup';
        popup.style.position = 'absolute';
        popup.style.backgroundColor = 'white';
        popup.style.border = '1px solid #ccc';
        popup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        popup.style.zIndex = '9999'; 
        popup.style.padding = '8px';  
        popup.style.borderRadius = '5px'; 
        popup.style.top = '0px';
        popup.style.left = '50%';
        popup.innerHTML = taskDetails;


        const closeButton = document.createElement('button');
        closeButton.textContent = '✖';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '5px';
        closeButton.style.right = '5px';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.fontSize = '16px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.color = '#333';

        closeButton.onclick = function() {
            const ganttPopup = document.getElementById('gantt-popup');

            if (ganttPopup) {
                ganttPopup.remove(); 
            }
        };

        popup.appendChild(closeButton);
        const barElement = document.querySelector('.bar-wrapper.active');

        if (barElement) {
            const svg = document.querySelector('#gantt');
            const barRect = barElement.getBoundingClientRect();
            const svgRect = svg.getBoundingClientRect();

            const popupX = barRect.left - svgRect.left + barRect.width / 2 - popup.offsetWidth / 2;
            const popupY = barRect.bottom - svgRect.top + 10;

            const maxX = window.innerWidth - popup.offsetWidth;
            const maxY = window.innerHeight - popup.offsetHeight;
            popup.style.left = `${Math.min(Math.max(0, popupX), maxX)}px`;
            popup.style.top = `${Math.min(Math.max(0, popupY), maxY)}px`;
        }
        instance.canvas[0].parentNode.append(popup);

    }
    

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const options = { month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    function calculateDuration(start, end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const duration = (endDate - startDate) / (1000 * 60 * 60 * 24);
        return parseInt(duration);
    }
    

    const setupPolyMarker = function (markerColor, polylineColor) {
        updateMarkers(markerColor || "white", polylineColor || "red");
    };

    instance.data.updateMarker = setupPolyMarker;
    instance.data.updateMarker();

    // Add this CSS to hide handles by default
    /*
    const style = document.createElement('style');
    style.textContent = `
        .handle {
            display: none;
            visibility: hidden;
            opacity: 0;
            transition: opacity 0.2s;
        }
        
        .bar-wrapper:hover .handle,
        .handle:hover,
        .bar-wrapper.dragging .handle {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
    `;
    document.head.appendChild(style);
    */
    /*
    const style = document.createElement('style');
    style.textContent = `
        .handle {
        	  display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
	`;	
    document.head.appendChild(style);
    */
}