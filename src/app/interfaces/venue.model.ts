import { SortColumn, SortDirection } from "../products/product-sortable.directive";

interface mongoId {
    $oid: string;
}

export interface VenueModel {
    srNo : number;
    _id : mongoId;
    address : string;
    contact : string;
    createdBy : mongoId;
    isActive : boolean;
    createdAt : number;
    updatedAt : number;
    userId : mongoId;
}
