const Context = imports.malus.context;
const Signals = imports.signals;

function Root(injector)
{
	this._init(injector);
}

Root.prototype = {
	
	_init: function(injector) {
		this._context = {
			paths: null,
			modules: null,
		};
		injector.inject(this._context);
		this._injector = injector;
		
		Signals.addSignalMethods(Context);
		
		Context._active_collection = null;
		Object.defineProperty(Context, "active_collection", {
			configurable: false,
			enumerable: true,
			set: function(new_v) {
				if (this._active_collection === new_v)
					return;
				let old_v = this._active_collection;
				if (Array.isArray(this._collection_event_handler_ids))
					try {
						for each (let eid in this._collection_event_handler_ids)
							old_v.disconnect(eid);
					} catch(e) {
					}
				
				if (old_v)
					old_v.flush();
				
				this._active_collection = new_v;
				let eids = [];
				eids.push(new_v.connect("new", function(collection, id) {
					Context.selected_date = id;
					return false;
				}));
				eids.push(new_v.connect("deleted", function(collection, id) {
					if (id === Context._selected_item.date.get_julian())
						Context._selected_item = null;
					return false;
				}));
				this._collection_event_handler_ids = eids;
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
				
				if (this._active_collection)
					this._selected_item = this._active_collection.get_item(newv);
				else
					this._selected_item = null;
				
				if (this._selected_date instanceof GLib.Date
					&& this._selected_date.valid()
					&& !this._selected_date.compare(newv))
					return;

				this._selected_date = newv;
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

		this._context.modules.add_extension_listener("/dies/data_mgr", function(pt, ext) {
			let data_mgr = this._context.modules.get_extension_object(ext);
			this._context.data_mgr = data_mgr;
			this._injector.add_injectable("dies.data_mgr", data_mgr);
		}.bind(this));
		Context.modules.add_extension_listener ("/dies/gui", function(pt, ext) {
			let gui = this._context.modules.get_extension_object(ext);
			this._context.gui = gui;
			this._injector.add_injectable("dies.gui", gui);
		}.bind(this));
	},
	
	run: function (argv) {
		if (!this._context.gui)
			throw new Error ("No user interface found!");
		if (!this._context.data_mgr)
			throw new Error ("No data manager found!");
		
		if (this._context.data_mgr.type === "file") {
			let file_name = GLib.build_filenamev([this._context.paths.user_share, "dates.jd"]);
			Context.active_collection = this._context.data_mgr.create_collection(file_name);
		} else
			Context.active_collection = this._context.data_mgr.create_collection ();
		let now = GLib.DateTime.new_now_local();
		let today = new GLib.Date();
		let [year, mon, day] = now.get_ymd();
		now = undefined;
		today.set_dmy(day, mon, year);
		Context.selected_date = today;
		
		this._context.gui.run (argv);
		
		Context.active_collection.flush();
	}
};

