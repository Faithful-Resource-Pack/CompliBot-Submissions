require('dotenv').config(); 
const Discord = require("discord.js");
const client = new Discord.Client();

client.on("ready", () => {
	client.user.setActivity("https://faithful-dungeons.github.io/Website/", {type: "PLAYING"});
	console.log("I am turned on lmao");
});

function attachIsImage(msgAttach) {
    var url = msgAttach.url;
    //True if this url is a png image.
    return url.indexOf("png", url.length - "png".length /*or 3*/) !== -1;
}

client.on("message", message => {
  // Bot messages aren't read:
  if (message.author.bot) return;

  // This is the usual argument parsing we love to use.
  const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  // COMMANDS WITH PREFIX:
  // if there is the prefix at the begining of the message
  if (message.content.indexOf(process.env.PREFIX) === 1){
    if (command === 'ping') {
      message.channel.send('Pong!');
    }
    if (command === 'help') {
      message.channel.send('JavaScript is ~~Awesome~~');
    }
    if (command === 'behave') {
      message.channel.reply("I'm so sorry! (⌯˃̶᷄ ﹏ ˂̶᷄⌯)")
    }
  } 
  // COMMANDS WITHOUT PREFIX:
  else {
    // Submit texture feature:
    // id: 747889024068485180 -> #submit-texture (Robert's testing discord)
    if (message.channel.id === '747889024068485180') {
      // if message have a file attached:
      if (message.attachments.size > 0) {
        // run function to test url to see if file is an img
        if (message.attachments.every(attachIsImage)){

          // If message doesn't have the texture path:
          if(!message.content.includes('(')) {
            message.reply("You need to add the texture path to your texture submission, following this example: texture (file1/file2/texture.png)").then(msg => {
              msg.delete({timeout: 5000});
            });
          } else try {
            message.react('✅').then(() => {message.react('❌')});
          } catch (error) {
            console.error("ERROR | One of the emojis failed to react!");
          }

        } else {
          message.reply("Your texture submission needs to have an image file!").then(msg => {
            msg.delete({timeout: 5000});
          });
        }
      } else {
        message.reply("You need to attach a png file!").then(msg => {
          msg.delete({timeout: 5000});
        });
      }
    }
  }

  // All channel without #submit-texture
  if (message.channel.id !== '747889024068485180' ) {
    if(!message.content.includes('#4393')) {
      const exampleEmbed = new Discord.MessageEmbed()
        .setColor('#dd7735')
        .setTitle('dirt_highblockhalls.png')
        .setURL('https://raw.githubusercontent.com/Faithful-Dungeons/Resource-Pack/master/Block%20Textures/dirt_highblockhalls.png')
        .setDescription('block texture')
        .setThumbnail('https://raw.githubusercontent.com/Faithful-Dungeons/Resource-Pack/master/Block%20Textures/dirt_highblockhalls.png')
        .addFields(
          { name: 'Author:', value: 'Some guy', inline: true },
          { name: 'Resolution:', value: '32 x 32', inline: true },
      );
      message.channel.send(exampleEmbed);
    }
  }
});

client.login(process.env.CLIENT_TOKEN);