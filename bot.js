const config = require("./auth.json");
const discord = require("discord.js");
const client = new discord.Client();
const prefix = "hermes:";
const from = 'whatsapp:+14155238886';
const twilio = require('twilio')(config.twilio_sid, config.twilio_token);
const fs = require('fs');

console.log('Starting discord - twilio - whatsapp bot...')

let contacts = null,
    directory = null;

function sendDirectory(message){
    contacts = fs.readFileSync('./directory.json');
    directory = JSON.parse(contacts);

    let formattedDirectory = 'DIRECTORIO DE CONTACTOS  \n',
        msgLength = 0;
    directory.map(contact => {
        let line = `${contact.id}. ${contact.name} - ${contact.cellphone} \n`;
        msgLength += line.length;
        if(msgLength >= 2000) {
            message.channel.send(formattedDirectory);
            formattedDirectory = '';
            msgLength = 0;
        }
        formattedDirectory += line
    });
    if(msgLength > 0) {
        message.channel.send(formattedDirectory);
    }
}

client.on("message", function(message) {
    if (message.author.bot) return;

    if (!message.content.startsWith(prefix)) return;

    let command = message.content.slice(prefix.length).trim().split(' '),
        args = [...message.content.matchAll(/\'(.*?)\'/g)];

    switch (command.shift().toLowerCase()) {
        case "ayuda":
            let commands = fs.readFileSync('./coms.json');
            commands = JSON.parse(commands);

            let formattedCommands = 'LISTA DE COMANDOS  \n';
            commands.map(command => {
                formattedCommands += `${command.command} - ${command.description} \n`
            });
            message.channel.send(formattedCommands);
            break;
        case "enviar":
            if(args.length > 1) {
                let found = false;
                contacts = fs.readFileSync('./directory.json');
                directory = JSON.parse(contacts);
                directory.map(contact => {
                    if(contact.id == args[0][0].replace(/'/g,'')) {
                        found = true;

                        message.reply(`Enviando '${args[1][0].replace(/'/g,'')}' via whatsapp al número +506${contact.cellphone}`);

                        twilio.messages.create({
                            from: from,
                            body: args[1][0].replace(/'/g,''),
                            to: `whatsapp:+506${contact.cellphone}`
                        }).then(message => console.log(message));
                    }
                })

                if(!found) {
                    message.reply(`Contacto no encontrado, directorio de contactos:`);
                    sendDirectory(message);
                }

            } else {
                message.reply(`Favor indicar id y mensaje: hermes:enviar '1' 'MENSAJE'`);
            }

            break;
        case "directorio":
            sendDirectory(message);
            break;
         case "agregar":
             contacts = fs.readFileSync('./directory.json');
             directory = JSON.parse(contacts);
             if(args.length > 1)
             {
                 let newContact = {
                     "id": (directory.length + 1),
                     "name": args[0][0].replace(/'/g,''),
                     "cellphone": args[1][0].replace(/'/g,'')
                 }
                 directory.push(newContact);
                 fs.writeFileSync('./directory.json', JSON.stringify(directory));
                 sendDirectory(message);
             } else {
                 message.reply(`Favor indicar nombre y número: hermes:agregar 'CONCTACTO' '88888888'`);
             }
            break;
    }
});

client.login(config.token);

console.log('Hermes ready to work...')
