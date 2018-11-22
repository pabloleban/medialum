<style>
   .fa.lg{font-size:20px; margin-right:10px;}
</style>

<div class="container">
	<div class="well well-lg">
		<h3>Bienvenido al administrador de Medialum!</h3>
		<hr>
		<p>Tu usuario posee los siguientes privilegios especiales:</p>
		<ul class="list-group">
		<?php foreach($privileges as $privilege){ ?>
			<li class='list-group-item list-group-item-success'><?php  if(isset($privilege["icon"]) && $privilege != null){?><i class='fa <?php echo $privilege["icon"]?> lg'></i><?php } echo " ".$privilege["detail"]; ?></li>
		<?php } ?>
		</ul>
	</div>
</div>