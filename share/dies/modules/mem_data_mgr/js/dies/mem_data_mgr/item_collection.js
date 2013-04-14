const Signals = imports.signals;

var __last_collection_id = 0;
function DataCollection ()
{
	this._init (++__last_collection_id);
}

DataCollection.prototype = {
	type: "memory",
	id: null,
	
	_init: function (id) {
		this._items = {};
		this.id = id;
		this._unordered = false;
	},
	
	
	/*
	 * Though JavaScript does not guarantee that the fields of an object will
	 * ever be enumerated in any particular order, SpiderMonkey does so, namely
	 * in the order in which they have been added to the object (at least for
	 * field owned by the object as opposed to the prototype).
	 */
	_sort: function() {
		let sortable = [];
		for (let key in this._items)
			sortable.push(key);
		sortable.sort(function(a, b) {return a - b;});
		let items_new = {};
		for each (let key in sortable)
			items_new[key] = this._items[key];
		this._items = items_new;
		this._unordered = false;
	},
	
	
	announce_change: function (date, field) {
		if (date instanceof GLib.Date)
			date = date.get_julian();
		let item = this._items[date].toString();
		if (!item)
			return false;
		if (field === "date") {
			delete this._items[date.toString()];
			let julian_new = item.date.get_julian();
			this._items[julian_new.toString()] = item;
			this._unordered = true;
		}
		this.emit ("changed", date, field);
		return true;
	},
	
	
	new_item: function(date) {
		let item = {date: new GLib.Date()};
		item.date.set_julian(date);
		this._items[date.toString()] = item;
		if (!this._unordered) {
			// if it is not unordered, that last key we get from for … in
			// must also be the highest. 
			let highest = 0;
			for (highest in this._items);
			// if the new key is not bigger order is not disturbed since we
			// added the new element to the end of the object.
			if (highest > date)
				this._unordered = true;
		}
		this.emit("new", date);
	},
	
	
	get_item: function (date, create) {
		if (date instanceof GLib.Date)
			date = date.get_julian();
		let item = null;
		let date_str = date.toString();
		if (this._items.hasOwnProperty(date_str)) {
			item = this._items[date_str];
		} else if (create !== false) {
			item = this.new_item(date);
		} else
			return null;
		return item;
	},
	
	
	has_item:function(date) {
		if (date instanceof GLib.Date)
			date = date.get_julian();
		return typeof this._items[date.toString()] !== "undefined";
	},
	
	
	delete_item: function (date) {
		if (date instanceof GLib.Date)
			date = date.get_julian();
		delete this._items[date.toString()];
		this.emit ("deleted", date);
	},
	
	
	get_iterator: function () {
		if (this._unordered)
			this._sort();
		for each (let item in this._items) {
			yield item;
		}
	}
};

Signals.addSignalMethods(DataCollection.prototype);

