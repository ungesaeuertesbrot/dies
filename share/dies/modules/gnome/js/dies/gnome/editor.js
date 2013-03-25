const Lang = imports.lang;

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const GtkExt = imports.malus.gtk_ext;
const GuiGnome = imports.dies.gnome.shared;


const ROOT_OBJECTS = ["DetailsBox", "TextbodyBuffer"];

const Editor = new Lang.Class ({
	Name: 'DiesItemEditor',
	Extends: Gtk.Notebook,
	Signals: {
		"changed": {},
	},

	ui_elements: {
		DetailsBox: null,
		TextbodyBuffer: null,
	},
	
	_init: function () {
		this.parent ({});
		
		let builder = new Gtk.Builder ({});
		builder.add_objects_from_file (GLib.build_filenamev ([GuiGnome.ui_dir, "details_box.ui"]), ROOT_OBJECTS);
		GtkExt.builder_connect (builder, event_handlers, this.ui_elements, this);
		this.child = this.ui_elements.DetailsBox;
	},
	
	set_contents: function () {
	
	},
	
	get_contents: function () {
	
	},
});


const event_handlers = {
	on_date_adjusted: function () {
		print ("date adjusted");
	},
	
	on_title_changed: function () {
		print ("title changed");
	},
	
	on_textbody_buffer_changed: function () {
		print ("body changed");
	},
};


