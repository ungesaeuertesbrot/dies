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
		let julian = 0;
		if (date instanceof GLib.Date)
			julian = date.get_julian();
		else {
			julian = Number(date);
			if (isNaN(julian) || julian < 0)
				throw "Invalid date: " + date;
			date = GLib.Date();
			date.set_julian(julian);
		}
		let item = {date: date};
		this._items[julian.toString()] = item;
		if (!this._unordered) {
			// if it is not unordered, that last key we get from for … in
			// must also be the highest. 
			let highest = 0;
			for (highest in this._items);
			// if the new key is not bigger order is not disturbed since we
			// added the new element to the end of the object.
			if (highest > julian)
				this._unordered = true;
		}
		this.emit("new", julian);
	},
	
	
	get_item: function (date, create) {
		if (date instanceof GLib.Date)
			date = date.get_julian();
		let date_str = date.toString();
		let item = this._items[date_str];
		if (typeof item === "undefined")
			item = create ? this.new_item(date) : null;
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
	
	
	get_iterator: function (year, mon) {
		if (this._unordered)
			this._sort();

		let iter = Iterator(this._items);
		try {
			let date_min = 0;
			let date_max = 0xffffffff;
			if (year) {
				date_min = new GLib.Date();
				date_min.clear(1);
				date_min.set_year(year);
				date_min.set_month(mon ? mon : GLib.DateMonth.JANUARY);
				date_min.set_day(1);
				date_min = date_min.get_julian();
				
				date_max = new GLib.Date();
				date_max.clear(1);
				date_max.set_year(year);
				let mon_max = mon ? mon : GLib.DateMonth.DECEMBER;
				date_max.set_month(mon_max);
				date_max.set_day(GLib.Date.get_days_in_month(mon_max, year));
				date_max = date_max.get_julian();
			}

			let pair;
			do {
				pair = iter.next();
			} while (pair[0] < date_min);

			while(pair[0] <= date_max) {
				yield pair[1];
				pair = iter.next();
			}
		} catch(e) {
		}
	}
};

Signals.addSignalMethods(DataCollection.prototype);

