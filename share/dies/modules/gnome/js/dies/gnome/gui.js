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
		this._injector = injector;
		this.parent({"application-id": "net.schoel.Dies",
					 "flags": Gio.ApplicationFlags.FLAGS_NONE,
					 "inactivity-timeout": 30000,
					 "register-session": true});
		this.register(null);
	},
	
	vfunc_startup: function() {
		this.parent();
		this.mainWindow = new MainWnd.MainWindow(this._injector, this);
	},
	
	vfunc_activate: function() {
		this.parent();
		this.mainWindow.show();
	},
});

