<?php echo $this->load->view('includes/mail_header', NULL, TRUE);?>
<div style='width:100%; text-align:center; margin-bottom: 25px;'><img src="<?php echo base_url("resources/img/emojis/default/1f937-1f3fb-200d-2642-fe0f.png");?>"></div>
Solicitaste una recuperación de tu usuario <b><?php echo $username; ?></b>.
<br><br>
Para recuperarlo, por favor hacé click en el siguiente enlace:
<br>
<?php echo "<a href='".base_url("user_recover/".$hash)."'>".base_url("user_recover/".$hash)."</a>";?>
<br><br>
Si no solicitaste nada, por favor, no hagas click en el enlace e ignorá este mail.
<?php echo $this->load->view('includes/mail_footer', NULL, TRUE);?>
