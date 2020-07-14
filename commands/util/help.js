const Command = require('../../classes/Command');
const PlumEmbed = require("../../classes/Embed");
const { oneLine, stripIndents } = require('common-tags');
const { inspect } = require("util");

module.exports = class HelpCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'help',
			group: 'util',
			memberName: 'help',
			aliases: ['commands'],
			description: 'Displays a list of available commands, or detailed information for a specified command.',
			details: oneLine`
				The command may be part of a command name or a whole command name.
				If it isn't specified, all available commands will be listed.
			`,
			examples: ['help', 'help prefix'],
			guarded: true,

			args: [
				{
					key: 'command',
					prompt: 'Which command would you like to view the help for?',
					type: 'string',
					default: ''
				}
			]
		});
	}

	async run(msg, args) {
        let prefix = msg.guild ? msg.guild.commandPrefix : this.client.commandPrefix;

        let groups = this.client.registry.groups;
        let command = args.command && this.client.registry.findCommands(args.command, false, msg)[0];

        if (command && !command.hidden && args.command != "4") {
            let embed = this.client.utils.embed()
                .setFooter(`The prefix for this server is: ${prefix}`);

            embed.setTitle(`${this.client.utils.emojis.info} Help for command: ${command.name}`);
            embed.setDescription(command.description +
                (command.details ? "\n\n" + command.details : "")+ "\n\n[More info about " + 
                `this command](${process.env.DOMAIN}/commands/${command.name})`);

            let lims = [];
            if (command.guildOnly)
                lims.push(`${this.client.utils.emojis.server} Guild only`);
            if (command.ownerOnly || command.permLevel == 10)
                lims.push(`${this.client.utils.emojis.user} Bot owner only`);
            if (command.nsfw)
                lims.push(`${this.client.utils.emojis.channel} NSFW channels only`);
            if (command.premium)
                lims.push(`${this.client.utils.emojis.premium} Premium users only`);

            if (lims.length) embed.addField(`${this.client.utils.emojis.lock} Limitations`, lims.map(lim => ` - ${lim}`).join("\n"), true);

            let perm = this.client.permissions.get(command.permLevel);
            embed.addField(`${this.client.utils.emojis.numbers} Level`, `**${perm.name}** [${perm.level}]`, true)

            if (command.examples && command.examples.length) {
                embed.addField(`${this.client.utils.emojis.paper} Examples`, command.examples.map(ex => ` - ${msg.prefix}${ex}`).join("\n"));
            }

            embed.addField(`${this.client.utils.emojis.message} Usage`, `\`${msg.prefix}${command.name} ${command.format}\``, true);

            if (command.aliases.length)
                embed.addField(`${this.client.utils.emojis.alias} Alias${command.aliases.length == 1 ? "" : "es"}`, command.aliases.map(al => ` - ${msg.prefix}**${al}**`).join("\n"), true);

            return msg.channel.send(embed);
        } else {
            /** @type {PlumEmbed[]} */
            let embeds = [];
            let index = 0;

            let cmdFilter = cmd => !cmd.hidden && (cmd.isUsable(msg) || cmd.premium) && (msg.guild ? msg.member : msg.author).level.level >= cmd.permLevel;

            groups.filter(grp => grp.commands.some(cmdFilter)).sort((g1, g2) => g1.name.localeCompare(g2.name)).forEach(grp => {
                let fieldText = [];

                // eslint-disable-next-line no-unused-vars
                for (let [id, cmd] of grp.commands.filter(cmdFilter).entries()) {
                    fieldText.push(`${cmd.premium ? "🔸" : "▫️"} ${prefix}**${cmd.name}**: ${cmd.description}`);
                }

                embeds.push(
                    this.client.utils.embed()
                    .setTitle(`${this.client.utils.emojis.info} List of all commands`)
                    .setDescription(`Page ${embeds.length + 1}`)
                    .addField(grp.name, fieldText.join("\n")));
            });

            embeds.forEach(embed => {
                embed
                    .setDescription(`${embed.description} of ${embeds.length}`);
                if (msg.guild.me.hasPermission("MANAGE_MESSAGES"))
                    embed.setFooter(`This menu will expire in 2 minutes`);
                embed.addField("Useful Links",
                    oneLine`
                    [Official Website](${process.env.DOMAIN}) | 
                    [All commands](${process.env.DOMAIN}/commands) |
                    [Official Support Server](${process.env.DOMAIN}/server)`);
            });

            if (!embeds.length) {
                return this.client.utils.sendErrMsg(msg, "You have no usable commands. Contact the owner for more info.");
            }

            if (!msg.guild.me.hasPermission("MANAGE_MESSAGES")) {
                let index = Math.max(0, (isNaN(args.command) ? 1 : parseInt(args.command)) - 1 % embeds.length);
                let embed = embeds[index || 0];
                if (!embed) return this.client.utils.sendErrMsg(msg, `There was an error finding page ${index+1}. Make sure ` +
                    `the page is a number between 1 and ${embeds.length}.`);
                embed.setDescription(`${embed.description} • Use \`${prefix}help [page]\` to choose another page.`);
                msg.channel.send(embed);
                return;
            }

            /* eslint-disable no-unused-vars */
            const R = [
                [this.client.utils.emojis.prev, (collector) => index--],
                [this.client.utils.emojis.stop, (collector) => collector.stop("manual")],
                [this.client.utils.emojis.next, (collector) => index++],
            ];
            /* eslint-enable no-unused-vars */

            console.error(embeds);
            let message = await msg.channel.send(embeds[0]);
            // eslint-disable-next-line no-unused-vars
            for (let [react, cb] of R) {
                await message.react(react);
            }

            const filter = (reaction, user) => {
                return R.map(r => r[0]).some(emoji => reaction.emoji.name === emoji) && user.id === msg.author.id;
            };

            const collector = message.createReactionCollector(filter, {
                time: 120000
            });

            // eslint-disable-next-line no-unused-vars
            collector.on('collect', async (reaction, user) => {
                if (msg.guild.me.hasPermission("MANAGE_MESSAGES")) await reaction.users.remove(msg.author.id);

                var matching = R.filter(r => r[0] == reaction.emoji.name);
                if (!matching.length) return;

                matching[0][1](collector);
                if (index < 0) index = embeds.length - 1;
                index %= embeds.length;

                message.edit(embeds[index]);
            });

            collector.on('end', async (collected, reason) => {
                msg.reactions.cache.forEach(r => r.remove());
                let m;
                if (reason === "manual") {
                    m = await message.edit("Interactive menu ended successfully.");
                } else {
                    m = await message.edit("Interactive menu ended for inactivity.");
                }
                m;
                // m.delete({ timeout: 10000 });
            });
        }
	}
};