const Signals = imports.signals;

var _lastCollectionId = 0;
function JSONCollection(fn)
{
	this._init(fn);
}

JSONCollection.prototype = {
	type: "file",
	id: null,
	
	_init: function(fn) {
		this._items = {};
		this.id = ++_lastCollectionId;
		this._unordered = false;
		this._dirty = false;
		if (!fn || !this.setStoragePath(fn)) {
			let home = GLib.get_home_dir();
			let newFile, newFilePath;
			let i = 0;
			do {
				newFilePath = GLib.build_filenamev([home, "dates_%d.jd".format(i++)]);
				let newFile = Gio.File.new_for_path(newFilePath);
			} while(newFile.query_exists(null));
			this.setStoragePath(newFilePath);
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
		let itemsNew = {};
		for each (let key in sortable)
			itemsNew[key] = this._items[key];
		this._items = itemsNew;
		this._unordered = false;
	},
	
	
	announceChange: function (date, field, eventId) {
		date = _dateToJulian(date);
		let item = this._items[date.toString()];
		if (!item)
			return false;
		if (field === "date") {
			delete this._items[date.toString()];
			this.emit("deleted", date, eventId);
			let julianNew = item.date.get_julian();
			this._items[julianNew.toString()] = item;
			this._unordered = true;
			this.emit("new", julianNew, eventId);
		} else
			this.emit("changed", date, field, eventId);
		
		this._dirty = true;
		return true;
	},
	
	
	newItem: function(date, eventId) {
		let julian = 0;
		if (date instanceof GLib.Date)
			julian = date.get_julian();
		else {
			julian = Number(date);
			if (isNaN(julian) || julian < 0)
				throw new Error("Invalid date: %s".format(date));
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
		this.emit("new", julian, eventId);
	},
	
	
	getItem: function (date, create, eventId) {
		date = _dateToJulian(date);
		let dateStr = date.toString();
		let item = this._items[dateStr];
		if (typeof item === "undefined")
			item = create ? this.newItem(date, eventId) : null;
		return item;
	},
	
	
	hasItem:function(date) {
		return typeof this._items[_dateToJulian(date).toString()] !== "undefined";
	},
	
	
	deleteItem: function (date, eventId) {
		date = _dateToJulian(date);
		delete this._items[date.toString()];
		
		this._dirty = true;
		this.emit ("deleted", date, eventId);
	},
	
	
	getIterator: function (year, mon) {
		this._sort();

		let iter = Iterator(this._items);
		try {
			let dateMin = 0;
			let dateMax = 0xffffffff;
			if (year) {
				dateMin = new GLib.Date();
				dateMin.clear(1);
				dateMin.set_year(year);
				dateMin.set_month(mon ? mon : GLib.DateMonth.JANUARY);
				dateMin.set_day(1);
				dateMin = dateMin.get_julian();
				
				dateMax = new GLib.Date();
				dateMax.clear(1);
				dateMax.set_year(year);
				let monMax = mon ? mon : GLib.DateMonth.DECEMBER;
				dateMax.set_month(monMax);
				dateMax.set_day(GLib.Date.get_days_in_month(monMax, year));
				dateMax = dateMax.get_julian();
			}

			let pair;
			do {
				pair = iter.next();
			} while (pair[0] < dateMin);

			while(pair[0] <= dateMax) {
				yield pair[1];
				pair = iter.next();
			}
		} catch(e) {
		}
	},
	
	flush: function() {
		if(!this._dirty)
			return true;
		if (!this._storageFile)
			return false;
		this._sort();
		
		GLib.Date.prototype.toJSON = function() {
			return {
				type: "GDate",
				julian: this.get_julian()
			};
		};
		let newContents = JSON.stringify(this._items);
		delete GLib.Date.prototype.toJSON;
		GLib.file_set_contents(this._storageFile.get_path(), newContents, newContents.length);
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
	
	getStoragePath: function() {
		return this._storageFile.get_path();
	},
	
	setStoragePath: function(path) {
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
		
		this._storageFile = file;
		this._dirty = true;
		return true;
	},
};

Signals.addSignalMethods(JSONCollection.prototype);

function _dateToJulian(date)
{
	if (date && date instanceof GLib.Date)
		return date.get_julian();
	else {
		let julian = Number(date);
		if (isNaN(julian) || julian < 0)
			throw new Error("Invalid date: %s".format(date));
		return julian;
	}
}

