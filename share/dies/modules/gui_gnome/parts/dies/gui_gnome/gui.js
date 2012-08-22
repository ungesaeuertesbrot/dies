const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;
const GObj = imports.gi.GObject;
const Pango = imports.gi.Pango;

const Context = imports.malus.context;

function Gui ()
{
	Gtk.init (null, null);
	this._init ();
}


Gui.prototype = {
	/*
	 * Sets up the object.
	 */
	_init: function () {
		this.__build_window ();
		this.__watch_data ();
	},
	
	
	/*
	 * Creates the window and its contents and connects to signals.
	 */
	__build_window: function () {
		// Left pane
		this.entry_list_store = new Gtk.ListStore ();
		this.entry_list_store.set_column_types ([GObj.TYPE_INT, GObj.TYPE_INT, GObj.TYPE_STRING]);
		
		this.empty_list_store = new Gtk.ListStore ();
		this.empty_list_store.set_column_types ([GObj.TYPE_INT, GObj.TYPE_INT, GObj.TYPE_STRING]);
		var iter = this.empty_list_store.append ();
		this.empty_list_store.set_value (iter, 2, "<span weight=\"bold\" size=\"larger\" color=\"gray\">No entries available</span>");
	
		this.entry_list = new Gtk.TreeView ({headers_visible: false,
											model: this.empty_list_store,
											sensitive: false});
		this.list_entry_renderer = new Gtk.CellRendererText ();
		var column = new Gtk.TreeViewColumn ({title: "Entries", sort_column_id: 1});
		column.pack_start (this.list_entry_renderer, true);
		column.add_attribute (this.list_entry_renderer, "markup", 2);
		this.entry_list.append_column (column);
		this.entry_list_scroll = new Gtk.ScrolledWindow ({child: this.entry_list});

		this.entry_list_selection = this.entry_list.get_selection ();
		this.entry_list_selection.connect ("changed", this.__on_entry_list_selection_changed.bind (this));
	
		this.calendar = new Gtk.Calendar ({show_week_numbers: true});//,
//											detail_height_rows: 1,
//											detail_width_chars: 6});
//		this.calendar.set_detail_func (this.__get_calendar_detail.bind (this));
		this.calendar.connect ("day-selected-double-click", this.__on_add_button_clicked.bind (this));
	
		this.add_button = new Gtk.Button ({image: new Gtk.Image ({stock: "gtk-add"}),
										relief: Gtk.ReliefStyle.NONE,
										border_width: 0,
										expand: false,
										margin: 0,
										halign: Gtk.Align.START});
		this.add_button.connect ("clicked", this.__on_add_button_clicked.bind (this));
		this.remove_button = new Gtk.Button ({image: new Gtk.Image ({stock: "gtk-remove"}),
											relief: Gtk.ReliefStyle.NONE,
											border_width: 0,
											expand: false,
											margin: 0,
											halign: Gtk.Align.START});
		this.remove_button.connect ("clicked", this.__on_remove_button_clicked.bind (this));
		this.action_buttons = new Gtk.ButtonBox ({orientation: Gtk.Orientation.VERTICAL,
												layout_style: Gtk.ButtonBoxStyle.START,
												spacing: 5,
												border_width: 5,
												halign: Gtk.Align.START});
		this.action_buttons.pack_end (this.add_button, false, false, 0);
		this.action_buttons.pack_end (this.remove_button, false, false, 0);
	
		this.overview_box = new Gtk.Table ({n_columns: 2, n_rows: 2, hexpand: false});
		this.overview_box.attach (this.entry_list_scroll, 0, 2, 0, 1, Gtk.AttachOptions.EXPAND | Gtk.AttachOptions.FILL,
								Gtk.AttachOptions.EXPAND | Gtk.AttachOptions.FILL, 0, 0);
		this.overview_box.attach (this.calendar, 0, 1, 1, 2, 0,
								Gtk.AttachOptions.FILL, 0, 0);
		this.overview_box.attach (this.action_buttons, 1, 2, 1, 2, Gtk.AttachOptions.EXPAND | Gtk.AttachOptions.FILL,
								Gtk.AttachOptions.FILL, 0, 0);
	
		// Right pane
		this.date_adjustment = new Gtk.Calendar ({expand: false});
		this.date_adjustment.connect ("day-selected", this.__on_date_adjusted.bind (this));
		this.date_expander = new Gtk.Expander ({label: ""});
		this.date_expander.add (this.date_adjustment);
	
		this.title_entry = new Gtk.Entry ({placeholder_text: "Short description of the day's events", has_frame: false, shadow_type: Gtk.ShadowType.NONE});
		this.title_entry.connect ("realize", function (a, e) {
			let gdk_events = this.title_entry.window.get_events ();
			gdk_events |= Gdk.FOCUS_CHANGE_MASK;
			this.title_entry.window.set_events (gdk_events);
			this.title_entry.connect ("focus-out-event", this.__on_entry_focus_out.bind (this, "title"));
		}.bind (this));
		
		this.place_entry = new Gtk.Entry ({placeholder_text: "Where did this take place?", has_frame: false, shadow_type: Gtk.ShadowType.NONE});
		this.place_entry.connect ("realize", function (a, e) {
			let gdk_events = this.place_entry.window.get_events ();
			gdk_events |= Gdk.FOCUS_CHANGE_MASK;
			this.place_entry.window.set_events (gdk_events);
			this.place_entry.connect ("focus-out-event", this.__on_entry_focus_out.bind (this, "place"));
		}.bind (this));
		
		this.text_body = new Gtk.TextView ({pixels_below_lines: 5, wrap_mode: Gtk.WrapMode.WORD_CHAR, left_margin: 3, right_margin: 3});
		this.text_body.connect ("realize", function (a, e) {
			let gdk_events = this.text_body.window.get_events ();
			gdk_events |= Gdk.FOCUS_CHANGE_MASK;
			this.text_body.window.set_events (gdk_events);
			this.text_body.connect ("focus-out-event", this.__on_body_focus_out.bind (this));
		}.bind (this));
		this.text_body_scroll = new Gtk.ScrolledWindow ({child: this.text_body});
	
		this.details_box = new Gtk.Box ({orientation: Gtk.Orientation.VERTICAL, hexpand: true});
		this.details_box.pack_start (this.date_expander, false, false, 0);
		this.details_box.pack_start (this.title_entry, false, false, 0);
		this.details_box.pack_start (this.place_entry, false, false, 0);
		this.details_box.pack_start (this.text_body_scroll, true, true, 0);
	
		// Window
		this.base_box = new Gtk.Paned ({orientation: Gtk.Orientation.HORIZONTAL, position: 0});
		this.base_box.pack1 (this.overview_box, true, false);
		this.base_box.pack2 (this.details_box, true, false);
		this.base_box.show_all ();
	
		this.window = new Gtk.Window ({type: Gtk.WindowType.TOPLEVEL, title: "Dies"});
		this.window.connect ("delete-event", function (a, e) {this.quit ()}.bind (this));
		this.window.child = this.base_box;
	
		// Further setup
		this.__set_entry_list_empty (true);
	},
	

	/*
	 * Event handler
	 */
	__on_add_button_clicked: function (actor, event) {
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
	__on_remove_button_clicked: function (actor, event) {
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
	__on_entry_list_selection_changed: function (actor, event) {
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


	/*
	 * Event handler
	 */
	__on_date_adjusted: function (actor) {
		var date_data = this.date_adjustment.get_date ();
		var date = GLib.Date.new_dmy (date_data[2], date_data[1] + 1, date_data[0]);
		if (date.compare (Context.active_item.date) === 0)
			return;
		Context.active_item.date = date;
		Context.active_collection.notify_change (Context.active_item.id, "date");
	},
	

	/*
	 * Event handler
	 */
	__on_entry_focus_out: function (field, actor, evnt) {
		if (Context.active_item[field] !== actor.text) {
			Context.active_item[field] = actor.text;
			Context.active_collection.notify_change (Context.active_item.id, field);
		}
	},
	
	
	/*
	 * Event handler
	 */
	__on_body_focus_out: function (actor, evnt) {
		if (!this.text_body.buffer.get_modified ())
			return;
		Context.active_item.body = this.text_body.buffer.text;
		this.text_body.buffer.set_modified (false);
		Context.active_collection.notify_change (Context.active_item.id, "body");
	},
	
	
	__get_calendar_detail: function (calendar, year, month, day) {
		let date = GLib.Date.new_dmy (day, month + 1, year);
		for (let item in Context.active_collection.get_iterator ()) {
			if (item.date.compare (date) !== 0)
				continue;
			return item.title ? item.title : null;
		}
		return null;
	},
	
	
	/*
	 * Event handler
	 */
	__on_data_new: function (id) {
		var item = Context.active_collection.get_item (id);
		
		var iter = this.__add_item_to_list_store (item);
		this.__set_entry_list_not_empty ();
		this.entry_list.get_selection ().select_iter (iter);
	},
	
	
	/*
	 * Get the iter that represents the item for id.
	 */
	__iter_from_id: function (id) {
		var result;
		this.entry_list_store.foreach (function (model, path, iter) {
			let item_id = model.get_value (iter, 0);
			if (item_id !== id)
				return false;
			result = iter;
			return true;
		}.bind (this));
		
		return result;
	},
	
	
	/*
	 * Event handler
	 */
	__on_data_removed: function (id) {
		var iter = this.__iter_from_id (id);
		if (!iter)
			return;
		this.entry_list_store.remove (iter);
		if (!this.entry_list_store.get_iter_first ()[0])
			this.__set_entry_list_empty ();
	},
	
	
	/*
	 * Event handler
	 */
	__on_data_changed: function (id, field) {
		var item = Context.active_collection.get_item (id);
		var iter = this.__iter_from_id (id);
		
		switch (field) {
		case "date":
			this.date_expander.label = __make_date_string (item.date);
			this.entry_list_store.set_value (iter, 1, __date_to_int (item.date));
			this.entry_list_store.set_value (iter, 2, __make_list_caption (item));
			let next = null;
			this.entry_list_store.foreach (function (model, path, iter) {
				let list_item = Context.active_collection.get_item (model.get_value (iter, 0));
				if (list_item.date.compare (item.date) > 0)
					return false;
				next = iter;
				return true;
			});
			this.entry_list_store.move_before (iter, next);
			break;
			
		case "title":
			this.entry_list_store.set_value (iter, 2, __make_list_caption (item));
			break;
			
		case "place":
			break;
			
		case "body":
			break;
		}
	},
	
	
	/*
	 * Connect handlers for events concerning the data
	 */
	__connect_to_data: function (collection) {
		if (!collection)
			return;
		collection.add_event_listener ("new", this.__on_data_new.bind_once (this));
		collection.add_event_listener ("deleted", this.__on_data_removed.bind_once (this));
		collection.add_event_listener ("changed", this.__on_data_changed.bind_once (this));
	},
	
	
	__disconnect_from_data: function (collection) {
		if (!collection)
			return;
		collection.remove_event_listener ("new", this.__on_data_new.bind_once (this));
		collection.remove_event_listener ("deleted", this.__on_data_removed.bind_once (this));
		collection.remove_event_listener ("changed", this.__on_data_changed.bind_once (this));
	},
	
	
	/*
	 * Make sure we get notified when the active data collection changes so we
	 * can use that.
	 */
	__watch_data: function () {
		function watch_func (prop, old_v, new_v) {
			this.__disconnect_from_data (old_v);
			this.entry_list_store.clear ();
			this.__populate_list_store (new_v);
			this.__connect_to_data (new_v);
			return new_v;
		}
		
		Context.watch ("active_collection", watch_func.bind (this)); 
	},


	/*
	 * Set up the UI for an empty list.
	 */
	__set_entry_list_empty: function (force) {
		if (this.entry_list.model === this.empty_list_store && !force)
			return;
		this.remove_button.sensitive = false;
		this.entry_list.sensitive = false;
		this.entry_list.model = this.empty_list_store;
		this.list_entry_renderer.alignment = Pango.Alignment.CENTER;
		this.list_entry_renderer.xalign = 0.5;
		this.details_box.sensitive = false;
	},


	/*
	 * Set up the UI for a non-empty list.
	 */
	__set_entry_list_not_empty: function () {
		if (this.entry_list.model === this.entry_list_store)
			return;
		this.entry_list.sensitive = true;
		this.entry_list.model = this.entry_list_store;
		this.list_entry_renderer.alignment = Pango.Alignment.LEFT;
		this.list_entry_renderer.xalign = 0;
	},


	__add_item_to_list_store: function (item)
	{
		var next = null;
		this.entry_list_store.foreach (function (model, path, iter) {
			var model_item = Context.active_collection.get_item (model.get_value (iter, 0));
			if (model_item.date.compare (item.date) > 0)
				return false;
			next = iter.copy ();
			return true;
		});
	
		var iter = this.entry_list_store.insert_before (next);
		this.entry_list_store.set_value (iter, 0, item.id);
		this.entry_list_store.set_value (iter, 1, __date_to_int (item.date));
		this.entry_list_store.set_value (iter, 2, __make_list_caption (item));
	
		return iter;
	},


	__populate_list_store: function (collection) {
		this.entry_list_store.clear ();
		if (!collection)
			collection = Context.active_collection;
		for (let item in collection.get_iterator ()) {
			// Sort order is opposite from item_collection here
			var iter = this.entry_list_store.prepend ();
			this.entry_list_store.set_value (iter, 0, item.id);
			this.entry_list_store.set_value (iter, 1, __date_to_int (item.date));
			this.entry_list_store.set_value (iter, 2, __make_list_caption (item));
		}
	},
	
	
	// public
	
	window: null,
	toolkit: "Gtk+-3.0",
	
	present: function () {
		this.window.present ();
	},
	
	hide: function () {
		this.window.hide ();
	},
	
	run: function () {
		Gtk.main ();
	},
	
	quit: function () {
		Gtk.main_quit ();
	}
};


// We need this because in GJS we cannot easily use GDate in a ListStore

function __date_to_int (date)
{
	return (date.get_day () & 31) | ((date.get_month () & 15) << 5) | (date.get_year () << 9);
}


function __int_to_date (i)
{
	var day = i & 31;
	var month = (i >> 5) & 15;
	var year = i >> 9;
	var result = new GLib.Date ();
	result.set_dmy (day, month, year);
	return result;
}


function __make_date_string (date)
{
	var weekdays = [
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
		"Sunday"
	];
	var months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"Septembre",
		"Octobre",
		"Novembre",
		"Decembre"
	];
	
	var today_js = new Date ();
	var today = GLib.Date.new_dmy (today_js.getDate (), today_js.getMonth () + 1, today_js.getFullYear ());
	var diff = date.days_between (today);
	if (diff === 0)
		return "Today";
	if (diff === 1)
		return "Yesterday";
	if (diff <= 6 && diff > 0)
		return weekdays[date.get_weekday () - 1];
	return "{0}, {1}. {2} {3}".format (weekdays[date.get_weekday () - 1], date.get_day (), months[date.get_month () - 1], date.get_year ());
}


function __make_list_caption (item)
{
	var caption = "<b>" + __make_date_string (item.date) + "</b>";
	if (item.title)
		caption += "\n" + item.title;
	return caption;
}

