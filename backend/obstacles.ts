import {FIELD_WIDTH} from "./game";

const obstacles = new Set<number>();

const encode = (x: number, y: number) => Math.round(x) * FIELD_WIDTH + Math.round(y);
const decode = (code: number) => ({x: code / FIELD_WIDTH, y: code % FIELD_WIDTH});

export default {
    init: function() {
        for (let i = 200; i < 400; i++){
            for (let j = 150; j < 250; j++){
                obstacles.add(encode(i, j));
            }
        }
    },
//    add: function(x:number, y:number) {
//        obstacles.add(obsHash(x,y));
//    },
    isOccupied: function(x:number, y:number): boolean {
        return obstacles.has(encode(x,y));
    },

    getData: function() {
        return Array.from(obstacles.values()).map(decode);
    }
}
