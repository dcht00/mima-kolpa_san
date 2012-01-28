<?php
header("Cache-Control: no-cache, must-revalidate");
$data['entry'] = $id;
//echo file_get_contents("http://10.14.136.187:8080/BTW/entries/sparklehorse%40middlemachine.com?access_token=0B535081575ADF13F0057C7EB49E52F6");
//echo file_get_contents("http://10.14.136.187:8080/BTW/entries/blabla?test");
$uri = $_SERVER['QUERY_STRING'];
$uri = substr($uri,strlen('query='));
//print_r($uri);
$url = 'http://194.249.198.75:8765'.$uri;
print_r($url);
$fp = fopen($url,"r");
//print_r($_SERVER);
fpassthru($fp);
fclose($fp);
?>