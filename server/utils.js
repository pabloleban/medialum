const constants = require('./constants')

exports.escapeHtml = text => {
	var map = {
	  '&': '&amp;',
	  '<': '&lt;',
	  '>': '&gt;',
	  '"': '&quot;',
	  "'": '&#039;'
	};
  
	return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

exports.escapeQuotes = text => {
	return text.replace('"', '\"').replace('\'', '\\\'');
}

exports.isGroup = id => {
	return id.includes(constants.GROUPS_PREFIX)
}

exports.getGroupID = id => {
	var groupID = id.replace(constants.GROUPS_PREFIX,'');
	return groupID;
}

exports.rolesCheck = (rolesA, rolesB) => {
	return rolesA.includes(rolesB[0]) && rolesB.includes(rolesA[0])
}

exports.medialumEncrypt = message => {
	return message;
}

exports.medialumDecrypt = message => {
	return message;
}

// function getImageData($url){
// 	$url = str_replace(' ', "%20", $url);
// 	$data = getimagesize(RESOURCES_PATH.'/files'.$url);
	
// 	if($data){
// 		return $data;
// 	} else {
// 		return array();
// 	}
// }