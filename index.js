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
    // 이미지 크기가 조금 더 큰가본데..?
    constructor({position, velocity, image, frames = {max: 1, current: 1,}}) {
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
        console.log(this.width, this.height, this.image.src);

        context.drawImage(
            this.image,
            this.width * this.frames.current, // sx - source 내에서 보여주기 시작할 좌표
            0, // sy - source 내에서 보여주기 시작할 좌표
            this.width,
            this.height,
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
    velocity: 3,
    frames: {
        max: 4,
        current: 1,
    }
})

const backgroundImageSource = new Image()
backgroundImageSource.src = "./gameAssets/Pellet Town.png";
const background = new Sprite({
    position: {
        x: backgroundOffset.x,
        y: backgroundOffset.y,
    },
    image: backgroundImageSource,
})

const foreGroundImage = new Image()
foreGroundImage.src = "./gameAssets/foregroundObjects.png";
const foreGround = new Sprite({
    position: {
        x: backgroundOffset.x,
        y: backgroundOffset.y,
    },
    image: foreGroundImage,
})

class KeyBoard {
    constructor() {
        // w (위) a (왼쪽) s (아래) d (오른쪽)
        this.moveKeys = ["w", "a", "s", "d"];
        this.lastKeys = [];
        this.savedLastKey = ""; // 충돌 감지가 되던 중 리스트에서 제거되는 경우가 발생 / 리스트에 없더라도 가장 마지막에 눌렸었던 키를 반환함
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
        if (!this.checkIsMoveKey(targetKey)) {
            return;
        }
        this.savedLastKey = targetKey;
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

class MovableManager {
    constructor({movables}) {
        this.movables = movables;
        this.moveKeys = ["w", "s", "a", "d"];
        this.lastMoveInfo = {velocity: 0, moveKey: ""};
    }
    move({velocity, moveKey}) {
        if (!this.moveKeys.find((curMoveKey) => curMoveKey === moveKey)) return;

        if (moveKey === "w") {
            this.movables.forEach((movable) => {
                movable.position.y += velocity ;
            })
        } else if (moveKey === "s") {
            this.movables.forEach((movable) => {
                movable.position.y -= velocity;
            })
        } else if (moveKey === "a") {
            this.movables.forEach((movable) => {
                movable.position.x += velocity;
            })
        } else if (moveKey === "d") {
            this.movables.forEach((movable) => {
                movable.position.x -= velocity;
            })
        }
        this.lastMoveInfo = {velocity, moveKey};
    }
    reset() {
        this.move({moveKey: this.lastMoveInfo.moveKey, velocity: -this.lastMoveInfo.velocity})
    }
}
const movables = [background, foreGround, ...boundaries];
const movableManager = new MovableManager({movables})

class BoundariesManager {
    constructor({boundaries}) {
        this.boundaries = boundaries;
    }
    checkCollision({player}) {
        for (let i = 0; i < this.boundaries.length; i++) {
            checkRectangularCollision({rectangle1: boundaries[i], rectangle2: player})
            if (checkRectangularCollision({rectangle1: boundaries[i], rectangle2: player})) {
                return true;
            }
        }
    }
    drawBoundaries() {
        this.boundaries.forEach((boundary) => {
            boundary.draw();
        })
    }
}
const boundariesManager = new BoundariesManager({boundaries})
const playerPreviousPosition = 0;
function animate() {
    window.requestAnimationFrame(animate);
    background.draw();
    boundariesManager.drawBoundaries();
    boundaries.forEach((boundary) => {
        boundary.draw();
    })
    player.draw();
    foreGround.draw();

    movableManager.move({velocity: player.velocity, moveKey: keyboard.lastMoveKey});
    if (boundariesManager.checkCollision({player})) {
        movableManager.reset();
    }
}
animate()

