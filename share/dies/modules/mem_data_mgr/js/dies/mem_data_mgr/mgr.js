const Collection = imports["dies/mem_data_mgr/item_collection"];

function Manager ()
{
}

Manager.prototype = {
	id: "mem",
	type: "memory",
	multi: true,
	storage: null,
	
	create_collection: function () {
		return new Collection.DataCollection ();
	}
};

