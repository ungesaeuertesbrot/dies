const Lang = imports.lang;

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const GtkExt = imports.malus.gtk_ext;
const GuiGnome = imports.dies.gnome.shared;

const EVENT_ID = "GuiGnome.Editor.GenericEvent";
const ROOT_OBJECTS = ["DetailsBox", "TextbodyBuffer"];

const Editor = new Lang.Class ({
	Name: 'DiesItemEditor',
	Extends: Gtk.Notebook,
	Signals: {
		"changed": {},
	},

	ui_elements: {
		DetailsBox: null,
		DateExpander: null,
		DateExpanderLabel: null,
		DateAdjustment: null,
		TitleEntry: null,
		Textbody: null,
		TextbodyBuffer: null,
	},
	
	_init: function () {
		this.parent ({"show-tabs": false});
		
		let builder = new Gtk.Builder ({});
		builder.add_objects_from_file (GLib.build_filenamev ([GuiGnome.ui_dir, "details_box.ui"]), ROOT_OBJECTS);
		GtkExt.builder_connect (builder, event_handlers, this.ui_elements, this);
		
		let tab_label = new Gtk.Label({label: "General"});
		this.append_page(this.ui_elements.DetailsBox, tab_label);
		
		Context.connect("date-selected", event_handlers.on_date_selected.bind(this));
		Context.connect("collection-activated", event_handlers.on_collection_activated.bind(this));
	},
	
	set_contents: function (item) {
		this._handlers_inactive = true;
		
		let expander = this.ui_elements.DateExpander;
		let date_label = this.ui_elements.DateExpanderLabel;
		let cal = this.ui_elements.DateAdjustment;
		let title = this.ui_elements.TitleEntry;
		let body = this.ui_elements.TextbodyBuffer;
		let body_entry = this.ui_elements.Textbody;
		
		if (item && item.date && item.date instanceof GLib.Date) {
			cal.year = item.date.get_year();
			cal.month = item.date.get_month() - 1;
			cal.day = item.date.get_day();
			date_label.label = GuiGnome.make_date_string(item.date);
			title.text = item.title ? item.title : "";
			body.text = item.text ? item.text : "";
			
			this.sensitive = true;
		} else
			this.sensitive = false;
		
		this._handlers_inactive = false;
	},
	
	get_contents: function (item) {
	
	},
});


const event_handlers = {
	on_date_adjusted: function () {
		if (this._handlers_inactive)
			return false;
		
		let [year, mon, day] = this.ui_elements.DateAdjustment.get_date();
		let date = new GLib.Date();
		date.set_dmy(day, mon + 1, year);
		Context.selected_item.date = date;
		Context.active_collection.announce_change(Context.selected_date, "date", EVENT_ID);
		
		return true;
	},
	
	on_title_changed: function () {
		if (this._handlers_inactive)
			return false;
		Context.selected_item.title = this.ui_elements.TitleEntry.text;
		Context.active_collection.announce_change(Context.selected_date, "title", EVENT_ID);
		
		return true;
	},
	
	on_textbody_buffer_changed: function () {
		if (this._handlers_inactive)
			return false;
		Context.selected_item.text = this.ui_elements.TextbodyBuffer.text;
		Context.active_collection.announce_change(Context.selected_date, "text", EVENT_ID);
		
		return true;
	},
	
	on_collection_activated: function(sender, collection) {
	
	},
	
	on_date_selected: function(sender, date) {
		let item = Context.active_collection.get_item(date);
		this.set_contents(item);
	},
};


