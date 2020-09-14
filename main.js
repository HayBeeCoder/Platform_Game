import { runLevel } from "./utilities/functions.js";
import { levelChars } from "./variables/var.js";
import { Vec, DOMDisplay, CanvasDisplay } from "./utilities/classes.js";
import { gameLevelsPlan } from "./variables/var.js";
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
runGame(gameLevelsPlan, CanvasDisplay);