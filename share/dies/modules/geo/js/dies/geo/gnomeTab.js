const Gtk = imports.gi.Gtk;

function GnomeTab(injector) {
	this._init(injector);
}

GnomeTab.prototype = {
	_init: function(injector) {
		this._context = {
			tracker: "dies.status_tracker",
		};
		injector.inject(this._context);
		
		let widget = new Gtk.Grid({row_spacing: 5,
								   column_spacing: 5,
								   border_width: 5,
								   hexpand: true});
		this._places_label = new Gtk.Label({label: "Places"});
		widget.attach(this._places_label, 0, 0, 1, 1);
		this._places_entry = new Gtk.Entry({hexpand: true});
		this._places_entry.connect("changed", __handlers.on_places_entry_changed.bind(this));
		widget.attach(this._places_entry, 1, 0, 1, 1);
		
		this._context.tracker.connect("date-selected", __handlers.on_date_selected.bind(this));
		this._context.tracker.connect("collection-activated", __handlers.on_collection_activated.bind(this));

		widget.show();
		this._widget = widget;
	},
	
	getTab: function() {
		return this._widget;
	},
	
	tabTitle: "Places",
};

const __handlers = {
	on_places_entry_changed: function() {
		let item = this._context.tracker.selected_item;
		if (!item)
			return;
		
		let places = this._places_entry.text.split(",");
		for (let i = 0; i < places.length; i++)
			places[i] = {name: places[i].trim()};
		
		item.places = places;
	},
	
	on_date_selected: function(sender, date) {
		let item = this._context.tracker.selected_item;
		if (!item)
			return;
		
		this._places_entry.text = "";
		if (!item.places)
			return;
		let places_str = "";
		for (let i = 0; i < item.places.length; i++) {
			if (places_str.length > 0)
				places_str += ", ";
			places_str += item.places[i].name;
		}
		
		this._places_entry.text = places_str;
	},
	
	on_collection_activated: function(sender, newv) {
	
	},
};

