init();

var booklight_box = $('.booklight');
var searchBar     = $('.booklight>input');
var bookmarksList = $('.booklight_list');
var statusBar     = $('.booklight_status');

// multiple shortcuts that do the same thing
key('control+b, ctrl+b', function(){ start(); });
key('esc, escape', function(){ booklight_box.hide(); });
key('enter', 'input', function(){ console.log("ENTER"); });
key('up', 'input', function(){ moveInList("UP") });
key('down', 'input', function(){ moveInList("DOWN") });
key('right', 'input', function(){ console.log("RIGHT"); });

function init() {

	// Append the search lightbox to the body DOM element
	$('body').append('<div class="booklight">'+
		'<input id="ahmad" placeholder="Filter..." type="text" data-list=".booklight_list" autocomplete="off"></input>' +
		'<span class="booklight_status"></span>' +
		'<ul class="booklight_list"></ul></div>');

	// Get the bookmarks from the local storage
	chrome.storage.local.get("booklight", function(bookmarks) {
		statusBar.text(bookmarks.booklight.length + " folders found");
		bookmarks.booklight.forEach(function(bookmark){
			var elem = $('<li>', { text: bookmark.title, id: bookmark.id });
			if (!bookmark.folder) elem.addClass('isfolder');
			bookmarksList.append(elem);
		});
	});
}

function start() {
	booklight_box.show();
	searchBar.val('').focus();
	focusItem(0);

	searchBar.on('input',function() {

		var filter = $(this).val();
		bookmarksList.find('li').hide();
		bookmarksList.find('li:contains(' + filter +')').show();

		statusBar.text(bookmarksList.find('li:visible').length + " matching results");

	});
}

function moveInList(direction) {

	var index        = $('.booklight_list li').index($('li.activeFolder'));
	var results      = bookmarksList.find('li:visible');
	var resutsNumber = results.length;

	$('li.activeFolder').removeClass('activeFolder');

	switch (direction) {
		case ('DOWN') : {
			index !== resutsNumber ? focusItem(index+1) : focusItem(0);
		} break;
		case ('UP') : {
			index !== resutsNumber ? focusItem(index-1): focusItem(resutsNumber);
		} break;
	}
}

function focusItem(index) {
	var element = $('.booklight_list').find('li:visible').eq(index);
	// Highlight the first result element
	element.addClass('activeFolder');
	element[0].scrollIntoView(false);
	// Make the placeholder as the first element
	searchBar.attr('placeholder',element.text());
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