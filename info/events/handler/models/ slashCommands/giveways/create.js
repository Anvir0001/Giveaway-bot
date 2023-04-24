const { Client, CommandInteraction } = require("discord.js");
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const Schema = require('../../models/giveaway');
const ms = require('ms');
const { color } = require("discord-utilities-js");

module.exports = {
    name: "create",
    description: "Create a giveaway!",
    userPermissions: ['MANAGE_MESSAGES'],
    type: 'CHAT_INPUT',
    options: [
      {
        name: 'title',
        description: 'What are you giving away?',
        type: 'STRING',
        required: true
      },
      {
        name: 'length',
        description: 'How long will be the giveaway (1w/d/h/m/s)',
        type: 'STRING',
        required: true
      },
      {
        name: 'description',
        description: 'Give the giveaway some info',
        type: 'STRING'
      },
      {
        name: 'channel',
        description: 'where the giveaway should be?',
        type: 'CHANNEL',
        channelTypes: ['GUILD_TEXT', 'GUILD_NEWS']
      },
      {
        name: 'reaction',
        description: 'Add a reaction to the button',
        type: 'STRING'
      },
      {
        name: 'color',
        description: 'Color of the giveaway embed',
        type: 'STRING',
        choices: [
            { name: 'Red', value: '#FF0000' },
            { name: 'Green', value: '#32FF00' },
            { name: 'Blue', value: '#008FFF' },
            { name: 'White', value: '#FFFFFF' },
            { name: 'Orange', value: '#FFC900' },
            { name: 'Purple', value: '#D800FF' },
            { name: 'Gold', value: '#FFD700' },
            { name: 'Blurple', value: '#5865F2' },
            { name: 'Random', value: 'RANDOM' },
        ],
      },
      {
        name: 'button_color',
        description: 'Color of the giveaway buttons',
        type: 'STRING',
        choices: [
            { name: 'Red', value: 'DANGER' },
            { name: 'Green', value: 'SUCCESS' },
            { name: 'Blurple', value: 'PRIMARY' },
            { name: 'Grey', value: 'SECONDARY' },
        ],
      },
    ],
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {

        const title = interaction.options.getString('title')
        const length = interaction.options.getString('length')
        const description = interaction.options.getString('description') || '🎉 New giveaway is launched, click to join! 🎉'  
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const ecolor = interaction.options.getString('color') || '#ff33ff'
        const bcolor = interaction.options.getString('button_color') || 'PRIMARY'
        const reaction = interaction.options.getString('reaction') || '🎉'
        
        const row = new MessageActionRow()
      row.addComponents(new MessageButton().setCustomId(`entry`).setLabel(`Join Giveaway`).setEmoji(`${reaction}`).setStyle(`${bcolor}`))
      row.addComponents(new MessageButton().setCustomId(`size`).setLabel(`0 Entries`).setStyle(`SECONDARY`).setDisabled(true))

      let time = ms(length)

        const embed = new MessageEmbed()
            .setColor(`${ecolor}`)
            .setTitle(`${title}`)
            .setThumbnail(interaction.guild.iconURL())
            .setDescription(`${description}`)
            .addField(`Winners:`, `1`)
            .addField('Ends in:', `${ms(time, {long: true})}`)
            .setFooter({
                text: `Hosted by: ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL({dynamic: true})
            })
        interaction.followUp({content: `sent to ${channel}`})
        let msg = await channel.send({embeds: [embed], components: [row]})

        new Schema({
            Guild: interaction.guild.id,
            Host: interaction.user.id,
            Channel: channel.id,
            MessageID: msg.id,
            Time: time,
            Title: title,
            Color: ecolor,
            Bcolor: bcolor,
            Reaction: reaction,
            Date: msg.createdTimestamp,
            Users: [],
            Ended: false,
        }).save();
    }
}