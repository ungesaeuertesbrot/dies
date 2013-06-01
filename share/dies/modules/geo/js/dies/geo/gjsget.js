const GLib = imports.gi.GLib;
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
	if (scheme.substr(scheme.length - 3) !== "://")
		scheme += "://";
	if (resource.charAt(0) != "/" && server.charAt(server.length - 1) !== "/")
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
		if (val.charAt(val.length - 1) === "/")
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
		
		if (!this._session) {
			this._session = new Soup.Session();
			this._session.use_thread_context = true;
		}
		
		this._msg = Soup.Message.new("GET", this._uristr);
		let that = this;
		this._session.queue_message(this._msg, function(session, message) {
			delete that._msg;
			
			if (message.status_code !== 200) {
				callback(this, message.status_code, null);
				return;
			}
			
			let data = message.response_body.flatten().get_data();
			callback(this, 200, data);
		});
	},
	
	cancel: function() {
		if (this._msg)
			this._session.cancel_message(this._msg);
	},
};

String.prototype.format = imports.format.format;

var get = new GjsGet("api.geonames.org", "search", {
	"name_startsWith": "Aa",
	"featureClass": "P",
	"lang": "de",
	"type": "json",
//	"style": "short",
	"orderby": "countryName",
	"username": "dies"
});

var loop = new GLib.MainLoop(null, false);
get.run(function(getter, code, data) {
	print("Code: %d".format(code));
	if (code === 200) {
		let obj = JSON.parse(data);
		print("Anzahl der Orte: %s".format(obj.totalResultsCount));
		for (let i = 0; i < obj.totalResultsCount; i++)
			try {
				print("%s (%s)".format(obj.geonames[i].name, obj.geonames[i].countryCode));
			} catch(e) {
				print("Could not write entry #%d".format(i));
			}
	}
	
	loop.quit();
});

loop.run();

