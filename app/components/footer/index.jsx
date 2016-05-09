"use strict";

import React    from "react";
import ReactDOM from "react-dom";

module.exports = React.createClass({
	render: function() {
		return <div id="footer">
			<div className="separator" />
			<div className="content">
				{ this.props.children }
			</div>
		</div>;
	}
});
