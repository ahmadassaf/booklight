var foldersList   = [],  urls = [];

chrome.bookmarks.getTree(function(bookmarksTree) {
console.log(bookmarksTree);
	foldersList = filterRecursively(bookmarksTree, "children", function(node) {
			if (node.url) urls.push(node);
			return !node.url && node.id > 0;
		}).sort(function(a, b) {
		// The sort functions make sure that we will have the last used folders on top
		return b.dateGroupModified - a.dateGroupModified;
		});

		chrome.storage.local.set({"booklight": foldersList }, function(bookmarks) { console.log("Setting the folders list into the local storage !!") });
		chrome.storage.local.set({"urls": urls }, function(bookmarks) { console.log("Setting the urls list into the local storage !!") });

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

function isLeaf(node) {
	var leafyNodes = [];
	node.children.forEach(function(child){
		if (!child.hasOwnProperty('children')) leafyNodes.push(1);
	});
	var isLeaf = leafyNodes.length == node.children.length ? true : false;
	return isLeaf;
}
