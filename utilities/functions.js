import { scale } from "../variables/var.js"
import { State } from "../utilities/classes.js";

function elt(name, attrs, ...children) {
    let dom = document.createElement(name);
    for (let attr of Object.keys(attrs)) {
        dom.setAttribute(attr, attrs[attr]);
    }

    for (let child of children) {
        dom.appendChild(child);
    }

    return dom;
}

function drawGrid(level) {
    return elt("table", {
            class: "background",
            style: `width: ${level.width * scale}px`
        },
        ...level.rows.map(row =>
            elt("tr", {
                    style: `height: ${scale}px`
                },
                ...row.map(type => elt("td", {
                    class: type
                })))));
}

function drawActors(actors) {
    return elt("div", {}, ...actors.map(actor => {
        let rect = elt("div", { class: `actor ${actor.type}` });
        rect.style.width = `${actor.size .x* scale}px`;
        rect.style.height = `${actor.size.y * scale}px`;
        rect.style.left = `${actor.pos.x * scale}px`;
        rect.style.top = `${actor.pos.y * scale}px`;
        return rect;
    }))
}

function overlap(actor1, actor2) {
    return actor1.pos.x + actor1.size.x > actor2.pos.x &&
        actor1.pos.x < actor2.pos.x + actor2.size.x &&
        actor1.pos.y + actor1.size.y > actor2.pos.y &&
        actor1.pos.y < actor2.pos.y + actor2.size.y;
}

function trackKeys(keys) {
    let pressed = Object.create(null);

    function track(event) {
        if (keys.includes(event.key)) {
            pressed[event.key] = event.type == 'keydown';
            event.preventDefault();
        }
    }
    window.addEventListener("keydown", track);
    window.addEventListener("keyup", track);
    pressed.unregister = () => {
        window.removeEventListener("keydown", track);
        window.removeEventListener("keyup", track);
    }
    return pressed;
}

function runAnimation(frameFunc) {
    let lastTime = null;

    function frame(time) {
        if (lastTime != null) {
            let timeStep = Math.min(time - lastTime, 100) / 1000;
            if (frameFunc(timeStep) === "false") return;
        }
        lastTime = time;
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}


function runLevel(level, Display) {
    let display = new Display(document.body, level);
    let state = State.start(level);
    let running = 'yes';
    let ending = 1;

    return new Promise(resolve => {

        function escHandler(event) {
            if (event.key != 'Escape') return;
            event.preventDefault();
            if (running == "no") {
                running = 'yes';
                runAnimation(frame);
            } else if (running == 'yes') {
                running = 'pausing'
            } else {
                running = 'yes';
            }
        }
        window.addEventListener("keydown", escHandler);
        let arrowKeys = trackKeys(['ArrowUp', 'ArrowRight', 'ArrowLeft']);

        function frame(time) {
            if (running == 'pausing') {
                running == 'no';
                return false;
            }
            state = state.update(time, arrowKeys);
            display.syncState(state);
            if (state.status == "playing") {
                return true;
            } else if (ending > 0) {
                ending -= time;
            } else {
                arrowKeys.unregister();
                display.clear();
                window.removeEventListener("keydown", escHandler);

                resolve(state.status);
                return false;
            }
        }
        runAnimation(frame);
    });

}

export { elt, overlap, drawGrid, drawActors, trackKeys, runAnimation, runLevel }