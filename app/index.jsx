"use strict";

import React    from "react";
import ReactDOM from "react-dom";
import { shell } from "electron";
import { Router, Route, Link, hashHistory, IndexRedirect } from "react-router";

import Tooltip from "aof-react-components/tooltip";
import SearchableModal from "aof-react-components/searchable-modal";

import Menu     from "components/menu";
import Footer   from "components/footer";
import Home     from "components/home";
import Watch    from "components/watch";
import Featured from "components/featured";
import Profile  from "components/profile";

let App = React.createClass({
	componentWillMount: function() {
        require("./base.scss");
    },
    componentDidMount: function() {
    },
	getInitialState: function() {
		return {};
	},
	handleLogoClick: function() {
		shell.openExternal("https://aof.gg");
	},
	render: function() {
		return <div id="main">
			<Menu />
			
			<div id="content">
				{ this.props.children }
			</div>

			<Footer />
			<div id="logo" onClick={ this.handleLogoClick } ><img src={ require("assets/img/logo.svg") } /></div>

			<Tooltip />
			<SearchableModal />
		</div>;
	}
});

ReactDOM.render((
	<Router history={ hashHistory }>
		<Route path="/" component={ App }>
			<IndexRedirect to="/home" />
			<Route path="home" component={ Home } />
			<Route path="watch" component={ Watch } />
			<Route path="featured" component={ Featured } />
			<Route path="profile" component={ Profile } />
		</Route>
	</Router>
), document.getElementById("app"));
