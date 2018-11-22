<?php $this->load->view("includes/header")?>

<link rel="stylesheet" type="text/css" href="<?php echo base_url("resources/css/datatables.min.css")?>">
<script type="text/javascript" src="<?php echo base_url("resources/js/datatables.min.js")?>"></script>
<script type="text/javascript" src="<?php echo base_url("resources/js/medialum-tools.js")?>"></script>

<style>

.text-btn{
	cursor:pointer;
	margin:0px 5px;
}

</style>

<script>

$(document).ready(function(){
	$("#window_title").text("Administrador - Medialum");

	$.extend( true, $.fn.dataTable.defaults, {
		"language": {
    	    "sProcessing":     "Procesando...",
    	    "sLengthMenu":     "Mostrar _MENU_ registros",
    	    "sZeroRecords":    "No se encontraron resultados",
    	    "sEmptyTable":     "Ningún dato disponible en esta tabla",
    	    "sInfo":           "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
    	    "sInfoEmpty":      "Mostrando registros del 0 al 0 de un total de 0 registros",
    	    "sInfoFiltered":   "(filtrado de un total de _MAX_ registros)",
    	    "sInfoPostFix":    "",
    	    "sSearch":         "Buscar:",
    	    "sUrl":            "",
    	    "sInfoThousands":  ",",
    	    "sLoadingRecords": "Cargando...",
    	    "oPaginate": {
    	        "sFirst":    "Primero",
    	        "sLast":     "Último",
    	        "sNext":     "Siguiente",
    	        "sPrevious": "Anterior"
    	    },
    	    "oAria": {
    	        "sSortAscending":  ": Activar para ordenar la columna de manera ascendente",
    	        "sSortDescending": ": Activar para ordenar la columna de manera descendente"
    	    }
    	}
	} );
})

</script>
<nav class="navbar navbar-expand-lg">
    <a class="navbar-brand">Medialum</a>
    <?php 
        $all_privileges = array();
        foreach($privileges as $privilege){
            $all_privileges[] = $privilege["name"];
        }
    ?>
    <div class="collapse navbar-collapse">
        <ul class="navbar-nav mr-auto">
			<li class="nav-item"><a class="nav-link" href="<?php echo base_url("admin")?>">Home</a></li>
			<?php if(in_array("USERS_MANAGER",$all_privileges)): ?><li class="nav-item" <?php echo (($selected_privilege === "USERS_MANAGER") ? "class='active'":"");?>><a class="nav-link" href="<?php echo base_url("admin/users_manager")?>">Usuarios</a></li><?php endif;?>
			<?php if(in_array("PROJECTS_MANAGER",$all_privileges)): ?><li class="nav-item" <?php echo (($selected_privilege === "PROJECTS_MANAGER") ? "class='active'":"");?>><a class="nav-link" href="<?php echo base_url("admin/projects_manager")?>">Proyectos</a></li><?php endif;?>
			<?php if(in_array("HOURS_MANAGER",$all_privileges)): ?><li class="nav-item" <?php echo (($selected_privilege === "HOURS_MANAGER") ? "class='active'":"");?>><a class="nav-link" href="<?php echo base_url("admin/hours_manager")?>">Horas</a></li><?php endif;?>
		</ul>	
	</div>
</nav>
