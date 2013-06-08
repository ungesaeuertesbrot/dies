const Signals = imports.signals;
const GLib = imports.gi.GLib;

function StatusTracker(injector)
{
	this._init(injector);
}

StatusTracker.prototype = {
	_init: function(injector) {
		let that = this;
		
		this._activeCollection = null;
		Object.defineProperty(this, "activeCollection", {
			configurable: false,
			enumerable: true,
			set: function(newV) {
				if (that._activeCollection === newV)
					return;
				let oldV = that._activeCollection;
				if (Array.isArray(that._collectionEventHandlerIds)) {
					try {
						for each (let eid in that._collectioEventHandlerIds)
							oldV.disconnect(eid);
					} catch(e) {
					}
					delete that._collectionEventHandlerIds;
				}
				
				if (oldV)
					oldV.flush();
				
				that._activeCollection = newV;
				
				if (newV) {
					let eids = [];
					eids.push(newV.connect("new", function(collection, id) {
						that.selectedDate = id;
						return false;
					}));
					eids.push(newV.connect("deleted", function(collection, id) {
						if (id === that._selectedItem.date.get_julian())
							that._selectedItem = null;
						return false;
					}));
					that._collectionEventHandlerIds = eids;
					
					that._selectedItem = newV.getItem(that._selectedDate);
				}
				
				that.emit("collection-activated", newV);
			},
			get: function() {
				return that._activeCollection;
			}
		});
		
		this._selectedDate = null;
		Object.defineProperty(this, "selectedDate", {
			configurable: false,
			enumerable: true,
			set: function(newV) {
				if (!(newV instanceof GLib.Date)) {
					let newDate = new GLib.Date();
					newV = Number(newV);
					if (isNaN(newV))
						throw "Invalid argument. Only accepts GLib.Date and julian dates";
					newDate.set_julian(newV);
					newV = newDate;
				}
				
				if (!newV.valid())
					throw "Cannot be set to invalid date";
				
				if (that._activeCollection)
					that._selectedItem = that._activeCollection.getItem(newV);
				else
					that._selectedItem = null;
				
				if (that._selectedDate instanceof GLib.Date
					&& that._selectedDate.valid()
					&& !that._selectedDate.compare(newV))
					return;

				that._selectedDate = newV;
				that.emit("date-selected", newV);
			},
			get: function() {
				return that._selectedDate;
			}
		});
		
		this._selectedItem = null;
		Object.defineProperty(this, "selectedItem", {
			configurable: false,
			enumerable: true,
			get: function() {
				return that._selectedItem;
			}
		});
	
	},
};

Signals.addSignalMethods(StatusTracker.prototype);

