<?php 

define("ENTORNO","development");
define("GROUPS_PREFIX","_gr_");
define("SECRET_KEY","m3Di4LuumnmScR3TQu3y-rvd66vrz6");
define("SERVER_PORT",9006);

if(ENTORNO==="produccion"){
	//ip de produccion
	define("SERVER_IP","localhost");
	define("RESOURCES_PATH","https://www.learsoft.com/chat/resources/");
} else {
	//ip de desarrollo
	define("SERVER_IP","127.0.0.1");
	define("RESOURCES_PATH","http://localhost/chat/resources/");
}

?>