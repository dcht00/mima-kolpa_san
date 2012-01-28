
function getRowcount(str,width) {
	var len = str.length;
	var rows = 3;
	if(width) {
		rows = len/width+2;
	} else {
		if( len>300 ) rows = 10;
		if( len>600 ) rows = 15;
		if( len>1000 ) rows = 25;
		if( len>1500 ) rows = 35;
	}
	return rows;
}

function escapeForHTML(htmlwannabe)
{
	return htmlwannabe.replace(/&/g,'&amp;').replace(/>/g,'&gt;').replace(/</g,'&lt;').replace(/"/g,'&quot;')
}
function escapeForJS(text)
{
	text = escapeForHTML(text);
	return text.replace(/'/g,'\'');
}

function emptyString (mixed_var, placeholder) {
	if(empty(mixed_var)) return (empty(placeholder) ? '' : placeholder);
	return mixed_var;
}

function empty (mixed_var) {
    // !No description available for empty. @php.js developers: Please update the function summary text file.
    // 
    // version: 1006.1915
    // discuss at: http://phpjs.org/functions/empty
    // +   original by: Philippe Baumann
    // +      input by: Onno Marsman
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: LH
    // +   improved by: Onno Marsman
    // +   improved by: Francesco
    // +   improved by: Marc Jansen
    // +   input by: Stoyan Kyosev (http://www.svest.org/)
    // *     example 1: empty(null);
    // *     returns 1: true
    // *     example 2: empty(undefined);
    // *     returns 2: true
    // *     example 3: empty([]);
    // *     returns 3: true
    // *     example 4: empty({});
    // *     returns 4: true
    // *     example 5: empty({'aFunc' : function () { alert('humpty'); } });
    // *     returns 5: false
    
    var key;
    
    if (mixed_var === "" ||
        mixed_var === 0 ||
        mixed_var === "0" ||
        mixed_var === "undefined" ||
        mixed_var === null ||
        mixed_var === false ||
        typeof mixed_var === 'undefined'
    ){
        return true;
    }
 
    if (typeof mixed_var == 'object') {
        for (key in mixed_var) {
            return false;
        }
        return true;
    }
 
    return false;
}

function htmlentities (string) {
	if(empty(string)) return '';
	return string.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function openLink(url, newwindow)
{	
	if (!e) var e = window.event;
	e.cancelBubble = true;	
	if (e.stopPropagation) e.stopPropagation();
	//return;
	if( newwindow==null ) newwindow = true;
	if( newwindow ) {
		window.open(url);
	}
}

function nl2br (str, is_xhtml) {
    // Converts newlines to HTML line breaks
    //
    // version: 1103.1210
    // discuss at: http://phpjs.org/functions/nl2br
    // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Philip Peterson
    // +   improved by: Onno Marsman
    // +   improved by: Atli Þór
    // +   bugfixed by: Onno Marsman
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // +   improved by: Maximusya
    // *     example 1: nl2br('Kevin\nvan\nZonneveld');
    // *     returns 1: 'Kevin\nvan\nZonneveld'
    // *     example 2: nl2br("\nOne\nTwo\n\nThree\n", false);
    // *     returns 2: '<br>\nOne<br>\nTwo<br>\n<br>\nThree<br>\n'
    // *     example 3: nl2br("\nOne\nTwo\n\nThree\n", true);
    // *     returns 3: '\nOne\nTwo\n\nThree\n'
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '' : '<br>';

    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}
