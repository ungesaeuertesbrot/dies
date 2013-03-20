const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const GtkExt = imports.malus.gtk_ext;
const Event = imports.malus.event;
const GuiGnome = imports.dies.gui_gnome.shared;

const ROOT_OBJECT = "DetailsBox";

function Editor ()
{
	this._init ();
}

// Convert to GObject, maybe some GTK-Object
Editor.prototype = {
	_init: function () {
		let builder = new Gtk.Builder (null);
		builder.add_objects_from_file (GLib.build_filenamev ([GuiGnome.ui_dir, "details_box.ui"], [ROOT_OBJECT]);
		GtkExt.builder_connect_signals (builder, event_handlers);
		this.root_box = builder.get_object (ROOT_OBJECT);
	},
	
	get_root_object: function () {
		return this.root_box;
	},
};


const event_handlers = {
	
};


//Event.add_events (Editor.prototype, ["changed"]);

