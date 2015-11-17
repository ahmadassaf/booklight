// Additional Helper classes and overriders
// replace a string at a certain range with another string

function replaceRange(s, start, end, substitute) {
	return s.substring(0, start) + substitute + s.substring(end);
}

// Overriding the default jQuery contains to make it case insensitive
$.expr[":"].contains = $.expr.createPseudo(function(arg) {
    return function( elem ) {
        return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});