const Gtk = imports.gi.Gtk;

function GnomeTab(injector) {
	this._init(injector);
}

GnomeTab.prototype = {
	_init: function(injector) {
		this._context = {
			tracker: "dies.status-tracker",
		};
		injector.inject(this._context);
		
		let widget = new Gtk.Grid({row_spacing: 5,
								   column_spacing: 5,
								   border_width: 5,
								   hexpand: true});
		this._placesLabel = new Gtk.Label({label: "Places"});
		widget.attach(this._placesLabel, 0, 0, 1, 1);
		this._placesEntry = new Gtk.Entry({hexpand: true});
		this._placesEntry.connect("changed", _eventHandlers.onPlacesEntryChanged.bind(this));
		widget.attach(this._placesEntry, 1, 0, 1, 1);
		
		this._context.tracker.connect("date-selected", _eventHandlers.onDateSelected.bind(this));
		this._context.tracker.connect("collection-activated", _eventHandlers.onCollectionActivated.bind(this));

		widget.show();
		this._widget = widget;
	},
	
	getTab: function() {
		return this._widget;
	},
	
	tabTitle: "Places",
};

const _eventHandlers = {
	onPlacesEntryChanged: function() {
		let item = this._context.tracker.selectedItem;
		if (!item)
			return;
		
		let places = this._placesEntry.text.split(",");
		for (let i = 0; i < places.length; i++)
			places[i] = {name: places[i].trim()};
		
		item.places = places;
	},
	
	onDateSelected: function(sender, date) {
		let item = this._context.tracker.selectedItem;
		if (!item)
			return;
		
		this._placesEntry.text = "";
		if (!item.places)
			return;
		let placesStr = "";
		for (let i = 0; i < item.places.length; i++) {
			if (placesStr.length > 0)
				placesStr += ", ";
			placesStr += item.places[i].name;
		}
		
		this._placesEntry.text = placesStr;
	},
	
	onCollectionActivated: function(sender, newv) {
	
	},
};

