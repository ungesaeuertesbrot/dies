const Gtk = imports.gi.Gtk;
const Event = imports.malus.event;

function Editor ()
{
	this._init ();
}

Editor.prototype = {
	_init: function () {

	}
}

Event.add_events (Editor.prototype, ["changed"]);

