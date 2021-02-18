/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const rabbitmqSettings = {
  username: 'admin',
  password: 'admin',
  host: 'frontend.ascuy.me',
  port: 443,
  ssl: true,
  keepalive: 20,
  path: 'ws'
 }

const GALAXY_WIDTH = 800;
const GALAXY_HEIGHT = 300;

myStorage = window.sessionStorage;

let client = null;
let room = null;
let myPlayer = null;
let otherShips = [];
let isCreate = false;

function transformObject(player){

  return {
    id : player.id,
    nickname : player.nickname,
    gender : player.gender,
    team : player.team,
    starship : {
      x:player.starship.x,
      y:player.starship.y,
      angle:player.starship.angle,
      imagePath:player.starship.imagePath,
      points:player.starship.points,
      life:player.starship.life,
    },
    alive : player.alive,
  }
}

window.addEventListener('beforeunload', function (e) {
  
  if(client && myPlayer.id){
    client.publish("raichu/"+room.id+"/playerDiconnected", myPlayer.id);
    client.disconnect()
  } 

});

function erasePlayer(idPlayer){
  document.getElementById("user"+idPlayer.string).remove()
  otherShips[idPlayer.string].starship.el.remove()

  delete otherShips[idPlayer.string]
}

async function connect(options,create=false) {
  try {
    client = await RsupMQTT.connect(options);
    myPlayer.id = client.clientId;
    myPlayer.starship.id = myPlayer.id;
    client.subscribe("raichu/"+room.id+"/informNewPosition").on(addNewShip );
    client.subscribe("raichu/"+room.id+"/informPositionOld").on(getOldShips );
    client.subscribe("raichu/"+room.id+"/positions").on(changePosition);
    client.subscribe("raichu/"+room.id+"/bullets").on(getOtherBullets);
    client.subscribe("raichu/"+room.id+"/playerDiconnected").on(erasePlayer);

    client.publish("raichu/"+room.id+"/informNewPosition", transformObject(myPlayer));
  
    if(create){
      setTimeout( () => {
        if(isCreate){
          paintUser(myPlayer,true);
          changeToGame();
          myPlayer.starship.play();
          addKeyEvent(myPlayer);
          document.getElementById("join_button").disabled = false;
        }else{
          let errorMessage = document.getElementById("wrong-code");
          errorMessage.style.display = "none";
          errorMessage.style.display = "block";
          document.getElementById("join_button").disabled = false;
          
          myStorage.setItem('myPlayer',JSON.stringify(transformObject(myPlayer)));
          myStorage.setItem('room',room.id);

        }
      }, 1000 );
    }
    else{
      paintUser(myPlayer,true);
      changeToGame();
      myPlayer.starship.play();
      addKeyEvent(myPlayer);
      
      myStorage.setItem('myPlayer',JSON.stringify(transformObject(myPlayer)));
      myStorage.setItem('room',room.id);
    }     
    
  } catch (error) {
    console.log(error);
  }
}

function getOldShips(dataIn){
  var data = JSON.parse(dataIn.string);
  if(myPlayer.id===data.newShip){
    paintOtherShip(data.myPlayer);
    paintUser(data.myPlayer);
    isCreate=true;
  }
  
}

function addNewShip(dataIn){
  var data = JSON.parse(dataIn.string);
  if(myPlayer.id !== data.id){
    paintOtherShip(data);
    paintUser(data);
    client.publish("raichu/"+room.id+"/informPositionOld",{newShip:data.id, myPlayer:transformObject(myPlayer)});
  }
  
}


function paintUser(data,myUser=false){

  const klingon = document.getElementById(data.team);

  const divUser = document.createElement("div");
  divUser.className = "user";
  divUser.id = "user"+data.id;
  if(myUser){
    divUser.style.border = "3px solid white";
    divUser.style.borderRadius = "10px";
  }
  
  const img = document.createElement("img");
  img.src = "./assets/user/"+data.gender+".svg";
  img.className = "userIcon";
  
  const divData = document.createElement("div");
  
  const nickname = document.createElement("h4");
  nickname.textContent = "Nickname:"+data.nickname;

  const lifes = document.createElement("h4");
  lifes.textContent = "lifes:"+data.starship.life;
  lifes.id = data.id;

  const points = document.createElement("h4");
  points.textContent = "points:"+data.starship.points;
  points.id = data.id+"points";


  divData.appendChild(nickname);
  divData.appendChild(lifes);
  divData.appendChild(points);
  divUser.appendChild(img);
  divUser.appendChild(divData);
  klingon.appendChild(divUser);

}

function changePosition(dataIn){
  
  var data = JSON.parse(dataIn.string);
  
  if( otherShips[data.starshipId] !== undefined && otherShips[data.starshipId] !== null){
    otherShips[data.starshipId].starship.setPosition(data.x, data.y);
    otherShips[data.starshipId].starship.setAngle(data.angle);
  }
}

function getOtherBullets(dataIn){
  
  var data = JSON.parse(dataIn.string);

  if( otherShips[data.starshipId] !== undefined && otherShips[data.starshipId] !== null){
    otherShips[data.starshipId].starship.fireLaser(data.starshipId,moveLaser);
  }
}


async function createRoom(){

  let team = document.getElementById("input_team").value;
  let nickname = document.getElementById("input_nickname");
  let gender = document.getElementById("input_gender").value;
  let ship = document.getElementById("input_starship").value;
  
  
  if(nickname.value.length===0){
    nickname.style.borderColor = "red";
  }
  else{
    myPlayer = new Player(null,nickname.value, gender, null, team);
    room = new Room();
    let starship = Starship.create(galaxy, "./assets/spaceship/"+ship+".png", "small batship", randomXPosition(), randomYPosition(), 90);
    myPlayer.setStartship(starship);
    
    connect(rabbitmqSettings);
    nickname.style.borderColor = "white";
  }
  

}

async function joinForm() {

  document.getElementById("join_button").disabled = true;

  let idRoom = document.getElementById("input_gamecode");
  let team = document.getElementById("input_team_join").value;
  let nickname = document.getElementById("input_nickname_join");
  let gender = document.getElementById("input_gender_join").value;
  let ship = document.getElementById("input_starship_join").value;
  
  if(nickname.value.length===0){
    nickname.style.borderColor = "red";
  }
  else nickname.style.borderColor = "white";

  if(idRoom.value.length===0){
    
    idRoom.style.borderColor = "red";
  }
  else idRoom.style.borderColor = "white";


  if(idRoom.value.length!==0 && nickname.value.length!==0){
    myPlayer = new Player(null, nickname.value, gender, null, team);
    room = new Room();
    room.id = idRoom.value;
    let starship = Starship.create( galaxy, "./assets/spaceship/"+ship+".png", "small batship", randomXPosition(), randomYPosition(), 90);
    myPlayer.setStartship(starship);
    myPlayer.starship.id = myPlayer.id;

    connect(rabbitmqSettings,true);
 
  }
    
}

function changeToGame(){
  var form = document.getElementById("menu");
  form.style.display = "none";

  var idRoom =  document.getElementById("id_room");

  var newtitleRoom =  document.getElementById("title-cd");
  var newIdRoom =  document.getElementById("number-cd");


  idRoom.textContent = " Id Room:  " + room.id;
  newIdRoom.textContent = room.id;
  //idRoom.style.display = "block";
  newIdRoom.style.display = "block";
  newtitleRoom.style.display = "block";

  var game = document.getElementById("galaxy");
  game.style.display = "block";

  var player = document.getElementById("players");
  player.style.display = "block";
  
}


function showForm(form){

  var divButton = document.getElementById("initScreen");
  var formCreate = document.getElementById("form-create");
  var formJoin = document.getElementById("form-join");
  if(form === 1){

    divButton.style.display = "none";
    formCreate.style.display = "block";
  
  }else if(form === 2){
    
    let errorMessage = document.getElementById("wrong-code");
    errorMessage.style.display = "none";

    divButton.style.display = "none";
    formJoin.style.display = "block";
  }else if(form === 3){

    divButton.style.display = "block";
    formCreate.style.display = "none";
    formJoin.style.display = "none";
  }
  
}

function paintOtherShip(player){

  let galaxy = document.getElementById("galaxy");
  let ship = Starship.create( galaxy, player.starship.imagePath, "small batship" , player.starship.x, player.starship.y, player.starship.angle);
  let playerObject = new Player(player.id,player.nickname, player.gender, ship, player.team);
  otherShips[player.id] = playerObject;
  otherShips[player.id].starship.play();     

}

function modifyLifes(player,me=false){
  
  document.getElementById(player.id).innerHTML = "Lifes:" + player.starship.life;

  if(player.starship.life===0){
    player.starship.el.remove()
    const userDiv = document.getElementById('user'+player.id)
    userDiv.style.border = "3px solid red"
    userDiv.style.borderRadius = "10px"
    player.alive=false

    if(detectLosers(player.team)){
      //const showMessage = document.getElementById("message")
      //showMessage.style.display = "block"
      let modal = document.getElementById("modal");
      modal.style.display = "block";
    }    
  }
}

function modifyPoints(player){
  document.getElementById(player.id+"points").innerHTML = "Points:" + player.starship.points;
}


function playerShooted(id,x,y,laser,laserInterval){
  
  Object.keys(otherShips).forEach(ship => {
    if(!otherShips[ship].alive)return;

    if(detectCollision(x,y,otherShips[ship].starship.x,otherShips[ship].starship.y)) {
      if(otherShips[id] !== undefined){
        if(otherShips[ship].team !== otherShips[id].team){
          otherShips[ship].starship.getShoot();
          otherShips[id].starship.addPoints();
          clearInterval(laserInterval);
          laser.remove();
          modifyLifes(otherShips[ship]);
          modifyPoints(otherShips[id]);
        }
      }else{
        if(otherShips[ship].team !== myPlayer.team){
          otherShips[ship].starship.getShoot();
          myPlayer.starship.addPoints();
          clearInterval(laserInterval)
          laser.remove()
          modifyLifes(otherShips[ship]);
          modifyPoints(myPlayer);
        }
      }

    }
  });

  if(!myPlayer.alive)return ;

  if(detectCollision(x,y, myPlayer.starship.x,myPlayer.starship.y)){
    
    if(myPlayer.team !== otherShips[id].team){
      myPlayer.starship.getShoot()
      otherShips[id].starship.addPoints();
      clearInterval(laserInterval)
      laser.remove();
      modifyLifes(myPlayer,true)
      modifyPoints(otherShips[id]);
    }


  } 
}

function detectLosers(team){

  var loser = true

  Object.keys(otherShips).forEach(ship => {
    
    if( otherShips[ship].team === team && otherShips[ship].alive === true ) {
      loser = false
      return loser
    }
  });

  return loser
}


function detectCollision(x1,y1,x2,y2){

  let distance = Math.hypot(Math.abs(x1-x2),Math.abs(y1-y2));

  if(distance<25) return true;
  else return false;
}


function moveLaser(id, laser, angle, width, height) {
  let timeLifeLaser = 0;
  let laserInterval = setInterval(() => {
    let xPosition = parseInt(laser.style.left);
    let yPosition = parseInt(laser.style.top);

    if ( ( xPosition >= width || xPosition <= 0 ) || ( yPosition >= height || yPosition <= 0 ) || (angle === 0 || angle === 180) ) {
      laser.remove();
      clearInterval(laserInterval);
    }else {
      const x = Math.sin(angle / 360.0 * 2 * Math.PI) * 15;
      const y = Math.cos(angle / 360.0 * 2 * Math.PI) * 15;
      laser.style.left = `${xPosition + x}px`;
      laser.style.top = `${yPosition - y}px`;

      if(timeLifeLaser > 150){
        playerShooted(id, xPosition + x,yPosition - y, laser, laserInterval)
      }

      timeLifeLaser += 50;
    }
  }, 50);
}

function randomXPosition(){
  return Math.floor(Math.random() * GALAXY_WIDTH);
}
function randomYPosition(){
  return Math.floor(Math.random() * GALAXY_HEIGHT);
}
