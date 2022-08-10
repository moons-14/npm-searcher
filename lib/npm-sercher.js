const { InteractionResponseType, 
    InteractionType,
    verifyKeyMiddleware,
    MessageComponentTypes,
    MessageComponent,
    Button,
    ButtonStyleTypes,
    StringSelect,
    StringSelectOption,
    InputText,
    TextStyleTypes } = require("discord-interactions")
const express = require("@runkit/runkit/express-endpoint/1.0.0");
const app = express(exports);
const escape=require("discord-escape")

const {searchPackages,getPackageManifest }=require("query-registry");
app.post("/interactions",verifyKeyMiddleware(process.env.NPM_SEARCHER_CLIENT_PUBLIC_KEY), async (req, res) => {
    const interaction = req.body;
  if(interaction && interaction.type === InteractionType.APPLICATION_COMMAND) {
    const command = interaction.data.name;
    switch (command) {
      case "search":
        const search_name = interaction.data.options.find(
          (option) => option.name === "name"
        ).value;
        const data = await searchPackages({ query: { text:search_name, size:4 }});
        console.log(data.total)
        const fields_res=[];
        data.objects.map((package_obj)=>{
            fields_res.push({
                title:escape(package_obj.package.name),
                type:"rich",
                description:package_obj.package.description?escape(package_obj.package.description):"",
                timestamp:new Date(package_obj.package.date).toISOString(),
               color:package_obj.score.detail.quality>0.8?"1675519":package_obj.score.detail.quality>0.5?"7012121":package_obj.score.detail.quality>0.3?"16514852":"13369344",
                footer:{
                    text:escape(package_obj.package.publisher.username)
                },
                fields:[{
                    name:"Version",
                    value:escape(package_obj.package.version),
                    inline:true
                },
                {
                    name:"More info",
                    value: "[View on npmjs.com]("+"https://www.npmjs.com/package/"+escape(package_obj.package.name)+")\nor\n ```/package name:"+escape(package_obj.package.name)+"```",
                    inline:true
                }]
            });
        });
        var command_response = {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content:escape(search_name),
            embeds: fields_res,
            components: [
                {
                    type: MessageComponentTypes.ACTION_ROW ,
                    components: [
                        {
                            type: MessageComponentTypes.BUTTON ,
                            label:"<",
                            style: 3,
                            custom_id: "backward",
                            disabled:true
                        },
                        {
                            type: MessageComponentTypes.BUTTON,
                            label:"1/"+Math.ceil(data.total/4),
                            style: 5,
                            url: "https://www.npmjs.com/search?q="+encodeURIComponent(search_name)
                        },
                        {
                            type: MessageComponentTypes.BUTTON,
                            label:">",
                            style: 3,
                            custom_id: "forward 4",
                            disabled:(data.total<4)
                        }
                    ]
                }
            ]
          },
        };
        return res.send(command_response);
      case "package":
          const package_name = interaction.data.options.find(
              (option) => option.name === "name"
            ).value;
        try{
        const manifest = await getPackageManifest({ name: package_name });
            var command_response = {
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: escape("Details of"+manifest.name),
                embeds: [{
                title:manifest.name?escape(manifest.name):"",
                type:"rich",
                description:manifest.description?escape(manifest.description):"",
                timestamp:new Date().toISOString(),
                color:"13369344",
                footer:{
                    text:escape(manifest.publisher.name)
                },
                fields:[{
                    name:"Version",
                    value:escape(manifest.version),
                    inline:true
                },
                {
                    name:"License",
                    value:manifest.license?escape(manifest.license):"No license",
                    inline:true
                },
                {
                    name:"Keywords",
                    value:(manifest.keywords&&manifest.keywords.join(','))?manifest.keywords.join(','):"No keywords",
                    inline:true
                },
                {
                    name:"More info",
                    value: "[View on npmjs.com]("+"https://www.npmjs.com/package/"+escape(manifest.name)+")\nor\n ```/package name:"+escape(manifest.name)+"```",
                    inline:true
                }]
                }],
                components: [
                {
                    type: MessageComponentTypes.ACTION_ROW ,
                    components: [
                        {
                            type: MessageComponentTypes.BUTTON,
                            label:"npmjs.com",
                            style: 5,
                            url: "https://www.npmjs.com/package/"+encodeURIComponent(package_name)
                        }
                    ]
                }
            ]
              },
            };
            return res.send(command_response);
        }catch(error) {
            var command_response = {
                  type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                  data: {
                    content: "unknown npm package",
                  },
                };
            console.log(error)
            return res.send(command_response);
        }
      default:
        var command_response = {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "unknown command",
          },
        };
        return res.send(command_response);
    }
  }else if(interaction && interaction.type === InteractionType.MESSAGE_COMPONENT){
    const custom_id = interaction.data.custom_id;
    console.log(custom_id)
    if (custom_id.match(/^forward\s([0-9]{1,})$/)){
        const next_from = custom_id.replace(/^forward\s([0-9]{1,})$/,"$1");
        console.log("forward" + next_from);
        const search_name = interaction.message.content;
        const data = await searchPackages({ query: { text:search_name, size:4 ,from:next_from}});
        const fields_res=[];
        data.objects.map((package_obj)=>{
            fields_res.push({
                title:escape(package_obj.package.name),
                type:"rich",
                description:package_obj.package.description?escape(package_obj.package.description):"",
                timestamp:new Date(package_obj.package.date).toISOString(),
               color:package_obj.score.detail.quality>0.8?"1675519":package_obj.score.detail.quality>0.5?"7012121":package_obj.score.detail.quality>0.3?"16514852":"13369344",
                footer:{
                    text:escape(package_obj.package.publisher.username)
                },
                fields:[{
                    name:"Version",
                    value:escape(package_obj.package.version),
                    inline:true
                },
                {
                    name:"More info",
                    value: "[View on npmjs.com]("+"https://www.npmjs.com/package/"+escape(package_obj.package.name)+")\nor\n ```/package name:"+escape(package_obj.package.name)+"```",
                    inline:true
                }]
            });
        });
        var command_response = {
          type: InteractionResponseType.UPDATE_MESSAGE,
          data: {
            content:escape(search_name),
            embeds: fields_res,
            components: [
                {
                    type: MessageComponentTypes.ACTION_ROW ,
                    components: [
                        {
                            type: MessageComponentTypes.BUTTON ,
                            label:"<",
                            style: 3,
                            custom_id: "backward "+(Number(next_from)-4),
                            disabled:(0>=Number(next_from))
                        },
                        {
                            type: MessageComponentTypes.BUTTON,
                            label:(Math.ceil(next_from/4)+1)+"/"+Math.ceil(data.total/4),
                            style: 5,
                            url: "https://www.npmjs.com/search?q="+encodeURIComponent(search_name)
                        },
                        {
                            type: MessageComponentTypes.BUTTON,
                            label:">",
                            style: 3,
                            custom_id: "forward "+(Number(next_from)+4),
                            disabled:(data.total<(Number(next_from)+4))
                        }
                    ]
                }
            ]
          },
        };
        return res.send(command_response);
    } 
    if(custom_id.match(/^backward\s([0-9]{1,})$/)){
        const next_from = custom_id.replace(/^backward\s([0-9]{1,})$/,"$1");
        console.log("backward"+next_from);
        const search_name = interaction.message.content;
        const data = await searchPackages({ query: { text:search_name, size:4 ,from:next_from}});
        const fields_res=[];
        data.objects.map((package_obj)=>{
            fields_res.push({
                title:escape(package_obj.package.name),
                type:"rich",
                description:package_obj.package.description?escape(package_obj.package.description):"",
                timestamp:new Date(package_obj.package.date).toISOString(),
               color:package_obj.score.detail.quality>0.8?"1675519":package_obj.score.detail.quality>0.5?"7012121":package_obj.score.detail.quality>0.3?"16514852":"13369344",
                footer:{
                    text:escape(package_obj.package.publisher.username)
                },
                fields:[{
                    name:"Version",
                    value:escape(package_obj.package.version),
                    inline:true
                },
                {
                    name:"More info",
                    value: "[View on npmjs.com]("+"https://www.npmjs.com/package/"+escape(package_obj.package.name)+")\nor\n ```/package name:"+escape(package_obj.package.name)+"```",
                    inline:true
                }]
            });
        });
        var command_response = {
          type: InteractionResponseType.UPDATE_MESSAGE,
          data: {
            content:escape(search_name),
            embeds: fields_res,
            components: [
                {
                    type: MessageComponentTypes.ACTION_ROW ,
                    components: [
                        {
                            type: MessageComponentTypes.BUTTON ,
                            label:"<",
                            style: 3,
                            custom_id: "backward "+ (Number(next_from)-4),
                            disabled:(0>=Number(next_from))
                        },
                        {
                            type: MessageComponentTypes.BUTTON,
                            label:(Math.ceil(next_from/4)+1)+"/"+Math.ceil(data.total/4),
                            style: 5,
                            url: "https://www.npmjs.com/search?q="+encodeURIComponent(search_name)
                        },
                        {
                            type: MessageComponentTypes.BUTTON,
                            label:">",
                            style: 3,
                            custom_id: "forward "+(Number(next_from)+4),
                            disabled:(data.total<(Number(next_from)+4))
                        }
                    ]
                }
            ]
          },
        };
        return res.send(command_response);
    }
  } else {
    res.send({
      type: InteractionResponseType.PONG,
    });
  }

});;