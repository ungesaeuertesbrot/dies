const Lang = imports.lang;

const GObj = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const GtkExt = imports.malus.extend_gtk;
const Common = imports.dies.gnome.common;

const ROOT_OBJECTS = ["OverviewBox", "EmptyListstore", "EntryListstore"];

const Overview = new Lang.Class ({
	Name: "DiesItemsOverview",
	Extends: Gtk.Box,
	Signals: {
		"date-selected": {},
		"date-add": {},
	},
	

	uiElements: {
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
			tracker: "dies.status-tracker",
			modules: "malus.modules",
		};
		
		injector.inject(this._context);
		
		let builder = new Gtk.Builder({});
		let uiMarkup = this._context.modules.getResourceContents(Common.MODULE_NAME, "ui/overview.ui").toString();
		builder.add_objects_from_string(uiMarkup, uiMarkup.length, ROOT_OBJECTS);
		GtkExt.builderConnect(builder, _eventHandlers, this.uiElements, this);
		this.uiElements.EntryListstore.set_sort_column_id(0, Gtk.SortType.DESCENDING);
		this.pack_start(this.uiElements.OverviewBox, true, true, 0);
		
		let that = this;
		this._context.tracker.connect("collection-activated", _eventHandlers.onCollectionActivated.bind(this));
		this._context.tracker.connect("date-selected", _eventHandlers.onDateSelected.bind(this));
		_eventHandlers.onCollectionActivated.apply(this, [this, this._context.tracker.activeCollection]);
		_eventHandlers.onDateSelected.apply(this, [this, this._context.tracker.selectedDate]);
	},
});

const _eventHandlers = {

	/*
	 * Event handler
	 */
	onAddEvent: function (actor, event) {
		let cal = this.uiElements.OverviewCalendar;
		let date = GLib.Date.new_dmy (cal.day, cal.month + 1, cal.year);
		if (this._context.tracker.activeCollection.hasItem(date))
			this._context.tracker.selectedDate = date;
		else
			this._context.tracker.activeCollection.newItem(date);
	},


	onCalendarDaySelected: function(actor, event) {
		let cal = this.uiElements.OverviewCalendar;
		let date = GLib.Date.new_dmy(cal.day, cal.month + 1, cal.year);
		this._context.tracker.selectedDate = date;
	},
	
	
	/*
	 * Event handler
	 */
	onRemoveButtonClicked: function (actor, event) {
		let list = this.uiElements.EntryList;
		let store = this.uiElements.EntryListstore;
		
		var iter = list.get_selection ().get_selected ()[2];
		var itemId = store.get_value (iter, 0);
		var item = this._context.tracker.activeCollection.getItem (itemId);
		var msg = new Gtk.MessageDialog ({buttons: Gtk.ButtonsType.NONE,
									message_type: Gtk.MessageType.WARNING,
									text: "Delete entry for {0}?".format (Common.makeDateString (item.date)),
									secondary_text: "This action cannot be undone."});
		msg.add_button ("gtk-cancel", Gtk.ResponseType.CANCEL);
		msg.add_button ("gtk-delete", Gtk.ResponseType.ACCEPT);
		let result = msg.run ();
		msg.hide ();
		msg.destroy ();
		if (result === Gtk.ResponseType.ACCEPT)
			this._context.tracker.activeCollection.deleteItem(itemId);
	},
		

	/*
	 * Event handler
	 */
	onEntryListSelectionChanged: function (actor, event) {
		let list = this.uiElements.EntryList;
		let store = this.uiElements.EntryListstore;
		
		let [hasSel, model, iter] = list.get_selection().get_selected();
		// This can only be caused by the code itself and should be handled there
		if (!hasSel)
			return;
		let itemId = store.get_value(iter, 0);
		this._context.tracker.selectedDate = itemId;	// item_id is really just the julian date
	},
	
	onCollectionActivated: function(sender, newv) {
		let cal = this.uiElements.OverviewCalendar;
		let list = this.uiElements.EntryList;
		let store = this.uiElements.EntryListstore;
		let remBtn = this.uiElements.RemoveButton;

		if (this._connectedCollection && this._currentCollectionConnectIds)
			try {
				for each (let connId in this._currentCollectionConnectIds)
					this._connectedCollection.disconnect(connId);
				delete this._currentCollectionConnectIds;
			} catch (e) {
			}

		cal.clear_marks();
		store.clear();
		
		if (newv) {
			try {
				let connIds = [];
				
				connIds.push(newv.connect("new", _eventHandlers.onNewItem.bind(this)));
				connIds.push(newv.connect("changed", _eventHandlers.onItemChanged.bind(this)));
				connIds.push(newv.connect("deleted", _eventHandlers.onItemDeleted.bind(this)));
				
				this._connectedCollection = newv;
				this._currentCollectionConnectIds = connIds;
			} catch (e) {
			}
			
			
			let dateSel = this._context.tracker.selectedDate;
			for (let item in newv.getIterator(dateSel.get_year(), dateSel.get_month()))
				cal.mark_day(item.date.get_day());
			
			for (let item in newv.getIterator()) {
				let iter = store.append();
				store.set(iter, [0, 1], [item.date.get_julian(), makeListCaption(item)]);
				list.model = store;
				list.sensitive = true;
			}
			
			_eventHandlers.onDateSelected.apply(this, [sender, dateSel]);
		}
	},
	
	onDateSelected: function(sender, newv) {
		let remBtn = this.uiElements.RemoveButton;
		let store = this.uiElements.EntryListstore;
		let list = this.uiElements.EntryList;
		let cal = this.uiElements.OverviewCalendar;

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
			let collection = this._context.activeCollection;
			if (collection)
				for (let item in collection.getIterator(newv.get_year(), newv.get_month()))
					cal.mark_day(item.date.get_day());
		}
		cal.day = newv.get_day ();
		
		let item = this._context.tracker.selectedItem;
		
		if (!item) {
			list.get_selection().unselect_all();
			remBtn.sensitive = false;
		} else {
			remBtn.sensitive = true;
			let newJulian = newv.get_julian();
			let [hasSel, selModel, selIter] = list.get_selection().get_selected();
			if (!hasSel || Number(selModel.get_value(selIter, 0)) !== newJulian)
				store.foreach(function(model, path, iter) {
					let listDate = model.get_value(iter, 0);
					if (listDate !== newJulian)
						return false;
					list.get_selection().select_iter(iter);
					list.scroll_to_cell(path, null, false, 0, 0);
					return true;
				});
		}
	},
	
	onNewItem: function(collection, id) {
		let store = this.uiElements.EntryListstore;
		let list = this.uiElements.EntryList;
		let cal = this.uiElements.OverviewCalendar;
		
		let item = this._context.tracker.selectedItem;
		if (item.date.get_julian() !== id)
			item = this._context.tracker.activeCollection.getItem(id);
		let iter = store.append();
		store.set(iter, [0, 1], [id, makeListCaption(item)]);
		
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
	
	onItemChanged: function(collection, id, field) {
		// We only display the date (which is never actually changed) and the
		// title in the overview.
		if (field !== "title")
			return;

		let list = this.uiElements.EntryList;
		
		let item = this._context.tracker.selectedItem;
		if (item.date.get_julian() !== id)
			item = this._context.tracker.activeCollection.getItem(id);

		let [hasSel, model, iter] = list.get_selection().get_selected();
		let listId = model.get_value(iter, 0);
		if (Number(listId) !== Number(id))
			model.foreach(function(forModel, path, forIter) {
				let itemId = forModel.get_value(forIter, 0);
				if (Number(itemId) !== Number(id))
					return false;
				iter = forIter;
				return true;
			});
		
		model.set_value(iter, 1, makeListCaption(item));
	},
	
	onItemDeleted: function(collection, id) {
		let store = this.uiElements.EntryListstore;
		let list = this.uiElements.EntryList;
		let cal = this.uiElements.OverviewCalendar;
		
		let [hasSel, selModel, selIter] = list.get_selection().get_selected();
		let listId = store.get_value(selIter, 0);
		if (Number(listId) === Number(id))
			store.remove(selIter);
		else
			store.foreach(function(model, path, iter) {
				let itemId = model.get_value(iter, 0);
				if (Number(itemId) !== Number(id))
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

function makeListCaption(item)
{
	var caption = "<b>" + Common.makeDateString(item.date) + "</b>";
	if (item.title)
		caption += "\n" + item.title;
	return caption;
}

