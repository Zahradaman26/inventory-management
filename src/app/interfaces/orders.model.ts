import { SortColumn, SortDirection } from "../products/product-sortable.directive";
import { ProductItem } from "./product.model";
import { User } from "./user.model";
import { VenueModel } from "./venue.model";

export interface OrderModel {
    srNo : number;
    _id : string;
    orderNumber : string;
    user : User;
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
