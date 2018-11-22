<?php echo $this->load->view('includes/mail_header', NULL, TRUE);?>
<div style='width:100%; text-align:center; margin-bottom: 25px;'><img src="<?php echo base_url("resources/img/emojis/default/1f6cd.png");?>"></div>
El usuario <b><?php echo $username ?></b> compró un artículo del <b>Medialum Store</b>.
<br>
<br>
<b>ID Producto:</b> <?php echo $product_id?><br>
<b>Nombre:</b> <?php echo $product_name?>
<?php echo (($option!=null)?"<br><b>Opción seleccionada:</b> ".$option:"");?>

<?php echo $this->load->view('includes/mail_footer', NULL, TRUE);?>
