var canvas, ctx, bird, grav, speed;
var pipes = [];
var backgrounds = [];
var keys = {};
var colors = ['yellow', 'blue', 'red'];
var score = 0;
var gameState = 'start';
var resetReady = true;
var newHigh = false;
var settings = {
  gap: 25, //% of screen size
  gapRange: [15,70], // % (bottom background is 15%)
  gravity: .50,
  baseSpeed: 2.5,
  baseWidth: 100,
  baseSize: 40,
  baseJump: 8,
  baseFontSize: 50,
  baseScoreGap: 1,
  birdAnimation: .2,
  basePipeSpawn: 300,
}

function load() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  grav = settings.gravity;
  speed = settings.baseSpeed;
  resize();
  document.onkeyup = function(event) {
    if(event.keyCode == 32 && gameState === 'start') {
      start();
    }
  };
  canvas.onclick = function() {
    if(gameState === 'start') {
      start();
    }
  };
  new Background(0);
  window.requestAnimationFrame(draw);
}
function start() {
  bird = new Bird(colors[Math.floor(Math.random()*colors.length)]);
  document.onkeyup = "";
  canvas.onclick = "";
  window.addEventListener("keydown", function(event) {
    keys[event.keyCode] = true;
    if(event.keyCode === 32) {bird.jump();}
  });
  canvas.addEventListener("click", function() {bird.jump();});
  window.addEventListener("keyup", function(event) {
    delete keys[event.keyCode];
  });
  new Pipe();
  gameState = 'play';
  setInterval(function() {
    if(canvas.style.backgroundImage == 'url("res/background-night.png")') {
      canvas.style.backgroundImage = 'url("res/background-day.png")';
    }
    else {
      canvas.style.backgroundImage = 'url("res/background-night.png")';
    }
  }, 60000);
  bird.jump();
}
function resize() {
  canvas.height = window.innerHeight;
  canvas.width = document.body.offsetWidth;
  if(bird !== undefined) {
    bird.h = canvas.height/635*settings.baseSize;
    bird.w = bird.h * 1.4166666666666667;
  }
}
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(backgrounds.length > 0) {
    var lastB = backgrounds[backgrounds.length-1];
    if(lastB.x <= canvas.width - lastB.w) {
      new Background(lastB.x+lastB.w);
    }
  }
  else {
    new Background(0);
  }
  if(pipes.length > 0) {
    var lastP = pipes[pipes.length-1];
    if(lastP.x+lastP.w <= canvas.width - canvas.width/1366*settings.basePipeSpawn) {
      new Pipe();
    }
  }
  for(var i = 0;i < backgrounds.length;i++) {
    if(backgrounds[i].x <= -backgrounds[i].w) {
      backgrounds.splice(i,1);
      i--;
      continue;
    }
    backgrounds[i].draw();
  }
  if(gameState === 'start') {
    var i = img("message.png");
    i.height = canvas.height/100*85/1.5;
    i.width = i.height * (184/267);
    ctx.drawImage(i,canvas.width/2-i.width/2,canvas.height/100*85/2-i.height/2,i.width,i.height);
  }
  else if(gameState === 'play') {
    for(var i = 0;i < pipes.length;i++) {
      pipes[i].draw();
      if(pipes[i].x < -pipes[i].w) {
        pipes.splice(i,1);
        i--;
        continue;
      }
      if(pipes[i].x+pipes[i].w < bird.x-bird.w/2 && pipes[i].canScore) {
        pipes[i].canScore = false;
        score = parseInt(score) + 1;
        playSound("point.wav");
        if(score % 10 === 0) {
          speed *= 1.1;
        }
      }
      if(doesHit(bird.hitbox,pipes[i].r1) || doesHit(bird.hitbox,pipes[i].r2)) {
        playSound("hit.wav");
        playSound("die.wav");
        grav *= 2;
        speed = 0;
        bird.vel = 0;
        if(score > highScore) {
          newHigh = true;
          newScore(score);
        }
        else {
          newHigh = false;
        }
        gameState = 'gameover';
        if(keys[32]){resetReady = false;}
        window.onkeyup = function(event) {
          if(event.keyCode === 32) {afterDeath(event);}
        };
        canvas.onclick = function(event) {
          afterDeath(event);
        };
      }
    }
    displayText(score,canvas.width/2,canvas.height/100*5,settings.baseFontSize);
    bird.draw();
  }
  else if(gameState === 'gameover') {
    bird.draw();
    for(var i = 0;i < pipes.length; i++) {
      pipes[i].draw();
    }
    var i = img("gameover.png");
    i.height = canvas.height/100*15;
    i.width = i.height * (32/7);
    if(i.width > canvas.width/100*90) {
      i.width = canvas.width/100*90;
      i.height = i.width * (7/32);
    }
    ctx.drawImage(i,canvas.width/2-i.width/2,canvas.height/100*10,i.width,i.height);
    displayText(score,canvas.width/2,canvas.height/100*30,settings.baseFontSize*2);
    if(!newHigh) {
      displayText("Highest: "+highScore,canvas.width/2,canvas.height/100*30+canvas.height/635*settings.baseFontSize*1.75,settings.baseFontSize*.8);
    }
    else {
      displayText("New High Score", canvas.width/2,canvas.height/100*30+canvas.height/635*settings.baseFontSize*1.75,settings.baseFontSize*.8)
    }
    displayText("Press Space",canvas.width/2,canvas.height/100*30+canvas.height/635*settings.baseFontSize*1.5*1.8,settings.baseFontSize)
  }
  window.requestAnimationFrame(draw);
}
function afterDeath() {
  if(gameState == 'gameover' && resetReady) {
    bird = new Bird(colors[Math.floor(Math.random()*colors.length)]);
    pipes = [];
    grav = settings.gravity;
    speed = settings.baseSpeed;
    gameState = 'play';
    score = 0;
    new Pipe();
    bird.jump();
    window.onkeyup = "";
    canvas.onclick = "";
  }
  if(event.keyCode === 32 && gameState == 'gameover') {resetReady = true;}
}
function Bird(color) {
  this.x = canvas.width/100*15;
  this.y = canvas.height/2;
  this.h = canvas.height/635*settings.baseSize*(canvas.width/1366*settings.basePipeSpawn).map(0,300,.8,1);
  this.w = this.h * 1.4166666666666667;
  this.vel = 3;
  this.frames = [img(color+"bird-downflap.png"),img(color+"bird-midflap.png"),img(color+"bird-upflap.png")];
  this.frame = 0;
  this.angle = 5;
  this.hitbox = [];
  this.draw = function() {
    this.y += this.vel;
    if(this.angle >= 2) {this.angle = 2;}
    if(bird.y < 0) {
      bird.y = 0;
      bird.angle = 0;
      bird.vel = 0;
    }
    else if(bird.y >= canvas.height/100*85-bird.h/2 && gameState === 'play') {
      bird.y = canvas.height/100*85-bird.h/2;
      bird.angle = 0;
      bird.vel = 0;
    }
    else {
      this.angle = this.vel.map(-3,50,-.5,2);
      this.vel += canvas.height/635*grav;
    }
    this.hitbox = [
      {x: this.x-this.w/2,y: this.y}, 
      {x: this.x-this.w*3/8,y: this.y-this.h*3/8},
      {x: this.x-this.w*1/8,y: this.y-this.h/2},
      {x: this.x,y: this.y-this.h/2},
      {x: this.x+this.w/4,y:this.y-this.h/2},
      {x: this.x+this.w/2,y: this.y}, 
      {x: this.x+this.w/2,y:this.y+this.h/4},
      {x: this.x+this.w*7/16,y:this.y+this.h*3/8},
      {x: this.x,y: this.y+this.h/2},
      {x: this.x-this.w*3/8,y: this.y+this.h*7/16},
    ];
    for(var i in this.hitbox) {
      this.hitbox[i] = rotate(this.x,this.y,this.hitbox[i].x,this.hitbox[i].y,this.angle);
    }
    /* Draw Hitobox
    ctx.beginPath();
    for(var i in this.hitbox) {
      ctx.lineTo(this.hitbox[i].x,this.hitbox[i].y);
    }
    ctx.lineTo(this.hitbox[0].x,this.hitbox[0].y);
    ctx.stroke();
    */
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.drawImage(this.frames[Math.floor(this.frame)],-this.w/2,-this.h/2,this.w,this.h);
    ctx.restore();
    this.frame += settings.birdAnimation;
    if(this.frame >= this.frames.length) {this.frame = 0;}
  }
  this.jump = function() {
    if(gameState === 'play') {
      playSound("wing.wav");
      this.vel = -canvas.height/635*settings.baseJump;
    }
  }
}
function Background(x) {
  if(x === undefined) {x = canvas.width;}
  this.x = x;
  this.img = img("base.png");
  this.img.height = canvas.height/100*15;
  this.w = this.img.naturalWidth;
  this.h = this.img.naturalHeight;
  this.draw = function() {
    this.x -= canvas.width/1366*speed;
    ctx.drawImage(this.img,this.x,canvas.height/100*85,this.img.width,canvas.height/100*15);
  }
  backgrounds.push(this);
}
function Pipe() {
  this.x = canvas.width;
  this.w = canvas.width/1366*settings.baseWidth;
  this.gap = Math.random() * ((canvas.height/100*settings.gapRange[1]) - (canvas.height/100*settings.gapRange[0])) + (canvas.height/100*settings.gapRange[0]);
  this.r1 = null;
  this.r2 = null;
  this.pipetop = img("pipetop.png");
  this.pipe = img("pipe.png");
  this.canScore = true;
  this.draw = function() {
    this.x -= canvas.width/1366*speed;
    this.r1 = {x: this.x,y:0,w:this.w,h:this.gap-(canvas.height/100*settings.gap)/2};
    this.r2 = {x:this.x,y:this.gap+(canvas.height/100*settings.gap)/2,w:this.w,h:(canvas.height/100*85) - (this.gap+(canvas.height/100*settings.gap)/2)};
    var ph = this.w * (5/13);
    //Top Pipe
    ctx.drawImage(this.pipe,this.r1.x+this.w/100*5,this.r1.y,this.r1.w/100*90,this.r1.h-ph);
    ctx.save();
    ctx.translate(this.r1.x+this.w/2,this.r1.y+this.r1.h-ph/2);
    ctx.rotate(Math.PI);
    ctx.scale(-1,1);
    ctx.drawImage(this.pipetop,-this.w/2,-ph/2,this.w,ph);
    ctx.restore();
    //Bottom Pipe
    ctx.drawImage(this.pipe,this.r2.x+this.w/100*5,this.r2.y+ph,this.w/100*90,this.r2.h-ph);
    ctx.drawImage(this.pipetop,this.r2.x,this.r2.y,this.w,ph);
  };
  pipes.push(this);
}
function doesHit(hitbox,rect) {
  for(var i in hitbox) {
    if(hitbox[i].x > rect.x && hitbox[i].x < rect.x+rect.w && hitbox[i].y > rect.y && hitbox[i].y < rect.y+rect.h) {
      return true;
    }
  }
}
function img(src) {
  var a = new Image();
  a.src = "res/" + src;
  return a;
}
Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
function displayText(text,x,y,fs) {
  text = text.toString().replace(/0/g,'O');
  ctx.save();
  fs = canvas.height/635*fs;
  if(fs < 15) {fs = fs;}
  ctx.font = fs + "px Bird";
  ctx.fillStyle = "#543847";
  ctx.fillText(text, x-ctx.measureText(text).width/2-fs/15,y+fs/2);
  ctx.fillText(text, x-ctx.measureText(text).width/2+fs/15,y+fs/2);
  ctx.fillText(text, x-ctx.measureText(text).width/2,y+fs/2-fs/15);
  ctx.fillText(text, x-ctx.measureText(text).width/2,y+fs/2+fs/15);
  ctx.fillText(text, x-ctx.measureText(text).width/2+fs/15*1.5,y+fs/2+fs/15+1);
  ctx.fillStyle = "white";
  ctx.fillText(text, x-ctx.measureText(text).width/2,y+fs/2);
  ctx.restore();
}
function rotate(cx, cy, x, y, angle) {
  var cos = Math.cos(-angle),
  sin = Math.sin(-angle),
  nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
  ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
  return {x:nx,y:ny};
}
function playSound(src) {
  var snd = document.createElement("audio");
  snd.src = 'res/' + src;
  snd.autoplay = true;
  document.body.appendChild(snd);
  snd.onended = function() {
    document.body.removeChild(snd);
  }
}
function post(path, vars, callback, loader) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', path, true);
  if(loader !== undefined) {document.getElementById(loader).style.display = "block";}
  xhr.onreadystatechange = function() {
    if(xhr.readyState == 4 && xhr.status == 200) {
      if(callback !== null) {callback(xhr.responseText);}
      if(loader !== undefined) {document.getElementById(loader).style.display = "none";}
    }
  };
  if(vars instanceof FormData) {xhr.send(vars);}
  else {
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(encode(vars));
  }
}
function encode(obj) {
  var res = "";
  for(var i in obj) {
    if(typeof obj[i] == "boolean") {obj[i] = obj[i.toString()];}
    res += i + "=" + encodeURIComponent(obj[i]);
    if(Object.keys(obj).indexOf(i) !== Object.keys(obj).length-1) {res += "&"}
  }
  return res;
}
function newScore(s) {
  post('newScore.php', {score:s}, function(data) {
    highScore = s;
  });
}