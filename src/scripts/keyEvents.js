/* eslint-disable no-undef */
// eslint-disable-next-line no-unused-vars
function addKeyEvent(player) {
  const up = ['w', 'ArrowUp'];
  const down = ['s', 'ArrowDown'];
  const left = ['a', 'ArrowLeft'];
  const right = ['d', 'ArrowRight'];
  const shoot = ['Enter'];
  const go = [...up, ...down];
  const direction = [...left, ...right];
  const stop = [' ', 'c', 'x'];

  document.body.addEventListener('keydown', (e) => {
    if (player.alive) {
      if (up.indexOf(e.key) >= 0) player.starship.setState(1, player.starship.state.direction);
      if (down.indexOf(e.key) >= 0) player.starship.setState(-1, player.starship.state.direction);
      if (left.indexOf(e.key) >= 0) player.starship.setState(player.starship.state.go, -1);
      if (right.indexOf(e.key) >= 0) player.starship.setState(player.starship.state.go, 1);

<<<<<<< HEAD
      if (stop.indexOf(e.key) >= 0) player.starship.setState(0, 0);
      if (shoot.indexOf(e.key) >= 0) {
        player.starship.fireLaser(moveLaser);
        const data = { starshipId: player.id };
        client.publish(`raichu/${room.id}/bullets`, data);
      }
||||||| 68ee2cf
        if (stop.indexOf(e.key) >= 0) player.starship.setState(0, 0)
        if (shoot.indexOf(e.key) >= 0){
        player.starship.fireLaser(moveLaser);
        let data = { starshipId : player.id}
        client.publish('raichu/'+room.id+'/bullets', data );
        } 
=======
        if (stop.indexOf(e.key) >= 0) player.starship.setState(0, 0)
        if (shoot.indexOf(e.key) >= 0){
        player.starship.fireLaser(player.id, moveLaser);
        let data = { starshipId : player.id}
        client.publish('raichu/'+room.id+'/bullets', data );
        } 
>>>>>>> 9c827fd8801104e6e38ba7a9a42820951f2104d5

      const data = {
        x: player.starship.x,
        y: player.starship.y,
        angle: player.starship.angle,
        starshipId: player.id,
      };

      client.publish(`raichu/${room.id}/positions`, data);
    }
  });

  document.body.addEventListener('keyup', (e) => {
    if (player.alive) {
      if (go.indexOf(e.key) >= 0) player.starship.setState(0, player.starship.state.direction);
      if (direction.indexOf(e.key) >= 0) player.starship.setState(player.starship.state.go, 0);
    }
  });
}
