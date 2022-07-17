import { FIELD_HEIGHT, FIELD_WIDTH } from "./game";
import Obstacles from "./obstacles";

const TANK_WIDTH = 20;
const BULLET_WIDTH = 3;
const HIT_DISTANCE = square(BULLET_WIDTH/2 + TANK_WIDTH/2);

export const MOVE_UP = 0;
export const MOVE_DOWN = 1; 
export const MOVE_LEFT = 2; 
export const MOVE_RIGHT = 3;
export const SHOOT = 4;
export const STOP = 8;  // flag

interface IEntityLocation {
    x: number;
    y: number;
    angle: number;
}

class EntityLocation implements IEntityLocation {
    x: number;
    y: number;
    angle: number;
    constructor(_: IEntityLocation) {
        this.x = _.x;
        this.y = _.y;
        this.angle = _.angle;
    }

    getData() {
        return { x: this.x, y: this.y, angle: this.angle }
    }

    forward(speed: number, maxX: number, maxY: number) {
        this.x = Math.max(0, Math.min(maxX, this.x + speed * Math.cos(this.angle)));
        this.y = Math.max(0, Math.min(maxY, this.y + speed * Math.sin(this.angle)));
    }

    isAtEdge(maxX: number, maxY: number) {
        return this.x <= 0 || this.x >= maxX || this.y <= 0 || this.y >= maxY;
    }
}

function square(x: number): number {
    return x*x;
}
function distanceSquare(a: EntityLocation, aw: number, b: EntityLocation, bw: number): number {
    return square(a.x + aw/2 - (b.x + bw/2)) + square(a.y + aw/2 - (b.y + bw/2));
}

class MovingEntity {
    loc: EntityLocation;
    speed: number;
    angleSpeed: number;
    constructor(_startLoc: IEntityLocation, _color: string) {
        this.loc = new EntityLocation(_startLoc);
        this.speed = 0;
        this.angleSpeed = 0;
    }

    update() {
        this.loc.forward(this.speed, FIELD_WIDTH, FIELD_HEIGHT);
    }
}

const entityList: MovingEntity[] = [];

class Bullet extends MovingEntity {    
}

class Player extends MovingEntity {
    startLoc: EntityLocation;
    bullet: Bullet|null;
    loadTime: number;
    respawnTime: number;
    alive: boolean;
    color: string;
    score: number;
    isLoaded(): boolean {
        return this.loadTime == 0;
    }
    constructor(_startLoc: IEntityLocation, _color: string) {
        super(_startLoc, _color);
        this.startLoc = new EntityLocation(this.loc);
        this.bullet = null;
        this.alive = true;
        this.color = _color;
        this.score = 0;
    }
    getData(): any {
        return { 
            loc: this.loc.getData(),
            bullet: this.bullet ? { loc: this.bullet.loc.getData() } : null,
            loaded: this.isLoaded(),
            alive: this.alive,
            color: this.color,
            score: this.score
        }
    }
    shoot() {
        if (!this.isLoaded())
            return;
        this.bullet = new Bullet(this.loc, this.color[0]+"Bullet");
        entityList.push(this.bullet);
        this.loadTime = Date.now() + 3000;
    }

    startMoving(dir: number) {
        switch (dir) {
            case MOVE_UP:       this.speed = 1.5;
                                break;
            case MOVE_DOWN:     this.speed = -1.5;
                                break;
            case MOVE_LEFT:     this.angleSpeed = Math.PI/100;
                                break;
            case MOVE_RIGHT:    this.angleSpeed = -Math.PI/100;
                                break;
        }
    }

    stopMoving(dir: number) {
        switch (dir) {
            case MOVE_UP:
            case MOVE_DOWN:     this.speed = 0;
                                break;
            case MOVE_LEFT:
            case MOVE_RIGHT:    this.angleSpeed = 0;
                                break;
        }
    }

    // restart??

    update() {
        const NOW = Date.now();
        if (!this.alive) {
            if (NOW < this.respawnTime)
                return;
            this.respawnTime = 0;
            this.alive = true;
            this.loc = new EntityLocation(this.startLoc);
            this.speed = 0;
            this.angleSpeed = 0;
        }
        this.loc.angle += this.angleSpeed;
        this.loc.forward(this.speed, FIELD_WIDTH - TANK_WIDTH, FIELD_HEIGHT - TANK_WIDTH);

        if (Obstacles.isOccupied(this.loc.x, this.loc.y))   // revert
            this.loc.forward(-this.speed, FIELD_WIDTH - TANK_WIDTH, FIELD_HEIGHT - TANK_WIDTH);

        if (NOW > this.loadTime)
            this.loadTime = 0;
    }
} 

const playerConfigs = [
    { loc: {x:50,   y:20,   angle:0},       color: "green" },
    { loc: {x:700,  y:300,  angle:Math.PI}, color: "blue" },
    { loc: {x:700,  y:70,   angle:Math.PI}, color: "red" },
    { loc: {x:50,   y:250,  angle:0},       color: "yellow"}
];

const players: Player[] = [];

export default {
    checkBulletHits: function() {
        for (const p of players) {
            const b = p.bullet;
            if (!b)
                continue;
            for (const p2 of players) {
                const dd = distanceSquare(b.loc, BULLET_WIDTH, p2.loc, TANK_WIDTH);
                if (dd < HIT_DISTANCE) {
                    p2.alive = false;
                    p2.respawnTime = Date.now() + 3000;
                    p.score++;
                    p.bullet = null;
                    // TODO mines!
                    /* {   var left = Math.round((700 - parseFloat(b[j].style.width) / 2) * Math.random());
                            var top = Math.round((300 - parseFloat(b[j].style.height) / 2) * Math.random());
                        }while(obstacles[left][top]);*/
                    break;
                }
            }
        }
    },

    updateEntities: function() {
        for (const p of players) {
            p.update();
            if (p.bullet) {
                p.bullet.update();
                if (p.bullet.loc.isAtEdge(FIELD_WIDTH, FIELD_HEIGHT) || Obstacles.isOccupied(p.bullet.loc.x, p.bullet.loc.y))
                    p.bullet = null;
            }
        }
    },

    newPlayer: function(): number {
        if (players.length >= playerConfigs.length)
            return -1;
        const cfg = playerConfigs[players.length];
        players.push(new Player(cfg.loc, cfg.color));
        return players.length;
    },

    userInput: function(i: number, cmd: number) {
        if (cmd == SHOOT)
            players[i].shoot();
        else if (cmd & STOP)
            players[i].stopMoving(cmd % STOP);
        else
            players[i].startMoving(cmd);
    },

    serialize: function() {
        return JSON.stringify(players.map(p => p.getData()))
    }
}
