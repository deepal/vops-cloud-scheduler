$(document).ready(function(){
    $("#add-group").on('click', function(e){
        e.preventDefault();
        groups = []
        var group={};
        group.name = $("#group-name").val();
        group.id = $("#group-id").val();
        groups[group.length] = group;
        $("#select-group").append("<option value='"+group.id+"'>"+group.name+"</option>");
    });

    $("#select-attr").on('change', function(e){
        e.preventDefault();
        switch ($("#select-attr option:selected").attr("value")){
            case "vm_count":
                $("#attr-values").html(
                    "<div class='row form-group'><div class='col-md-12'><input type='text' id='vm-count' class='form-control' placeholder='VM Count' </div> </div>"
                );
                break;
            case "os":
                $("#attr-values").html(
                    "<div class='row form-group'><div class='col-md-12'>" +
                        "<input type='text' id='os-name' class='form-control' placeholder='OS Name'/>" +
                        "</div></div>" +
                        "<div class='row form-group'><div class='col-md-12'><input type='text' id='os-version' class='form-control' placeholder='Version'/></div></div>"
                );
                break;
            case "cpu":
                $("#attr-values").html(
                    "<div class='row form-group'><div class='col-md-12'></div> </div>"
                );
                break;
            case "min_memory":
                break;
            case "storage":
                break;
            case "network":
                break;
            case "priority":
                break;
            case "hpc":
                break;
            case "allocation_time":
                break;
        }
    });
});
