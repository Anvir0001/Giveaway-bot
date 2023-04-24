const client = require("../index");
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const gSchema = require('../models/giveaway');
const ms = require('ms');

client.on("ready", async () => {
    console.log(`${client.user.tag} is up and ready to go!`)

    // setInterval to check giveaway time 
    setInterval(async () => {
        gSchema.find({ Ended: false }).then((data) => {
            if (!data && !data.length) return;
            
            data.forEach(async (value) => {
            if (value.Ended === true) return;    
            const msg = value.MessageID;  
            var time = value.Time; 
            var date = value.Date;
            const ch = value.Channel;
            const reaction = value.Reaction;
            const winCount = value.Winners;
            const channel = client.channels.cache.get(ch)
            const gw = await channel.messages.fetch(msg, { force: true } );
            const host = client.guilds.cache.get(value.Guild).members.cache.get(value.Host);
            var res = date.getTime(); 
            const destruct = time;     
                
                // check if giveaway time is over
                if (Date.now() - destruct > res) {
                        
                        // randomly pick a user id from array
                        const winner = await gSchema.aggregate(
                            [ 
                                { "$unwind": "$Users" }, 
                                { "$sample": { "size": 1 } },
                                {$project: {Users: 1, _id: 0}} 
                            ]
                        )
                        const winners = winner[0].Users
                    
                    const edEmbed = new MessageEmbed()
                        .setColor(`${value.Color}`)
                        .setTitle(`${value.Title}`)
                        .setDescription(`${reaction} Winner(s): <@${winners}>\nGiveaway ended!`)
                        .setFooter({text: `Winner(s): ${winCount} | Hosted By: ${host.user.username}`})
    
                    const embed = new MessageEmbed()
                        .setColor(`${value.Color}`)
                        .setTitle(`Congratulations!`)
                        .setDescription(`You have won the giveaway for ${value.Title}`)
    
                    let count = await gSchema.aggregate([
                            {
                                $match : { MessageID : msg } 
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
                        await channel.send({ embeds: [embed], content: `${reaction} | <@${winners}>`})
                        await gSchema.findOneAndUpdate(
                            { 
                                MessageID: msg
                            }, 
                            { 
                                Ended: true
                            },    
                            { 
                                new: true 
                            },
                        );
                }
        })
    });
    }, ms("10 seconds")) 
});
