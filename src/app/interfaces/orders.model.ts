import { SortColumn, SortDirection } from "../products/product-sortable.directive";
import { ProductItem } from "./product.model";
import { UserItem } from "./user.model";
import { VenueModel } from "./venue.model";

interface mongoId {
    $oid: string;
}

export interface OrderModel {
    srNo : number;
    _id : string;
    orderNumber : string;
    user : UserItem;
    products : ProductItem[];
    venue : VenueModel;
    status : string;
    reason? : string;
    createdAt : number;
    updatedAt : number;
    __v : number;
    approvedAt : number;
    approvedBy : mongoId;
}
