const http = require('http');
const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

// MatchZy (CS2 plugin) can POST match events as JSON to an HTTP endpoint via
// the `matchzy_remote_log_url` convar. This module listens for those events
// and keeps a live-updating Discord embed in sync with the match.
// Docs: https://shobhit-pathak.github.io/MatchZy/

const COLOR_WARMUP = 0xFF6F00;
const COLOR_LIVE = 0x2ECC71;
const COLOR_DONE = 0x3498DB;

let secretinfo = {};
try {
	secretinfo = JSON.parse(fs.readFileSync('commands/database/secretinfo.json'));
} catch (err) {
	console.log('[matchzy] secretinfo.json not found, webhook will use defaults');
}

const matches = new Map(); // matchid -> match state

function getState(matchid) {
	const key = String(matchid);
	if (!matches.has(key)) {
		matches.set(key, {
			matchid: key,
			mapNumber: 0,
			team1: { name: 'Team 1', score: 0, players: [] },
			team2: { name: 'Team 2', score: 0, players: [] },
			status: 'Match starting...',
			color: COLOR_WARMUP,
			message: null,
		});
	}
	return matches.get(key);
}

function toTeamSummary(team) {
	return {
		score: team.score,
		players: team.players || [],
	};
}

function formatPlayers(team) {
	if (!team.players || team.players.length === 0) return '​';
	return team.players
		.slice()
		.sort((a, b) => b.stats.kills - a.stats.kills)
		.map(p => `\`${String(p.stats.kills).padStart(2)}/${String(p.stats.deaths).padStart(2)}/${String(p.stats.assists).padStart(2)}\` ${p.name}`)
		.join('\n');
}

function buildEmbed(state) {
	return new EmbedBuilder()
		.setColor(state.color)
		.setTitle(`${state.team1.name} vs ${state.team2.name}`)
		.setDescription(state.status)
		.addFields(
			{ name: `${state.team1.name} (${state.team1.score ?? 0})`, value: formatPlayers(state.team1), inline: true },
			{ name: `${state.team2.name} (${state.team2.score ?? 0})`, value: formatPlayers(state.team2), inline: true },
		)
		.setFooter({ text: `Match ${state.matchid}` })
		.setTimestamp();
}

async function sendOrUpdate(client, state) {
	const embed = buildEmbed(state);
	try {
		if (state.message) {
			await state.message.edit({ embeds: [embed] });
			return;
		}
		const channelId = (secretinfo.matchzy && secretinfo.matchzy.channelID) || secretinfo.channelID;
		const channel = await client.channels.fetch(channelId);
		state.message = await channel.send({ embeds: [embed] });
	} catch (err) {
		console.log('[matchzy] Failed to send/update embed:', err);
	}
}

async function handleEvent(client, body) {
	if (!body || !body.event || body.matchid === undefined) return;
	const state = getState(body.matchid);

	switch (body.event) {
		case 'going_live':
			state.mapNumber = body.map_number;
			state.status = '🔴 Live - Warmup complete';
			state.color = COLOR_LIVE;
			await sendOrUpdate(client, state);
			break;

		case 'round_end': {
			state.team1 = { ...state.team1, ...toTeamSummary(body.team1) };
			state.team2 = { ...state.team2, ...toTeamSummary(body.team2) };
			const roundWinner = body.winner.team === 'team1' ? state.team1.name : state.team2.name;
			state.status = `🔴 Live - Round ${body.round_number} won by ${roundWinner} (${body.winner.side})`;
			state.color = COLOR_LIVE;
			await sendOrUpdate(client, state);
			break;
		}

		case 'map_result': {
			state.team1 = { ...state.team1, ...toTeamSummary(body.team1) };
			state.team2 = { ...state.team2, ...toTeamSummary(body.team2) };
			const winner = body.winner.team === 'team1' ? state.team1 : state.team2;
			state.status = `🏆 ${winner.name} won ${state.team1.score}-${state.team2.score}`;
			state.color = COLOR_DONE;
			await sendOrUpdate(client, state);
			matches.delete(state.matchid);
			break;
		}

		default:
			break;
	}
}

function start(client) {
	const port = (secretinfo.matchzy && secretinfo.matchzy.port) || 3001;
	const headerKey = secretinfo.matchzy && secretinfo.matchzy.headerKey;
	const headerValue = secretinfo.matchzy && secretinfo.matchzy.headerValue;

	const server = http.createServer((req, res) => {
		if (req.method !== 'POST' || req.url !== '/matchzy') {
			res.writeHead(404);
			res.end();
			return;
		}

		if (headerKey && req.headers[headerKey.toLowerCase()] !== headerValue) {
			res.writeHead(401);
			res.end();
			return;
		}

		let body = '';
		req.on('data', chunk => { body += chunk; });
		req.on('end', async () => {
			res.writeHead(200);
			res.end();

			try {
				const json = JSON.parse(body);
				console.log(`[matchzy] Received event: ${json.event}`);
				await handleEvent(client, json);
			} catch (err) {
				console.log('[matchzy] Failed to handle event:', err);
			}
		});
	});

	server.listen(port, () => {
		console.log(`[matchzy] Webhook listener started on port ${port}`);
	});

	return server;
}

module.exports = { start };
