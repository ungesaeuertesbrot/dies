const GObj = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Event = imports.malus.event;

function Pane ()
{
	this._init ();
}

Pane.prototype = {
	widget: null,
	
	_init: function () {
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
	
		this.calendar = new Gtk.Calendar ({show_week_numbers: true});
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
	
		this.widget = new Gtk.Table ({n_columns: 2, n_rows: 2, hexpand: false});
		this.widget.attach (this.entry_list_scroll, 0, 2, 0, 1, Gtk.AttachOptions.EXPAND | Gtk.AttachOptions.FILL,
								Gtk.AttachOptions.EXPAND | Gtk.AttachOptions.FILL, 0, 0);
		this.widget.attach (this.calendar, 0, 1, 1, 2, 0,
								Gtk.AttachOptions.FILL, 0, 0);
		this.widget.attach (this.action_buttons, 1, 2, 1, 2, Gtk.AttachOptions.EXPAND | Gtk.AttachOptions.FILL,
								Gtk.AttachOptions.FILL, 0, 0);
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
}

Event.add_events (Pane.prototype, [
	"date_selected",
	"date_add"
]);

