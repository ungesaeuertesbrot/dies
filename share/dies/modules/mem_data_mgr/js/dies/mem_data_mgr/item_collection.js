const Signals = imports.signals;

var __last_collection_id = 0;
function JSONCollection(fn)
{
	this._init(fn);
}

JSONCollection.prototype = {
	type: "file",
	id: null,
	
	_init: function(fn) {
		this._items = {};
		this.id = ++__last_collection_id;
		this._unordered = false;
		this._dirty = false;
		if (!fn || !this.set_storage_path(fn)) {
			let home = GLib.get_home_dir();
			let new_file, new_file_path;
			let i = 0;
			do {
				new_file_path = GLib.build_filenamev([home, "dates_%d.jd".format(i++)]);
				let new_file = Gio.File.new_for_path(new_file_path);
			} while(new_file.query_exists(null));
			this.set_storage_path(new_file_path);
		} else {
			let file = Gio.File.new_for_path(fn);
			try {
				let [result, json] = file.load_contents(null);
				this._items = JSON.parse(json, function(k, v) {
					// GDates are treated specially upon stringifying and must
					// be converted back here.
					if (typeof v === "object" && v !== null && v.type === "GDate") {
						let date = new GLib.Date();
						date.set_julian(Number(v.julian));
						return date;
					}
					return v;
				});
			} catch(e) {
			}
		}
	},
	
	
	/*
	 * Though JavaScript does not guarantee that the fields of an object will
	 * ever be enumerated in any particular order, SpiderMonkey does so, namely
	 * in the order in which they have been added to the object (at least for
	 * fields owned by the object itself as opposed to the prototype).
	 */
	_sort: function() {
		if (!this._unordered)
			return;
		
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
	
	
	announce_change: function (date, field, event_id) {
		date = _date_to_julian(date);
		let item = this._items[date.toString()];
		if (!item)
			return false;
		if (field === "date") {
			delete this._items[date.toString()];
			this.emit("deleted", date, event_id);
			let julian_new = item.date.get_julian();
			this._items[julian_new.toString()] = item;
			this._unordered = true;
			this.emit("new", julian_new, event_id);
		} else
			this.emit("changed", date, field, event_id);
		
		this._dirty = true;
		return true;
	},
	
	
	new_item: function(date, event_id) {
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
		
		this._dirty = true;
		this.emit("new", julian, event_id);
	},
	
	
	get_item: function (date, create, event_id) {
		date = _date_to_julian(date);
		let date_str = date.toString();
		let item = this._items[date_str];
		if (typeof item === "undefined")
			item = create ? this.new_item(date, event_id) : null;
		return item;
	},
	
	
	has_item:function(date) {
		return typeof this._items[_date_to_julian(date).toString()] !== "undefined";
	},
	
	
	delete_item: function (date, event_id) {
		date = _date_to_julian(date);
		delete this._items[date.toString()];
		
		this._dirty = true;
		this.emit ("deleted", date, event_id);
	},
	
	
	get_iterator: function (year, mon) {
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
	},
	
	flush: function() {
		if(!this._dirty)
			return true;
		if (!this._storage_file)
			return false;
		this._sort();
		
		GLib.Date.prototype.toJSON = function() {
			return {
				type: "GDate",
				julian: this.get_julian()
			};
		};
		let new_contents = JSON.stringify(this._items);
		delete GLib.Date.prototype.toJSON;
		GLib.file_set_contents(this._storage_file.get_path(), new_contents, new_contents.length);
/*		this._storage_file.replace_contents(new_contents,		// contents
											new_contents.length,// content lenth
											null,				// old etag
											false,				// make backup?
											Gio.FileCreateFlags.NONE,// create flags
											null,				// new etag
											null);				// cancelable
*/
		return true;
	},
	
	get_storage_path: function() {
		return this._storage_file.get_path();
	},
	
	set_storage_path: function(path) {
		let file = Gio.File.new_for_path(path);
		if (file.query_exists(null)) {
			let info = file.query_info("%s,%s".format(Gio.FILE_ATTRIBUTE_ACCESS_CAN_WRITE, Gio.FILE_ATTRIBUTE_STANDARD_TYPE), Gio.FileQueryInfoFlags.NONE, null);
			let writable = info.get_attribute_boolean(Gio.FILE_ATTRIBUTE_ACCESS_CAN_WRITE);
			let type = info.get_attribute_uint32(Gio.FILE_ATTRIBUTE_STANDARD_TYPE);
			if (!(writable && (type === Gio.FileType.UNKNOWN || type === Gio.FileType.REGULAR)))
				return false;
		} else {
			let parent = file.get_parent();
			let info = parent.query_info(Gio.FILE_ATTRIBUTE_ACCESS_CAN_WRITE, Gio.FileQueryInfoFlags.NONE, null);
			if (!info.get_attribute_boolean(Gio.FILE_ATTRIBUTE_ACCESS_CAN_WRITE))
				return false;
		}
		
		this._storage_file = file;
		this._dirty = true;
		return true;
	},
};

Signals.addSignalMethods(JSONCollection.prototype);

function _date_to_julian(date)
{
	if (date && date instanceof GLib.Date)
		return date.get_julian();
	else {
		let julian = Number(date);
		if (isNaN(julian) || julian < 0)
			throw "Invalid date: " + date;
		return julian;
	}
}

