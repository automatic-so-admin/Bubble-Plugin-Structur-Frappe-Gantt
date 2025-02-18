function(instance, properties, context) {

    instance.data.gantt.refresh(instance.data.tasks);
    
    //console.log(instance.data.
    
    if (instance.data.polyline_state) {
        instance.data.updateMarker(instance.data.markerParams.markerColor,instance.data.markerParams.lineColor); 
    }

}