//eslint-disable-next-line
const commando = require('discord.js-commando');
const config = require('./config.json');
const client = new commando.Client({
	owner: ['197891949913571329', '251383432331001856', '156019409658314752'],
	commandPrefix: config.prefix,
	unknownCommandResponse: false
});
const { RichEmbed } = require('discord.js');
const fs = require('fs');
const fsn = require('fs-nextra');
const path = require('path');
const sqlite = require('sqlite');
const request = require('superagent');
const oneLine = require('common-tags').oneLine;

client.registry
	.registerGroups([
		['main', 'Main'],
		['overrides', 'Worker Overrides'],
		['misc', 'Miscellaneous'],
		['support', 'Support'],
		['control', 'Bot Owners Only'],
		['fun', 'Fun']
	])

	.registerDefaults()

	.registerCommandsIn(path.join(__dirname, 'commands'));

client.setProvider(sqlite.open(path.join(__dirname, 'settings.sqlite3')).then(db => new commando.SQLiteProvider(db))).catch(console.error);
client.dispatcher.addInhibitor(msg => {
	//eslint-disable-next-line no-sync
	let blacklist = JSON.parse(fs.readFileSync('./blacklist.json', 'utf8'));
	if (blacklist.guilds.includes(msg.guild.id)) return [`Guild ${msg.guild.id} is blacklisted`, msg.channel.send('This guild has been blacklisted. Appeal here: https://discord.gg/6P6MNAU')];
});
client.dispatcher.addInhibitor(msg => {
	//eslint-disable-next-line no-sync
	let blacklist = JSON.parse(fs.readFileSync('./blacklist.json', 'utf8'));
	if (blacklist.users.includes(msg.author.id)) return [`User ${msg.author.id} is blacklisted`, msg.reply('You have been blacklisted. Appeal here: https://discord.gg/6P6MNAU')];
});

client.cooldown = [];

client.workers = ['197891949913571329']

client
	.on('error', console.error)
	.on('warn', console.warn)
	.on('debug', console.log)
	.on('ready', () => {
		console.log(`Client ready; logged in as ${client.user.tag} (${client.user.id}) with prefix ${config.prefix}`)
		const dbotsToken1 = config.dbotstoken1
		request.post(`https://discordbots.org/api/bots/${client.user.id}/stats`)
			.set('Authorization', dbotsToken1)
			.send({
				'server_count': client.guilds.size
			})
			.end();
		console.log('DBotsList guild count updated.')
		const dbotsToken2 = config.dbotstoken2
		request.post(`https://bots.discord.pw/api/bots/${client.user.id}/stats`)
			.set('Authorization', dbotsToken2)
			.send({
				'server_count': client.guilds.size
			})
			.end();
		console.log('DBots guild count updated.')
		client.user.setPresence({
			game: {
				name: `${config.prefix}help | ${client.guilds.size} servers`,
				type: 0
			}
		})
		console.log('Awaiting actions.')
	})
	.on('commandPrefixChange', (guild, prefix) => {
		console.log(oneLine `
			Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('commandStatusChange', (guild, command, enabled) => {
		console.log(oneLine `
			Command ${command.groupID}:${command.memberName}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('groupStatusChange', (guild, group, enabled) => {
		console.log(oneLine `
			Group ${group.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	//eslint-disable-next-line
	.on('commandRun', (command, promise, msg, args) => {
		if (msg.guild) {
			console.log(`Command ran
        Guild: ${msg.guild.name} (${msg.guild.id})
        Channel: ${msg.channel.name} (${msg.channel.id})
        User: ${msg.author.tag} (${msg.author.id})
        Command: ${command.groupID}:${command.memberName}
        Message: "${msg.content}"`)
		} else {
			console.log(`Command ran:
        Guild: DM
        Channel: N/A
        User: ${msg.author.tag} (${msg.author.id})
        Command: ${command.groupID}:${command.memberName}
        Message: "${msg.content}"`)
		}
	})
	.on('guildCreate', (guild) => {
		console.log(`New guild added:
Guild: ${guild.id}
Name: ${guild.name}
Owner: ${guild.owner.user.tag} (${guild.owner.id})
Members: ${guild.members.size}
Bots: ${guild.members.filter(u => u.user.bot).size} (${Math.floor(guild.members.filter(u => u.user.bot).size / guild.members.size * 100)}%)
Humans: ${guild.members.filter(u => !u.user.bot).size} (${Math.floor(guild.members.filter(u => !u.user.bot).size / guild.members.size * 100)}%)
Now on: ${client.guilds.size} servers`)
		client.channels.get('330701184698679307').send(`New guild added:
Guild: ${guild.id}
Name: ${guild.name}
Owner: ${guild.owner.user.tag} (${guild.owner.id})
Members: ${guild.members.size}
Bots: ${guild.members.filter(u => u.user.bot).size} (${Math.floor(guild.members.filter(u => u.user.bot).size / guild.members.size * 100)}%)
Humans: ${guild.members.filter(u => !u.user.bot).size} (${Math.floor(guild.members.filter(u => !u.user.bot).size / guild.members.size * 100)}%)
Now on: ${client.guilds.size} servers`)
		let botPercentage = Math.floor(guild.members.filter(u => u.user.bot).size / guild.members.size * 100)
		if (botPercentage >= 80) {
			guild.defaultChannel.send('**ALERT:** Your guild has been marked as an illegal guild. \nThis may be due to it being marked as a bot guild or marked as a spam guild. \nThe bot will now leave this server. \nIf you wish to speak to my developer, you may join here: https://discord.gg/t8xHbHY')
			guild.owner.send(`**ALERT:** Your guild, "${guild.name}", has been marked as an illegal guild. \nThis may be due to it being marked as a bot guild or marked as a spam guild. \nThe bot will now leave the server. \nIf you wish to speak to my developer, you may join here: https://discord.gg/t8xHbHY`)
			guild.leave()
			//eslint-disable-next-line newline-before-return
			return
		}
		client.user.setGame(`${config.prefix}help | ${client.guilds.size} servers`)
		guild.settings.set('announcements', 'on')
		const embed = new RichEmbed()
			.setAuthor(client.user.username, client.user.avatarURL)
			.setTitle(`Hello, I'm ${client.user.username}!`)
			.setColor(0x00FF00)
			.setDescription(`Thanks for adding me to your server, "${guild.name}"! To see commands do ${guild.commandPrefix}help. Please note: By adding me to your server and using me, you affirm that you agree to [our TOS](https://smoresoft.uk/tos.html).`)
		guild.owner.send({
			embed
		})
	})
	.on('guildDelete', (guild) => {
		console.log(`Existing guild left:
Guild: ${guild.id}
Name: ${guild.name}
Owner: ${guild.owner.user.tag} (${guild.owner.id})
Members: ${guild.members.size}
Bots: ${guild.members.filter(u => u.user.bot).size} (${Math.floor(guild.members.filter(u => u.user.bot).size / guild.members.size * 100)}%)
Humans: ${guild.members.filter(u => !u.user.bot).size} (${Math.floor(guild.members.filter(u => !u.user.bot).size / guild.members.size * 100)}%)
Now on: ${client.guilds.size} servers`)
		client.channels.get('330701184698679307').send(`Existing guild left:
Guild: ${guild.id}
Name: ${guild.name}
Owner: ${guild.owner.user.tag} (${guild.owner.id})
Members: ${guild.members.size}
Bots: ${guild.members.filter(u => u.user.bot).size} (${Math.floor(guild.members.filter(u => u.user.bot).size / guild.members.size * 100)}%)
Humans: ${guild.members.filter(u => !u.user.bot).size} (${Math.floor(guild.members.filter(u => !u.user.bot).size / guild.members.size * 100)}%)
Now on: ${client.guilds.size} servers`)
		client.user.setGame(`ds.help | ${client.guilds.size} servers`)
	})

let active = []

function doOrders() {
	//console.log('Handling orders')
	try {
		//eslint-disable-next-line no-sync
		JSON.parse(fs.readFileSync('./orders.json', 'utf8'))
	} catch (err) {
		console.error(err)
		client.user.setPresence({
			status: 'dnd',
			game: {
				name: 'Orders temporarily broken',
				type: 0
			}
		})
		//eslint-disable-next-line no-useless-return
		return
	}

	fsn.readJSON('./orders.json')
		.then((orderDB) => {
			//console.log(`OrderDB = \n${orderDB}`)
			const oArray = Object.values(orderDB)
			//console.log(`oArray = \n${oArray}`)
			oArray.forEach((o) => {
				if (o.manual !== false) return
				//console.log('Running forEach')
				const orderAuth = client.users.get(o.userID)
				const orderChan = client.channels.get(o.channelID)
				const orderGuild = client.guilds.get(o.guildID)
				const oChan = client.channels.get('394031402758438912')

				let min = 0.59
				let max = 2.59

				if (o.status.toLowerCase() === 'waiting') {
					//console.log('Handling waiting orders')
					if (o.manual !== false) return
					if (active.includes(o.orderID)) return
					if (!active.includes(o.orderID)) {
						//console.log(`Order ${o.orderID} is ready to be handled, continuing`)
						active.push(o.orderID)
						//eslint-disable-next-line
						function getRandomInt(min, max) {
							//eslint-disable-next-line no-mixed-operators
							let number = (Math.random() * (max - min) + min).toFixed(4)
							//eslint-disable-next-line newline-before-return
							return number
						}

						//let time = getRandomInt(min, max)
						//eslint-disable-next-line no-mixed-operators
						let time = (Math.random() * (max - min) + min).toFixed(1)
						time = time.replace('.', '')
						time += '0000'
						console.log(`Order: ${o.orderID}
Status: Awaiting Chef
Time until claimed: ${time}ms`)
						//eslint-disable-next-line no-use-before-define
						setTimeout(cook, time)

						//eslint-disable-next-line no-inner-declarations
						function cook() {
							console.log('Running cook')
							orderDB[o.orderID] = {
								'orderID': o.orderID,
								'userID': o.userID,
								'guildID': o.guildID,
								'channelID': o.channelID,
								'order': o.order,
								'manual': false,
								'status': 'Cooking'
							}

							fsn.writeJSON('./orders.json', orderDB, {
									replacer: null,
									spaces: 2
								})
								.catch((err) => {
									if (err) {
										orderAuth.send(`There was a database error!
Show the following message to a developer:
\`\`\`${err}\`\`\``)
										console.error(`Error in order ${o.orderID} \n${err}`)
									}
								})

							let oIndex = active.indexOf(o.orderID)
							active.splice(oIndex, 1)
						}
					}
				} else if (o.status.toLowerCase() === 'cooking') {
					//console.log('Handling cooking orders')
					if (o.manual !== false) return
					if (active.includes(o.orderID)) return
					if (!active.includes(o.orderID)) {
						//console.log(`Order ${o.orderID} is ready to be handled, continuing`)
						active.push(o.orderID)

						try {
							oChan.fetchMessages({
								limit: 100
							}).then(msgs => {
								let msg = msgs.filter(m => m.content.includes(o.orderID))
								msg = msg.first()
								//eslint-disable-next-line
								if (msg !== undefined) {
									//eslint-disable-next-line no-use-before-define
									updateMsg()
								} else {
									console.error(`Couldn't update oChan for order ${o.orderID}`)
									oChan.send(`Couldn't update oChan for order ${o.orderID}`)
								}
							})
						} catch (err) {
							console.error(`Couldn't update oChan for order ${o.orderID} \nNew status: \`Cooking\``)
							console.error(`Error with ${o.orderID} \n${err}`)
							oChan.send(`Couldn't update oChan for order ${o.orderID} \nNew status: \`Cooking\` \nCheck console`)
						}

						//eslint-disable-next-line no-inner-declarations
						function updateMsg() {
							console.log(`Running updateMsg on ${o.orderID}`)
							oChan.fetchMessages({
									limit: 100
								})
								.then(msgs => {
									let msg = msgs.filter(m => m.content.includes(o.orderID))
									msg.first().edit(`__**Order**__
**OrderID:** ${o.orderID}
**Order:** ${o.order}
**Customer:** ${orderAuth.tag} (${orderAuth.id})
**Ordered from:** #${orderChan.name} (${orderChan.id}) in ${orderGuild.name} (${orderGuild.id})
**Status:** Cooking`)
								})
						}

						let chef = ['Bob#1234',
							'MellissaGamer#4076',
							'ILoveSmores#3256',
							'CoolDeveloper#4035',
							'YoMomma#9693',
							'SpaceX#7569',
							'jdenderplays#2952',
							'ROM Typo#5920',
							'TJDoesCode#7239',
							'Chronomly6#8359',
							'SmoreBot#4391'
						]
						chef = chef[Math.floor(Math.random() * chef.length)]
						orderDB[o.orderID] = {
							'orderID': o.orderID,
							'userID': o.userID,
							'guildID': o.guildID,
							'channelID': o.channelID,
							'order': o.order,
							'manual': false,
							'status': 'Cooking'
						}

						fsn.writeJSON('./orders.json', orderDB, {
								replacer: null,
								spaces: 2
							})
							.then(() => {
								orderAuth.send(`Your order has been put in the oven by chef ${chef}`)
								orderAuth.send('Cooking will take 3 minutes.')
								//eslint-disable-next-line no-use-before-define
								setTimeout(deliver, 180000)
							})
							.catch((err) => {
								if (err) {
									orderAuth.send(`There was a database error!
Show the following message to a developer:
\`\`\`${err}\`\`\``)
									console.error(`Error in order ${o.orderID} \n${err}`)
								}
							})

						//eslint-disable-next-line no-inner-declarations
						function deliver() {
							//console.log('Running deliver')
							orderDB[o.orderID] = {
								'orderID': o.orderID,
								'userID': o.userID,
								'guildID': o.guildID,
								'channelID': o.channelID,
								'order': o.order,
								'manual': false,
								'status': 'Awaiting delivery'
							}

							fsn.writeJSON('./orders.json', orderDB, {
									replacer: null,
									spaces: 2
								})
								.catch((err) => {
									if (err) {
										orderAuth.send(`There was a database error!
Show the following message to a developer:
\`\`\`${err}\`\`\``)
										console.error(`Error in order ${o.orderID} \n${err}`)
									}
								})

							try {
								oChan.fetchMessages({
									limit: 100
								}).then(msgs => {
									let msg = msgs.filter(m => m.content.includes(o.orderID))
									msg = msg.first()
									//eslint-disable-next-line
									if (msg !== undefined) {
										//eslint-disable-next-line no-use-before-define
										updateMsg()
									} else {
										console.error(`Couldn't update oChan for order ${o.orderID}`)
										oChan.send(`Couldn't update oChan for order ${o.orderID}`)
									}
								})
							} catch (err) {
								console.error(`Couldn't update oChan for order ${o.orderID} \nNew status: \`Awaiting delivery\``)
								console.error(`Error with ${o.orderID} \n${err}`)
								oChan.send(`Couldn't update oChan for order ${o.orderID} \nNew status: \`Awaiting delivery\` \nCheck console`)
							}

							//eslint-disable-next-line no-inner-declarations
							function updateMsg() {
								console.log(`Running updateMsg on ${o.orderID}`)
								oChan.fetchMessages({
										limit: 100
									})
									.then(msgs => {
										let msg = msgs.filter(m => m.content.includes(o.orderID))
										msg.first().edit(`__**Order**__
**OrderID:** ${o.orderID}
**Order:** ${o.order}
**Customer:** ${orderAuth.tag} (${orderAuth.id})
**Ordered from:** #${orderChan.name} (${orderChan.id}) in ${orderGuild.name} (${orderGuild.id})
**Status:** Awaiting delivery`)
									})
							}
							let oIndex = active.indexOf(o.orderID)
							active.splice(oIndex, 1)
						}
					}
				} else if (o.status.toLowerCase() === 'awaiting delivery') {
					//console.log('Handling orders awaiting delivery')
					if (o.manual !== false) return
					if (active.includes(o.orderID)) return
					if (!active.includes(o.orderID)) {
						console.log(`Order ${o.orderID} is ready to be handled, continuing`)
						active.push(o.orderID)
						orderAuth.send('Your order has been cooked and will be delivered soon!')

						//eslint-disable-next-line no-mixed-operators
						//let time2 = (Math.random() * (30000 - 59000) + 30000).toFixed(1)
						let time2 = 45000
						console.log(`Order: ${o.orderID}
Status: Awaiting Delivery
Time until delivered: ${time2}ms`)

						//eslint-disable-next-line no-use-before-define
						setTimeout(sendToCustomer, time2)

						//eslint-disable-next-line no-inner-declarations
						function sendToCustomer() {
							let smores = ['https://i.imgur.com/eh93oM9.png',
								'https://i.imgur.com/DvoQEdX.png',
								'https://i.imgur.com/zdsGDa4.png',
								'https://i.imgur.com/o3hD2Mv.png',
								'https://i.imgur.com/LS2b4Mc.png https://i.imgur.com/btwgJnw.png'
							]
							let poptarts = ['https://i.imgur.com/oe7QRAO.png',
								'https://i.imgur.com/Rfe1DQK.png',
								'https://i.imgur.com/PGROXYh.png',
								'https://i.imgur.com/06haJcC.png',
								'https://i.imgur.com/yzTqGyx.png',
								'https://i.imgur.com/dCPHlv8.png',
								'https://i.imgur.com/ZvCRNS2.png',
								'https://i.imgur.com/buTEr8Y.png',
								'https://i.imgur.com/si3DNR6.png'
							]
							let drinks = ['https://i.imgur.com/z2UWBeZ.png',
								'https://i.imgur.com/cCaTqGH.png',
								'https://i.imgur.com/EyFkzax.png',
								'https://i.imgur.com/Q5Hf10B.png',
								'https://i.imgur.com/mWFPQf6.png'
							]

							orderAuth.send('Your order should be arriving now!')
							if (o.order.toLowerCase().includes('smore') || o.order.toLowerCase().includes('s\'more') || o.order.toLowerCase().includes('smores') || o.order.toLowerCase().includes('s\'mores')) {
								orderChan.send(`${orderAuth} Your order has arrived!`)
								//eslint-disable-next-line no-negated-condition
								if (!o.order.toLowerCase().includes('6')) {
									orderChan.send(smores[parseInt(o.order.split(' ').slice(1)) - 1])
								} else {
									orderChan.send(smores[Math.floor(Math.random() * smores.length)])
								}
								let userIndex = client.cooldown.indexOf(orderAuth.id)
								client.cooldown.splice(userIndex, 1)
								delete orderDB[o.orderID]

								fsn.writeJSON('./orders.json', orderDB, {
										replacer: null,
										spaces: 2
									})
									.catch((err) => {
										if (err) {
											orderAuth.send(`There was a database error!
Show the following message to a developer:
\`\`\`${err}\`\`\``)
											console.error(`Error in order ${o.orderID} \n${err}`)
										}
									})

								oChan.fetchMessages({
										limit: 100
									})
									.then(msgs => {
										let msg = msgs.filter(m => m.content.includes(o.orderID))
										msg.first().delete(1)
									})

								let oIndex = active.indexOf(o.orderID)
								active.splice(oIndex, 1)
							} else if (o.order.toLowerCase().includes('poptart') || o.order.toLowerCase().includes('poptarts') || o.order.toLowerCase().includes('pop-tart') || o.order.toLowerCase().includes('pop-tarts')) {
								orderChan.send(`${orderAuth} Your order has arrived!`)
								//eslint-disable-next-line no-negated-condition
								if (!o.order.toLowerCase().includes('10')) {
									orderChan.send(poptarts[parseInt(o.order.split(' ').slice(1)) - 1])
								} else {
									orderChan.send(poptarts[Math.floor(Math.random() * poptarts.length)])
								}
								let userIndex = client.cooldown.indexOf(orderAuth.id)
								client.cooldown.splice(userIndex, 1)
								delete orderDB[o.orderID]

								fsn.writeJSON('./orders.json', orderDB, {
										replacer: null,
										spaces: 2
									})
									.catch((err) => {
										if (err) {
											orderAuth.send(`There was a database error!
Show the following message to a developer:
\`\`\`${err}\`\`\``)
											console.error(`Error in order ${o.orderID} \n${err}`)
										}
									})

								oChan.fetchMessages({
										limit: 100
									})
									.then(msgs => {
										let msg = msgs.filter(m => m.content.includes(o.orderID))
										msg.first().delete(1)
									})

								let oIndex = active.indexOf(o.orderID)
								active.splice(oIndex, 1)
							} else if (o.order.toLowerCase().includes('drink') || o.order.toLowerCase().includes('drinks') || o.order.toLowerCase().includes('beverage') || o.order.toLowerCase().includes('beverages')) {
								orderChan.send(`${orderAuth} Your order has arrived!`)
								orderChan.send(drinks[parseInt(o.order.split(' ').slice(1)) - 1])
								let userIndex = client.cooldown.indexOf(orderAuth.id)
								client.cooldown.splice(userIndex, 1)
								delete orderDB[o.orderID]

								fsn.writeJSON('./orders.json', orderDB, {
										replacer: null,
										spaces: 2
									})
									.catch((err) => {
										if (err) {
											orderAuth.send(`There was a database error!
Show the following message to a developer:
\`\`\`${err}\`\`\``)
											console.error(`Error in order ${o.orderID} \n${err}`)
										}
									})

								oChan.fetchMessages({
										limit: 100
									})
									.then(msgs => {
										let msg = msgs.filter(m => m.content.includes(o.orderID))
										msg.first().delete(1)
									})

								let oIndex = active.indexOf(o.orderID)
								active.splice(oIndex, 1)
							} else {
								orderChan.send(`${orderAuth} Your order had an issue and has not arrived properly.`)
								orderChan.send(`Do \`${orderGuild.commandPrefix}hq\` to get a list of ways to contact the developers.`)
								orderChan.send('We apoligize for any inconvinience.')
								let userIndex = client.cooldown.indexOf(orderAuth.id)
								client.cooldown.splice(userIndex, 1)
								delete orderDB[o.orderID]

								fsn.writeJSON('./orders.json', orderDB, {
										replacer: null,
										spaces: 2
									})
									.catch((err) => {
										if (err) {
											orderAuth.send(`There was a database error!
Show the following message to a developer:
\`\`\`${err}\`\`\``)
											console.error(`Error in order ${o.orderID} \n${err}`)
										}
									})

								oChan.fetchMessages({
										limit: 100
									})
									.then(msgs => {
										let msg = msgs.filter(m => m.content.includes(o.orderID))
										msg.first().delete(1)
									})

								let oIndex = active.indexOf(o.orderID)
								active.splice(oIndex, 1)
							}
						}
					}
				}
			})
		})
}

setInterval(doOrders, 10000)


client.login(config.token).catch(console.error);

process.on('unhandledRejection', err => {
	console.error('Uncaught Promise Error: \n' + err.stack);
});