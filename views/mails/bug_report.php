<?php echo $this->load->view('includes/mail_header', NULL, TRUE);?>
<div style='width:100%; text-align:center; margin-bottom: 25px;'><img src="<?php echo base_url("resources/img/emojis/default/1f41e.png");?>"></div>
El usuario <b><?php echo $username;?></b> reportó el siguiente bug:
<br><br>
<b>Reproducción:</b><br><?php echo $reproduction;?>
<br><br>
<b>Descripción del bug:</b><br>
<?php echo $description;?>
<?php echo (($image!=="")?"<br><br><b>Imagen:</b><br><img src='".$image."'>":""); ?>
<?php echo $this->load->view('includes/mail_footer', NULL, TRUE);?>
		