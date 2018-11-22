<script>
setTimeout(function(){
	window.location.reload(true);
},120000);
</script>

<link rel="stylesheet" type="text/css" href="<?php echo base_url("resources/css/bootstrap.min.css");?>">
<script src="<?php echo base_url("resources/js/bootstrap.min.js");?>"></script>

<nav class="navbar navbar-expand-lg">
    <a class="navbar-brand">Medialum</a>
</nav>

<div class="container">
	<div class="row">
		<div class="col-md-12 text-center">
			<h1>Ups! Página no encontrada!</h1>
			
			<?php $phrases = array(
			    "Esto no es un bug, es un error de CSS.",
			    "Esto pasa porque hay muchos cryptonancios abiertos.",
			    "Esto pasa porque Santi no hizo el Update.",
			    "Es culpa del internet de Veraz.",
			    "Es que me olvidé de mandar el Update.",
			    "La culpa de es IPLAN, alguno deployó sin probar.",
			    "Es tu coso de PDF que queda cacheado.",
			    "En la nueva versión ya está arreglado.",
			    "No, porque ya pasó un año.",
			    "Sólo a vos te pasa esto.",
			    "Pasa porque no apretaste F5.",
			    "Pasa porque hice un GROUP BY del nombre.",
			    "YouTube tiene un bug.",
			    "No, lo que pasa es que es un caracter solo.",
			    "Ah, sí...",
			    "Leo no subió la versión."
			);
			?>
		
			<blockquote class="blockquote">
        		<p><?php echo $phrases[rand(0, count($phrases) - 1)];?></p>
            	<footer class="blockquote-footer">Pablo Leban, <cite title="Medialum CEO">Medialum CEO.</cite></footer>
            </blockquote>
			<br>
			<img src="<?php echo base_url("resources/img/404.jpg");?>" style="width:100%; max-width: 75%;">
		</div>
	</div>
</div>

</html>