function makeQueryString(parts) {
	let queryStr = "";
	
	for (let [field, data] in Iterator(parts)) {
		if (queryStr.length > 0)
			queryStr += "&";
		queryStr += field + "=";
		queryStr += encodeURIComponent(data);
	}
	
	return queryStr;
}

function makeURIString(scheme, server, resource, query) {
	if (!scheme.endsWith("://"))
		scheme += "://";
	if (resource.charAt(0) != "/" && !server.endsWith("/"))
		resource = "/" + resource;
	queryStr = query !== null && typeof query === "object" ? makeQueryString(query) : "";
	if (queryStr.length > 0)
		resource += "?";
	return scheme + server + resource + queryStr;
}

