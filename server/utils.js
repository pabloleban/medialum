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

//Encryption stuff
const outputEncoding = 'hex'
const inputEncoding = 'utf8'
const crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    key = process.env.SECRET_KEY; 

exports.encrypt = text => {
	const iv = new Buffer(crypto.randomBytes(16));
	const cipher = crypto.createCipheriv(algorithm, key, iv)
	let crypted = cipher.update(text,inputEncoding, outputEncoding)
	crypted += cipher.final(outputEncoding);
	return `${iv.toString(outputEncoding)}:${crypted.toString()}`;
}

exports.decrypt = text => {
    const textParts = text.split(':');
    const IV = new Buffer(textParts.shift(), outputEncoding);
    const encryptedText = new Buffer(textParts.join(':'), outputEncoding);
    const decipher = crypto.createDecipheriv(algorithm, key, IV);
    let decrypted = decipher.update(encryptedText,  outputEncoding, inputEncoding);
    decrypted += decipher.final(inputEncoding);
    return decrypted.toString();
}