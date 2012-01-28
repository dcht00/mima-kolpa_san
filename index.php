<?php
header("Cache-Control: no-cache, must-revalidate");
$file = 'index.html';
//*
$last_modified_time = filemtime($file); 
$last_modified_timejs = filemtime('js/mmui.js'); 
if( $last_modified_timejs > $last_modified_time ) $last_modified_time = $last_modified_timejs;
$etag = md5_file($file); 

header("Last-Modified: ".gmdate("D, d M Y H:i:s", $last_modified_time)." GMT"); 
//header("Etag: $etag");
/**/
echo readfile($file);
?>