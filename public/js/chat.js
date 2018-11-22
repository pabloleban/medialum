var shortcuts = [
                 {"shortcut":"CTRL + <i class='fas fa-long-arrow-alt-up'></i>","description":"Te desplazas en la lista de contactos para arriba"},
                 {"shortcut":"CTRL + <i class='fas fa-long-arrow-alt-down'></i>","description":"Te desplazas en la lista de contactos para abajo"},
                 {"shortcut":"CTRL + B","description":"Hace foco al buscador"},
                 {"shortcut":"CTRL + M","description":"Hace foco al recuadro de enviar mensajes"},
                 {"shortcut":"##Tu código##","description":"Reconoce automáticamente el lenguaje y lo colorea (Compatible con Java, JavaScript, SQL, C#, XML, HTML, CSS3)"},
                 {"shortcut":":nombre-del-emoji:","description":"Manda un Emoji del listado de Emojis"},
                 {"shortcut":";nombre-del-emoji;","description":"Manda un Emoji del listado de Emojis que gira (Solo para emojis personalizados)"},
                 ]

var incoming_message=new Audio();

var img_max_width=250;
var img_max_height=175;

var clearLastTalkedTo;
var timeoutArray = {};

var imgIDcounter = 0;

window.onbeforeunload = function(){ 
	var pending = false;
	
	for(var i=0;i<temporalMessage.length;i++){
		if(temporalMessage[i].message!==""){
			pending=true;
			break;
		}
	}
	
	if(pending && !isElectron()){
		return "Estás seguro que querés salir?";
	}
}

function logout(){
	swal({
		type:"warning",
		title:"Estás seguro?",
		text:"Estás seguro que querés salir?",
		confirmButtonText:"Sí",
		cancelButtonText:"Cancelar",
		showCancelButton:true,
		showConfirmButton:true,
		showLoaderOnConfirm: true,
		preConfirm: function() {
		    return new Promise(function(resolve,reject) {
	    		$.ajax({
		    		url:base_url+"logout",
		    		type:"post",
		    		success:function(response){
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
			window.location.reload();
		}
	});	
}

var connectionLost = true;

function connect(){
	console.log("Conectando...");
	
	var wsUri;
	
	if(typeof(ipDesarrollo) !== "undefined"){
		wsUri = "ws://"+ipDesarrollo+":9006/daemon.php"; 	
	} else {
		wsUri = "wss://www.learsoft.com/wssserver/";
	}
	
	websocket = new WebSocket(wsUri); 
	
	websocket.onopen = function(ev) { // connection is open
		console.log("Conectado!");
		$(".reconnecting").fadeOut();
		
		if(connectionLost){
			verNovedades()
			connectionLost=false;
			historialLoaded = [];
			historialLoading = [];
			$(".message_box").empty();
		}
	}
	
	websocket.onmessage = function(ev) {
		var msg = JSON.parse(ev.data);
		msg.date = new Date();
	
		message(JSON.stringify(msg),false);
	};
	
	websocket.onerror	= function(ev){
		$(".reconnecting").fadeIn();
		websocket.close();
	}
	
	websocket.onclose 	= function(ev){
		connectionLost = true;
		$(".reconnecting").fadeIn();
		setTimeout(function(){
				connect();
		}, 1000);
	}
}

function message(ev,isHistorial){
	var msg = JSON.parse(ev);
	var type = msg.type;
	
	if(type === 'usermsg' || type === 'file' || type==="survey") 
	{
		var notificationText="";
		
		var date = new Date(msg.date);
		var hours = date.getHours();
		var minutes = date.getMinutes();
		
		if(minutes.toString().length==1){
			minutes="0"+minutes;
		}
		
		var umsg = msg.message; // message text

		if(umsg!=null){
			umsg = umsg.trim();
		}
		
		var username = msg.username;
		var target = msg.target;

		var rawmsg = umsg;
		
		// le saca el escribiendo
		if(username!=c_username && !isHistorial){
			$(".user-list").find("#tag:textEquals('"+username+"')").parent().find("#escribiendo").hide();
			showTypingTalkingTo(false);
			allUsers[username].typing = false;
			clearTimeout(timeoutArray[username]);
		}
		
		// if(!isHistorial && document.hasFocus() && !swal.isVisible() && talking_to===username){
		// 	removeNotifications(username);
		// }

		// if(!isHistorial && document.hasFocus() && !swal.isVisible() && c_username===username){
		// 	removeNotifications(target);
		// }
		
		if(!$('.message_box#'+target).length){
			crear_message_box(target, false);
		}
		
		if(type !== 'file' && type !== "survey"){
			// checkea si es algun video de youtube
			if(validURL(umsg) && umsg.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.)?youtube\.com\/watch(?:\.php)?\?.*v=)([a-zA-Z0-9\-_]+)/g) && umsg.indexOf(' ') < 0){
				// el link es una sola url
				umsg = umsg.replace("&amp;","&");

				var videoID = getParams("v",umsg);
				if(videoID==null){
					// si es youtu.be/HkFlM73G-hk
					videoID = umsg.split("/")[3].split("?")[0];
				}
				var startTime = getParams("t",umsg);
				
				var listID = getParams("list",umsg);
				if(listID!=null){
					listID = "&list="+listID;
				} else {
					listID = "";
				}
				
				if(startTime==null){
					startTime = ""
				} else {
					var videoSeconds = ((/(\d+)s/.test(startTime))?parseInt(/(\d+)s/.exec(startTime)[1]) * 1:0);
					var videoMinutes = ((/(\d+)m/.test(startTime))?parseInt(/(\d+)m/.exec(startTime)[1]) * 60:0);
					var videoHours = ((/(\d+)h/.test(startTime))?parseInt(/(\d+)h/.exec(startTime)[1]) * 60 * 60:0);
					startTime = "&start="+(videoSeconds+videoMinutes+videoHours);
				}
				
				umsg = umsg.replace(/(?:https:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/g, '<iframe width="500" height="300" style="max-width: 100%;" src="https://www.youtube.com/embed/'+videoID+"?"+listID+startTime+'" frameborder="0" allowfullscreen></iframe>');
				notificationText = "Video de YouTube"
				
			} else {		
				umsg = umsg.replace(new RegExp(/##((.|\n)*?)##/, 'g'), "<pre><code>$1</code></pre>");
			}
			
			// custom emojis
			umsg = replaceShortcuts(umsg);
			
			for(var i=0;i<emojis.length;i++){
				if(emojis[i].category==="Custom"){
					// es custom emoji, entonces mete el tag de imagen directo
					umsg = replaceAll(umsg,":"+emojis[i].nombre+":",'<img title=":'+emojis[i].nombre+':" class="emoji" src="'+emojis[i].url+'" style="vertical-align: middle; height:'+((emojis[i].height!=null)?emojis[i].height+"px; width:auto":"auto")+';">');
					
					if(emojis[i].rotable){
						umsg = replaceAll(umsg,";"+emojis[i].nombre+";",'<img title=";'+emojis[i].nombre+';" class="emoji spin" src="'+emojis[i].url+'" style="vertical-align: middle; height:'+((emojis[i].height!=null)?emojis[i].height+"px; width:auto":"auto")+'">');
					}
				} else {
					// es un twemoji, entonces lo pasa al icono con el unicode
					umsg = replaceAll(umsg,":"+emojis[i].nombre+":",emojis[i].unicode);
				}	
			}
		}
		
		// agrega cartel de otro dia
		var usermsgbox;

		if(target==c_username){
			usermsgbox = username
		} else if(username==c_username){
			usermsgbox = target;
		} else if(target.includes(Medialum.groups_prefix)){
			usermsgbox = target;
		}

		checkDateChange(usermsgbox,date,isHistorial);
		
		var additionalHtml = "";
		var additionalStyle = "";
		var additionalClass = "";
		var aStartTag = "";
		var aEndTag = "";
		
		var messageNotShowed = false;
		
		var descarga=false;

		var isImg = false;
		var imgID = "";
		var imgData = {};
		
		if(c_username === msg.username){
			if(!isHistorial && typeof(msg.not_sent) === "undefined"){
				if(type === "usermsg" || type === "survey"){		
					if($(".not_sent[randomID='"+msg.randomID+"']").length > 0){
						$(".not_sent[randomID='"+msg.randomID+"']").removeClass("not_sent");
					} else {
						// no esta el mensaje impreso
						messageNotShowed = true;
					} 
				} else if(type === "file"){
					$(".not_sent[randomID='"+msg.randomID+"']").parent().remove();
					messageNotShowed = true;
				}
			}
		} else if(target === c_username){
			target=username;
		}

		if(type === 'file'){
			if(umsg == null && c_username === msg.username){
				umsg = "<i onclick=\"filesSending['"+msg.randomID+"'].abort();\" title='Cancelar' style='z-index: 100; cursor: pointer; position: absolute; top: 50%; transform: translateY(-50%); left: 32px; font-size: 20px;' class='fas fa-times'></i><svg width='65px' height='65px' viewBox='0 0 52 52' style='vertical-align: middle; transform: rotate(270deg);'><circle class='path' cx='26px' cy='26px' r='20px' fill='none' stroke-width='4px' stroke-linecap='round' style='stroke: rgb(255, 255, 255);stroke-dasharray: 574px !important;stroke-dashoffset: 442px;'></circle><circle class='path' cx='26px' cy='26px' r='20px' fill='none' stroke-width='4px' stroke-linecap='round' style='stroke-dasharray: 565px !important; stroke-dashoffset: 564px !important; transition:all 0.1s ease; stroke: rgb(9, 76, 144);'></circle></svg> <span id='sending-file-status'>Enviando archivo...</span>";
			} else {

				imgData.url = base_url+"resources/files"+umsg;;
				imgData.data = msg.data ? JSON.parse(msg.data) : null;	
				
				var filename = imgData.url.substr(imgData.url.lastIndexOf('/') + 1);
				var extension = filename.substring(filename.lastIndexOf(".")+1);
				
				aStartTag = "<a href='"+encodeURI(imgData.url)+"' title='Descargar "+filename+"' download>";
				aEndTag = "</a>";
				
				switch(extension.toLowerCase()){
					case "jpg":
					case "gif":
					case "png":
					case "svg":
					case "jpeg":
					case "bpm":
					case "ico":
						notificationText="Imagen: "+filename
						additionalClass = "block";
						
						imgID = "img-id"+imgIDcounter;
						
						umsg='<div id="'+imgID+'" class="img-sent" style=\'cursor:pointer;\' alt=\"Envió un archivo(\''+filename+'\')" title="'+filename+'"></div>';
						
						isImg=true;
						break;
					case "mp4":
					case "webm":
						notificationText="Video: "+filename
						var videoURL = base_url+"resources/files"+umsg;
						umsg='<video controls style="display:block; max-width: 100%;"><source src="'+videoURL+'" type="video/'+extension+'"></source>Tu navegador no es compatible con estos videos.</video>';
						break;
					case "mp3":
					case "wav":
					case "ogg":
					case "oga":
						notificationText="Audio: "+filename
						var audioURL = base_url+"resources/files"+umsg;
						umsg='<audio controls style="max-width: 100%;"><source src="'+audioURL+'" type="audio/'+extension+'"></source>Tu navegador no es compatible con estos videos.</audio>';
						break;
					default:
						notificationText="Archivo: "+filename
						umsg="<div class='fas fa-file-alt' style='margin-right: 10px; font-size:35px;'></div><b>"+filename+"</b>";
						descarga=true;
						break;
				}
			}
		}

		if(type === "survey"){
			if(umsg!=null){
				notificationText="Nueva encuesta"
				
				var survey = JSON.parse(umsg)
				umsg = "<div class='survey'>" +
						"<div class='title'><input type='hidden' id='survey-id' value='"+survey.id+"'><input type='hidden' id='spin-counter' value='0'>"+escapeHtml(survey.text)+((survey.type==="anonymous")?"<div class='is-anom'>La encuesta es anónima.":"<div class='is-anom'>Todos pueden ver tu votación.")+"<i class='fas fa-sync reload' title='Recargar votos' onclick='getResultsSurvey("+survey.id+")'></i></div></div>";
				
				for(var i=0;i<survey.options.length;i++){
					var optionText = escapeHtml(survey.options[i]);
					umsg+="<div class='option'><div class='text-container'>"+optionText+"</div><div class='vote-container'><span class='vote' title='Votar esta opción' onclick='surveyVote("+survey.id+","+i+",this, event)'><i class='fa fa-check'></i></span><span class='result' onclick='viewSurveyResults("+survey.id+","+i+",this)'><span id='value'></span><span id='text'>Cargando...</span></span></div></div>"
				}
				
				umsg+="</div>";
						
			}
		}

		if(!descarga){
			aStartTag="";
			aEndTag="";
		}

		var add_name_again = true;
		
		if(c_username !== msg.username){
			// logica que remueve el nombre de la persona si alguien habla
			// varias veces seguidas en un grupo
			if(target.includes(Medialum.groups_prefix)){
				if(!isHistorial){				
					if($(".message_box#"+target).find(".user_name:parent:last,.local_user_name:parent:last").last().attr("username")==username){
						
						var lastMessageTime = new Date($(".message_box#"+target).find(".user_name:parent:last,.local_user_name:parent:last").last().find(".time-div").attr("completetime"));
						
						if(lastMessageTime.getFullYear()==date.getFullYear() && 
						   lastMessageTime.getMonth() == date.getMonth() && 
						   lastMessageTime.getDate() == date.getDate() &&
						   lastMessageTime.getHours() == date.getHours() &&
						   lastMessageTime.getMinutes() == date.getMinutes()){
							add_name_again=false;
						}
					}
				} else {
					if($(".message_box#"+target).find(".user_name:parent:first,.local_user_name:parent:first").first().attr("username")==username){
						var lastMessageTime = new Date($(".message_box#"+target).find(".user_name:parent:first,.local_user_name:parent:first").first().find(".time-div").attr("completetime"));
						
						if(lastMessageTime.getFullYear()==date.getFullYear() && 
								   lastMessageTime.getMonth() == date.getMonth() && 
								   lastMessageTime.getDate() == date.getDate() &&
								   lastMessageTime.getHours() == date.getHours() &&
								   lastMessageTime.getMinutes() == date.getMinutes()){
							
							$(".message_box#"+target).find(".user_name:first").find("span:first").remove();
							$(".message_box#"+target).find(".user_name:first").removeClass("msg_start")
						}
					}
				}
			}
		}
		
		if(typeof msg.randomID === "undefined"){
			msg.randomID = generateRandomID()
		}

		if(c_username === msg.username){
			// agrega el globito del mensaje con el texto
			var finalHtml = "<div class='me message_block'><div class=\"local_user_name "+((typeof(msg.not_sent)!=="undefined" && msg.not_sent && !messageNotShowed)?"not_sent":"")+"\" randomID='"+msg.randomID+"'"+additionalHtml+"><span class=\"user_message "+additionalClass+"\">"+aStartTag+twemoji.parse(umsg,function(i,o,v){return getEmojiURL(i);})+aEndTag+"</span><span class='espacio'></span><div onclick='messageTools(this);' class='time-div' completetime='"+date+"'><span class=\"time\" content-data=\""+hours+":"+minutes+"\"></span><span class='message-tools fa fa-cog' style='display:none'></span></div></div></div>";
			
			if(isHistorial){
				$(finalHtml).insertAfter($(".message_box#"+target+" .date_message:first").parent());
			} else if((typeof(msg.not_sent)!=="undefined" && msg.not_sent) || messageNotShowed) {
				var isLoaded=false;
				for(var i=0;i<historialLoaded.length;i++){
					if(historialLoaded[i].split(",")[0]==target){
						isLoaded=true;
						break;
					}
				}
				
				if(isLoaded){
					$('.message_box#'+target).append(finalHtml);
					scrollToBottom(target,true);
				}
			}
		} else {
			var finalHtml = "<div class='him message_block'><div username='"+username+"' class=\"user_name "+((target.includes(Medialum.groups_prefix))?((add_name_again)?"msg_start":""):"")+"\" randomID='"+msg.randomID+"' "+additionalHtml+">"+((target.includes(Medialum.groups_prefix))?((add_name_again)?"<span style=\"color:#"+allUsers[username].color+"; font-size: 13px;\" onclick='changeTalkingTo(\""+username+"\")' class='group-username'><b>"+getUserFullName(username)+"</b><br></span>":""):"")+"<span class=\"user_message "+additionalClass+" \">"+aStartTag+twemoji.parse(umsg,function(i,o,v){return getEmojiURL(i);})+aEndTag+"</span><span class='espacio'></span><div onclick='messageTools(this);' class='time-div' completetime='"+date+"'><span class=\"time\" content-data=\""+hours+":"+minutes+"\"></span><span class='message-tools fa fa-cog' style='display:none'></span></div></div></div>";
			
			if(isHistorial){
				$(finalHtml).insertAfter($(".message_box#"+target+" .date_message:first").parent());
			} else { 
				if($('.message_box#'+target).is(":visible")){
					let isScrolledToBottom = $('.message_box#'+target).isScrolledBottom();

					$('.message_box#'+target).append(finalHtml);

					if(isScrolledToBottom){
						scrollToBottom(target, true)
					}
				} else {
					var isLoaded=false;
					for(var i=0;i<historialLoaded.length;i++){
						if(historialLoaded[i].split(",")[0]==target){
							isLoaded=true;
							break;
						}
					}
					
					if(isLoaded){
						$('.message_box#'+target).append(finalHtml);
					}
				}
				
				resetRecordatorio();
			}
		}
		$('.message_box#'+target+' [randomID="'+msg.randomID+'"]').linkify({
		    target: "_blank"
		});
		
		$('.message_box#'+target+' [randomID="'+msg.randomID+'"] pre code').each(function(i, block) {
			hljs.highlightBlock(block);
			$(block).parent().parent().parent().css({"max-width": "calc(100% - 20px)"});
		});

		if(isImg){
			loadImg(imgData,imgID);
			imgIDcounter++;
		}

		// llevar para arriba la pestana de la persona
		if(!isHistorial){
			if(username==c_username){
				// mensaje del usuario local
				userToTopList(target);
			} else {
				if(talking_to!=target){
					scrollToTopUserList();
				}

				if(target.includes(Medialum.groups_prefix)){
					userToTopList(target);
				} else {
					userToTopList(username)
				}
			}
		}
		
		if(type === "survey"){
			getResultsSurvey(JSON.parse(JSON.parse(ev).message).id);
		}	
		
		if(c_username !== username && !isHistorial){
			incomingMessage(username, (notificationText!="")?notificationText:rawmsg, target);
		}
	}
	
	if(type === 'registration_success' && talking_to != ""){		
		changeTalkingTo(talking_to)
	}
	
	if(type === 'login')
	{
		var umsg = msg.message;
		var cookieState = "online";
		
		// pregunta si tiene cookie de estado
		if (document.cookie.indexOf("state") >= 0) {
			cookieState = getCookie("state");
		}
		
		var register_userdata = {
			type: "register",
			username: c_username,
			password: c_password,
			state: cookieState,
		};
		// convert and send data to server
		websocket.send(JSON.stringify(register_userdata));
	}
	
	if(type === "all-users"){
		allUsers = msg.data;
	} 
	
	if(type === "userlist"){
		var oldAllUsers = JSON.parse(JSON.stringify(allUsers));
		
		for(i in allUsers){
			allUsers[i].state = "offline";
		}
		
		for(i in msg.users){
			allUsers[i].state = msg.users[i].state;
		}
		
		for(i in allUsers){
			if(oldAllUsers[i].state !== allUsers[i].state && allUsers[i].state === "offline"){
				allUsers[i].disconnected_at = new Date();
			}
		}
		
		for(i in allUsers){	
			var agregar_usuario=true;
			
			$('.entidad.usuario').each(function(){
				if(typeof(allUsers[$(this).find("#tag").text()])==="undefined"){
					$(this).remove();
					return true; // continue;
				}
				
				if($(this).find("#tag").text()===i){
					agregar_usuario=false;
					// actualiza estado
					$(this).find(".user-state").attr('class', 'user-state '+allUsers[i].state);
					
					var ultVez;
					
					if(allUsers[i].state==="offline"){
						
						ultVez = getDisconnectedSince(new Date(allUsers[i].disconnected_at));
						$(this).find("#escribiendo").show().text(ultVez);
						
					} else {
						$(this).find("#escribiendo").hide().text("escribiendo...");
					}
				}
			});
			
			if(agregar_usuario){
				if(c_username!==i){
					// checkea si ya estaba en la lista, y le hace show, si no,
					// lo agrega
					if($(".user-list").find("#tag:textEquals('"+i+"')").length>0){
						if($(".user-list").find("#tag:textEquals('"+i+"')").parent().parent().find(".new-message-circle").length>0){
							userToTopList(i);
						}
						$(".user-list").find("#tag:textEquals('"+i+"')").parent().show();
					} else {
						var ultVez;
						
						if(allUsers[i].state==="offline"){
							ultVez = getDisconnectedSince(new Date(allUsers[i].disconnected_at));
						}
						
						$('.user-list').append(`
							<li class="entidad usuario list-group-item d-flex rounded-0 justify-content-between align-items-center p-2" onclick="changeTalkingTo('${i}');">
								<div class="col-3 text-center">
									<div class='user-state ${allUsers[i].state}'></div>
									<img class='rounded-circle' src='resources/img/usuarios/${i}/image.jpg?${new Date().getTime()}' onerror='$(this).attr("src","resources/img/no-profile.png");' width='47px'>
								</div>
								<div class="col-7 pl-0">
									<div id='nombre' class="font-weight-bold">
										${getUserFullName(i)}
									</div>
									<small id='escribiendo' style='${ allUsers[i].state !== "offline" ? "display: none;" : "display: block;" }'>
										${ allUsers[i].state!="offline" ? "escribiendo..." : ultVez }
									</small>
									<span style='display:none;' id='tag'>${i}</span>
								</div>
								<div class="col-2 text-center badges">
										<i class='fas fa-bell-slash' id='status'></i>
								</div>
							</li>`
						);
					}
				} else {
					// actualizo estado del usuario principal
					updateMyUserState();
				}
			}
		}
		
		updateTitle();
		
		checkVerDesconectados();
		checkSilenciados();
		rebindEntities();
		
		if($("#search").val()!==""){
			$("#search").trigger("keyup");
		}
	}
	
	if(type === 'grouplist'){
		groups = msg.groups;
		
		for(i in msg.groups){
			var agregar_grupo=true;
			
			$('.entidad.grupo').each(function(){
				if($(this).find("#tag").text()==i){
					agregar_grupo=false;
				}
			});
			
			if(agregar_grupo){
				crearTabDeGrupo(i);
			}
		}
		
		$('.entidad.grupo').each(function(){
			var remove=true;
			
			for(i in msg.groups){
				if($(this).find("#tag").text()==i){
					remove=false
				}
			}
			
			if(remove){
				$(this).remove();
			}
		});
		
		checkSilenciados();
		rebindEntities();
	}
	
	
	if(type === "updatepic"){
		var user_pic_update = msg.entity;
		
		if(user_pic_update === c_username){
			// checkea si el nombre del usuario esta presente en la url para
			// recargar el src de la img
			$(".my-userpic").find("img").attr("src",base_url+"resources/img/usuarios/"+c_username+"/image.jpg?"+ new Date().getTime());
		} else {
			$('.entidad').each(function(){
				if($(this).find("#tag").text() === user_pic_update){
					if(user_pic_update.includes(Medialum.groups_prefix)){
						$(this).find("img").attr("src",base_url+"resources/img/groups/"+user_pic_update.replace(Medialum.groups_prefix,"")+"/image.jpg?"+ new Date().getTime());
					} else {
						$(this).find("img").attr("src",base_url+"resources/img/usuarios/"+user_pic_update+"/image.jpg?"+ new Date().getTime());
					}
					if(talking_to === user_pic_update){						
						if(user_pic_update.includes(Medialum.groups_prefix)){
							$(".talking-to img").attr("src",base_url+"resources/img/groups/"+user_pic_update.replace(Medialum.groups_prefix,"")+"/image.jpg?"+ new Date().getTime());
						} else {
							$(".talking-to img").attr("src",base_url+"resources/img/usuarios/"+user_pic_update+"/image.jpg?"+ new Date().getTime());
						}
					}
				}
				
			});
		}
	}
	
	if(type === "updateuser"){
		var user_update = msg.userdata.username;
		
		allUsers[user_update].celular=msg.userdata.celular;
		allUsers[user_update].email=msg.userdata.email;
		allUsers[user_update].apodo=msg.userdata.apodo;
		allUsers[user_update].nick=msg.userdata.nick;
		
		$(".entidad").find("#tag:textEquals('"+user_update+"')").parent().find("#nombre").text(getUserFullName(user_update))
		if(talking_to===user_update){
			$(".talking-to #nombre").text(getUserFullName(user_update));
		}
		
		$("div[username='"+user_update+"'] span.group-username b").text(getUserFullName(user_update))

	}

	if(type === "updatestate"){
		allUsers[msg.username].state = msg.state;
	
		if(msg.username === c_username){
			// cambia al usuario local
			updateMyUserState();
		} else {
			$(".entidad").find("#tag:textEquals('"+msg.username+"')").parent().find(".user-state").attr('class', 'user-state '+msg.state);
		}
	}
	
	if(type === "medialum-update" || type === "error"){
		if(type === "medialum-update" && msg.version === Medialum.full_version){
			return;
		}
		
		if(type==="medialum-update" && (msg.mode === "light" || msg.mode === "soft")){
			$("#update-ready").show();
			$(".user-list").css("height","calc(100% - "+($(".update-ready").outerHeight() +  $(".tools").outerHeight() + $(".contact-search").outerHeight())+"px)")
			return;
		}
		
		var minTimeout = 0;
		var maxTimeout = 30000;
		var random = Math.floor(Math.random() * maxTimeout) + minTimeout;
		
		setTimeout(function(){
			window.location.reload(true);
		}, random);
	}

	if(type === "typing"){
		// me escribe un mensaje a mi
		$(".user-list").find("#tag:textEquals('"+msg.username+"')").parent().find("#escribiendo").show();
		
		// setea que esta escribiendo
		allUsers[msg.username].typing = true;
		
		clearTimeout(timeoutArray[msg.username]);
		timeoutArray[msg.username] = setTimeout(function(){
			$(".user-list").find("#tag:textEquals('"+msg.username+"')").parent().find("#escribiendo").hide();
			if(talking_to==msg.username){
				showTypingTalkingTo(false);
			}
			allUsers[msg.username].typing = false;
			
		},4000);
	
		if(talking_to==msg.username){
			showTypingTalkingTo(true);
		}
	}
	
	if(type === "new-group"){
		var users = msg.users;

		var usersInGroup="";
		
		groupCounter++;
		
		var groupId = msg.id;
		
		groups[groupId] = {id:groupId,users:users,name:msg.name};
		
		historialLoaded.push(groupId+",end")
		
		crearTabDeGrupo(groupId);
	
		crear_message_box(groupId,false);
		
		createDateChange(groupId,new Date(),false);
		
		newUserInGroup(groupId,users,users[0],true);
		
		if(users[0]==c_username){
			changeTalkingTo(groupId);
			changeGroupName(groupId,true);
		}
		
		userToTopList(groupId);
	}
	
	if(type === 'group-name-change'){
		$(".entidad.grupo").find("#tag:textEquals('"+msg.group_id+"')").parent().find("#nombre").text(msg.name);
		$(".talking-to").find("#tag:textEquals('"+msg.group_id+"')").parent().find("#nombre").text(msg.name);
		
		for(i in groups){
			if(i==msg.group_id){
				addGroupData(i,statusMessage({"status-type":"group_name_change",group_name_change_to:msg.name,group_name_change_from:groups[i].name,by:msg.by}),false);
				groups[i].name = msg.name;
				break;
			}
		}
	}
	
	if(type==='exit-user-group'){
		var user = msg.who;
		var groupId = msg.group_id;
		
		for(var i=0; i<groups[groupId].users.length; i++){
			if(groups[groupId].users[i]===user){
				addGroupData(groupId,statusMessage({"status-type":"group_exit",who:user}),false);
				groups[groupId].users.splice(i, 1);
			}
		}
		
		if(groups[groupId].users.length<=1 && groups[groupId].users[0]===c_username){
			addGroupData(groupId,statusMessage({"status-type":"you_are_alone"}),false);
		}
				
		if(user===c_username){
			$(".entidad").find("#tag:textEquals('"+groupId+"')").parent().parent().remove();
			delete groups[groupId];
		}
	}
	
	if(type==='new-users-group'){
		
		if (!groups.hasOwnProperty(msg.id)){
			groups[msg.id] = {id:msg.id,users:msg.users,name:msg.name};
		}
		
		for(var j=0; j<msg.users.length; j++){
			var found = false;
			for(var k=0; k<groups[msg.id].users.length; k++){
				if(msg.users[j]==groups[msg.id].users[k]){
					found=true;
					break;
				}
			}
			if(!found){
				groups[msg.id].users.push(msg.users[j]);
			}
		}
		
		if(typeof(msg.newusers)!=="undefined"){
			newUserInGroup(msg.id,msg.newusers,msg.by,false);
		} else {
			newUserInGroup(msg.id,msg.users,msg.by,false);
		}
	}
	
	if(type==="invalid_username"){
		$.ajax({
    		url:base_url+"logout",
    		type:"post",
    		data:{
    			type:"logout",
    			},
    		success:function(response){
    			response = JSON.parse(response);
    			if(response.status==="success"){
    				window.location.href=base_url+"login?invalid_user";
    			}
    		}
    	});
	}
	
	if(type==="historial"){
		
		for (var i=0;i<historialLoading.length;i++) {
		    if (historialLoading[i] === msg.target) {
		    	historialLoading.splice(i, 1);
		        break;
		    }
		}
		
		var historial = msg.historial;
		
		if(historial==="end"){
			for(var i=0;i<historialLoaded.length;i++){
				if(historialLoaded[i].split(",")[0]==msg.target){
					historialLoaded[i]=msg.target+",end";
				}
			}
		} else if($(".message_box#"+msg.target).length>0){
			var old_height = $(".message_box#"+msg.target)[0].scrollHeight;
			var old_scroll = $(".message_box#"+msg.target).scrollTop();
			
			var scrollMsg = false;
			
			if($(".message_box#"+msg.target).scrollTop()<=0){
				scrollMsg=true;
			}
			
			for(var i=0;i<historial.length;i++){
				message(JSON.stringify(historial[i]),true);
			}
			
			if(scrollMsg){
				$(".message_box#"+msg.target).scrollTop(old_scroll + $(".message_box#"+msg.target)[0].scrollHeight - old_height); // restore																													// position"
			}
		}
	}
	
	if(type==="status"){
		checkDateChange(msg.target,msg.date,true);
		
		var stat = JSON.parse(msg.message);

		var status_msg = statusMessage(stat);
		
		addGroupData(msg.target,status_msg,msg.date,true);
	}
	
	if(type==="unread_messages"){
		$(".new-message-circle").remove();
		
		for(var i=0;i<msg.messages.length;i++){
			showNewMessageCircle(msg.messages[i].entity,parseInt(msg.messages[i].notifications));
		}
		
		updateTitle();
		checkVerDesconectados();
	}
	
	if(type==="order"){
		var userOrderList = msg.users;
		
		userOrderList.reverse();
		
		for(var i=0;i<userOrderList.length;i++){
			userToTopList(userOrderList[i]);
		}
	}
	
	if(type==="survey-voted"){
		if($(".survey input[value='"+msg.survey_id+"']").length>0){
			var oldValue = parseInt($(".survey input[value='"+msg.survey_id+"']").parent().parent().find(".option:eq( "+msg.option_index+" )").find(".result #value").text());
			oldValue++;
			
			if(oldValue===1){
				$(".survey input[value='"+msg.survey_id+"']").parent().parent().find(".option:eq( "+msg.option_index+" )").find(".result #text").text(" voto");
			} else {
				$(".survey input[value='"+msg.survey_id+"']").parent().parent().find(".option:eq( "+msg.option_index+" )").find(".result #text").text(" votos");
			}
			
			$(".survey input[value='"+msg.survey_id+"']").parent().parent().find(".option:eq( "+msg.option_index+" )").find(".result #value").text(oldValue)
		}
	}
	
	if(type==="seen_by"){
		$(".message_box#"+msg.username+" .seen-img").remove()
		var actualDate = new Date();
		$(".message_box#"+msg.username+" .me:last .local_user_name").append("<img class='seen-img' title='Visto "+(actualDate.getHours()<10?'0':'') + actualDate.getHours()+":"+(actualDate.getMinutes()<10?'0':'')+actualDate.getMinutes()+"' src='"+getEntityPic(msg.username)+"'>")
		setTimeout(function(){
			$(".message_box#"+msg.username+" .seen-img").css({"transform":"translateX(0px)","opacity":"1"})
		},100);
	}
	
	if(type==="pong"){
		var pingTime = parseInt(new Date().getTime() - msg.when)
		
		if(pingTime < 0){
			return;
		}
		
		pingToastType = "";
		pingResult = "";
		
		if(pingTime>=1000){
			pingToastType = "error"
			pingResult = "Conexión deprimente.";
		} else if(pingTime >= 500){
			pingToastType = "error"
			pingResult = "Conexión muy lenta."
		} else if(pingTime >= 200){
			pingToastType = "warning"
			pingResult = "Conexión lenta."
		} else if(pingTime > 50){
			pingToastType = "success"
			pingResult = "Conexión aceptable."
		} else {
			pingToastType = "success"
			pingResult = "Conexión excelente!"
		}
		
		toastr[pingToastType]("Tu ping es de "+pingTime+"ms.",pingResult)
	}
}

function userToTopList(target){
	$(".user-list").children().find("#tag:textEquals('"+target+"')").parent().parent().prependTo(".user-list");
}

function newUserInGroup(group_id,users,by,isNewGroup){
	if(users.constructor !== Array){
		var tempUser = users;
		users = [];
		users.push(tempUser);
	}
	
	if($(".entidad").find("#tag:textEquals('"+group_id+"')").length<=0){
		crearTabDeGrupo(group_id);
	}
	
	for(var i=0;i<users.length;i++){
		if(i==0 && isNewGroup){
			addGroupData(group_id,statusMessage({"status-type":"group_created",by:by}),false);
		} else {
			addGroupData(group_id,statusMessage({"status-type":"group_added",who:users[i],by:by}),false);
		}
	}
}

function addGroupData(group_id,texto,isHistorial){
	var html = "<div class='message_block'><div class=\"auto_message\"><span class=\"user_message\" style='padding:0'>"+texto+"</span></div></div>";
	
	if(isHistorial){
		$(html).insertAfter($(".message_box#"+group_id+" .date_message:first").parent());
	} else {
		$('.message_box#'+group_id).append(html);
		
		if($('.message_box#'+group_id).is(":visible")){
			scrollToBottom(group_id, false);
		}
	}
}

function crearTabDeGrupo(groupId){
	groupCounter++;
	
	var groupName = groups[groupId].name;
	
	$('.user-list').append(`<li class="entidad grupo list-group-item d-flex rounded-0 justify-content-between align-items-center p-2" onclick="changeTalkingTo('${groupId}');">
								<div class="col-3 text-center">
									<img class='rounded-circle' src='resources/img/groups/${groupId.replace(Medialum.groups_prefix,"")}/image.jpg?${new Date().getTime()}' onerror='$(this).attr("src","resources/img/no-group.png");' width='47px'>
								</div>
								<div class="col-7 pl-0">
									<div id='nombre' class="font-weight-bold">
										${groupName}
									</div>
									<span style='display:none;' id='tag'>${groupId}</span>
								</div>
								<div class="col-2 text-center badges">
									<i class='fas fa-bell-slash' id='status' style="display:none; "></i>
								</div>
							</li>`);
}

var clavarVistoTimeout;
var emojiData;

var btnMenu = "<span class='btn_barras btn_menu_resp waves-effect waves-classic waves-block waves-light' onclick='toggleLeftBarMobile(null)'><i class='fa fa-bars'></i></span>";
var menuAbierto = false;

function toggleLeftBarMobile(state){
	if($(window).width()<=767 && state == null){
		if($(".sidebar").attr("opened")==="true"){
			$('.sidebar').css("transform","translatex(0px)");
			$(".sidebar").attr("opened","false")
		} else {
			$('.sidebar').css("transform","translatex(-350px)");
			$(".sidebar").attr("opened","true")
		}
	} else if($(window).width()<=767) {
		if(state){
			$('.sidebar').css("transform","translatex(0px)");
			$(".sidebar").attr("opened","false")
		} else{
			$('.sidebar').css("transform","translatex(-350px)");
			$(".sidebar").attr("opened","true")
		}
	}
}

var gifsRedrawn = false;
var redrawGifsTimeout;

function sendMessage(){
	if($('#message').val().trim().length<=0 || $('#message').val()=="####"){
		$('#message').val("");
		return;
	}

	var mymessage = $('#message').val();
	
	var randomID = generateRandomID();
	
	var msg = {
		type: "message",
		message: mymessage,
		target: talking_to,
		randomID: randomID,
	};
	websocket.send(JSON.stringify(msg));
	
	var unsentMessage = {
			type:"usermsg",
			date: new Date(),
			message: escapeHtml(mymessage).trim(),
			username: c_username,
			target: talking_to,
			not_sent: true,
			randomID: randomID,
	}
	
	message(JSON.stringify(unsentMessage),false);
	
	if(pickerOpened){
		closePicker()
	}
	
	$('#message').val("");
	
	// se empieza otra vez a avisar que estoy escribiendo
	last_talked_to="";
}

function howToActivateNotifications(){
	swal({
		html:`<p><b>Clickear</b> en el <b>candado</b> de la URL.</p>
			  <img class="my-3" src="${base_url}resources/img/notifications-help-1.png">
			  
			  <p><b>Permitir las notificaciones.</b></p>
			  <img class="my-3" src="${base_url}resources/img/notifications-help-2.png">
		
		      <p><b>Recargar la página.</b></p>
		
		      <p>Eso es todo!</p>`,
		showCancelButton: true,
		cancelButtonText: "Cerrar",
		showConfirmButton: false
	})
}

function requestNotificationsPermission(){
	if (Notification.permission !== "granted"){
		Notification.requestPermission(function(result) {  
			if (result === 'denied') {  
				$("#notifications-disabled").html(`
					<h6>Las notificaciones de ${Medialum.appName} están desactivadas. Por favor, activalas para un correcto funcionamiento de la aplicación.<br><br>
					<small>Si te son molestas las notificaciones podés silenciar grupos y usuarios haciendo click derecho en ellos o cambiándote el estado a Ocupado.</small></h6>
					<div class='btn btn-warning mt-3' onclick="howToActivateNotifications()">Cómo las activo?</div>
				`).show();
					
				return;  
			} else if (result === 'default') {  
				$("#notifications-disabled").html(`
					<h6>Por favor, activá las notificaciones de ${Medialum.appName} para un correcto funcionamiento de la aplicación.</h6>
					<div class='btn btn-light mt-3' onclick="requestNotificationsPermission()">Activar</div>
				`).show();
				return;  
			}    
			$("#notifications-disabled").hide();
			toastr["success"]("Las notificaciones fueron activadas correctamente.")
		});
	}
}

$(document).ready(function(){
	
	$("body").append(btnMenu);
	$(document).click(function(e){
		 if(!$(e.target).closest('.sidebar').length && !$(e.target).closest('.btn_menu_resp').length) {
			 toggleLeftBarMobile(false);
		 }
	});
	
	$(window).load(function(){		
		electronCall("chat-ready");
		$('.loading-medialum').fadeOut('slow',function(){$(this).remove();});
		
		$.getJSON(base_url+"resources/json/shortcuts.json?"+Medialum.full_version, function(json) {
			emojisShortcuts = json;
		});
		
		$.getJSON(base_url+"resources/json/emoji.json?"+Medialum.full_version, function(json) {
			for(var i=0;i<json.length;i++){
				emojis.push({height:null,nombre:json[i].name,url:base_url+"resources/img/emojis/default/"+json[i].unicode+".png",rotable:false,unicode:json[i].emoji,category:json[i].category});	
			}

			var emojisNames = $.map(emojis, function(value, i) {
				  return {'id':i, 'name':":"+value.nombre+":", 'url':value.url};
			});
	
			$('#message').atwho({
			    at: ":",
			    displayTpl: "<li><img src='${url}' height='40' width='40' style='vertical-align:middle;'/> ${name} </li>",
			    data:emojisNames,
			    insertTpl: "${name}",
			    limit:5,
			    minLen:2
			})
			
			//carga de emojis
			renderEmojis();
			
			$('#message').on("matched.atwho",function(){
				$('#message').atwho('hide');
			});
		});
	});
	
	$(".emoji-picker-btn").mousedown(function(e){
		e.preventDefault();
		togglePicker();
	})
	
	$(".send-btn").mousedown(function(e){
		e.preventDefault();
		sendMessage();
	})
	
	$(".code-btn").mousedown(function(e){
		e.preventDefault();
		if($("#message").is(":focus")){
			insertAtCaret("message", "####");
			setCaretPosition("message",($("#message")[0].selectionStart-2));
		} else {
			insertAtCaret("message", "####");
		}
	})
	
	initializeTools();
	Waves.init();

	$(window).resize(function(){
		closeSelector(".medialum-select[opened=true]");
	});
	
	requestNotificationsPermission();
	
	$("#full_v_nmbr").text(Medialum.appName+" "+Medialum.version);

	Medialum.new_version.features.map( f => {
		$("#news").append(`
			<li class="list-group-item pb-5">
				<h5 class="card-title">${f.icon ? `<img width="50" class="mr-2" src='resources/img/emojis/default/${f.icon}'>`:""}${f.title}</h5>
				<div class="card-text">${f.description}</div>
			</li>
		`)
	})
	
	// crea funcion que filtra text() de un elemento si es exactamente igual el
	// parametro
	// $('p:textEquals("Hello World")');
	$.expr[':'].textEquals = $.expr.createPseudo(function(arg) {
	    return function( elem ) {
	        return $(elem).text().match("^" + arg + "$");
	    };
	});
	
	// checkea si un div tiene para scrollear
	$.fn.hasScrollBar = function() {
    	return this.get(0).scrollHeight > this.get(0).clientHeight;
    }
	
	//checkea si un div esta scrolleado para abajo de todo  mas un offset especial
    $.fn.isScrolledBottom = function() {
    	let seenOffset = 20;
    	return this.get(0).scrollHeight - this.scrollTop() <= this.outerHeight() + seenOffset;
    }

	
	$.fn.isInViewport = function(offset = 0) {
		var elementTop = $(this).offset().top;
		var elementBottom = elementTop + $(this).outerHeight();
		var viewportTop = $(window).scrollTop();
		var viewportBottom = viewportTop + $(window).height();
		return elementBottom > viewportTop + offset && elementTop < viewportBottom - offset;
	};
	
	$.fn.hasAttr = function(name) {  
	   return this.attr(name) !== undefined;
	};

	
	$(window).focus(function(){
		focusInputMessage(false);
		clearTimeout(clavarVistoTimeout);
		clavarVistoTimeout = setTimeout(function(){
			if(talking_to.trim() != ""){
				clavarVisto(talking_to);
			}
		},3000);
		
		if(notification_created){
		   notification.close();
		   notification_created=false;
	   }
	});
	
	$("#message").focus(function(){
		clearSearch();
	})
	
	swal.setDefaults({
		onopen:function(){
			$(window).trigger("blur")
		},
		onclose:function(){
			$(window).trigger("focus")
		}
	})
	
	$(window).on("blur",function(){
		clearTimeout(clavarVistoTimeout);
		resetRecordatorio();
	});
	
	$("#drop").on("dragover", function(event) {
		event.preventDefault();  
		event.stopPropagation();
	});

	$("#drop").on("dragleave", function(event) {
	    event.preventDefault();  
	    event.stopPropagation();
	});

	$("#drop").on("drop", function(event) {
	    event.preventDefault();  
	    event.stopPropagation();

		sendFile(event.originalEvent.dataTransfer.files);
	});
	
	if(typeof(getCookie("version")) === "undefined" && Medialum.new_version.alert){
		// mostrar novedades
		mostrarNovedades();

	} else if(getCookie("version") !== Medialum.appName+" "+Medialum.version && Medialum.new_version.alert){
		// mostrar novedades
		mostrarNovedades();
		medialumNotification("Medialum mejorado!", "Medialum se actualizó a la versión "+Medialum.version, "update");
	}

	updateOptions();
	
	setInterval(function(){updateAllTimes()},45000);
	
	$(document).mouseup(function (e){
		closeSelector(".medialum-select[opened=true]");
	});
	
	toastr.options = {
			  "positionClass": "toast-bottom-right",
	}
	connect();
	
	$(document).keydown(function(e) {
	    if((e.which == 10 || e.which == 13) && $('#message').val()!="" && !e.shiftKey && $('#message').is(":focus")) {   
	    	e.preventDefault();
	    	
	    	sendMessage()
			
	    } else if($('#message').val()=="" && (e.which == 10 || e.which == 13) && !e.shiftKey){
	    	e.preventDefault();
	    } else if(e.which == 38 && e.ctrlKey){
	    	// changeTalkingTo para arriba
	    	e.preventDefault();
	    	$(".user-list .selected").prevAll(":visible:first").click();
	    	$(".user-list .selected").get(0).scrollIntoView(false);
	    } else if(e.which == 40 && e.ctrlKey){
	    	// changeTalkingTo para abajo
	    	e.preventDefault();
	    	$(".user-list .selected").nextAll(":visible:first").click();
	    	$(".user-list .selected").get(0).scrollIntoView(false);
	    } else if(e.which == 66 && e.ctrlKey){
	    	// focusear buscador
	    	$("#search").focus();
	    } else if(e.which == 77 && e.ctrlKey && talking_to != ""){
	    	e.preventDefault();
	    	focusInputMessage(true);
	    } else if($("#message").val()!="" && last_talked_to != talking_to && !talking_to.includes(Medialum.groups_prefix)){
			var data = {
				type: "typing",
				target: talking_to
			};
			
			websocket.send(JSON.stringify(data));

			last_talked_to = talking_to;
			clearLastTalkedTo =setTimeout(function(){last_talked_to = "";},3000);
		}
	});

	var last_talked_to = "";
	
	$(document).click(function(e){
		if($(e.target).closest('.emoji-picker').length === 0 && $(e.target).closest('.emoji-picker-btn').length === 0 && $(e.target).closest('.panel').length === 0 && pickerOpened) {
			closePicker();
		}
	});
	
	$("#message").keydown(function(e){
		if($("#message").val()!=""){
			if(last_talked_to != talking_to){
				var data = {
					type: "typing",
					target: talking_to
				};
				
				websocket.send(JSON.stringify(data));

				last_talked_to = talking_to;
				clearLastTalkedTo =setTimeout(function(){last_talked_to = "";},3000);
			}

			if(!e.altKey && !e.ctrlKey && !e.shiftKey){
				clearTimeout(redrawGifsTimeout);

				if(pickerOpened && $(".cat-selected").attr("category")==="gifs" && gifsRedrawn){
					redrawGifsTimeout = setTimeout(function(){
						gifsRedrawn = true;
						redrawGifs();
					},500)
				}
			}
		} 
	});
	
	document.onpaste = function(event){
		if(!swal.isVisible() && talking_to !== ""){
			var items = (event.clipboardData || event.originalEvent.clipboardData).items;
			for (index in items) {
				var item = items[index];
				if (item.kind === 'file') {
					var blob = item.getAsFile();
					var extension = blob.type.split("/")[1];
					
					var fileOfBlob = new File([blob], 'Sin nombre.'+extension);
					
					sendFile([fileOfBlob]);
				}
			}
		}
	}
	
	if(!isMobile()){
		// var observe;
		// if (window.attachEvent) {
		//     observe = function (element, event, handler) {
		//         element.attachEvent('on'+event, handler);
		//     };
		// }
		// else {
		//     observe = function (element, event, handler) {
		//         element.addEventListener(event, handler, false);
		//     };
		// }
	
	    var inputMessage = document.getElementById('message');
		inputMessage.addEventListener('change',  autosize);
		inputMessage.addEventListener('cut',  autosize);
		inputMessage.addEventListener('paste',  autosize);
		inputMessage.addEventListener('drop',  autosize);
		inputMessage.addEventListener('keydown',  autosize);	
	}
    
	$("#search").keyup(function(ev){
		var valor = $(this).val();
		
		if(valor!=""){
			if(ev.which==40){
				ev.preventDefault();
				if(typeof ($(".search-selection").nextAll(":visible:first").html()) !== "undefined"){
					$(".search-selection").removeClass("search-selection").nextAll(":visible:first").addClass("search-selection");
				}
			} else if(ev.which==38){
				ev.preventDefault();
				if(typeof ($(".search-selection").prevAll(":visible:first").html()) !== "undefined"){
					$(".search-selection").removeClass("search-selection").prevAll(":visible:first").addClass("search-selection");
				}
			} else if(ev.which==27){
				ev.preventDefault();
				clearSearch();
			} else {
				$(".search-selection").removeClass("search-selection");
				$(".user-list").children().each(function(){
					var nombre;
					
					if($(this).find("#tag").text().includes(Medialum.groups_prefix)){
						nombre = groups[$(this).find("#tag").text()].name;
					} else {	
						var username = $(this).find("#tag").text();
						nombre = username+" "+allUsers[username].nombre+" "+getUserFullName(username);
						if(allUsers[username].apodo!=null){
							nombre = nombre+" "+allUsers[username].apodo;
						}
					}
					
					nombre = nombre.toLowerCase();
					nombre = nombre.replace("á","a");
					nombre = nombre.replace("é","e");
					nombre = nombre.replace("í","i");
					nombre = nombre.replace("ó","o");
					nombre = nombre.replace("ú","u");
					
					valor = valor.toLowerCase();
					valor = valor.replace("á","a");
					valor = valor.replace("é","e");
					valor = valor.replace("í","i");
					valor = valor.replace("ó","o");
					valor = valor.replace("ú","u");
					
					if(nombre.indexOf(valor) === -1){
						$(this).addClass("not-in-search");
					} else {
						// muestra los que estan en la busqueda, y el
						// offline-disabled es para ver los usuarios
						// desconectados aunque
						// esten ocultos
						$(this).removeClass("not-in-search").removeClass("offline-disabled");
						
						$(".entidad:visible:first").addClass("search-selection");
					}
				});
			}
		} else {
			$(".search-selection").removeClass("search-selection");
			$(".not-in-search").removeClass("not-in-search");
			checkVerDesconectados()
		} 
	});
	
	$("#search").keydown(function(e){
		if( (e.which == 10 || e.which == 13) && $('#search').val()!="") {  
			if($(".search-selection").length>0){
				$(".search-selection").click();
			} else {
				$(".user-list").find(":visible:first").click();
			}
		}
		
		if(e.which==40){
			e.preventDefault();
		} else if(e.which==38){
			e.preventDefault();
		}
	});
	
	modulesStatus();
	setInterval(modulesStatus,1000*60*60*3);
});

function modulesStatus(){
	$.ajax({
		url:base_url+"api/modules/status",
		success:function(response){
			$("#hours-button .pending-alert").text(response["hours"]["hours_pending"] || "");
			
			$("#medialum-go-button .pending-alert").text(((response["medialum_go"]["not_taken_rewards"]==0)?"":response["medialum_go"]["not_taken_rewards"]))
			
		},
	})
}


function replaceAllShortcuts(str, find, replace) {
	if(str.indexOf(find)!=-1){
		find = "(^|[ ])"+find.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1") + "(?!\\S)";
		return str.replace(new RegExp(find, 'g'), replace);
	} else {
		return str;
	}
}

function replaceAll(str, find, replace) {
	if(str.indexOf(find)!=-1){
		find = find.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
		return str.replace(new RegExp(find, 'g'), replace);
	} else {
		return str;
	}
}

function replaceShortcuts(str){
	for(var i=0;i<emojisShortcuts.length;i++){
		str = replaceAllShortcuts(str,emojisShortcuts[i].shortcut,":"+emojisShortcuts[i].emoji+":");
	}
	
	return str;
}


function incomingMessage(username, msg, target){	
	if(!document.hasFocus() || swal.isVisible()){
		if(!$(".my-state .user-state").hasClass("busy")){
			notifyMe(username, getUserFullName(username), msg, target);
			
			if(!$(".my-state .user-state").hasClass("away")){
				if(target.includes(Medialum.groups_prefix)){
					if(!isMuted(target)){
						incoming_message.play();
					}
				} else if(!isMuted(username)){
					incoming_message.play();
				}
			}
		}
	}
	
	if(target.includes(Medialum.groups_prefix)){
		showNewMessageCircle(target);
		if(document.hasFocus() && !swal.isVisible() && talking_to == target){
			clavarVisto(target);
		}
	} else {
		showNewMessageCircle(username);
		if(document.hasFocus() && !swal.isVisible() && talking_to == username){
			clavarVisto(username);
		}
		
		if($(".message_box#"+username+" .seen-img").length>0){
			$(".message_box#"+username+" .seen-img").remove();
		}
	}
	updateTitle();
}

function showNewMessageCircle(myTarget, notif_number){
	if($(".entidad").find("#tag:textEquals('"+myTarget+"')").parent().parent().find(".new-message-circle").length){
		
		var unread_msg = $(".entidad").find("#tag:textEquals('"+myTarget+"')").parent().parent().find(".new-message-circle").text();
		
		unread_msg = parseInt(unread_msg);
		
		if(typeof(notif_number)!== "undefined"){
			unread_msg+=parseInt(notif_number);
		} else {
			unread_msg++;
		}

		$(".entidad").find("#tag:textEquals('"+myTarget+"')").parent().parent().find(".new-message-circle").text(unread_msg > 99 ? "+99" : unread_msg);
	} else {
		$(".entidad").find("#tag:textEquals('"+myTarget+"')").parent().parent().find(".badges").append(`
			<div class='new-message-circle badge badge-pill badge-danger'>${ notif_number ? notif_number>99 ? "+99" : notif_number : 1}</div>
		`);
	}
	
	if(myTarget == talking_to){
		$("#unread-count").text($(".entidad").find("#tag:textEquals('"+myTarget+"')").parent().parent().find(".new-message-circle").text());
	}
}

var notification_created=false;
var notification;
var notification_timeout;
function notifyMe(username, name, msg, target) {
	if (Notification.permission !== "granted")
		Notification.requestPermission();
	else {
		var notification_img = $(".entidad #tag:textEquals('"+((target.includes(Medialum.groups_prefix))?target:username)+"')").parent().parent().find("img").attr("src");
		  
		if(typeof(notification_img)=="undefined"){
			notification_img = base_url + "resources/img/no-profile.png";
		}

		var nextTarget = username;
		
		if(target.includes(Medialum.groups_prefix)){
			msg = name+": "+msg;
			
			name = groups[target].name;

			nextTarget=target;
		}
		
		if(!isMuted(nextTarget)){
			doNotification(name,notification_img,msg,"newmsg-"+nextTarget,5000,false,nextTarget);
		}
	}
}

function openOptions(){
	const texto = `
			<form id='options-data'>
				<div class="btn btn-primary btn-block btn-md" onclick="editarPerfil();">Editar perfil</div>
				<div class="btn btn-primary btn-block btn-md" onclick="cambiarPass();">Cambiar contraseña</div>
				<div class="form-group row mt-4">
					<label for="sound-select" class="col-sm-6 col-form-label text-left">Sonido de mensaje nuevo</label>
					<div class="col-sm-4">
						<select name='sound_select' class="custom-select custom-select-md" id='sound-select'>
							<option value=0>Ninguno</option>
							${ nuevo_mensaje_snd.map(s => { return `<option ${ sn_mensaje == s.id ? "selected" : "" } value='${s.id}' path='${s.path}'>${s.nombre}</option>` } ) }
						</select>
					</div>
					<div class="col-sm-2">
						<i class='fa fa-volume-up' style='cursor:pointer; font-size:35px' onclick='previewSound();'></i>
					</div>
				</div>
				<div class="form-group row">
					<label for="sound-select" class="col-sm-6 col-form-label text-left">Recordatorio de mensajes sin leer</label>
					<div class="col-sm-6">
						<select name='sound_select' class="custom-select custom-select-md" id='sound-select'>
							<option value="1" ${ recordatorio_notif == 1 ? "selected" : ""}>Cada 10 minutos</option>
							<option value="2" ${ recordatorio_notif == 2 ? "selected" : ""}>Cada 15 minutos</option>
							<option value="3" ${ recordatorio_notif == 3 ? "selected" : ""}>Cada 20 minutos</option> 
						</select>
					</div>
				</div>
				<div class="custom-control custom-checkbox my-3">
					<input type="checkbox" class="custom-control-input" id='ver-desconectados' name='ver_desconectados' ${ ver_desconectados == 1 ? "checked" : ""}>
					<label class="custom-control-label" for="ver-desconectados">Ver desconectados</label>
				</div>
			</form>`;
	swal({
		title:"Ajustes",
		html:texto,
		showCancelButton:true,
		confirmButtonText:"Guardar",
		cancelButtonText:"Cancelar",
	}).then(function(result){
		if(result.value){
			sn_mensaje = $("#sound-select").val();
			ver_desconectados = $("#ver-desconectados").is(':checked') ? 1 : 0;
			recordatorio_notif = $("#recordatorio_notif").val();
			
			$.ajax({
				type:"post",
				url: base_url+"options/save",
				data:$("#options-data").serialize(),
				success:function(){
					updateOptions();
				}
			});
		}
	});
}

function showNoChats(show){
	if(show){
		$(".no-chats").show();
		$(".talking-to").hide();
		$(".all_message_boxes").hide();
		$(".panel").hide();
	} else {
		$(".no-chats").hide();
		$(".talking-to").show();
		$(".all_message_boxes").show();
		$(".panel").show();
	}
}

function showTypingTalkingTo(state){
	if(!state){
		$(".talking-to #info").removeClass("typing");
	} else {
		$(".talking-to #info").addClass("typing");
	}
}

function clearSearch(){
	$(".search-selection").removeClass("search-selection");
	
	$("#search").val("");
	$("#search").blur();
	$("#search").trigger("keyup");
}

function changeTalkingTo(talking_target){
	
	if(typeof(allUsers[talking_target])==="undefined" && typeof(groups[talking_target])==="undefined"){
		swal("Ups!","No se encontró información de este contacto.","error");
		return;
	}
	
	clearSearch();
	
	$(".to-bottom").addClass("hidden");
	
	var target_info = allUsers[talking_target];
	
	if(!talking_target.includes(Medialum.groups_prefix)&&target_info.state!="offline"&&target_info.typing){
		showTypingTalkingTo(true);
	} else {
		showTypingTalkingTo(false);
	}
	
	showNoChats(false);
	
	// destruye el timeout de eliminacion de notificacion
	clearTimeout(clavarVistoTimeout);

	// guarda textarea
	var previousTarget = talking_to;
	var estaEnTemporal = false;
	var temporalIndex = -1;
	for(var i=0;i<temporalMessage.length;i++){
		if(temporalMessage[i].target == previousTarget){
			estaEnTemporal=true;
			temporalIndex = i;
			break;
		}
	}
	
	if(estaEnTemporal){
		temporalMessage[temporalIndex].message = $("#message").val();
	} else {
		temporalMessage.push({target:previousTarget,message:$("#message").val()});
	}
	
	// carga textarea
	var limpiarTextarea = true;
	for(var i=0;i<temporalMessage.length;i++){
		if(temporalMessage[i].target==talking_target){
			$("#message").val(temporalMessage[i].message);
			limpiarTextarea=false;
			break;
		}
	}
	
	autosize();
	
	if(limpiarTextarea){
		$("#message").val("");
	}
	
	// limpia timeout de escribiendo
	clearTimeout(clearLastTalkedTo);
	last_talked_to = "";
	
	$(".talking-to").find("#nombre").attr("onclick","").removeClass("clickable");
	
	$("#salir-grupo").hide();
	
	talking_to = talking_target;
	
	$(".message_box").hide();
	
	if($("#"+talking_target).length){
		$("#"+talking_target).parent().show();
		$("#"+talking_target).show();
	} else {
		crear_message_box(talking_target,true);
	}
	
	$(".talking-to img").attr("onclick",'verInfo("'+talking_target+'");');
	
	if(talking_target.includes(Medialum.groups_prefix)){
		$(".talking-to #nombre").html($(".entidad").find("#tag:textEquals('"+talking_target+"')").parent().find("#nombre").text());
		$(".talking-to #tag").text(talking_target);
		
		$("#salir-grupo").show();
		$("#agregar-persona").show();
		$("#nueva-encuesta").show();
	} else {
		$(".talking-to").find("#nombre").text(getUserFullName(talking_target));
		$(".talking-to").find("#tag").text(talking_target);
		$("#salir-grupo").hide();
		$("#agregar-persona").hide();
		$("#nueva-encuesta").hide();
	}
	
    $("iframe").each((i, e) => {
    	if(!$(e).is(":visible")){
    		$(e).attr("data-src",$(e).attr("src"))
    		$(e).removeAttr("src")
    	} else if($(e).hasAttr("data-src")){
    		$(e).attr("src",$(e).attr("data-src"))
    		$(e).removeAttr("data-src")
    	}
    })
	
	var source_img = $(".entidad").find("#tag:textEquals('"+talking_target+"')").parent().parent().find("img").attr("src");
	$(".talking-to img").attr("src",source_img);

	
	$("#upload").show();
	$("#delete").show();

	$(".selected").removeClass("selected");
	
	$(".entidad").find("#tag:textEquals('"+talking_target+"')").parent().parent().addClass("selected");

	var isLoaded=false;
	for(var i=0;i<historialLoaded.length;i++){
		if(historialLoaded[i].split(",")[0]==talking_target){
			isLoaded=true;
			break;
		}
	}
	
	if(!isLoaded){
		loadHistorial(talking_target);
	}
	
	if($(`.message_box#${talking_target}`).hasScrollBar()){
		scrollToBottom(talking_target,true);
	} else {
		clavarVisto(talking_target);
	}

	focusInputMessage(false);
	
	toggleLeftBarMobile(false);
}

function loadHistorial(target){
	for(var i=0;i<historialLoading.length;i++){
		if(historialLoading[i]==target){
			return;
		}
	}
	
	historialLoading.push(target);
	
	var found = false;
	
	var page = 0;
	
	for(var i=0;i<historialLoaded.length;i++){
		if(historialLoaded[i].split(",")[0]==target){
			if(historialLoaded[i].split(",")[1]=="end"){
				return;
			}
			
			page = Number(historialLoaded[i].split(",")[1]);
			page++;
			
			historialLoaded[i] = target+","+page;
			found=true;
			break;
		}
	}
	
	if(!found){
		historialLoaded.push(target+","+page);
	}
	
	websocket.send(JSON.stringify({type:"load-historial",target:target, from:page}));
}

function crear_message_box(mytarget,visible){
	$("#all_message_boxes").append(`
		<div class="message_box" id="${mytarget}" ${!visible ? "style='display:none'":""}></div>
	`);

	$('#'+mytarget).on("scroll",function(){
        if ( 450 >= $(this).scrollTop() ) {
        	loadHistorial(mytarget);
        }
        
        if($('.message_box#'+mytarget).isScrolledBottom()){
            $(".to-bottom").addClass("hidden")
            if($(".user-list").find(`#tag:textEquals('${mytarget}')`).parent().parent().find(".new-message-circle").length > 0){
    			clavarVisto(mytarget);
    		}
        } else {
        	$(".to-bottom").removeClass("hidden")
        	if(talking_to == mytarget){
        		$("#unread-count").text($(".entidad").find("#tag:textEquals('"+mytarget+"')").parent().parent().find(".new-message-circle").text());
        	}
		}
        
        $(".message_box#"+mytarget+" iframe").each((i, e) => {
        	if(!$(e).isInViewport()){
        		$(e).attr("data-src",$(e).attr("src"))
        		$(e).removeAttr("src")
        	} else if($(e).hasAttr("data-src")){
        		$(e).attr("src",$(e).attr("data-src"))
        		$(e).removeAttr("data-src")
        	}
        })
	});
}

function clearMessages(){
	swal({
		title:"Seguro?",
		text:"Estás seguro que querés borrar los mensajes de esta conversación?",
		type:"warning",
		showCancelButton:true,
		showConfirmButton:true,
		confirmButtonText:"Sí",
		cancelButtonText:"No"
	}).then(function(result){
		if(result.value){
			$('.message_box#'+talking_to).html("");
			
			var data = {
					type:"clear-messages",
					entity:talking_to
			}
			
			websocket.send(JSON.stringify(data));
			
			toastr["success"]("Los mensajes se borraron correctamente.")
		}
	},function(){});
}

var filesSending = {};

function sendFile(file){
	if(file.length === 0 || (typeof file === "undefined" && talking_to !== "")){
		return;
	}
	
	var totalSize = 0;
	
	for(var i=0;i<file.length;i++){
		totalSize+=file[i].size
	}
	
	if(totalSize>=max_upload_size){
	
		totalSize = totalSize/1024/1024
		totalSize = totalSize.toFixed(2);
		
		swal({
			title:"Ups!",
			html:((file.length>1)?"Tus archivos son muy pesados!":"Tu archivo es muy pesado!")+"<br> Estás tratando de enviar <b>"+totalSize+"MB</b> y <b>el máximo es "+(max_upload_size/1024/1024)+" MB.</b> (Culpa de Santi)",
			type:"error",
			});
		return;
	}
	
	var fileFail = function(messageID,text){
		 $(".local_user_name[randomID='"+messageID+"'] circle:nth-child(2)").css("transition","all 1.0s ease");
		 $(".local_user_name[randomID='"+messageID+"'] circle:nth-child(2)").css({"stroke-dashoffset":"564px"})
		 $(".local_user_name[randomID='"+messageID+"'] #sending-file-status").text(text)
		 $(".local_user_name[randomID='"+messageID+"'] i").attr({"onclick":"$(this).parent().parent().parent().remove();",title:"Cerrar"});
		 setTimeout(function(){
			 $(".local_user_name[randomID='"+messageID+"'] circle:nth-child(2)").css({"stroke":"#fff"})
		 },1000)
	};
	
	var alertText = "";
	
	if(file.length>1){
		alertText = "<p>Estás por enviarle los siguientes archivos:</p>"
	
		for(i in file){
			alertText += `<b>${file[i].name}"</b>`
		}
		
		alertText+=`<p>a <b>"${getUserFullName(talking_to)}"</b>. Estás seguro?</p>`
	} else {
		alertText= `<p>Estás por enviarle el archivo <b>"${file[0].name}"</b> a <b>"${getUserFullName(talking_to)}"</b>. Estás seguro?</p>`
	}
	
	swal({
		title:"Estás seguro?",
		html:alertText,
		type:"warning",
		showConfirmButton:true,
		showCancelButton:true,
		cancelButtonText:"Cancelar",
		confirmButtonText:"Subir",
		showLoaderOnConfirm: true,
	}).then(function(result){
		if(result.value){
			var formData = new FormData();
			
			for(var i=0;i<file.length;i++){
				formData.append('file'+i, file[i]);
			}
		
			var randomID = generateRandomID();
	
			var unsentMessage = {
					type:"file",
					date: new Date(),
					message: null,
					username: c_username,
					target: talking_to,
					not_sent: true,
					randomID: randomID,
			}
			
			message(JSON.stringify(unsentMessage),false);
			
			var sendingTo = talking_to
			
			var uploadingAjax = $.ajax({
				type:"post",
				url: base_url+"send_file",
				processData: false, 
				contentType: false,
				data:formData,
				xhr: function() {
	                var myXhr = $.ajaxSettings.xhr();
	                if(myXhr.upload){
	                    myXhr.upload.addEventListener('progress',function(e){fileProgress(e,randomID)}, false);
	                }
	                return myXhr;
				},
				success:function(response){
					response = JSON.parse(response)
					if(response.status!=="error"){
						$(".local_user_name[randomID='"+randomID+"'] circle:nth-child(2)").css("stroke","#3399ff");
						for(var i=0;i<response.files.length;i++){
							var msg = {
									type: "file",
									file: response.files[i],
									target: sendingTo,
									randomID: randomID
								};
							websocket.send(JSON.stringify(msg));
						}
					} else {
						fileFail(randomID,"Ocurrió un error.");
					}
					
					delete filesSending[randomID];
				},
				error:function(result){
					if(result.statusText==="abort"){
						// subida abortada
						fileFail(randomID,"Envío cancelado.");
					} else {
						fileFail(randomID,"Ocurrió un error.");
					}
					
					delete filesSending[randomID];
				}
			});
			
			filesSending[randomID] = uploadingAjax;
		}
	});
}

function fileProgress(e,randomID){
	if(e.lengthComputable){
        var max = e.total;
        var current = e.loaded;

        var percentage = (current * 100)/max;
        
        var pxCalc = (112 * (1 - percentage / 100)) + 442;
        
        $(".local_user_name[randomID='"+randomID+"'] circle:nth-child(2)").css("stroke-dashoffset",pxCalc+"px")
        
        if(percentage >= 100)
        {
        	 $(".local_user_name[randomID='"+randomID+"'] circle:nth-child(2)").css("stroke","rgb(51, 153, 255)");
        }
    }  
}

function scrollToBottom(target,force){
	if(force || !$('.message_box#'+target).isScrolledBottom()){
		$('.message_box#'+target).scrollTop($('.message_box:visible')[0].scrollHeight);
		$('.message_box#'+target).trigger("scroll")
	}
}

function scrollToTopUserList(){
	$('.user-list').scrollTop(0);
}

function previewSound(){
	if($("#sound-select").val()!=0){
		var soundName = $("#sound-select option:selected").attr("path");
		var testAudio = new Audio("resources/sounds/"+soundName);
		testAudio.play();
	}
}

function updateOptions(){
	if(sn_mensaje!=0){
		
		var update_audio_path;
		
		for(var i=0;i<nuevo_mensaje_snd.length;i++){
			if(nuevo_mensaje_snd[i].id==sn_mensaje){
				update_audio_path = nuevo_mensaje_snd[i].path;
			}
		}
		
		incoming_message = new Audio('resources/sounds/'+update_audio_path);
	} else {
		incoming_message = new Audio();
	}
	
	checkVerDesconectados();
}

function checkVerDesconectados(){
	if(ver_desconectados==0){
		$(".entidad").each(function(){
			if($(this).find(".user-state").hasClass("offline")&&$(this).find(".new-message-circle").length<=0){
				$(this).addClass("offline-disabled");
			} else {
				$(this).removeClass("offline-disabled");
			}
		});
	} else {
		$(".offline-disabled").removeClass("offline-disabled");
	}
}

function changeState(state,isAutomatic){
	if(isAutomatic && ($(".my-state .user-state").hasClass("busy") || ($(".my-state .user-state").hasClass("away") && state === "online" && getCookie('state') !== "online"))){
		return;
	}
	
	var data = {
			type: "state",
			state:state
			};
	// convert and send data to server
	websocket.send(JSON.stringify(data));

	if(!isAutomatic){
		document.cookie = "state="+state+"; expires=Fri, 31 Dec 9999 23:59:59 GMT";
	}
}

function changePicture(){
	swal({
		title:getUserFullName(c_username),
		html:`
			<label>
				<img class='change-picture rounded-circle mb-3' title='Cambiar imagen' width='200' src='${ $(".my-userpic").find("img").attr("src") }'>
				<input type='file' id='pic-input' name='pic' onchange='imageSelected("${c_username}");' accept='image/*'>
			</label>
				${ $(".my-userpic").find("img").attr("src") != base_url+"resources/img/no-profile.png" ?
				'<div class="btn btn-primary btn-block btn-md" onclick="deletePicture();">Eliminar imagen</div>' : ""}
				<div class="btn btn-primary btn-block btn-md" onclick="verInfo('${c_username}');">Ver mi perfil</div>`,
		showCancelButton:true,
		showConfirmButton:false,
		cancelButtonText:"Cerrar",
	});
}

var uploadCrop;

function imageSelected(entity){
	if ($("#pic-input")[0].files && $("#pic-input")[0].files[0]) {
		var FR= new FileReader();
	    FR.onload = function(e) {
	    	uploadCrop = $('#img-crop-preview').croppie({
				viewport: {
					width: 200,
					height: 200,
					type: 'circle',
					circle: false,
				},
				boundary: { width: 400, height: 400 },
			});
		    uploadCrop.croppie('bind', {
				url: e.target.result
			});
	    };   
	    FR.readAsDataURL($("#pic-input")[0].files[0]);
	}
	
	swal({
			title:"Cambiar imagen",
			html:"<div id='img-crop-preview'></div>",
			showCancelButton:true,
			showConfirmButton:true,
			confirmButtonText:"Listo",
			allowOutsideClick: false,
			cancelButtonText:"Cerrar",
			 animation: false,
			showLoaderOnConfirm: true,
			preConfirm: function() {
			   return new Promise(function(resolve,reject) {
				   uploadCrop.croppie('result',{circle: false, size: "original", type:"rawcanvas"}).then(function (resp) {
					   
					   resample_single(resp, 200, 200, true);
					   var canvasBase64 = resp.toDataURL();
					   
						$.ajax({
							type:"post",
							url: base_url+"save_pic",
							data:{"pic":canvasBase64.substring(22),"entity":entity},
							success:function(){
								resolve();
								swal("Éxito","La imagen se guardó correctamente.","success");
								var data = {
										type: "updatepic",
								};
								
								if(entity.includes(Medialum.groups_prefix)){
									data["group_id"] = entity
								}
								websocket.send(JSON.stringify(data));
							},
							error:function(){
								reject("Ocurrió un error. Intentá de nuevo más tarde.");
							}
						});
					},function(){});
			   }).catch(error => {
			        swal.showValidationError(error)
			   });
			}
		});
	
	uploadCrop="";
}

function verInfo(entity_id){
	if(entity_id.includes(Medialum.groups_prefix)){
		// muestra info de un grupo
		var groupName = groups[entity_id].name;
		
		var html =`
				<p>${groups[entity_id].users.length} Integrantes</p>
				<label>
					<img class='my-3 rounded-circle change-picture' width='200' src='${getEntityPic(entity_id)}' onerror='$(this).attr("src","${base_url}resources/img/no-group.png")'>
					<input type='file' id='pic-input' name='pic' onchange='imageSelected("${entity_id}");' accept='image/*'>
				</label>
				
				<div style='height:200px; margin:auto; width:250px; overflow-x:hidden;overflow-y:auto;'>`;
		
		var generateHtml = function (username, state){
			var html="<div style='text-align:left; border-bottom:1px solid #e0e0e0; padding: 10px;'>" +
						"<span style='position:relative'><div style='bottom: -10px; right: -2px;' class='user-state "+state+"'></div>" +
						"<img style='display: inline-block; vertical-align: middle; border-radius: 100%;' src='"+getEntityPic(username)+"' onerror=\"$(this).attr('src','resources/img/no-profile.png')\" width=40></span>" +	
						"<div style='display: inline-block; vertical-align: middle; margin-left: 10px;'>"+getUserFullName(username)+"</div>" +
						"<div id='tag' style='display:none;'>"+username+"</div>"+
					 "</div>";
			return html;
		}
		
		for(var i=0;i<groups[entity_id].users.length;i++){
			html+=generateHtml(groups[entity_id].users[i], allUsers[groups[entity_id].users[i]].state);
		}
		
		html+="</div>";
		
		swal({
			title:groupName,
			html:html,
			confirmButtonText:"Cambiar nombre",
			cancelButtonText:"Cerrar",
			showConfirmButton:true,
			showCancelButton:true,
		}).then(function(result){
			if(result.value){
				changeGroupName(entity_id,false,groupName);
			}
		});
	} else {
		// muestra info de un usuario
		
		var userFound=allUsers[entity_id];
		
		const text = `
				<img class='mb-3 rounded-circle' width='200' src='${getEntityPic(entity_id)}' onerror='$(this).attr("src","${base_url}resources/img/no-profile.png")'>
				${userFound.email ? 
					`<div class="row my-2">
						<div class="col-sm-6 text-right">
							<div>E-mail</div>
						</div>
						<div class="col-sm-6 text-left" title="${userFound.email}">
							<a href='mailto:${userFound.email}'>${userFound.email}</a>
						</div>
					</div>`: ""
				}
				${userFound.celular ? 
					`<div class="row my-2">
						<div class="col-sm-6 text-right">
							<div>Celular</div>
						</div>
						<div class="col-sm-6 text-left" title="${userFound.celular}">
							${userFound.celular}
						</div>
					</div>`: ""
				}
				${userFound.nacimiento ? 
					`<div class="row my-2">
						<div class="col-sm-6 text-right">
							<div>Cumpleaños</div>
						</div>
						<div class="col-sm-6 text-left" title="${userFound.nacimiento}">
							${userFound.nacimiento}
						</div>
					</div>`: ""
				}
				${userFound.apodo ? 
					`<div class="row my-2">
						<div class="col-sm-6 text-right">
							<div>También conocido como</div>
						</div>
						<div class="col-sm-6 text-left" title="${userFound.apodo}">
							${userFound.apodo}
						</div>
					</div>`: ""
				}`;
		
		swal({
			title:allUsers[entity_id].nombre+" "+allUsers[entity_id].apellido,
			html:text,
			showConfirmButton:true,
			showCancelButton:false,
			confirmButtonText:"Cerrar"
		});
	}
}

function updateMyUserState(){
	$(".my-state").find(".user-state").attr('class', 'user-state '+allUsers[c_username].state)
}

function deletePicture(){
	swal({
		title:"Estás seguro?",
		type:"warning",
		text:"Si borrás la imagen no vas a poder recuperarla.",
		showCancelButton:true,
		confirmButtonText:"Sí",
		cancelButtonText:"No",
		showLoaderOnConfirm: true
	}).then(function(result){
		if(result.value){
			$.ajax({
				type:"post",
				url: base_url+"remove_pic",
				success:function(){
					swal("Éxito","La imagen se eliminó correctamente.","success");
					var data = {
							type: "updatepic"
					};
					// convert and send data to server
					websocket.send(JSON.stringify(data));
				},
				error:function(){
					swal("Error","Ocurrió un error. Intentá de nuevo más tarde.","error");
				}
			});
		}
	});
}

function editarPerfil(){
	
	var myUser = allUsers[c_username];
	
	const text = 
			`
			<form>
			
			<div class="form-group row">
				<label for="nick" class="col-sm-4 col-form-label">Nombre corto</label>
				<div class="col-sm-8">
					<input type="text" class="form-control" id="nick" value="${ myUser.nick || "" }" onkeydown='return lettersOnly(event)' onchange='$(this).val($(this).val().toLowerCase());' style='text-transform: capitalize;' maxlength='10'>
					<small class="text-muted" id="your-new-name"></small>
				</div>
			</div>
			<div class="form-group row">
				<label for="email" class="col-sm-4 col-form-label">E-mail</label>
				<div class="col-sm-8">
					<input type="text" class="form-control" id="email" value="${ myUser.email || "" }">
				</div>
			</div>
			<div class="form-group row">
				<label for="celular" class="col-sm-4 col-form-label">Celular</label>
				<div class="col-sm-8">
					<input type="text" class="form-control" id="celular" value="${ myUser.celular || "" }" pattern='([0-9]|[0-9]|[0-9]|[0-9]|[0-9]|[0-9]|[0-9]|[0-9]|[0-9]|[0-9])'>
				</div>
			</div>
			<div class="form-group row">
				<label for="apodo" class="col-sm-4 col-form-label">Apodos</label>
				<div class="col-sm-8">
					<input type="text" class="form-control" id="apodo" maxlength='40' value="${ myUser.apodo || "" }">
					<small class="text-muted">
						Podés poner más de uno separado por espacios. Sirve para que te encuentren con un nombre alterno en el buscador.
					</small>
				</div>
			</div>
			
			</form>`;

	swal({
		title:"Editar perfil",
		html:text,
		showCancelButton:true,
		confirmButtonText:"Guardar",
		cancelButtonText:"Cancelar",
		showLoaderOnConfirm:true,
		preConfirm: function() {
		    return new Promise(function(resolve,reject) {
				var email = $("#email").val();
				var celular = $("#celular").val();
				var apodo = $("#apodo").val();
				var nick = $("#nick").val();
				
				$.ajax({
					type:"post",
					url: base_url+"save_profile",
					data:{"email":email,
						  "celular":celular,
						  "apodo":apodo,
						  "nick":nick},
					success:function(response){
						response = JSON.parse(response);
						if(response.status === "success"){
							var data = {
									type: "updateuser",
									username: c_username,
							};
							
							websocket.send(JSON.stringify(data));
							resolve();
						} else if(response.status=="email in use"){
							reject("Este E-mail ya está en uso.");
						} else if(response.status=="invalid email"){
							reject("El E-mail es inválido.");
						} else {
							reject("Ocurrió un error. Intentá de nuevo más tarde.");
						}
					},
					error:function(){
						reject("Ocurrió un error. Intentá de nuevo más tarde.");
					}
				});
		    }).catch(error => {
		        swal.showValidationError(error)
		    });
		}
	}).then(function(result){
		if(result.value){
			swal("Éxito","Los datos se guardaron exitosamente.","success");
		}
	});

	$("#nick").keyup(() => {
		if($("#nick").val().trim() != ""){
			$("#your-new-name").text(`Los demás te verán como ${$("#nick").val().charAt(0).toUpperCase() + $("#nick").val().slice(1) } ${allUsers[c_username].apellido}.`)
		} else {
			$("#your-new-name").text("")
		}
	})
	
	$("#nick").trigger("keyup")

}

function cambiarPass(){
	
	const text = `
			<div class="form-group row">
				<label for="oldPassword" class="col-sm-6 col-form-label">Contraseña vieja</label>
				<div class="col-sm-6">
					<input type="password" class="form-control" id="oldPassword">
				</div>
			</div>
			<div class="form-group row">
				<label for="newPassword" class="col-sm-6 col-form-label">Nueva contraseña</label>
				<div class="col-sm-6">
					<input type="password" class="form-control" id="newPassword">
				</div>
			</div>
			<div class="form-group row">
				<label for="confirmPassword" class="col-sm-6 col-form-label">Repetir nueva contraseña</label>
				<div class="col-sm-6">
					<input type="password" class="form-control" id="confirmPassword">
				</div>
			</div>`;

	swal({
		title:"Cambiar contraseña",
		html:text,
		showCancelButton:true,
		confirmButtonText:"Guardar",
		cancelButtonText:"Cancelar",
		showLoaderOnConfirm:true,
		preConfirm: function() {
		    return new Promise(function(resolve) {
				var limpiarInputs = function(){
					$("#oldPassword").val("");
					$("#newPassword").val("");
					$("#confirmPassword").val("");
				}
				
				if($("#oldPassword").val()==""){
					limpiarInputs();
					throw new Error("La contraseña vieja está vacía.");  
				}
				
				if($("#newPassword").val()==""){
					limpiarInputs();
					throw new Error("La contraseña nueva está vacía.");    
				}
				
				if($("#newPassword").val()!=$("#confirmPassword").val()){
					limpiarInputs();
					throw new Error("Las contraseñas nuevas no coinciden.");    
				}
				
				if($("#oldPassword").val()==$("#newPassword").val()){
					limpiarInputs();
					throw new Error("La contraseña vieja es igual a la nueva.");    
				}
				resolve();
		    }).catch(error => {
		        swal.showValidationError(error)
		    });
		  },
	}).then(function(result){
		if(result.value){
			$.ajax({
				type:"post",
				url: base_url+"change_pass",
				data:{"old":$("#oldPassword").val(), "new":$("#newPassword").val()},
				success:function(response){
					if(response=="incorrect password"){
						swal("Error","La contraseña vieja ingresada es incorrecta.","error");
					} else if(response.split(",")[0]=="ok"){
						swal("Éxito","La contraseña se guardó exitosamente.","success");
						c_password=response.split(",")[1];
					} else {
						swal("Error","Ocurrió un error. Intentá de nuevo más tarde.","error");
					}
				},
				error:function(){
					swal("Error","Ocurrió un error. Intentá de nuevo más tarde.","error");
				}
			});
		}
	});

}

function verImagen(element){
	var source = $(element).find("img").attr("src");

	$("<img src='"+source+"'>").load(function(){
		pic_real_width = this.width;
	    pic_real_height = this.height;
		
		swal({
			html:"<img src='"+source+"' id='loaded-image' style='max-height:100%; max-width:100%; margin:auto;'><br><span id='info-zoom'></span>",
			showConfirmButton:false,
			showCancelButton:false,
			onBeforeOpen: function(swalModal){$(swalModal).parent().addClass("hidden-overflow")},
			customClass:"invisible-modal",
		});

//		var fixedWidth = $(window).width() / 2
//
//		if(pic_real_width >= $(window).width()){
//			fixedWidth = $(window).width()/((pic_real_width/$(window).width())+0.25)
//		}
//		
//		if(pic_real_height >= $(window).height()){
//			fixedWidth = $(window).height()/((pic_real_height/$(window).height())+0.25)
//		}
//		
//		if(pic_real_height >= $(window).height() && pic_real_width >= $(window).width()){
//			//fixedWidth = ($(window).width()-$(window).height()) * 1.25
//		} else if(pic_real_height < $(window).height() && pic_real_width < $(window).width() ){
//			fixedWidth = pic_real_width
//		}
//		
		$(".swal2-modal").css("width","75%")
		
		$(".swal2-content, #swal2-content").css("height","100%")
		$(".swal2-header").hide();
		
		$("#swal2-content").click((e)=>{
		     if(e.target !== e.currentTarget) return;

		     if($(".zoomImg").length == 0 || $(".zoomImg").css("opacity") == "0"){
		    	 swal.close();
		     }
		})
		
		if(pic_real_height >= $(window).height() || pic_real_width >= $(window).width()){
			$('#loaded-image')
		    .wrap('<span style="display: inline-block; height:100%" id="wrapper-img"></span>')
		    .css('display', 'block')
		    .parent()
		    .zoom({on:'click', callback: function(){
		    		$("#wrapper-img").css({
		    			cursor: "zoom-in",
		    		})
		    		$(".swal2-popup.swal2-modal.invisible-modal.swal2-show").css("height", "100%")
		    		$(".zoomImg").css("pointer-events","none")
		    		$(".swal2-container.swal2-fade.swal2-shown").css("overflow","hidden !important")
		    	},
		    	onZoomIn:function(){
		    		$("#wrapper-img").css("cursor","zoom-out")
		    	},
		    	onZoomOut:function(){
		    		$("#wrapper-img").css("cursor","zoom-in")
		    		$(".zoomImg").css("pointer-events","none")
		    	}
		    });
		}
		
	})
}

function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
}

function mostrarNovedades(){
	swal({
		title:"Llegó "+Medialum.appName+" "+Medialum.version+"!",
		type:"success",
		html:Medialum.new_version.summary,
		showCancelButton:false,
		showConfirmButton:true,
		confirmButtonText:"OK"
	}).then(function(result){
		if(result.value){
			document.cookie = "version="+Medialum.appName+" "+Medialum.version+"; expires=Fri, 31 Dec 9999 23:59:59 GMT";
		}
	});
}

// cambiador de estado automatico por idle - Solo para cliente web
var stateAutoChange = false;

if(!isElectron()){
	var segundosStateChange = 3600*1.5; // 1.5 horas
	$(document).idle({
		  onIdle: function(){
			if(!$(".my-state .user-state").hasClass("busy") && !$(".my-state .user-state").hasClass("away")){
				stateAutoChange=true;
		    	changeState('away',true);
			}
		  },
		  onActive: function(){
			if(stateAutoChange){
				changeState('online',true);
				stateAutoChange=false;
			}
		  },
		  idle: segundosStateChange*1000
	});
}

function createDateChange(usermsgbox,date,isHistorial){
	var html = "<div class='message_block'>" +
					"<div class=\"date_message\" date='"+date+"'>" +
						"<span class=\"user_message\">" +
							date.getDate()+" DE "+monthNames[date.getMonth()].toUpperCase()+
						"</span>" +
					"</div>" +
				"</div>";
	
	if($(".message_box#"+usermsgbox+" .date_message:first").length<=0){
		$('.message_box#'+usermsgbox).append(html);
	} else {
		if(!isHistorial){
			$(".message_box#"+usermsgbox).append(html);
		} else {
			$(html).insertBefore($(".message_box#"+usermsgbox+" .date_message:first").parent());
		}
	}
}

function addPerson(newGroup){
	var htmlOpen = "<div style='height:400px; overflow-x:hidden;overflow-y:auto; width:260px; margin:auto;' id='usersToAdd'>";
	
	var generateHtml = function (username, state){
		var nameOfUser = getUserFullName(username);
		var html="<div title='"+nameOfUser+"' style='text-align:left; border-bottom:1px solid #e0e0e0; padding: 10px; cursor:pointer; transition: all 0.3s ease;' onclick='selectToAdd(this)'>" +
					"<span style='position:relative'><div style='bottom: -10px; right: -2px;' class='user-state "+state+"'></div>" +
					"<img style='display: inline-block; vertical-align: middle; border-radius: 100%;' src='"+getEntityPic(username)+"' onerror=\"$(this).attr('src','resources/img/no-profile.png')\" width=40></span>" +
					"<div style='display: inline-block; vertical-align: middle; margin-left: 10px; width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'>"+nameOfUser+"</div>" +
					"<div id='tag' style='display:none;'>"+username+"</div>"+
				 "</div>";
		return html;
	}
	
	var htmlClose = "</div>";
	
	var html = htmlOpen;
	
	if(!newGroup){
		var group;
		for(i in groups){
			if(i==talking_to){
				group = groups[i];
				break;
			}
		}
		
		var hayGente=false;
		
		for(i in allUsers){
			var agregar=true;
			for(var j=0;j<group.users.length;j++){
				if(i==group.users[j]){
					agregar=false;
				}
			}
			if(agregar){
				html+=generateHtml(i,allUsers[i].state);
				hayGente=true;
			}
		}
		html += htmlClose;
		
		if(!hayGente){
			swal("Ups!","No hay gente para agregar.","warning");
			return;
		}
		
	} else {		
		if(Object.keys(allUsers).length<=2){
			swal("Ups!","No hay gente para agregar.","warning");
			return;
		}
		
		for(i in allUsers){
			if(i!==c_username){
				html+=generateHtml(allUsers[i].username,allUsers[i].state);
			}
		}

		html += htmlClose;
	}
	
	swal({
		title:((newGroup)?"Crear grupo":"Agregar personas"),
		html:html,
		showConfirmButton:true,
		showCancelButton:true,
		cancelButtonText:"Cancelar",
		confirmButtonText:((newGroup)?"Crear":"Agregar"),
		preConfirm: function() {
		    return new Promise(function(resolve) {
		    	if($(".contact-selected").length<=0){
		    		throw new Error("Tenés que seleccionar por lo menos 1 contacto.");
		    	} else {
		    		resolve();
		    	}
		    }).catch(error => {
		        swal.showValidationError(error)
		    });
		},
	}).then(function(result){
		if(result.value){
			var usersToAdd=[];
			
			$(".contact-selected").each(function(){
				usersToAdd.push($(this).find("#tag").text());
			});
			
			if(talking_to.includes(Medialum.groups_prefix) && !newGroup){
				// agrega gente al grupo
				var data = {
						type: "add-to-group",
						users: usersToAdd,
						id:talking_to
					};
				
				websocket.send(JSON.stringify(data));
				swal.close();
			} else {
				// crea grupo
				var data = {
						type: "create-group",
						users: usersToAdd
					};
				
				websocket.send(JSON.stringify(data));
			}
		}	
	});

	$(".confirm").hide();
}

function selectToAdd(element){
	if(!$(element).hasClass("contact-selected")){
		$(element).addClass("contact-selected");
	} else {
		$(element).removeClass("contact-selected");
	}
	
	if($(".contact-selected").length>0){
		$(".confirm").show();
	} else {
		$(".confirm").hide();
	}
}

function getEntityPic(entity){
	var src = null;
	
	if(entity===c_username){
		src = $("#my-userpic").attr('src');
	} else {
		src = $(".user-list").find("#tag:textEquals('"+entity+"')").parent().parent().find("img").attr('src');
	}
	
	if(src==null){
		if(entity.includes(Medialum.groups_prefix)){
			return "resources/img/groups/"+entity+"/image.jpg?"+new Date().getTime();
		} else {
			return "resources/img/usuarios/"+entity+"/image.jpg?"+new Date().getTime();
		}
	} else {
		return src;
	}
}

function getUserFullName(target){
	if(target.includes(Medialum.groups_prefix)){
		return groups[target].name;
	}
	
	if(allUsers[target].nick!=="" && allUsers[target].nick != null){
		return allUsers[target].nick + " " + allUsers[target].apellido
	} else {
		return allUsers[target].nombre + " " + allUsers[target].apellido
	}
}

function exitGroup(groupId){
	swal({
		title:"Seguro?",
		text:"Estás seguro que querés salir del grupo?",
		type:"warning",
		confirmButtonText:"Sí",
		cancelButtonText:"No",
		showCancelButton:true,
		showConfirmButton:true,
	}).then(function(result){
		if(result.value){
			var data = {
					type: "exit-group",
					id: groupId
				};
				
			websocket.send(JSON.stringify(data));
		}
	});
}

function changeGroupName(groupId,justCreated,name){
	var html = ((justCreated)?"Querés ponerle un nombre?":"Querés cambiarle el nombre al grupo?")+" <br><br> <input style='margin:auto;' class='inptext-swal' type='text' placeholder='Nombre del grupo...' length='22' id='group-name'><br>";
	swal({
		title:((justCreated)?"Grupo creado!":"Cambiar el nombre"),
		type:((justCreated)?"success":"info"),
		html:html,
		showConfirmButton:true,
		showCancelButton:true,
		cancelButtonText:((justCreated)?"Ahora no":"No"),
		confirmButtonText:((justCreated)?"Listo":"Guardar"),
		preConfirm: function() {
		    return new Promise(function(resolve) {
		    	if($("#group-name").val().length>22){
		    		throw new Error("El nombre supera el límite de caracteres (Máximo 22).");
		    	} else {
		    		if($("#group-name").val()!=""){
						var data = {
								type:"change-group-name",
								name:$("#group-name").val(),
								id:groupId
						}
						
						websocket.send(JSON.stringify(data));
					}
		    		
		    		resolve();
		    	}
		    }).catch(error => {
		        swal.showValidationError(error)
		    });
		},
	});
	
	$("#group-name").show();
	if(name!=null){
		$("#group-name").val(name);
	}
}

function updateTitle(){
	var new_msg_counter = 0;
	
	// sumo todas las notificaciones
	$(".new-message-circle").each(function(){
		new_msg_counter++;
	})
	
	if(new_msg_counter>0){
		if($("#window_title").text()!=="("+new_msg_counter+") Medialum"){
			$("#window_title").text("("+new_msg_counter+") Medialum");
		}
	} else {
		if($("#window_title").text()!=="Medialum"){
			$("#window_title").text("Medialum");
		}
	}
}

function help(){
	const texto = `
			<div class='btn btn-primary btn-block btn-md' onclick='verShortcuts();'>Ver Shortcuts y Sintaxis</div>
			<div class='btn btn-primary btn-block btn-md' onclick='verNovedades();'>Ver página de inicio</div>
			<div class='btn btn-primary btn-block btn-md' onclick='bugReport();'>Reportar un error</div>
			<div class='btn btn-primary btn-block btn-md' onclick='doPing();'>Ping a ${Medialum.appName}</div>
			<div class='btn btn-primary btn-block btn-md' onclick='verInformacion();'>Acerca de ${Medialum.appName}</div>`
	swal({
		title:"Información",
		type:"info",
		html:texto,
		showCancelButton:false,
		confirmButtonText:"Cerrar",
	});
}

function verShortcuts(){
	const html = 
	`<table class="table">
		<thead>
			<tr>
				<th>Utilización</th>
				<th>Descripción</th>
			</tr>	
		</thead>
		<tbody>
			${shortcuts.map( s => {
				return `<tr><td><b>${s.shortcut}</b></td><td>${s.description}.</td></tr>`
			}).join("")}	
		</tbody>
	</table>`;
	
	swal({
		title:"Lista de Shortcuts y Sintaxis",
		html:html,
		confirmButtonText:"Cerrar",
		showConfirmButton:true,
		showCancelButton:false,
		width:"800px",
	});
}

function doPing(){
	websocket.send(JSON.stringify({type:"ping",when:new Date().getTime()}))
}

function openTools(){
	$("#tool-select").empty();
	$(".every-tool .tool").each(function(){
		if($(this).css("display")!="none"){
			var onclickFunction = $(this).attr("onclick");
			$("#tool-select").append('<label style="display: initial;"><div class="tool-select-btn waves-effect waves-classic waves-block waves-light" '+((typeof(onclickFunction)==="undefined")?"":'onclick="'+onclickFunction+'"')+'>'+$(this).html()+$(this).attr("title")+"</div></label>");
		}
	});
		
	toggleSelector("#tool-select", ".talking-to-tools","top left");
}

var recordatorio;

function resetRecordatorio(){
	clearInterval(recordatorio);
	
	var timeRecordatorio = 900000; /* 15 minutos */
	
	switch(recordatorio_notif){
	case 1:
		timeRecordatorio = 600000; /* 10 minutos */
		break;
	case 2:
		timeRecordatorio = 900000; /* 15 minutos */
		break;
	case 3:
		timeRecordatorio = 1200000; /* 20 minutos */
		break;
	}
	
	recordatorio = setInterval(function(){showRecordatorio();},timeRecordatorio);
}

function showRecordatorio(){
	var new_msg_counter = 0;
	
	// sumo todas las notificaciones
	$(".new-message-circle").each(function(){
		if($(this).parent().parent().is(":visible")){
			new_msg_counter += parseInt($(this).text());
		}
	});
	
	if(new_msg_counter>0){
		var texto_notif = "";
		
		if(new_msg_counter>1){
			texto_notif = "Tenés "+new_msg_counter+" mensajes sin leer.";
		} else {
			texto_notif = "Tenés un mensaje sin leer.";
		}
		
		medialumNotification(Medialum.appName, texto_notif, "recordatorio");
	}
}

function medialumNotification(titulo, texto, tag){
	if(!document.hasFocus() || swal.isVisible()){
		if (Notification.permission !== "granted")
			Notification.requestPermission();
		else {
			doNotification(titulo,base_url+"resources/img/logo_notificacion.png",texto,tag,5000,true);
		}
	}
}

function loadImg(imgData, imgID){	
	var maxheight = 250;
	var newWidth = 'auto;'
		
	if(imgData.data){
		if(imgData.data[1] >= maxheight && imgData.data[1] >= imgData.data[0]){
			newWidth = (imgData.data[0]*maxheight)/imgData.data[1]+"px;";
		}
	}

	$("#"+imgID).html("<div style='max-height:"+maxheight+"px; width:"+newWidth+"; position: relative;'><div style='display:inline-block; width:"+( imgData.data ? imgData.data[0]+"px" : "auto")+"; height:"+( imgData.data ? imgData.data[1]+"px" : "auto")+";'></div></div><div class='center-spinner'><svg class='spinner-container' width='65px' height='65px' viewBox='0 0 52 52'><circle class='path' cx='26px' cy='26px' r='20px' fill='none' stroke-width='4px'></circle></svg></div>");
	
	$("<img src='"+imgData.url+"'>").load(function(){
		
		$("#"+imgID).removeClass("img-load-error");
		$("#"+imgID).find("svg").remove();
		$("#"+imgID).unbind("click")
		$("#"+imgID).attr("onclick","verImagen(this);");
		
		$("#"+imgID).html("<img style='max-height:"+maxheight+"px; width:"+newWidth+"' src='"+imgData.url+"'>")
		
		
	}).error(function(){
		$("#"+imgID).addClass("img-load-error");
		$("#"+imgID).unbind("click")
		$("#"+imgID).click(() => {loadImg(imgData, imgID) } );
		$("#"+imgID+" .center-spinner").html("<div name='icon-error' ><i class='fas fa-sync' /></div>");
	});
}

function deleteMessageByDate(msgDate, target, offset){
	$($(".message_box#"+target).find(".time-div[completetime='"+msgDate+"']").get(offset)).parent().parent().remove();
	
	var myDate = new Date(msgDate);
	
	// formato YYYY-MM-DD HH:mm:SS
	myDate = myDate.getFullYear()+"-"
    + ('0' + (myDate.getMonth()+1)).slice(-2) + '-'
	+ ('0' + myDate.getDate()).slice(-2) + ' '
    + ('0' + myDate.getHours()).slice(-2)+":"
    + ('0' + myDate.getMinutes()).slice(-2)+":"
    + ('0' + myDate.getSeconds()).slice(-2);
	
	var data = {
			type:"clear-single-message",
			entity:target,
			date:myDate,
			offset:offset
	}
	
	websocket.send(JSON.stringify(data));
	
}

function validURL(str) {
	var regex = new RegExp("^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$")
	return regex.test(str);
}

var clipboardjs;

function messageTools(element){
	if(clipboardjs){
		clipboardjs.destroy();
	}
	
	toggleSelector("#msg-select",element);
	var offset=0;
	
	$('.message_box:visible .time-div[completetime="'+$(element).attr("completetime")+'"]').each(function() {
		
		if($(element).is($(this))){
			return false; // break
		} else {
			offset++;
		}
	});

	$("#delete-single-msg").attr("onclick","deleteMessageByDate('"+$(element).attr("completetime")+"','"+talking_to+"',"+offset+");");
	
	clipboardjs = new Clipboard("#select-single-msg", {
		text: function(trigger) {
	    	var mainElement = $($(".message_box#"+talking_to).find(".time-div[completetime='"+$(element).attr("completetime")+"']").get(offset)).parent().find(".user_message")[0];
	    	if($(mainElement).find("iframe").length>0){
	    		return $(mainElement).find("iframe").attr("src");
	    	} else if($(mainElement).find(".img-sent").length>0) {
	    		toastr["error"]("Pero podés copiar la imagen a mano!","Los navegadores no soportan el copiado de imágenes al clipboard aún.")
	    		return;
	    	} else {
	    		return $(mainElement).text();
	    	}
	    }
	});
	
	clipboardjs.on('success', function(e) {
		toastr["success"]("Mensaje copiado.");
	})
	
	clipboardjs.on('error', function(e) {
		toastr["error"]("No se pudo copiar el mensaje.");
	})
}

function isMobile(){
	return /Mobi/i.test(navigator.userAgent);
}

function doNotification(name,icon,body,tag,autoCloseTime,isMedialumNotification,target){
	if(isMobile()) {

	} else {
		notification = new Notification(name, {
	    	icon: icon,
	    	body: body,
	    	tag: tag,
	    	renotify:true,
	    	silent: true
	    	
	    });

	    clearTimeout(notification_timeout);
	    
	    notification_timeout = setTimeout(function(){
	    	notification.close()
	    }, autoCloseTime);
	      
	    notification_created=true;
	    
	    if(isMedialumNotification){
		    notification.onclick = function () {
		    	notification.close();
		    	window.focus();
		    	electronCall("focus")
		    }   
	    } else {
	    	notification.onclick = function () {
	 	    	notification.close();
	 	    	window.focus();
	 	    	electronCall("focus")
	 	    	
	 	    	changeTalkingTo(target);
	 	    }
	    }
	    
	    electronCall("blink")
	}
}

function verNovedades(){
	closePicker();
	talking_to = "";
	swal.close();
	showNoChats(true);
	$(".selected").removeClass("selected");
	toggleLeftBarMobile(false);
}

function rebindEntities(){
	$(".user-list").children().each(function(){
		$(this).unbind("mouseup");
		$(this).contextmenu(function() {return false;});
		$(this).mouseup(function(e){
			if(e.which == 3){
		    	if(isMuted($(this).find("#tag").text())){
		    		$("#toggle-mute").html('<i class="far fa-bell" style="padding-right:10px;"></i>Quitar silencio');
		    	} else {
		    		$("#toggle-mute").html('<i class="far fa-bell-slash" style="padding-right:10px;"></i>Silenciar');
		    	}
		    	
		    	toggleSelector("#leftbar-select",e);
		    	
		    	$("#leftbar-select #toggle-mute").attr("onclick","toggleMute('"+$(this).find("#tag").text()+"')")
		    	
		    	
		    }
		});
		
		$(this).on("taphold",function(e){
			if(typeof(e.originalEvent.touches)!=="undefined"){
				$(this).trigger({
				    type: 'mouseup',
				    which: 3,
				    pageY: e.originalEvent.touches[0].pageY,
				    pageX: e.originalEvent.touches[0].pageX
				});
			}	
		});
	});
}

function toggleMute(id){
	var entityMuted = isMuted(id);
	
	if(!entityMuted){
		mutedEntities.push(id);
	} else {
		for(var i=0;i<mutedEntities.length;i++){
			if(mutedEntities[i]==id){
				mutedEntities.splice(i, 1);
			}
		}
	}
	
	$.ajax({
		type:"post",
		data:{id:id, mute:!entityMuted},
		url:base_url+"api/mute",
		success: () => {
			if(entityMuted){
				toastr["success"](`Se quitó el silencio del ${id.includes(Medialum.groups_prefix)?"grupo":"usuario"}.`)
			} else {
				toastr["success"](`Se silenció el ${id.includes(Medialum.groups_prefix)?"grupo":"usuario"}.`)
			}
		}
	});
	
	checkSilenciados();
}

function checkSilenciados(){
	$(".entidad").each(function(){
		var found = false;
		
		if(isMuted($(this).find("#tag").text())){
			$(this).find("#status").show();
		} else {
			$(this).find("#status").hide();
		}
	});
}

function isMuted(id){
	for(var i=0;i<mutedEntities.length;i++){
		if(id==mutedEntities[i]){
			return true;
		}
	}
	return false;
}
 
function clavarVisto(target){
	if(($(`.message_box#${target}`).isScrolledBottom() || !$(`.message_box#${target}`).hasScrollBar()) && document.hasFocus() && $(".entidad").find("#tag:textEquals('"+target+"')").parent().parent().find(".new-message-circle").length > 0){
		var data = {
			type:"seen",
			entity:target
		}
		websocket.send(JSON.stringify(data));

		$(".entidad").find("#tag:textEquals('"+target+"')").parent().parent().find(".new-message-circle").remove();
		$("#unread-count").text("")
		updateTitle();
	}
}

function checkDateChange(usermsgbox,date,isHistorial){	
	if (!(date instanceof Date)){
		date = new Date(date);
	}
	
	var agregarCartelito = true;

	$('.message_box#'+usermsgbox).find(".date_message").each(function(){
		if(new Date($(this).attr("date")).toDateString()==date.toDateString()){
			agregarCartelito = false;
			return false;
		}
	});
	
	if(agregarCartelito){
		createDateChange(usermsgbox,date,isHistorial);
	}
}

function statusMessage(stat){
	var status_msg = "";
	
		switch(stat["status-type"]){
			case "group_created":
				if(typeof allUsers[stat.by] !== "undefined"){
					status_msg = "<b>"+ getUserFullName(stat.by)+"</b> creó un chat grupal.";
				} else {
					status_msg = "Se creó un chat grupal.";
				}
				break;
			case "group_added":
				if(typeof allUsers[stat.by] !== "undefined" && typeof allUsers[stat.who] !== "undefined"){
					status_msg = "<b>"+ getUserFullName(stat.by) +"</b> agregó a <b>"+ getUserFullName(stat.who)+"</b> al grupo.";
				} else {
					if(typeof allUsers[stat.by] !== "undefined"){
						status_msg = "<b>"+ getUserFullName(stat.by)+"</b> agregó a un usuario que actualmente está deshabilitado al grupo.";
					} else if(allUsers[stat.who] !== "undefined"){
						status_msg = "Un usuario actualmente deshabilitado agregó a <b>"+ getUserFullName(stat.who)+"</b> al grupo.";
					} else {
						status_msg = "Un usuario actualmente deshabilitado agregó a otro usuario que actualmente está deshabilitado al grupo.";
					}
				}
				break;
			case "group_name_change":
				if(typeof allUsers[stat.by] !== "undefined"){
					status_msg = "<b>"+ getUserFullName(stat.by)+"</b> cambió el nombre del grupo de <b>"+stat.group_name_change_from+"</b> a <b>"+stat.group_name_change_to+"</b>";
				} else {
					status_msg = "Un usuario deshabilitado cambió el nombre del grupo de <b>"+stat.group_name_change_from+"</b> a <b>"+stat.group_name_change_to+"</b>";
				}
				break;
			case "group_exit":
				if(stat.who===c_username){
					status_msg = "Saliste del grupo.";
				} else {
					if(typeof allUsers[stat.who] !== "undefined"){
						status_msg = "<b>"+ getUserFullName(stat.who)+"</b> salió del grupo.";
					} else {
						status_msg = "Un usuario deshabilitado salió del grupo.";
					}
					
				}
				break;
			case "you_are_alone":
				status_msg = "Quedaste solo en el grupo.";
				break;
		}
	
	return status_msg;
}

function getDisconnectedSince(dateFrom){
	if(dateFrom == null || typeof (dateFrom) === "undefined" || isNaN(dateFrom)){
		return "";
	}
	
	var diff_dates = Math.round(new Date().getTime() - dateFrom.getTime()) / 1000;
	
	if(diff_dates<60){
		ultVez="Hace unos segundos";
	} else if(diff_dates/60<60){
		diff_dates = Math.round(diff_dates/60);
		
		if(diff_dates==1){
			ultVez= "Hace "+diff_dates+" minuto";
		} else {
			ultVez= "Hace "+diff_dates+" minutos";
		}
	} else if(diff_dates/60/60<24){
		diff_dates = Math.round(diff_dates/60/60);
		
		if(diff_dates==1){
			ultVez= "Hace "+diff_dates+" hora";
		} else {
			ultVez= "Hace "+diff_dates+" horas";
		}
	} else {
		diff_dates = Math.round(diff_dates/60/60/24);
		
		if(diff_dates==1){
			ultVez= "Hace "+diff_dates+" día";
		} else {
			ultVez= "Hace "+diff_dates+" días";
		}
	}
	
	return ultVez;
}

function updateAllTimes(){
	$(".entidad.usuario").each(function(){
		if($(this).find(".user-state").hasClass("offline")){
			$(this).find("#escribiendo").text(getDisconnectedSince(new Date(allUsers[$(this).find("#tag").text()].disconnected_at)));
		}
	});
}

function bugReport(){
	var texto = "" +
	"<form id='options-data'>" +
	"<table align='center' style='width:100%'>" +
	"<tr>" +
	"<td class='userinfotd-left'>Se puede reproducir el error</td>" +
	"<td class='userinfotd-right'>" +
	"<select id='form-reproduction'><option value='1' selected>A veces</option><option value='2'>Siempre</option></select>" +
	"</td>" +
	"</tr>" +
	"<tr>" +
	"<td colspan=2 style='padding: 15px 0px;'>Descripción del error</td>" +
	"</tr>"+
	"<tr>"+
	"<td colspan=2><textarea id='form-desc' style='width:100%; height:100px; resize: vertical; padding: 7px; font-size: 17px; border-radius: 8px;' placeholder='Escribí los detalles de tu error...'></textarea></td>" +
	"</tr>"+
	"<tr>"+
	"<td colspan=2><label class='button'><input type='file' id='pic-input' accept='image/*' onchange='$(this).parent().parent().append(\"<img id=\\\"prev-image\\\" style=\\\"max-width:300px; max-height:300px;\\\">\"); showImg($(this)[0].files[0]); $(this).parent().remove();'>Adjuntar imagen</label></td>" +
	"</tr>"+
	"</table>" +
	"</form>";
	
	swal({
		title:"Reportar un error",
		html:texto,
		showConfirmButton:true,
		showCancelButton:true,
		cancelButtonText:"Cancelar",
		confirmButtonText:"Enviar",
		showLoaderOnConfirm: true,
		preConfirm: function() {
			return new Promise(function(resolve,reject) {
				if($("#form-desc").val()==""){
					throw new Error("Escribí una descripción del error.");
				}
			
				$.ajax({
					url:base_url+"api/report-bug",
					type:"post",
					data:{reproduction:$("#form-reproduction").val(),description:$("#form-desc").val(),image:((typeof $("#prev-image").attr("src") !== "undefined")?encodeURIComponent($("#prev-image").attr("src")):"")},
					success:function(){
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
			swal("Reporte enviado","Gracias por ayudarnos a mejorar Medialum!","success");
		}
	});
}

function showImg(file) {
	var reader = new FileReader();
    reader.onload = function(readerEvt) {
    	var binaryString = readerEvt.target.result;
        $("#prev-image").attr("src","data:image/png;base64,"+btoa(binaryString));
    }

	reader.readAsBinaryString(file);
}

function openSubmenu(){
	if(!$("#submenu-tools").is(":visible")){
		var finalY =  $("#submenu").offset().top+50;
		var finalX = $("#submenu").offset().left;
		
		if(finalX+$("#submenu-tools").width()>window.innerWidth){
			finalX = finalX-$("#submenu-tools").width()+$("#submenu").width();
		}
		
		$("#submenu-tools").css({
			top: finalY,
			left: finalX
		}).show("fast");
	} else {
		$("#submenu-tools").hide("fast");
	}
}

function focusInputMessage(force){
	if($('#message').is(":visible") && !connectionLost && talking_to!=""){
		if(!isMobile() || force){
			$("#message").focus();
		}
		
		if(isMobile()){
			scrollToBottom(talking_to,true);
		}
	}
}

var tenorRequest;
var lastTenorRequestSearch = "";
function redrawGifs(){
	$("#message").attr("placeholder","Buscar GIF...")
	$(".emoji-picker .emoji-set div[category='gifs'] .gif-container").empty();
	if(tenorRequest){
		tenorRequest.abort();
	}
	
	let tenorUrl = "https://api.tenor.com/v1/"
	let searchText = $("#message").val().trim();
	if(searchText !== ""){
		tenorUrl += `search?q=${searchText}` 
	} else { 
		tenorUrl += "trending?a=1"; 
	}
	
	lastTenorRequestSearch = searchText;
	
	tenorUrl += "&key=XYZ5UUHXEYVW&limit=25";
		
	tenorRequest = $.ajax({
		url: tenorUrl,
		success:function(response){
			$(".emoji-picker .emoji-set div[category='gifs'] .gif-container").empty();
			

			response.results.map( r => {
				$(".emoji-picker .emoji-set div[category='gifs'] .gif-container").append(`
				 <figure class="bg-dark" style="flex-grow: ${r.media[0].tinygif.dims[0] * 100 / r.media[0].tinygif.dims[1]}; flex-basis:${r.media[0].tinygif.dims[0] * 150 / r.media[0].tinygif.dims[1]}px;">
			        <i style="padding-bottom:${(r.media[0].tinygif.dims[1] / r.media[0].tinygif.dims[0]) * 100}%"></i>
			        <img src="${r.media[0].tinygif.url}" onclick="sendGIF('${r.media[0].mediumgif.url}')">
			    </figure>`);
			})
			
			if(response.results.length <= 0){
				$(".emoji-picker .emoji-set div[category='gifs'] .gif-container").append(`<p class='mt-3 text-center' style="width:100%">No se encontraron resultados para <b>"${escapeHtml(searchText)}"</b></p>`);
			}
			
			gifsRedrawn = true;
		}
	})
}

function sendGIF(url){
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = 'blob';
	request.onload = function() {
	    var reader = new FileReader();
	    reader.readAsDataURL(request.response);
	    reader.onload =  function(e){
	    	var file = e.target.result;
	    	
	        var arr = file.split(','), mime = arr[0].match(/:(.*?);/)[1],
	        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
		    while(n--){
		        u8arr[n] = bstr.charCodeAt(n);
		    }
		    
		    var finalFile = new File([u8arr], "tenor.gif",{type:mime});
		    
		    $("#message").val("")
		    
		    sendFile([finalFile]);
		        
		};
	};
	request.send();
}

function changePickerCat(category){
	setTimeout(function(){$('.emoji-picker .emoji-set div[category="'+category+'"]').scroll()},300);
	if(category==="gifs"){
		redrawGifs();
	} else {
		defaultPlaceholder();
	}

	$(".emoji-set").css({"transform":"translateX("+(-100 * $(".categories span[category='"+category+"']").index())+"%)"});
	$(".cat-selected").removeClass("cat-selected");
	$(".categories span[category='"+category+"']").addClass("cat-selected");
}

function addEmoji(e,emojiName){
	e.preventDefault();
	if(e.which===1){
		ehistorial = JSON.parse(localStorage.getItem("emoji-historial"));
		
		if(ehistorial==null){
			ehistorial = []
		}
		
		var found=false;
		
		for(var i=0;i<ehistorial.length;i<i++){
			if(ehistorial[i].name == emojiName){
				found=true;
				ehistorial[i].usage = ehistorial[i].usage + 1;
				break;
			}
		}
		
		if(!found){
			ehistorial.push({name:emojiName,usage:1});
		}
		
		ehistorial.sort(function(a,b) {return (a.usage > b.usage) ? -1 : ((b.usage > a.usage) ? 1 : 0);} ); 
		
		if(ehistorial.length>40){
			 ehistorial.slice(0, 40);
		}
		
		localStorage.setItem("emoji-historial",JSON.stringify(ehistorial));
		
		insertAtCaret("message", " :"+emojiName+": ");
	}
}

var pickerOpened=false;

function renderEmojis(){
	for(var i=0;i<emojis_categories.length;i++){
		$(".emoji-picker .categories").append("<span category='"+emojis_categories[i].name+"'><img src='"+((emojis_categories[i].name==="Custom")?emojis_categories[i].icon:base_url+"resources/img/emojis/default/"+emojis_categories[i].icon+".png")+"'></span>");
		$(".emoji-picker .emoji-set").append("<div category='"+emojis_categories[i].name+"'></div>");
	}
	
	$(".emoji-picker .categories").append("<span class='font-weight-bold' category='gifs'>GIF</span>");
	$(".emoji-picker .emoji-set").append(`
		<div category='gifs'>
			<div class='gif-container'></div>
		</div>`);
	
	$(".emoji-picker .categories").append("<span class='close-emoji-picker' onclick='closePicker();'><i class='fas fa-times'></i></span>")
	
	$(".categories span").not(".close-emoji-picker").mousedown(function(e){
		e.preventDefault();
		changePickerCat($(this).attr("category"));
	});

	var ehistorial = JSON.parse(localStorage.getItem("emoji-historial"));

	if(ehistorial==null){
		$(".emoji-picker .categories span[category='Historial']").hide();
	}
	
	for(var i=0;i<emojis.length;i++){
		$(".emoji-picker .emoji-set div[category='"+emojis[i].category+"']").append("<img class='emoji-pick' data-src='"+emojis[i].url+"' onmousedown='addEmoji(event, \""+emojis[i].nombre+"\")' title=':"+emojis[i].nombre+":'></div>");
	}
	
	for(var i=0;i<emojis_categories.length;i++){
		$('.emoji-picker .emoji-set div[category="'+emojis_categories[i].name+'"] img').lazyLoadXT({
			scrollContainer:'.emoji-picker .emoji-set div[category="'+emojis_categories[i].name+'"]'
		});
	}
}

function togglePicker(){	
	if(!pickerOpened){
		openPicker();
	} else {
		closePicker();
	}
}

function closePicker(){
	pickerOpened=false;
	setAllMessageBoxesHeight()
	defaultPlaceholder();
}

function defaultPlaceholder(){
	$("#message").attr("placeholder","Escribí algo...");
}

function openPicker(){
	if($(".cat-selected").length <= 0){
		changePickerCat("Smileys & People");
	}
	
	if(lastTenorRequestSearch != $("#message").val().trim()){
		redrawGifs();
	};
	
	if($("span[category='gifs'].cat-selected").length){
		$("#message").attr("placeholder","Buscar GIF...")
	}
	
	pickerOpened=true;
	redrawHistorialCategories();
	setAllMessageBoxesHeight();
}

var lastHeight = 0;

function autosize() {
	var inputMessage = document.getElementById('message');
	
	setTimeout(function(){
		if(inputMessage.scrollHeight < 200){
			inputMessage.style.cssText = 'height:auto;';
			inputMessage.style.cssText = 'height:' + inputMessage.scrollHeight + 'px';
		} else {
			inputMessage.style.height = '196px';
		}
		setAllMessageBoxesHeight();
	},0);
}

function setAllMessageBoxesHeight(){
	var emojiPickerHeight = $(".emoji-picker").height();
	var talkingtoHeight = $(".talking-to").outerHeight();
	var panelHeight = $(".panel").outerHeight();

	$("#all_message_boxes").css({"height":"calc(100vh - "+(talkingtoHeight + panelHeight + (pickerOpened ? emojiPickerHeight : 0))+"px)"});
}

function redrawHistorialCategories(){
	var ehistorial = JSON.parse(localStorage.getItem("emoji-historial"));
	
	if(ehistorial==null){
		ehistorial = []
	} else {
		$(".emoji-picker .categories span[category='Historial']").show();
	}
	
	$(".emoji-picker .emoji-set div[category='Historial']").empty();
	
	for(var i=0;i<ehistorial.length;i++){
		var emojidata = null;
		for(var j=0;j<emojis.length;j++){
			if(emojis[j].nombre == ehistorial[i].name){
				emojidata = emojis[j];
				break;
			}
		}
		if(emojidata!=null) $(".emoji-picker .emoji-set div[category='Historial']").append("<img class='emoji-pick' src='"+emojidata.url+"' onmousedown='addEmoji(event, \""+emojidata.nombre+"\")' title=':"+emojidata.nombre+":'></div>");
	}
}

function toggleSelector(elementID,buttonID,customDirection){
	var finalY, finalX;
	var direction = customDirection || "top left";
	
	if(buttonID.originalEvent instanceof Event){
		finalY = buttonID.pageY + 2;
		finalX = buttonID.pageX;
		
		if(finalX+$(elementID).width()>window.innerWidth){
			finalX = finalX-$(elementID).width();
			
			if(direction.indexOf("left")!==-1){
				direction = direction.replace("left","right");
			} else {
				direction = direction.replace("right","left");
			}
		}
		
		if(finalY+$(elementID).height() > window.innerHeight){
			finalY = finalY-$(elementID).height();
			
			if(direction.indexOf("bottom")!==-1){
				direction = direction.replace("bottom","top");
			} else {
				direction = direction.replace("top","bottom");
			}
		}
	} else {
		finalY = $(buttonID).offset().top + $(buttonID).height();
		finalX = $(buttonID).offset().left;
		
		if(finalX+$(elementID).width() > window.innerWidth){
			finalX = finalX-$(elementID).width()+$(buttonID).width();
			
			if(direction.indexOf("left")!==-1){
				direction = direction.replace("left","right");
			} else {
				direction = direction.replace("right","left");
			}
		}
		
		if(finalY+$(elementID).height() > window.innerHeight){
			finalY = finalY-$(elementID).height()+$(buttonID).height();
			
			if(direction.indexOf("bottom")!==-1){
				direction = direction.replace("bottom","top");
			} else {
				direction = direction.replace("top","bottom");
			}
		}
	}

	$(elementID).css("transform-origin",direction);
	
	if($(elementID).attr("opened")==="true"){		
		closeSelector(elementID);
	} else if($(elementID).attr("opened")==="false") {
		$(elementID).css({
			"top": finalY,
			"left": finalX,
			"opacity": "1",
			"transform": "scale(1)",
		});
		
		if(elementID==="#tool-select"){
			$("#tool").addClass("opened");
		}
		
		setTimeout(function(){
			$(elementID).attr("opened","true");
		},200);
	}
}

function closeSelector(elementID){
	if($(elementID).attr("opened")==="true"){
		$(elementID).css({
			"opacity": "0",
			"transform": "scale(0)",
		});
		
		if($(elementID).attr("id")==="tool-select"){
			$("#tool").removeClass("opened");
		}
		
		setTimeout(function(){
			$(elementID).attr("opened","false");
		},200);
	}
}

var surveyAddOption = function(){
	if($("#survey-options input").length<10){
		$("#survey-options").append('<input type="text" class="swal2-input" maxlength="200" style="display:block">');
	}
}

var surveyRemoveOption = function(){
	if($("#survey-options input").length>1){
		$("#survey-options input").last().remove();
	}
}

function saveLocalConfig(){
	localStorage.setItem("localconfig",JSON.stringify(localconfig));
}

var hoursProjects;
var hoursHolidays;
var hoursBirthdays;
var hoursData;

function hoursPlanilla(year = new Date().getFullYear(), month = (new Date().getMonth()), skipLoader = false){
	$('[data-toggle=tooltip]').tooltip('hide');
	
	if(!skipLoader){
		swal({
			html:"<svg id='top-loader' class='spinner-container' width='65px' height='65px' viewBox='0 0 52 52'><circle class='path' cx='26px' cy='26px' r='20px' fill='none' stroke-width='4px'></circle></svg>",
			showConfirmButton:false,
			showCancelButton:false,
			allowOutsideClick: false,
			cancelButtonText:"Cancelar"
		});
	} else {
		$("i.fa.clickable").css({
			"opacity":"0.5",
			"pointer-events":"none"
		})
	}
	
	$.ajax({
		type:"post",
		url: base_url+"hours/list",
		data:{year:year,month:month+1},
		success:function(response){
			hoursProjects = response.projects
			hoursHolidays = response.holidays;
			hoursBirthdays = response.birthdays;
			var holidays = response.holidays;
			let days = new Date(year, month, 1);
			let daysInMonth = new Date(year, month+1, 0).getDate();

			let html = `
			<div class="custom-control custom-checkbox my-3">
				<input type="checkbox" class="custom-control-input" id="see-birthdays" ${localconfig.see_birthdays ? "checked" : ""}>
				<label class="custom-control-label" for="see-birthdays">Ver cumpleaños</label>
			</div>
			<div class="table-responsive" style="height: calc(100vh - 170px)">
			<table class="table table-bordered hours">
				<thead>
					<tr class="text-center">
						<th style="width: 80px">Día</th>
						<th style="width: 80px">Total</th>
						<th>Horas</th>
					</tr>
				</thead>
				<tbody>
				
					${
						Array.apply(null, {length: daysInMonth}).map(Number.call, Number).map(i => {
							const date = new Date(year,month,(i+1)).getFullYear()+"-"+("0"+(new Date(year,month,(i+1)).getMonth()+1)).slice(-2)+"-"+("0"+new Date(year,month,(i+1)).getDate()).slice(-2);
						
							return `<tr class='whole-day ${new Date(year,month,i+1).setHours(0,0,0,0) === new Date().setHours(0,0,0,0) ? "today":""} ${new Date(year,month,i+1).getDay() === 0 || new Date(year,month,i+1).getDay() === 6 ? "table-active" : ""}' date='${date}'>
								<td class="align-middle font-weight-bold" id='hour-date' data-toggle="tooltip" title='${dayNames[new Date(year,month,i+1).getDay()]}'>
									${i+1}
								</td>
								<td class="align-middle font-weight-bold" id='total-hours'>
									0
								</td>
								<td id='hours' class="p-0">
									<div class="row no-gutters" style="min-height: 45px;">
										<div class="col">
											<table class="table table-borderless table-hover table-striped mb-0">
												<tbody id='all-hours'></tbody>
											</table>
										</div>
										<div class="col d-flex align-items-end justify-content-center" style="flex: 0 0 60px;">
											<span class='text-success add-hour btn' data-toggle="tooltip" data-placement="top" title='Cargar hora' onclick='addHour("${date}")' style="visbility:hidden;">
												<i class='fa fa-plus'></i>
											</span>
										</div>
									</div>
								</td>
							</tr>`
						}).join("")
					}
				
				</tbody>
			
			</table>
			</div>`;
				
			swal({
				title: `
					<i data-toggle="tooltip" title='Ver horas de ${ days.getMonth() - 1 < 0 ? monthNames[11] : monthNames[days.getMonth()] }' onclick='hoursPlanilla(${ days.getMonth() - 1 < 0 ? `${days.getFullYear()-1},11` : `${days.getFullYear()},${days.getMonth()-1}`}, true)' class='fa fa-arrow-left clickable mr-3'></i> Planilla de horas - ${monthNames[days.getMonth()]} ${year} <i data-toggle="tooltip" title='Ver horas de ${ days.getMonth() + 1 > 11 ? monthNames[0] : monthNames[days.getMonth()+1] }' onclick='hoursPlanilla(${ days.getMonth() + 1 > 11 ? `${days.getFullYear()+1},0` : `${days.getFullYear()},${days.getMonth()+1}`}, true)' class='fa fa-arrow-right clickable ml-3'></i>`,
				width: window.innerWidth > 700 ? "80%" : "100%",
				html:html,
				showConfirmButton: false, 
				animation:false,
				onClose:modulesStatus,
			});
			
			$("#see-birthdays").change(() => {
				let isChecked = false;

				if($("#see-birthdays").is(":checked")){
					isChecked = true;
					$(".alert-birthday").closest("tr").show();
				} else {
					$(".alert-birthday").closest("tr").hide();
				}

				localconfig.see_birthdays = isChecked; 
				saveLocalConfig();
			})

			if($(".whole-day.today").length>0){
				setTimeout(function(){
					$('.table-responsive').animate({
				        scrollTop: $(".whole-day.today").offset().top-200
				    }, 500, function(){
				    	$(".whole-day.today").css({
				    		background:"#ffffca"
				    	});
				    });
				},100);
			}
			
			updatePlanilla(response.hours);
		},
	})
}

const makeHourRow = (hour) => {
	let isNew = false;
	if(!hour){
		isNew = true;
	}
	
	let finalHtml = `<tr>
						<td class="p-1">
							<div class='one-hour align-items-center row no-gutters'>
								<input type="hidden" name="hour_id" value="${ !isNew ? hour.hour_id : ""}">
								<input type="hidden" id="project_id" value="${ !isNew ? hour.project_id : ""}">
								<div class="text-left col px-2" style='max-width: 250px; min-width: 250px;'>
									<select style="${!isNew ? "display:none;" : ""}" class='form-control' id='project'><option value='' selected>Elegir proyecto...</option>`

	const globalProjects = hoursProjects.filter(p => p.isGlobal)
	const notGlobalProjects = hoursProjects.filter(p => !p.isGlobal)
	
	if(notGlobalProjects.length > 0){
		finalHtml += `<optgroup label='Mis proyectos'>
						${
							notGlobalProjects.map(p => {
								return `<option value='${p.id}' ${!isNew ? (hour.project_id == p.id ? "selected" : "") : ""}>${p.name}</option>`;
							})
						}
						</optgroup>`
	}
	
	if(globalProjects.length > 0){
		finalHtml += `<optgroup label='Otros'>
						${
							globalProjects.map(p => {
								return `<option value='${p.id}' ${!isNew ? (hour.project_id == p.id ? "selected" : "") : ""}>${p.name}</option>`;
							})
						}
						</optgroup>`
	}
				
	finalHtml += `</select>
						<span class="font-weight-bold no-input" style="${isNew ? "display:none;" : ""}">${!isNew ? hour.project_name : ""}</span>
					</div>
					<div class="text-right col px-2" style="max-width: 130px; min-width: 130px;">
						<input style="${!isNew ? "display:none;" : ""}" class='form-control' type='number' id='hours' placeholder='Horas...' max='24' min='1' value="${!isNew ? hour.hours : ""}">
						<span class="no-input" style="${isNew ? "display:none;" : ""}">${!isNew ? hour.hours : ""} hs.</span>
					</div>
					<div class="text-left col p-2" style="min-width: 310px; max-width: 100%;">
						<textarea style="${!isNew ? "display:none;" : ""}" class='form-control' id='detail' placeholder='Detalle...'>${!isNew && hour.detail.trim() !== "" ? hour.detail : ""}</textarea>
						<span class="no-input" style="white-space: pre-line; ${isNew ? "display:none;" : ""}">${!isNew ? escapeHtml(hour.detail) : ""}</span>
					</div>
					<div class="col" style='min-width: 105px; max-width: 105px;'>
						${ !isNew ? 
						`<span data-toggle="tooltip" data-placement="top" title='Editar hora' id="action-edit" style="visibility: hidden"; class='edit text-warning btn' onclick='editHour(${hour.hour_id})'><i class='fas fa-pencil-alt'></i></span>
						<span data-toggle="tooltip" data-placement="top" title='Eliminar hora' id="action-delete" style="visibility: hidden"; class='edit text-danger btn' onclick='deleteHour(${hour.hour_id},${hour.project_id})'><i class='fa fa-trash'></i></span>` : ""
						}
						<span data-toggle="tooltip" data-placement="top" title='Guardar' id="action-save" style="${!isNew ? "display:none;" : ""}" class='text-success btn save' onclick='saveHour(this)'><i class='fa fa-check'></i></span>
						<span data-toggle="tooltip" data-placement="top" title='Cancelar' style="${!isNew ? "display:none;" : ""}" class='text-danger btn save' onclick='closeHour(this)'><i class='fas fa-times'></i></span>
					</div>
				</div>
			</td>
		</tr>`
		
	return finalHtml;
}

function updatePlanilla(hours){	
	$('[data-toggle=tooltip]').tooltip('hide');
	
	hoursData = hours
	$("td#total-hours").text("0")
	$(".alert-holiday").closest("tr").remove();
	$(".alert-birthday").closest("tr").remove();
	
	$(".whole-day").each(function(){
		var thisHourDay = $(this).attr("date");
		hoursHolidays.map(h => {
			if(h.date===thisHourDay){
				$(this).addClass("table-active")
				if(h.detail!=null && h.detail.trim()!==""){
					$(this).find("#all-hours").append(`<tr><td><div class='alert-holiday btn btn-success' style="pointer-events: none;"><i class='fa fa-exclamation-circle pr-2'></i>${h.detail.trim()}</div></td></tr>`)
				}
			}
		})
		
		hoursBirthdays.map(b =>{
			if(b.date.split("-")[2] === thisHourDay.split("-")[2]){			
				if(allUsers[b.username]){			
					$(this).find("#all-hours").append(`
						<tr>
							<td>
								<a class='alert-birthday' ${c_username !== b.username ? `href="#" onclick="changeTalkingTo('${b.username}'); $('[data-toggle=tooltip]').tooltip('hide'); swal.close();" data-toggle="tooltip" data-placement="top" title='Desearle un feliz cumpleaños!'` : ""}>
									<i class='fas fa-birthday-cake'></i> Cumpleaños de ${getUserFullName(b.username)}
								</a>
							</td>
						</tr>`)
				}	
			}
		})
	})
	
	$(".one-hour").parent().parent().remove();
	
	hours.map(h => {
		var total_hours = Number($(".whole-day[date='"+h.date+"'] #total-hours").text());
		$(".whole-day[date='"+h.date+"'] #all-hours").append(makeHourRow(h));
		
		total_hours += Number(h.hours);
		
		var hourColorClass = "";
		if(total_hours >= 8){
			hourColorClass = "text-success"
		} else if(total_hours > 0) {
			hourColorClass = "text-warning"
		}
		
		$(".whole-day[date='"+h.date+"'] #total-hours").removeClass("text-success text-danger text-warning").addClass(hourColorClass).text(total_hours)
	});
	
	bindEnterSaveHour();
	
	$("#see-birthdays").trigger("change")
	
	$('[data-toggle="tooltip"]').tooltip();
}

function bindEnterSaveHour(){
	$(".hours textarea, .hours input").unbind("keydown").keydown(function(e) {
		if(e.which == 13 && !e.shiftKey && !$(this).parent().parent().find("#action-save").hasClass("disabled")){
			e.preventDefault()
			$(this).parent().parent().find("#action-save").trigger("click")
		}
	})
}

function addHour(date){
	const day = $(".whole-day[date='"+date+"']");
	
	day.find("#all-hours").append(makeHourRow());
	
	bindEnterSaveHour()
}

function closeHour(element){
	let oneHour = $(element).parent().parent().parent().parent()
	if(!oneHour.find("input[name='hour_id'][value='']").length){
		//it was an edited hour
		oneHour.find("select,input,textarea,.save").hide();
		oneHour.find(".no-input,.edit").show();
	} else {
		//it was a new hour
		oneHour.remove();
	}
}

function editHour(hour_id){
	
	const hourToEdit = hoursData.filter( h => h.hour_id == hour_id)[0];

	if(!hoursProjects.filter( p => p.id == hourToEdit.project_id)){
		toastr["error"]("El proyecto está deshabilitado o ya no perteneces al mismo.","Ups!")
		return;
	}
	
	$(".one-hour input[name='hour_id'][value='"+hourToEdit.hour_id+"']").parent().find("select,input,textarea,.save").show();
	$(".one-hour input[name='hour_id'][value='"+hourToEdit.hour_id+"']").parent().find(".no-input,.edit").hide();
}

function deleteHour(hour_id, project_id){
	$.ajax({
		type:"post",
		url: base_url+"hours/delete",
		data: { 
				id: hour_id,
				project_id: project_id,
				date: $("input[name='hour_id'][value="+hour_id+"]").parents(".whole-day").attr("date")
		},
		success:function(response){
			if(response.status==="success"){
				updatePlanilla(response.hours);
				toastr["success"]("Se eliminó correctamente la hora.")
			} else if(response.status==="error"){
				switch(response.response){
					case "no access":
						toastr["error"]("El proyecto está deshabilitado o ya no tenés acceso al mismo.","Ups!")
						break;
					default:
						toastr["error"]("Ocurrió un error. Intentá de nuevo más tarde.","Ups!")
						break;
				}
			}
			//$("#hour-date[date='"+date+"']").parent().parent().find(".btn-green, .btn-red, .btn-yellow").removeClass("disabled")
		},
		error:function(){
			toastr["error"]("Ocurrió un error. Intentá de nuevo más tarde.","Ups!")
			//$("#hour-date[date='"+date+"']").parent().parent().find(".btn-green, .btn-red, .btn-yellow").removeClass("disabled")
		},
	});
}

function saveHour(element){
	
	const oneHour = $(element).parent().parent().parent().parent();
	const wholeDay = oneHour.parents(".whole-day");
	
	var project_id = oneHour.find('#project').val();
	var detail = oneHour.find('#detail').val();
	var hours = oneHour.find('#hours').val();
	var date = wholeDay.attr("date");
	var hour_id = oneHour.find("input[name='hour_id']").val();
	
	if(!project_id){
		toastr["error"]("Falta seleccionar un proyecto.")
		return;
	}
	
	const selectedProject = hoursProjects.filter(p => p.id == project_id)[0];
	
	if(selectedProject.must_detail && (!detail || detail.trim() === "")){
		toastr["error"]("El detalle es obligatorio para el proyecto "+selectedProject.name+".")
		return;
	}
	
	if(!hours || hours.trim() === ""){
		toastr["error"]("Falta la hora.")
		return;
	}
	
	if(isNaN(Number(hours))){
		toastr["error"]("La hora es inválida.")
		return;
	}
	
	if(Number(hours) <= 0 || Number(hours) > 24){
		toastr["error"]("La cantidad de horas debe ser mayor a 0 y menor a 24.")
		return;
	}
	
	oneHour.find(".edit, .save").addClass("disabled")
	
	$.ajax({
		type:"post",
		url: base_url+"hours/save",
		data:{project_id,detail: detail.trim(),hours,date,hour_id},
		complete: () => { oneHour.find(".edit, .save").removeClass("disabled") },
		success:function(response){
			if(response.status==="success"){
				updatePlanilla(response.hours);
				toastr["success"]("Se guardó correctamente la hora.")
			} else if(response.status==="error"){
				switch(response.response){
					case "no access":
						toastr["error"]("El proyecto está deshabilitado o ya no tenés acceso al mismo.","Ups!")
						break;
					case "detail required":
						toastr["error"]("El detalle es obligatorio para el proyecto "+hoursProjects[project_index].name+".")
						break;
					default:
						toastr["error"]("Ocurrió un error. Intentá de nuevo más tarde.","Ups!")
						break;
				}
			}
			oneHour.find(".edit, .save").removeClass("disabled")
			
		},
		error:function(repsonse){
			toastr["error"]("Ocurrió un error. Intentá de nuevo más tarde.","Ups!")
		}
	});
}

function createSurvey(){
	var survey = {
		type:"",
		text:"",
		options:[],
	}
	
	var steps = [
         {
        	 input:"radio",
        	 title: 'Anónima o Pública?',
        	 html: 'Si seleccionás <b>Anónima</b>, nadie va a poder ver de quiénes son los votos.',
        	 inputOptions:
        	 {
        		 'anonymous':"Anónima",
        		 'not-anonymous':"Pública"
        	 },
        	 preConfirm:function(result) {
     		    return new Promise(function(resolve) {
     		    	if(result==null){
     		    		throw new Error("Tenés que marcar una opción.")
     		    	} else {
     		    		survey.type=result
     		    		resolve()
     		    	}
     		    }).catch(error => {
			        swal.showValidationError(error)
			    });
        	 }
         },
         {
        	 input:"text",
        	 title:'Encuesta',
        	 text: 'Hacé tu encuesta.',
        	 inputAttributes:{maxlength:100},
        	 preConfirm:function(result) {
     		    return new Promise(function(resolve) {
     		    	if(result==null || result===""){
     		    		throw new Error("Por favor, escribí tu encuesta.")
     		    	} else {
     		    		survey.text=result
     		    		resolve()
     		    	}
     		    }).catch(error => {
			        swal.showValidationError(error)
			    });
        	 }
         },
         {
        	 title:'Opciones',
        	 html: 'Agregá tus opciones.<br><div id="survey-options">'+
        		 	'<input type="text" class="swal2-input" maxlength="200" style="display:block">' +
        		 	'<input type="text" class="swal2-input" maxlength="200" style="display:block">' +
        		 	'</div>'+
        		 	'<i class="fa fa-plus-circle add-survey-option" title="Agregar opción" onclick="surveyAddOption()"></i> '+
        		 	'<i class="fa fa-minus-circle remove-survey-option" title="Quitar opción" onclick="surveyRemoveOption()"></i>',
        	confirmButtonText:"Finalizar", 
        	preConfirm:function() {
     		    return new Promise(function(resolve) {
     		    	$("#survey-options input").each(function(){
     		    		if($(this).val().trim()===""){
     		    			throw new Error("No pueden haber opciones vacías.")
     		    		}
     		    		survey.options.push($(this).val().trim())
     		    	})

     		    	resolve()
     		    }).catch(error => {
    		        swal.showValidationError(error)
    		    });
        	 }
         }
   ]

	swal.mixin({
		progressSteps: ['1', '2', '3'],
		confirmButtonText: 'Siguiente <i class="fa fa-arrow-right"></i>',
		showCancelButton: true,
		cancelButtonText: "Cancelar"
	}).queue(steps).then(function (result) {
		swal.resetDefaults()
		if(result.value){
			var fullSurvey = {type:"survey",survey:survey,group_id:talking_to,randomID:generateRandomID()}
			websocket.send(JSON.stringify(fullSurvey));
		}
	})
}

function viewSurveyResults(survey_id,option_index,element){
	
	swal({
		html:"<svg id='top-loader' class='spinner-container' width='65px' height='65px' viewBox='0 0 52 52'><circle class='path' cx='26px' cy='26px' r='20px' fill='none' stroke-width='4px'></circle></svg>",
		showConfirmButton:false,
		showCancelButton:false,
		allowOutsideClick: true,
		cancelButtonText:"Cancelar"
	});
	
	$.ajax({
		type:"post",
		url: base_url+"survey/get/voters",
		data:{survey_id:survey_id,option_index:option_index},
		success:function(response){
			if(swal.isVisible()){
				survey = JSON.parse(response);
				
				if(survey.status==="anonymous"){
					swal({
						title:"Encuesta anónima",
						html:"La encuesta es anónima, por lo tanto, absolutamente nadie puede ver de quiénes son los votos.",
						imageUrl:base_url+"resources/img/emojis/default/1f575.png"
					});
				} else {
					var html="<div>Votación para opción:<br><b>"+$(element).parent().parent().find(".text-container").text()+"</b></div></div><div style='max-height:350px; margin:auto; width:250px; overflow-x:hidden;overflow-y:auto;'>";
					var generateHtml = function (username){
						var html="<div style='text-align:left; border-bottom:1px solid #e0e0e0; padding: 10px 0px 10px 0px;'>" +
									"<img style='display: inline-block; vertical-align: middle; border-radius: 100%;' src='"+getEntityPic(username)+"' onerror=\"$(this).attr('src','resources/img/no-profile.png')\" width=40>" +
									"<div style='display: inline-block; vertical-align: middle; margin-left: 10px;'>"+getUserFullName(username)+"</div>" +
								 "</div>";
						return html;
					}
					
					if(survey.users.length===0){
						html +="<div><br>Nadie votó esta opción.</div>"
					} else {
						for(var i=0;i<survey.users.length;i++){
							html+=generateHtml(survey.users[i]);
						}
					}
					
					html+="</div>"
					
					swal({
						html:html,
						confirmButtonText:"Cerrar",
						showConfirmButton:true,
						showCancelButton:false
					})
				}
			}
		},
		error:function(){
			if(swal.isVisible()){
				swal("Ups!","Ocurrió un error. Intentá de nuevo más tarde.","error");
			}
		}
	});
}

function surveyVote(survey_id,option_index, element, e){
	if(e.target.id==="value" || e.target.id==="text" || e.target.className === "result" ){
		return;
	}
	
	swal({
		html:"<svg id='top-loader' class='spinner-container' width='65px' height='65px' viewBox='0 0 52 52'><circle class='path' cx='26px' cy='26px' r='20px' fill='none' stroke-width='4px'></circle></svg>",
		showConfirmButton:false,
		showCancelButton:false,
		allowOutsideClick: true,
	});
	
	$.ajax({
		type:"post",
		url: base_url+"survey/get/vote-check",
		data:{survey_id:survey_id},
		success:function(response){
			if(swal.isVisible()){
				response = JSON.parse(response)
				if(response.status==="not voted"){
					swal({
						type:"warning",
						title:"Estás seguro?",
						html:"Estás votando por la opción <b>"+$(element).parent().parent().find(".text-container").text()+"</b>.<br>Una vez que hayas votado, no vas a poder cambiar de opción.",
						confirmButtonText:"Si",
						cancelButtonText:"No",
						showCancelButton:true
					}).then(function(result){
						if(result.value){
							var vote = {survey_id: survey_id, option_index: option_index};
							
							$(".survey input[value='"+survey_id+"']").parent().parent().find(".vote").addClass("disabled")
							
							websocket.send(JSON.stringify({type:"survey-vote",vote:vote}))
							
							toastr["success"]("Tu voto se hizo correctamente.")
						}
						
					});
				} else if(response.status==="already voted"){
					swal({
						type:"info",
						title:"Ya votaste",
						html:"Ya votaste en esta encuesta."
					});
				} else {
					if(swal.isVisible()){
						swal("Ups!","Ocurrió un error. Intentá de nuevo más tarde.","error");
					}
				}
			}
		},
		error:function(){
			if(swal.isVisible()){
				swal("Ups!","Ocurrió un error. Intentá de nuevo más tarde.","error");
			}
		}
	});
}

function getResultsSurvey(survey_id){
	var surveyRotationCounter = parseInt($(".survey input[value='"+survey_id+"']").parent().find("input[id='spin-counter']").val());
	surveyRotationCounter++;
	$(".survey input[value='"+survey_id+"']").parent().find("i").css("transform","rotate("+360*surveyRotationCounter+"deg)")
	
	$(".survey input[value='"+survey_id+"']").parent().find("input[id='spin-counter']").val(surveyRotationCounter)
	
	$.ajax({
		type:"post",
		url: base_url+"survey/get/results",
		data:{survey_id:survey_id},
		success:function(response){
			response = JSON.parse(response)
			if(response.status==="ok"){
				$(".survey input[value='"+survey_id+"']").parent().parent().find(".option").each(function(index){
					if(typeof response.votes[index]!=="undefined"){
						$(this).find(".result #value").text(response.votes[index])
						if(response.votes[index]===1){
							$(this).find(".result #text").text(" voto");
						} else {
							$(this).find(".result #text").text(" votos");
						}
					} else {
						$(this).find(".result #text").text("Error");
						$(this).find(".result #value").text("");
						$(this).find(".vote").addClass("disabled")
					}
				});
				
				if(response.has_voted){
					$(".survey input[value='"+survey_id+"']").parent().parent().find(".vote").addClass("disabled")
				}
			}
		}
	});
}

function getEmojiURL(emoji){
	if(isElectron()){
		return Electron.path.join(Electron.emojisURL,emoji+".png")
	} else {
		return base_url+'resources/img/emojis/default/'+ emoji + '.png'
	}
}




