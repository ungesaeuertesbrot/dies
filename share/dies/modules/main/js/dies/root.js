const Signals = imports.signals;

const Tracker = imports.dies.status_tracker;

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
		
		this._context.tracker = new Tracker.StatusTracker(injector);
		injector.add_injectable("dies.status_tracker", this._context.tracker);
		
		this._context.modules.add_extension_listener("/dies/data_mgr", function(pt, ext) {
			let data_mgr = this._context.modules.get_extension_object(ext);
			this._context.data_mgr = data_mgr;
			this._injector.add_injectable("dies.data_mgr", data_mgr);
		}.bind(this));
		this._context.modules.add_extension_listener ("/dies/gui", function(pt, ext) {
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
			this._context.tracker.active_collection = this._context.data_mgr.create_collection(file_name);
		} else
			this._context.tracker.active_collection = this._context.data_mgr.create_collection ();
		let now = GLib.DateTime.new_now_local();
		let today = new GLib.Date();
		let [year, mon, day] = now.get_ymd();
		now = undefined;
		today.set_dmy(day, mon, year);
		this._context.tracker.selected_date = today;
		
		this._context.gui.run (argv);
		
		this._context.tracker.active_collection.flush();
	}
};

