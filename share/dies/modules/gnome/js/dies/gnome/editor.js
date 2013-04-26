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
	
	on_item_changed: function(sender, item, field, event_id) {
		if (event_id === EVENT_ID)
			return false;
		
		switch (field) {
		case "date": {
			// This should never happen. Instead, a remove event followed by an
			// add event should be emitted.
			let cal = this.ui_elements.DateAdjustment;
			let date_label = this.ui_elements.DateExpanderLabel;

			cal.year = item.date.get_year();
			cal.month = item.date.get_month() - 1;
			cal.day = item.date.get_day();
			date_label.label = GuiGnome.make_date_string(item.date);
			break;
		}
		
		case "title": {
			this.ui_elements.TitleEntry.text = item.title ? item.title : "";
			break;
		}
		
		case "body": {
			this.ui_elements.TextBodyBuffer.text = item.text ? item.text : "";
			break;
		}}
		
		return false;
	},
	
	on_collection_activated: function(sender, newv) {
		if (this._connected_collection && this._current_collection_connect_ids)
			try {
				for each (let conn_id in this._current_collection_connect_ids)
					this._connected_collection.disconnect(conn_id);
				delete this._current_collection_connect_ids;
			} catch (e) {
				logError(e, "Error disconnecting event handlers from collection");
			}

		if (newv)
			try {
				let conn_ids = [];
				
				conn_ids.push(newv.connect("changed", event_handlers.on_item_changed.bind(this)));
				
				this._connected_collection = newv;
				this._current_collection_connect_ids = conn_ids;
			} catch (e) {
				logError(e, "Error connecting event handlers to collection");
			}
		
		this.set_contents(Context.selected_item);
	},
	
	on_date_selected: function(sender, date) {
		this.set_contents(Context.selected_item);
	},
};


