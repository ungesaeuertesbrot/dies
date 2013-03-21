const Lang = imports.lang;

const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

const GtkExt = imports.malus.gtk_ext;
const GuiGnome = imports.dies.gui_gnome.shared;


const ROOT_OBJECTS = ["DetailsBox", "TextbodyBuffer"];


Editor = new Lang.Class ({
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
		let builder = new Gtk.Builder (null);
		builder.add_objects_from_file (GLib.build_filenamev ([GuiGnome.ui_dir, "details_box.ui"], ROOT_OBJECTS));
		GtkExt.builder_connect (builder, event_handlers, this.ui_elements);
	},
});


const event_handlers = {
	on_date_adjusted: function () {
	
	},
	
	on_title_changed: function () {
	
	},
	
	on_textbody_buffer_changed: function () {
	
	},
};


