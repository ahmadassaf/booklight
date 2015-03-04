var booklight = function booklight() {

	var booklight = this;

	this.foldersList = [];
	this.urls        = [];

	this.getBookmarks = function() {

		chrome.bookmarks.getTree(function(bookmarksTree) {

			booklight.foldersList = filterRecursively(bookmarksTree, "children", function(node) {
					if (node.url) booklight.urls.push(node);
					return !node.url && node.id > 0;
				}).sort(function(a, b) {
				// The sort functions make sure that we will have the last used folders on top
				return b.dateGroupModified - a.dateGroupModified;
				});

				chrome.storage.local.set({"booklightFolders": booklight.foldersList }, function(bookmarks) { console.log("Setting the folders list into the local storage !!") });
				chrome.storage.local.set({"booklightUrls": booklight.urls }, function(bookmarks) { console.log("Setting the urls list into the local storage !!") });

		});

		// Recursively filter the passed TreeNodes
		function filterRecursively(nodeArray, childrenProperty, filterFn, results) {

			results = results || [];

			nodeArray.forEach( function( node ) {
				if (filterFn(node)) results.push({title: node.title, id: node.id, dateGroupModified: node.dateGroupModified, folder: isLeaf(node), parent: node.parentId});
				if (node.children) filterRecursively(node.children, childrenProperty, filterFn, results);
			});
			return results;
		};

		// Check if the current bookmark is a leaf (does not contain more folders)
		function isLeaf(node) {
			var leafyNodes = [];
			node.children.forEach(function(child){
				if (!child.hasOwnProperty('children')) leafyNodes.push(1);
			});
			var isLeaf = leafyNodes.length == node.children.length ? true : false;
			return isLeaf;
		}
	}

	this.attachListeners = function() {

		chrome.runtime.onMessage.addListener(function(request, sender, sendrequest) {
			if (request.message == "booklight") {
				console.log("adding: " + request.url + " title: " + request.title + " to folder id: " + request.folder);
				chrome.bookmarks.create({ 'parentId': request.folder, 'title': request.title, 'url': request.url });
				//booklight.getBookmarks();
				sendrequest({message: "success"});
			}
		});
	}
}

var booklight = new booklight();

booklight.attachListeners();
booklight.getBookmarks();