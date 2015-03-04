// Additional Helper classes and overriders
// replace a string at a certain range with another string

function replaceRange(s, start, end, substitute) {
	return s.substring(0, start) + substitute + s.substring(end);
}

// Overriding the filter function to make it work on the input boxes
key.filter = function(event){
	var tagName = (event.target || event.srcElement).tagName;
	key.setScope(/^(INPUT)$/.test(tagName) ? 'input' : 'other');
	return true;
}

// Overriding the default jQuery contains to make it case insensitive
$.expr[":"].contains = $.expr.createPseudo(function(arg) {
    return function( elem ) {
        return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});