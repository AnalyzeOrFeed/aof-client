"use strict";

import { EventEmitter } from "events";
import { ipcRenderer as ipc } from "electron";

const pkg = require("../package.json");

const DEFAULT_STATUS = "Ready";
const DEFAULT_RECORDING_STATUS = "Waiting for a match...";

let emitter = new EventEmitter();
let status = DEFAULT_STATUS;
let recordingStatus = DEFAULT_RECORDING_STATUS;

let self = {
	get status() {
		return status;
	},

	get recordingStatus() {
		return recordingStatus;
	},

	get version() {
		return pkg.version;
	},

	on: function(name, listener) {
		emitter.on(name, listener);
	},
	off: function(name) {
		emitter.removeAllListeners(name);
	},

	setStatus: function(_status) {
		status = _status;
		emitter.emit("status", _status);
	},
	clearStatus: function() {
		self.setStatus(DEFAULT_STATUS);
	},

	setRecordingStatus: function(_status) {
		recordingStatus = _status;
		emitter.emit("recording", _status);
	},
	clearRecordingStatus: function() {
		self.setRecording(DEFAULT_RECORDING_STATUS);
	},
};

ipc.on("status", (event, arg) => self.setStatus(arg));
ipc.on("recordingStatus", (event, arg) => self.setRecordingStatus(arg));

export default self;
