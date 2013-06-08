const Signals = imports.signals;

const Tracker = imports.dies.status_tracker;

function Root(injector)
{
	this._init(injector);
}

Root.prototype = {
	
	_init: function(injector) {
		this._context = {
			paths: "malus.paths",
			extensions: "malus.extensions",
		};
		injector.inject(this._context);
		this._injector = injector;
		
		this._context.tracker = new Tracker.StatusTracker(injector);
		injector.addInjectable("dies.status-tracker", this._context.tracker);
		
		this._context.extensions.addExtensionListener("/dies/data-mgr", function(msg, ext) {
			switch (msg) {
			case "added":
				let dataMgr = this._context.extensions.getExtensionObject(ext);
				this._context.dataMgr = dataMgr;
				this._injector.addInjectable("dies.data-mgr", dataMgr);
			}
		}.bind(this));
		this._context.extensions.addExtensionListener("/dies/gui", function(msg, ext) {
			switch (msg) {
			case "added":
				let gui = this._context.extensions.getExtensionObject(ext);
				this._context.gui = gui;
				this._injector.addInjectable("dies.gui", gui);
			}
		}.bind(this));
	},
	
	run: function (argv) {
		if (!this._context.gui)
			throw new Error("No user interface found!");
		if (!this._context.dataMgr)
			throw new Error("No data manager found!");
		
		if (this._context.dataMgr.type === "file") {
			let fileName = GLib.build_filenamev([this._context.paths.userShare, "dates.jd"]);
			this._context.tracker.activeCollection = this._context.dataMgr.createCollection(fileName);
		} else
			this._context.tracker.activeCollection = this._context.dataMgr.createCollection ();
		let now = GLib.DateTime.new_now_local();
		let today = new GLib.Date();
		let [year, mon, day] = now.get_ymd();
		now = undefined;
		today.set_dmy(day, mon, year);
		this._context.tracker.selectedDate = today;
		
		this._context.gui.run (argv);
		
		this._context.tracker.activeCollection.flush();
	}
};

