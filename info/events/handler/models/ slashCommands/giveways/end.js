const { Client, CommandInteraction } = require("discord.js");
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const Schema = require('../../models/giveaway');

module.exports = {
    name: "end",
    description: "end an existing giveaway",
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
        if (data.Ended === true) return interaction.followUp({ content: `Giveaway \`${id}\` has already ended.`})

        const winCount = data.Winners;

        const winner = await Schema.aggregate(
            [ 
                { "$unwind": "$Users" }, 
                { "$sample": { "size": 1 } },
                {$project: {Users: 1, _id: 0}} 
            ]
        );
        
        const winners = winner[0].Users
        const gw = await client.channels.cache.get(data.Channel).messages.fetch(id, { force: true } );
        const host = client.guilds.cache.get(data.Guild).members.cache.get(data.Host);

        const edEmbed = new MessageEmbed()
            .setColor(`${data.Color}`)
            .setTitle(`${data.Title}`)
            .setDescription(`${data.Reaction} Winner(s): <@${winners}>\nGiveaway ended!`)
            .setFooter({text: `Winner(s): 1 | Hosted By: ${host.user.username}`})
    
        const embed = new MessageEmbed()
            .setColor(`${data.Color}`)
            .setTitle(`Congratulations!`)
            .setDescription(`You have won the giveaway for ${data.Title}`)

            let count = await Schema.aggregate([
                {
                    $match : { MessageID : id } 
                },
                {
                    $project: {
                       item: 1,
                       numberOfColors: { $cond: { if: { $isArray: "$Users" }, then: { $size: "$Users" }, else: "0"} }
                    }
                }
            ])
        
        const row = new MessageActionRow()
            row.addComponents(new MessageButton().setCustomId(`size`).setLabel(`${count[0].numberOfColors} Entries`).setStyle(`SECONDARY`).setDisabled(true))

        try {
            await gw.edit({ embeds: [edEmbed], components: [row] })
        } catch (err) {
            console.log(err)
        }
        interaction.followUp({ content: `Giveaway \`${id}\` has ended now.`})

            await client.channels.cache.get(data.Channel).send({ embeds: [embed], content: `${data.Reaction} | <@${winners}>`})
            await Schema.findOneAndUpdate(
                { 
                    MessageID: id 
                }, 
                { 
                    Ended: true
                },    
                { 
                    new: true 
                },
            );
    },
};
