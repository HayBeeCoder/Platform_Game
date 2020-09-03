import { Player, Lava, Coin } from "../actors/_actors.js";
import { trackKeys } from "../utilities/functions.js";
let simpleLevelPlan = `
......................
..#................#..
..#..............=.#..
..#.........o.o....#..
..#.@......#####...#..
..#####............#..
......#++++++++++++#..
......##############..
......................`;


const levelChars = {
    ".": "empty",
    "#": "wall",
    "+": "lava",
    "@": Player,
    "o": Coin,
    "=": Lava,
    "|": Lava,
    "v": Lava
};

const scale = 20;
const wobbleSpeed = 8,
    wobbleDist = 0.07;
const playerXSpeed = 7;
const gravity = 30;
const jumpSpeed = 17;
const arrowKeys = trackKeys(['ArrowUp', 'ArrowRight', 'ArrowLeft']);
export { scale, simpleLevelPlan, levelChars, wobbleDist, wobbleSpeed, gravity, playerXSpeed, jumpSpeed, arrowKeys }