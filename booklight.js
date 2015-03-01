init();

var booklight_box = $('.booklight');
var searchBar     = $('.booklight>input');
var bookmarksList = $('.booklight_list');
var resultBar     = $('.booklight_resultsbar');
var statusBar     = $('.booklight_statusbar');

// The stack that will hold the navigation of the main elements and their subfolders
var elementStack  = [];

// multiple shortcuts that do the same thing
key('control+b, ctrl+b', function(){ start(); });
key('esc, escape', function(){ close(); });
key('enter', 'input', function(){ addBookmark(window.location.href, document.title, $('.booklight_list li.activeFolder').attr('id')) });
key('up', 'input', function(){ moveInList("UP") });
key('down', 'input', function(){ moveInList("DOWN") });
key('right', 'input', function(){ moveInList("RIGHT") });
key('left', 'input', function(){ moveInList("LEFT") });

function init() {

	// Append the search lightbox to the body DOM element
	$('body').append('<div class="booklight">'+
		'<input placeholder="Filter..." type="text" data-list=".booklight_list" autocomplete="off"></input>' +
		'<span class="isBooklit"></span>'+
		'<span class="booklight_resultsbar"></span>' +
		'<ul class="booklight_list"></ul>'+
		'<div class="booklight_statusbar"></div></div>');

	// Get the bookmarks from the local storage
	chrome.storage.local.get("booklight", function(bookmarks) {
		resultBar.text(bookmarks.booklight.length + " folders found");
		bookmarks.booklight.forEach(function(bookmark){
			var elem = $('<li>', { text: bookmark.title, id: bookmark.id, 'data-dateGroupModified': bookmark.dateGroupModified, 'data-parent': bookmark.parent});
			if (!bookmark.folder) elem.addClass('isFolder');
			bookmarksList.append(elem);
		});
	});

	// attach the events on the mouse clicks
	// $('body').on('click','.booklight_list li', function(){ focusItem($(this).index(), null, true)
	// }).on('dblclick', function(){ if ($(this).hasClass('isFolder')) expandFolder($(this)) });

}

function start() {
	booklight_box.show();
	searchBar.val('').focus();
	higlightFirstElement();

	searchBar.on('input',function() {

		var filter = $(this).val();

		bookmarksList.find('li').hide();

		// Check if you are inside a folder, filter only on that folders children
		if (elementStack.length) {
			bookmarksList.find('li[data-parent="'+ elementStack[elementStack.length - 1].id +'"]:contains(' + filter +')').show();
		} else bookmarksList.find('li:contains(' + filter +')').show();

		updateCounter();
		higlightFirstElement();
	});
}

function addBookmark(url, title, folder) {
	chrome.runtime.sendMessage({message: "booklight", url: url, folder: folder, title: title}, function(response) {
  	if (response.message == "success"){
  		$('span.isBooklit').show();
  	}
	});
}

function moveInList(direction) {

	var element 					= $('.booklight_list li.activeFolder');
	var index             = element.index();
	var results           = bookmarksList.find('li:visible');
	var resutsNumber      = results.length;

	var firstElementIndex = $('.booklight_list li:visible').first().index();
	var lastElementIndex  = $('.booklight_list li:visible').last().index();

	switch (direction) {
		case ('DOWN') : {
			index !== lastElementIndex ? focusItem($('.booklight_list li:visible.activeFolder').nextAll('li:visible').first().index()) : focusItem(firstElementIndex);
		} break;
		case ('UP') : {
			index !== firstElementIndex ? focusItem($('.booklight_list li:visible.activeFolder').prevAll('li:visible').first().index()) : focusItem(lastElementIndex);
		} break;
		case ('RIGHT') : {
			if (element.hasClass('isFolder')) expandFolder(element);
		} break;
		case ('LEFT') : {
			if (elementStack.length) goFolderBack();
		} break;
	}
}

function higlightFirstElement(text) {
	focusItem($('.booklight_list li:visible').first().index(), text);
}

function close() {
	booklight_box.hide();
	$('.booklight_list li').show();
}

function updateCounter() {
	resultBar.text(bookmarksList.find('li:visible').length + " matching results");
}

function updateStatus(element){
	// Check if the root parent for the current node is not the bookmarks bar or other bookmarks
	var parentsList  = getStatus(element, []);
	var statusText   = '';

	statusBar.text(parentsList.reverse().join(' > '));

}

function getStatus(element, parentsArray) {

	var parentID  = element.attr('data-parent');

	if (!parentID) return parentsArray;
	if (parentID == "1" && parentID == "2") return parentsArray;

	parentsArray.push(element.text());
	return getStatus($('#' + parentID), parentsArray);
}

function goFolderBack() {

	var placeholderText = searchBar.attr('placeholder');

	$('.booklight_list li').hide();
	elementStack.pop().elements.show();
	if (!elementStack.length) $('.booklight_list li').show();
	higlightFirstElement();
	updateCounter();
	searchBar.val('');
	searchBar.attr('placeholder', replaceRange(placeholderText, placeholderText.lastIndexOf('>'), placeholderText.length, ''));
}

function expandFolder(element) {

	var children = $('.booklight_list li[data-parent="'+ element.attr('id') +'"]');
	// save the current view in the elements stack
	elementStack.push({"id" : element.attr('id'), "elements" : $('.booklight_list li:visible')});
	// hide the current list of elements
	$('.booklight_list li').hide();
	// Only display the subset which is the children
	children.show();
	// highlight the first element of the results
	higlightFirstElement(true);
	// update the match text counter
	updateCounter();
	searchBar.val('');
}

function focusItem(index, subFolder, isMouse) {

	$('li.activeFolder').removeClass('activeFolder');

	var element         = $('.booklight_list li').eq(index);
	var placeholderText = element.text();

	if (subFolder){
		placeholderText = searchBar.attr('placeholder') + ' > ' + element.text();
	} else if (searchBar.attr('placeholder').indexOf('>') !== -1) {
		var chunkedPlaceHolder = searchBar.attr('placeholder').split('>');
		placeholderText = searchBar.attr('placeholder').replace(chunkedPlaceHolder[chunkedPlaceHolder.length - 1], ' ' + element.text());
	}

	// Highlight the first result element
	element.addClass('activeFolder');
	if (!isMouse) element[0].scrollIntoView(false);
	// Make the placeholder as the first element
	searchBar.attr('placeholder', placeholderText);
	updateStatus(element);
}

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