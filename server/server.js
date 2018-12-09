const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Database = require('./Database');
const database = new Database({host: "localhost", user: "root", password: "", database: "learchat"});
module.exports = database;

const db_methods = require('./db_methods')
const utils = require('./utils')

const { promisify } = require('util');
const sizeOf = promisify(require('image-size'));

const sockets = [];
let allUserData = []
let groups = []

const init = async () => {

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
				
				const user = { 
					state: registration.state ? registration.state : "online",
					id: result.id, 
				}

				socket.user = user;

				//get all users data of user (except users without the required roles)
				const userUsersData = await db_methods.getAllUsersDataOfUser(socket.user.id);
				socket.emit('all-users', userUsersData)

				//get all groups of user
				const userGroups = groups.filter(g => g.users.filter(u => { u == socket.user.id }));
				socket.emit('group-list', userGroups);

				//once data and groups are retrieved, get order and unread messages
				db_methods.getEntitiesOrder(socket.user.id).then(result => {
					socket.emit('order', result);
				})

				db_methods.getUnreadMessages(socket.user.id).then(result => {
					socket.emit('unread_messages', result);
				})
				
				sockets.forEach(s => {
					if(s.user && utils.rolesCheck(allUserData[socket.user.id].roles, allUserData[s.user.id].roles)){
						s.emit('connected', socket.user.id)
						console.log("Se conecto "+socket.user.id)
					}
				})

				socket.on('message', data => {
					data.message = utils.escapeHtml(data.message.trim())
					const senderUser = allUserData[socket.user.id];

					if(!utils.isGroup(data.target)){

						const targetUser = allUserData[data.target];

						if(utils.rolesCheck(targetUser.roles, senderUser.roles)){
							//prepare data to be sent to client
							const newMessage = {
								type: "message", 
								from: senderUser.id, 
								message: data.message, 
								randomID: data.randomID, 
								target: targetUser.target
							};
							
							//send message to all sender instances
							sockets.filter( s => s.user.id === senderUser.id).forEach(s => {
								socket.emit("message", newMessage);
							})

							//send message to all target instances
							sockets.filter( s => s.user.id === targetUser.id).forEach(s => {
								s.emit("message", newMessage)
							})
							
							db_methods.insertMessage(senderUser.id, targetUser.id, newMessage.message, false, 0, null);
						}
					} else {
						const targetGroup = groups.find(g => g.id == data.target)

						//checkea que el usuario que manda el msj este en el grupo
						if(!targetGroup || !targetGroup.users.find(u => u.id == senderUser.id)){
							return;
						}
						
						targetGroup.users.forEach(u => {
							const newMessage = {
								type: "message",
								from: senderUser.id,
								message: data.message,
								randomID: data.randomID,
								target: targetGroup.id
							}

							//send message to all sender instances
							sockets.filter( s => s.id == u).forEach(s => {
								socket.emit("message", newMessage);
							})
						})
						
						db_methods.insertMessage(senderUser.id, targetGroup.id, data.message, true, 0, null);
					}	
				})
			})

			socket.on("file", async data => {
				data.file = utils.escapeQuotes(data.file); //message text

				const filesize = await sizeOf(data.file);
				data.data = JSON.stringify(filesize);

				const senderUser = allUserData[socket.user.id];

				if(!utils.isGroup(data.target)){

					const targetUser = allUserData.find(d => d.id === data.target);

					//prepare data to be sent to client
					const newMessage = {
						type: "file", 
						from: senderUser.id, 
						message: data.file, 
						randomID: data.randomID, 
						target: targetUser.target,
						data: data.data
					};
					
					//send message to all sender instances
					sockets.filter( s => s.user.id === senderUser.id).forEach(s => {
						socket.emit("message", newMessage);
					})

					//send message to all target instances
					sockets.filter( s => s.user.id === targetUser.id).forEach(s => {
						s.emit("message", newMessage)
					})
					
					db_methods.insertMessage(senderUser.id, targetUser.id, data.file, false, 1, data.data);
				} else {
					//group
					const targetGroup = groups.find(g => g.id == data.target)
					
					//checkea que el usuario que manda el msj este en el grupo
					if(!targetGroup || !targetGroup.users.find(u => u.id == senderUser.id)){
						return;
					}
					
					targetGroup.users.forEach(u => {
						const newMessage = {
							type: "file", 
							from: senderUser.id, 
							message: data.file, 
							randomID: data.randomID, 
							target: targetUser.target,
							data: data.data
						}

						//send message to all sender instances
						sockets.filter( s => s.user.id == u).forEach(s => {
							socket.emit("message", newMessage);
						})
					})
					
					db_methods.insertMessage(senderUser.id, targetGroup.id, data.file, true, 1, data.data);
				}	
			})

			socket.on("state", data => {

				const senderUser = allUserData[socket.user.id];

				if(!["online","away","busy"].includes(data.state)){
					return;
				}

				sockets.forEach(s => {
					if(s.user && s.user.id == senderUser.id){
						s.user.state = data.state
					}
				})
				
				const stateChange = {
					user_id: senderUser.id,
					state: data.state
				}
				
				sockets.forEach(s => {
					if(utils.rolesCheck(senderUser.user.roles, allUserData[s.user.id].roles)){
						s.emit('updatestate', stateChange)
					}
				})
			})

			socket.on('updatepic', group_id => {
				const senderUser = allUserData[socket.user.id];

				let entity = group_id ? group_id : senderUser.id;
				
				sockets.forEach(s => {
					if(utils.rolesCheck(senderUser.user.roles, allUserData[s.user.id].roles)){
						s.emit('updatepic', entiy)
					}
				})
			})

			socket.on('updateuser', data => {
				const senderUser = allUserData[socket.user.id];

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
					if(utils.rolesCheck(senderUser.user.roles, allUserData[s.user.id].roles)){
						s.emit('updateuser', userUpdated)
					}
				})
			})

			socket.on("update-ready", update => {
				if(update.mode && update.version && ["light","soft","hard"].includes(update.mode)){
					io.emit("medialum-update", update)
				}
			})

			socket.on("typing", data => {
				sockets.filter(s => {s.user.id === data.target}).forEach(s => {
					s.emit("typing", {user_id: socket.user.id, at: data.target})
				})
			})

			socket.on('create-group', async newGroup => {
				//nombre default del grupo
				newGroup.name = "Chat grupal";
						
				//limpia si hay repetidos
				newGroup.users = [...new Set(newGroup.users)]
		
				//pone primero al usuario que creo el grupo
				newGroup.users = newGroup.users.filter(u => u !== socket.user.id);
				newGroup.users.unshift(socket.user.id);
				
				newGroup.id = await db_methods.createGroup(newGroup);
				
				newGroup.users.forEach((u, i) => {
					if(i == 0){
						insertStatus(newGroup.id, {type: "status", status_type: "group_created", by: socket.user.id });
					} else {
						insertStatus(newGroup.id, {type: "status", status_type: "group_added", who: u, by: socket.user.id });
					}
				});
				
				//agrega el nuevo grupo al objeto de grupos
				groups.push(newGroup);
				
				//loguea
				console.log(`Se creo un grupo con ${groups.users.length} usuarios`);
				
				newGroup.users.forEach(u => {
					sockets.filter(s => s.user.id === u).forEach(s => {
						s.emit('new-group', newGroup)
					})
				})
			})

			socket.on("add-to-group", data => {			
				const targetGroup = groups.find(g => g.id == data.id)
					
				//el usuario que agrega gente tiene que estar en el grupo
				if(!targetGroup || !targetGroup.users.find(u => u.id == socket.user.id)){
					return;
				}
				
				//todos los usuarios viejos antes de agregar
				const oldUsers = [...targetGroup.users];
				const newUsers = [];

				data.users.forEach(u => {
					if(!targetGroup.users.includes(u)){
						targetGroup.users.push(u)
						db_methods.addMemberToGroup(u, targetGroup.id);

						const statusMessage = {
							type: "status",
							status_type: "group_added",
							who: u,
							by: socket.user.id
						}

						db_methods.insertStatus(targetGroup.id, statusMessage);
						newUsers.push(u)
					}
				})

				oldUsers.forEach(u => {
					const usersAdded = {
						users: newUsers,
						id: targetGroup.id,
						by: socket.user.id
					}

					sockets.filter(s => { s.user.id == u }).emit("new-users-group", usersAdded)
				})

				//le manda a los nuevos un msj con new-group
				newUsers.forEach(u => {
					const usersAdded = {
						users: newUsers,
						id: targetGroup.id,
						name: targetGroup.name,
						newusers: newUsers,
						by: socket.user.id
					}

					//TODO: ESTA BIEN ESTO? NO DEBERIA SER new-group y no new-users-group ?
					sockets.filter(s => { s.user.id == u }).emit("new-users-group", usersAdded)
				})
			})

			socket.on('load-historial', async data => {				
				const senderUser = allUserData[socket.user.id];

				let historial = [];

				if (utils.isGroup(data.target)) {
					historial = await db_methods.getHistorial(senderUser.id, utils.getGroupID(data.target), data.from, true);
				} else {
					historial = await db_methods.getHistorial(senderUser.id, data.target, data.from, false);
				}
				
				const allHistorial = {
					historial: historial.length > 0 ? historial : "end",
					target: data.target
				}

				socket.emit("historial", allHistorial)
			});
		})

		socket.on('disconnect', () => {
			const socketIndex = sockets.findIndex(s => s.id == socket.id)
			if(socketIndex > -1) {
				sockets.splice(socketIndex, 1)
				if(sockets.findIndex(s => s.user && s.user.id === socket.user.id) <= -1){
					db_methods.disconnectedUser(socket.user.id);
					sockets.forEach(s => {
						if(s.user && utils.rolesCheck(senderUser.user.roles, allUserData[s.user.id].roles)){
							s.emit('disconnected', socket.user.id)
						}
					})
				}
			}

			console.log('user disconnected');
		});
	});

	http.listen(3000, function(){
		console.log('listening on *:3000');
	});

}

init();
		
// 		switch($type){
// 		    case "ping":
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
						
// 						insertStatus($get_group_id,json_encode(array("type"=>"status","status-type"=>"group_exit","who"=>$user["username"])));
// 						if(count($groups[$i]["users"])<=0){
// 							//si tiene 0 usuarios, borra el grupo.
// 							array_splice($groups,$i,1);
// 							//deleteGroup($get_group_id);
// 						} else if(count($groups[$i]["users"])==1){
// 							insertStatus($get_group_id,json_encode(array("type"=>"status","status-type"=>"you_are_alone")));
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
				
// 				for($i=0;$i<count($groups[$group_index]["users"]);$i++){
// 					send_message(json_encode($json),$groups[$group_index]["users"][$i]);
// 				}
				
// 				break;
				
// 			case "seen":
// 				$entity = $tst_msg->entity;
				
// 				if (strpos($entity, GROUPS_PREFIX) !== false) {
// 					$group_id = getGroupID($entity);
// 					groupMessagesSeen(getUserID($user["username"]),$group_id);
// 				} else {				    
// 					usernameMessagesSeen(getUserID($user["username"]),getUserID($entity));
// 					$json = array("type"=>"seen_by","username"=>$user["username"]);
// 					send_message(json_encode($json),$entity);
// 				}
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
					
// 					insertMessage($user["id"],$group_id,json_encode($survey),true,3, null);

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