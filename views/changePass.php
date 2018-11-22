<div class="container">
	<div class="row">
		<?php if(!$expiro){?>
		<div class="col-sm-4"></div>
		<div class="col-md-4 card">
			<div class="card-body">
				<img class="center-block" src="<?php echo base_url("resources/img/icon-simple.png");?>" width=80px;>
				<h2 class="text-center">Cambio de contraseña</h2>
				<form onsubmit="return changePassword()">
					<input id="key" type="hidden" value="<?php echo $key;?>">
				    <div class="form-group">
				    	<label for="pwd">Contraseña nueva:</label>
				    	<input type="password" class="form-control" id="pwd" placeholder="Escribí tu contraseña" required>
				    </div>
				    <div class="form-group">
				    	<label for="pwd">Confirmar contraseña:</label>
				    	<input type="password" class="form-control" id="pwd2" placeholder="Reescribí tu contraseña" required>
				    </div>
				    <button type="submit" id='enviar' class="btn btn-primary center-block">Enviar</button>
				    <svg class="spinner-container center-block" id="loader" style="display:none" width="65px" height="65px" viewBox="0 0 52 52"><circle style='stroke: #337ab7;' class="path" cx="26px" cy="26px" r="20px" fill="none" stroke-width="4px"></circle></svg>
				</form>
				
				<script>
				
				var password = document.getElementById("pwd")
				, confirm_password = document.getElementById("pwd2");
				
				function validatePassword(){
					if(password.value != confirm_password.value) {
					  confirm_password.setCustomValidity("Las contraseñas no coinciden");
					} else {
					  	confirm_password.setCustomValidity('');

					}
				}

				function changePassword(){
					$("#enviar").hide();
					$("#loader").show();
				  	$.ajax({
					  	url:"<?php echo base_url();?>change_pass",
						data:{key:$("#key").val(), password:$("#pwd").val()},
						method:"POST",
						success:function(response){
							if(response=="ok"){
								window.location.href=window.location.href+"?state=success";
							} else {
								location.reload();
							}
							$("#loader").hide();
						},
						error:function(){
							swal("Error","Ocurrió un error. Intentá de nuevo más tarde.","error");
						}
					});
	
				  	return false;
				}
				
				password.onchange = validatePassword;
				confirm_password.onkeyup = validatePassword;
				
				</script>
			
				</div>
			</div>
			<div class="col-sm-4"></div>
		<?php } else if(isset($_GET['state']) && $_GET['state']=="success"){?>
			<div class="col-xl-12 text-success text-center">
				<i class='far fa-check-circle' style='font-size:80px;'></i>
			</div>
			<div class="col-xl-12 text-center">
				<h2 style="padding-top:20px;">Tu contraseña se cambió correctamente.</h2>
			</div>
		<?php } else {?>
			<div class="col-xl-12 text-danger text-center">
				<i class='fas fa-exclamation-triangle' style='font-size:80px;'></i>
			</div>
			<div class="col-xl-12 text-center">
				<h2 style="padding-top:20px;">El enlace expiró o no es válido.</h2>
			</div>
		<?php } ?>
	</div>
</div>
