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
      if (up.indexOf(e.key) >= 0) player.starship.setState(5, player.starship.state.direction);
      if (down.indexOf(e.key) >= 0) player.starship.setState(-5, player.starship.state.direction);
      if (left.indexOf(e.key) >= 0) player.starship.setState(player.starship.state.go, -5);
      if (right.indexOf(e.key) >= 0) player.starship.setState(player.starship.state.go, 5 );

      if (stop.indexOf(e.key) >= 0) player.starship.setState(0, 0);
      if (shoot.indexOf(e.key) >= 0) {
        player.starship.fireLaser(player.id,moveLaser);
        const data = { starshipId: player.id };
        client.publish(`raichu/${room.id}/bullets`, data);
      }

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
