const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const database = require('./database')

const constants = require('./constants')

let allUserData = []
let groups = []

const db_methods = require('./db_methods')
const utils = require('./utils')

const probe = require('probe-image-size');
const path = require('path')

const sockets = [];

(async () => {

	console.log("Connecting to MySQL...")
	await database.connect();

	console.log("Retrieving user data...")
	allUserData = await db_methods.getAllUsersData();

	console.log("Retrieving groups...")
	groups = await db_methods.getGroups();

	io.on('connection', function(socket){
		console.log('a user connected');
		
		sockets.push(socket);

		socket.on('register', registration => {
			db_methods.login(registration.username, registration.password).then(async result => {
				console.log('login successful');

				socket.user_id = result.id;

				//actualiza estado
				allUserData.find(u => u.id == socket.user_id).state = registration.state ? registration.state : "online";

				//get all users that this user can see (except users without the required roles)
				const visibleUsers = []
				allUserData.forEach(u => {
					if(utils.rolesCheck(u.roles, allUserData.find(u => u.id == socket.user_id).roles) && u.habilitado == 1){
						visibleUsers.push(u)
					}
				})
				
				socket.emit('all-users', visibleUsers)

				//get all groups of user
				const userGroups = groups.filter(g => g.users.filter(u => { u == socket.user_id }));
				socket.emit('group-list', userGroups);

				//once data and groups are retrieved, get order and unread messages
				db_methods.getEntitiesOrder(socket.user_id).then(result => {
					socket.emit('order', result);
				})

				db_methods.getUnreadMessages(socket.user_id).then(result => {
					socket.emit('unread_messages', result);
				})
				
				sockets.forEach(s => {
					if(s.user && utils.rolesCheck(allUserData.find(u => u.id == socket.user_id).roles, allUserData.find(u => u.id == s.user_id).roles)){
						s.emit('connected', {id: socket.user_id, state: allUserData.find(u => u.id == socket.user_id).state})
						console.log("Se conecto "+socket.user_id)
					}
				})

				socket.on('message', async data => {
					const senderUser = allUserData.find(u => u.id == socket.user_id);

					let canGroup = false;
					let canUser = false;
					let isGroup = false;

					//checkea los tipos; cual puede ser enviado a un usuario y a grupos
					switch(data.type){
						case "message":
						case "file":
							canGroup = true;
							canUser = true;
						break;

						case "survey":
						case "status":
							canGroup = true;
							canUser = false;
						break;

						default: return;
					}

					let target = null

					//target es usuario o grupo, obtiene el target
					if(!utils.isGroup(data.target)){
						target = allUserData.find(u => u.id == data.target); 
					} else {
						target = groups.find(g => g.id == utils.getGroupID(data.target))
						isGroup = true;
					}

					//checkea que tenga los roles necesarios y que target sea algo
					if(!target || (!isGroup && !utils.rolesCheck(target.roles, senderUser.roles))) return;

					let newMessage = {}

					switch(data.type){
						case 'message':
							data.message = utils.escapeHtml(data.message.trim())

							//prepare data to be sent to client
							newMessage = {
								type: "message", 
								from: senderUser.id, 
								message: data.message, 
								randomID: data.randomID, 
								target: isGroup ? constants.GROUPS_PREFIX + target.id : target.id
							};

							if(isGroup){
								//checkea que el usuario que manda el msj este en el grupo
								if(!target || !target.users.find(u => u == senderUser.id)){
									return;
								}

								target.users.forEach(u => {
									//send message to all users groups instances
									sockets.filter( s => s.user_id == u).forEach(s => {
										s.emit("message", newMessage);
									})
								})

								db_methods.insertMessage(senderUser.id, target, newMessage.message, 0, null);
							} else {
								//send message to all sender instances and all target instances
								sockets.filter( s => s.user_id === senderUser.id || s.user_id === target.id).forEach(s => {
									s.emit("message", newMessage);
								})

								db_methods.insertMessage(senderUser.id, target.id, newMessage.message, 0, null);
							}
						break;

						case "file":
							data.file = utils.escapeQuotes(data.file); //message text

							switch(path.extname(data.file).toLowerCase()){
								case ".jpg":
								case ".gif":
								case ".png":
								case ".svg":
								case ".jpeg":
								case ".bpm":
								case ".ico":
									const filesize = await probe(process.env.FILES_URL + data.file);
									data.data = JSON.stringify(filesize);
								break;
								default:
									data.data = null;
								break;
							}

							//prepare data to be sent to client
							newMessage = {
								type: "file", 
								from: senderUser.id, 
								message: data.file, 
								randomID: data.randomID, 
								target: isGroup ? constants.GROUPS_PREFIX + target.id : target.id,
								data: data.data
							};

							if(isGroup){								
								//checkea que el usuario que manda el msj este en el grupo
								if(!target || !target.users.find(u => u == senderUser.id)){
									return;
								}
			
								target.users.forEach(u => {
									//send message to all sender instances
									sockets.filter( s => s.user_id == u).forEach(s => {
										s.emit("message", newMessage);
									})
								})
								
								db_methods.insertMessage(senderUser.id, target, data.file, 1, data.data);
							} else {			
								//send message to all sender instances and all target instances
								sockets.filter( s => s.user_id === senderUser.id || s.user_id === target.id).forEach(s => {
									s.emit("message", newMessage);
								})
								
								db_methods.insertMessage(senderUser.id, target.id, data.file, 1, data.data);
							}	
						break;
					}
				})
			})

			socket.on("state", state => {

				const senderUser = allUserData.find(u => u.id == socket.user_id);

				if(!["online","away","busy"].includes(state)){
					return;
				}

				allUserData.forEach(u => {
					if(u.id == senderUser.id){
						u.state = state
					}
				})
				
				const stateChange = {
					id: senderUser.id,
					state: state
				}
				
				sockets.forEach(s => {
					if(utils.rolesCheck(senderUser.roles, allUserData.find(u => u.id == s.user_id).roles)){
						s.emit('updatestate', stateChange)
					}
				})
			})

			socket.on('updatepic', group_id => {
				const senderUser = allUserData.find(u => u.id == socket.user_id);

				let entity = group_id ? group_id : senderUser.id;
				
				sockets.forEach(s => {
					if(utils.rolesCheck(senderUser.roles, allUserData.find(u => u.id == s.user_id).roles)){
						s.emit('updatepic', entiy)
					}
				})
			})

			socket.on('updateuser', data => {
				const senderUser = allUserData.find(u => u.id == socket.user_id);

				editUser = allUserData.find(u => u.id == senderUser.id)

				editUser.apodo = data.apodo
				editUser.celular = data.celular
				editUser.nombre = data.nombre
				editUser.email = data.email
				editUser.nick = data.nick
				
				const userUpdated = {
					user_id: senderUser.id,
					apodo: editUser.apodo,
					nombre: editUser.nombre,
					email: editUser.email,
					nick: editUser.nick
				}

				sockets.forEach(s => {
					if(utils.rolesCheck(senderUser.roles, allUserData.find(u => u.id == s.user_id).roles)){
						s.emit('updateuser', userUpdated)
					}
				})
			})

			socket.on("update-ready", update => {
				if(update.mode && update.version && ["light","soft","hard"].includes(update.mode)){
					io.emit("medialum-update", update)
				}
			})

			socket.on("typing", target => {
				sockets.filter(s => s.user_id == target).forEach(s => {
					s.emit("typing", socket.user_id)
				})
			})

			socket.on('create-group', async newGroup => {
				//nombre default del grupo
				newGroup.name = "Chat grupal";
						
				//limpia si hay repetidos
				newGroup.users = [...new Set(newGroup.users)]
		
				//pone primero al usuario que creo el grupo
				newGroup.users = newGroup.users.filter(u => u !== socket.user_id);
				newGroup.users.unshift(socket.user_id);
				
				newGroup.id = await db_methods.createGroup(newGroup);
				
				newGroup.users.forEach((u, i) => {
					if(i == 0){
						db_methods.insertStatus(newGroup.id, {status_type: "group-created", by: socket.user_id });
					} else {
						db_methods.insertStatus(newGroup.id, {status_type: "group-added", who: u, by: socket.user_id });
					}
				});
				
				//agrega el nuevo grupo al objeto de grupos
				groups.push(newGroup);
				
				//loguea
				console.log(`Se creo un grupo con ${groups.users.length} usuarios`);
				
				newGroup.users.forEach(u => {
					sockets.filter(s => s.user_id === u).forEach(s => {
						s.emit('new-group', newGroup)
					})
				})
			})

			socket.on("add-to-group", data => {			
				const targetGroup = groups.find(g => g.id == utils.getGroupID(data.id))

				//el usuario que agrega gente tiene que estar en el grupo
				if(!targetGroup || !targetGroup.users.find(u => u == socket.user_id)){
					return;
				}
				
				//todos los usuarios viejos antes de agregar
				const oldUsers = [...targetGroup.users];
				const newUsers = [];

				data.users.forEach(u => {
					u = parseInt(u);
					if(!targetGroup.users.find(userInGroup => u == userInGroup)){
						targetGroup.users.push(u)
						db_methods.addMemberToGroup(u, targetGroup.id);

						db_methods.insertStatus(targetGroup.id, {type: "group-added", who: u, by: socket.user_id} );
						newUsers.push(u)
					}
				})

				oldUsers.forEach(u => {
					const usersAdded = {
						users: newUsers,
						id: targetGroup.id,
						by: socket.user_id
					}

					sockets.filter(s => s.user_id == u ).forEach(s => {
						s.emit("new-users-group", usersAdded)
					})
				})

				//le manda a los nuevos un msj con new-group
				newUsers.forEach(u => {
					const usersAdded = {
						users: newUsers,
						id: targetGroup.id,
						name: targetGroup.name,
						newusers: newUsers,
						by: socket.user_id
					}

					//TODO: ESTA BIEN ESTO? NO DEBERIA SER new-group y no new-users-group ?
					sockets.filter(s => s.user_id == u).forEach(s => {
						s.emit("new-users-group", usersAdded)
					})
				})
			})

			socket.on('load-historial', async data => {				
				const senderUser = allUserData.find(u => u.id == socket.user_id);

				let historial = [];

				historial = await db_methods.getHistorial(senderUser.id, data.target, data.from);

				const allHistorial = {
					historial: historial.length > 0 ? historial : "end",
					target: data.target
				}

				socket.emit("historial", allHistorial)
			});

			socket.on('ms-check', () => {
				socket.emit('ms-check');
			})

			socket.on('seen', entity => {
				if (utils.isGroup(entity)) {
					const group_id = utils.getGroupID(entity);
					db_methods.groupMessagesSeen(socket.user_id, group_id);
				} else {				    
					db_methods.usernameMessagesSeen(socket.user_id, entity);					
					sockets.filter(s => s.user_id == entity).forEach(s => {
						s.emit("seen_by", socket.user_id)
					})
				}
			})
		})

		socket.on('disconnect', () => {
			const socketIndex = sockets.findIndex(s => s.id == socket.id)
			if(socketIndex > -1) {
				sockets.splice(socketIndex, 1)
				if(sockets.findIndex(s => s.user && s.user_id === socket.user_id) <= -1){
					db_methods.disconnectedUser(socket.user_id);
					sockets.forEach(s => {
						if(s.user && utils.rolesCheck(allUserData.find(u => u.id == socket.user_id).roles, allUserData.find(u => u.id == s.user_id).roles)){
							s.emit('disconnected', socket.user_id)
						}
					})
				}
			}

			console.log('user disconnected');
		});
	});

	http.listen(3000, () => {
		console.log('listening on *:3000');
	});

})();
		
// 		switch($type){
// 		    case "ms-check":
// 		        send_message(json_encode(array("type"=>"pong","when"=>$tst_msg->when)),$user["username"]);
// 		        break;
		
// 			case "exit-group":
// 				$json = array("type"=>"exit-user-group","who"=>$user["username"],"group_id"=>$tst_msg->id);
				
// 				exitGroup(getUserID($user["username"]),getGroupID($tst_msg->id));
				
// 				for($i=0;$i<count($groups);$i++){
// 					if($groups[$i]["id"]==$tst_msg->id && array_search($user["username"],$groups[$i]["users"]) !== false){
// 						for($j=0;$j<count($groups[$i]["users"]);$j++){
// 							send_message(json_encode($json),$groups[$i]["users"][$j]);
// 						}
// 						array_splice($groups[$i]["users"],array_search($user["username"],$groups[$i]["users"]),1);
						
// 						$get_group_id = getGroupID($groups[$i]["id"]);
						
// 						insertStatus($get_group_id,json_encode(array("type"=>"status","type"=>"group-exit","who"=>$user["username"])));
// 						if(count($groups[$i]["users"])<=0){
// 							//si tiene 0 usuarios, borra el grupo.
// 							array_splice($groups,$i,1);
// 							//deleteGroup($get_group_id);
// 						} else if(count($groups[$i]["users"])==1){
// 							insertStatus($get_group_id,json_encode(array("type"=>"status","type"=>"you-are-alone")));
// 						}
// 						break;
// 					}
// 				}
				
// 				break;
				
// 			case "change-group-name":
// 				//el usuario que agrega gente tiene que estar en el grupo
// 				$encontrado=false;
// 				$group_index;
				
// 				for($i=0; $i<count($groups); $i++){
// 					if($groups[$i]["id"]==$tst_msg->id){
// 						$group_index = $i;
// 						for($j=0;$j<count($groups[$i]["users"]);$j++){
// 							if($groups[$i]["users"][$j]==$user["username"]){
// 								$encontrado=true;
// 								break 2;
// 							}
// 						}
// 					}
// 				}
				
// 				if(!$encontrado){
// 					return;
// 				}
// 				//fin checkeo de usuario
				
// 				$final_name = $tst_msg->name;
				
// 				if(strlen($final_name)>22){
// 					$final_name = mb_substr($final_name,0,22);
// 				}
				
// 				if($final_name==""){
// 					return;
// 				}
				
// 				$json = array("type"=>"group-name-change","name"=>$final_name,"group_id"=>$tst_msg->id, "by"=>$user["username"]);
// 				$groups[$group_index]["name"] = $final_name;
				
// 				$group_id = getGroupID($groups[$group_index]["id"]);
				
// 				changeGroupName($group_id,$final_name,$user["username"]);
				
// db_methods.insertStatus(group_id, 
// 	{type: "group_name_change", 
// 	group_name_change_from: from,
// 	group_name_change_to: name,
// 	by});

// 				for($i=0;$i<count($groups[$group_index]["users"]);$i++){
// 					send_message(json_encode($json),$groups[$group_index]["users"][$i]);
// 				}
				
// 				break;
				
// 			case "seen":

// 				break;
				
// 			case "load-historial":
// 				$from = $tst_msg->from;
// 				$target = $tst_msg->target;
				
// 				if (strpos($target, GROUPS_PREFIX) !== false) {
// 					$group_id = getGroupID($target);
// 					$historial = getHistorial(getUserID($user["username"]),$group_id,$from,true);
// 				} else {
// 					$historial = getHistorial(getUserID($user["username"]),getUserID($target),$from,false);
// 				}
				
// 				send_message(json_encode(array("type"=>"historial","historial"=>(($historial!=false)?$historial:"end"),"target"=>$target)),$user["username"]);
				
// 				break;
				
// 			case "clear-messages":				
// 				clearMessages(getUserID($user["username"]),$tst_msg->entity);
// 				break;
				
// 			case "clear-single-message":		
// 				clearSingleMessage(getUserID($user["username"]),$tst_msg->entity,$tst_msg->date,$tst_msg->offset);
// 				break;
// 			case "update-token":	
// 				updateToken($user["username"],$tst_msg->token,$tst_msg->is_mobile);
// 				break;
				
// 			case "survey":
// 				try{
// 					$survey = $tst_msg->survey;
					
// 					$survey->text = trim($survey->text);
					
// 					//valida tipo
// 					if($survey->type !== "anonymous" && $survey->type !== "not-anonymous") {
// 						throw new Exception('Invalid survey option.');
// 					}
					
// 					//valida survey text
// 					if($survey->text==="" || $survey->text==null || strlen($survey->text) > 100) {
// 						throw new Exception('Invalid survey text.');
// 					}
					
// 					//valida opciones
// 					if(count($survey->options)<1 || count($survey->options)>10){
// 						throw new Exception('Invalid survey options quantity: '.count($survey->options));
// 					}
					
// 					foreach($survey->options as $option){
// 						if($option==="" || $option==null || strlen($option) > 200) {
// 							throw new Exception('Invalid survey option: '.$option);
// 						}
// 					}
					
// 					$group_id = $tst_msg->group_id;
// 					$random_id = $tst_msg->randomID;
						
// 					$users_in_group = array();
						
// 					for($i=0;$i<count($groups);$i++){
// 						if($groups[$i]["id"]==$group_id){
// 							$users_in_group = $groups[$i]["users"];
// 						}
// 					}
						
// 					//checkea que el usuario que manda el msj este en el grupo
// 					$is_in_group = false;
// 					for($i=0;$i<count($users_in_group);$i++){
// 						if($users_in_group[$i]==$user["username"]){
// 							$is_in_group=true;
// 							break;
// 						}
// 					}
						
// 					if($is_in_group){
// 						//todo fue validado, y crea en la base la survey
// 						$surveyID = insertSurvey($group_id,$survey);
// 						$survey->id = $surveyID;
// 						for($i=0;$i<count($users_in_group);$i++){
// 							$json = array('type'=>'survey', 'username'=>$user["username"], 'message'=>json_encode($survey), 'randomID'=>$random_id, 'target'=>$group_id);
// 							send_message(json_encode($json),$users_in_group[$i]);
// 						}
// 					}
					
// 					insertMessage($user["id"],$group_id,json_encode($survey),3, null);

// 				} catch (Exception $e){
// 					echo 'Exception: ',  $e->getMessage(), "\n";
// 				}
				
// 				break;
// 			case "survey-vote":
// 				//se fija si ya voto
// 				try{
// 					$vote = $tst_msg->vote;
// 					$survey_id = (int)$vote->survey_id;
					
// 					if(checkSurveyVote($user["id"],$survey_id)){
// 						$option_index = (int)$vote->option_index;
						
// 						voteSurvey($user["id"],$survey_id,$option_index);
					
// 						$data = array("type"=>"survey-voted","survey_id"=>$survey_id,"option_index"=>$option_index);
						
// 						send_all_message(json_encode($data),$user["roles"]);
// 					}
// 				} catch (Exception $e){
// 					echo 'Exception: ',  $e->getMessage(), "\n";
// 				}
				
// 				break;
// 			default:
// 				sendError($clientID,"Salio por el default del switch (Osea que el type del mensaje no esta contemplado)");
// 				break;
// 		}
// 	} else {
// 		sendError($clientID,"No esta seteado el type en el mensaje");
// 	}
// }