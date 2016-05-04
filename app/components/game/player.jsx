import React from "react"

import API from "modules/aof-api";

export default React.createClass({
	render: function() {
		let league = API.getLeagueById(this.props.player.leagueId);
		let rank = "I";
		if (this.props.player.leagueRank == 2) rank = "II";
		else if (this.props.player.leagueRank == 3) rank = "III";
		else if (this.props.player.leagueRank == 4) rank = "IV";
		else if (this.props.player.leagueRank == 5) rank = "V";

		var champion = API.getChampionById(this.props.player.championId);

		var spell1 = API.getSpellById(this.props.player.fId);
		var spell2 = API.getSpellById(this.props.player.dId);

		return <div className="component-gamePlayer">
			<div>
				<div style={{ display: "inline-block" }}>
					<div className="component-championImage populated">
						<img src={ "https://ddragon.leagueoflegends.com/cdn/6.9.1/img/champion/" + champion.image.full } />
					</div>
				</div>

				<div style={{ verticalAlign: "top", marginLeft: "5px", display: "inline-block" }}>
					<div><div className="component-spellImage populated">
						<img src={ "https://ddragon.leagueoflegends.com/cdn/6.9.1/img/spell/" + spell1.image.full } />
					</div></div>
					<div style={{ marginTop: "5px" }}><div className="component-spellImage populated">
						<img src={ "https://ddragon.leagueoflegends.com/cdn/6.9.1/img/spell/" + spell2.image.full } />
					</div></div>
				</div>
			</div>

			<div className="summonerBlock">
				<div className="name">{ this.props.player.summonerName }</div>
				<div className="stats">
					<span><img src={ require("assets/knight.svg") } /> { league.name } { rank }</span>
				</div>
			</div>

			<div className="leagueBlock right">
				<div className="component-leagueImage populated">
					<img src={ require("assets/" + league.name.toLowerCase() + ".png") } />
				</div>
			</div>
		</div>;
	}
});
