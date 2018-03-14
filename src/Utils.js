module.exports = {
	getLinkHref: function(data, name) {
		link = data._links.filter(item => {
			return item.rel === name;
		});
		if(link.length === 0) {
			return null;
		}
		return link[0].href;
	}
};