const Lang = imports.lang;

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const GtkExt = imports.malus.extend_gtk;
const Common = imports.dies.gnome.common;

const EVENT_ID = "GuiGnome.Editor.GenericEvent";
const ROOT_OBJECTS = ["DetailsBox", "TextbodyBuffer"];

const Editor = new Lang.Class ({
	Name: 'DiesItemEditor',
	Extends: Gtk.Notebook,
	Signals: {
		"changed": {},
	},

	uiElements: {
		DetailsBox: null,
		DateExpander: null,
		DateExpanderLabel: null,
		DateAdjustment: null,
		TitleEntry: null,
		Textbody: null,
		TextbodyBuffer: null,
	},
	
	_init: function(injector) {
		this.parent({"show-tabs": false});
		
		this._context = {
			tracker: "dies.status-tracker",
			modules: "malus.modules",
			extensions: "malus.extensions",
		};
		injector.inject(this._context);
		
		let builder = new Gtk.Builder({});
		let uiMarkup = this._context.modules.getResourceContents(Common.MODULE_NAME, "ui/editor.ui").toString();
		builder.add_objects_from_string(uiMarkup, uiMarkup.length, ROOT_OBJECTS);
		GtkExt.builderConnect(builder, _eventHandlers, this.uiElements, this);
		
		let tabLabel = new Gtk.Label({label: "General"});
		this.append_page(this.uiElements.DetailsBox, tabLabel);
		
		this._context.extensions.addExtensionListener("/dies/gnome/editor/tab", function(msg, ext) {
			switch (msg) {
			case "added":
				let tabDesc = this._context.extensions.getExtensionObject(ext);
				this.append_page(tabDesc.getTab(), new Gtk.Label({label: tabDesc.tabTitle}));
				this.show_tabs = true;
			}
		}.bind(this));
		
		this._context.tracker.connect("date-selected", _eventHandlers.onDateSelected.bind(this));
		this._context.tracker.connect("collection-activated", _eventHandlers.onCollectionActivated.bind(this));
	},
	
	setContents: function (item) {
		this._handlersInactive = true;
		
		let expander = this.uiElements.DateExpander;
		let dateLabel = this.uiElements.DateExpanderLabel;
		let cal = this.uiElements.DateAdjustment;
		let title = this.uiElements.TitleEntry;
		let body = this.uiElements.TextbodyBuffer;
		let bodyEntry = this.uiElements.Textbody;
		
		if (item && item.date && item.date instanceof GLib.Date) {
			cal.year = item.date.get_year();
			cal.month = item.date.get_month() - 1;
			cal.day = item.date.get_day();
			dateLabel.label = Common.makeDateString(item.date);
			title.text = item.title ? item.title : "";
			body.text = item.text ? item.text : "";
			
			this.sensitive = true;
		} else
			this.sensitive = false;
		
		this._handlersInactive = false;
	},
	
	getContents: function (item) {
	
	},
});


const _eventHandlers = {
	onDateAdjusted: function() {
		if (this._handlersInactive)
			return false;
		
		let [year, mon, day] = this.uiElements.DateAdjustment.get_date();
		let date = new GLib.Date();
		date.set_dmy(day, mon + 1, year);
		let tracker = this._context.tracker;
		tracker.selectedItem.date = date;
		tracker.activeCollection.announceChange(tracker.selectedDate, "date", EVENT_ID);
		
		return true;
	},
	
	onTitleChanged: function() {
		if (this._handlersInactive)
			return false;
		
		let tracker = this._context.tracker;
		tracker.selectedItem.title = this.uiElements.TitleEntry.text;
		tracker.activeCollection.announceChange(tracker.selectedDate, "title", EVENT_ID);
		
		return true;
	},
	
	onTextbodyBufferChanged: function() {
		if (this._handlersInactive)
			return false;
		
		let tracker = this._context.tracker;
		tracker.selectedItem.text = this.uiElements.TextbodyBuffer.text;
		tracker.activeCollection.announceChange(tracker.selectedDate, "text", EVENT_ID);
		
		return true;
	},
	
	onItemChanged: function(sender, item, field, eventId) {
		if (eventId === EVENT_ID)
			return false;
		
		switch (field) {
		case "date": {
			// This should never happen. Instead, a remove event followed by an
			// add event should be emitted.
			let cal = this.ui_elements.DateAdjustment;
			let dateLabel = this.uiElements.DateExpanderLabel;

			cal.year = item.date.get_year();
			cal.month = item.date.get_month() - 1;
			cal.day = item.date.get_day();
			dateLabel.label = Common.makeDateString(item.date);
			break;
		}
		
		case "title": {
			this.uiElements.TitleEntry.text = item.title ? item.title : "";
			break;
		}
		
		case "body": {
			this.uiElements.TextBodyBuffer.text = item.text ? item.text : "";
			break;
		}}
		
		return false;
	},
	
	onCollectionActivated: function(sender, newv) {
		if (this._connectedCollection && this._currentCollectionConnectIds)
			try {
				for each (let connId in this._currentCollectionConnectIds)
					this._connectedCollection.disconnect(connId);
				delete this._currentCollectionConnectIds;
			} catch (e) {
				logError(e, "Error disconnecting event handlers from collection");
			}

		if (newv)
			try {
				let connIds = [];
				
				connIds.push(newv.connect("changed", _eventHandlers.onItemChanged.bind(this)));
				
				this._connectedCollection = newv;
				this._currentCollectionConnectIds = connIds;
			} catch (e) {
				logError(e, "Error connecting event handlers to collection");
			}
		
		this.setContents(this._context.tracker.selectedItem);
	},
	
	onDateSelected: function(sender, date) {
		this.setContents(this._context.tracker.selectedItem);
	},
};

