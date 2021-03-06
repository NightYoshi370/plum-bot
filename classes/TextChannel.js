// @ts-check
const {
    Structures, DMChannel, TextChannel
} = require('discord.js');
const {
    findType
} = require('../settings/index.js');
const db = require('../utils/database.js');
const PlumClient = require("./Client");

// This extends Discord's native Guild class with our own methods and properties
module.exports = Structures.extend("TextChannel", TextChannel => class extends TextChannel {
	constructor(...args) {
		super(...args);
	}

	get sendable() {
		let me = this.guild.me;
		return this.permissionsFor(me).has('SEND_MESSAGES');
	}

	get embedable() {
		let me = this.guild.me;
		return this.permissionsFor(me).has('EMBED_LINKS');
	}
});
