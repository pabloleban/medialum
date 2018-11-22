<link rel="stylesheet" type="text/css" href="<?php echo base_url("resources/css/login.css?".FULL_VERSION);?>">
<script src="https://www.google.com/recaptcha/api.js" async defer></script>
<script>

$(document).ready(function(){
	electronCall("login-ready")
	
	$("#username,#password").keyup(function(e){
		if(e.which==13){
			login();
		}
	});

	if(/[?&]invalid_user/.test(window.location.href)){
		$("#status").show().text("El usuario expiró. Por favor, iniciá sesión de nuevo.");
		$(".loading").hide();
		$("#boton").show();
	}
});

function login(){
	grecaptcha.execute();
}

function login_ajax(gresponse){
	$("#status").hide();

	$("#boton").hide();
	$(".pass-forgot").hide();
	$(".loading").show();
	
	$.ajax({
		url:"<?php echo base_url("login/login")?>",
		data: {username:$("#username").val(),password:$("#password").val(),gresponse: gresponse},
		type:'POST',
		success:function(response){
			switch(response.status){
				case "success":
					window.location.href="<?php echo base_url();?>";
					break;
				case "incorrect":
					$("#status").show().text("Usuario o Password incorrecto.");
					$(".loading").hide();
					$("#boton").show();
					$(".pass-forgot").show();
					grecaptcha.reset();
					break;
				case "banned":
					$("#status").show().text("El usuario está deshabilitado.");
					$(".loading").hide();
					$("#boton").show();
					$(".pass-forgot").show();
					grecaptcha.reset();
					break;
				case "captcha fail":
					$("#status").show().text("El captcha falló. Por favor intentá de nuevo.");
					$(".loading").hide();
					$("#boton").show();
					$(".pass-forgot").show();
					grecaptcha.reset();
					break;
				default:
					$("#status").show().text("Error en la base de datos.");
					$(".loading").hide();
				    $("#boton").show();
				    $(".pass-forgot").show();
				    grecaptcha.reset();
					break;
			}
		},
		error:function(){
				$("#boton").show();
				$(".loading").hide();
				$("#status").show().text("Error en la base de datos.");
				grecaptcha.reset();
			},
		
	});
}

function passwordForgotten(){
	swal({
		title:"Recuperar usuario/contraseña",
		type:"info",
		html:"Escribí el E-mail que tiene asignado tu cuenta de <b>"+Medialum.appName+"</b>:",
		input:"text",
		inputPlaceholder:"E-mail",
		showCancelButton:true,
		cancelButtonText:"Cancelar",
		showLoaderOnConfirm:true,
		preConfirm: function(email) {
		    return new Promise(function(resolve, reject) {
		    	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		        if(!re.test(email)){
		        	reject("E-mail inválido");
			    }
			    
		    	$.ajax({
					type:"post",
					url: base_url+"recover",
					data:{"email":email},
					success:function(response){
						if(response==="ok"){
							resolve();
						} else if(response=="incorrect_mail") {
							reject("No hay ningún usuario registrado con ese E-mail.")
						} else {
							reject("Ocurrió un error. Intentá de nuevo más tarde.");
						}
					},
					error:function(){
						reject("Ocurrió un error. Intentá de nuevo más tarde.");
					}
				});
		    }).catch(error => {
    	    	swal.showValidationError(error)
    		});
		},
	}).then(function(result){
		if(result.value){
			swal("Mail enviado","Entrá a tu casilla de mail y revisá el mail que te acabamos de enviar!","success")
		}
	},function(){});
}
</script>

<div class="container d-flex text-center justify-content-center" style="height: 100vh;">
	<div class="row h-100 align-items-center">
		<form class="col-12 main-box text-center p-4" action="javascript:login();">
			<img src="resources/img/logo-blanco1.png" class="mb-4" style='cursor:pointer' width=200 onclick="verInformacion();">
			<div class="form-group">
				<input class="form-control text-center" name="username" placeholder="Usuario o Email" id="username" tabindex=1 required>
			</div>
			<div class="form-group">
				<input class="form-control text-center" type="password" placeholder='Password' name="password" id="password" tabindex=2 required>
			</div>
			<button type="submit" class="btn btn-light center-block" id="boton">
				<i class="fas fa-sign-in-alt"></i>
				Entrar
			</button>
			<div>
				<div colspan=2 style="text-align:center; display:none;" class="loading">
					<svg class="spinner-container" width="65px" height="65px" viewBox="0 0 52 52"><circle style='stroke: white;' class="path" cx="26px" cy="26px" r="20px" fill="none" stroke-width="4px"></circle></svg>
				</div>
			</div>
			<div>
				<div colspan=2 id="status" class="alert alert-danger status" style="display:none; font-weight:bold"></div>
			</div>
			<div>
				<div colspan=2 class="pass-forgot" onclick="passwordForgotten();"><i style="font-size:20px; position:relative; top:2px; margin-right: 4px;" class="fa fa-question-circle"></i>Olvidaste tu usuario/contraseña?</div>
			</div>
		</form>
	</div>
</div>
<div class="g-recaptcha" data-sitekey="6LfgQj8UAAAAAD5sk-27CzVVTPnwC58nFaLj7hPB" data-callback="login_ajax" data-size="invisible"></div>

