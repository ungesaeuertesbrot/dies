const Soup = imports.gi.Soup;

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

function GjsGet(server, resource, query) {
	this._init(server, resource, query);
}

GjsGet.prototype = {
	_init: function(server, resource, query) {
		this.server = server;
		this.resource = resource;
		this.query = query;
		this._dirty = true;
	},
	
	set server(val) {
		if (typeof val !== "string")
			val = "";
		if (val.endsWith("/"))
			this._server = val.substr(0, val.length - 1)
		this._server = val;
		this._dirty = true;
	},
	
	get server() {
		return this._server;
	},
	
	set resource(val) {
		if (typeof val !== "string")
			val = "";
		if (val.charAt(0) !== "/")
			val = "/" + val;
		this._resource = val
		this._dirty = true;
	},
	
	get resource() {
		return this._resource;
	},
	
	set query(val) {
		this._query = {};
		if (typeof val !== "object" || val === null)
			return;
		
		for (let [key, data] in Iterator(val))
			this._query[key] = data.toString();
		this._dirty = true;
	},
	
	get query() {
		return this._query;
	},
	
	run: function(callback) {
		if (this._dirty) {
			if (this._server.length === 0)
				throw new Error("Must set a server before call to run");
			this._uristr = makeURIString("http", this._server, this._resource, this._query);
			this._dirty = false;
		}
		
		
	},
};

