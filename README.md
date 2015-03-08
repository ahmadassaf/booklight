Booklight
==========

I got fed up wasting my time trying to navigate my way through bunch of bookmarks folder to arrange them. So if you are:
- Obsessed with organization
- Have a couple hundreds (or thousands) of folders in your bookmarks
- You like to keep things tidy and every page has to be in its "perfect" place

then you came to the right place. **Booklight** is a clean Chrome Extension to ease the way of adding a bookmark. 

To Launch press (ctrl/Control + b) and thats it !
[Download from Chrome Store](https://chrome.google.com/webstore/detail/booklight/lkdhojpobehkcldjmileiancjjpdeakk)

## Watch Booklight Video
[![booklightVideo](https://www.dropbox.com/s/dgu57k0424rnjhq/booklight_video.png?dl=1)](https://www.youtube.com/watch?v=8AB1kE6U-2g)

### Features

- Filter bookmarks based on manual entry
- Show the path of the current selected folder
- Navigate easily through the folders tree using keyboard
    - if the folder is highlighted in blue this means that it contains sub-folders as well. The right arrow (->) keyboard key will go inside that folder. You can go back one step to the back using the left keyboard arrow (<-)
- Bookmark directly when you find your target
- The ability to switch to urls search **NEW**
- Launching urls in current or new tab **NEW**
- Fuzzy search enabled for filtering on both folders and urls **NEW**

![booklight](http://g.recordit.co/CP32P1AZwl.gif)

## Bookmark Search & launch

Booklight now has the ability to search on your bookmakrs **and it is blazing fast**. I have around 20,000 bookmarks ! and through smart lazy loading and fuzzy search, you can now easily search and launch bookmarks anywhere while browsing.
To switch to the url search mode just hit `space` and then you will see that you can now search urls by having the `|` symbol in the input box.
To launch a url in the current window, simply hit `enter` and to open it in a new tab hit `ctr\control + enter`
![booklight-urls](http://g.recordit.co/nDU3F0WslP.gif)

### Booklight Performance
I currently have over 1000 folders and 20,000 bookmarked urls. Booklight is blazing fast, to achieve this i implement various hacks to minimize DOM manipulations and most importantly lazy-loading of urls. The lazy loading happens in the following function:

```javascript
lazyloader: function lazyloader(elements){

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
}
```
You can tweak the number of elements you want to show on every iteration and it works for both searching and filtering.

### Things i would like to do

- Add mouse interactions
- Add better logic to the star icon (at the moment it only shows when the page is successfully bookmarked) but it will not update if remove the bookmark ... etc.
- ~~Add fuzzy search for filtering from input box~~
- Smart folder suggestions
- ~~Remember last location when going back to main screen or removing filters~~ **done**
- 
[Download from Chrome Store](https://chrome.google.com/webstore/detail/booklight/lkdhojpobehkcldjmileiancjjpdeakk)
