// Is Atribute supported?
function isAtributeSupported(el,att) {
	var t = document.createElement(el);
	if(att in t) return true;
	else return false;
}

// Custom menu
function clickClose(m) {
	$('body').delay(1200).bind('click',function(){m.fadeOut(20);});
}

/*
$(function()
{

	
});
/**/
