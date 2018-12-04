const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Database = require('./server/Database');
const database = new Database({host: "localhost", user: "root", password: ""});
const db_methods = require('./server/db_methods')
const utils = require('./server/utils')

const sockets = [];
const allUserData = []

io.on('connection', function(socket){
	console.log('a user connected');
	
	socket.on('register', data => {
		db_methods.login(data.username, data.password).then(result => {
			console.log('login successful');

			//get all user roles
			const roles = await db_methods.getRolesByID(result.id);
			
			const user = { 
				username: result.username,
				state: data.state ? data.state : "online",
				id: result.id, 
				socket
			}
			socket.user = user;
			sockets.push(user);

			//get all users data (except users without the required roles)
			const usersProm = db_methods.getAllUsersDataOfUser(socket.user.username).then(result => {
				socket.emit('all-users', result)
			}, () => { console.error("Cannot retrieve all users.") })
			
			//get all groups
			const groupsProm = db_methods.getGroupListByUsername(socket.user.username).then(result => {
				socket.emit('group-list', result);
			}, () => { console.error("Cannot retrieve group list.") })

			//once data and groups are retrieved, get order and unread messages
			Promise.all([usersProm, groupsProm]).then(() => {
				db_methods.getEntitiesOrder(socket.user.id).then(result => {
					socket.emit('order', result);
				})

				db_methods.getUnreadMessages(socket.user.id).then(result => {
					socket.emit('unread_messages', result);
				})
			}, () => { console.error("Cannot retrieve order and unread messages.") })
		
			sockets.forEach(s => {
				if(utils.rolesCheck(socket.user.roles, s.roles)){
					s.emit('connected', socket.username)
					console.log("Se conecto "+socket.username)
				}
			})

			socket.on('message', data => {
				data.message = utils.escapeHtml(data.message.trim())
				
				if(!utils.isGroup(data.target)){

					const targetUser = allUserData.find(d => d.username === data.target);
					const senderUser = allUserData.find(d => d.username === data.target);

					if(utils.checkRoles(targetUser.roles, senderUser.roles)){
						//prepare data to be sent to client
						const newMessage = {
							type: "message", 
							username: senderUser.username, 
							message: data.message, 
							randomID: data.randomID, 
							target: targetUser.target
						};
						
						//send message to all sender instances
						sockets.filter( s => s.username === senderUser.username).forEach(s => {
							socket.emit("usrmsg", newMessage);
						})

						//send message to all target instances
						sockets.filter( s => s.username === targetUser.username).forEach(s => {
							s.emit("usrmsg", newMessage)
						})
						
						db_methods.insertMessage(senderUser.id, targetUser.id, newMessage.message, false, 0, null);
					}
				} else {
					$currentGroup = null;sam
					$users_in_group = array();
					
					for($i=0;$i<count($groups);$i++){
						if($groups[$i]["id"]==$tst_msg->target){
							$currentGroup = $groups[$i];
							$users_in_group = $currentGroup["users"];
						}
					}

					//checkea que el usuario que manda el msj este en el grupo
					$is_in_group = false;
					for($i=0;$i<count($users_in_group);$i++){
						if($users_in_group[$i]==$user_username){
							$is_in_group=true;
							break;
						}
					}

					if(!$is_in_group){
						return;
					}
					
					for($i=0;$i<count($users_in_group);$i++){
						$json = array('type'=>'usermsg', 'username'=>$user_username, 'message'=>$user_message, 'randomID'=>$random_id, 'target'=>$tst_msg->target);
						send_message(json_encode($json),$users_in_group[$i]);
					}
					
					insertMessage($user["id"],$tst_msg->target,$user_message,true,0, null);
				}	
			})
		})
	})

    socket.on('disconnect', () => {
		if(socket.id && sockets[socket.id]){
			delete sockets[socket.id];
			console.log('logged out '+sockets.username+' disconnected');
		}

		console.log('user disconnected');
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});

// when a client sends data to the server
function wsOnMessage($clientID, $message, $messageLength, $binary) {
	global $Server;
	global $clients;
	global $groups;
	global $allUsersData;
	
	$tst_msg = json_decode($message); //json decode

	if (isset($tst_msg->type)){
		$type = $tst_msg->type;
		
		$user = null;
		
		if($type!=="register" && $type!=="update-ready"){
			$user = getUsuarioByClientId($clientID);
			
			if($user==null){
				sendError($clientID,"El usuario es null cuando type=".$type,true);
				return;
			}
		}
		
		switch($type){
		    case "ping":
		        send_message(json_encode(array("type"=>"pong","when"=>$tst_msg->when)),$user["username"]);
		        break;
		    
			case "message":

				
				
			case "file":
				$user_username = $user["username"];//sender username
				$file = htmlspecialchars($tst_msg->file); //message text
				$target = $tst_msg->target;
				
				$random_id = $tst_msg->randomID;

				$filedata = getImageData($file);
				unset($filedata[3]);
				if(!isGroup($target)){
					//not group
					$response_text = json_encode(array('type'=>'file', 'username'=>$user_username, 'message'=>$file, 'randomID'=>$random_id, 'target'=>$target,'data' => json_encode($filedata)));
					send_message_both($response_text, $target, $user_username); //send data
					
					insertMessage($user["id"],getUserID($target), $file, false, 1, json_encode($filedata));
				} else {
					//group
					$users_in_group = array();
					
					for($i=0;$i<count($groups);$i++){
						if($groups[$i]["id"] == $target){
							$users_in_group = $groups[$i]["users"];
						}
					}
					
					//checkea que el usuario que manda el msj este en el grupo
					$is_in_group = false;
					for($i=0;$i<count($users_in_group);$i++){
						if($users_in_group[$i] == $user_username){
							$is_in_group = true;
							break;
						}
					}
					
					if($is_in_group){
						for($i=0;$i<count($users_in_group);$i++){
							$json = json_encode(array('type'=>'file', 'username'=> $user_username, 'message'=>$file, 'randomID'=>$random_id, 'target'=>$target, 'data' => json_encode($filedata)));
							send_message($json, $users_in_group[$i]);
						}
					}
					
					insertMessage($user["id"], $target, $file, true, 1, json_encode($filedata));
				}
				
				break;
			
			case "register":
				$user_username = $tst_msg->username;
				$user_password = $tst_msg->password;
				$user_state = $tst_msg->state;
			
				if(login($user_username,$user_password)){
					
					$this_user_id = getUserID($user_username);
					
					$roles = getRolesByID($this_user_id);
					
					$user_data=array('username'=>$user_username,'state'=>$user_state,'id'=>$this_user_id, 'roles'=>$roles);
					
					//agrega usuario	
					$clients[] = array("id"=>$clientID,"user"=>$user_data);

					send_message(json_encode(array("type"=>"registration_success")),$user_username);
					
					send_message(json_encode(array('type'=>'all-users',"data"=>getAllUsersDataOfUser($user_username))),$user_username);
					
					send_message(json_encode(getGroupListByUsername($user_username)),$user_username);
					
					refreshUserList($roles);
					
					send_message(json_encode(array("type"=>"order","users"=>getEntitiesOrder($this_user_id))),$user_username);
					send_message(json_encode(array("type"=>"unread_messages","messages"=>getUnreadMessages($this_user_id))),$user_username);
					
					$Server->log("Se conecto ".$user_username." (clientID: ".$clientID.")");
					break;
				} else {
					sendError($clientID,"Se loguearon con un usuario incorrecto.",false);
					$Server->wsSend($clientID, json_encode(array("type"=>"invalid_username")));
					return;
				}
			
			case "state":
				$username = $user["username"];
				$state = $tst_msg->state;
				
				if (!isset($tst_msg->type)){
					$state = "online";
				}

				foreach($clients as $key => $client){
					if($client["user"]["username"]==$username){
						$clients[$key]["user"]["state"]=$state;
					}
				}
				
				$json = array("type"=>"updatestate","username"=>$username, "state"=>$state);
				send_all_message(json_encode($json),$user["roles"]);
				break;
			case "updatepic":
				$entity = $user["username"];
				
				if(isset($tst_msg->group_id)){
				    $entity = $tst_msg->group_id;
				}
				
				$json = array("type"=>"updatepic","entity"=>$entity);
				send_all_message(json_encode($json),$user["roles"]);
				break;
			
			case "updateuser":
			    $user_updated = $tst_msg->username;
			    $data = $allUsersData[$user_updated];
			    $removedData = array();
			    
			    $removedData["username"] = $data["username"];
			    $removedData["apodo"] = $data["apodo"];
			    $removedData["celular"] = $data["celular"];
			    $removedData["nombre"] = $data["nombre"];
			    $removedData["email"] = $data["email"];
			    $removedData["nick"] = $data["nick"];
			    
			    send_all_message(json_encode(array("type"=>"updateuser","userdata"=>$removedData)), $user["roles"]);
				break;
			
			case "update-ready":
			    if(isset($tst_msg->mode) && isset($tst_msg->version) && ( $tst_msg->mode === "light" || $tst_msg->mode === "soft" || $tst_msg->mode === "hard")){
    				$json = array("type"=>"medialum-update","mode"=>$tst_msg->mode, "version"=>$tst_msg->version);
    				send_all_message(json_encode($json),null);
			    }
				break;
			case "typing":
				$username = $user["username"];
				$target = $tst_msg->target;

				$json = array("type"=>"typing","username"=>$username, "at"=>$target);

				send_message(json_encode($json),$target);
				
				break;
			case "create-group":
				//nombre default del grupo
				$default_group_name = "Chat grupal";
				
				//limpia si hay repetidos
				$usersArray = array_unique($tst_msg->users);

				//pone primero al usuario que creo el grupo
				array_unshift($usersArray,$user["username"]);
				
				$created_group_id = createGroup($usersArray,$default_group_name);
				
				foreach($usersArray as $key => $u){
					if($key==0){
						insertStatus($created_group_id,json_encode(array("type"=>"status","status-type"=>"group_created","by"=>$user["username"])));
					} else {
						insertStatus($created_group_id,json_encode(array("type"=>"status","status-type"=>"group_added","who"=>$u,"by"=>$user["username"])));
					}
				}
				
				//crea grupo en db
				$new_group_id = GROUPS_PREFIX.$created_group_id;
				
				$json = array("type"=>"new-group","users"=>$usersArray,"id"=>$new_group_id,"name"=>$default_group_name);
				
				//agrega data al objeto de grupo
				$groups[] = array("id"=>$json["id"],"users"=>$json["users"],"name"=>$default_group_name);
				
				//loguea
				$Server->log( "Se creo un grupo con ".(count($usersArray))." usuarios");
				
				for($i=0; $i<count($usersArray); $i++){
					//aviso a los agregados
					send_message(json_encode($json),$usersArray[$i]);
				}
				
				break;
			case "add-to-group":
				$group_index;
				
				//el usuario que agrega gente tiene que estar en el grupo
				$encontrado = false;
				for($i=0; $i<count($groups); $i++){
					if($groups[$i]["id"]==$tst_msg->id){
						$group_index = $i;
						for($j=0;$j<count($groups[$i]["users"]);$j++){
							if($groups[$i]["users"][$j]==$user["username"]){
								$encontrado=true;
								break 2;
							}
						}
					}
				}
				
				if(!$encontrado){
					return;
				}
				//fin checkeo de usuario
				
				//usuarios nuevos a agregar
				$newUsers = $tst_msg->users;
				
				//todos los usuarios viejos antes de agregar
				$oldUsers = $groups[$group_index]["users"];
				
				$addedUsers = array();
				
				//agrega los usuarios al grupo
				for($i=0;$i<count($newUsers);$i++){
					if(!in_array($newUsers[$i],$groups[$group_index]["users"])){
						array_push($groups[$group_index]["users"],$newUsers[$i]);
						array_push($addedUsers,$newUsers[$i]);
						//agrego usuario a la db
						addMemberToGroup(getUserID($newUsers[$i]),getGroupID($groups[$group_index]["id"]));
						insertStatus(getGroupID($groups[$group_index]["id"]),json_encode(array("type"=>"status","status-type"=>"group_added","who"=>$newUsers[$i],"by"=>$user["username"])));
					}
				}
				
				if(count($addedUsers)>0){
					
					$Server->log("Se agregaron usuarios al grupo (".count($addedUsers).")");
					
					//le manda a los viejos un msj con new-users-group
					for($i=0; $i<count($oldUsers); $i++){
						$json = array("type"=>"new-users-group","users"=>$addedUsers,"id"=>$tst_msg->id,"by"=>$user["username"]);
						send_message(json_encode($json),$oldUsers[$i]);
					}
					
					//le manda a los nuevos un msj con new-group
					for($i=0; $i<count($newUsers); $i++){
						$json = array("type"=>"new-users-group","users"=>$groups[$group_index]["users"],"id"=>$tst_msg->id,"name"=>$groups[$group_index]["name"],"newusers"=>$addedUsers,"by"=>$user["username"]);
						send_message(json_encode($json),$newUsers[$i]);
					}
				}
				
				break;
				
			case "exit-group":
				$json = array("type"=>"exit-user-group","who"=>$user["username"],"group_id"=>$tst_msg->id);
				
				exitGroup(getUserID($user["username"]),getGroupID($tst_msg->id));
				
				for($i=0;$i<count($groups);$i++){
					if($groups[$i]["id"]==$tst_msg->id && array_search($user["username"],$groups[$i]["users"]) !== false){
						for($j=0;$j<count($groups[$i]["users"]);$j++){
							send_message(json_encode($json),$groups[$i]["users"][$j]);
						}
						array_splice($groups[$i]["users"],array_search($user["username"],$groups[$i]["users"]),1);
						
						$get_group_id = getGroupID($groups[$i]["id"]);
						
						insertStatus($get_group_id,json_encode(array("type"=>"status","status-type"=>"group_exit","who"=>$user["username"])));
						if(count($groups[$i]["users"])<=0){
							//si tiene 0 usuarios, borra el grupo.
							array_splice($groups,$i,1);
							//deleteGroup($get_group_id);
						} else if(count($groups[$i]["users"])==1){
							insertStatus($get_group_id,json_encode(array("type"=>"status","status-type"=>"you_are_alone")));
						}
						break;
					}
				}
				
				break;
				
			case "change-group-name":
				//el usuario que agrega gente tiene que estar en el grupo
				$encontrado=false;
				$group_index;
				
				for($i=0; $i<count($groups); $i++){
					if($groups[$i]["id"]==$tst_msg->id){
						$group_index = $i;
						for($j=0;$j<count($groups[$i]["users"]);$j++){
							if($groups[$i]["users"][$j]==$user["username"]){
								$encontrado=true;
								break 2;
							}
						}
					}
				}
				
				if(!$encontrado){
					return;
				}
				//fin checkeo de usuario
				
				$final_name = $tst_msg->name;
				
				if(strlen($final_name)>22){
					$final_name = mb_substr($final_name,0,22);
				}
				
				if($final_name==""){
					return;
				}
				
				$json = array("type"=>"group-name-change","name"=>$final_name,"group_id"=>$tst_msg->id, "by"=>$user["username"]);
				$groups[$group_index]["name"] = $final_name;
				
				$group_id = getGroupID($groups[$group_index]["id"]);
				
				changeGroupName($group_id,$final_name,$user["username"]);
				
				for($i=0;$i<count($groups[$group_index]["users"]);$i++){
					send_message(json_encode($json),$groups[$group_index]["users"][$i]);
				}
				
				break;
				
			case "seen":
				$entity = $tst_msg->entity;
				
				if (strpos($entity, GROUPS_PREFIX) !== false) {
					$group_id = getGroupID($entity);
					groupMessagesSeen(getUserID($user["username"]),$group_id);
				} else {				    
					usernameMessagesSeen(getUserID($user["username"]),getUserID($entity));
					$json = array("type"=>"seen_by","username"=>$user["username"]);
					send_message(json_encode($json),$entity);
				}
				break;
				
			case "load-historial":
				$from = $tst_msg->from;
				$target = $tst_msg->target;
				
				if (strpos($target, GROUPS_PREFIX) !== false) {
					$group_id = getGroupID($target);
					$historial = getHistorial(getUserID($user["username"]),$group_id,$from,true);
				} else {
					$historial = getHistorial(getUserID($user["username"]),getUserID($target),$from,false);
				}
				
				send_message(json_encode(array("type"=>"historial","historial"=>(($historial!=false)?$historial:"end"),"target"=>$target)),$user["username"]);
				
				break;
				
			case "clear-messages":				
				clearMessages(getUserID($user["username"]),$tst_msg->entity);
				break;
				
			case "clear-single-message":		
				clearSingleMessage(getUserID($user["username"]),$tst_msg->entity,$tst_msg->date,$tst_msg->offset);
				break;
			case "update-token":	
				updateToken($user["username"],$tst_msg->token,$tst_msg->is_mobile);
				break;
				
			case "survey":
				try{
					$survey = $tst_msg->survey;
					
					$survey->text = trim($survey->text);
					
					//valida tipo
					if($survey->type !== "anonymous" && $survey->type !== "not-anonymous") {
						throw new Exception('Invalid survey option.');
					}
					
					//valida survey text
					if($survey->text==="" || $survey->text==null || strlen($survey->text) > 100) {
						throw new Exception('Invalid survey text.');
					}
					
					//valida opciones
					if(count($survey->options)<1 || count($survey->options)>10){
						throw new Exception('Invalid survey options quantity: '.count($survey->options));
					}
					
					foreach($survey->options as $option){
						if($option==="" || $option==null || strlen($option) > 200) {
							throw new Exception('Invalid survey option: '.$option);
						}
					}
					
					$group_id = $tst_msg->group_id;
					$random_id = $tst_msg->randomID;
						
					$users_in_group = array();
						
					for($i=0;$i<count($groups);$i++){
						if($groups[$i]["id"]==$group_id){
							$users_in_group = $groups[$i]["users"];
						}
					}
						
					//checkea que el usuario que manda el msj este en el grupo
					$is_in_group = false;
					for($i=0;$i<count($users_in_group);$i++){
						if($users_in_group[$i]==$user["username"]){
							$is_in_group=true;
							break;
						}
					}
						
					if($is_in_group){
						//todo fue validado, y crea en la base la survey
						$surveyID = insertSurvey($group_id,$survey);
						$survey->id = $surveyID;
						for($i=0;$i<count($users_in_group);$i++){
							$json = array('type'=>'survey', 'username'=>$user["username"], 'message'=>json_encode($survey), 'randomID'=>$random_id, 'target'=>$group_id);
							send_message(json_encode($json),$users_in_group[$i]);
						}
					}
					
					insertMessage($user["id"],$group_id,json_encode($survey),true,3, null);

				} catch (Exception $e){
					echo 'Exception: ',  $e->getMessage(), "\n";
				}
				
				break;
			case "survey-vote":
				//se fija si ya voto
				try{
					$vote = $tst_msg->vote;
					$survey_id = (int)$vote->survey_id;
					
					if(checkSurveyVote($user["id"],$survey_id)){
						$option_index = (int)$vote->option_index;
						
						voteSurvey($user["id"],$survey_id,$option_index);
					
						$data = array("type"=>"survey-voted","survey_id"=>$survey_id,"option_index"=>$option_index);
						
						send_all_message(json_encode($data),$user["roles"]);
					}
				} catch (Exception $e){
					echo 'Exception: ',  $e->getMessage(), "\n";
				}
				
				break;
			default:
				sendError($clientID,"Salio por el default del switch (Osea que el type del mensaje no esta contemplado)");
				break;
		}
	} else {
		sendError($clientID,"No esta seteado el type en el mensaje");
	}
}

// when a client connects
function wsOnOpen($clientID)
{
	global $Server;

	$response = json_encode(array('type'=>'login', 'message'=>'success')); //prepare json data
	foreach ( $Server->wsClients as $id => $client ){
		if ( $id == $clientID ){
			$Server->wsSend($id, $response);
		}
	}
}

function wsOnClose($clientID, $status) {
	global $Server;
	global $clients;
	global $groups;
	$found_id = array_search($clientID, getFromClients("id"));
	
	if($found_id!==false){
		$disconnected_user = $clients[$found_id]["user"];
		$Server->log("Se desconecto ".$disconnected_user["username"]." (clientID: ".$clientID.")");
		
		disconnectedUser($disconnected_user["id"]);
		
		array_splice($clients,$found_id,1);
		
		refreshUserList($disconnected_user["roles"]);
	}
}

function send_all_message($msg, $roles)
{
	global $Server;
	global $clients;
	
	if($roles==null){
		foreach ($clients as $client){
			$Server->wsSend($client["id"], $msg);
		}
	} else {
		foreach ($clients as $client){
			foreach($roles as $rol){
				if(in_array($rol,$client["user"]["roles"])){
					$Server->wsSend($client["id"], $msg);
					break;
				}
			}
		}
	}
}

function send_message($msg, $target)
{
	global $Server;
	global $clients;

	foreach ($clients as $client) {
		if($client["user"]["username"]==$target){
			$Server->wsSend($client["id"], $msg);
		}
	}
}

function send_message_both($msg, $target, $sender)
{
	global $Server;
	global $clients;

	foreach ($clients as $client) {
		if($client["user"]["username"]==$target || $client["user"]["username"]==$sender){
			$Server->wsSend($client["id"], $msg);
		}
	}
}

function getFromClients($param){
	global $clients;
	
	$all_data = array();

	foreach($clients as $client){
		if(array_key_exists($param, $client)) $all_data[] = $client[$param];
	}
	
	return $all_data;
}

function getUserList($user_id){
	global $clients;

	$final_user_list = array("type"=>"userlist","users"=>array()); 
	
	$connected_users = getFromClients("user");
	
	$connected_users = unique_multidim_array($connected_users,"username");
	
	$roles = getRolesByID($user_id);
	
	foreach ($connected_users as $connected_user){
		foreach($roles as $rol){
			if(in_array($rol,$connected_user["roles"])){
				$final_user_list["users"][$connected_user["username"]] = $connected_user;
				break;
			}
		}
	}
	
	return $final_user_list;
}

function getGroupListByUsername($username){
	global $groups;

	$final_user_list = array("type"=>"grouplist","groups"=>array());

	for($i=0;$i<count($groups);$i++){
		for($j=0;$j<count($groups[$i]["users"]);$j++){
			if($groups[$i]["users"][$j]==$username){
				$final_user_list["groups"][$groups[$i]["id"]] = $groups[$i];
				break;
			}
		}
	}

	return $final_user_list;
}


function getUsuarioByClientId($client_id){
	global $clients;
	
	for($i=0;$i<count($clients);$i++){
		if($clients[$i]["id"]==$client_id){
			return $clients[$i]["user"];
		}
	}
}

function sendError($client_id,$error,$reload){
	global $Server;
	$Server->log( "Error sent to ".$client_id." Error: ".$error);
	if($reload){
		$Server->wsSend($client_id, json_encode(array("type"=>"error")));
	}
}

function unique_multidim_array($array, $key) {
	$temp_array = array();
	$i = 0;
	$key_array = array();

	foreach($array as $val) {
		if (!in_array($val[$key], $key_array)) {
			$key_array[$i] = $val[$key];
			$temp_array[$i] = $val;
			$i++;
		}
	}
	return $temp_array;
}

function getGroupID($group){
	$group_id = str_replace(GROUPS_PREFIX,"",$group);
	$group_id = intval($group_id);
	return $group_id;
}

// start the server
$Server = new PHPWebSocket();
$Server->bind('message', 'wsOnMessage');
$Server->bind('open', 'wsOnOpen');
$Server->bind('close', 'wsOnClose');

$Server->wsStartServer(SERVER_IP, SERVER_PORT);

?>