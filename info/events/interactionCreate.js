const client = require("../index");
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const Schema = require('../models/giveaway');

client.on("interactionCreate", async (interaction) => {
    // Slash Command Handling
    if (interaction.isCommand()) {
        await interaction.deferReply({ ephemeral: false }).catch(() => {});

        const cmd = client.slashCommands.get(interaction.commandName);
        if (!cmd)
            return interaction.followUp({ content: "An error has occured " });

        const args = [];

        for (let option of interaction.options.data) {
            if (option.type === "SUB_COMMAND") {
                if (option.name) args.push(option.name);
                option.options?.forEach((x) => {
                    if (x.value) args.push(x.value);
                });
            } else if (option.value) args.push(option.value);
        }
        interaction.member = interaction.guild.members.cache.get(interaction.user.id);

        if (!interaction.member.permissions.has(cmd.userPermissions || [])) return interaction.followUp({content: 'You need permissions to run this command'})
        if (!interaction.guild.me.permissions.has(cmd.botPermissions || [])) return interaction.followUp({content: `I need permissions to run this command: [${cmd.botPermissions}]`})

        cmd.run(client, interaction, args);
    }

    // Context Menu Handling
    if (interaction.isContextMenu()) {
        await interaction.deferReply({ ephemeral: false });
        const command = client.slashCommands.get(interaction.commandName);
        if (command) command.run(client, interaction);
    }

    // Giveaway Buttons Handling 
    if (!interaction.isButton()) return;
    if (interaction.customId !== 'entry') return;
    await interaction.deferReply({ ephemeral: true }).catch(() => {});
    const data = await Schema.findOne({ MessageID: interaction.message.id });
        if (!data) return;
        const time = data.Time
    
        if (interaction.customId === 'entry') {
            const userData = await Schema.findOne({ MessageID: interaction.message.id, Users: {"$in": [interaction.user.id]} }); 
            if (userData) {
                await interaction.followUp({ content: `You already joined this giveaway!`, ephemeral: true })
            } else {
               const clicker = await Schema.findOneAndUpdate(
                    { 
                        MessageID: interaction.message.id 
                    }, 
                    { 
                        $addToSet: { Users: [`${interaction.user.id}`] } 
                    },    
                    { 
                        new: true 
                    },
                );

                let count = await Schema.aggregate([
                    {
                        $match : { MessageID : interaction.message.id } 
                    },
                    {
                        $project: {
                           item: 1,
                           numberOfColors: { $cond: { if: { $isArray: "$Users" }, then: { $size: "$Users" }, else: "0"} }
                        }
                    }
                ]);
                
                const data = await Schema.findOne({ MessageID: interaction.message.id })
                const gw = await client.channels.cache.get(data.Channel).messages.fetch(interaction.message.id, { force: true } );
                const row = new MessageActionRow()
                row.addComponents(new MessageButton().setCustomId(`entry`).setLabel(`Join Giveaway`).setEmoji(`${data.Reaction}`).setStyle(`${data.Bcolor}`))
                row.addComponents(new MessageButton().setCustomId(`size`).setLabel(`${count[0].numberOfColors} Entries`).setStyle(`${data.Bcolor}`).setDisabled(true))
                
                try {
                    await gw.edit({ components: [row] })
                } catch (err) {
                    console.log(err)
                }
                await interaction.followUp({ content: `You successfully joined this giveaway`, ephemeral: true })
            } 
        }
});
