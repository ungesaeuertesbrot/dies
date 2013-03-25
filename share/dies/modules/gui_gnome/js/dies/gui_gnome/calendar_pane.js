const Lang = imports.lang;

const GObj = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const GtkExt = imports.malus.gtk_ext;
const GuiGnome = imports.dies.gui_gnome.shared;

const ROOT_OBJECTS = ["OverviewBox", "EmptyListstore", "EntryListstore"];

const Overview = new Lang.Class ({
	Name: "ItemsOverview",
	Extends: Gtk.Notebook,
	Signals: {
		"date-selected": {},
		"date-add": {},
	},
	

	ui_elements: {
		OverviewBox: null,
		EmptyListstore: null,
		EntryListstore: null,
	},
	

	_init: function () {
		this.parent ({});
		
		let builder = new Gtk.Builder ({});
		builder.add_objects_from_file (GLib.build_filenamev ([GuiGnome.ui_dir, "overview_box.ui"]), ROOT_OBJECTS);
		GtkExt.builder_connect (builder, event_handlers, this.ui_elements, this);
		this.child = this.ui_elements.OverviewBox;
	},
	
	set_date: function () {
	
	},
	
	get_date: function () {
	
	},
});

const event_handlers = {

	/*
	 * Event handler
	 */
	on_add_button_clicked: function (actor, event) {
		var date = GLib.Date.new_dmy (this.calendar.day, this.calendar.month + 1, this.calendar.year);
		for (let item in Context.active_collection.get_iterator ())
			if (date.compare (item.date) === 0) {
				this.entry_list_store.foreach (function (model, path, iter) {
					let list_item = model.get_value (iter, 0);
					if (list_item !== item.id)
						return false;
					this.entry_list.get_selection ().select_iter (iter);
					return true;
				}.bind (this));
				return;
			}
		Context.active_collection.new_item ({date: date});
	},


	/*
	 * Event handler
	 */
	on_remove_button_clicked: function (actor, event) {
		var iter = this.entry_list.get_selection ().get_selected ()[2];
		var item_id = this.entry_list_store.get_value (iter, 0);
		var item = Context.active_collection.get_item (item_id);
		var msg = new Gtk.MessageDialog ({buttons: Gtk.ButtonsType.NONE,
									message_type: Gtk.MessageType.WARNING,
									text: "Delete entry for {0}?".format (__make_date_string (item.date)),
									secondary_text: "This action cannot be undone."});
		msg.add_button ("gtk-cancel", 1);
		msg.add_button ("gtk-delete", 2);
		let result = msg. run ();
		msg.hide ();
		msg.destroy ();
		if (result === 2)
			Context.active_collection.delete_item (item_id);
	},
		

	/*
	 * Event handler
	 */
	on_entry_list_selection_changed: function (actor, event) {
		if (this.entry_list.get_selection ().count_selected_rows () === 0) {
			Context.active_item = null;
			this.remove_button.sensitive = false;
			this.date_expander.label = "";
			this.date_expander.expanded = false;
			this.title_entry.text = "";
			this.place_entry.text = "";
			this.text_body.buffer.text = "";
			this.details_box.sensitive = false;
		} else {
			let iter = this.entry_list.get_selection ().get_selected ()[2];
			let item_id = this.entry_list_store.get_value (iter, 0);
			let item = Context.active_collection.get_item (item_id);
			Context.active_item = item;
			this.calendar.year = item.date.get_year ();
			this.calendar.month = item.date.get_month () - 1;
			this.calendar.day = item.date.get_day ();
			this.remove_button.sensitive = true;
			this.details_box.sensitive = true;
			this.date_expander.label = __make_date_string (item.date);
			this.date_adjustment.year = item.date.get_year ();
			this.date_adjustment.month = item.date.get_month () - 1;
			this.date_adjustment.day = item.date.get_day ();
			this.title_entry.text = item.title ? item.title : "";
			this.place_entry.text = item.place ? item.place : "";
			this.text_body.buffer.text = item.body ? item.body : "";
			this.text_body.buffer.set_modified (false);
		}
	},
};


