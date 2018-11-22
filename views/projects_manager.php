<link href="<?php echo base_url("resources/css/bootstrap-select.min.css")?>" rel="stylesheet" />
<script src="<?php echo base_url("resources/js/bootstrap-select.min.js")?>"></script>

<style>

.fa-unlock{
	color: #007bff; 
}

.swal2-content{
    z-index: 100 !important;
}

</style>

<div class="container">
	<div class="row">
		<div class="col-md-8 well well-lg">
	    	<h2>Proyectos</h2>
	        <p>Esta es la lista completa de proyectos.</p>
	        <p>Si clickeás en uno, podés ver las personas que estan asignadas a este proyecto.</p>
	        <div class='btn btn-primary' onclick='newProject()'><i class='fa fa-plus' style='margin-right:5px;'></i>Nuevo proyecto</div>
	        <div class='btn btn-primary' onclick='tagsAdmin()'>Administrar tags</div>
	        <div class='btn text-primary' id='reload-projects' onclick='reloadProjectsTable()' title='Recargar proyectos'><i class='fas fa-sync'></i></div>
	        <br><br>         
	        <div id='projects'></div>
		</div>
		<div class="col-md-4 well well-lg">
			<h2>Usuarios</h2>
	        <p>Estos son los usuarios que pertenecen al proyecto seleccionado en el otro panel.</p>
	        
	        <table class="table table-striped" id='users'>
	        	<thead>
	                <tr>
	                    <th class='text-center'>ID</th>
	                    <th>Nombre</th>
	                    <th class='text-center'>Opciones</th>
	                </tr>
	            </thead>
	            <tbody>
	            	<tr><td colspan=3 class='text-center'>Seleccionar proyecto para ver usuarios.</td></tr>
	            </tbody>
	        </table>
	        <div id='add-user-select'></div>
	        <div class='btn btn-primary' onclick='addUser(this)' id='add-user' style='display:none;'>
	        	<i class='fa fa-user-plus' style='margin-right:5px;'></i>Agregar persona
	        </div>
		</div>
	</div>
</div>

<script>

var projects;

function unselectProject() {
	project_selected.id = null;
	project_selected.name = null;
    $('.selected').removeClass('selected');
	$("#add-user-select").html("")
	$("#add-user").hide()
    $("#users tbody").html("<tr><td colspan=3 class='text-center'>Seleccionar proyecto para ver usuarios.</td></tr>")
}

function reloadProjectsTable(){
	$("#reload-projects").addClass("disabled")
	$("#projects").html(
	`<table class="table table-striped">
		<thead>
            <tr>
                <th class="text-center">ID</th>
                <th>Nombre</th>
                <th class="text-center">Habilitado</th>
                <th class="text-center">Opciones</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    </table>`);
	
	$.ajax({
		url:"<?php echo base_url("admin/projects_manager/get_projects")?>",
		complete:function(){
			$("#reload-projects").removeClass("disabled")
		},
		success:function(response){
			projectsTableContent = "";
			projects = response;
			response.map(project => {
				projectsTableContent+= `<tr>
                    <td class='text-center'>${project.id}</td>
                    <td><strong>${project.name}</strong> ${project.tags.map(t => { return `<div class="badge badge-primary">${t.name}</div>`}).join(' ')}</td>
                	<td class='text-center'>${project.enabled ? "<i class='fa fa-check text-success'></i>" : "<i class='fa fa-times text-danger'></i>"}</td>
                	<td class='text-center'><span class='text-primary text-btn' title='Editar' onclick='editProject(${project.id})'><i class='fas fa-pencil-alt'></i></span><span class='text-danger text-btn' onclick='deleteProject(${project.id})' title='Eliminar'><i class='fa fa-trash'></i></span></td>
            	</tr>`
			})
			
			$('#projects table tbody').append(projectsTableContent)

			$('#projects').on( 'draw.dt', function () {
        	    $('#projects table tbody tr').unbind("click").click(function (event) {
            	    if(!$(event.target).hasClass("btn") && event.target.nodeName != "I"){
            	        if ( $(this).hasClass('selected') ) {
                	        unselectProject();
            	            return;
            	        } else {
            	        	p_table.$('tr.selected').removeClass('selected');
            	            $(this).addClass('selected');
            	            project_selected.id = $('#projects table tr.selected td').first().text();
            	        	project_selected.name = $('#projects table tr.selected td:nth-child(2)').text();
            	        }
            			loadProjectUsers(project_selected.id)   
            	    }   
        	    })
			})
			
			p_table = $('#projects table').DataTable({
	        	"order": [[ 0, "desc" ]]
	    	});
		}
	})

	unselectProject();
}

function tagsAdmin(){
	swal({
		title:"Tags",
		html:`<table class="table" id="tags" style="width:100%">
				<thead>
		            <tr>
		                <th>Nombre</th>
		                <th class="text-center">Opciones</th>
		            </tr>
				</thead>
				<tbody>
					<tr id="sec-loading"><td class="center-text" colspan="3">Cargando...</td></tr>
				</tbody>
			</table>`,
		width: "50rem",
		confirmButtonText:"Crear tag",
		cancelButtonText:"Cerrar"
	}).then((result) => {
		if(result.value){
			swal({
				title:"Nuevo tag",
				input:"text",
				text:"Introducí el nombre del tag.",
				confirmButtonText:"Crear",
				cancelButtonText:"Cancelar",
				preConfirm: function(name) {
					return new Promise(function(resolve,reject) {
						$.ajax({
							url:"<?php echo base_url("admin/projects_manager/tags/new")?>",
							data: {name},
							method: "post",
							success: response => {
								if(response.status==="success"){
									resolve();
									toastr["success"]("Se creó correctamente el nuevo tag.");
								} else if(response.status === "name taken") {
									reject(`Ya existe un tag con el nombre "${name}".`)
								} else {
									reject("Ocurrió un error. Intentá de nuevo más tarde.")
								}
							}
						});
					}).catch(error => {
						swal.showValidationError(error)
					});
				}
			})
		}
	});
	
	$.ajax({
		url:"<?php echo base_url("admin/projects_manager/tags")?>",
		type:"get",
		success:function(response){
			$("#sec-loading").remove();
			
			response.map(s => {
				$("#tags tbody").append(`
					<tr>
						<td>${s.name}</td>
						<td class='text-center'>
							<span class='text-danger text-btn' title='Eliminar' onclick='deleteTag(${s.id})'>
								<i class='fa fa-trash'></i>
							</span>
						</td>
					</tr>`
				);
			});

			$("#tags").DataTable();
		}
	});
}

function deleteTag(id){
	swal({
		title:"Eliminar tag",
		type:"warning",
		html:"<p>Estás seguro que querés eliminar este tag?</p><p>Se le quitará este tag a todos los proyectos que lo tengan asignado.</p>",
		confirmButtonText:"Si",
		showLoaderOnConfirm: true,
		preConfirm: function() {
		    return new Promise(function(resolve,reject) {
		    	$.ajax({
       		 		url:"<?php echo base_url("admin/projects_manager/delete_tag")?>/"+id,
       		 		success:function(response){
           		 		if(response.status==="success"){
           		 			resolve();
							toastr["success"]("El tag se eliminó correctamente.")
							reloadProjectsTable();
           		 		} else {
               		 		reject("Ocurrió un error. Intentá de nuevo más tarde.")
                   		}
               		},
				}).catch(error => {
			    	swal.showValidationError(error)
			   	});
			})
		}
	})
}

function toggleAccess(element,actualState,project_id,user_id){
	$(element).css({"pointer-events":"none","opacity":"0.5"})
	$.ajax({
		url:"<?php echo base_url("admin/projects_manager/access")?>/"+((actualState==1)?"remove":"grant"),
	 	type:"post",
	 	data:{project_id:project_id,user_id:user_id},
	 	success:function(response){
			switch(response.status){
				case "invalid input": 
					toastr["error"]("El estado a modificar no es válido.","Ups!")
					break;c
				case "user not in project": 
					toastr["error"]("El usuario no está en el proyecto.","Ups!")
					break;
				case "success":
					if(actualState==1){
						//candadito cerrado
						$(element).attr("title","Desbloquear acceso")
						$(element).find("i").removeClass("fa-unlock").addClass("fa-lock")	
						$(element).attr("onclick","toggleAccess(this,0,"+project_id+","+user_id+")")
						toastr.success("Acceso bloqueado al usuario.")
					} else {
						//candadito abierto
						$(element).attr("title","Bloquear acceso")
						$(element).find("i").removeClass("fa-lock").addClass("fa-unlock")
						$(element).attr("onclick","toggleAccess(this,1,"+project_id+","+user_id+")")
						toastr.success("Acceso desbloqueado al usuario.")
					}
					
					break;
				default:
					toastr["error"]("No se pudo completar esta acción.","Ups!")
					break;
			}
			$(element).css({"pointer-events":"","opacity":"1"})
		}
	});
}

var p_table;
var project_selected = {id:null,name:null}

$(document).ready(function(){
	toastr.options = {"positionClass": "toast-bottom-right"}
	 reloadProjectsTable();
	 swal.setDefaults({
		confirmButtonText:"Guardar",
		cancelButtonText:"Cancelar",
		showCancelButton:true
	 })
});

function editProject(id){
	var project = null;
	for(var i=0;i<projects.length;i++){
		if(projects[i].id==id){
			project = projects[i]
		}
	}

	$.ajax({
		url:"<?php echo base_url("admin/projects_manager/tags")?>",
		type:"get",
		success:function(tags){
			tagsOptions = "";
			tags.map(t => {
				tagsOptions += `<option value='${t.id}' ${project.tags.filter(tag => tag.id == t.id).length > 0 ? "selected" : "" }>${t.name}</option>`; 
			})
			
			if(project!=null){	
		    	swal({
		    		title:"Editar proyecto",
		    		html:`<div class='form-group'><label for='name'>Nombre del proyecto</label><input name='name' type='text' value='${project.name}' class='form-control'></div>
							<div class='form-group'><label for='tags'>Tags</label><select data-live-search="true" title="Sin tags" multiple name='tags' class='form-control'>${tagsOptions}</select></div>
							<div class="custom-control custom-checkbox my-2">
								<input class="custom-control-input" id="enabled" type='checkbox' name='enabled' value='' ${project.enabled ? "checked" : ""}>
								<label class="custom-control-label" for="enabled">Habilitado</label>
							</div>
							<div class="custom-control custom-checkbox my-2">
								<input class="custom-control-input" type='checkbox' name='must_detail' value='' id="must-detail" ${project.must_detail ? "checked" : ""}>
								<label class="custom-control-label" for="must-detail">Detalle obligatorio</label>
							</div>
							<div class="custom-control custom-checkbox my-2">
								<input class="custom-control-input" type='checkbox' name='is_global' id="is-global" value='' ${project.is_global ? "checked": ""}>
								<label class="custom-control-label" for="is-global">Es global</label>
							</div>`,
		    		showLoaderOnConfirm: true,
		   			preConfirm: function() {
		   		    	return new Promise(function(resolve,reject) {
		       		     	$.ajax({
		           		 		url:"<?php echo base_url("admin/projects_manager/edit_project")?>",
		           		 		type:"post",
		           		 		data:{
									project:{
										project_id: id,
										name: $("input[name='name']").val(),
										enabled: $("input[name='enabled']").is(":checked"),
										is_global: $("input[name='is_global']").is(":checked"),
										must_detail: $("input[name='must_detail']").is(":checked"),
										tags: $("select[name='tags']").val() || []
		               		 		}
		           		 		},
		           		 		success:function(response){
									if(response.status==="success"){
										resolve();
										reloadProjectsTable();
										toastr["success"]("El proyecto se editó correctamente.")
									} else {
										reject("Ups! Ocurrió un error. Intentá de nuevo más tarde")
									}
		                   		}
		       		     	})
		   		    	}).catch(error => {
							swal.showValidationError(error)
						});
		   			},
		    	})

		    	$("select[name='tags']").selectpicker();
			}

		}
	});
}

function deleteProject(id){
	swal({
		title:"Eliminar proyecto",
		type:"warning",
		html:"Estás seguro que querés eliminar este proyecto?<br>Recordá que los proyectos <b>no</b> se pueden eliminar si tienen alguna hora cargada.",
		confirmButtonText:"Si",
		showLoaderOnConfirm: true,
		preConfirm: function() {
		    return new Promise(function(resolve,reject) {
		    	$.ajax({
       		 		url:"<?php echo base_url("admin/projects_manager/delete_project")?>/"+id,
       		 		success:function(response){
           		 		if(response.status==="success"){
           		 			resolve();
							toastr["success"]("El proyecto se eliminó correctamente.")
							reloadProjectsTable();
           		 		} else if(response.status==="project has hours"){
							reject("El proyecto tiene horas cargadas. Eliminá las horas cargadas y volvé a intentar.")
               		 	} else {
               		 		reject("Ocurrió un error. Intentá de nuevo más tarde.")
                   		}
               		},
				})
			}).catch(error => {
				swal.showValidationError(error)
			});
		}
	})
}

function loadProjectUsers(project_id){
	$("#add-user-select").html("")
    $("#users tbody").html("<tr><td colspan=3 class='text-center'>Cargando...</td></tr>")
	$("#add-user").hide();
	if(project_id !== "" && project_id != null){
        $.ajax({
            url:"<?php echo base_url("admin/projects_manager/project_users")?>/"+project_id,
            success:function(response){

				if(response.status === "is global"){
					$("#users tbody").html("<tr><td colspan=3 class='text-center'>Este proyecto es global.</td></tr>")
					$("#add-user").hide();
				} else if(response.status === "success"){		
    				var usersTableHTML="";
    				$("#add-user").show();
					if(response.users.length<=0){
						$("#users tbody").html("<tr><td colspan=3 class='text-center' id='no-users'>No hay usuarios asignados a este proyecto.</td></tr>")
					} else {
						$("#users tbody").html("")
						for(var i=0;i<response.users.length;i++){
							addToProjectList(response.users[i].id,response.users[i].full_name,response.users[i].has_access,project_id)
						}
					}
				}
            }
        })
	}
}

function newProject(){

	var project = {name:"",must_detail:false,is_global:false, tags:[]};
	
	var steps = [
         {
        	 input:"text",
        	 title: 'Nombre del proyecto',
        	 preConfirm:function(result) {
     		    return new Promise(function(resolve, reject) {
     		    	if(result==""||result==null){
     		    		reject("Tenés que indicar el nombre del proyecto.")
     		    	} else {
         		    	project.name = result;
     		    		resolve()
     		    	}
     		    }).catch(error => {
			        swal.showValidationError(error)
			   });
        	 }
         },
         {
        	 title: 'Detalle obligatorio?',
        	 text:"Si marcás esta opción, el usuario va a tener que indicar un detalle obligatoriamente cada vez que cargue una hora.",
        	 inputPlaceholder:"Detalle obligatorio",
        	 input:"checkbox",
        	 preConfirm:function(result) {
      		    return new Promise(function(resolve,reject) {
          		    	project.must_detail = result;
      		    		resolve()
      		    })
         	 }
         },
         {
        	 title: 'Es global?',
        	 text:"Cuando un proyecto es global, todos pueden cargar horas inmediatamente en el mismo, sin necesidad de ser asignados a este proyecto.",
        	 inputPlaceholder:"Es global",
        	 input:"checkbox",
        	 preConfirm:function(result) {
       		    return new Promise(function(resolve,reject) {
       		    	project.is_global = result;
   		    		resolve()
       		    })
          	 }
         },	
         {
        	 title: 'Agregar tags',
        	 html:`<p>Podés asignar los tags que quieras para mantener un mejor orden entre los proyectos. Esto lo podés cambiar más adelante.</p>
            	 <select data-live-search="true" title="Sin tags" multiple id="tags"></select>`,
        	 preConfirm:function(result) {
       		    return new Promise(function(resolve,reject) {
       		    	project.tags = $("#tags").val();
   		    		resolve()
       		    })
          	 },
          	 onOpen: () =>{
          		$.ajax({
          			url:"<?php echo base_url("admin/projects_manager/tags")?>",
          			success:function(response){
              			$("#tags").html(response.map(t => { return `<option value="${t.id}">${t.name}</option>`}).join(''))
              			$("#tags").selectpicker()
          			}
             	});
          	 },
         },	
    ];
	
	swal.mixin({
		progressSteps: ['1', '2', '3', '4', '5'],
		confirmButtonText: 'Siguiente'
	}).queue(steps).then((result) => {
		if(result.value){
			swal({
				title: 'Verificá los datos',
				html:"<p><b>Nombre del proyecto: </b>"+project.name+"</p>"+
					"<p><b>Detalle obligatorio: </b>"+((project.must_detail)?"Si":"No")+"</p>"+
					"<p><b>Es global: </b>"+((project.is_global)?"Si":"No")+"</p>",
				type:"info",
				confirmButtonText:"Finalizar",
				showLoaderOnConfirm: true,
				preConfirm: function() {
					return new Promise(function(resolve,reject) {
						$.ajax({
							url:"<?php echo base_url("admin/projects_manager/new_project")?>",
							data:{project:project},
							success:function(response){
								if(response.status==="success"){
									resolve();
									toastr["success"]("Se creó correctamente el nuevo proyecto.");
									reloadProjectsTable()
								} else {
									reject("Ocurrió un error. Intentá de nuevo más tarde.")
								}
							}
						});
					}).catch(error => {
						swal.showValidationError(error)
				});
				}
			}) 
		}  
   	})
}

var counterAdd = 0;

function addUser(element){
	$("#add-user-select").append("<div class='text-center' id='add-user-"+counterAdd+"' style='margin-bottom: 20px;'></div>")
	var idToAdd = "#add-user-"+counterAdd;
	$.ajax({
		url:"<?php echo base_url("admin/projects_manager/get_users")?>/"+project_selected.id,
		success:function(response){
			var selectHTML = "<select data-live-search='true' title='Seleccionar usuario...'>";
			for(var i=0;i<response.length;i++){
				selectHTML+="<option value='"+response[i].id+"'>"+response[i].full_name+"</option>"
			}

			selectHTML+="</select><div class='btn text-success' style='margin-left:5px;' title='Guardar' onclick='addToProject(this)'><i class='fa fa-check'></i></div><div class='btn text-danger' onclick='$(this).parent().remove()' title='Cancelar' style='margin-left: 5px;'><i class='fa fa-times'></i></div>"

			$(idToAdd).html(selectHTML)
				
			$(idToAdd).find("select").selectpicker();
		}
	})

	counterAdd++;
}

function addToProjectList(id,name,actualState,project_id){
	$("#no-users").remove();
	$("#users").append("<tr><td class='text-center'>"+id+"</td><td>"+name+"</td><td class='text-center'><span class='text-danger text-btn' title='Remover' onclick='removeFromProject(this)'><i class='fa fa-trash'></i></span><span class='text-secondary text-btn' title='"+((actualState==1)?"Bloquear acceso":"Desbloquear acceso")+"' onclick='toggleAccess(this,"+actualState+","+project_id+","+id+")'><i class='fa "+((actualState==1)?"fa-unlock":"fa-lock")+"'></i></span></td></tr>")
}

function addToProject(element){
	user_id = $(element).parent().find('select').val()
	
	if(user_id.trim() === "" || user_id == null || typeof user_id === "undefined"){
		toastr["warning"]("Tenés que seleccionar un usuario para agregar al proyecto.","Ups!")
		return;
	}
	
	$(element).parent().find(".btn").addClass("disabled");
	$(element).parent().find('select').attr("disabled",true)
	
	$.ajax({
		url:"<?php echo base_url("admin/projects_manager/add_user")?>",
		data:{user_id:user_id,project_id: project_selected.id},
		success:function(response){
			switch(response.status){
				case "success":
					addToProjectList(user_id,$(element).parent().find("select option:selected").text(),1,project_selected.id)
					$(element).parent().remove();
					toastr["success"]("Se guardo el usuario.","Éxito")
					break;
				case "user already in project":
					toastr["error"]("El usuario ya está en este proyecto.","Ups!")
					$(element).parent().find(".btn").removeClass("disabled");
					$(element).parent().find('select').attr("disabled",false)
					break;
				case "user does not exist":
					toastr["error"]("El usuario está deshabilitado o ya no existe.","Ups!")
					$(element).parent().find(".btn").removeClass("disabled");
					$(element).parent().find('select').attr("disabled",false)
					break;
				case "error":
					toastr["error"]("Ocurrió un error. Intentá de nuevo más tarde.","Ups!")
					$(element).parent().find(".btn").removeClass("disabled");
					$(element).parent().find('select').attr("disabled",false)
					break;
			}
		}
	})
	
}

function removeFromProject(element){

	swal({
		title:"Estás seguro?",
		type:"warning",
		html:"Seguro que querés remover a este usuario del proyecto <b>"+project_selected.name+"</b>? <br>Las horas que este usuario haya cargado quedarán guardadas en la base de datos.",
		confirmButtonText:"Si",
		cancelButtonText:"Cancelar",
		showCancelButton:true,
		showLoaderOnConfirm: true,
		preConfirm: function() {
		    return new Promise(function(resolve,reject) {
		    	$.ajax({
		    		url:"<?php echo base_url("admin/projects_manager/remove_user")?>",
		    		data:{project_id:project_selected.id,user_id:$(element).parent().parent().find("td:first").text()},
		    		success:function(response){
			    		switch(response.status){
        					case "success":
        						resolve();
        						$(element).parent().parent().remove();
        						toastr["success"]("Se removió al usuario.","Éxito")
        						break;
        					case "user not in project":
        						reject("El usuario no está en este proyecto.")
        						break;
        					case "user does not exist":
        						reject("El usuario está deshabilitado o ya no existe.")
        						break;
        					case "error":
        						reject("Ocurrió un error. Intentá de nuevo más tarde.")
        						break;
        				    }
		    		}
		    	})
		    }).catch(error => {
				swal.showValidationError(error)
			});
		}
	})
}
</script>
