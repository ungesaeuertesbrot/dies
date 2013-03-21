const Event = imports.malus.event;

var __last_collection_id = 0;
function DataCollection ()
{
	this._init (++__last_collection_id);
}

DataCollection.prototype = {
	type: "memory",
	id: null,
	
	_init: function (id) {
		this._items = [];
		this._ordered_item_ids = [];
		this._last_item_id = 0;
		this.id = id;
	},
	
	
	_sort_items: function () {
		this._ordered_item_ids.sort (function (a, b) {
			return this._items[a].date.compare (this._items[b].date);
		}.bind (this));
	},
	
	
	notify_change: function (id, field) {
		if (field === "date")
			this._sort_items ();
		this.fire_event ("changed", id, field);
	},
	
	
	new_item: function (init) {
		var item = {id: ++this._last_item_id};
		for (let member in init)
			item[member] = init[member];
		this.add_item (item);
		return item;
	},
	
	
	add_item: function (item) {
		if (this._items[item.id])
			throw new Error ("Item with id " + item.id + " already exists in collection");
		this._items[item.id] = item;
		this._ordered_item_ids.push (item.id);
		this._sort_items ();
		this.fire_event ("new", item.id);
	},
	
	
	delete_item: function (id) {
		if (typeof this._items[id] == "undefined")
			return;
		this._items[id] = undefined;
		let ordered_index = this._ordered_item_ids.indexOf (id);
		this._ordered_item_ids.splice (ordered_index, 1)
		this.fire_event ("deleted", id);
	},
	
	
	get_item: function (id) {
		return this._items[id] ? this._items[id] : null;
	},
	
	
	get_iterator: function () {
		for (let i = 0; i < this._ordered_item_ids.length; i++) {
			yield this._items[this._ordered_item_ids[i]];
		}
	}
};
Event.add_events (DataCollection.prototype, ["changed", "new", "deleted"]);

