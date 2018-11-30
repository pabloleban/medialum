function getAllUsersData(){
	var sql = "select * from usuarios;";
	database.query(sql).then(result => {
		var data = [];
		result.map(r => {
			delete r.password;
			data[r.username] = r;
		})
		return data;
	});
}

function getAllUsersDataOfUser(username){
	const original_colors = ['FF0000','FF4B4B','FF8585','BD6262','981616','9E8282','9C0000','FF8300','BD6100','FFA547','926739','864501','D6BD00','CAC28A','948621','9EC700','B2CE45','949E6A','556900','316900','63D400','80DC30','81A95E','68B525','23D45B','59CE7E','08E29D','6FD0B1','2B9472','02d2d4','4CD3D4','0070FF','63A8FF','0056C3','91C2FF','2900FF','180098','9B8BEF','5939FF','BE39FF','AB00FF','8600C7','B77BD4','FF00E9','FF76F3','960089','B97AB4','FF0068','FF79B0','A00042','FFA700'];
	
	var colors = original_colors.slice(0);
	
	var sql = `select u.* from usuarios u where u.id in
				(select user_id from roles_usuarios where rol_id in
					(select rol_id from roles_usuarios where user_id in
						(select u2.id from usuarios u2 where u2.username= '${username}'))) and u.habilitado = 1;`;
	
	database.query(sql).then(result => {
		var usersData = [];
		result.map(r => {
			delete r.password;
			delete r.recover_user_code;
			delete r.medialum_go_sound;
			delete r.id;
			delete r.habilitado;
			delete r.ver_desconectados;
			delete r.sn_mensaje;
			delete r.recordatorio_notif;
			
			if(colors.length <= 0){
				colors = original_colors.slice(0);
			}
		
			var hash = parseInt((username + '').replace(/[^a-f0-9]/gi, ''), 16);
			
			var userNumber = hash % colors.length;
				
			r.color = colors[userNumber];
				
			colors.splice(userNumber,1);
				
			if(r.nacimiento){
				var date = new Date(r.nacimiento);
			
				var meses = array("Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre");
			
				var dia = date.getDate();
				var mes = date.getMonth();
			
				r.nacimiento = `${dia} de ${meses[mes]}`;
			}
				
			r.state = "offline";
			r.typing = false;
				
			usersData[r.username] = r;
		});
		
		return usersData;
	});
}

function getUserID(username){
	var sql = `select id from usuarios where username = '${username}'`;
	
	database.query(sql).then(result => {
		if(result.length > 0){
			return result[0].id;
		}
	})
}

function getUsernameByID(id){
	var sql = `select username from usuarios where id = '${id}'`;
	
	database.query(sql).then(result => {
		if(result.length > 0){
			return result[0].username;
		}
	})
}

function getUnreadMessages(user_id){
	var sql = `select count(group_id_to) notifications, concat('${GROUPS_PREFIX}',mg.group_id_to) entity_from
			from messages_groups_seen mgs, messages_groups mg
			where mgs.user_id = ${user_id}
			and mgs.seen = 0
			and mg.id = mgs.message_id
			group by group_id_to
			UNION
			select count(*) notifications, username entity_from from messages_users, usuarios u
			where seen = 0
			and user_id_to = ${user_id}
			and u.id = user_id_from
			and u.habilitado = 1
			group by entity_from`;
	
	var notifications = [];

	database.query(sql).then(result => {
		result.map(r => {
			notifications.push({notifications: r.notifications, entity: r.entity_from});
		})

		return notifications;
	})
}

function getEntitiesOrder(user_id){
	var sql = `select us
			from (select concat('${GROUPS_PREFIX}',group_id_to) us, max(gm.date) fec
			           from groups_members mg, messages_groups gm
			           where group_id_to = group_id 
			             and ${user_id} in (user_id, user_id_from)
			            group by group_id 
			       union 
			       select username, fec
			        from (select if(user_id_to = ${user_id}, user_id_from, user_id_to) us, max(date) fec
			              from messages_users
			               where ${user_id} in (user_id_from, user_id_to)
			               group by if(user_id_to = ${user_id}, user_id_from, user_id_to)) m, usuarios u
			         where id = us
			     ) tabla
			order by fec desc`;
	
	var order = [];
	
	database.query(sql).then(result => {
		result.map(r => {
			order.push(r.us);
		})

		return order;
	});
}

function getGroups(){
	var sql = "SELECT * FROM groups";

	var allgroups = [];

	database.query(sql).then(result => {
		result.map(r => {
			allgroups.push({id: GROUPS_PREFIX+r.id, users: [], name: r.name});
			
			sql = `SELECT u.username FROM groups_members g, usuarios u WHERE g.group_id = ${r.id} and g.user_id = u.id and u.habilitado = 1`;
			
			database.query(sql).then(result => {
				if (result.length > 0) {
					var group_index;
					allgroups.map((g, index) => {
						if(g.id==GROUPS_PREFIX+r.id){
							group_index = index;
						}
					})
						
					result.map(r => {
						allgroups[group_index].users.push(r.username);
					})
				}
			})
		})

		return allgroups;
	});
}

function getAllRoles(){
	var roles = [];
	
	var sql = "SELECT * FROM roles";
	database.query(sql).then(result => {
		result.map(r => {
			roles.push({id: r.id, rol_name: r.nombre});
		})
		
		return roles;
	});
}

function getRolesByID($user_id){
	var roles = []
	
	var sql = `SELECT * FROM roles_usuarios where user_id = ${user_id};`
	database.query(sql).then(result => {
		result.map(r => {
			roles.push(r.rol_id);
		})

		return roles;
	});
}

function insertMessage(user_from, entity_id, message, is_group, type, data){
	//type
	// 0 = message
	// 1 = file
	// 2 = status
	// 3 = survey

	var sql;
	
	var message = medialumEncrypt(message);

	if(!is_group){
		sql = `INSERT into messages_users 
				(user_id_from, user_id_to, message, date, type, data) 
				values 
				(${user_from},${entity_id},'${message}', NOW(), ${type}, '${$data}')`;
		
		database.query(sql);
	} else {
		entity_id = getGroupID(entity_id);
		
		var sql = `INSERT into messages_groups 
				(user_id_from, group_id_to, message, date, type, data) 
				values 
				(${user_from},${entity_id},'${message}', NOW(), ${type}, '${data}')`;

		database.query(sql).then(result => {
			if(groups[entity_id].users.length - 1 > 0){
				var insertedMessageID = result.insert_id

				sql = "INSERT into messages_groups_seen (message_id, user_id) values ";

				firstTime = true;

				groups[entity_id].users.map(u => {
					if(u !== user_from){
						sql += `${!$first_time ? ", " : ""} (${insertedMessageID},${allUsersData[u].id})"`;
						firstTime = false;
					}
				})

				database.query(sql);
			}
		});
	}
}

function insertStatus(group_id, status_msg){
	var message = medialumEncrypt(status_msg);
	
	var sql = `INSERT into messages_groups 
				(user_id_from, group_id_to, message, date, type) 
				values 
				(null,${group_id},'${message}', NOW(), 2);`;

	database.query(sql);
}

function login(username, password){
	var sql = `SELECT * FROM usuarios 
			where username='${username}' 
			AND password='${password}' 
			and habilitado = 1 
			LIMIT 1;`;
		
	database.query(sql).then(result => {
		if(result.length > 0){
			return true
		} else {
			return false
		}
	})
}

//crea grupo y devuelve el id del grupo creado
function createGroup(usersArray, groupName){
	var sql = `INSERT into groups (name, date) values ('${groupName}', NOW());`;
	
	database.query(sql).then(result => {
		var insertedGroupId = result.insertId;	

		usersArray.map(u => {
			sql = `INSERT into groups_members (group_id, user_id, date) 
					values (${insertedGroupId},${getUserID(u)},NOW());`
			database.query(sql);
		})

		return insertedGroupId;
	});
	
	
}

function exitGroup(user_id, group_id){	
	var sql = `DELETE from groups_members where user_id = ${user_id} and group_id = ${group_id}`;
	
	database.query(sql);
}

function addMemberToGroup(user_id, group_id){
	//checkea si ya no esta en el grupo
	var sql = `SELECT * FROM groups_members WHERE group_id = ${group_id} AND user_id = ${user_id}`;
	
	database.query(sql).then(result => {
		if(result.length <= 0){
			sql = `INSERT into groups_members (group_id, user_id) values (${group_id}, ${user_id});`;
		
			database.query(sql);
		}
	})
}

function changeGroupName(group_id, name, by){
	var sql = `select name from groups
			where id = ${group_id}`;
	
	database.query(sql).then(result => {
		from = "";
	
		if (result.length > 0) {
			from = result[0].name;
		}
		
		sql = `update groups
				set name = '${name}'
				where id = "${group_id};`
		
		database.query(sql);
		
		insertStatus(group_id, 
			{type: "status", 
			status_type: "group_name_change", 
			group_name_change_from: from,
			group_name_change_to: name,
			by});
	})	
}

function groupMessagesSeen($user_id,$group_id){
	$sql = "update messages_groups_seen
			set seen = 1
			where user_id = ".$user_id."
			and message_id in (select id from messages_groups where group_id_to = ".$group_id.");";
	
	db_query($sql);
}

function usernameMessagesSeen($user_that_reads,$from_user){
	$sql = "UPDATE messages_users set seen=1 WHERE user_id_to=".$user_that_reads." AND user_id_from=".$from_user;
	
	db_query($sql);
}

function getHistorial($user_id, $talking_with, $from, $isGroup){
	$messages_per_page = 20;
	
	$from = $from*$messages_per_page;
	
	$sql = "";
	
	if($isGroup){
		$sql = "SELECT clear_date from messages_groups_clear 
				WHERE group_id = ".$talking_with."
				AND user_id = ".$user_id."
				AND message_id is null
				LIMIT 1;";
		
		$result = db_query($sql);
		
		$date = "";
		
		if ($result->num_rows > 0) {
			while($row = $result->fetch_assoc()) {
				$date = $row["clear_date"];
			}
		} else {
			//utilizo una fecha vieja para filtrar
			$date = "2000-06-09 00:00:00";
		}
		
		
		$sql = "SELECT mg.*, concat('".GROUPS_PREFIX."',mg.group_id_to) target, u.username user_from
				FROM groups_members gm, messages_groups mg 
				LEFT JOIN usuarios u
				ON mg.user_id_from = u.id 
				WHERE mg.group_id_to = gm.group_id
				AND gm.group_id = ".$talking_with."
				AND gm.user_id = ".$user_id."
				AND (u.habilitado = 1 or mg.user_id_from is null)
				AND mg.date >= gm.date
				AND mg.date > '".$date."'
				AND mg.id not in (select message_id from messages_groups_clear where user_id=".$user_id." and message_id is not null)
				ORDER BY mg.id desc
				LIMIT ".$from.",".$messages_per_page.";";
	} else {
		$sql = "SELECT uf.username user_from, ut.username target, mu.*
				FROM messages_users mu, usuarios uf, usuarios ut
				WHERE ((mu.user_id_from = ".$user_id." and mu.user_id_to = ".$talking_with." and mu.removed_user_from = 0) OR
				       (mu.user_id_to = ".$user_id." and mu.user_id_from = ".$talking_with." and mu.removed_user_to = 0))
				and uf.id  = mu.user_id_from
				and ut.id = mu.user_id_to
				AND uf.habilitado = 1
				AND ut.habilitado = 1
				ORDER BY mu.id desc
				LIMIT ".$from.",".$messages_per_page.";";
			
	}
	
	$result = db_query($sql);
	if ($result->num_rows > 0) {
		$historial = array();
		
		while($row = $result->fetch_assoc()) {
			$type = "";
			switch($row["type"]){
				case 0:
					$type="usermsg";
					break;
				case 1:
					$type="file";
					break;
				case 2:
					$type="status";
					break;
				case 3:
					$type="survey";
					break;
				default:
					$type="usermsg";
					break;
			}
			
			$historial[] = array('type'=>$type, 'username'=>$row["user_from"], 'message'=>medialumDecrypt($row["message"]),'target'=>$row["target"],'date'=>$row["date"], 'data'=>$row['data']);
		}
		
		return $historial;
	} else {
		return false;
	}
}

function clearMessages($user_id, $entity){
	if(isGroup($entity)){
		$entity = getGroupID($entity);
		
		$sql = "SELECT * FROM messages_groups_clear
			where user_id = ".$user_id."
			and group_id = ".$entity."
			and message_id is null;";
		
		$result = db_query($sql);
		
		if ($result->num_rows > 0) {
			$sql = "UPDATE messages_groups_clear
			SET clear_date = NOW()
			where user_id = ".$user_id."
			and group_id = ".$entity."
			and message_id is null";
			
			db_query($sql);
		} else {
			$sql = "INSERT into messages_groups_clear
					(user_id,group_id,clear_date) 
					values (".$user_id.",".$entity.",NOW());";
			
			db_query($sql);
		}
	} else {
		$entity = getUserID($entity);
		
		$sql = "UPDATE messages_users
			SET removed_user_from = 1
			where user_id_from = ".$user_id."
			and user_id_to = ".$entity."
			and removed_user_from = 0";
		
		db_query($sql);
		
		$sql = "UPDATE messages_users
			SET removed_user_to = 1
			where user_id_to = ".$user_id."
			and user_id_from = ".$entity."
			and removed_user_to = 0";
		
		db_query($sql);
	}
}

function clearSingleMessage($user_id,$entity,$date,$offset){	
	if(isGroup($entity)){
		$entity = getGroupID($entity);
		
		$sql = "select * from messages_groups
				where group_id_to = ".$entity."
				and date = '".$date."'
				LIMIT ".$offset.",1";
		
		$result = db_query($sql);
		
		if ($result->num_rows > 0) {
			$id=-1;
				
			while($row = $result->fetch_assoc()) {
				$id = $row["id"];
			}
			
			$sql = "INSERT into messages_groups_clear
					(user_id,group_id,clear_date,message_id)
					values (".$user_id.",".$entity.",NOW(),".$id.");";
				
			db_query($sql);
		}
	} else {
		$entity = getUserID($entity);
	
		$sql = "select * from messages_users
				where user_id_from in (".$user_id.",".$entity.")
				and user_id_to in (".$user_id.",".$entity.")
				and (removed_user_from = 0 or removed_user_to = 0)
				and date = '".$date."'
				LIMIT ".$offset.",1";
		
		$result = db_query($sql);
		
		if ($result->num_rows > 0) {
			$id=-1;
			$from=-1;
			
			while($row = $result->fetch_assoc()) {
				$id = $row["id"];
				$from = $row["user_id_from"];
			}
			
			$sql = "UPDATE messages_users
				SET ".(($from==$user_id)?"removed_user_from":"removed_user_to")." = 1
				where id = ".$id;
			
			db_query($sql);
		}
	}
}

function insertSurvey($group_id, $survey){
	global $DBConnection;
	
	$group_id = getGroupID($group_id);
	
	//inserta survey
	$sql = "INSERT into surveys (text, type, group_id) values ('".$DBConnection->real_escape_string($survey->text)."','".$DBConnection->real_escape_string($survey->type)."',".$group_id.")";
	db_query($sql);
	$inserted_survey_id = $DBConnection->insert_id;
	
	//inserta surveys_options
	foreach($survey->options as $option){
		$sql = "INSERT into surveys_options (survey_id, `option`) values (".$inserted_survey_id.",'".$DBConnection->real_escape_string($option)."')";
		$result = db_query($sql);
	}
	
	return $inserted_survey_id;
}

function checkSurveyVote($user_id, $survey_id){
	//se fija si ya lo hizo
	$sql = "SELECT * FROM surveys_votes where user_id=".$user_id." and survey_id=".$survey_id;
	$result = db_query($sql);
	if ($result->num_rows > 0) {
		return false;
	}
	
	//se fija si el usuario pertenece al grupo donde se hizo la survey
	$sql = "SELECT * from (SELECT * from groups_members where group_id = (SELECT group_id FROM surveys where id=".$survey_id.")) t where t.user_id = ".$user_id;
	$result = db_query($sql);
	if ($result->num_rows <= 0) {
		return false;
	}
	
	return true;
}

function voteSurvey($user_id,$survey_id,$option_index){
	//obtengo el ID de la opcion
	$sql = "SELECT id from surveys_options where survey_id=".$survey_id." LIMIT ".$option_index.",1";
	$result = db_query($sql);
			
	$option_id = null;
	
	while($row = $result->fetch_assoc()) {
		$option_id = $row["id"];
	}
	
	if($option_id!=null){
		$sql = "INSERT into surveys_votes (user_id, survey_id, option_id) values (".$user_id.",".$survey_id.",".$option_id.")";
		db_query($sql);
	}
}

function disconnectedUser($user_id){
	$sql = "update usuarios
			set disconnected_at = NOW()
			where id = ".$user_id;
	
	db_query($sql);
}

?>
