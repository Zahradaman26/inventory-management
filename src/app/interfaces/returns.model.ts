import { SortColumn, SortDirection } from "../products/product-sortable.directive";
import { ProductItem } from "./product.model";

interface mongoId {
    $oid: string;
}

export interface ReturnsModel {
    srNo : number;
    _id : mongoId;
    returnNumber : string;
    user : mongoId;
    order : mongoId;
    products : ProductItem[];
    status : string;
    reason : string;
    createdAt : number;
    updatedAt : number;
    __v : number;
    approvedAt : number;
    approvedBy : mongoId;
}
