'use strict';
const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');
const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');
//创建http服务器
const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));
//创建wss服务器
const wss = new SocketServer({ server });
wss.on('connection', (ws) => {
	console.log('Client connected');
	console.log(wss.clients.size+' clients online');
	ws.on('message', (e) => {												
		var msg;
		console.log('Message recieved : '+e);
		try{
			msg=JSON.parse(e.toString());
			if(msg.action=='setID'){
				//玩家更改id
				ws.id=msg.data;
				console.log('Client changed its id to '+msg.data);
			}else if(msg.action=='player.getInfo'){
				//玩家请求其他在线玩家
				var client;
				for(client of wss.clients){
					//ws.id是请求者id
					if(client.id!=ws.id){
						client.send('{"action":"player.getInfo","data":'+ws.id+'}');
					}
				}
			}else if(msg.action=='player.myInfo'){
				//玩家信息转发 msg.id是请求者 ws.id是被请求者
				var client;
				for(client of wss.clients){
					if(client.id==msg.id){
						//双方互相添加
						client.send('{"action":"player.new","id":'+ws.id+',"data":['+msg.data+']}');
						ws.send('{"action":"player.new","id":'+msg.id+',"data":[100,100]}');
						break;
					}
				}
			}else if(msg.action=='player.setTarget'){
				//发给其他在线玩家
				var client;
				for(client of wss.clients){
					if(client.id!=ws.id){
						client.send('{"action":"player.setTarget","id":'+ws.id+',"data":['+msg.data+']}');
					}
				}
			}
		}catch(error){
			console.log(error);
		}
		//console.log(e.toString());
	});
  
  ws.on('close',function(){
	  var client;
	  for(client of wss.clients){
			if(client.id!=ws.id){
				client.send('{"action":"player.leave","id":'+ws.id+'}');
			}
	  }
	  console.log('Client '+ws.id+' disconnected')
  });
});
