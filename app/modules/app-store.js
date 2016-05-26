const ee = require("events");
const util = require("util");

const pkg = require("../package.json");

const DEFAULT_STATUS = "Ready";

class AppStore {
	constructor() {
		this.clearStatus();
		this.version = pkg.version;
		ee.call(this);
	}

	setStatus(status) {
		this.status = status;
		this.emit("status", status);
	}

	clearStatus() {
		this.setStatus(DEFAULT_STATUS);
	}
}

util.inherits(AppStore, ee);

export default new AppStore();
