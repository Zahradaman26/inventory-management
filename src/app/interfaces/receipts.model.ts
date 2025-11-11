import { StackItem } from "quill/modules/history";
import { SortColumn, SortDirection } from "../products/product-sortable.directive";
import { ProductItem } from "./product.model";

interface mongoId {
    $oid: string;
}

export interface ReceiptsModel {
    srNo : number;
    _id : mongoId;
    receiptNumber : string;
    order : mongoId;
    user : mongoId;
    approvedBy : mongoId;
    products : ProductItem[];
    totalAmount : number;
    generatedAt : number;
    createdAt : number;
    updatedAt : number;
    __v : number;
}
