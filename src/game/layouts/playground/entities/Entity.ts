
import * as PIXI from 'pixi.js';
import {Game} from "../../../Game";

export class Entity extends PIXI.Container {

    public readonly animatedSprite: PIXI.AnimatedSprite;

    constructor(textures: PIXI.Texture[]) {
        super();
        this.animatedSprite = new PIXI.AnimatedSprite(textures);
        this.animatedSprite.pivot.set(this.animatedSprite.width / 2, this.animatedSprite.height);
        this.addChild(this.animatedSprite)
    }

    public addPosition = (
        x: number,
        y: number,
        force: boolean = false
    ) => {
        const candidatePosition = new PIXI.Point(this.position.x + x, this.position.y + y)

        const playGroundLayout = Game.instance.canvas.playGroundLayout;
        const currentRoomPosition = playGroundLayout.getCurrentRoomPositionCorrected();

        let isIn = playGroundLayout.getCurrentRoomBounds()
            .map((arrX, y) => arrX.map((tile, x) => {
                const tilePosition = new PIXI.Point(
                    currentRoomPosition.x + (x * 16),
                    currentRoomPosition.y + (y * 16)
                );
                return candidatePosition.x >= tilePosition.x
                    && candidatePosition.y >= tilePosition.y
                    && candidatePosition.x < tilePosition.x + 16
                    && candidatePosition.y < tilePosition.y + 16
                    && tile === 0;

            })).flat(2).find((tileBool: boolean) => tileBool);

        if(!isIn && !force) return;

        this.position.copyFrom(candidatePosition);
        this.zIndex += y;
        this.emit('position_changed', this.position);
    }
}