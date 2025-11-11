import { SortColumn, SortDirection } from "../products/product-sortable.directive";
import { ProductItem } from "./product.model";

interface mongoId {
    $oid: string;
}

export interface OrderModel {
    srNo : number;
    _id : mongoId;
    orderNumber : string;
    user : mongoId;
    products : ProductItem[];
    venue : mongoId;
    status : string;
    reason : string;
    createdAt : number;
    updatedAt : number;
    __v : number;
    approvedAt : number;
    approvedBy : mongoId;
}
