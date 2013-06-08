const Collection = imports.dies.mem_data_mgr.item_collection;

function Manager()
{
}

Manager.prototype = {
	id: "json",
	type: "file",
	multi: true,
	storage: {
		acceptFileTypes: {
			"jd": "JSON Diary"
		},
		instantWrite: false,
	},
	
	createCollection: function(fn) {
		return new Collection.JSONCollection(fn);
	}
};

