const Lang = imports.lang;

const GObj = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Context = imports.malus.context;
const GtkExt = imports.malus.gtk_ext;
const GuiGnome = imports.dies.gnome.shared;

const ROOT_OBJECTS = ["OverviewBox", "EmptyListstore", "EntryListstore"];

const Overview = new Lang.Class ({
	Name: "DiesItemsOverview",
	Extends: Gtk.Box,
	Signals: {
		"date-selected": {},
		"date-add": {},
	},
	

	ui_elements: {
		OverviewBox: null,
		OverviewCalendar: null,
		RemoveButton: null,
		EntryList: null,
		EmptyListstore: null,
		EntryListstore: null,
	},
	

	_init: function () {
		this.parent ({orientation: Gtk.Orientation.VERTICAL});
		
		let builder = new Gtk.Builder ({});
		builder.add_objects_from_file (GLib.build_filenamev ([GuiGnome.ui_dir, "overview_box.ui"]), ROOT_OBJECTS);
		GtkExt.builder_connect (builder, event_handlers, this.ui_elements, this);
		this.ui_elements.EntryListstore.set_sort_column_id(1, Gtk.SortType.DESCENDING);
		this.pack_start(this.ui_elements.OverviewBox, true, true, 0);
		
		let that = this;
		Context.watch("active_collection", function(id, oldv, newv) {
			if (oldv && that.__current_collection_connect_ids)
				try {
					for each (let conn_id in that.__current_collection_connect_ids)
						oldv.disconnect(conn_id);
					delete that.__current_collection_connect_ids;
				} catch (e) {
				}

			if (newv)
				try {
					let conn_ids = [];
					
					conn_ids.push(newv.connect("new", event_handlers.on_new_item.bind(that)));
					conn_ids.push(newv.connect("changed", event_handlers.on_item_changed.bind(that)));
					conn_ids.push(newv.connect("removed", event_handlers.on_item_removed.bind(that)));
					
					that.__current_collection_connect_ids = conn_ids;
				} catch (e) {
					return null;
				}

			return newv;
		});
	},
	
	set_date: function (date) {
		let store = this.ui_elements.EntryListstore;
		let list = this.ui_elements.EntryList;
		
		for (let item in Context.active_collection.get_iterator())
			if (date.compare(item.date) === 0) {
				store.foreach(function(model, path, iter) {
					let list_item = model.get_value(iter, 0);
					if (list_item !== item.id)
						return false;
					list.get_selection().select_iter(iter);
					return true;
				});
				return true;
			}
	
		list.get_selection().unselect_all();
		return false;
	},
	
	get_date: function () {
	
	},
});

const event_handlers = {

	/*
	 * Event handler
	 */
	on_add_event: function (actor, event) {
		let cal = this.ui_elements.OverviewCalendar;
		var date = GLib.Date.new_dmy (cal.day, cal.month + 1, cal.year);
		if (!this.set_date(date))
			Context.active_collection.new_item ({date: date});
	},


	on_calendar_day_selected: function(actor, event) {
		let cal = this.ui_elements.OverviewCalendar;
		let date = GLib.Date.new_dmy(cal.day, cal.month + 1, cal.year);
		this.set_date(date);
	},
	
	
	/*
	 * Event handler
	 */
	on_remove_button_clicked: function (actor, event) {
		print("remove");
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
		let list = this.ui_elements.EntryList;
		let store = this.ui_elements.EntryListstore;
		let btn_rem = this.ui_elements.RemoveButton;
		let cal = this.ui_elements.OverviewCalendar;
		
		if (list.get_selection ().count_selected_rows () === 0) {
			Context.active_item = null;
			btn_rem.sensitive = false;
			//this.date_expander.label = "";
			//this.date_expander.expanded = false;
			//this.title_entry.text = "";
			//this.place_entry.text = "";
			//this.text_body.buffer.text = "";
			//this.details_box.sensitive = false;
		} else {
			let iter = list.get_selection().get_selected()[2];
			let item_id = store.get_value(iter, 0);
			let item = Context.active_collection.get_item(item_id);
			Context.active_item = item;
			cal.year = item.date.get_year ();
			cal.month = item.date.get_month () - 1;
			cal.day = item.date.get_day ();
			btn_rem.sensitive = true;
			/*this.details_box.sensitive = true;
			this.date_expander.label = __make_date_string (item.date);
			this.date_adjustment.year = item.date.get_year ();
			this.date_adjustment.month = item.date.get_month () - 1;
			this.date_adjustment.day = item.date.get_day ();
			this.title_entry.text = item.title ? item.title : "";
			this.place_entry.text = item.place ? item.place : "";
			this.text_body.buffer.text = item.body ? item.body : "";
			this.text_body.buffer.set_modified (false);*/
		}
	},
	
	on_new_item: function(collection, id) {
		let store = this.ui_elements.EntryListstore;
		let list = this.ui_elements.EntryList;
		let cal = this.ui_elements.OverviewCalendar;
		
		let item = Context.active_collection.get_item(id);
		let iter = store.append();
		store.set(iter, [0, 1, 2], [id, GuiGnome.date_to_int(item.date), GuiGnome.make_list_caption(item)]);
		
		if (list.model !== store) {
			list.model = store;
			list.sensitive = true;
		}
		
		list.get_selection().select_iter(iter);
		
		cal.mark_day(item.date.get_day());
	},
	
	on_item_changed: function(collection, id, field) {
		print("cahnged");
	},
	
	on_item_removed: function(collection, id) {
		print("removed");
	},
};


