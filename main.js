import { overlap, runAnimation } from "./utilities/functions.js";
import { levelChars, arrowKeys } from "./variables/var.js";
import { Vec, DOMDisplay } from "./utilities/classes.js";
import { gameLevelsPlan } from "./variables/var.js";
// import { Lava, Player, Coin } from "./actors/_actors.js";
class Level {
    constructor(plan) {
        let rows = plan.trim().split("\n").map(l => [...l]);
        this.height = rows.length;
        this.width = rows[0].length;
        this.startActors = [];


        this.rows = rows.map((row, y) => {
            return row.map((ch, x) => {
                let type = levelChars[ch];
                if (typeof type == "string") return type;
                this.startActors.push(
                    type.create(new Vec(x, y), ch));
                return "empty";

            })
        })
    }
}

Level.prototype.touches = function(pos, size, type) {
    var xStart = Math.floor(pos.x);
    var xEnd = Math.ceil(pos.x + size.x);
    var yStart = Math.floor(pos.y);
    var yEnd = Math.ceil(pos.y + size.y);

    for (var y = yStart; y < yEnd; y++) {
        for (var x = xStart; x < xEnd; x++) {
            let isOutside = x < 0 || x >= this.width || y < 0 || y >= this.height;
            let here = isOutside ? "wall" : this.rows[y][x];
            if (here == type) return true;
        }
    }
    return false;
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

function runLevel(level, Display) {
    let display = new Display(document.body, level);

    let state = State.start(level);

    let ending = 1;
    return new Promise(resolve => {
        runAnimation(time => {
            state = state.update(time, arrowKeys);
            display.syncState(state);
            if (state.status == "playing") {
                return true;
            } else if (ending > 0) {
                ending -= time;
            } else {
                display.clear();
                resolve(state.status);
                return false;
            }
        })
    })
}


async function runGame(plans, Display) {
    let lives = 3;
    for (let level = 0; level < plans.length && lives > 0;) {
        console.log(`Level ${level + 1}, lives: ${lives}`);
        let status = await runLevel(new Level(plans[level]),
            Display);
        if (status == "won") level++;
        else lives--;
    }
    if (lives > 0) {
        console.log("You've won!");
    } else {
        console.log("Game over");
    }
}
runGame(gameLevelsPlan, DOMDisplay)
export { State }