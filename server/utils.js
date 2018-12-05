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

exports.isGroup = id => {
	return id.includes(GROUPS_PREFIX)
}

exports.getGroupID = id => {
	var groupID = id.replace(GROUPS_PREFIX,'');
	return groupID;
}

exports.rolesCheck = (rolesA, rolesB) => {
	return rolesA.includes(rolesB[0]) && rolesB.includes(rolesA[0])
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