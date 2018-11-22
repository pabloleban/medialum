<!DOCTYPE html>
<html>
    <head>
        <meta charset='UTF-8' />
        
        <title id="window_title">Medialum</title>
        <link rel="manifest" href="<?php echo base_url("manifest.json");?>">
        <meta name='viewport' content='width=100, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no' />
        <meta name="theme-color" content="#00305d" />
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        
        <!-- msapplication-TileImage - Windows 8 - The tile image. -->
        <meta name="msapplication-TileColor" content="#094c90">
        <meta name="msapplication-TileImage" content="<?php echo base_url("resources/img/icons/logo144.png");?>">
        
        <link rel="icon" type="image/png" href="<?php echo base_url("resources/img/icons/icon48.png");?>" sizes="48x48">
        <link rel="icon" type="image/png" href="<?php echo base_url("resources/img/icons/icon72.png");?>" sizes="72x72">
        <link rel="icon" type="image/png" href="<?php echo base_url("resources/img/icons/icon96.png");?>" sizes="96x96">
        <link rel="icon" type="image/png" href="<?php echo base_url("resources/img/icons/icon144.png");?>" sizes="144x144">
        <link rel="icon" type="image/png" href="<?php echo base_url("resources/img/icons/icon168.png");?>" sizes="168x168">
        <link rel="icon" type="image/png" href="<?php echo base_url("resources/img/icons/icon192.png");?>" sizes="192x192">
        
        <?php $this->load->view('includes/version'); ?>
        
        <script src="<?php echo base_url("resources/js/popper.min.js")?>"></script>
        
        <script src="<?php echo base_url("resources/js/scripts.js?".FULL_VERSION);?>"></script>
        <script src="<?php echo base_url("resources/js/jquery.min.js");?>"></script>
        <link rel="stylesheet" type="text/css" href="<?php echo base_url("resources/css/bootstrap.min.css");?>">
        <script src="<?php echo base_url("resources/js/bootstrap.min.js");?>"></script>
        <script src="<?php echo base_url("resources/js/sweetalert2.min.js?".FULL_VERSION);?>"></script>
        
        <script src="<?php echo base_url("resources/js/linkify.min.js");?>"></script>
        <script src="<?php echo base_url("resources/js/linkify-jquery.min.js");?>"></script>
        <script src="<?php echo base_url("resources/js/toastr.min.js");?>"></script>
        <link rel="stylesheet" type="text/css" href="<?php echo base_url("resources/css/toastr.min.css");?>">
        
        <link rel="stylesheet" type="text/css" href="<?php echo base_url("resources/css/fontawesome-all.min.css");?>">
    
    </head>
    <body>
        <script src="<?php echo base_url("resources/js/electron.js?".FULL_VERSION);?>"></script>
        <script>
        
        var base_url = "<?php echo base_url(); ?>";
        
        </script>