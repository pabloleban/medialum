var countdownSound = new Audio("resources/sounds/roulette/countdown.ogg");
var spinSound = new Audio("resources/sounds/roulette/spin.ogg");
var winSound = new Audio("resources/sounds/roulette/win.ogg");
var loseSound = new Audio("resources/sounds/roulette/lose.ogg");
var soundActivated = new Audio("resources/sounds/roulette/sound_activated.ogg");
var lotChips = new Audio("resources/sounds/roulette/lot_chips.ogg");
var fewChips = new Audio("resources/sounds/roulette/few_chips.ogg");
var popSound = new Audio("resources/sounds/raspadita/pop.ogg")
var myRewards;
var allRewards;
//2 = rojo
//1 = negro
//0 = verde
var numberArray = [
           	    {number:0,position:206,color:0},
           	    {number:1,position:556,color:2},
           	    {number:2,position:456,color:2},
           	    {number:3,position:356,color:2},
           	    {number:4,position:256,color:2},
           	    {number:5,position:106,color:2},
           	    {number:6,position:6,color:2},
           	    {number:7,position:656,color:2},
           	    {number:8,position:606,color:1},
           	    {number:9,position:706,color:1},
           	    {number:10,position:56,color:1},
           	    {number:11,position:156,color:1},
           	    {number:12,position:306,color:1},
           	    {number:13,position:406,color:1},
           	    {number:14,position:506,color:1},
           	    ];

var faq = [{question:"Cuántas veces puedo jugar con los tiros gratis del día?",answer:"Podés seguir jugando con los tiros gratis del día hasta que pierdas."},
              {question:"Cuándo puedo volver a jugar el tiro gratis del día?",answer:"Para poder volver a jugar el tiro gratis tenés que esperar hasta el siguiente día (Lunes a Viernes)."},
			  {question:"Cuál es la apuesta máxima?",answer:"La apuesta máxima es de 500 fichas por tiro."},
              {question:"Qué días puedo jugar a Medialum GO?",answer:"Los juegos de Medialum GO sólo están disponibles de Lunes a Viernes."},
              {question:"Cómo gano premios en Medialum GO?",answer:"Los premios se otorgarán en diversas ocasiones, como eventos, cumpleaños o logrando distintos objetivos."},];

var comoJugarRoulette = ["Elegís <span class='fa fa-circle roulette-bl'></span>, <span class='fa fa-circle roulette-re'></span> o <span class='fa fa-circle roulette-gr'></span>",
		                 "Si elegís <span class='fa fa-circle roulette-bl'></span> o <span class='fa fa-circle roulette-re'></span> y sale el que elejiste, ganás <b>x2</b> veces tu apuesta",
		                 "Si elegís <span class='fa fa-circle roulette-gr'></span> y sale el verde, ganás <b>x14</b> veces tu apuesta (Tenés 1/15 de chances en pegarle)",
		                 "Si no sale el color que elegís, perdés las fichas apostadas",
		                 "Los tiros gratis del día pagan <b>+1</b> por pegarle al <span class='fa fa-circle roulette-bl'></span> o al <span class='fa fa-circle roulette-re'></span> y <b>+14</b> por pegarle al <span class='fa fa-circle roulette-gr'></span>",
		                 "Sumá Mediachips y <b>conseguí premios increíbles</b>"];

var comoJugarRaspadita = ["En este juego tenés una tabla de 3 x 3 <i class='fa fa-table'></i>",
                          "En esta tabla se encuentran aleatoriamente <b>9 números ocultos del 1 al 9</b> (sin repetir)",
                          "Comenzás con un casillero aleatorio revelado",
                          "Luego podés revelar <b>3 casilleros más</b>",
                          "Al tener los <b>4 casilleros revelados</b>, elegís una línea de la tabla al estilo Ta-Te-Ti",
                          "La línea que elijas, <b>pasará sobre 3 casilleros</b>",
                          "La suma de esos 3 casilleros, te darán una <b style='color:red'>suma total</b>",
                          "Cada <b style='color:red'>suma total</b> corresponderá a un cierto <b style='color:#0097ff'>pago</b>",
                          "Los <b style='color:#0097ff'>pagos</b> se mostrarán a la derecha de la <i class='fa fa-table'></i>"]

function medialumGO(){
	var htmlMenu="<table align='center' style='width:100%'>" +
					"<tr>" +
					"<td style='height: 50px;' colspan=2>Tus Mediachips: <img src='resources/img/medialum-chip.png' style='vertical-align:middle' width=30> <span id='lifetime-score'>"+lifetimeScore+"</span><br></td>" +
					"</tr>" +
					"<tr>" +
					"<td colspan=2><label class='button' onclick='selectGame();'>Jugar</label></td>" +
					"</tr>" +
					"<tr>" +
					"<td colspan=2><label class='button disabled' id='menu-rewards' onclick='rewards();'>Mis premios</label></td>" +
					"</tr>" +
					"<tr>" +
					"<td colspan=2><label class='button' onclick='MGOInfo();'>Información</label></td>" +
					"</tr>" +
					"<tr>" +
					"<td colspan=2><label class='button' onclick='verHighscores();'>Ver records</label></td>" +
					"</tr>" +
					"<tr>" +
					"<td colspan=2><label class='button store' onclick='openMedialumStore();'><i class='fa fa-shopping-bag' style='width:100%'></i> Medialum Store</label></td>" +
					"</tr>" +
					"<tr>" +
					"<td colspan=2><label class='button' style='width: 40px; border-radius: 20px; color:black; background:none;' title='"+((medialum_go_sound==1)?"Desactivar sonido":"Activar sonido")+"' id='mgo-sound' onclick='setMGOsound("+((medialum_go_sound==1)?0:1)+");'><i class='fa "+((medialum_go_sound==1)?'fa-volume-up':'fa-volume-off')+"' style='font-size:30px;'></i></label></td>" +
					"</tr>" +
				  "</table>";
	
	$.ajax({
		type:"get",
		url: base_url+"medialum-go/get/status",
		success: function(response){
			response = JSON.parse(response);
			lifetimeScore=Number(response.mediachips);
			myRewards = response.rewards;
			allRewards = response.all_rewards;
			$("#lifetime-score").text(lifetimeScore);
			
			if(response.pending_raspadita!=false){
				swal({
					title:"Partida pendiente",
					html:"Tenés una partida del juego <b>Raspadita</b> sin terminar.<br>Terminala para seguir utilizando Medialum GO!",
					type:"warning",
					confirmButtonText:"Seguir partida",
					cancelButtonText:"Cancelar",
					showCancelButton:true,
				}).then(function(result){
					if(result.value){
						startRaspadita(response.pending_raspadita.positions,response.pending_raspadita.scores,response.pending_raspadita.id);
					}
				});
			}
			
			if(myRewards.length>0){
				$("#menu-rewards").append("<span style='background: red; border-radius: 100%; margin-left: 10px; padding: 1px 5px; font-size: 13px; text-align: center;'>"+myRewards.length+"</span>");
			}
			
			$("#menu-rewards").removeClass("disabled");
		}
	});
	
	swal({
		html:htmlMenu,
		showCancelButton:true,
		showConfirmButton:false,
		cancelButtonText:"Cerrar",
		imageUrl: "resources/img/medialum-go-logo.png",
		imageWidth: 320,
	});
}

function comoJugarText(gametype){
	if(gametype!=null){
		var comoJugar = "";
		var htmlComoJugar = "";
		
		switch(gametype){
			case "ruleta":
				comoJugar=comoJugarRoulette;
				break;
			case "raspadita":
				comoJugar=comoJugarRaspadita;
				break;
		}
		
		for(var i=0;i<comoJugar.length;i++){
			htmlComoJugar+=(i+1)+". "+comoJugar[i]+"."+"<br>";
		}
		
		swal({
			title:"Cómo jugar",
			html:htmlComoJugar,
			showCancelButton:true,
			confirmButtonText:"Volver",
			cancelButtonText:"Cerrar",
			imageUrl: "resources/img/medialum-go-logo.png",
			imageWidth: 320,
		}).then(function(result){
			if(result.value){
				comoJugarText();
			}
		});
	} else {
		swal({
			title:"Cómo jugar",
			html:"<table align='center' style='width:100%'>" +
			"<tr>" +
			"<td colspan=2><label class='button' onclick='comoJugarText(\"ruleta\");'>Ruleta</label></td>" +
			"</tr>" +
			"<tr>" +
			"<td colspan=2><label class='button' onclick='comoJugarText(\"raspadita\");'>Raspadita</label></td>" +
			"</tr>" +
		  "</table>",
			showCancelButton:true,
			confirmButtonText:"Volver",
			cancelButtonText:"Cerrar",
			imageUrl: "resources/img/medialum-go-logo.png",
			imageWidth: 320,
		}).then(function(result){
			if(result.value){
				MGOInfo();
			}
		});
	}
}

function verFAQ(){
	var htmlFAQ = "<div class='mgo-faq' style='text-align:left;'>";
	
	for(var i=0;i<faq.length;i++){
		htmlFAQ+="<div class='question'><i class='fa fa-arrow-circle-right'></i>"+faq[i].question+"</div><div class='answer'>"+faq[i].answer+"</div>";
	}
	
	htmlFAQ+="<div class='compulsive-game-alert'><b>Atención:</b><br>El juego compulsivo puede ser perjudicial para la salud.</div></div>"
	
	swal({
		title:"FAQ<br><div style='font-size:10px;'>Frequently Asked Questions</div>",
		html:htmlFAQ,
		showCancelButton:true,
		confirmButtonText:"Volver",
		cancelButtonText:"Cerrar",
		imageUrl: "resources/img/medialum-go-logo.png",
		imageWidth: 320,
	}).then(function(result){
		if(result.value){
			medialumGO();
		}
	});
}

function MGOStats(){
	swal({
		html:"<svg id='top-loader' class='spinner-container' width='65px' height='65px' viewBox='0 0 52 52'><circle class='path' cx='26px' cy='26px' r='20px' fill='none' stroke-width='4px'></circle></svg>",
		showConfirmButton:false,
		showCancelButton:false,
		allowOutsideClick: true,
	});
	
	$.ajax({
		type:"get",
		url: base_url+"medialum-go/full_stats",
		error:function(){
			swal("Ups!","Ocurrió un error. Intentá de nuevo más tarde.","error");
		},
		success:function(response){
			if(swal.isVisible()){
				$.ajax({
					url: base_url+"resources/js/Chart.bundle.min.js",
					dataType: "script",
					success: function(){
						response = JSON.parse(response);
						var htmlStats = "<h2>Estadísticas Personales</h2>"+
						"<img src='resources/img/medialum-chip.png' width=15> <b>Ganadas con tiros gratis:</b> "+response.my_free_wins+"<br>"+
						"<img src='resources/img/medialum-chip.png' width=15> <b>Apostadas en total:</b> "+response.my_bets+"<br>"+
						"<br><h2>Estadísticas Globales</h2>" +
						"<img src='resources/img/medialum-chip.png' width=15> <b>Ganadas con tiros gratis:</b> "+response.free_wins+"<br>"+
						"<img src='resources/img/medialum-chip.png' width=15> <b>Gastadas en el Store:</b> "+response.mediachips_spent+"<br>"+
						"<b>Apuestas totales:</b> "+response.total_bets+"<br>"+
						"<b>Raspaditas jugadas:</b> "+response.raspaditas_played+"<br><br>"+
						"<canvas id='porcentaje-apuesta-chart' style='width:50%; display: inline-block;'></canvas>"+
						"<canvas id='porcentaje-trending-chart' style='width:50%; display: inline-block;'></canvas><br><br>"+
						"<canvas id='free-wins-chart' style='width:100%; height: 300px;'></canvas>";
						swal({
							title:"",
							html:htmlStats,
							showCancelButton:true,
							confirmButtonText:"Volver",
							cancelButtonText:"Cerrar",
							imageUrl: "resources/img/medialum-go-logo.png",
							imageWidth: 320,
						}).then(function(result){
							if(result.value){
								MGOInfo();
							}
						});
						
						var data = {
							    datasets: [{
							        data: [
							            response.people_bet.percentage_green,
							            response.people_bet.percentage_black,
							            response.people_bet.percentage_red,
							        ],
							        backgroundColor: [
							            "#17af0d",
							            "#333937",
							            "#e73356",
							        ],
							        label: 'Porcentaje elegido' // for legend
							    }],
							    labels: [
							        "Verde",
							        "Negro",
							        "Rojo"
							    ]
							};
						
						var myPieChart = new Chart("porcentaje-apuesta-chart",{
						    type: 'pie',
						    data: data,
						    options:{
						    	responsive: false,
						    	title: {
						        	display: true,
						        	text: 'A qué apuesta la gente?'
						    	},
						     	legend: {
						          	display: false
						      	},
						      	tooltips: {
					                mode: 'label',
					                callbacks: {
					                    label: function(tooltipItem, data) {
					                        return data['datasets'][0]['data'][tooltipItem['index']] + '%';
					                    }
					                }
					            },
							}
						});
						
						data = {
							    datasets: [{
							        data: [
							            response.trend.percentage_green,
							            response.trend.percentage_black,
							            response.trend.percentage_red,
							        ],
							        backgroundColor: [
							            "#17af0d",
							            "#333937",
							            "#e73356",
							        ],
							        label: 'Porcentaje elegido' // for legend
							    }],
							    labels: [
							        "Verde",
							        "Negro",
							        "Rojo"
							    ]
							};
						
						myPieChart = new Chart("porcentaje-trending-chart",{
						    type: 'pie',
						    data: data,
						    options:{
						    	responsive: false,
						    	title: {
						        	display: true,
						        	text: 'Qué es lo que más sale?'
						    	},
						     	legend: {
						          	display: false
						      	},
						      	tooltips: {
					                mode: 'label',
					                callbacks: {
					                    label: function(tooltipItem, data) {
					                        return data['datasets'][0]['data'][tooltipItem['index']] + '%';
					                    }
					                }
					            },
							}
						});
						
						var data_date = [];
						var data_score = [];
						
						for(var i=0;i<response.last_10_free_wins.length;i++){
							data_date.push(response.last_10_free_wins[i].date);
							data_score.push(response.last_10_free_wins[i].score);
						}
						
						data = {
						    labels: data_date,
						    datasets: [
						        {
						            label: "Mediachips",
						            data: data_score,
						            backgroundColor: '#e73356',
						        }
						    ]
						};
						
						var myBarChart = new Chart("free-wins-chart", {
						    type: 'bar',
						    data: data,
						    options:{
						    	responsive: false,
						    	title: {
						        	display: true,
						        	text: 'Mediachips totales ganadas con los tiros gratis (Últimos 10 días)'
						    	},
						    },
						});
					}
				});
			}
		}
			
	});
}

var seleccion=-1;

function selectGame(){
	var htmlMenu="<table align='center' style='width:100%'>" +
		"<tr>" +
		"<td style='height: 50px;' colspan=2>Tus Mediachips: <img src='resources/img/medialum-chip.png' style='vertical-align:middle' width=30> "+lifetimeScore+"<br></td>" +
		"</tr>" +
		"<tr>" +
		"<td colspan=2 class='game-select' id='rou' onclick='selectMode();' onmouseenter='$(this).css(\"background-position-x\",((parseInt($(this).css(\"background-position-x\").replace(\"px\", \"\")))-2000))'><div class='g-logo'><img src='resources/img/ruleta.png' width=75></div><div class='g-text'>Ruleta</div></td>" +
		"</tr>" +
		"<tr style='height:20px;'>" +
		"</tr>" +
		"<tr>" +
		"<td colspan=2 class='game-select "+((lifetimeScore<10)?"disabled":"")+"' style='background-position-y:2000px' id='ras' onclick='raspadita();' onmouseenter='$(this).css(\"background-position-y\",((parseInt($(this).css(\"background-position-y\").replace(\"px\", \"\")))+2000)); $(this).css(\"background-position-x\",((parseInt($(this).css(\"background-position-x\").replace(\"px\", \"\")))+500))'><div class='g-logo'><img src='resources/img/raspadita.png' width=75></div><div class='g-text'>Raspadita<div class='g-text-cost'>Costo: 10 <img src='resources/img/medialum-chip.png' style='vertical-align:middle' width=30></div></div></td>" +
		"</tr>" +
	"</table>";

	swal({
		title:"Elegí el juego",
		html:htmlMenu,
		showCancelButton:true,
		showConfirmButton:true,
		confirmButtonText:"Volver",
		cancelButtonText:"Cerrar",
		imageUrl: "resources/img/medialum-go-logo.png",
		imageWidth: 320,
		animation:false
	}).then(function(result){
		if(result.value){
			medialumGO();
		}
	});
	
	$(".game-select#row").trigger("onmouseenter");
	if(lifetimeScore<10){
		$(".game-select#ras").trigger("onmouseenter");
	}
}

function selectMode(){
	var htmlMenu="<table align='center' style='width:100%'>" +
		"<tr>" +
		"<td style='height: 50px;' colspan=2>Tus Mediachips: <img src='resources/img/medialum-chip.png' style='vertical-align:middle' width=30> "+lifetimeScore+"<br></td>" +
		"</tr>" +
		"<tr>" +
		"<td colspan=2><label class='button' onclick='playMGO();'>Tiro gratis del día</label></td>" +
		"</tr>" +
		"<tr>" +
		"<td colspan=2><label class='button "+((lifetimeScore<=0)?"disabled":"")+"' onclick='betMediachips();'>Apostar Mediachips</label></td>" +
		"</tr>" +
	"</table>";

	swal({
		title:"Modo de juego",
		html:htmlMenu,
		showCancelButton:true,
		showConfirmButton:true,
		cancelButtonText:"Cerrar",
		confirmButtonText:"Volver",
		imageUrl: "resources/img/medialum-go-logo.png",
		imageWidth: 320,
		animation:false
	}).then(function(result){
		if(result.value){
			selectGame();
		}
	});
}

var sumas=[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];

function raspadita(){
	var raspData;
	
	swal({
		title: 'Atención!',
		type: 'warning',
		html:'Este juego te consume 10 <img src="resources/img/medialum-chip.png" style="vertical-align:middle" width=30>.<br>Estás seguro que querés continuar?',
		confirmButtonText:'Sí',
		cancelButtonText:'No',
		showCancelButton:true,
		allowOutsideClick: false,
		showLoaderOnConfirm: true,
		preConfirm: function() {
			return new Promise(function(resolve,reject) {
				$.ajax({
					url:base_url+"raspadita/start",
					type:"post",
					data:{type:"raspadita"},
					success:function(response){
						raspData = JSON.parse(response);
						
						if(raspData.status=="weekend"){
							reject("Medialum GO! funciona de lúnes a viernes.");
						}
						
						lifetimeScore-=10;
						resolve();
					},
					error:function(){
						reject("Ocurrió un error. Por favor, intentá de nuevo más tarde.");
					}
				});
			}).catch(error => {
		        swal.showValidationError(error)
		    });
		}
	}).then(function(result){
		if(result.value){
			startRaspadita(raspData.positions,raspData.scores,null);
		}

	});
	
	
}

function betMediachips(){
	swal({
			title: 'Cuánto querés apostar?',
			input: 'range',
			html:"Tus Mediachips: <img src='resources/img/medialum-chip.png' style='vertical-align:middle' width=30> "+lifetimeScore,
			showCancelButton:true,
			showConfirmButton:true,
			cancelButtonText:"Cancelar",
			confirmButtonText:"Jugar",
			imageUrl: "resources/img/medialum-go-logo.png",
			animation:false,
			imageWidth: 320,
			inputAttributes: {
				min: 1,
				max: ((lifetimeScore>=500)?500:lifetimeScore),
				step: 1
			},
			inputValue: ((lifetimeScore>=500)?Math.round(500/2):Math.round(lifetimeScore/2)),
	}).then(function(result){
		if(result.value){
			playMGO(result)
		}
	});
}

function playMGO(bet){
	seleccion=-1;
	
	var htmlSelect =
			"<div style='padding:15px 0px 15px 0px'>Tus últimos tiros:<br><svg id='loader' class='spinner-container' width='30px' height='30px' viewBox='0 0 52 52'><circle class='path' cx='26px' cy='26px' r='20px' fill='none' stroke-width='4px'></circle></svg><div id='last-rolls'></div></div>" +
			"<div class='roulette-select'>" +((typeof(bet)!=="undefined")?"En este tiro apostás: <img src='resources/img/medialum-chip.png' style='vertical-align:middle' width=30> "+bet.value:"")+				
				"<div class='roulette-bl' onclick='changeSelection(1)' value='1'><span class='fa fa-circle'></span> Negro</div>" +
				"<div class='roulette-re' onclick='changeSelection(2)' value='2'><span class='fa fa-circle'></span> Rojo</div>" +
				"<div class='roulette-gr' onclick='changeSelection(0)' value='0'><span class='fa fa-circle'></span> Verde</div>" +
				"</div>";
	
	var unaVuelta = 749;
	
	var jsonNumber;
	
	$.ajax({
		type:"post",
		url: base_url+"roulette/last10Rolls/",
		success: function(response){
			$("#loader").hide();
			response = JSON.parse(response);
			
			if(response.length>0){
				var color;
				
				response = response.reverse();
				
				for(var i=0;i<response.length;i++){
					for(var j=0;j<numberArray.length;j++){
						if(numberArray[j].number==response[i].result){
							var color;
							
							switch(numberArray[j].color){
								case 0:
									color="gr";
									break;
								case 1:
									color="bl";
									break;
								case 2:
									color="re";
									break;
							}
							
							$("#last-rolls").append("<span class='last-shot "+color+"'>"+response[i].result+"</span>");
							break;
						}
					}
				}
				$("#last-rolls").append("<span class='last-shot next-shot'></span>");
				
			} else {
				//nunca tiro
				$("#last-rolls").append("<b>Todavía no hiciste tiros.</b>");
			}
			
		},
		
	});
	
	swal({
		title:"A qué apostás?",
		html:htmlSelect,
		showCancelButton:true,
		cancelButtonText:"Cancelar",
		confirmButtonText:"GO!",
		imageUrl: "resources/img/medialum-go-logo.png",
		imageWidth: 320,
		allowOutsideClick: false,
		showLoaderOnConfirm: true,
		preConfirm: function() {
			return new Promise(function(resolve,reject) {
				if(seleccion==-1){
					throw new Error("Tenés que seleccionar una opción.");
					return;
				}
				
				var today = new Date();
				
				$.ajax({
					type:"post",
					data:{type:"roulette"},
					url: base_url+"roulette/roll/"+seleccion+((typeof(bet)!=="undefined")?"/"+bet.value:""),
					success:function(response){
						response = JSON.parse(response);
						
						if(response.error=="invalid input"){
							reject("Ocurrió un error. Por favor, intentá de nuevo más tarde.");
							return;
						}
						
						if(response.error=="maximum allowed reached"){
							reject("No podés apostar más de "+response.limit+" fichas.");
							return;
						}
						
						if(response.error=="already played"){		
							switch(today.getDay()){
								//viernes
								case 5:
									reject("Ya jugaste hoy! Volvé el Lunes!");
									return;
									break;
								
								case 0:
								case 6:
									reject("Medialum GO! funciona de Lunes a Viernes.");
									return;
									break;
									
								//cualquier otro dia
								default:
									reject("Ya jugaste hoy! Volvé mañana!")
									return;
									break;
							}
						}
						
						jsonNumber = response;
						var position;
						var precision;
						
						for(var i=0;i<numberArray.length;i++){
							if(numberArray[i].number==response.number){
								position = numberArray[i].position;
								precision = response.precision;
							}
						}
						
						if(medialum_go_sound==1){
							countdownSound.play();
						}
						
						setTimeout(function(){
							$("#r-status").text("2...");
							countdownSound.pause();
							countdownSound.currentTime = 0;   
							if(medialum_go_sound==1){
								countdownSound.play();
							}
						},1000);
						
						setTimeout(function(){
							$("#r-status").text("1...");
							countdownSound.pause();
							countdownSound.currentTime = 0;   
							if(medialum_go_sound==1){
								countdownSound.play();
							}
						},2000);
						
						setTimeout(function(){
							if(medialum_go_sound==1){
								spinSound.play();
							}
							$(".roulette").css("background-position-x","calc("+(position+precision)+"px - "+((460-$(".roulette").width())/2)+"px)");
							setTimeout(function(){
								//da los resultados
								
								lifetimeScore+=parseInt(response.score);
								
								if(response.score>0){
									if(medialum_go_sound==1){
										winSound.play();
									}
									
									$("#r-status").text("Ganaste!");
									$("#r-status").addClass("r-win");
									
									if(medialum_go_sound==1){
										fewChips.play();
									}
									
									$("#play-again").removeClass("disabled");
								} else {
									if(medialum_go_sound==1){
										loseSound.play();
									}
									
									$("#r-status").text("Perdiste");
									$("#r-status").addClass("r-lose");
									
									if(typeof(bet)!=="undefined" && lifetimeScore>0){
										$("#play-again").removeClass("disabled");
									}
								}
								
								var initValue = parseInt($("#tus-mediachips").text());
								$("#tus-mediachips").prop('Counter',initValue).animate({
							        Counter: lifetimeScore
							    }, {
							        duration: 500,
							        easing: 'linear',
							        step: function (now) {
							        	$("#tus-mediachips").text(Math.ceil(now));
							        }
							    });
								
								var score_result;
								
								if(response.score!=0){
									if(response.score<0){
										score_result = response.score;
										$("#score-result").css("color","red");
									} else {
										score_result = "+"+response.score;
										$("#score-result").css("color","green");
									}
									
									$("#score-result").text(score_result);
									$("#score-result").css("opacity","1");
									$("#score-result").css("top","100px");
									$("#score-result").css("opacity","0");
								}
								
								$(".r-result").text("Número: "+response.number);
								$(".roulette").css("transition","0s");
								$(".roulette").css("background-position-x","calc("+(position+precision)+"px - "+((460-$(".roulette").width())/2)+"px)");
								
								$(".button.disabled").not("#play-again").removeClass("disabled");
							},8000);
							
							$("#r-status").text("Girando!");
						},3000);
						
						var htmlRoll = "<div class='roulette' style='background-position-x:"+(Math.floor(Math.random() * 4000) + 3500)+"px'><div class='roulette-indicator'></div></div>" +
								"<div class='r-status' id='r-status'>3...</div>"+
								"<div class='r-score'>Tus Mediachips: <img src='resources/img/medialum-chip.png' style='vertical-align:middle;' width=30> <span id='tus-mediachips'>"+lifetimeScore+"</span><span id='score-result' class='r-score-result'></span></div>"+
								"<div class='r-result'>Número: -</div><br>"+
								"<div class='button button-r disabled' style='background-color:#52cd20; color:white;' id='play-again' onclick='"+((typeof(bet)!=="undefined")?"betMediachips();":"playMGO();")+"'>"+((typeof(bet)!=="undefined")?"Apostar":"Podés jugar")+" de nuevo!</div><br>"+
								"<div class='button button-r disabled' onclick='verHighscores();'>Ver records</div><br>"+
								"<div class='button button-r disabled' onclick='swal.close();'>Cerrar</div>"
						
						swal({
							title:"Buena suerte!",
							html:htmlRoll,
							showConfirmButton:false,
							allowOutsideClick: false,
						});
					},
					error:function(){
						reject("Ocurrió un error. Por favor, intentá de nuevo más tarde.");
					}
				});
			}).catch(error => {
		        swal.showValidationError(error)
		    });
	  },
	});
}

function changeSelection(selection){
	$(".roulette-selected").removeClass("roulette-selected");
	seleccion=selection;
	
	switch(selection){
		case 1:
			$(".roulette-select .roulette-bl").addClass("roulette-selected");
			break;
		case 2:
			$(".roulette-select .roulette-re").addClass("roulette-selected");
			break;
		case 0:
			$(".roulette-select .roulette-gr").addClass("roulette-selected");
			break;
	}
}

function verHighscores(){
	swal({
		html:"<svg id='top-loader' class='spinner-container' width='65px' height='65px' viewBox='0 0 52 52'><circle class='path' cx='26px' cy='26px' r='20px' fill='none' stroke-width='4px'></circle></svg>",
		showConfirmButton:false,
		showCancelButton:false,
		allowOutsideClick: true,
	});
	
	$.ajax({
		type:"get",
		url: base_url+"roulette/top10/lifetime",
		success:function(response){
			if(swal.isVisible()){
				puestos = JSON.parse(response);
				
				var html = "<table style='width: 98%; border-collapse: collapse;'>";
				
				html += "<tr style='border: 1px solid lightgrey;'><td style='border: 1px solid lightgrey; padding: 15px 0px 15px 0px;'>Pos.</td>" +
						"<td style='border: 1px solid lightgrey; padding: 15px 0px 15px 0px;'>Usuario</td>" +
						"<td style='border: 1px solid lightgrey; padding: 15px 0px 15px 0px;'><img src='resources/img/medialum-chip.png' style='margin-right: 8px; vertical-align:middle;' width=30>Mediachips</td>" +
						"</tr>"
				
				var puntosPuestoAnterior;
				var puestoNumero = 0;	
				
				var usuarioLocal = "background: #e6e6e6;";
				
				for(var i=0;i<puestos.length;i++){
					var additionalImage= '';
	
					if(puestos[i].mediachips!=puntosPuestoAnterior){
						puestoNumero++;
					}
					
					switch(puestoNumero){
						case 1 :
							additionalImage="1f947.png";
							break;
						case 2 :
							additionalImage="1f948.png";
							break;
						case 3 :
							additionalImage="1f949.png";
							break;
					}
					
					html += "<tr style='border: 1px solid lightgrey;'>" +
							"<td class='top-row' style='border: 1px solid lightgrey; "+((c_username==puestos[i].username&&puestoNumero>3)?usuarioLocal:"")+"'>"+((puestoNumero<=3)?"<img src='"+base_url+"resources/img/emojis/default/"+additionalImage+"'>":"<b>"+puestoNumero+".</b>")+"</td>" +
							"<td style='border: 1px solid lightgrey;"+((c_username==puestos[i].username)?usuarioLocal:"")+"'>"+puestos[i].nombre+" "+puestos[i].apellido+"</td>" +
							"<td style='border: 1px solid lightgrey;"+((c_username==puestos[i].username)?usuarioLocal:"")+"'><img src='resources/img/medialum-chip.png' style='margin: 10px; vertical-align:middle; margin-right:10px' width=20>"+puestos[i].mediachips+"</td>" +
							"</tr>";
					
					puntosPuestoAnterior=puestos[i].mediachips;
				}
				
				html +="</table>";
				
				swal({
					title:"Top 10",
					html:html,
					cancelButtonText:"Cerrar",
					confirmButtonText:"Ir al menú",
					showConfirmButton:true,
					showCancelButton:true,
				}).then(function(result){
					if(result.value){
						medialumGO();
					}
				});
			}
		},
		error:function(){
			if(swal.isVisible()){
				swal("Ups!","Ocurrió un error. Intentá de nuevo más tarde.","error");
			}
		}
	});
}

var medialumStoreItems;

function openMedialumStore(){
	swal({
		html:"<svg id='top-loader' class='spinner-container' width='65px' height='65px' viewBox='0 0 52 52'><circle class='path' cx='26px' cy='26px' r='20px' fill='none' stroke-width='4px'></circle></svg>",
		showConfirmButton:false,
		showCancelButton:false,
		allowOutsideClick: false,
	});
	
	$.ajax({
		type:"get",
		url: base_url+"store/get",
		success:function(response){
			if(swal.isVisible()){
				items = JSON.parse(response);
				
				medialumStoreItems = items;
				
				var htmlFinal = "";
				
				htmlFinal += "<img src='"+base_url+"resources/img/banner-mgo.png' style='width:100%;'>"
				
				for(var i = 0;i<items.length;i++){
					
					htmlFinal += "<div item-id='"+items[i].id_product+"' class='store-item "+((items[i].stock<=0 && items[i].stock!=null)?"no-stock":"")+"'>";
					htmlFinal += "<div class='img-wrapper' style='background: url(\""+base_url+items[i].img+"\") no-repeat center; background-size:80%'></div><img src='resources/img/medialum-chip.png' style='vertical-align:middle' width=30><b style='"+((items[i].discount>0)?"color:red;":"")+"'> "+(items[i].price-items[i].discount)+" </b>"+((items[i].stock<=0 && items[i].stock!=null)?"<b style='color:red'>Sin stock</b>":"<div class='button' style='display:inline' onclick='verItemStore("+items[i].id_product+");'>Ver</div>")+""+((new Date(items[i].date).getTime()>new Date().getTime() - (15 * 24 * 60 * 60 * 1000))?"<span class='new-item'>Nuevo</span>":"")+"</div>";
					htmlFinal += "</div>";
				}
				
				swal({
					//title:"<i class='fa fa-shopping-bag'></i><br>Medialum Store",
					html:htmlFinal,
					cancelButtonText:"Cerrar",
					confirmButtonText:"Volver",
					showConfirmButton:true,
					showCancelButton:true,
					width:'750px',
				}).then(function(result){
					if(result.value){
						medialumGO();
					}
				});
			}
		},
		error:function(){
			if(swal.isVisible()){
				swal("Ups!","Ocurrió un error. Intentá de nuevo más tarde.","error");
			}
		}
	});
}

function verItemStore(item_id){
	var itemStore;
	
	for(var i=0;i<medialumStoreItems.length;i++){
		if(item_id==medialumStoreItems[i].id_product){
			itemStore=medialumStoreItems[i];
		}
	}
	
	var options;
	
	if(itemStore.option_name!=null){
		for(var i=0;i<itemStore.options.length;i++){
			options+="<option value='"+itemStore.options[i].option+"'>"+itemStore.options[i].option+"</option>";
		}
	}
	
	var htmlFinal = "<div class='item-preview' style='background:url(\""+itemStore.img+"\") no-repeat center; background-size:70%'></div>" +
			"<img src='resources/img/medialum-chip.png' style='vertical-align:middle' width=30><b> "+itemStore.price + " </b>" +
			"<br>"+itemStore.description+((itemStore.option_name!=null)?"<br><br>"+itemStore.option_name+": <select id='option-selection'>"+options+"</select>":"")+"<br><br><b>Stock: "+((itemStore.stock==null)?"A pedido":((itemStore.stock<=0)?"<span style='color:red;'>Sin stock</span>":itemStore.stock))+"</b>";
	
	swal({
		title:itemStore.name,
		html:htmlFinal,
		showConfirmButton:true,
		showCancelButton:true,
		cancelButtonText:"Volver",
		confirmButtonText:"<img src='resources/img/medialum-chip.png' style='vertical-align:middle;' width=20><b style='vertical-align: middle;'> "+itemStore.price + " </b>",
	}).then(function(result){
		if(result.value){
			confirmPurchase(itemStore,$("#option-selection").val());
		} else if(result.dismiss === swal.DismissReason.cancel){
			openMedialumStore()
		}
	});
	
	if(itemStore.price-itemStore.discount>lifetimeScore || itemStore.stock == 0){
		swal.disableConfirmButton();
	}
}

function confirmPurchase(itemStore,option){
	itemStore.selected_option = option;
	
	swal({
		title:"Estás seguro?",
		html:"Seguro que querés comprar este artículo del <b>Medialum Store</b>?",
		type:"warning",
		showLoaderOnConfirm: true,
		allowOutsideClick:false,
		preConfirm: function() {
			return new Promise(function(resolve,reject) {
				$.ajax({
					type:"post",
					data:itemStore,
					url: base_url+"store/buy",
					success:function(response){
						if(response=="success"){
							swal("Éxito","Tu compra fue realizada con éxito. <br> Vas a recibir tu producto pronto.","success");
							lifetimeScore = lifetimeScore - itemStore.price;
						} else { 
							reject("Ocurrió un error. Por favor, intentá de nuevo más tarde.");
						}
					},
					error:function(){
						reject("Ocurrió un error. Por favor, intentá de nuevo más tarde.");
					}
				});
			}).catch(error => {
		        swal.showValidationError(error)
		    });
		},
		showConfirmButton:true,
		showCancelButton:true,
		cancelButtonText:"Cancelar",
		confirmButtonText:"Confirmar compra",
	});
}

function startRaspadita(positions,scores,game_id){
	
	var raspaditaCounter=0;
	
	swal({
		html:"	<div class='raspadita'>" +
				"<table class='rasp-game'>" +
				"<tr><td id='flecha_1' class='flecha disabled'><i class='fas fa-arrow-circle-right text-dark' style='transform: rotate(45deg);'></i></td><td id='flecha_2' class='flecha disabled'><i class='fas fa-arrow-circle-down text-dark'></i></td><td id='flecha_3' class='flecha disabled'><i class='fas fa-arrow-circle-down text-dark'></i></td><td class='flecha disabled' id='flecha_4'><i class='fas fa-arrow-circle-down text-dark'></i></td><td class='flecha disabled' id='flecha_5'><i class='fas fa-arrow-circle-down text-dark' style='transform: rotate(45deg);'></i></td></tr>" +
				"<tr><td id='flecha_6' class='flecha disabled'><i class='fas fa-arrow-circle-right text-dark'></i></td><td class='pos' id='pos_1'></td><td class='pos' id='pos_2'></td><td class='pos' id='pos_3'></td></tr>" +
				"<tr><td id='flecha_7' class='flecha disabled'><i class='fas fa-arrow-circle-right text-dark'></i></td><td class='pos' id='pos_4'></td><td class='pos' id='pos_5'></td><td class='pos' id='pos_6'></td></tr>" +
				"<tr><td id='flecha_8' class='flecha disabled'><i class='fas fa-arrow-circle-right text-dark'></i></td><td class='pos' id='pos_7'></td><td class='pos' id='pos_8'></td><td class='pos' id='pos_9'></td></tr>" +
				"<tr><td class='g-status' colspan='5' id='game-status'></td></tr>"+
				"</table>" +
				"<div class='button button-r disabled' style='background-color:#52cd20; color:white;' onclick='raspadita()'>Jugar de nuevo!</div>" +
				"</div>" +
				"<div class='scores'>" +
				"<table id='tabla-scores'>" +
				"<tr>Pagos</tr>" +
				"<tr><td>Suma</td><td><img src='resources/img/medialum-chip.png' style='vertical-align:middle' width=20></td><td>Suma</td><td> <img src='resources/img/medialum-chip.png' style='vertical-align:middle' width=20></td></tr>" +
				"</table>" +
				"</div>",
		width:700,
		allowOutsideClick: false,
		confirmButtonText: "Cerrar"
	});
	
	swal.disableConfirmButton();
	
	var selectLine = function(){
		$("#game-status").text("Elegí tu línea.");
		$(".pos").unbind("click");
		$(".pos").addClass("revealed");
		$(".flecha.disabled").removeClass("disabled");
		
		raspaditaCounter=0;
		
		$(".flecha").hover(function(){
			switch($(this).attr("id")){
				case "flecha_1":
					$("#pos_1, #pos_5, #pos_9").addClass("marked");
					break;
				case "flecha_2":
					$("#pos_1, #pos_4, #pos_7").addClass("marked");
					break;
				case "flecha_3":
					$("#pos_2, #pos_5, #pos_8").addClass("marked");
					break;
				case "flecha_4":
					$("#pos_3, #pos_6, #pos_9").addClass("marked");
					break;
				case "flecha_5":
					$("#pos_3, #pos_5, #pos_7").addClass("marked");
					break;
				case "flecha_6":
					$("#pos_1, #pos_2, #pos_3").addClass("marked");
					break;
				case "flecha_7":
					$("#pos_4, #pos_5, #pos_6").addClass("marked");
					break;
				case "flecha_8":
					$("#pos_7, #pos_8, #pos_9").addClass("marked");
					break;
					
			}
		},function(){
			$(".marked").removeClass("marked");
		});
		
		$(".flecha").click(function(){
			$.ajax({
				url:base_url+"raspadita/choose",
				data:{line:$(this).attr("id").replace("flecha_",""),type:"raspadita-line",game_id:game_id},
				type:'post',
				success:function(response){
					response = JSON.parse(response);
					
					$(".flecha").addClass("disabled");
					
					$("#pos_1").text(response.allPositions[0]);
					$("#pos_2").text(response.allPositions[1]);
					$("#pos_3").text(response.allPositions[2]);
					$("#pos_4").text(response.allPositions[3]);
					$("#pos_5").text(response.allPositions[4]);
					$("#pos_6").text(response.allPositions[5]);
					$("#pos_7").text(response.allPositions[6]);
					$("#pos_8").text(response.allPositions[7]);
					$("#pos_9").text(response.allPositions[8]);
					
					$("#game-status").html("Ganaste <span class='final-score'>0</span> <img src='resources/img/medialum-chip.png' style='vertical-align:middle; display:inline-block' width=30>")
					
					$('.final-score').prop('Counter',0).animate({
				        Counter: response.score
				    }, {
				        duration: 300,
				        easing: 'linear',
				        step: function (now) {
				        	 $('.final-score').text(Math.ceil(now));
				        }
				    });
					
					lifetimeScore += parseInt(response.score);
					
					if(medialum_go_sound==1){
						if(response.score>10){
							lotChips.play();
							winSound.play();
						} else {
							fewChips.play();
						}
					}
					
					if(lifetimeScore>=10){
						$(".button-r").removeClass("disabled")
					}
					
					swal.enableConfirmButton();
				},
				error:function(){
					$("#game-status").text("Ups! Ocurrió un error.");
				}
			});
		});
	}
	
	for(var i=0;i<Math.floor(scores.length/2)+1;i++){
		$("#tabla-scores").append("<tr><td class='suma'>"+sumas[i]+"</td><td class='score'>"+scores[i]+"</td><td class='suma'>"+sumas[(i+(Math.floor(scores.length/2)))]+"</td><td class='score'>"+scores[(i+(Math.floor(scores.length/2)))]+"</td></tr>")
	}
	
	for(var i=1;i<10;i++){
		if(positions[i-1]!=-1){
			$("#pos_"+i).addClass("revealed").text(positions[i-1]);
			raspaditaCounter++;
		}
	}
	
	if((4-raspaditaCounter)<=0){
		selectLine();
	} else if(4-raspaditaCounter==1){
		$("#game-status").text("Elegí "+(4-raspaditaCounter)+" casillero para revelar.");
	} else {
		$("#game-status").text("Elegí "+(4-raspaditaCounter)+" casilleros para revelar.");
	}
	
	$(".pos").click(function(){
		if(medialum_go_sound==1){
			popSound.pause();
			popSound.currentTime = 0;
			popSound.play();
		}
		
		$(this).html("<svg class='spinner-container' width='30' viewBox='0 0 52 52'><circle class='path' cx='26px' cy='26px' r='20px' fill='none' stroke-width='4px' style='vertical-align:middle;'></circle></svg>")
		$.ajax({
			url:base_url+"raspadita/choose",
			data:{pos:$(this).attr("id").replace("pos_",""),type:"raspadita-number",game_id:game_id},
			type:'post',
			success:function(response){
				response = JSON.parse(response);
				if(response.status!="max reached" && response.status!="error"){
					if($("#pos_"+response.position).text()==""){
						$("#pos_"+response.position).addClass("revealed")
						$("#pos_"+response.position).text(response.number);
						raspaditaCounter++;
					}
					
					if(raspaditaCounter>=4){
						selectLine();
					}
				} else {
					$(this).text("");
				}
			},
			error:function(){
				$("#game-status").text("Ups! Ocurrió un error.");
			}
		});
	});
}

function setMGOsound(enabled){
	$.ajax({
		url:"medialum-go/sound",
		type:"post",
		data:{enabled:enabled}
	});
	
	if(enabled===1){
		soundActivated.pause();
		soundActivated.currentTime = 0; 
		soundActivated.play();
		
		$("#mgo-sound").attr("onclick","setMGOsound(0)");
		$("#mgo-sound").attr("title","Desactivar sonido");
		$("#mgo-sound").html("<i class='fa fa-volume-up' style='font-size:30px;'></i>")
		
		medialum_go_sound = 1;
		
	} else {
		$("#mgo-sound").attr("onclick","setMGOsound(1)")
		$("#mgo-sound").attr("title","Activar sonido");
		$("#mgo-sound").html("<i class='fa fa-volume-off' style='font-size:30px;'></i>");
		
		medialum_go_sound = 0;
	}
}

function rewards(){	
	var htmlFinal = "";
	
	for(var i = 0;i<myRewards.length;i++){
		htmlFinal += "<div class='reward' id='reward_"+myRewards[i].id+"'><img src='"+base_url+"resources/img/emojis/default/"+((myRewards[i].tipo=="GIFT"||myRewards[i].tipo=="BIRTHDAY")?"1f380.png":"1f381.png")+"' style='float:left;'><div class='info'><div class='name'>"+myRewards[i].name+"</div><div class='desc'>"+myRewards[i].description+"</div></div><div class='button open-reward' onclick='claimReward("+myRewards[i].id+")' style='margin-bottom:13px;'>Abrir</div></div>";
	}
	
	if(myRewards.length<=0){
		htmlFinal+="No tenés ningún premio para abrir.";
	}
	
	var rewardCounter = 0;
	//cuenta desbloqueados
	for(var i = 0;i<allRewards.length;i++){
		if(allRewards[i].unlocked){
			rewardCounter++;
		}
	}
	
	htmlFinal+="<h2 style='margin: 20px 10px 10px 10px;'>Listado de premios</h2><div style='margin-bottom:10px;'>Desbloqueados: <b>"+rewardCounter+"/"+allRewards.length+"</b> ("+Math.round((rewardCounter/allRewards.length)*100)+"%)</div>";
	
	for(var i = 0;i<allRewards.length;i++){
		if(allRewards[i].unlocked){
			htmlFinal+="<div class='reward'><img src='"+base_url+"resources/img/emojis/default/1f396.png' style='float:left;'><div class='info'><div class='name'>"+allRewards[i].name+"</div><div class='desc'>"+allRewards[i].description+"</div></div></div>";
		} else {
			var hasProgress = allRewards[i].progress!=null;
			var percentage = 0;
			var left = 0;
			if(hasProgress){
				percentage = Math.round((allRewards[i].progress.completed/allRewards[i].progress.objective)*100);
				
				var left_num = allRewards[i].progress.objective-allRewards[i].progress.completed;
				
				if(left_num<=0){
					left_num=1;
				}
				
				if(left_num==1){
					left = "Falta "+left_num;
				} else {
					left = "Faltan "+left_num;
				}
				
				if(percentage > 100){
					percentage = 99;
				}
			}
			
			htmlFinal+="<div class='reward not-unlocked'><img src='"+base_url+"resources/img/emojis/default/1f512.png' style='float:left;'><div class='info'><div class='name'>"+allRewards[i].name+"</div><div class='desc'>"+allRewards[i].description+"</div>"+((hasProgress)?"<div class='complete-status'><div class='completed' style='width:"+percentage+"%;'></div></div><div class='complete-percentage'>"+percentage+"%</div><b>"+left+"</b>":"")+"</div></div>";
		}
	}
	
	swal({
		title:"Premios",
		html:htmlFinal,
		cancelButtonText:"Cerrar",
		confirmButtonText:"Volver",
		showConfirmButton:true,
		showCancelButton:true,
		onClose:modulesStatus,
	}).then(function(result){
		if(result.value){
			medialumGO();
		}
	});
}

function claimReward(id){
	$("#reward_"+id).find(".open-reward").replaceWith("<svg id='loader' class='spinner-container' width='40px' height='40px' style='vertical-align: middle; margin-left: 25px;' viewBox='0 0 52 52'><circle class='path' cx='26px' cy='26px' r='20px' fill='none' stroke-width='4px'></circle></svg>");
	$.ajax({
		type:"post",
		url: base_url+"medialum-go/claim",
		data:{id:id},
		success:function(response){
			response = JSON.parse(response);
			
			if(response.status=="success"){
				$("#reward_"+id).find("#loader").replaceWith("<img src='resources/img/medialum-chip.png' style='vertical-align:middle' width=30> <span id='mediachips-reward'>0</span>");
				
				$("#reward_"+id).find("#mediachips-reward").prop('Counter',0).animate({
			        Counter: parseInt(response.reward)
			    }, {
			        duration: 500,
			        easing: 'linear',
			        step: function (now) {
			        	$("#reward_"+id).find("#mediachips-reward").text(Math.ceil(now));
			        }
			    });
				
				if(medialum_go_sound==1){
					lotChips.play();
				}
				
				lifetimeScore+=parseInt(response.reward);
				
			} else {
				$("#reward_"+id).find("#loader").replaceWith("Error");
			}
		},
		error:function(){
			$("#reward_"+id).find("#loader").replaceWith("Error");
		}
	});
}

function MGOInfo(){
	swal({
		title:"Información",
		html:"<table align='center' style='width:100%'>" +
		"<tr>" +
		"<td colspan=2><label class='button' onclick='MGOStats();'>Estadísticas</label></td>" +
		"</tr>" +
		"<tr>" +
		"<td colspan=2><label class='button' onclick='comoJugarText();'>Cómo jugar</label></td>" +
		"</tr>" +
		"<tr>" +
		"<td colspan=2><label class='button' onclick='verFAQ();'>FAQ</label></td>" +
		"</tr>" +
	  "</table>",
		showCancelButton:true,
		confirmButtonText:"Volver",
		cancelButtonText:"Cerrar",
		imageUrl: "resources/img/medialum-go-logo.png",
		imageWidth: 320,
	}).then(function(result){
		if(result.value){
			medialumGO();
		}
	});
}

