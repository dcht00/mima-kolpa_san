<?php
$data = file('../js/mmui.js');
foreach( $data as $row ) {
/*echo "$row\n";*/
  if(strpos($row, 'mmUI.uiver')!==false) {
	$ver = substr($row,strpos($row,"'")+1);
	$ver = substr($ver,0,strpos($ver,"'"));
	break;
  }
}
echo $ver;
?>