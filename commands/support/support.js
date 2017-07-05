//eslint-disable-next-line
const commando = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;
const Discord = require('discord.js');

module.exports = class SupportCommand extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'support',
      aliases: ['call', 'contact', 'supportcall', 'helpme', 'howtouse'],
      group: 'support',
      memberName: 'support',
      description: 'Calls the developer server for support.',
      details: oneLine `
        Do you need help with Discord S'mores?
        Use this command to get in contact with the developers and get the help you need!
			`,
      examples: ['support'],
      guildOnly: true,
      guarded: true
    })
  }

  async run(message) {
    let isEnabled
    const client = this.client
    message.reply('Thank you for contacting DiscordS\'mores Support! If there are any available support representatives, they will contact you soon.')
    let chan = message.channel
    let supportChan = '322450311597916172'
    const embed = new Discord.RichEmbed()
      .setTitle(':bangbang: **New support call** :bangbang:')
      .setAuthor(`${message.author.tag} (${message.author.id})`, `${message.author.avatarURL}`)
      .setColor(0xFF0000)
      .setDescription(`**Guild:** ${message.guild.name} (${message.guild.id}) \n**Channel:** #${message.channel.name} (${message.channel.id}) \n**Started by:** ${message.author.tag} (${message.author.id})`)
      .setFooter('DSmores Support System')
      .setTimestamp()
    this.client.channels.get(supportChan).send({
      embed: embed
    })
    const collector = this.client.channels.get(supportChan).createCollector(message => message.content.startsWith('call'), {
      time: 0
    })
    this.client.channels.get(supportChan).send('Do `call answer` to answer call and connect to server in need or `call end` to deny call.')
    collector.on('message', (message) => {
      if (message.content === 'call end') collector.stop('aborted')
      if (message.content === 'call answer') collector.stop('success')
    })
    collector.on('end', (collected, reason) => {
      if (reason === 'time') return message.reply('The call timed out.')
      if (reason === 'aborted') {
        message.reply(':x: The call has been denied.')
        this.client.channels.get(supportChan).send(':x: Succesfully denied call.')
      }
      if (reason === 'success') {
        this.client.channels.get(supportChan).send(':heavy_check_mark: Call picked up!')
        chan.send(`${message.author}`)
        chan.send(':heavy_check_mark: Your call has been picked up by a support representative!')
        chan.send(':hourglass: You will be helped shortly.')
        isEnabled = true
        this.client.on('message', message => {
          function contact() {
            if (isEnabled === false) return
            if (message.author.id === '322882931746013185') return
            if (message.content.startsWith('call end')) {
              message.channel.send(':x: Call has been hung up.')
              if (message.channel.id === chan.id) client.channels.get(supportChan).send(':x: The call was ended from the other side.')
              if (message.channel.id === supportChan) chan.send(':x: The call was ended from the other side.')

              return isEnabled = false
            }
            if (message.channel.id === chan.id) client.channels.get(supportChan).send(`:telephone_receiver: **${message.author.tag}**: ${message.content}`)
            if (message.channel.id === supportChan) chan.send(`:star: ${message.content}`)
          }
          contact(client)
        })
      }
    })
  }
};
