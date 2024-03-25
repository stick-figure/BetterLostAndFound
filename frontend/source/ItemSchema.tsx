import Realm, { BSON } from 'realm';

function createEnum(arr: any[]) {
    arr.forEach((p, i) => arr[p] = i);
    return arr;
}
// Priority.High === 1
// Priority[Priority.High] === "High"
export const Priority = createEnum([
    "Severe",
    "High",
    "Medium",
    "Low",
])


export class Item extends Realm.Object<Item> {
    _id!: BSON.ObjectId;
    code!: number;
    isLost!: boolean;
    name!: string;
    description!: string;
    owner_id!: string;

    static schema: Realm.ObjectSchema = {
        name: 'Item',
        primaryKey: '_id',
        properties: {
            // This allows us to automatically generate a unique _id for each Item
            _id: { type: 'objectId', default: () => new BSON.ObjectId() },
            code: { type: 'int', default: () => Math.floor(Math.random() * 1000000) },
            // All todo items will default to found
            isLost: { type: 'bool', default: false },
            name: 'string',
            description: 'string',
            owner_id: 'string',
        },
    };
}
