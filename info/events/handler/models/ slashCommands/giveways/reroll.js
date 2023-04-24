const { Client, CommandInteraction } = require("discord.js");
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const Schema = require('../../models/giveaway');

module.exports = {
    name: "reroll",
    description: "reroll an existing giveaway",
    type: 'CHAT_INPUT',
    userPermissions: ['MANAGE_MESSAGES'],
    botPermissions: ['SEND_MESSAGES', 'MANAGE_MESSAGES'],
    options: [
        {
          name: 'giveaway_id',
          description: 'Pass the  giveaway ID',
          type: 'STRING',
          required: true
        },
    ],
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        const id = await interaction.options.getString('giveaway_id')
        const data = await Schema.findOne({ MessageID: id });
        
        if (!data) return;
        if (data.Ended === false) return interaction.followUp({ content: `A giveaway should end before rerolling another winner.`})

        const embed = new MessageEmbed()
            .setColor(`${data.Color}`)
            .setTitle(`Congratulations!`)
            .setDescription(`You have won the giveaway for ${data.Title}`)

        const winner = await Schema.aggregate(
            [ 
                { "$unwind": "$Users" }, 
                { "$sample": { "size": 1 } },
                {$project: {Users: 1, _id: 0}} 
            ]
        );
        
        const winners = winner[0].Users

        interaction.followUp({ 
            content: `${data.Reaction} | <@${winners}>`,
            embeds: [embed]
        });
    },
};