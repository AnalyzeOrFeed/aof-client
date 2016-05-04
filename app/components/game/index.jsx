import React from "react";
import moment from "moment";

import API from "modules/aof-api";
import Player from "./player";

export default React.createClass({
	componentWillMount: function() {
        require("./style.scss");
    },
    getInitialState: function() {
        return {};
    },
	render: function() {
		let team1 = [];
		let team2 = [];
		
		this.props.game.players.forEach((player) => {
			if (player.teamNr == 0) team1.push(player);
			else if (player.teamNr == 1) team2.push(player);
		});

		let sortPlayers = (a, b) => {
			let diff = a.laneId - b.laneId;
			return diff !== 0 ? diff : (a.roleId - b.roleId);
		};
		team1.sort(sortPlayers);
		team2.sort(sortPlayers);
		
		let region = this.props.game.regionId ? API.getRegionById(this.props.game.regionId) : null;
		let extLink = "http://matchhistory." + region.shortName + ".leagueoflegends.com/en/#match-details/" + 
			region.spectatorRegion + "/" + this.props.game.id + "/1";
		
		return <div className="component-game" {...this.props}>
			<header>
				<div className="info">
					<span>
						<img src={ require("assets/globe.svg") } />
						<span className="label">{ region.shortName }</span>
					</span>
					<span>
						<img src={ require("assets/disc.svg") } />
						<span className="label">{ this.props.game.riotVersion }</span>
					</span>
				</div>
				
				<div className="buttons">
					<a href={ extLink } target="_blank" className="bigButton">
						Match History
					</a>

					<div className="bigButton">
						WATCH
					</div>
				</div>
			</header>

			<div className="separator" />

			<div className="leftCol">
				{ team1.map(function(player, index) {
					return <Player player={player} side="LEFT" key={ player.id } />
				})}
			</div>

			<div className="rightCol">
				{ team2.map(function(player, index) {
					return <Player player={player} side="RIGHT" key={ player.id } />
				})}
			</div>
		</div>;
	}
});
