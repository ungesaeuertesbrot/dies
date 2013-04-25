const Collection = imports.dies.mem_data_mgr.item_collection;

function Manager()
{
}

Manager.prototype = {
	id: "json",
	type: "file",
	multi: true,
	storage: {
		accept_file_types: {
			"jd": "JSON Diary"
		},
		instant_write: false,
	},
	
	create_collection: function(fn) {
		return new Collection.JSONCollection(fn);
	}
};

