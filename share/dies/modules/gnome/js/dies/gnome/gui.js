const Lang = imports.lang;
const GLib = imports.gi.GLib;
const GObj = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const MainWnd = imports.dies.gnome.main_window;

const Common = imports.dies.gnome.common;


const Gui = new Lang.Class({
	Name: "DiesGnomeGui",
	Extends: Gtk.Application,
	
	_init: function(injector) {
		this._context = {
			modules: null,
		};
		injector.inject(this._context);
		this._injector = injector;
		let module_dir = this._context.modules.get_module_directory(Common.MODULE_NAME);
		let ui_dir = GLib.build_filenamev([module_dir, "ui"]);
		injector.add_injectable("dies.gnome.paths", {ui: ui_dir});
		
		this.parent({"application-id": "net.schoel.Dies",
					 "flags": Gio.ApplicationFlags.FLAGS_NONE,
					 "inactivity-timeout": 30000,
					 "register-session": true});
		this.register(null);
	},
	
	vfunc_startup: function() {
		this.parent();
		this.main_window = new MainWnd.MainWindow(this._injector, this);
	},
	
	vfunc_activate: function() {
		this.parent();
		this.main_window.show();
	},
});

