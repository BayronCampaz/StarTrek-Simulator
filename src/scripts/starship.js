class Starship {
  constructor( el, x = 0, y = 0, angle = 0, imagePath) {
    
    this.el = el;
    this.imagePath = imagePath;
    this.setState();
    this.setAngle(angle);
    this.setPosition(x, y);
    this.setVisibility(true);
    this.points=0;
    this.life=5;
  }

  getShoot(){
    this.life = this.life - 1;
  }

  addPoints(){
    this.points += 20;
  }

  setState(go = 0, direction = 0) {
    this.state = { go, direction };
  }

  setAngle(angle) {
    this.angle = angle;
    this.el.style.transform = `rotate(${angle}deg)`;
  }

  detectLimit(posx,posy,radious){

    const galaxyDiv = document.getElementById("galaxy").offsetWidth;

    if(galaxyDiv===0)return false;
    if((posx)<0 || (posx+radious)>galaxyDiv ||
       (posy)<0 || (posy+radious)>400){
  
        return true;
    }
    else return false;
  }

  setPosition(x, y) {
    
    if(!this.detectLimit(x,y,50)) {
      this.x = x;
      this.y = y;
  
      this.el.style.left = `${x}px`;
      this.el.style.top = `${y}px`;
    }
   
    
  }

  setVisibility(visible) {
    this.el.style.visibility = visible ? "visible" : "hidden";
  }

  play() {
    this.timer = setInterval(()=> {
      const { go, direction } = this.state;  
      if (go === 0 && direction === 0) return;
      
      const angle = (this.angle + direction) % 360;
      const x = this.x + Math.sin(this.angle / 360.0 * 2 * Math.PI) * go;
      const y = this.y - Math.cos(this.angle / 360.0 * 2 * Math.PI) * go;
      
      this.setPosition(x, y);
      this.setAngle(angle);
    }, 30);
  }

  stop() {
    clearInterval(this.timer);
  }

  // eslint-disable-next-line no-unused-vars
  createLaserElement(angle) {
    let xPosition = parseInt(window.getComputedStyle(this.el).getPropertyValue("left"));
    let yPosition = parseInt(window.getComputedStyle(this.el).getPropertyValue("top"));

    let newLaser = document.createElement("img");
    newLaser.src = "assets/spaceship/laser.png";
    newLaser.classList.add("laser");
    newLaser.style.left = `${xPosition + 20}px`;
    newLaser.style.top = `${yPosition + 20}px`;

    return newLaser;
  }

  fireLaser(id, moveLaser) {
    const mainPlayArea = document.getElementById('galaxy')

    const { direction } = this.state;
    const angle = (this.angle + direction) % 360;
    const laser = this.createLaserElement(angle);
    var height = mainPlayArea.offsetHeight - 20;
    var width = mainPlayArea.offsetWidth - 20;
    mainPlayArea.appendChild(laser);

    moveLaser(id, laser, angle, width, height)
  }

//*********************** */

  static create( parent, imagePath, extraClass, x = 0, y = 0, angle = 0) {
    const img = document.createElement("img");
    img.className = `starship ${extraClass}`;
    img.src = imagePath;
    parent.appendChild(img);

    return new Starship( img, x, y, angle, imagePath);
  }
}