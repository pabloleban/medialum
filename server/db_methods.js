exports.getAllUsersData = () => {
	let sql = "select * from usuarios;";
	return database.query(sql).then(result => {
		let data = [];
		result.forEach(r => {
			delete r.password;
			data[r.username] = r;
		})
		return data;
	});
}

exports.getAllUsersDataOfUser = username => {
	new Promise ((resolve, reject) => {
		const original_colors = ['FF0000','FF4B4B','FF8585','BD6262','981616','9E8282','9C0000','FF8300','BD6100','FFA547','926739','864501','D6BD00','CAC28A','948621','9EC700','B2CE45','949E6A','556900','316900','63D400','80DC30','81A95E','68B525','23D45B','59CE7E','08E29D','6FD0B1','2B9472','02d2d4','4CD3D4','0070FF','63A8FF','0056C3','91C2FF','2900FF','180098','9B8BEF','5939FF','BE39FF','AB00FF','8600C7','B77BD4','FF00E9','FF76F3','960089','B97AB4','FF0068','FF79B0','A00042','FFA700'];
		
		let colors = [...original_colors]
		
		let sql = `select u.* from usuarios u where u.id in
					(select user_id from roles_usuarios where rol_id in
						(select rol_id from roles_usuarios where user_id in
							(select u2.id from usuarios u2 where u2.username= '${username}'))) and u.habilitado = 1;`;
		
		database.query(sql).then(result => {
			result.forEach(r => {
				delete r.password;
				delete r.recover_user_code;
				delete r.medialum_go_sound;
				delete r.id;
				delete r.habilitado;
				delete r.ver_desconectados;
				delete r.sn_mensaje;
				delete r.recordatorio_notif;
				delete r.is_bot

				if(colors.length <= 0){
					colors = [...original_colors]
				}
			
				let hash = parseInt((username + '').replace(/[^a-f0-9]/gi, ''), 16);
				
				let userNumber = hash % colors.length;
					
				r.color = colors[userNumber];
					
				colors.splice(userNumber,1);
					
				if(r.nacimiento){
					let date = new Date(r.nacimiento);
				
					let meses = array("Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre");
				
					let dia = date.getDate();
					let mes = date.getMonth();
				
					r.nacimiento = `${dia} de ${meses[mes]}`;
				}
					
				r.state = "offline";
				r.typing = false;
					
				usersData[r.username] = r;
			});
			
			resolve(usersData);
		}, reject);
	})
}

exports.getUserID = username => {
	let sql = `select id from usuarios where username = '${username}'`;
	
	return database.query(sql).then(result => {
		if(result.length > 0){
			return result[0].id;
		}
	})
}

exports.getUsernameByID = id => {
	let sql = `select username from usuarios where id = '${id}'`;
	
	return database.query(sql).then(result => {
		if(result.length > 0){
			return result[0].username;
		}
	})
}

exports.getUnreadMessages = user_id => {
	let sql = `select count(group_id_to) notifications, concat('${GROUPS_PREFIX}',mg.group_id_to) entity_from
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
	
	let notifications = [];

	return database.query(sql).then(result => {
		result.map(r => {
			notifications.push({notifications: r.notifications, entity: r.entity_from});
		})

		return notifications;
	})
}

exports.getEntitiesOrder = user_id => {
	let sql = `select us
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
	
	let order = [];
	
	return database.query(sql).then(result => {
		result.map(r => {
			order.push(r.us);
		})

		return order;
	});
}

exports.getGroups = () => {
	let sql = "SELECT * FROM groups";

	let allgroups = [];

	return database.query(sql).then(result => {
		result.map(r => {
			allgroups.push({id: GROUPS_PREFIX+r.id, users: [], name: r.name});
			
			sql = `SELECT u.username FROM groups_members g, usuarios u WHERE g.group_id = ${r.id} and g.user_id = u.id and u.habilitado = 1`;
			
			database.query(sql).then(result => {
				if (result.length > 0) {
					let group_index;
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

exports.getAllRoles = () => {
	let roles = [];
	
	let sql = "SELECT * FROM roles";
	return database.query(sql).then(result => {
		result.map(r => {
			roles.push({id: r.id, rol_name: r.nombre});
		})
		
		return roles;
	});
}

exports.getRolesByID = user_id => {
	new Promise ((resolve, reject) => {
		let roles = []
	
		let sql = `SELECT * FROM roles_usuarios where user_id = ${user_id};`
		database.query(sql).then(result => {
			result.map(r => {
				roles.push(r.rol_id);
			})
	
			resolve(roles);
		}, reject);
	})
}

exports.insertMessage = (user_from, entity_id, message, is_group, type, data) => {
	//type
	// 0 = message
	// 1 = file
	// 2 = status
	// 3 = survey

	let sql;
	
	let message = medialumEncrypt(message);

	if(!is_group){
		sql = `INSERT into messages_users 
				(user_id_from, user_id_to, message, date, type, data) 
				values 
				(${user_from},${entity_id},'${message}', NOW(), ${type}, '${$data}')`;
		
		database.query(sql);
	} else {
		entity_id = getGroupID(entity_id);
		
		let sql = `INSERT into messages_groups 
				(user_id_from, group_id_to, message, date, type, data) 
				values 
				(${user_from},${entity_id},'${message}', NOW(), ${type}, '${data}')`;

		database.query(sql).then(result => {
			if(groups[entity_id].users.length - 1 > 0){
				let insertedMessageID = result.insert_id

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

exports.insertStatus = (group_id, status_msg) => {
	let message = medialumEncrypt(status_msg);
	
	let sql = `INSERT into messages_groups 
				(user_id_from, group_id_to, message, date, type) 
				values 
				(null,${group_id},'${message}', NOW(), 2);`;

	return database.query(sql);
}

exports.login = (username, password) => {
	return new Promise((resolve, reject) => {
		let sql = `SELECT * FROM usuarios 
				where username='${username}' 
				AND password='${password}' 
				and habilitado = 1 
				LIMIT 1;`;
			
		database.query(sql).then(result => {
			if(result.length > 0){
				delete result[0].password
				resolve(result[0]);
			} else {
				reject();
			}
		})
	});
}

//crea grupo y devuelve el id del grupo creado
exports.createGroup = (usersArray, groupName) => {
	let sql = `INSERT into groups (name, date) values ('${groupName}', NOW());`;
	
	return database.query(sql).then(result => {
		let insertedGroupId = result.insertId;	

		usersArray.map(u => {
			sql = `INSERT into groups_members (group_id, user_id, date) 
					values (${insertedGroupId},${getUserID(u)},NOW());`
			database.query(sql);
		})

		return insertedGroupId;
	});
	
	
}

exports.exitGroup = (user_id, group_id) => {	
	let sql = `DELETE from groups_members where user_id = ${user_id} and group_id = ${group_id}`;
	
	database.query(sql);
}

exports.addMemberToGroup = (user_id, group_id) => {
	//checkea si ya no esta en el grupo
	let sql = `SELECT * FROM groups_members WHERE group_id = ${group_id} AND user_id = ${user_id}`;
	
	return database.query(sql).then(result => {
		if(result.length <= 0){
			sql = `INSERT into groups_members (group_id, user_id) values (${group_id}, ${user_id});`;
		
			database.query(sql);
		}
	})
}

exports.changeGroupName = (group_id, name, by) => {
	let sql = `select name from groups
			where id = ${group_id}`;
	
	return database.query(sql).then(result => {
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

exports.groupMessagesSeen = (user_id, group_id) => {
	let sql = `update messages_groups_seen
			set seen = 1
			where user_id = ${user_id}
			and message_id in (select id from messages_groups where group_id_to = ${group_id});`;
	
	database.query(sql);
}

exports.usernameMessagesSeen = (user_that_reads, from_user) => {
	let sql = `UPDATE messages_users set seen = 1 WHERE user_id_to = ${user_that_reads} AND user_id_from = ${from_user}`;
	
	database.query(sql);
}

exports.getHistorial = (user_id, talking_with, from, isGroup) => {
	let messages_per_page = 20;
	
	from = from * messages_per_page;
	
	let sql = "";
	let promise = null;

	const retrieveHistorial = (sql) => {
		return database.query(sql).then(result => {
			if(result.length > 0){
				let historial = [];
			
				result.forEach(r => {
					let type = "";
					switch(let.type){
						case 0:
							type = "usermsg";
							break;
						case 1:
							type = "file";
							break;
						case 2:
							type = "status";
							break;
						case 3:
							type = "survey";
							break;
						default:
							type = "usermsg";
							break;
					}
					
					historial.push({
						type, 
						username: r.user_from,
						message: medialumDecrypt(r.message),
						target: r.target,
						date: r.date,
						data: r.data
					});
				})
				
				return $historial;
			} else {
				return false;
			}
		});
	}

	if(isGroup){
		sql = `SELECT clear_date from messages_groups_clear 
				WHERE group_id = ${talking_with}
				AND user_id = ${user_id}
				AND message_id is null
				LIMIT 1;`
		
		database.query(sql).then(result => {
			let date = "";

			if(result.length > 0){
				date = result[0].clear_date;
			} else {
				date = "2000-06-09 00:00:00"
			}

			return `SELECT mg.*, concat('${GROUPS_PREFIX}',mg.group_id_to) target, u.username user_from
			FROM groups_members gm, messages_groups mg 
			LEFT JOIN usuarios u
			ON mg.user_id_from = u.id 
			WHERE mg.group_id_to = gm.group_id
			AND gm.group_id = ${talking_with}
			AND gm.user_id = ${user_id}
			AND (u.habilitado = 1 or mg.user_id_from is null)
			AND mg.date >= gm.date
			AND mg.date > '${date}'
			AND mg.id not in (select message_id from messages_groups_clear where user_id = ${user_id} and message_id is not null)
			ORDER BY mg.id desc
			LIMIT ${from}, ${messages_per_page};`;
		});		

		return retrieveHistorial(sql);
	} else {
		sql = `SELECT uf.username user_from, ut.username target, mu.*
				FROM messages_users mu, usuarios uf, usuarios ut
				WHERE ((mu.user_id_from = ".$user_id." and mu.user_id_to = ".$talking_with." and mu.removed_user_from = 0) OR
				       (mu.user_id_to = ".$user_id." and mu.user_id_from = ".$talking_with." and mu.removed_user_to = 0))
				and uf.id  = mu.user_id_from
				and ut.id = mu.user_id_to
				AND uf.habilitado = 1
				AND ut.habilitado = 1
				ORDER BY mu.id desc
				LIMIT ".$from.",".$messages_per_page.";`
			
		return retrieveHistorial(sql);
	}
}

exports.clearMessages = (user_id, entity) => {
	if(isGroup(entity)){
		entity = getGroupID(entity);
		
		let sql = `SELECT * FROM messages_groups_clear
			where user_id = ${user_id}
			and group_id = ${entity}
			and message_id is null;`;
		
		database.query(sql).then(result => {
			if (result.length > 0) {
				let sql = `UPDATE messages_groups_clear
				SET clear_date = NOW()
				where user_id = ${user_id}
				and group_id = ${entity}
				and message_id is null`;
				
				database.query(sql);
			} else {
				let sql = `INSERT into messages_groups_clear
						(user_id, group_id, clear_date) 
						values (${user_id}, ${entity}, NOW());`;
				
				database.query(sql);
			}
		})
		

	} else {
		entity = getUserID(entity);
		
		//TODO: preguntarle a fercho si esta bien hacer dos queries

		sql = `UPDATE messages_users
			SET removed_user_from = 1
			where user_id_from = ${user_id}
			and user_id_to = ${entity}
			and removed_user_from = 0 `;
		
		database.query(sql);
		
		sql = `UPDATE messages_users
			SET removed_user_to = 1
			where user_id_to = ${user_id}
			and user_id_from = ${entity}
			and removed_user_to = 0`;
		
		database.query(sql);
	}
}

exports.clearSingleMessage = (user_id, entity, date, offset) => {	
	if(isGroup(entity)){
		entity = getGroupID(entity);
		
		let sql = `select * from messages_groups
				where group_id_to = ".$entity."
				and date = '".$date."'
				LIMIT ".$offset.",1`;
		
		database.query(sql).then(result => {
			if (result.length > 0) {
				let id = result[0].id;
								
				let sql = `INSERT into messages_groups_clear
						(user_id,group_id,clear_date,message_id)
						values (${user_id}, ${entity}, NOW(), ${id})`;
					
				database.query(sql);
			}
		})
		
	} else {
		entity = getUserID(entity);
	
		sql = `select * from messages_users
				where user_id_from in (${user_id}, ${entity})
				and user_id_to in (${user_id}, ${entity})
				and (removed_user_from = 0 or removed_user_to = 0)
				and date = '${date}'
				LIMIT ${offset}, 1`;
		
		database.query(sql).then(result => {
			if (result.length > 0) {
				id = result[0].id;
				from = result[0].user_id_from;
				
				sql = `UPDATE messages_users
					SET ${ from == user_id ? "removed_user_from" : "removed_user_to" } = 1
					where id = ${id}`;
				
				database.query(sql)
			}
		})
	}
}

exports.insertSurvey = (group_id, survey) => {	
	group_id = getGroupID(group_id);
	
	//inserta survey
	let sql = `INSERT into surveys (text, type, group_id) 
				values ('${survey.text}', '${survey.type}', ${group_id})`;
	
	return database.query(sql).then(result => {
		let inserted_survey_id = result.insertId;

		//inserta surveys_options
		survey.options.forEach(option => {
			let sql = `INSERT into surveys_options (survey_id, \`option\`) 
						values (${inserted_survey_id}, '${option}')`;
			database.query(sql);
		});

		return inserted_survey_id
	})
}

exports.checkSurveyVote = (user_id, survey_id) => {
	//se fija si ya lo hizo
	let sql = `SELECT * FROM surveys_votes where user_id = ${user_id} and survey_id = ${survey_id}`;
	
	const alreadyVoted = new Promise((resolve, reject) => {
		database.query(sql).then(result => {
			if(result.length > 0){
				reject();
			} else {
				resolve();
			}
		})
	});
	
	//se fija si el usuario pertenece al grupo donde se hizo la survey
	let sql = `SELECT * from 
					(SELECT * from groups_members 
					where group_id = (SELECT group_id FROM surveys where id = ${survey_id})) t 
				where t.user_id = ${user_id}`;

	const userInGroup = new Promise((resolve, reject) => { 
		database.query(sql).then(result => {
			if (result.length <= 0) {
				reject();
			} else {
				resolve();
			}
		});
	});

	return Promise.all([alreadyVoted, userInGroup])
}

exports.voteSurvey = (user_id, survey_id, option_index) => {
	//obtengo el ID de la opcion
	let sql = `SELECT id from surveys_options where survey_id = ${survey_id} LIMIT ${option_index}, 1`;
	database.query(sql).then(result => {
		if(result.length > 0){
			option_id = result[0].id;
			let sql = `INSERT into surveys_votes (user_id, survey_id, option_id) values (${user_id}, ${survey_id}, ${option_id})`;
			database.query(sql);
		}
	});
}

exports.disconnectedUser = user_id => {
	let sql = `update usuarios
			set disconnected_at = NOW()
			where id = ${user_id}`;
	
	database.query(sql);
}