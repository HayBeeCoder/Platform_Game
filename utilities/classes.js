import { elt, drawGrid, drawActors, overlap, flipHorizontally } from './functions.js';
import { scale, otherSprites, playerSprites, playerXOverlap } from "../variables/var.js";

class Vec {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    plus(other) {
        return new Vec(this.x + other.x, this.y + other.y);
    }
    times(factor) {
        return new Vec(this.x * factor, this.y * factor);
    }
}


class State {
    constructor(level, actors, status) {
        this.level = level;
        this.actors = actors;
        this.status = status;
    }

    static start(level) {
        return new State(level, level.startActors, "playing");
    }

    get player() {
        return this.actors.find(a => a.type == "player")
    }
    get monster() {
        return this.actors.find(a => a.type == "monster");
    }
}

State.prototype.update = function(time, keys) {

    let actors = this.actors.map(actor => actor.update(time, this, keys));
    let newState = new State(this.level, actors, this.status);

    let player = newState.player;
    if (newState.status != "playing") return newState;
    if (this.level.touches(player.pos, player.size, "lava")) {
        return new State(this.level, actors, "lost");
    }
    for (let actor of actors) {
        if (actor != player && overlap(actor, player)) {
            newState = actor.collide(newState);
        }
    }
    return newState;
}

class DOMDisplay {
    constructor(parent, level) {
        this.dom = elt("div", { class: "game" }, drawGrid(level));
        this.actorLayer = null;
        parent.appendChild(this.dom)
    }

    clear() { this.dom.remove() }
}

DOMDisplay.prototype.syncState = function(state) {
    if (this.actorLayer) this.actorLayer.remove();
    this.actorLayer = drawActors(state.actors);

    this.dom.appendChild(this.actorLayer);
    this.dom.className = `game ${state.status}`;
    this.scrollPlayerIntoView(state);
}

DOMDisplay.prototype.scrollPlayerIntoView = function(state) {
    let width = this.dom.clientWidth;
    let height = this.dom.clientHeight;
    let margin = width / 3;
    // The viewport
    let left = this.dom.scrollLeft,
        right = left + width;

    let top = this.dom.scrollTop,
        bottom = top + height;
    let player = state.player;
    let center = player.pos.plus(player.size.times(0.5))
        .times(scale);
    if (center.x < left + margin) {
        this.dom.scrollLeft = center.x - margin;
    } else if (center.x > right - margin) {
        this.dom.scrollLeft = center.x + margin - width;
    }
    if (center.y < top + margin) {
        this.dom.scrollTop = center.y - margin;
    } else if (center.y > bottom - margin) {
        this.dom.scrollTop = center.y + margin - height;
    }
};

class CanvasDisplay {
    constructor(parent, level) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = Math.min(600, level.width * scale);
        this.canvas.height = Math.min(400, level.height * scale);
        parent.appendChild(this.canvas);
        this.cx = this.canvas.getContext("2d");
        this.flipPlayer = false;
        this.viewport = {
            left: 0,
            top: 0,
            width: this.canvas.width / scale,
            height: this.canvas.height / scale
        }
    }
    clear() {
        this.canvas.remove();
    }
}
CanvasDisplay.prototype.syncState = function(state) {
    this.updateViewport(state);
    this.clearDisplay(state.status);
    this.drawBackground(state.level);
    this.drawActors(state.actors);
}

CanvasDisplay.prototype.updateViewport = function(state) {
    let view = this.viewport,
        margin = view.width / 4;
    let player = state.player,
        center = player.pos.plus(player.size.times(0.5));

    if (center.x < view.left + margin) {
        view.left = Math.max(0, center.x - margin);
    } else if (center.x > view.left + view.width - margin) {
        view.left = Math.min(state.level.width - view.width, center.x + margin - view.width)
    }
    if (center.y < view.top + margin) {
        view.top = Math.max(0, center.y - margin)
    } else if (center.y > view.top + view.width - center.y) {
        view.top = Math.min(state.level.height - view.height, center.y + margin - view.height);
    }
}
CanvasDisplay.prototype.clearDisplay = function(state) {
    if (state.status == "win") {
        this.cx.fillStyle = "rgb(68, 191, 255)";
    } else if (state.status == "lost") {
        this.cx.fillStyle = "rgb(44, 136, 214)"
    } else {
        this.cx.fillStyle = "rgb(52,166,251)";
    }
    this.cx.fillRect(0, 0, this.canvas.width, this.canvas.height);
}

CanvasDisplay.prototype.drawBackground = function(level) {
    let { left, top, width, height } = this.viewport;

    let xStart = Math.floor(left);
    let xEnd = Math.ceil(left + width);
    let yStart = Math.floor(top);
    let yEnd = Math.ceil(top + height);

    for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
            let tile = level.rows[y][x];
            if (tile == "empty") continue;
            let screenX = (x - left) * scale;
            let screenY = (y - top) * scale;
            let tileX = tile == "lava" ? scale : 0;
            this.cx.drawImage(otherSprites, tileX, 0, scale, scale, screenX, screenY, scale, scale)
        }
    }
}

CanvasDisplay.prototype.drawPlayer = function(player, x, y, width, height) {
    width += playerXOverlap * 2;
    x -= playerXOverlap;
    if (player.speed.x != 0) {
        this.flipPlayer = player.speed.x < 0;
    }

    let tile = 8;
    if (player.speed.y != 0) {
        tile = 9;
    } else if (player.speed.x != 0) {
        tile = Math.floor(Date.now() / 60) % 8;
    }

    this.cx.save();
    if (this.flipPlayer) {
        flipHorizontally(this.cx, x + width / 2)
    }

    let tileX = tile * width;
    this.cx.drawImage(playerSprites, tileX, 0, width, height, x, y, width, height);
    this.cx.restore();

}

CanvasDisplay.prototype.drawActors = function(actors) {
    for (let actor of actors) {
        let width = actor.size.x * scale;
        let height = actor.size.y * scale;
        let x = (actor.pos.x - this.viewport.left) * scale;
        let y = (actor.pos.y - this.viewport.top) * scale;

        if (actor.type == 'player') {
            this.drawPlayer(actor, x, y, width, height)
        } else {

            let tileX = (actor.type == 'coin' ? 2 : 1) * scale;
            let widthSprite = (actor.type == 'coin') ? 12 : scale;
            this.cx.drawImage(otherSprites, tileX, 0, widthSprite, height, x, y, width, height)
        }
    }
}


export { Vec, DOMDisplay, State, CanvasDisplay }