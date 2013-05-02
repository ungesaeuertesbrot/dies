const Lang = imports.lang;

const GObj = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const GtkExt = imports.malus.gtk_ext;
const Common = imports.dies.gnome.common;

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
	

	_init: function(injector) {
		this.parent({orientation: Gtk.Orientation.VERTICAL});
		
		this._context = {
			tracker: null,
			gnome_paths: null,
		};
		
		injector.inject(this._context, {"dies.status_tracker": "tracker",
										"dies.gnome.paths": "gnome_paths"});
		
		let builder = new Gtk.Builder({});
		builder.add_objects_from_file(GLib.build_filenamev ([this._context.gnome_paths.ui, "overview_box.ui"]), ROOT_OBJECTS);
		GtkExt.builder_connect(builder, event_handlers, this.ui_elements, this);
		this.ui_elements.EntryListstore.set_sort_column_id(0, Gtk.SortType.DESCENDING);
		this.pack_start(this.ui_elements.OverviewBox, true, true, 0);
		
		let that = this;
		this._context.tracker.connect("collection-activated", event_handlers.on_collection_activated.bind(this));
		this._context.tracker.connect("date-selected", event_handlers.on_date_selected.bind(this));
		event_handlers.on_collection_activated.apply(this, [this, this._context.tracker.active_collection]);
		event_handlers.on_date_selected.apply(this, [this, this._context.tracker.selected_date]);
	},
});

const event_handlers = {

	/*
	 * Event handler
	 */
	on_add_event: function (actor, event) {
		let cal = this.ui_elements.OverviewCalendar;
		let date = GLib.Date.new_dmy (cal.day, cal.month + 1, cal.year);
		if (this._context.tracker.active_collection.has_item(date))
			this._context.tracker.selected_date = date;
		else
			this._context.tracker.active_collection.new_item(date);
	},


	on_calendar_day_selected: function(actor, event) {
		let cal = this.ui_elements.OverviewCalendar;
		let date = GLib.Date.new_dmy(cal.day, cal.month + 1, cal.year);
		this._context.tracker.selected_date = date;
	},
	
	
	/*
	 * Event handler
	 */
	on_remove_button_clicked: function (actor, event) {
		let list = this.ui_elements.EntryList;
		let store = this.ui_elements.EntryListstore;
		
		var iter = list.get_selection ().get_selected ()[2];
		var item_id = store.get_value (iter, 0);
		var item = this._context.tracker.active_collection.get_item (item_id);
		var msg = new Gtk.MessageDialog ({buttons: Gtk.ButtonsType.NONE,
									message_type: Gtk.MessageType.WARNING,
									text: "Delete entry for {0}?".format (Common.make_date_string (item.date)),
									secondary_text: "This action cannot be undone."});
		msg.add_button ("gtk-cancel", Gtk.ResponseType.CANCEL);
		msg.add_button ("gtk-delete", Gtk.ResponseType.ACCEPT);
		let result = msg.run ();
		msg.hide ();
		msg.destroy ();
		if (result === Gtk.ResponseType.ACCEPT)
			this._context.tracker.active_collection.delete_item(item_id);
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
		this._context.tracker.selected_date = item_id;	// item_id is really just the julian date
	},
	
	on_collection_activated: function(sender, newv) {
		let cal = this.ui_elements.OverviewCalendar;
		let list = this.ui_elements.EntryList;
		let store = this.ui_elements.EntryListstore;
		let rem_btn = this.ui_elements.RemoveButton;

		if (this._connected_collection && this._current_collection_connect_ids)
			try {
				for each (let conn_id in this._current_collection_connect_ids)
					this._connected_collection.disconnect(conn_id);
				delete this._current_collection_connect_ids;
			} catch (e) {
			}

		cal.clear_marks();
		store.clear();
		
		if (newv) {
			try {
				let conn_ids = [];
				
				conn_ids.push(newv.connect("new", event_handlers.on_new_item.bind(this)));
				conn_ids.push(newv.connect("changed", event_handlers.on_item_changed.bind(this)));
				conn_ids.push(newv.connect("deleted", event_handlers.on_item_deleted.bind(this)));
				
				this._connected_collection = newv;
				this._current_collection_connect_ids = conn_ids;
			} catch (e) {
			}
			
			
			let date_sel = this._context.tracker.selected_date;
			for (let item in newv.get_iterator(date_sel.get_year(), date_sel.get_month()))
				cal.mark_day(item.date.get_day());
			
			for (let item in newv.get_iterator()) {
				let iter = store.append();
				store.set(iter, [0, 1], [item.date.get_julian(), make_list_caption(item)]);
				list.model = store;
				list.sensitive = true;
			}
			
			event_handlers.on_date_selected.apply(this, [sender, date_sel]);
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
			let collection = this._context.active_collection;
			if (collection)
				for (let item in collection.get_iterator(newv.get_year(), newv.get_month()))
					cal.mark_day(item.date.get_day());
		}
		cal.day = newv.get_day ();
		
		let item = this._context.tracker.selected_item;
		
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
		
		let item = this._context.tracker.selected_item;
		if (item.date.get_julian() !== id)
			item = this._context.tracker.active_collection.get_item(id);
		let iter = store.append();
		store.set(iter, [0, 1], [id, make_list_caption(item)]);
		
		if (list.model !== store) {
			list.model = store;
			list.sensitive = true;
		}
		
		cal.mark_day(item.date.get_day());
		list.get_selection().select_iter(iter);
		
		// emit forcefully as the status for the current date has changed and
		// we need to update the display
		this._context.tracker.emit("date-selected", item.date);
	},
	
	on_item_changed: function(collection, id, field) {
		// We only display the date (which is never actually changed) and the
		// title in the overview.
		if (field !== "title")
			return;

		let list = this.ui_elements.EntryList;
		
		let item = this._context.tracker.selected_item;
		if (item.date.get_julian() !== id)
			item = this._context.tracker.active_collection.get_item(id);

		let [has_sel, model, iter] = list.get_selection().get_selected();
		let list_id = model.get_value(iter, 0);
		if (Number(list_id) !== Number(id))
			model.foreach(function(for_model, path, for_iter) {
				let item_id = for_model.get_value(for_iter, 0);
				if (Number(item_id) !== Number(id))
					return false;
				iter = for_iter;
				return true;
			});
		
		model.set_value(iter, 1, make_list_caption(item));
	},
	
	on_item_deleted: function(collection, id) {
		let store = this.ui_elements.EntryListstore;
		let list = this.ui_elements.EntryList;
		let cal = this.ui_elements.OverviewCalendar;
		
		let [has_sel, sel_model, sel_iter] = list.get_selection().get_selected();
		let list_id = store.get_value(sel_iter, 0);
		if (Number(list_id) === Number(id))
			store.remove(sel_iter);
		else
			store.foreach(function(model, path, iter) {
				let item_id = model.get_value(iter, 0);
				if (Number(item_id) !== Number(id))
					return false;
				model.remove(iter);
				return true;
			});
		
		let date = new GLib.Date();
		date.set_julian(id);
		if (cal.year === date.get_year() && cal.month === date.get_month() - 1)
			cal.unmark_day(date.get_day());
		
		// emit forcefully as the status for the current date has changed and
		// we need to update the display
		this._context.tracker.emit("date-selected", date);
	},
};

function make_list_caption(item)
{
	var caption = "<b>" + Common.make_date_string(item.date) + "</b>";
	if (item.title)
		caption += "\n" + item.title;
	return caption;
}

