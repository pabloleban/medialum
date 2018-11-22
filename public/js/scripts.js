function verInformacion(){
	const infoText = `
	<div class='btn btn-primary mb-4' onclick="window.open('https://www.medialum.com/', '_blank')">Home de ${Medialum.appName}</div>
	<p>Desarrollo y Líder del proyecto: <b>Pablo Leban</b></p>
	<hr>
	<p>Testing y Diseño multimedia: <b>Alan Ruiz</b></p>
	<p>Middleware: <b>Leonardo Cardozo</b></p>
	<p>Diseño gráfico y mobile: <b>Marcelo Almirón</b></p>
	<hr>
	Agradecimientos especiales a <b>Santiago Acosta</b>, <b>Esteban Romero</b>, <b>Andrés Vecchione</b>, <b>César Vega</b> y a todos aquellos que alguna vez aportaron feedback para que ${Medialum.appName} sea lo que es hoy en día.`

	swal({
		title:Medialum.appName+" "+Medialum.version,
		html:infoText,
		showConfirmButton:true,
		showCancelButton:false,
		imageUrl: "resources/img/icon-simple.png",
		imageWidth: 80,
	});
}