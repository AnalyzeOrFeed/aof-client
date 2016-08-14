"use strict";

import React    from "react";
import ReactDOM from "react-dom";
import { Link } from "react-router";

import AppStore from "stores/app-store";

import Button from "aof-react-components/button";
import ButtonImage from "aof-react-components/button-image";
import { hashHistory } from "react-router";

module.exports = React.createClass({
	componentWillMount: function() {
		require("./style.scss");
	},
	componentDidMount: function() {
		hashHistory.listen(() => {
			this.setState({ open: false });
		});
	},
	getInitialState: function() {
		return {
			open: true,
		};
	},
	toggle: function() {
		this.setState({ open: !this.state.open });
	},
	render: function() {
		return <div id="menu" className={ this.state.open ? "open" : "" }>
			<div className="toggle">
				<ButtonImage src={ require("assets/img/bars.svg") } width={ 20 } height={ 20 } onClick={ this.toggle }>|||</ButtonImage>
			</div>
			<div className="titles">
				{ this.state.open ? 
					<div className="title">Analyze Or Feed</div>
				: null }
				{ this.state.open ?
					<div className="sub-title">Client v{ AppStore.version }</div>
				: null }
			</div>
			<div className="components">
				<Link to="/home" className="watch" activeClassName="active">
					<img src={ require("assets/img/home.svg") } /><div>{ this.state.open ? "Home" : "" }</div>
				</Link>
				<Link to="/watch" className="watch" activeClassName="active">
					<img src={ require("assets/img/eye.svg") } /><div>{ this.state.open ? "Watch" : "" }</div>
				</Link>
				<Link to="/featured" activeClassName="active">
					<img src={ require("assets/img/star.svg") } /><div>{ this.state.open ? "Featured" : "" }</div>
				</Link>
				<Link to="/profile" activeClassName="active">
					<img src={ require("assets/img/profile.svg") } /><div>{ this.state.open ? "Profile" : "" }</div>
				</Link>
			</div>
			<div className="separator" />
		</div>;
	}
});
