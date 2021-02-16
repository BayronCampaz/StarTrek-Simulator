/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const rabbitmqSettings = {
  username: 'admin',
  password: 'admin',
  host: 'frontend.ascuy.me',
  port: 15675,
  keepalive: 20,
  path: 'ws',
};

let client = null;
let room = null;
let myPlayer = null;
const otherShips = [];
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
      imagePath:player.starship.imagePath
    },
    alive : player.alive,
  }
}


function paintUser(data, myUser = false) {
  const klingon = document.getElementById(data.team);

  const divUser = document.createElement('div');
  divUser.className = 'user';
  divUser.id = `user${data.id}`;
  if (myUser) {
    divUser.style.border = '3px solid white';
    divUser.style.borderRadius = '10px';
  }

  const img = document.createElement('img');
  img.src = `./assets/user/${data.gender}.svg`;
  img.className = 'userIcon';

  const divData = document.createElement('div');

  const nickname = document.createElement('h4');
  nickname.textContent = `Nickname:${data.nickname}`;

  const lifes = document.createElement('h4');
  lifes.textContent = `lifes:${data.starship.life}`;
  lifes.id = data.id;

  divData.appendChild(nickname);
  divData.appendChild(lifes);
  divUser.appendChild(img);
  divUser.appendChild(divData);
  klingon.appendChild(divUser);
}

function paintOtherShip(player) {
  const galaxy = document.getElementById('galaxy');
  const ship = Starship.create(galaxy, player.starship.imagePath, 'small batship', player.starship.x, player.starship.y, player.starship.angle);
  const playerObject = new Player(player.id, player.nickname, player.gender, ship, player.team);
  otherShips[player.id] = playerObject;
  otherShips[player.id].starship.play();
}

function getOldShips(dataIn) {
  const data = JSON.parse(dataIn.string);
  if (myPlayer.id === data.newShip) {
    paintOtherShip(data.myPlayer);
    paintUser(data.myPlayer);
    isCreate = true;
  }
}

function addNewShip(dataIn) {
  const data = JSON.parse(dataIn.string);
  if (myPlayer.id !== data.id) {
    paintOtherShip(data);
    paintUser(data);
    client.publish(`raichu/${room.id}/informPositionOld`, { newShip: data.id, myPlayer:transformObject(myPlayer) });
  }
}

function changeToGame() {
  const form = document.getElementById('menu');
  form.style.display = 'none';

  const idRoom = document.getElementById('id_room');
  idRoom.textContent = ` Id Room:  ${room.id}`;
  idRoom.style.display = 'block';

  const game = document.getElementById('galaxy');
  game.style.display = 'block';

  const player = document.getElementById('players');
  player.style.display = 'inline-flex';
}

function changePosition(dataIn) {
  const data = JSON.parse(dataIn.string);

  if (otherShips[data.starshipId] !== undefined && otherShips[data.starshipId] !== null) {
    otherShips[data.starshipId].starship.setPosition(data.x, data.y);
    otherShips[data.starshipId].starship.setAngle(data.angle);
  }
}

function modifyLifes(player, me = false) {
  document.getElementById(player.id).innerHTML = `Lifes:${player.starship.life}`;

  if (player.starship.life === 0) {
    player.starship.el.remove();
    const userDiv = document.getElementById(`user${player.id}`);
    userDiv.style.border = '3px solid red';
    userDiv.style.borderRadius = '10px';
    player.setAlive(false);
  }
}

function detectCollision(x1, y1, x2, y2) {
  const distance = Math.hypot(Math.abs(x1 - x2), Math.abs(y1 - y2));

  if (distance < 25) return true;
  return false;
}

function playerShooted(x, y, laser, laserInterval) {
  Object.keys(otherShips).forEach((ship) => {
    if (!otherShips[ship].alive) return;

    if (detectCollision(x, y, otherShips[ship].starship.x, otherShips[ship].starship.y)) {
      otherShips[ship].starship.getShoot();
      clearInterval(laserInterval);
      laser.remove();
      modifyLifes(otherShips[ship]);
    }
  });

  if (!myPlayer.alive) return;

  if (detectCollision(x, y, myPlayer.starship.x, myPlayer.starship.y)) {
    myPlayer.starship.getShoot();
    clearInterval(laserInterval);
    laser.remove();
    modifyLifes(myPlayer, true);
  }
}

function moveLaser(laser, angle, width, height) {
  let timeLifeLaser = 0;
  const laserInterval = setInterval(() => {
    const xPosition = parseInt(laser.style.left, 10);
    const yPosition = parseInt(laser.style.top, 10);

    if ((xPosition >= width || xPosition <= 0)
    || (yPosition >= height || yPosition <= 0)
    || (angle === 0 || angle === 180)) {
      laser.remove();
      clearInterval(laserInterval);
    } else {
      const x = Math.sin((angle / 360.0) * 2 * Math.PI) * 15;
      const y = Math.cos((angle / 360.0) * 2 * Math.PI) * 15;
      // eslint-disable-next-line no-param-reassign
      laser.style.left = `${xPosition + x}px`;
      // eslint-disable-next-line no-param-reassign
      laser.style.top = `${yPosition - y}px`;

      if (timeLifeLaser > 150) {
        playerShooted(xPosition + x, yPosition - y, laser, laserInterval);
      }

      timeLifeLaser += 50;
    }
  }, 50);
}

function getOtherBullets(dataIn) {
  const data = JSON.parse(dataIn.string);

  if (otherShips[data.starshipId] !== undefined && otherShips[data.starshipId] !== null) {
    otherShips[data.starshipId].starship.fireLaser(moveLaser);
  }
}

async function connect(options, create = false) {
  try {
    client = await RsupMQTT.connect(options);
    myPlayer.id = client.clientId;
    myPlayer.starship.id = myPlayer.id;
    client.subscribe(`raichu/${room.id}/informNewPosition`).on(addNewShip);
    client.subscribe(`raichu/${room.id}/informPositionOld`).on(getOldShips);
    client.subscribe(`raichu/${room.id}/positions`).on(changePosition);
    client.subscribe(`raichu/${room.id}/bullets`).on(getOtherBullets);

    client.publish(`raichu/${room.id}/informNewPosition`, transformObject(myPlayer));

    if (create) {
      setTimeout(() => {
        if (isCreate) {
          paintUser(myPlayer, true);
          changeToGame();
          myPlayer.starship.play();
          addKeyEvent(myPlayer);
        } else {
          const errorMessage = document.getElementById('wrong-code');
          errorMessage.style.display = 'none';
          errorMessage.style.display = 'block';
        }
      }, 1000);
    } else {
      paintUser(myPlayer, true);
      changeToGame();
      myPlayer.starship.play();
      addKeyEvent(myPlayer);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
  }
}

async function createRoom() {
  const team = document.getElementById('input_team').value;
  const nickname = document.getElementById('input_nickname');
  const gender = document.getElementById('input_gender').value;
  const ship = document.getElementById('input_starship').value;

  if (nickname.value.length === 0) {
    nickname.style.borderColor = 'red';
  } else {
    myPlayer = new Player(null, nickname.value, gender, null, team);
    room = new Room();
    const starship = Starship.create(galaxy, `./assets/spaceship/${ship}.png`, 'small batship', 5, 5, 90);
    myPlayer.setStartship(starship);

    connect(rabbitmqSettings);
    nickname.style.borderColor = 'white';
  }
}

async function joinForm() {
  const idRoom = document.getElementById('input_gamecode');
  const team = document.getElementById('input_team_join').value;
  const nickname = document.getElementById('input_nickname_join');
  const gender = document.getElementById('input_gender_join').value;
  const ship = document.getElementById('input_starship_join').value;

  if (nickname.value.length === 0) {
    nickname.style.borderColor = 'red';
  } else nickname.style.borderColor = 'white';

  if (idRoom.value.length === 0) {
    idRoom.style.borderColor = 'red';
  } else idRoom.style.borderColor = 'white';

  if (idRoom.value.length !== 0 && nickname.value.length !== 0) {
    myPlayer = new Player(null, nickname.value, gender, null, team);
    room = new Room();
    room.id = idRoom.value;
    const starship = Starship.create(galaxy, `./assets/spaceship/${ship}.png`, 'small batship', 5, 5, 90);
    myPlayer.setStartship(starship);
    myPlayer.starship.id = myPlayer.id;

    connect(rabbitmqSettings, true);
  }
}

function showForm(form) {
  const divButton = document.getElementById('initScreen');
  const formCreate = document.getElementById('form-create');
  const formJoin = document.getElementById('form-join');
  if (form === 1) {
    divButton.style.display = 'none';
    formCreate.style.display = 'block';
  } else if (form === 2) {
    const errorMessage = document.getElementById('wrong-code');
    errorMessage.style.display = 'none';

    divButton.style.display = 'none';
    formJoin.style.display = 'block';
  } else if (form === 3) {
    divButton.style.display = 'block';
    formCreate.style.display = 'none';
    formJoin.style.display = 'none';
  }
}
