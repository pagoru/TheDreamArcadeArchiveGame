
import * as PIXI from 'pixi.js';
import {Game} from "../Game";
import {Player} from "./playground/entities/Player";
import {PlayerType} from "../types/PlayerType";
import {MapType} from "../types/MapType";

export class PlayGroundLayout extends PIXI.Container {

    private player1: Player;
    private player2: Player;

    private readonly map: MapType;
    private currentRoomPosition: PIXI.Point;

    private requestedAddedPosition: PIXI.Point;

    constructor() {
        super();
        this.map = require('../../assets/map.json');
        this.sortableChildren = true;
        this.currentRoomPosition = new PIXI.Point(0, 0);
    }

    public load = () => {
        this.loadMap();

        this.player1 = new Player('solo');
        this.player1.addPosition(20, 20, true);
        this.addChild(this.player1);

        Game.instance.canvas.on("loop", this.loop);
    }

    public loadPlayer2 = () => {
        if(this.player2 || !Game.instance.canvas.uiLayout.scoreInterface.canP2Spawn()) return;
        const pos = this.player1.position;
        const zombiefication = this.player1.getZombiefication();
        this.removeChild(this.player1);

        this.player1 = new Player('p1');
        this.player1.addZombiefication(zombiefication);
        this.player1.addPosition(pos.x, pos.y, true);

        this.player2 = new Player('p2');
        this.player2.addPosition(pos.x, pos.y, true);
        this.addChild(this.player1, this.player2);

        Game.instance.canvas.uiLayout.scoreInterface.removeSecondPlayerText();
    }

    public loop = () => {
        const requestChangeRoomPlayer1 = this.player1.getRequestChangeRoom();
        switch (this.player1.type) {
            case "solo":
                if(requestChangeRoomPlayer1)
                    this.loadRoom(requestChangeRoomPlayer1);
                break;
            case "p1":
                const requestChangeRoomPlayer2 = this.player2.getRequestChangeRoom();
                if(this.player1.isDead() && this.player2.isDead())
                    this.requestedAddedPosition = null;
                else if((requestChangeRoomPlayer1 || this.player1.isDead()) && (requestChangeRoomPlayer2 || this.player2.isDead()))
                    this.loadRoom(this.player1.isDead() ? requestChangeRoomPlayer2 : requestChangeRoomPlayer1);
                break;
        }
        if(this.requestedAddedPosition) {
            this.currentRoomPosition = new PIXI.Point(
                this.requestedAddedPosition.x + this.currentRoomPosition.x,
                this.requestedAddedPosition.y + this.currentRoomPosition.y
            );
            this.loadMap();
            Game.instance.canvas.camera.move(this.currentRoomPosition);
            this.requestedAddedPosition = null;
        }
    }

    private loadMap = () => {
        const roomPosition = this.getCurrentRoomPositionCorrected();
        // this.removeChild(...this.children.filter(c => c.name === 'tile'));
        this.getCurrentRoom().tiles.forEach((arrX, y) => {
            arrX.forEach((tile, x) => {
                if(tile === -1) return;
                const _tileBlock = new PIXI.Sprite(Game.instance.canvas.textures.getTexture(`tile_${tile}`));
                _tileBlock.name = 'tile'
                _tileBlock.position.set(roomPosition.x + x * 16, roomPosition.y + y * 16);
                _tileBlock.zIndex = _tileBlock.position.y - (tile === 0 ? 32 : 0) + 16;
                this.addChild(_tileBlock);
            });
        });
    }

    public loadRoom = (addPosition: PIXI.Point) => {
        if(this.requestedAddedPosition) return;

        const candidate = new PIXI.Point(
            addPosition.x + this.currentRoomPosition.x,
            addPosition.y + this.currentRoomPosition.y
        );
        const room = this.findRoom(candidate);
        if(room) {
            this.requestedAddedPosition = addPosition;
            if(!this.player1.isDead())
                this.player1.addPosition(addPosition.x * 2, addPosition.y * 2, true);
            if(this.player2 && !this.player2.isDead())
                this.player2.addPosition(addPosition.x * 2, addPosition.y * 2, true);
        }
    }

    public getCurrentRoomPositionCorrected = () => new PIXI.Point(
        this.currentRoomPosition.x * 9 * 16,
        this.currentRoomPosition.y * 6 * 16
    );
    public getCurrentRoomMaxPositionCorrected = () => {
        const current = this.getCurrentRoomPositionCorrected();
        return new PIXI.Point(current.x + (9 * 16), current.y + (6 * 16))
    }
    public getCurrentRoomPosition = () => this.currentRoomPosition;
    public getCurrentRoom = () => this.findRoom(this.currentRoomPosition);

    public findRoom = (position: PIXI.Point) => this.map
        .find(room => position.x === room.x && position.y === room.y);

    public getCurrentRoomBounds = () => this.getCurrentRoom().tiles
        .map(arrX => arrX.map(tile => tile === 0 ? 0 : 1));

    public killPlayer = (type: PlayerType) => {
        switch (type) {
            case "solo":
            case "p1":
                this.removeChild(this.player1);
                break;
            case "p2":
                this.removeChild(this.player2);
                break;
        }
    }

}