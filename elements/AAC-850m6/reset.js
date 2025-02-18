function(instance, context) {

    instance.publishState('task_id');
    instance.publishState('task_name');
    instance.publishState('changed_task_start_date');
    instance.publishState('changed_task_end_date');
    instance.publishState('changed_task_progress');

    instance.data.gantt.refresh(instance.data.tasks);

}