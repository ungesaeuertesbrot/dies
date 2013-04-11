const Lang = imports.lang;
const Gtk = imports.gi.Gtk;

const MainWindow = Lang.Class({
	Name: "DiesMainWindow",
	Extends: Gtk.ApplicationWindow,
	
	_init: function(app) {
		this.parent({application: app});
		
		let paned = new Gtk.Paned({orientation: Gtk.Orientation.HORIZONTAL});
		let overview = new imports.dies.gnome.overview.Overview();
		let editor = new imports.dies.gnome.editor.Editor();
		
		this.child = paned;
		paned.pack1(overview, false, false);
		paned.pack2(editor, true, false);
		paned.show_all();
		
		this.connect("delete-event", function() {this.application.quit();}.bind(this));
	},
});

