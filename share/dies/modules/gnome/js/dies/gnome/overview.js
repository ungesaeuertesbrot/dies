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
		this.ui_elements.EntryListstore.set_sort_column_id(0, Gtk.SortType.DESCENDING);
		this.pack_start(this.ui_elements.OverviewBox, true, true, 0);
		
		let that = this;
		Context.connect("collection-activated", event_handlers.on_collection_activated.bind(this));
		Context.connect("date-selected", event_handlers.on_date_selected.bind(this));
		event_handlers.on_collection_activated.apply(this, [Context, Context.active_collection]);
		event_handlers.on_date_selected.apply(this, [Context, Context.selected_date]);
	},
});

const event_handlers = {

	/*
	 * Event handler
	 */
	on_add_event: function (actor, event) {
		let cal = this.ui_elements.OverviewCalendar;
		let date = GLib.Date.new_dmy (cal.day, cal.month + 1, cal.year);
		if (Context.active_collection.has_item(date))
			Context.selected_date = date;
		else
			Context.active_collection.new_item(date);
	},


	on_calendar_day_selected: function(actor, event) {
		let cal = this.ui_elements.OverviewCalendar;
		let date = GLib.Date.new_dmy(cal.day, cal.month + 1, cal.year);
		Context.selected_date = date;
	},
	
	
	/*
	 * Event handler
	 */
	on_remove_button_clicked: function (actor, event) {
		print("remove");
		var iter = this.entry_list.get_selection ().get_selected ()[2];
		var item_id = this.entry_list_store.get_value (iter, 0);
		var item = Context.active_collection.get_item (GLib.Date.item_id);
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
		
		let [has_sel, model, iter] = list.get_selection().get_selected();
		// This can only be caused by the code itself and should be handled there
		if (!has_sel)
			return;
		let item_id = store.get_value(iter, 0);
		Context.selected_date = item_id;	// item_id is really just the julian date
	},
	
	on_collection_activated: function(sender, newv) {
		if (this._connected_collection && this._current_collection_connect_ids)
			try {
				for each (let conn_id in this._current_collection_connect_ids)
					this._connected_collection.disconnect(conn_id);
				delete this._current_collection_connect_ids;
			} catch (e) {
			}

		if (newv)
			try {
				let conn_ids = [];
				
				conn_ids.push(newv.connect("new", event_handlers.on_new_item.bind(this)));
				conn_ids.push(newv.connect("changed", event_handlers.on_item_changed.bind(this)));
				conn_ids.push(newv.connect("removed", event_handlers.on_item_removed.bind(this)));
				
				this._connected_collection = newv;
				this._current_collection_connect_ids = conn_ids;
			} catch (e) {
			}
	},
	
	on_date_selected: function(sender, newv) {
		let rem_btn = this.ui_elements.RemoveButton;
		let store = this.ui_elements.EntryListstore;
		let list = this.ui_elements.EntryList;
		let cal = this.ui_elements.OverviewCalendar;

		if (!(newv instanceof GLib.Date
			  && newv.valid())) {
			let now = GLib.DateTime.new_now_local();
			let [year, mon, day] = now.get_ymd();
			newv = new GLib.Date();
			newv.set_dmy(day, mon, year);
		}
		
		if (cal.month !== newv.get_month()
			|| cal.year !== newv.get_year()) {
			
			cal.clear_marks();
			cal.year = newv.get_year ();
			cal.month = newv.get_month () - 1;
			if (Context.active_collection)
				for (let item in Context.active_collection.get_iterator(newv.get_year(), newv.get_month()))
					cal.mark_day(item.date.get_day());
		}
		cal.day = newv.get_day ();
		
		let item = null;
		if (Context.active_collection)
			item = Context.active_collection.get_item(newv);
		
		if (!item) {
			list.get_selection().unselect_all();
			rem_btn.sensitive = false;
		} else {
			rem_btn.sensitive = true;
			let new_julian = newv.get_julian();
			let [has_sel, sel_model, sel_iter] = list.get_selection().get_selected();
			if (!has_sel || Number(sel_model.get_value(sel_iter, 0)) !== new_julian)
				store.foreach(function(model, path, iter) {
					let list_date = model.get_value(iter, 0);
					if (list_date !== new_julian)
						return false;
					list.get_selection().select_iter(iter);
					list.scroll_to_cell(path, null, false, 0, 0);
					return true;
				});
		}
	},
	
	on_new_item: function(collection, id) {
		let store = this.ui_elements.EntryListstore;
		let list = this.ui_elements.EntryList;
		let cal = this.ui_elements.OverviewCalendar;
		
		let item = Context.active_collection.get_item(id);
		let iter = store.append();
		store.set(iter, [0, 1], [id, GuiGnome.make_list_caption(item)]);
		
		if (list.model !== store) {
			list.model = store;
			list.sensitive = true;
		}
		
		cal.mark_day(item.date.get_day());
		list.get_selection().select_iter(iter);
		
		// emit forcefully
		Context.emit("date-selected", item.date);
	},
	
	on_item_changed: function(collection, id, field) {
		print("changed");
	},
	
	on_item_removed: function(collection, id) {
		print("removed");
	},
};


