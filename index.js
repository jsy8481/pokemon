const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");

canvas.width = 1024;
canvas.height = 576;

const collisionMap = [];
for (let i = 0; i < collisions.length; i += 70) {
    collisionMap.push(collisions.slice(i, 70 + i));
}

const backgroundOffset = {
    x: -720,
    y: -610,
}

class Boundary {
    static width = 48;
    static height = 48;

    constructor({position}) {
        this.position = position;
        this.width = 48;
        this.height = 48;
    }

    draw() {
        context.fillStyle = "red";
        context.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
}

const boundaries = [];
const BOUNDARY_CODE = 1025;
collisionMap.forEach((row, rowNo) => {

    row.forEach((symbol, colNo) => {
        if (symbol === BOUNDARY_CODE) {
            boundaries.push(new Boundary({
                position: {
                    x: colNo * Boundary.width + backgroundOffset.x,
                    y: rowNo * Boundary.height + backgroundOffset.y,
                }
            }))
        }
    })
})

class Sprite {
    constructor({position, velocity, image, frames = {max: 1, current: 1, elapsedTime}}) {
        this.position = position;
        this.velocity = velocity;
        this.image = image;
        this.image.onload = () => {
            this.width = this.image.width / this.frames.max;
            this.height = this.image.height;
        }
        this.frames = frames;
    }

    draw() {
        this.frames.current = (this.frames.current + 1) % this.frames.max;

        context.drawImage(
            this.image,
            this.width * this.frames.current, // sx - source 내에서 보여주기 시작할 좌표
            0, // sy - source 내에서 보여주기 시작할 좌표
            this.width,
            this.image.height,
            this.position.x,
            this.position.y,
            this.width,
            this.height,
        );
    }
}

class DefaultImage {
    constructor({position, image}) {
        this.position = position;
        this.image = image;
    }
    draw() {
        context.fillStyle = "red";
        context.drawImage(this.image, this.position.x, this.position.y);
    }
}

const playerImage = new Image();
playerImage.src = "./gameAssets/playerDown.png";

const player = new Sprite({
    position: {
        x: canvas.width / 2 - (playerImage.width / 4) / 2,
        y: canvas.height / 2 - playerImage.height / 2,
    },
    image: playerImage,
    velocity: 10,
    frames: {
        max: 4,
        current: 1,
    }
})

const backgroundImageSource = new Image()
backgroundImageSource.src = "./gameAssets/Pellet Town.png";
const background = new DefaultImage({
    position: {
        x: backgroundOffset.x,
        y: backgroundOffset.y,
    },
    image: backgroundImageSource,
})

class KeyBoard {
    constructor() {
        // w (위) a (왼쪽) s (아래) d (오른쪽)
        this.moveKeys = ["w", "a", "s", "d"];
        this.lastKeys = [];
    }
    get lastMoveKey() {
        return this.lastKeys[this.lastKeys.length - 1];
    }
    checkIsMoveKey(targetKey) {
        return this.moveKeys.find((moveKey) => moveKey === targetKey);
    }
    findKeyInLastKeys(key) {
        return this.lastKeys.find((lastKey) => lastKey === key);
    }
    removeKeyInLastKeys(targetKey) {
        const targetKeyIndex = this.lastKeys.findIndex((lastKey) => lastKey === targetKey);
        if (targetKeyIndex === -1) {
            return;
        }
        this.lastKeys.splice(targetKeyIndex, 1);
    }
    addMoveKeyInLastKeys(targetKey) {
        if (isCollision) return;
        if (!this.checkIsMoveKey(targetKey)) {
            return;
        }
        if (this.findKeyInLastKeys(targetKey)) {
            return;
        }
        this.lastKeys.push(targetKey);
    }
    detectMove() {
        window.addEventListener("keydown", (e) => {
            this.addMoveKeyInLastKeys(e.key);
        });
        window.addEventListener("keyup", (e) => {
            this.removeKeyInLastKeys(e.key);
        });
    }
    stopDetectMove() {
        window.removeEventListener("keydown", (e) => {
            this.addMoveKeyInLastKeys(e.key);
        });
    }
}

// 유저 움직임
const keyboard = new KeyBoard();
keyboard.detectMove();

function checkRectangularCollision({rectangle1, rectangle2}) {
        return rectangle1.position.x + rectangle1.width > rectangle2.position.x  &&
        rectangle1.position.x < rectangle2.position.x + rectangle2.width &&
        rectangle1.position.y + rectangle1.height > rectangle2.position.y &&
        rectangle1.position.y < rectangle2.position.y + rectangle2.height
}

function moveMovableUseKeyBoard(velocity, moveKey) {
    if (moveKey === "w") {
        movables.forEach((movable) => {
            movable.position.y += velocity ;
        })
    } else if (moveKey === "s") {
        movables.forEach((movable) => {
            movable.position.y -= velocity;
        })
    } else if (moveKey === "a") {
        movables.forEach((movable) => {
            movable.position.x += velocity;
        })
    } else if (moveKey === "d") {
        movables.forEach((movable) => {
            movable.position.x -= velocity;
        })
    }
}
// 충돌 감지
// 충돌 상태일 때 다른 키가 입력되서 반대로 가는 경우가 생김
// 충돌이 되면 키입력을 막고, 일단 온 방향의 반대로 보내주고 싶음
const movables = [background, ...boundaries];
let isCollision = false;
let collsionLastKey = null;

function animate() {
    window.requestAnimationFrame(animate);
    background.draw();
    boundaries.forEach((boundary) => {
        boundary.draw();
    })
    player.draw();

    let collisionInfo;

    isCollision = false;
    for (let i = 0; i < boundaries.length; i++) {
        collisionInfo = checkRectangularCollision({rectangle1: boundaries[i], rectangle2: player})
        if (collisionInfo) {
            isCollision = true;
            collsionLastKey = collsionLastKey ?? keyboard.lastMoveKey;
            break;
        }
    }
    if (!isCollision) {
        collsionLastKey = null;
    }
    console.log(collisionInfo, collsionLastKey);
    if (collisionInfo) {
        moveMovableUseKeyBoard(-player.velocity, collsionLastKey);
    } else {
        moveMovableUseKeyBoard(player.velocity, keyboard.lastMoveKey);
    }
}
animate()

