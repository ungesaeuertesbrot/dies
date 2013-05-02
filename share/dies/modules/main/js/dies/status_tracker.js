const Signals = imports.signals;
const GLib = imports.gi.GLib;

function StatusTracker(injector)
{
	this._init(injector);
}

StatusTracker.prototype = {
	_init: function(injector) {
		let that = this;
		
		this._active_collection = null;
		Object.defineProperty(this, "active_collection", {
			configurable: false,
			enumerable: true,
			set: function(new_v) {
				if (that._active_collection === new_v)
					return;
				let old_v = that._active_collection;
				if (Array.isArray(that._collection_event_handler_ids)) {
					try {
						for each (let eid in that._collection_event_handler_ids)
							old_v.disconnect(eid);
					} catch(e) {
					}
					delete that._collection_event_handler_ids;
				}
				
				if (old_v)
					old_v.flush();
				
				that._active_collection = new_v;
				
				if (new_v) {
					let eids = [];
					eids.push(new_v.connect("new", function(collection, id) {
						that.selected_date = id;
						return false;
					}));
					eids.push(new_v.connect("deleted", function(collection, id) {
						if (id === that._selected_item.date.get_julian())
							that._selected_item = null;
						return false;
					}));
					that._collection_event_handler_ids = eids;
					
					that._selected_item = new_v.get_item(that._selected_date);
				}
				
				that.emit("collection-activated", new_v);
			},
			get: function() {
				return that._active_collection;
			}
		});
		
		this._selected_date = null;
		Object.defineProperty(this, "selected_date", {
			configurable: false,
			enumerable: true,
			set: function(newv) {
				if (!(newv instanceof GLib.Date)) {
					let new_date = new GLib.Date();
					newv = Number(newv);
					if (isNaN(newv))
						throw "Invalid argument. Only accepts GLib.Date and julian dates";
					new_date.set_julian(newv);
					newv = new_date;
				}
				
				if (!newv.valid())
					throw "Cannot be set to invalid date";
				
				if (that._active_collection)
					that._selected_item = that._active_collection.get_item(newv);
				else
					that._selected_item = null;
				
				if (that._selected_date instanceof GLib.Date
					&& that._selected_date.valid()
					&& !that._selected_date.compare(newv))
					return;

				that._selected_date = newv;
				that.emit("date-selected", newv);
			},
			get: function() {
				return that._selected_date;
			}
		});
		
		this._selected_item = null;
		Object.defineProperty(this, "selected_item", {
			configurable: false,
			enumerable: true,
			get: function() {
				return that._selected_item;
			}
		});
	
	},
};

Signals.addSignalMethods(StatusTracker.prototype);

