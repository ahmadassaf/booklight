var booklight = function booklight() {

	var booklight = this;

	// The array (stack) that will hold the navigation of the main elements and their subfolders
	this.elementStack = [];
	this.urls         = [];
	this.context      = 'folder';
	this.foldersDOM   = '';

	this.urlsLazyloader;
	this.searchLazyLoader;
	this.fuzzyFolderSearch;
	this.fuzzyURLsSearch;

	this.attachKeyboardEvents = function attachKeyboardEvents() {

		var globalListener    = new window.keypress.Listener($('body')[0],{is_solitary: true});
		var booklightListener = new window.keypress.Listener($('#booklightManager')[0], {is_solitary: true});

		globalListener.simple_combo("ctrl b", function() { booklight.UI.show() });
		globalListener.simple_combo("esc", function() { booklight.UI.close() });
		globalListener.simple_combo('ctrl alt x', function(){ booklight.util.cleanURL() });

		booklightListener.simple_combo('enter', function(){ booklight.manager.addBookmark() });
		booklightListener.simple_combo('ctrl enter', function(){ booklight.manager.openURL('_blank') });
		booklightListener.simple_combo('up', function(){ booklight.navigator.moveInList("UP") });
		booklightListener.simple_combo('down', function(){ booklight.navigator.moveInList("DOWN") });
		booklightListener.simple_combo('right', function(){ booklight.navigator.moveInList("RIGHT") });
		booklightListener.simple_combo('left', function(){ booklight.navigator.moveInList("LEFT") });

	}

	this.attachMouseEvents = function attachMouseEvents() {

		// TO DO: Attach the events on the mouse clicks

		// $('body').on('click','.booklight_list li', function(){ focusItem($(this).index(), null, true)
		// }).on('dblclick', function(){ if ($(this).hasClass('isFolder')) goForward($(this)) });
	}

	this.UI = {

		build : function build() {

			// Append the search lightbox to the body DOM element
			$('body').append('<div id="booklightManager" class="booklight">'+
				'<input placeholder="Filter..." type="text" data-list=".booklight_list" autocomplete="off"></input>' +
				'<span class="isBooklit"></span>'+
				'<span class="booklight_resultsbar"></span>' +
				'<ul class="booklight_list"></ul>'+
				'<div class="booklight_statusbar"></div></div>');

			// Define the CSS selectors for the UI elements and cache them
			booklight.booklightBox  = $('.booklight');
			booklight.searchBar     = $('.booklight>input');
			booklight.bookmarksList = $('.booklight_list');
			booklight.resultBar     = $('.booklight_resultsbar');
			booklight.statusBar     = $('.booklight_statusbar');

			booklight.UI.addFolders();
			booklight.UI.getURLs();
			booklight.attachKeyboardEvents();

			// Attach the filtering functions for the inputbox
			booklight.searchBar.on('input', function() {

				var filter = $(this).val();

				// Check if the user is switching into files or folders context
				if (!filter) booklight.context = 'folder';
				// Check if the value entered is space which is the trigger for urls search
				else if (filter == ' ') { $(this).val("|"); booklight.context = 'url'; booklight.urlsLazyloader.load(false, true); }

				if (filter && filter !== ' ') {
					// Hide all the folders list and only show those matching the input query
					$('.booklight_list li').hide();
					// Check if you are inside a folder, filter only on that folders children
					if (context = "folder" && booklight.elementStack.length) {
						var nestedFolderID = booklight.elementStack[booklight.elementStack.length - 1].id ;
						booklight.fuzzyFolderSearch.search(filter).forEach(function(folder){ if (folder.parentId == nestedFolderID) booklight.bookmarksList.find('li#'+ folder.id).show() });

					} else {
						  var search = booklight.context === "url" ? booklight.fuzzyURLsSearch : booklight.fuzzyFolderSearch;
							filter     = booklight.context === "url" ? filter.replace('|','') : filter;

							// Check the context to apply appropriate fuzzy search
							if (booklight.context === "url") {
								// Create a new lazyloader instance for the urls
								booklight.searchLazyLoader = new booklight.UI.lazyloader(search.search(filter));
								booklight.searchLazyLoader.load(true);
							}
							else
								search.search(filter).forEach(function(folder){ booklight.bookmarksList.find('li#'+ folder.id).show() });
					}
				}

				// Check if when we reach a starting case for folders or urls search
				if ((!filter  && !booklight.elementStack.length) || filter == '|') {
					booklight.context == "folder" ? booklight.UI.showSection(null, true, false, "url") : booklight.UI.showSection(booklight.urlsLazyloader.urlsDOM,false,true);
				}

				booklight.UI.updateCounter();
				booklight.UI.higlightFirstElement();
			});

		},addFolders: function addFolders() {

				// Get the bookmarks folders from the local storage
				chrome.storage.local.get("booklightFolders", function(bookmarks) {
					booklight.fuzzyFolderSearch = new Fuse(bookmarks.booklightFolders, { keys: ['title'], threshold: 0.4});
					bookmarks.booklightFolders.forEach(function(bookmark){
						booklight.foldersDOM += '<li id="' + bookmark.id + '" data-dateGroupModified="' + bookmark.dateGroupModified + '" data-parent="' + bookmark.parentId + '" data-type="folder"';
						if (!bookmark.folder) booklight.foldersDOM += 'class="isFolder"';
						booklight.foldersDOM += '>' + bookmark.title + '</li>';
					});
					booklight.bookmarksList.append(booklight.foldersDOM);
				});

		},getURLs: function getURLs() {

				// Get the bookmarks urls from the local storage
				chrome.storage.local.get("booklightUrls", function(urls) {
					booklight.fuzzyURLsSearch = new Fuse(urls.booklightUrls, { keys: ['title'], threshold: 0.4});
					booklight.urls = urls.booklightUrls;
					// Create a new lazyloader instance for the urls
					booklight.urlsLazyloader = new booklight.UI.lazyloader(urls.booklightUrls);
				});

		},lazyloader: function lazyloader(elements){

				var lazyloader = this;

				this.elements  = elements;
				this.showLimit = 15;
				this.urlsDOM   = '';

				this.load = function(empty, hide) {

					var urlsDOM             = '';
					var currentAttachedUrls = this.urlsDOM == '' ? 0 : $('.booklight_list li[data-type="url"]').length;
					var limit               = this.elements.length > this.showLimit ? this.showLimit : this.elements.length;
					var urlsToAdd           = this.elements.slice(currentAttachedUrls, currentAttachedUrls + limit);

					// the idea is build a kind of lazy loading for urls to minimize the building of the DOM elements
					urlsToAdd.forEach(function(url){
						urlsDOM += '<li id="' + url.id + '" data-url="' + url.url + '" data-parent="' + url.parentId + '" data-type="url">' +
						'<img src="http://www.google.com/s2/favicons?domain_url=' + url.url + '"</img>' +
						url.title + '</li>';
					});

					lazyloader.urlsDOM += urlsDOM;

					booklight.UI.showSection(urlsDOM, empty, hide);
					booklight.UI.updateCounter();

				}

		},show : function show() {

				booklight.context = "folder";
				// Show the booklight main UI window and all of its elements if they were hidden from a previous filter operation
				booklight.booklightBox.show();
				booklight.UI.showContext();
				// Empty the searchbar input box and make it focused for direct query entry
				booklight.searchBar.val('').focus();
				booklight.searchBar.attr('placeholder', 'Filter...');
				// Highlight the first element of the results
				booklight.UI.higlightFirstElement();
				booklight.UI.updateCounter();

		},close : function close() {

				booklight.booklightBox.hide();
				booklight.UI.showSection(null, true, false, "url");

		},showContext: function showHideContext() {

			$('.booklight_list li[data-type="' + booklight.context + '"]').show();

		},showSection: function showSection(section, empty, hide, context){

			if (empty) $('.booklight_list li[data-type="' + context + '"]').remove();
			if (hide)  $('.booklight_list li').hide();

			section ? booklight.bookmarksList.append(section) : $('.booklight_list li[data-type="' + booklight.context + '"]').show();

		},focusItem : function(index, subFolder, isMouse) {

				$('li.activeFolder').removeClass('activeFolder');

				// Get the element with the index passed in the parameters
				var element         = $('.booklight_list li').eq(index);
				// The folder name of the element detected, this will augmented with the current placeholder text
				var placeholderText = element.text();
				var searchText      = booklight.searchBar.attr('placeholder');

				// Check if we are inside a subfolder. If so we want to present the folders hierarchy
				if (subFolder) {
					placeholderText = searchText + ' > ' + element.text();
				} else if (!booklight.UI.isRoot()) {
					var chunkedPlaceHolder = searchText.split('>');
					placeholderText = booklight.searchBar.attr('placeholder').replace(chunkedPlaceHolder[chunkedPlaceHolder.length - 1], ' ' + element.text());
				}

				// Highlight the first result element
				element.addClass('activeFolder');
				/* Check if the focus item is from a mouse click
				 * If not and you are navigating by keyboard then we pull the element into the current scroll view
				 * If th event is triggered by mouse, it is not natural to scroll the element into view on click
				 */
				if (!isMouse) element[0].scrollIntoView(false);
				// Change the searchbar placeholder text with the appropriate text
				booklight.searchBar.attr('placeholder', placeholderText);
				// Update the status bar with the full folder path
				booklight.UI.updateStatus(element);

		},higlightFirstElement: function(text) {

				booklight.UI.focusItem($('.booklight_list li[data-type="' + booklight.context + '"]:visible').first().index(), text);

		},updateCounter: function() {

				booklight.resultBar.text(booklight.bookmarksList.find('li:visible').length + " matching results");

		},updateStatus: function(element){

				// Check if the root parent for the current node is not the bookmarks bar or other bookmarks
				var parentsList  = getStatus(element, []);

				if (element.attr('data-type') == "url") parentsList.shift();

				booklight.statusBar.text(parentsList.reverse().join(' > '));

				// This function will recursively fetch the parent hierarchy for a current folder
				function getStatus (element, parentsArray) {

					var parentID  = element.attr('data-parent');
					if (!parentID) return parentsArray;

					parentsArray.push(element.text());
					return getStatus($('#' + parentID), parentsArray);
				}
		},activateFolder: function(isFolder, id) {

				/*
				 * These are the set of functions you need to do when you are into a new folder view
				 * higlightFirstElement: highlight the first element in the results or the last element if you are not in the homescreen
				 * updateCounter: update the filtering counter (showing the current number of folders)
				 * searchBar.val(''): reset the input text so that you can filter on the current folder
				 */

				booklight.UI.updateCounter();
				booklight.searchBar.val('');
				id && booklight.elementStack.length ? booklight.UI.focusItem(id) : booklight.UI.higlightFirstElement(isFolder);
		}, isRoot: function(){
			 if (booklight.searchBar.attr('placeholder').indexOf('>') === -1) return true;
			 	else return false;
		}
	}

	this.navigator = {

		moveInList: function(direction) {

			var element 					= $('.booklight_list li.activeFolder');
			var index             = element.index();
			var results           = booklight.bookmarksList.find('li:visible');
			var firstElementIndex = $('.booklight_list li:visible').first().index();
			var lastElementIndex  = $('.booklight_list li:visible').last().index();

			/* Handle the keyboard actions
			 * Circular movement up and down the list (when reaching top, go down and vice-versa)
			 * Moving through the folders hierarchy (right go down the list and up to go back)
			 */
			switch (direction) {
				case ('DOWN') : {
					index !== lastElementIndex ? booklight.UI.focusItem($('.booklight_list li:visible.activeFolder').nextAll('li:visible').first().index()) : booklight.UI.focusItem(firstElementIndex);
					if (booklight.context == 'url' && index >= lastElementIndex - 3) {
						// Now we have checked that we are in a url context and the urls have been lazyloaded, we need to fetch more
						// We need now to check if the lazy loader is for search results or for normal urls fetch
						booklight.searchBar.val().length == 1 ? booklight.urlsLazyloader.load(false, false) : booklight.searchLazyLoader.load(false, false);
					}
				} break;
				case ('UP') : {
					index !== firstElementIndex ? booklight.UI.focusItem($('.booklight_list li:visible.activeFolder').prevAll('li:visible').first().index()) : booklight.UI.focusItem(lastElementIndex);
				} break;
				case ('RIGHT') : {
					if (element.hasClass('isFolder')) booklight.navigator.goForward(element);
				} break;
				case ('LEFT') : {
					if (booklight.elementStack.length) booklight.navigator.goBack();
				} break;
			}

		},goBack: function() {

				// Catch the current placeholder text
				var placeholderText = booklight.searchBar.attr('placeholder');

				// Hide all the elements and only show those from the previous steps [cahced in the stack]
				$('.booklight_list li').hide();
				// Fetch the elements from the stach and show those
				var currentView = booklight.elementStack.pop();
				// If the stack is empty, this means we are back in the root -> show all the folders then
				booklight.elementStack.length ? $('.booklight_list li[data-parent="'+ booklight.elementStack[booklight.elementStack.length -1].id +'"]').show():$('.booklight_list li').show();
				// Change the placeholder text according to the current path (chop one from the end)
				booklight.searchBar.attr('placeholder', replaceRange(placeholderText, placeholderText.lastIndexOf('>'), placeholderText.length, ''));
				// Apply folder activation
				booklight.UI.activateFolder(false, currentView.index );

		},goForward : function(element) {
				/*
				 * Now, we want to cache the children so that we can revert back to the same view
				 * $('.booklight_list li:visible') this selector will only show the current visible ones
				 * which may have been filtered by a filter query
				 * What we want is actually to show back all the children in that folder before any filtering
				 */

				booklight.elementStack.push({"id" : element.attr('id') , "index" : element.index()});
				// hide the current list of elements
				$('.booklight_list li').hide();
				// Only display the subset which is the children
				$('.booklight_list li[data-parent="'+ element.attr('id') +'"]').show();
				// Apply folder activation
				booklight.UI.activateFolder(true);
		}
	}

	this.manager = {

		addBookmark: function(url, title, folder) {

			// Extract the parameters needed to add a bookmark in the Chrome API
			var element = $('.booklight_list li.activeFolder');
			var url     = window.location.href;
			var title   = document.title;
			var folder  = element.attr('id');
			var type    = element.attr('data-type');

			if (type !== "folder") {
				booklight.manager.openURL("_self")
			} else {
				chrome.runtime.sendMessage({message: "booklight", url: url, folder: folder, title: title}, function(response) {
					if (response.message == "success"){
						$('span.isBooklit').show();
					}
				});
			}

		},openURL: function openURL(target) {
				window.open($('.booklight_list li.activeFolder').attr('data-url'), target);
		}
	}

	this.util = {
		cleanURL: function() {
			window.location.href = window.location.href.split('?')[0];
		}
	}
}

/*
 * Booklight is a smarter way of add bookmakrs by allowing a spotlight like search and filtering on your bookmarks
 * Attach keyboard events and mouse events if you wish, and then build the UI and thats it !
 */

var booklight = new booklight();

booklight.UI.build();