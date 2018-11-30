<?php 

$key = pack('H*', "bcb04b7e103a0cd8b54763051cef08bc55abe029fdebae5e1d417e2ffb2a00a3");

# crear una aleatoria IV para utilizarla co condificación CBC
$iv_size = mcrypt_get_iv_size(MCRYPT_RIJNDAEL_128, MCRYPT_MODE_CBC);
$iv = mcrypt_create_iv($iv_size, MCRYPT_RAND);

function medialumEncrypt($text){
	global $key;
	global $iv_size;
	global $iv;
	
	$ciphertext = mcrypt_encrypt(MCRYPT_RIJNDAEL_128, $key, $text, MCRYPT_MODE_CBC, $iv);
	$ciphertext = $iv . $ciphertext;
	$ciphertext_base64 = base64_encode($ciphertext);
	
	return $ciphertext_base64;
}

function medialumDecrypt($text){
	global $key;
	global $iv_size;
	global $iv;
	
	$ciphertext_dec = base64_decode($text);
	$iv_dec = substr($ciphertext_dec, 0, $iv_size);
	$ciphertext_dec = substr($ciphertext_dec, $iv_size);
	$plaintext_dec = mcrypt_decrypt(MCRYPT_RIJNDAEL_128, $key,
	$ciphertext_dec, MCRYPT_MODE_CBC, $iv_dec);
	$plaintext_dec = rtrim($plaintext_dec, "\0"); // trim ONLY the nulls at the END
	
	return $plaintext_dec;
}

function isGroup($id){
	if (strpos($id, GROUPS_PREFIX) !== false) {
		return true;
	} else {
		return false;
	}
}

function getImageData($url){
	$url = str_replace(' ', "%20", $url);
	$data = getimagesize(RESOURCES_PATH.'/files'.$url);
	
	if($data){
		return $data;
	} else {
		return array();
	}
}

?>