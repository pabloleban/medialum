<div class="container">
	<div class="well well-lg">
    	<h2>Listado de usuarios</h2>
        <p>La siguiente tabla muestra los usuarios registrados en Medialum.</p>
        <div class='btn btn-primary' onclick="swal('Ups!','Todavía no está esta funcionalidad :(','warning')">Agregar usuario</div><br><br>         
        <table class="table table-striped" id='user-data'>
        	<thead>
                <tr>
                    <th class='text-center'>ID</th>
                    <th>Usuario</th>
                    <th>Nombre completo</th>
                    <th class='text-center'>Habilitado</th>
                    <th class='text-center'>Opciones</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach($users as $user):?>
                <tr>
                    <td class='text-center'><?php echo $user["id"]?></td>
                    <td><?php echo $user["username"]?></td>
                	<td><?php echo $user["full_name"]?></td>
                	<td class='text-center'><?php echo (boolval($user["habilitado"])?"<i class='fa fa-check text-success'></i> Habilitado":"<i class='fa fa-times text-danger'></i> Deshabilitado")?></td>
                	<td class='text-center'></td>
                </tr>
                <?php endforeach;?>
            </tbody>
        </table>
	</div>
</div>

<script>

$(document).ready(function(){
    $('#user-data').DataTable({
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
        	},"columnDefs": [ {
        		"targets": 4,
        		"orderable": false
        	} ]
    	});
});

</script>
