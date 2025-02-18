function(instance, properties, context) {
  // State tracking

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


    function mapTasksToGantt(data) {
    return {
        data: data.map(task => {
            const startDate = task.get("start_date_date");
            const endDate = task.get("end_date_date");
            const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)); // Convert ms to days

            return {
                id: task.get("_id"),
                text: task.get("name_text"),
                start_date: startDate.toISOString().slice(0, 10) + " 00:00", // Format YYYY-MM-DD HH:mm
                duration: duration,
                parent: 0, // Assuming no hierarchy, modify as needed
                progress: task.get("progress_number") ? task.get("progress_number") : 0, // Convert percentage to fraction
                open: true
            };
        }),
        links: data.flatMap(task =>
            (task.get("arrowfrom_text")?.split(",") || []).map(dep => ({
                id: `${task.get("_id")}-${dep}`,
                source: dep,
                target: task.get("_id"),
                type: "0" // Assuming finish-to-start dependency
            }))
        )
    };
}

// Usage:
const ganttData = mapTasksToGantt(taskList);
  const container = document.getElementById("gantt-chart");
  if (!container) return;
  container.innerHTML = "";
  instance.canvas.append(container);
  gantt.config.show_grid = false;
  gantt.config.date_format = "%Y-%m-%d %H:%i";
  gantt.init("gantt-chart");

  // set readonly
  gantt.config.readonly = properties.read_only;
    
  // trigger on click
    gantt.attachEvent("onTaskClick", function(id, e) {
    var task = gantt.getTask(id);
    console.log("Task clicked:", task);
    instance.triggerEvent("task_clicked");
    instance.publishState("task_id", id);
    // Perform any custom action
    

    return false; // Prevents lightbox from opening
});
    gantt.attachEvent("onAfterTaskDrag", function(id, mode, task, original) {
  if (mode === "move") {
    console.log("Task dragged:", id);
    const modTask = gantt.getTask(id);
    instance.triggerEvent("task_drag_ended");
    instance.publishState("task_id", id);
    console.log(instance.data.modified_task_list);
    instance.data.modified_task_list = [...instance.data.modified_task_list, JSON.stringify(modTask)];
    instance.publishState("updated_task_list", instance.data.modified_task_list);
    }
});
    
    gantt.config.auto_scheduling = true;
gantt.config.auto_scheduling_strict = true;
    
  gantt.parse(ganttData);


} 