<link href="<?php echo base_url("resources/css/bootstrap-select.min.css")?>" rel="stylesheet" />
<script src="<?php echo base_url("resources/js/bootstrap-select.min.js")?>"></script>

<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.2/moment.min.js"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/tempusdominus-bootstrap-4/5.0.1/js/tempusdominus-bootstrap-4.min.js"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tempusdominus-bootstrap-4/5.0.1/css/tempusdominus-bootstrap-4.min.css" />
<script src="<?php echo base_url("resources/js/tempus-dominus-es.js")?>"></script>

<script type="text/javascript" src="https://cdn.datatables.net/buttons/1.5.2/js/dataTables.buttons.min.js"></script>
<script type="text/javascript" src="https://cdn.datatables.net/buttons/1.5.2/js/buttons.bootstrap4.min.js"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.3/jszip.min.js"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.36/pdfmake.min.js"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.36/vfs_fonts.js"></script>
<script type="text/javascript" src="https://cdn.datatables.net/buttons/1.5.2/js/buttons.html5.min.js"></script>
<script type="text/javascript" src="https://cdn.datatables.net/plug-ins/1.10.19/sorting/date-eu.js"></script>

<div class="container">
	<div class="row">
		<div class="col-md-12 well well-lg">
	    	<h2>Horas</h2>
	        <p>Acá podés ver las horas de todas las personas.</p><p>Si dejás en blanco las personas y/o proyectos será considerado como "Todos".</p>
	        <div class="row">
    	        <div class="col-md-6">
    	        	<div class="form-group" style="width: 100%">
    	        		<label for="users">Personas</label>
        	        	<select data-live-search="true" title="Seleccionar personas..." multiple id="users" class='form-control'>
        	        	
        	        	<?php foreach($users as $user){
        	        	    echo "<option value='".$user["id"]."'>".$user["full_name"]."</option>";
        	        	}?>
        	        	
        	        	</select>
                	</div>
                	<div class="form-group" style="width: 100%">
                		<label for="projects">Proyectos</label>
        	        	<select data-live-search="true" title="Seleccionar proyectos..." multiple id="projects" class='form-control'>
        	        	
        	        	<?php foreach($projects as $project){
        	        	    echo "<option value='".$project["id"]."'>".$project["name"]."</option>";
        	        	}?>
        	        	
        	        	</select>
                	</div>
    	        </div>
    	        <div class="col-md-6">
            	 	<div class="form-group">
            	 		<label for="date_from">Fecha desde</label>
                      	<div class="ml-2 input-group date" id="date_from" data-target-input="nearest">
                            <input type="text" class="form-control datetimepicker-input" placeholder="Fecha desde" data-target="#date_from"/>
                            <div class="input-group-append" data-target="#date_from" data-toggle="datetimepicker">
                                <div class="input-group-text"><i class="fas fa-calendar-alt"></i></div>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                    <label for="date_to">Fecha hasta</label>
                        <div class="ml-2 input-group date" id="date_to" data-target-input="nearest">
                            <input type="text" class="form-control datetimepicker-input" placeholder="Fecha hasta" data-target="#date_to"/>
                            <div class="input-group-append" data-target="#date_to" data-toggle="datetimepicker">
                                <div class="input-group-text"><i class="fas fa-calendar-alt"></i></div>
                            </div>
                        </div>
                    </div>
    	        </div>
	        </div>
        	
       
	        <div class='btn btn-primary my-2 float-right' id="search" onclick='search()'>Buscar</div>
	        <div class='btn btn-primary my-2' onclick="filterAdmin();">Ver filtros</div>
	        <div class='btn btn-primary my-2' onclick="newFilter();" data-toggle="tooltip" data-placement="bottom" title="Crea un nuevo filtro con las personas y proyectos que tenés seleccionado en este momento.">Nuevo filtro</div>
	        <div class='btn btn-primary my-2' onclick="saveFilter();" data-toggle="tooltip" data-placement="bottom" title="Guarda el filtro que tenés seleccionado en este momento." id="save" style="display:none;">Guardar filtro</div>
	        <div class='btn btn-primary my-2' onclick="clearPickers();" data-toggle="tooltip" data-placement="bottom" title="Resetea el formulario.">Limpiar</div>               
	        <div class="alert alert-danger mt-3 row" id="pending_details" style="display:none;">
	        	<div class="col-sm-8">
                	<p>Hay <span id="users_amount"></span> las horas a la fecha que estás tratando de ver.</p>
                	<div class="btn btn-danger" onclick="togglePendingList();"></div>
            	</div>
            	<div class="col-sm-4  mx-auto">
                	<table class="table table-borderless" id="pending_table">
                		<thead>
                			<tr>
                				<th class="text-center">Días sin cargar</th>
                				<th class="text-left">Nombre</th>
                			</tr>
                		</thead>
                		<tbody></tbody>
                    </table>
            	</div>
            </div>
	        <div id='hours'></div>
		</div>
	</div>
</div>

<script>

let datepickerConf = {
		format: "DD/MM/YYYY",
		locale: 'es',
}


function clearPickers(){
	$('#users').selectpicker('val',[])
	$('#projects').selectpicker('val',[])

	$("#save").hide();
	selectedFilter = null;
}

$(document).ready(()=> {
	let oneMonthBack = new Date();
	oneMonthBack.setMonth(oneMonthBack.getMonth() - 1);
	 
    $('#date_from').datetimepicker({...datepickerConf, defaultDate: oneMonthBack});
    $('#date_to').datetimepicker({...datepickerConf, defaultDate: new Date()});
    
    $("#users").selectpicker();
    $("#projects").selectpicker();

	$('[data-toggle="tooltip"]').tooltip()
})

var filters;

function filterAdmin(){
	swal({
		title:"Filtros",
		html:`<p class='mb-5'>Hacé click en el nombre de un filtro para seleccionarlo.</p><table class="table" id="filters" style="width:100%">
				<thead>
		            <tr>
		                <th>Nombre</th>
		                <th class="text-center">Opciones</th>
		            </tr>
				</thead>
				<tbody>
					<tr id="loading"><td class="center-text" colspan="3">Cargando...</td></tr>
				</tbody>
			</table>`,
		width: "50rem",
		showConfirmButton: false,
		cancelButtonText:"Cerrar"
	})
	
	$.ajax({
		url:"<?php echo base_url("admin/hours_manager/filters")?>",
		type:"get",
		success:function(response){
			$("#loading").remove();

			filters = response;
			
			response.map(f => {
				$("#filters tbody").append(`
					<tr>
						<td><a href="#" onclick="setFilter(${f.id})">${f.name}</a></td>
						<td class='text-center'>
							<span class='text-danger text-btn' title='Eliminar' onclick='deleteFilter(${f.id})'>
								<i class='fa fa-trash'></i>
							</span>
						</td>
					</tr>`
				);
			});

			$("#filters").DataTable();
		}
	});
}

function newFilter(){
	if($("#users").val() == null && $("#projects").val() == null){
		toastr["error"]("No se seleccionó ningún usuario ni proyecto.");
		return;
	}
	
	swal({
		title:"Nuevo filtro",
		input:"text",
		html:"<p>Estás por crear un nuevo filtro con las personas y proyectos que tenés seleccionado en este momento.</p><p>Introducí el nombre del filtro:</p>",
		confirmButtonText:"Crear",
		showCancelButton: true,
		cancelButtonText:"Cancelar",
		showLoaderOnConfirm: true,
		preConfirm: function(name) {
			return new Promise(function(resolve,reject) {
				if(name == ""){
					reject("Escribí un nombre de filtro por favor.")
					return;
				}
				
				$.ajax({
					url:"<?php echo base_url("admin/hours_manager/filters/new")?>",
					data: {
						name, 
						projects:$("#projects").val(), 
						users: $("#users").val()
					},
					method: "post",
					success: response => {
						if(response.status==="success"){
							resolve();
							toastr["success"]("Se creó correctamente el nuevo filtro.");
						} else if(response.status === "name taken") {
							reject(`Ya existe un filtro con el nombre "${name}".`)
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

let selectedFilter = null;

function setFilter(id){
	selectedFilter = filters.find( f => f.id == id )
	swal.close();

	$('#users').selectpicker('val',selectedFilter.users)
	$('#projects').selectpicker('val',selectedFilter.projects)

	$("#save").show();
}

function togglePendingList(){
	if(!$("#pending_table").is(":visible")){
		$("#pending_table").show();
		$("#pending_details .btn").text("Ocultar")
	} else {
		$("#pending_table").hide();
		$("#pending_details .btn").text("Ver detalles")
	}
}

function search(){
	$("#pending_details").hide();
	$("#pending_details .btn").text("Ver detalles");
	$("#pending_table tbody").empty();
	$("#pending_table").hide();
	
	if(!moment($('#date_from input').val(), 'DD/MM/YYYY', true).isValid()){
		toastr["error"]("La fecha desde es inválida.")
		return;
	}

	if(!moment($('#date_to input').val(), 'DD/MM/YYYY', true).isValid()){
		toastr["error"]("La fecha hasta es inválida.")
		return;
	}
	
	$("#search").addClass("disabled")
	$("#hours").html(
	`<table class="table table-striped">
		<thead>
            <tr>
                <th class="text-center">Fecha</th>
                <th>Proyecto</th>
                <th>Persona</th>
                <th class="text-center">Horas</th>
                <th class="text-left">Detalle</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    </table>`);
	
	$.ajax({
		url:"<?php echo base_url("admin/hours_manager/get_hours")?>",
		type: "post",
		data: { users: $("#users").val(),
				projects: $("#projects").val(),
				from: $('#date_from input').val(),
				to: $('#date_to input').val()
		},
		complete:function(){
			$("#search").removeClass("disabled")
		},
		success:function(json){
			let content = "";

			let pendingUsersAmount = 0;
			
			json.pending_hours.map( p => {
				if(p.pending > 0){
					pendingUsersAmount++;

					$("#pending_table tbody").append(`
	                    <tr>
							<td class="text-center"><div class="badge badge-danger badge-pill">${p.pending}</div></td>
                            <td class="text-left">${$("#users option[value='"+p.user_id+"']").text()}</td>
                        </tr>
					`)
				}
			})

			if(pendingUsersAmount > 0){
				$("#pending_details").show();
				$("#users_amount").html(`<b>${pendingUsersAmount}</b> ${ pendingUsersAmount > 1 ? "usuarios que no cargaron" : "usuario que no cargó" }`);
			}
			
			json.hours.map(h => {
				content += `<tr>
                    <td class='text-center'>${h.date}</td>
                    <td><strong>${h.project_name}</strong></td>
                    <td>${h.user_full_name}</td>
                	<td class='text-center'>${h.hours}</td>
                	<td>${escapeHtml(h.detail)}</td>
            	</tr>`
			})
			
			$('#hours table tbody').append(content)
			
			$('#hours table').DataTable({
				dom: '<"float-right mb-2 "B><"clearfix">frtip',
	        	order: [[ 0, "desc" ]],
	        	buttons: [
	                'excelHtml5',
	                'csvHtml5',
	                'pdfHtml5'
	            ],
	            columnDefs: [
                	{ type: 'date-eu', targets: 0 }
                ]
	    	});
		}
	})
}

function deleteFilter(id){
	swal({
		title:"Eliminar filtro",
		type:"warning",
		html:"<p>Estás seguro que querés eliminar este filtro?</p>",
		confirmButtonText:"Si",
		showLoaderOnConfirm: true,
		showCancelButton: true,
		cancelButtonText: "Cancelar",
		preConfirm: function() {
		    return new Promise(function(resolve,reject) {
		    	$.ajax({
       		 		url:"<?php echo base_url("admin/hours_manager/filters/delete")?>/"+id,
       		 		success:function(response){
           		 		if(response.status==="success"){
           		 			resolve();
							toastr["success"]("El filtro se eliminó correctamente.")
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

function saveFilter(){
	swal({
		title:"Guardar filtro",
		type:"warning",
		html:`Estás por guardar los cambios del filtro <span class="font-weight-bold">"${selectedFilter.name}"</span> con las personas y proyectos que tenés seleccionados.<p>Estás seguro?</p>`,
		confirmButtonText:"Si",
		showLoaderOnConfirm: true,
		showCancelButton: true,
		cancelButtonText: "Cancelar",
		preConfirm: function() {
		    return new Promise(function(resolve,reject) {
		    	$.ajax({
       		 		url:"<?php echo base_url("admin/hours_manager/filters/save")?>",
       		 		type: "post",
					data: {
						projects:$("#projects").val(), 
						users: $("#users").val(),
						id: selectedFilter.id,
						name: selectedFilter.name,
					},
       		 		success:function(response){
           		 		if(response.status==="success"){
           		 			resolve();
							toastr["success"]("El filtro se guardó correctamente.")
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
</script>
