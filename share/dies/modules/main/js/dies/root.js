const Context = imports.malus.context;
const Signals = imports.signals;

function Root ()
{
	this._init ();
}

Root.prototype = {
	
	_init: function () {
		
		Signals.addSignalMethods(Context);
		
		Context._active_collection = null;
		Object.defineProperty(Context, "active_collection", {
			configurable: false,
			enumerable: true,
			set: function(new_v) {
				if (this._active_collection === new_v)
					return;
				this._active_collection = new_v;
				this.emit("collection-activated", new_v);
			},
			get: function() {
				return this._active_collection;
			}
		});
		
		Context._selected_date = null;
		Object.defineProperty(Context, "selected_date", {
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
				
				if (this._selected_date instanceof GLib.Date
					&& this._selected_date.valid()
					&& !this._selected_date.compare(newv))
					return;
				
				this._selected_date = newv;
				if (this._active_collection)
					this._selected_item = this._active_collection.get_item(newv);
				else
					this._selected_item = null;
				this.emit("date-selected", newv);
			},
			get: function() {
				return this._selected_date;
			}
		});
		
		Context._selected_item = null;
		Object.defineProperty(Context, "selected_item", {
			configurable: false,
			enumerable: true,
			get: function() {
				return this._selected_item;
			}
		});

		Context.modules.add_extension_listener ("/dies/data_mgr", function (pt, ext) {
			Context.data_mgr = Context.modules.get_extension_object (ext);
		});
		Context.modules.add_extension_listener ("/dies/gui", function (pt, ext) {
			Context.gui = Context.modules.get_extension_object (ext);
		});
	},
	
	run: function (argv) {
		if (!Context.gui)
			throw new Error ("No user interface found!");
		if (!Context.data_mgr)
			throw new Error ("No data manager found!");
		
		Context.active_collection = Context.data_mgr.create_collection ();
		let now = GLib.DateTime.new_now_local();
		let today = new GLib.Date();
		let [year, mon, day] = now.get_ymd();
		now = undefined;
		today.set_dmy(day, mon, year);
		Context.selected_date = today;
		
		Context.gui.run (argv);
	}
};

